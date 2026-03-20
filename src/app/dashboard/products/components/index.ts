/**
 * @file index.ts
 * @description Exportaciones de todos los componentes de productos del dashboard
 */

// Componentes principales
export { ProductStats } from './ProductStats';
export { ProductFilters } from './ProductFilters';
export { ProductTable } from './ProductTable';
export { ProductTableActions } from './ProductTableActions';
export { ProductExpandableDetails } from './ProductExpandableDetails';
export { ProductCard } from './ProductCard';
export { ProductMobileList } from './ProductMobileList';
export { CreateProductProgress } from './CreateProductProgress';
export { CreateProductNavigation } from './CreateProductNavigation';
export { CreateProductCancelDialog } from './ProductDialogs/CreateProductCancelDialog';


// Diálogos
export { AdjustStockDialog } from './ProductDialogs/AdjustStockDialog';
export { DeleteProductDialog } from './ProductDialogs/DeleteProductDialog';
export { SuccessPublishModal } from './ProductDialogs/SuccessPublishModal';