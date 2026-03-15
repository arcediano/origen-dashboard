/**
 * @file index.ts
 * @description Export de componentes de onboarding
 */

// Steps
export { default as StepLocation } from './components/steps/step-location';
export type { EnhancedLocationData } from './components/steps/step-location';

export { default as StepStory } from './components/steps/step-story';
export type { EnhancedStoryData, Certification } from './components/steps/step-story';

export { default as StepVisual } from './components/steps/step-visual';
export type { EnhancedVisualData } from './components/steps/step-visual';

export { default as StepCapacity } from './components/steps/step-capacity';
export type { EnhancedCapacityData } from './components/steps/step-capacity';

export { default as StepDocuments } from './components/steps/step-documents';
export type { EnhancedStep5DocumentsData } from './components/steps/step-documents';

export { default as StepStripe } from './components/steps/step-stripe';
export type { EnhancedStep6StripeData } from './components/steps/step-stripe';
