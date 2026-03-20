/**
 * @file page.tsx
 * @description Página principal del catálogo de productos
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, type Variants } from 'framer-motion';
import { Package, Plus, RefreshCw } from 'lucide-react';

// Componentes UI
import { Button } from '@/components/ui/atoms/button';
import { PageLoader } from '@/components/shared/loading/page-loader';
import { PageError } from '@/components/shared/error/page-error';
import { Card } from '@/components/ui/atoms/card'
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { Pagination } from '@/components/ui/atoms/pagination';
import { ProductStats, ProductFilters, ProductTable, ProductCard, ProductMobileList } from './components';
import { AdjustStockDialog } from './components/ProductDialogs/AdjustStockDialog';
import { DeleteProductDialog } from './components/ProductDialogs/DeleteProductDialog';

// Hooks y APIs
import { useProductFilters } from '@/hooks/useProductFilters';
import { fetchProducts, fetchProductStats } from '@/lib/api/products';
import { type Product } from '@/types/product';

// ============================================================================
// ANIMACIONES
// ============================================================================

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { 
      staggerChildren: 0.05,
      delayChildren: 0.1
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring",
      stiffness: 300, 
      damping: 25
    },
  },
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function ProductosPage() {
  const router = useRouter();

  // Estado de datos
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    lowStock: 0,
    outOfStock: 0,
    totalRevenue: 0,
    avgRating: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Estado de diálogos
  const [adjustStockDialogOpen, setAdjustStockDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Hook de filtros
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    selectedStock,
    setSelectedStock,
    sortBy,
    setSortBy,
    currentPage,
    setCurrentPage,
    filteredProducts,
    totalPages,
    paginatedProducts,
    hasFilters,
    clearFilters,
  } = useProductFilters(products);

  // ==========================================================================
  // CARGA DE DATOS
  // ==========================================================================

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [productsResponse, statsResponse] = await Promise.all([
        fetchProducts(),
        fetchProductStats()
      ]);

      if (productsResponse.error) {
        setError(productsResponse.error);
      } else if (productsResponse.data) {
        setProducts(productsResponse.data.items);
      }

      if (statsResponse.data) {
        setStats(statsResponse.data);
      }
    } catch (err) {
      setError('Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleNewProduct = () => router.push('/dashboard/products/create');
  const handleEdit = (id: string) => router.push(`/dashboard/products/${id}/edit`);
  const handleView = (id: string) => router.push(`/dashboard/products/${id}`);

  const handleAdjustStock = (product: Product) => {
    setSelectedProduct(product);
    setAdjustStockDialogOpen(true);
  };

  const handleConfirmAdjustStock = (productId: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, stock: newStock, status: newStock > 0 ? 'active' : 'out_of_stock' }
          : p
      )
    );
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (isLoading) {
    return <PageLoader message="Cargando productos..." />;
  }

  if (error) {
    return (
      <PageError
        title="Error al cargar"
        message={error}
        onRetry={loadData}
      />
    );
  }

  return (
    <>
      <div className="min-h-screen bg-surface">

        {/* Cabecera */}
        <PageHeader
          title="Mi catálogo"
          description={`${filteredProducts.length} productos en total`}
          badgeIcon={Package}
          badgeText="Gestión de productos"
          tooltip="Catálogo de productos"
          tooltipDetailed="Administra todos tus productos, su stock y visibilidad desde esta sección."
          actions={
            <Button
              onClick={handleNewProduct}
            >
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nuevo producto
              </span>
            </Button>
          }
        />

        {/* Contenido principal */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 space-y-5 sm:space-y-6 lg:space-y-8"
        >
          {/* Estadísticas */}
          <motion.div variants={itemVariants}>
            <ProductStats
              total={stats.total}
              active={stats.active}
              lowStock={stats.lowStock}
              outOfStock={stats.outOfStock}
              totalRevenue={stats.totalRevenue}
              avgRating={stats.avgRating}
            />
          </motion.div>

          {/* Filtros */}
          <motion.div variants={itemVariants}>
            <ProductFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              selectedStock={selectedStock}
              onStockChange={setSelectedStock}
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              totalProducts={filteredProducts.length}
              onClearFilters={clearFilters}
            />
          </motion.div>

          {/* Resultados */}
          <motion.div variants={itemVariants}>
            {filteredProducts.length === 0 ? (
              <Card className="py-8 sm:p-12 bg-surface-alt border border-border-subtle">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-origen-pastel flex items-center justify-center mb-3 sm:mb-4">
                    <Package className="w-8 h-8 text-origen-pradera" />
                  </div>
                  <h3 className="text-lg font-semibold text-origen-bosque mb-2">
                    No hay productos
                  </h3>
                  <p className="text-sm text-text-subtle max-w-md mb-6">
                    {hasFilters
                      ? 'No se encontraron productos con los filtros seleccionados.'
                      : 'Comienza añadiendo tu primer producto.'}
                  </p>
                  {hasFilters ? (
                    <Button onClick={clearFilters}>
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Limpiar filtros
                      </span>
                    </Button>
                  ) : (
                    <Button onClick={handleNewProduct}>
                      <span className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Nuevo producto
                      </span>
                    </Button>
                  )}
                </div>
              </Card>
            ) : (
              <>
                {/* ── MOBILE list (< lg) ── */}
                <ProductMobileList
                  products={paginatedProducts}
                  onView={handleView}
                  onEdit={handleEdit}
                  isLoading={isLoading}
                  className="block lg:hidden"
                />

                {/* ── DESKTOP: grid / table (≥ lg) ── */}
                {viewMode === 'grid' ? (
                  <div className="hidden lg:grid grid-cols-3 xl:grid-cols-4 gap-4">
                    {paginatedProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAdjustStock={handleAdjustStock}
                        onView={handleView}
                        onEdit={handleEdit}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="hidden lg:block">
                    <ProductTable
                      products={paginatedProducts}
                      onAdjustStock={handleAdjustStock}
                      onView={handleView}
                      onEdit={handleEdit}
                      isLoading={isLoading}
                    />
                  </div>
                )}

                {/* Paginación */}
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    className="mt-6"
                  />
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Diálogos */}
      <AdjustStockDialog
        open={adjustStockDialogOpen}
        onOpenChange={setAdjustStockDialogOpen}
        product={selectedProduct}
        onConfirm={handleConfirmAdjustStock}
      />

      <DeleteProductDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        product={selectedProduct}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}