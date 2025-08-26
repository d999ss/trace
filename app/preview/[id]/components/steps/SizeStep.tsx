'use client';

import { PosterState, PosterActions } from '../../hooks/usePosterState';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SizeStepProps {
  posterState: PosterState & PosterActions;
}

export function SizeStep({ posterState }: SizeStepProps) {
  const sizes = [
    { value: 'digital', label: 'Digital', description: 'High-res download' },
    { value: 'small', label: 'Small', description: '8" × 12"' },
    { value: 'medium', label: 'Medium', description: '12" × 18"' },
    { value: 'large', label: 'Large', description: '16" × 24"' }
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Size</h4>
        <RadioGroup
          value={posterState.selectedSize}
          onValueChange={(value) => posterState.setSelectedSize(value as 'digital' | 'small' | 'medium' | 'large')}
          className="space-y-2"
        >
          {sizes.map((size) => (
            <div key={size.value} className="flex items-center space-x-3">
              <RadioGroupItem value={size.value} id={size.value} />
              <div className="flex-1">
                <Label htmlFor={size.value} className="text-sm font-medium">
                  {size.label}
                </Label>
                <p className="text-xs text-muted-foreground">{size.description}</p>
              </div>
            </div>
          ))}
        </RadioGroup>
      </div>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => posterState.setCurrentStep(3)}
          className="flex-1"
          size="sm"
        >
          Back
        </Button>
      </div>
    </div>
  );
}
