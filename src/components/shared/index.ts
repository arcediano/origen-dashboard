/**
 * @file index.ts
 * @description Export de componentes compartidos
 */

// Error handling
export { PageError } from './error/page-error';
export type { PageErrorProps } from './error/page-error';

// Loading states
export { LoadingSpinner } from './loading/loading-spinner';
export { PageLoader } from './loading/page-loader';

// Upload
export { FileUpload } from './upload/file-upload';
export type { UploadedFile, FileUploadProps } from './upload/file-upload';
