import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, MapPin, Palette, Type, Printer } from 'lucide-react';

interface StepperNavigationProps {
  currentStep: 1 | 2 | 3 | 4;
  routeLoaded?: boolean;
  routeData?: {
    distance: string;
    duration: string; 
    elevation: string;
    points: number;
  };
  onStepClick?: (step: 1 | 2 | 3 | 4) => void;
}

export function StepperNavigation({ currentStep, routeLoaded, routeData, onStepClick }: StepperNavigationProps) {
  const steps = [
    { 
      number: 1, 
      title: 'Route', 
      icon: MapPin,
      description: routeLoaded && routeData ? `${routeData.distance} • ${routeData.duration}` : 'Import your ride data',
      completed: routeLoaded
    },
    { 
      number: 2, 
      title: 'Style', 
      icon: Palette,
      description: 'Choose theme & design',
      completed: currentStep > 2
    },
    { 
      number: 3, 
      title: 'Content', 
      icon: Type,
      description: 'Add title & details',
      completed: currentStep > 3
    },
    { 
      number: 4, 
      title: 'Export', 
      icon: Printer,
      description: 'Size & download options',
      completed: false
    },
  ];

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-semibold">Create Your Poster</div>
        <Badge variant="secondary" className="text-xs">
          {currentStep} of 4
        </Badge>
      </div>
      
      <div className="space-y-2">
        {steps.map((step) => {
          const isClickable = step.number === 1 || (step.number === 2 && routeLoaded) || (step.number <= currentStep);
          const isActive = step.number === currentStep;
          const isCompleted = step.completed;
          const IconComponent = step.icon;
          
          return (
            <Button
              key={step.number}
              variant={isActive ? "default" : isCompleted ? "secondary" : "ghost"}
              className={`w-full justify-start h-auto p-3 ${!isClickable ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={isClickable && onStepClick ? () => onStepClick(step.number as 1 | 2 | 3 | 4) : undefined}
              disabled={!isClickable}
            >
              <div className="flex items-center w-full">
                <div className="flex items-center justify-center mr-3">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <div className="relative">
                      <Circle className="w-5 h-5" />
                      <IconComponent className="w-3 h-3 absolute top-1 left-1" />
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="text-xs text-muted-foreground">{step.description}</div>
                </div>
                {isActive && (
                  <Badge variant="outline" className="text-xs">
                    Current
                  </Badge>
                )}
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
