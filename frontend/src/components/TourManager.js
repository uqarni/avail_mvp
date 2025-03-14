import { useEffect, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getTourHighlight } from '../services/TourService';

const TourManager = ({
  tourType,
  step,
  onStepChange,
  onAddMessage
}) => {
  const location = useLocation();
  const [highlightApplied, setHighlightApplied] = useState(false);

  const clearHighlights = useCallback(() => {
    const highlightedElements = document.querySelectorAll('.highlight-element');
    highlightedElements.forEach(el => {
      el.classList.remove('highlight-element');
    });
    setHighlightApplied(false);
  }, []);

  useEffect(() => {
    clearHighlights();
    setHighlightApplied(false);

    if (!tourType || step === 0) {
      return;
    }

    const highlightInfo = getTourHighlight(tourType, step, location.pathname);
    if (!highlightInfo) return;

    const highlightTimer = setTimeout(() => {
      const elements = document.querySelectorAll(highlightInfo.selector);

      if (elements.length > 0) {
        console.log(`Highlighting ${elements.length} elements with selector ${highlightInfo.selector}`);

        if (highlightInfo.multiple) {
          elements.forEach(item => {
            item.classList.add('highlight-element');
          });
        } else {
          elements[0].classList.add('highlight-element');

          if (highlightInfo.nextStepOnClick) {
            const handleClick = () => {
              elements[0].classList.remove('highlight-element');
              onStepChange(step + 1);
            };

            elements[0].addEventListener('click', handleClick, { once: true });
          }
        }

        if (highlightInfo.message && onAddMessage) {
          onAddMessage(highlightInfo.message);
        }

        setHighlightApplied(true);
      }
    }, 500);

    return () => {
      clearTimeout(highlightTimer);
      clearHighlights();
    };
  }, [tourType, step, location.pathname, clearHighlights, onStepChange, onAddMessage]);

  useEffect(() => {
    if (!tourType || step === 0) return;

    const nextStep = step + 1;
    const nextHighlightInfo = getTourHighlight(tourType, nextStep, location.pathname);

    if (nextHighlightInfo) {
      onStepChange(nextStep);
    }
  }, [location.pathname, tourType, step, onStepChange]);

  return null;
};

export default TourManager;