'use client';

import { PosterState, PosterActions } from '../../hooks/usePosterState';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StyleStepProps {
  posterState: PosterState & PosterActions;
}

export function StyleStep({ posterState }: StyleStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-3">Poster Style</h4>
          <RadioGroup
            value={posterState.posterStyle}
            onValueChange={(value) => posterState.setPosterStyle(value as 'classic' | 'art-print')}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="classic" id="classic" />
              <Label htmlFor="classic" className="text-sm">Classic</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="art-print" id="art-print" />
              <Label htmlFor="art-print" className="text-sm">Art Print</Label>
            </div>
          </RadioGroup>
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-3">Theme</h4>
          <RadioGroup
            value={posterState.theme}
            onValueChange={(value) => posterState.setTheme(value as 'light' | 'dark' | 'accent')}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light" className="text-sm">Light</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark" className="text-sm">Dark</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="accent" id="accent" />
              <Label htmlFor="accent" className="text-sm">Accent</Label>
            </div>
          </RadioGroup>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => posterState.setCurrentStep(1)}
          className="flex-1"
          size="sm"
        >
          Back
        </Button>
        <Button
          onClick={() => posterState.setCurrentStep(3)}
          className="flex-1"
          size="sm"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
