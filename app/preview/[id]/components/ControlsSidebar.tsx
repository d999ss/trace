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
  const showExportButtons = posterState.currentStep === 4; // Only show on final step

  return (
    <div className="h-full flex flex-col space-y-6 p-6">
      {/* Route Data Card */}
      {routeData && routeLoaded && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Route Overview</CardTitle>
            <CardDescription>Your cycling data at a glance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{routeData.distance}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Distance</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{routeData.duration}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Duration</div>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-lg font-semibold">{routeData.elevation}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Elevation</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">{routeData.points}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Points</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Progress Steps */}
      <Card>
        <CardContent className="p-6">
          <StepperNavigation 
            currentStep={posterState.currentStep} 
            routeLoaded={routeLoaded}
            routeData={routeData}
            onStepClick={posterState.setCurrentStep}
          />
        </CardContent>
      </Card>
      
      {/* Step Content */}
      <div className="flex-1 min-h-0">
        <Card className="h-full">
          <CardContent className="p-6 h-full overflow-y-auto">
            <StepContent posterState={posterState} />
          </CardContent>
        </Card>
      </div>
      
      {/* Export Actions */}
      {showExportButtons && (
        <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
          <CardContent className="p-6">
            <ActionButtons
              posterState={posterState}
              svgRef={svgRef}
              showExportButtons={showExportButtons}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
