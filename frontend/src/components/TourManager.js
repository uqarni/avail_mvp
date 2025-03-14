import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getTourStep, shouldAdvanceOnNavigation } from '../services/TourService';
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
  const [targetElement, setTargetElement] = useState(null);
  const [targetRect, setTargetRect] = useState(null);
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [stepConfig, setStepConfig] = useState(null);
  const cleanupRef = useRef(null);
  const hasAddedMessageRef = useRef(false);
  const navigationProcessedRef = useRef(false);
  const spotlightPadding = 15;

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

  const findElements = useCallback(() => {
    if (!stepConfig) return false;

    const element = document.querySelector(stepConfig.selector);

    if (element) {
      setTargetElement(element);
      setTargetRect(element.getBoundingClientRect());

      element.classList.add('spotlight-target');

      setShowSpotlight(true);

      if (stepConfig.nextStepOnClick) {
        const handleClick = () => {
          if (stepConfig.navigateTo) {
            navigate(stepConfig.navigateTo);
          }

          if (onStepChange) {
            onStepChange(step + 1);
          }
        };

        element.addEventListener('click', handleClick);

        cleanupRef.current = () => {
          element.classList.remove('spotlight-target');
          element.removeEventListener('click', handleClick);
        };
      } else {
        cleanupRef.current = () => {
          element.classList.remove('spotlight-target');
        };
      }

      if (stepConfig.message && onAddMessage && !hasAddedMessageRef.current) {
        onAddMessage(stepConfig.message);
        hasAddedMessageRef.current = true;
      }

      return true;
    }

    return false;
  }, [stepConfig, onStepChange, step, onAddMessage, navigate]);

  useEffect(() => {
    if (!tourType || step === 0) {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      setShowSpotlight(false);
      setTargetElement(null);
      setTargetRect(null);
      setStepConfig(null);
      hasAddedMessageRef.current = false;
      return;
    }

    hasAddedMessageRef.current = false;

    const config = getTourStep(tourType, step);
    setStepConfig(config);

    if (config && location.pathname === config.route) {
      const findElementInterval = setInterval(() => {
        if (findElements()) {
          clearInterval(findElementInterval);
        }
      }, 200);

      return () => {
        clearInterval(findElementInterval);
        if (cleanupRef.current) {
          cleanupRef.current();
        }
      };
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [tourType, step, location.pathname, findElements]);

  if (!targetElement || !targetRect || !stepConfig || !showSpotlight) {
    return null;
  }

  return (
    <div className="tour-spotlight-overlay">
      <div
        className="tour-spotlight-cutout"
        style={{
          left: `${targetRect.left - spotlightPadding}px`,
          top: `${targetRect.top - spotlightPadding}px`,
          width: `${targetRect.width + (spotlightPadding * 2)}px`,
          height: `${targetRect.height + (spotlightPadding * 2)}px`,
        }}
      />
    </div>
  );
};

export default TourManager;