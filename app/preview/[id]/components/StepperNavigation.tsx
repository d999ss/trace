interface StepperNavigationProps {
  currentStep: 1 | 2 | 3 | 4;
}

export function StepperNavigation({ currentStep }: StepperNavigationProps) {
  const steps = [
    { number: 1, title: 'Route', description: 'Select your activity' },
    { number: 2, title: 'Style', description: 'Choose poster style & map theme' },
    { number: 3, title: 'Text', description: 'Add title & subtitle' },
    { number: 4, title: 'Size', description: 'Select print size' },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-white">Customize Your Poster</h2>
        <div className="text-xs text-gray-300">Step {currentStep} of 4</div>
      </div>
      
      <div className="space-y-3">
        {steps.map((step) => (
          <div
            key={step.number}
            className={`flex items-center space-x-3 p-3 transition-all ${
              currentStep === step.number ? 'bg-gray-800' : 'hover:bg-gray-900'
            }`}
          >
            <div className={`w-6 h-6 flex items-center justify-center text-xs font-medium ${
              currentStep === step.number ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-300'
            }`}>
              {step.number}
            </div>
            <div>
              <div className={`text-xs font-medium ${currentStep === step.number ? 'text-white' : 'text-gray-200'}`}>
                {step.title}
              </div>
              <div className="text-xs text-gray-400">{step.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
