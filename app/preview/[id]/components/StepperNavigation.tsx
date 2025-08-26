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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Steps</h3>
        <Badge variant="outline" className="text-xs">
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
            <div
              key={step.number}
              onClick={isClickable && onStepClick ? () => onStepClick(step.number as 1 | 2 | 3 | 4) : undefined}
              className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                isActive 
                  ? 'bg-accent' 
                  : isClickable 
                  ? 'hover:bg-accent/50' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-medium ${
                isCompleted 
                  ? 'bg-primary text-primary-foreground border-primary'
                  : isActive 
                  ? 'border-primary text-primary' 
                  : 'border-border text-muted-foreground'
              }`}>
                {isCompleted ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  step.number
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-none">{step.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
