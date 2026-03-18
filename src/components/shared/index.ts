/**
 * @file index.ts
 * @description Exportaciones de componentes compartidos.
 */

// Error handling
export { PageError } from './error/page-error';
export type { PageErrorProps } from './error/page-error';

// Loading states
export { Spinner, SectionLoader, LoadingSkeleton, LoadingSpinner } from './loading/loading-spinner';
export type { SpinnerProps, SectionLoaderProps, LoadingSkeletonProps, SpinnerSize, SpinnerVariant } from './loading/loading-spinner';
export { PageLoader } from './loading/page-loader';
export type { PageLoaderProps } from './loading/page-loader';

// Upload
export { FileUpload } from './upload/file-upload';
export type { UploadedFile, FileUploadProps } from './upload/file-upload';

// Category card
export { CategoryCard, getCategoryIcon } from './category-card';
export type { CategoryCardProps } from './category-card';
