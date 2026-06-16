/**
 * @file index.ts
 * @description Exportaciones de componentes compartidos.
 *
 * Nota: PageLoader y PageError se han promovido a @arcediano/ux-library
 * y deben importarse de allí en lugar de aquí.
 */

// Loading states
export { Spinner, SectionLoader, LoadingSkeleton, LoadingSpinner } from './loading/loading-spinner';
export type { SpinnerProps, SectionLoaderProps, LoadingSkeletonProps, SpinnerSize, SpinnerVariant } from './loading/loading-spinner';

// Upload
export { FileUpload } from './upload/file-upload';
export type { UploadedFile, FileUploadProps } from './upload/file-upload';

// Category card
export { CategoryCard, getCategoryIcon } from './category-card';
export type { CategoryCardProps } from './category-card';

// Mobile components
export { ScrollChipFilter, MobileStatCard, MobileKPIRow, EmptyState, SectionTitle } from './mobile';
export type { ChipItem, StatCardAccent, MobileStatCardProps, KpiItem, MobileKPIRowProps, EmptyStateProps, SectionTitleProps } from './mobile';

// Stat cards
export { SoftStatCard } from './SoftStatCard';
export type { SoftStatCardProps } from './SoftStatCard';
