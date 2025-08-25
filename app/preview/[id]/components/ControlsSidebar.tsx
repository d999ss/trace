'use client';

import { PosterState, PosterActions } from '../hooks/usePosterState';
import { StepperNavigation } from './StepperNavigation';
import { StepContent } from './StepContent';
import { ActionButtons } from './ActionButtons';

interface ControlsSidebarProps {
  posterState: PosterState & PosterActions;
}

export function ControlsSidebar({ posterState }: ControlsSidebarProps) {
  return (
    <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-6">
        <StepperNavigation currentStep={posterState.currentStep} />
        <StepContent posterState={posterState} />
        <ActionButtons posterState={posterState} />
      </div>
    </div>
  );
}
