import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import './SpotlightHighlight.css';

const SpotlightHighlight = ({
  selector,
  padding = 15,
  onNext
}) => {
  const [targetElement, setTargetElement] = useState(null);
  const [targetRect, setTargetRect] = useState(null);

  useEffect(() => {
    const element = document.querySelector(selector);
    if (!element) {
      console.warn(`Element with selector "${selector}" not found`);
      return;
    }

    setTargetElement(element);

    element.classList.add('spotlight-target');

    const chatButton = document.querySelector('.chat-toggle-button');
    const chatModal = document.querySelector('.chat-modal');

    if (chatButton) {
      const originalButtonStyles = {
        zIndex: chatButton.style.zIndex,
      };

      chatButton.style.zIndex = '10000';

      chatButton._originalStyles = originalButtonStyles;
    }

    if (chatModal) {
      const originalModalStyles = {
        zIndex: chatModal.style.zIndex,
      };

      chatModal.style.zIndex = '10000';

      chatModal._originalStyles = originalModalStyles;
    }

    const updateRect = () => {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
    };

    updateRect();

    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);

    // Cleanup
    return () => {
      element.classList.remove('spotlight-target');
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);

      if (chatButton && chatButton._originalStyles) {
        if (chatButton._originalStyles.zIndex) {
          chatButton.style.zIndex = chatButton._originalStyles.zIndex;
        } else {
          chatButton.style.removeProperty('z-index');
        }
      }

      if (chatModal && chatModal._originalStyles) {
        if (chatModal._originalStyles.zIndex) {
          chatModal.style.zIndex = chatModal._originalStyles.zIndex;
        } else {
          chatModal.style.removeProperty('z-index');
        }
      }
    };
  }, [selector]);

  useEffect(() => {
    if (!targetElement || !onNext) return;

    const handleClick = () => {
      onNext();
    };

    targetElement.addEventListener('click', handleClick);

    return () => {
      targetElement.removeEventListener('click', handleClick);
    };
  }, [targetElement, onNext]);

  if (!targetElement || !targetRect) {
    return null;
  }

  return ReactDOM.createPortal(
    <div>
      <div
        className="spotlight-target-cutout"
        style={{
          left: `${targetRect.left - padding}px`,
          top: `${targetRect.top - padding}px`,
          width: `${targetRect.width + (padding * 2)}px`,
          height: `${targetRect.height + (padding * 2)}px`,
        }}
      />
    </div>,
    document.body
  );
};

export default SpotlightHighlight;