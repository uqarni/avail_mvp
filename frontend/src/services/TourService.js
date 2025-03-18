export const TOUR_TYPES = {
  LISTING_BUILDER: 'listing_builder',
};

const TOUR_CONFIGS = {
  [TOUR_TYPES.LISTING_BUILDER]: {
    steps: {
      1: {
        route: '/',
        selector: '.build-listing-btn',
        message: "Click this button to start building your listing",
        position: 'top',
        nextStepOnClick: true,
        navigateTo: '/listing-builder'
      },
      2: {
        route: '/listing-builder',
        selector: '.step-item',
        message: "These are the steps to complete your listing. Click on each step to fill out the information.",
        position: 'right',
        nextStepOnClick: true
      }
    }
  }
};

export const getTourStep = (tourType, step) => {
  if (!TOUR_CONFIGS[tourType]) {
    return null;
  }

  const stepConfig = TOUR_CONFIGS[tourType].steps[step];

  return stepConfig || null;
};

export const processChatMessage = (gepetoResponse, setTourType, setTourStep) => {
  if (gepetoResponse.functionCall && gepetoResponse.functionCall === 'HIGHLIGHT_BUTTON_A') {
    setTourType(TOUR_TYPES.LISTING_BUILDER);
    setTourStep(1);
    return gepetoResponse.message;
  } else {
    return gepetoResponse.message;
  }
};

export const shouldAdvanceOnNavigation = (tourType, currentStep, currentPath) => {
  const currentStepConfig = getTourStep(tourType, currentStep);

  const nextStep = currentStep + 1;
  const nextStepConfig = getTourStep(tourType, nextStep);

  if (currentStepConfig &&
      currentStepConfig.navigateTo &&
      nextStepConfig &&
      nextStepConfig.route === currentPath) {
    return nextStep;
  }

  return null;
};