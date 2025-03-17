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
        message: "Click this button to start building your listing"
      },
      2: {
        route: '/listing-builder',
        selector: '.step-item',
        multiple: true,
        nextStepOnClick: false,
        message: "These are the steps you'll need to complete to create your listing. Let's start with the basics."
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


export const getMaxStepForTour = (tourType) => {
  if (!TOUR_CONFIGS[tourType]) {
    return 0;
  }
  
  const steps = TOUR_CONFIGS[tourType].steps;
  return Math.max(...Object.keys(steps).map(Number));
};


export const processChatMessage = (gepetoResponse, setTourType, setTourStep) => {
  if (gepetoResponse.functionCall && gepetoResponse.functionCall === 'HIGHLIGHT_BUTTON_A') {
    setTourType(TOUR_TYPES.LISTING_BUILDER);
    setTourStep(1);
    return gepetoResponse.Message;
  } else {
    return gepetoResponse.Message;
  }
};
