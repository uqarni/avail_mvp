import React, { useEffect, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getTourHighlight } from '../services/TourService';
import SpotlightHighlight from './SpotlightHighlight';

const TourManager = ({
  tourType,
  step,
  onStepChange,
  onAddMessage
}) => {
  const location = useLocation();
  const [highlightInfo, setHighlightInfo] = useState(null);

  const clearHighlights = useCallback(() => {
    setHighlightInfo(null);
  }, []);

  useEffect(() => {
    clearHighlights();

    if (!tourType || step === 0) {
      return;
    }

    const info = getTourHighlight(tourType, step, location.pathname);
    if (!info) return;

    setHighlightInfo(info);

    if (info.message && onAddMessage) {
      onAddMessage(info.message);
    }

  }, [tourType, step, location.pathname, clearHighlights, onAddMessage]);

  useEffect(() => {
    if (!tourType || step === 0) return;

    const nextStep = step + 1;
    const nextHighlightInfo = getTourHighlight(tourType, nextStep, location.pathname);

    if (nextHighlightInfo) {
      onStepChange(nextStep);
    }
  }, [location.pathname, tourType, step, onStepChange]);

  const handleNextStep = useCallback(() => {
    onStepChange(step + 1);
  }, [step, onStepChange]);

  if (!highlightInfo) {
    return null;
  }

  return (
    <SpotlightHighlight
      selector={highlightInfo.selector}
      padding={20}
      onNext={highlightInfo.nextStepOnClick ? handleNextStep : undefined}
      includeChatInSpotlight={true}
    />
  );
};

export default TourManager;