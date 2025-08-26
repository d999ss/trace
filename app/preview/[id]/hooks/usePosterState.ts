import { useState, useCallback } from 'react';

export type PosterStyle = 'classic' | 'art-print';
export type Theme = 'light' | 'dark' | 'accent';
export type PrintSize = 'digital' | 'small' | 'medium' | 'large';

export interface PosterState {
  coordinates: [number, number][];
  currentStep: 1 | 2 | 3 | 4;
  theme: Theme;
  selectedSize: PrintSize;
  posterStyle: PosterStyle;
  title: string;
  subtitle: string;
}

export interface PosterActions {
  setCoordinates: (coords: [number, number][]) => void;
  setCurrentStep: (step: 1 | 2 | 3 | 4) => void;
  setTheme: (theme: Theme) => void;
  setSelectedSize: (size: PrintSize) => void;
  setPosterStyle: (style: PosterStyle) => void;
  setTitle: (title: string) => void;
  setSubtitle: (subtitle: string) => void;
  nextStep: () => void;
  previousStep: () => void;
}

export function usePosterState(): PosterState & PosterActions {
  const [coordinates, setCoordinates] = useState<[number, number][]>([]);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [theme, setTheme] = useState<Theme>('light');
  const [selectedSize, setSelectedSize] = useState<PrintSize>('medium');
  const [posterStyle, setPosterStyle] = useState<PosterStyle>('classic');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');

  const nextStep = useCallback(() => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
    }
  }, [currentStep]);

  const previousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    }
  }, [currentStep]);

  return {
    coordinates,
    currentStep,
    theme,
    selectedSize,
    posterStyle,
    title,
    subtitle,
    setCoordinates,
    setCurrentStep,
    setTheme,
    setSelectedSize,
    setPosterStyle,
    setTitle,
    setSubtitle,
    nextStep,
    previousStep,
  };
}
