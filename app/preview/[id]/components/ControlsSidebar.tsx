'use client';

import { PosterState, PosterActions } from '../hooks/usePosterState';
import { StepperNavigation } from './StepperNavigation';
import { StepContent } from './StepContent';
import { ActionButtons } from './ActionButtons';
import { RefObject } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

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
  const showExportButtons = posterState.currentStep === 4;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Trace</h1>
        <p className="text-sm text-muted-foreground">
          Create beautiful posters from your cycling routes
        </p>
      </div>

      {/* Route Overview */}
      {routeData && routeLoaded && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-2xl font-bold">{routeData.distance}</p>
              <p className="text-xs text-muted-foreground">Distance</p>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold">{routeData.duration}</p>
              <p className="text-xs text-muted-foreground">Duration</p>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium">{routeData.elevation}</p>
              <p className="text-xs text-muted-foreground">Elevation</p>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium">{routeData.points}</p>
              <p className="text-xs text-muted-foreground">Points</p>
            </div>
          </div>
        </div>
      )}
      
      <Separator />
      
      {/* Steps */}
      <StepperNavigation 
        currentStep={posterState.currentStep} 
        routeLoaded={routeLoaded}
        routeData={routeData}
        onStepClick={posterState.setCurrentStep}
      />
      
      <Separator />
      
      {/* Step Content */}
      <div className="space-y-4">
        <StepContent posterState={posterState} />
      </div>
      
      {/* Export Actions */}
      {showExportButtons && (
        <>
          <Separator />
          <ActionButtons
            posterState={posterState}
            svgRef={svgRef}
            showExportButtons={showExportButtons}
          />
        </>
      )}
    </div>
  );
}
