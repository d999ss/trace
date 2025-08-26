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
      description: routeLoaded && routeData ? `${routeData.distance} • ${routeData.duration} • ${routeData.points} pts` : 'Select your activity',
      completed: routeLoaded
    },
    { 
      number: 2, 
      title: 'Style', 
      description: 'Pick style + map theme',
      completed: currentStep > 2
    },
    { 
      number: 3, 
      title: 'Text', 
      description: 'Title, subtitle, extras',
      completed: currentStep > 3
    },
    { 
      number: 4, 
      title: 'Size', 
      description: 'Print size + export',
      completed: false
    },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-white">Customize Your Poster</h2>
        <div className="text-xs text-gray-300">Step {currentStep} of 4</div>
      </div>
      
      <div className="space-y-3">
        {steps.map((step) => {
          const isClickable = step.number === 1 || (step.number === 2 && routeLoaded) || (step.number <= currentStep);
          
          return (
            <div
              key={step.number}
              onClick={() => isClickable && onStepClick?.(step.number as 1 | 2 | 3 | 4)}
              className={`flex items-center space-x-3 p-3 transition-all ${
                currentStep === step.number ? 'bg-gray-800' : 'hover:bg-gray-900'
              } ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
            >
            <div className={`w-6 h-6 flex items-center justify-center text-xs font-medium ${
              step.completed ? 'bg-gray-700 text-white' : 
              currentStep === step.number ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-300'
            }`}>
              {step.completed ? '✓' : step.number}
            </div>
            <div>
              <div className={`text-xs font-medium ${currentStep === step.number ? 'text-white' : 'text-gray-200'}`}>
                {step.title}
              </div>
              <div className="text-xs text-gray-400">{step.description}</div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
