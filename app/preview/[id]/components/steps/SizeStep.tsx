'use client';

import { PosterState, PosterActions } from '../../hooks/usePosterState';

interface SizeStepProps {
  posterState: PosterState & PosterActions;
}

export function SizeStep({ posterState }: SizeStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Print Size</label>
        <div className="space-y-2">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name="selectedSize"
              value="digital"
              checked={posterState.selectedSize === 'digital'}
              onChange={(e) => posterState.setSelectedSize(e.target.value as 'digital' | 'small' | 'medium' | 'large')}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Digital</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name="selectedSize"
              value="small"
              checked={posterState.selectedSize === 'small'}
              onChange={(e) => posterState.setSelectedSize(e.target.value as 'digital' | 'small' | 'medium' | 'large')}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Small</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name="selectedSize"
              value="medium"
              checked={posterState.selectedSize === 'medium'}
              onChange={(e) => posterState.setSelectedSize(e.target.value as 'digital' | 'small' | 'medium' | 'large')}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Medium</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name="selectedSize"
              value="large"
              checked={posterState.selectedSize === 'large'}
              onChange={(e) => posterState.setSelectedSize(e.target.value as 'digital' | 'small' | 'medium' | 'large')}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Large</span>
          </label>
        </div>
      </div>
      
      {/* Navigation buttons */}
      <div className="flex space-x-3 pt-4">
        <button
          onClick={() => posterState.setCurrentStep(3)}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  );
}
