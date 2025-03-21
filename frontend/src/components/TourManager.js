import { useEffect, useRef } from 'react';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light.css';
import './TourManager.css';

const TourManager = ({ highlightClass, onElementClick, onTourComplete }) => {
  const tippyInstanceRef = useRef(null);

  useEffect(() => {
    if (!highlightClass) return;

    let attempts = 0;
    const maxAttempts = 20;

    const setupTippy = () => {
      const targetElement = document.querySelector(highlightClass);

      if (targetElement) {
        console.log(`Element ${highlightClass} found, applying Tippy highlight`);

        targetElement.classList.add('spotlight-target');

        tippyInstanceRef.current = tippy(targetElement, {
          content: '',
          placement: 'auto',
          arrow: true,
          theme: 'light',
          trigger: 'manual',
          hideOnClick: false,
          interactive: true,
          interactiveBorder: 10,
          maxWidth: 350,
          appendTo: document.body,
          // Use a wrapper for the custom look
          onCreate(instance) {
            // Apply custom styles for an empty tooltip
            instance.popper.classList.add('highlight-tippy-wrapper');
          }
        });

        // Show the Tippy tooltip
        tippyInstanceRef.current.show();

        // Add custom click handler
        const handleClick = () => {
          onElementClick(highlightClass);
        };

        targetElement.addEventListener('click', handleClick);

        return () => {
          targetElement.removeEventListener('click', handleClick);
          targetElement.classList.remove('spotlight-target');
          if (tippyInstanceRef.current) {
            tippyInstanceRef.current.destroy();
            tippyInstanceRef.current = null;
          }
        };
      }

      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(setupTippy, 250);
      } else {
        console.warn(`Element ${highlightClass} not found after ${maxAttempts} attempts`);
        if (onTourComplete) onTourComplete();
      }
    };

    const cleanup = setupTippy();

    return () => {
      if (cleanup) cleanup();
    };
  }, [highlightClass, onElementClick, onTourComplete]);

  return null;
};

export default TourManager;