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
        position: 'bottom',
        nextStepOnClick: true,
        navigateTo: '/listing-builder'
      },
      2: {
        route: '/listing-builder',
        selector: '.listing-builder-sidebar',
        message: "These are the steps to complete your listing. Follow each step to create your listing.",
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

export const processChatMessage = (message) => {
  const lowerMsg = message.toLowerCase().trim();

  if (lowerMsg.includes('building list') || lowerMsg.includes('create listing')) {
    return {
      tourType: TOUR_TYPES.LISTING_BUILDER,
      step: 1,
      message: "Let me guide you through creating a listing. First, click the highlighted 'BUILD LISTING' button."
    };
  }

  return { message: "Hello, how can I help you today?" };
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

export const convertToJoyrideSteps = (tourType, step) => {
  const stepConfig = getTourStep(tourType, step);

  if (!stepConfig) return [];

  return [{
    target: stepConfig.selector,
    content: stepConfig.message,
    placement: stepConfig.position || 'center',
    disableBeacon: true,
    spotlightClicks: stepConfig.nextStepOnClick,
    disableOverlayClose: true,
  }];
};
