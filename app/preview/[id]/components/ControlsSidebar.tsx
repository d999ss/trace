'use client';

import { PosterState, PosterActions } from '../hooks/usePosterState';
import { StepperNavigation } from './StepperNavigation';
import { StepContent } from './StepContent';
import { ActionButtons } from './ActionButtons';
import { RefObject } from 'react';

interface ControlsSidebarProps {
  posterState: PosterState & PosterActions;
  svgRef: RefObject<SVGSVGElement | null>;
  routeData?: {
    distance: string;
    duration: string; 
    elevation: string;
    points: number;
  };
}

export function ControlsSidebar({ posterState, svgRef, routeData }: ControlsSidebarProps) {
  const routeLoaded = posterState.coordinates.length > 0;
  const showExportButtons = posterState.currentStep === 4; // Only show on final step

  return (
    <div className="w-96 bg-black border-l border-gray-800 overflow-y-auto">
      <div className="p-6">
        <StepperNavigation 
          currentStep={posterState.currentStep} 
          routeLoaded={routeLoaded}
          routeData={routeData}
          onStepClick={posterState.setCurrentStep}
        />
        <StepContent posterState={posterState} />
        <ActionButtons 
          posterState={posterState} 
          svgRef={svgRef} 
          showExportButtons={showExportButtons}
        />
      </div>
    </div>
  );
}
