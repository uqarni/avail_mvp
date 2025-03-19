import React, { useEffect, useState } from 'react';
import Joyride from 'react-joyride';
import './TourManager.css';

const EmptyTooltip = () => null;

const TourManager = ({ highlightClass, onElementClick, onTourComplete }) => {
  const [runTour, setRunTour] = useState(false);
  const [joyrideSteps, setJoyrideSteps] = useState([]);
  // eslint-disable-next-line
  const [elementExists, setElementExists] = useState(false);

  // Check if element exists in DOM and apply manual highlight if needed
  useEffect(() => {
    if (!highlightClass) {
      return;
    }

    const checkElement = () => {
      const el = document.querySelector(highlightClass);
      console.log(`Looking for element ${highlightClass}: ${el ? 'Found' : 'Not found'}`);

      return false;
    };

    if (!checkElement()) {
      const checkInterval = setInterval(() => {
        if (checkElement()) {
          clearInterval(checkInterval);
        }
      }, 100);

      setTimeout(() => clearInterval(checkInterval), 3000);
    }
  }, [highlightClass]);

  useEffect(() => {
    if (!highlightClass) {
      setRunTour(false);
      setJoyrideSteps([]);
      return;
    }

    setJoyrideSteps([
      {
        target: highlightClass,
        content: '',
        disableBeacon: true,
        spotlightClicks: true,
        disableOverlayClose: true,
      },
    ]);

    setTimeout(() => {
      const el = document.querySelector(highlightClass);
      if (el) {
        console.log('Starting Joyride tour for', highlightClass);
        setRunTour(true);
      } else {
        console.warn(`Element ${highlightClass} not found when trying to start Joyride`);
      }
    }, 500);
  }, [highlightClass, elementExists]);

  useEffect(() => {
    if (!highlightClass) return;

    const el = document.querySelector(highlightClass);
    if (!el) return;

    const handleClick = () => {
      onElementClick(highlightClass);
    };

    el.addEventListener('click', handleClick);
    return () => {
      el.removeEventListener('click', handleClick);
    };
  }, [highlightClass, onElementClick]);

  const handleJoyrideCallback = (data) => {
    const { status, type } = data;

    if (status === 'finished' || status === 'skipped') {
      console.log('Tour finished or skipped');
      onTourComplete && onTourComplete();
    }

    if (type === 'error:target_not_found') {
      console.error(`Target element not found: ${highlightClass}`);
      const el = document.querySelector(highlightClass);
      if (el) {
        el.classList.add('manual-highlight');
      }
    }
  };

  if (!highlightClass || joyrideSteps.length === 0) {
    return null;
  }

  return (
    <Joyride
      steps={joyrideSteps}
      run={runTour}
      continuous={false}
      showSkipButton={false}
      tooltipComponent={EmptyTooltip}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          zIndex: 999999,
        },
        spotlight: {
          borderRadius: 5,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
        },
      }}
    />
  );
};

export default TourManager;