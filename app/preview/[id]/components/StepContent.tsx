'use client';

import { PosterState, PosterActions } from '../hooks/usePosterState';
import { RouteStep } from './steps/RouteStep';
import { StyleStep } from './steps/StyleStep';
import { TextStep } from './steps/TextStep';
import { SizeStep } from './steps/SizeStep';

interface StepContentProps {
  posterState: PosterState & PosterActions;
}

export function StepContent({ posterState }: StepContentProps) {
  const renderStep = () => {
    switch (posterState.currentStep) {
      case 1:
        return <RouteStep posterState={posterState} />;
      case 2:
        return <StyleStep posterState={posterState} />;
      case 3:
        return <TextStep posterState={posterState} />;
      case 4:
        return <SizeStep posterState={posterState} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {renderStep()}
    </div>
  );
}
