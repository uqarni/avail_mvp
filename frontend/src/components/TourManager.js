import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Joyride, { STATUS } from 'react-joyride';
import { getTourStep, shouldAdvanceOnNavigation, convertToJoyrideSteps } from '../services/TourService';
import './TourManager.css';

const TourManager = ({
  tourType,
  step,
  onStepChange,
  onTourComplete,
  onAddMessage
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [joyrideSteps, setJoyrideSteps] = useState([]);
  const [runTour, setRunTour] = useState(false);
  const messageAddedRef = useRef(false);
  const navigationProcessedRef = useRef(false);

  useEffect(() => {
    if (!tourType || step === 0) return;

    if (!navigationProcessedRef.current) {
      const nextStep = shouldAdvanceOnNavigation(tourType, step, location.pathname);
      if (nextStep) {
        onStepChange(nextStep);
        navigationProcessedRef.current = true;
      }
    }

    return () => {
      navigationProcessedRef.current = false;
    };
  }, [tourType, step, location.pathname, onStepChange]);

  useEffect(() => {
    if (!tourType || step === 0) {
      setRunTour(false);
      setJoyrideSteps([]);
      messageAddedRef.current = false;
      return;
    }

    const stepConfig = getTourStep(tourType, step);

    if (stepConfig && location.pathname === stepConfig.route) {
      const steps = convertToJoyrideSteps(tourType, step);

      if (steps.length > 0) {
        setJoyrideSteps(steps);

        setTimeout(() => {
          setRunTour(true);

          if (stepConfig.message && onAddMessage && !messageAddedRef.current) {
            onAddMessage(stepConfig.message);
            messageAddedRef.current = true;
          }
        }, 300);
      }
    } else {
      setRunTour(false);
    }

    return () => {
      messageAddedRef.current = false;
    };
  }, [tourType, step, location.pathname, onAddMessage]);

  const handleJoyrideCallback = (data) => {
    const { status, action, type } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false);

      const currentStepConfig = getTourStep(tourType, step);

      if (currentStepConfig) {
        if (type === 'step:after' && action !== 'skip') {
          if (currentStepConfig.navigateTo) {
            navigate(currentStepConfig.navigateTo);
          }

          if (currentStepConfig.nextStepOnClick) {
            onStepChange(step + 1);
          }
        } else if (action === 'skip') {
          onTourComplete();
        }
      }
    }
  };

  if (!tourType || step === 0 || joyrideSteps.length === 0) {
    return null;
  }

  return (
    <Joyride
      steps={joyrideSteps}
      run={runTour}
      continuous={false}
      showSkipButton={true}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#0a2f5e',
          zIndex: 10000,
        }
      }}
    />
  );
};

export default TourManager;