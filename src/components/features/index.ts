/**
 * @file index.ts
 * @description Export principal de features
 */

export * from './auth';
export * from './dashboard';
export * from './landing';
// Re-export onboarding excluding names that conflict with dashboard exports
export { EnhancedStep1Location } from './onboarding/components/steps/step-location';
export { EnhancedStep2Story } from './onboarding/components/steps/step-story';
export { EnhancedStep3Visual } from './onboarding/components/steps/step-visual';
export { EnhancedStep4Capacity } from './onboarding/components/steps/step-capacity';
export { EnhancedStep5Documents } from './onboarding/components/steps/step-documents';
export { EnhancedStep6Stripe } from './onboarding/components/steps/step-stripe';
export * from './registration';
