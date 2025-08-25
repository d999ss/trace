'use client';

import { PosterState, PosterActions } from '../hooks/usePosterState';
import { StepperNavigation } from './StepperNavigation';
import { StepContent } from './StepContent';
import { ActionButtons } from './ActionButtons';
import { RefObject } from 'react';

interface ControlsSidebarProps {
  posterState: PosterState & PosterActions;
  svgRef: RefObject<SVGSVGElement | null>;
}

export function ControlsSidebar({ posterState, svgRef }: ControlsSidebarProps) {
  return (
    <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-6">
        <StepperNavigation currentStep={posterState.currentStep} />
        <StepContent posterState={posterState} />
        <ActionButtons posterState={posterState} svgRef={svgRef} />
      </div>
    </div>
  );
}
