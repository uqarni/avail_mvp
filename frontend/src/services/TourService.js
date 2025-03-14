export const TOUR_TYPES = {
  LISTING_BUILDER: 'listing_builder',
};

const TOUR_CONFIGS = {
  [TOUR_TYPES.LISTING_BUILDER]: {
    steps: {
      1: {
        route: '/',
        selector: '.build-listing-btn',
        multiple: false,
        nextStepOnClick: true,
        message: "Let me guide you through creating a listing. First, click the highlighted 'BUILD LISTING' button."
      },
      2: {
        route: '/listing-builder',
        selector: '.step-item',
        multiple: true,
        nextStepOnClick: false,
        message: "Great! Now you're in the listing builder. The sidebar on the left shows all the steps you need to complete to create your listing."
      }
    }
  }
};

export const getTourHighlight = (tourType, step, pathname) => {
  if (!TOUR_CONFIGS[tourType]) {
    return null;
  }

  const stepConfig = TOUR_CONFIGS[tourType].steps[step];

  if (stepConfig && stepConfig.route === pathname) {
    return {
      selector: stepConfig.selector,
      multiple: stepConfig.multiple,
      nextStepOnClick: stepConfig.nextStepOnClick,
      message: stepConfig.message
    };
  }

  return null;
};

export const processChatMessage = async (message) => {
  try {
    const lowerMsg = message.toLowerCase().trim();

    if (lowerMsg === 'building list' || lowerMsg === 'create listing') {
      return {
        tourType: TOUR_TYPES.LISTING_BUILDER,
        step: 1,
        message: TOUR_CONFIGS[TOUR_TYPES.LISTING_BUILDER].steps[1].message
      };
    }

    return {
      message: "Hello, how can I help you today?"
    };
  } catch (error) {
    console.error('Error processing message:', error);
    return { message: "Sorry, I'm having trouble processing your message." };
  }
};
