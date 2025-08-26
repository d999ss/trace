'use client';

import { PosterState, PosterActions } from '../../hooks/usePosterState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TextStepProps {
  posterState: PosterState & PosterActions;
}

export function TextStep({ posterState }: TextStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium">Title</Label>
          <Input
            id="title"
            value={posterState.title}
            onChange={(e) => posterState.setTitle(e.target.value)}
            placeholder="e.g., Morning Run, Epic Ride"
            className="h-9"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="subtitle" className="text-sm font-medium">Subtitle</Label>
          <Input
            id="subtitle"
            value={posterState.subtitle}
            onChange={(e) => posterState.setSubtitle(e.target.value)}
            placeholder="e.g., January 15, 2024"
            className="h-9"
          />
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => posterState.setCurrentStep(2)}
          className="flex-1"
          size="sm"
        >
          Back
        </Button>
        <Button
          onClick={() => posterState.setCurrentStep(4)}
          className="flex-1"
          size="sm"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
