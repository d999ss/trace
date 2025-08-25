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
        <h2 className="text-lg font-semibold text-gray-900">Customize Your Poster</h2>
        <div className="text-sm text-gray-500">Step {currentStep} of 4</div>
      </div>
      
      <div className="space-y-3">
        {steps.map((step) => (
          <div
            key={step.number}
            className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
              currentStep === step.number ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === step.number ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {step.number}
            </div>
            <div>
              <div className={`font-medium ${currentStep === step.number ? 'text-blue-900' : 'text-gray-700'}`}>
                {step.title}
              </div>
              <div className="text-sm text-gray-500">{step.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
