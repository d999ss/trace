'use client';

import { Suspense } from 'react';
import { PreviewContent } from './components/PreviewContent';

export default function Preview() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <PreviewContent />
    </Suspense>
  );
}