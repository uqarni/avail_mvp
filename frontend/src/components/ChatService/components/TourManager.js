import React, { useEffect, useState, useRef } from 'react';
import Joyride from 'react-joyride';
import '../styles/TourManager.css';

const EmptyTooltip = () => null;

const TourManager = ({ highlightClass, onElementClick, onTourComplete }) => {
  const [runTour, setRunTour] = useState(false);
  const [joyrideSteps, setJoyrideSteps] = useState([]);
  // eslint-disable-next-line
  const [elementExists, setElementExists] = useState(false);
  const highlightRef = useRef(null);

  // Creates a separate highlight element attached to the body
  const createHighlightElement = (targetEl) => {
    if (!targetEl) return;
    
    // Remove any existing highlight
    if (highlightRef.current) {
      document.body.removeChild(highlightRef.current);
      highlightRef.current = null;
    }
    
    const rect = targetEl.getBoundingClientRect();
    const highlight = document.createElement('div');
    highlight.className = 'absolute-highlight-border';
    
    // For sidebar elements, make the highlight span the full width of the sidebar
    // This ensures we get a complete rectangle without clipping
    if (highlightClass.includes('sidebar') || rect.left < 200) {
      // This is likely a sidebar element - make the highlight wider
      highlight.style.position = 'fixed';
      highlight.style.top = `${rect.top - 8}px`;
      highlight.style.left = '0px'; // Start from the left edge of the screen
      highlight.style.width = `${Math.max(rect.right, 250)}px`; // Ensure minimum width to cover sidebar
      highlight.style.height = `${rect.height + 16}px`;
    } else {
      // Standard positioning for regular elements
      highlight.style.position = 'fixed';
      highlight.style.top = `${rect.top - 12}px`;
      highlight.style.left = `${rect.left - 12}px`;
      highlight.style.width = `${rect.width + 24}px`;
      highlight.style.height = `${rect.height + 24}px`;
    }
    
    document.body.appendChild(highlight);
    highlightRef.current = highlight;
    
    return highlight;
  };

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
        
        // Create highlight element instead of adding class
        createHighlightElement(el);
      } else {
        console.warn(`Element ${highlightClass} not found when trying to start Joyride`);
      }
    }, 500);

    // Cleanup function to remove highlight when component unmounts or highlightClass changes
    return () => {
      if (highlightRef.current) {
        document.body.removeChild(highlightRef.current);
        highlightRef.current = null;
      }
    };
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
      
      // Remove highlight element
      if (highlightRef.current) {
        document.body.removeChild(highlightRef.current);
        highlightRef.current = null;
      }
    };
  }, [highlightClass, onElementClick]);

  // TODO: check if this is still needed
  useEffect(() => {
    if (!highlightClass) return;
    
    const handleResize = () => {
      const el = document.querySelector(highlightClass);
      if (el && highlightRef.current) {
        const rect = el.getBoundingClientRect();
        
        // Sidebar CSS specific handle
        // TODO: check if this is still needed
        if (highlightClass.includes('sidebar') || rect.left < 200) {
          highlightRef.current.style.top = `${rect.top - 8}px`;
          highlightRef.current.style.left = '0px';
          highlightRef.current.style.width = `${Math.max(rect.right, 250)}px`;
          highlightRef.current.style.height = `${rect.height + 16}px`;
        } else {
          highlightRef.current.style.top = `${rect.top - 12}px`;
          highlightRef.current.style.left = `${rect.left - 12}px`;
          highlightRef.current.style.width = `${rect.width + 24}px`;
          highlightRef.current.style.height = `${rect.height + 24}px`;
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [highlightClass]);

  const handleJoyrideCallback = (data) => {
    const { status, type } = data;

    if (status === 'finished' || status === 'skipped') {
      console.log('Tour finished or skipped');
      
      // Remove highlight element
      if (highlightRef.current) {
        document.body.removeChild(highlightRef.current);
        highlightRef.current = null;
      }
      
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
      disableOverlay={true}
      floaterProps={{
        disableAnimation: true,
        hideArrow: true
      }}
      styles={{
        options: {
          zIndex: 999999,
          arrowColor: 'transparent',
        },
        spotlight: {
          borderRadius: 8,
          boxShadow: 'none',
          backgroundColor: 'transparent'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0)',
          mixBlendMode: 'normal'
        },
        tooltipContainer: {
          textAlign: 'center',
          position: 'relative'
        },
        buttonNext: {
          display: 'none'
        },
        buttonBack: {
          display: 'none'
        }
      }}
    />
  );
};

export default TourManager; 