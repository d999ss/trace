'use client';

import { PosterState, PosterActions } from '../hooks/usePosterState';

interface StickyCTAProps {
  posterState: PosterState & PosterActions;
  routeLoaded: boolean;
}

export function StickyCTA({ posterState, routeLoaded }: StickyCTAProps) {
  const { currentStep, setCurrentStep } = posterState;
  
  const getButtonText = () => {
    switch (currentStep) {
      case 1:
        return routeLoaded ? 'Continue to Style (Route loaded)' : 'Continue to Style';
      case 2:
        return 'Continue to Text';
      case 3:
        return 'Continue to Size';
      case 4:
        return 'Poster Complete';
      default:
        return 'Continue';
    }
  };

  const getHelperText = () => {
    switch (currentStep) {
      case 1:
        return 'Next: choose poster style and map theme; you can edit title and size later.';
      case 2:
        return 'Next: add title and subtitle to your poster.';
      case 3:
        return 'Next: select print size and export options.';
      case 4:
        return 'Your poster is ready! Use the export options above.';
      default:
        return '';
    }
  };

  const handleContinue = () => {
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as 1 | 2 | 3 | 4);
    }
  };

  const isDisabled = currentStep === 1 && !routeLoaded;

  return (
    <div className="sticky bottom-0 left-0 right-0 bg-black border-t border-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={handleContinue}
          disabled={isDisabled || currentStep === 4}
          className={`w-full py-3 px-6 text-xs font-medium transition-colors ${
            isDisabled || currentStep === 4
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-gray-700 text-white hover:bg-gray-600'
          }`}
        >
          {getButtonText()}
        </button>
        <p className="text-xs text-gray-400 text-center mt-2">
          {getHelperText()}
        </p>
      </div>
    </div>
  );
}