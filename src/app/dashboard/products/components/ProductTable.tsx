/**
 * @file ProductTable.tsx
 * @description Tabla de productos con ordenación y filas expandibles
 */

'use client';

import React from 'react';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Table, type Column } from '@/components/ui/atoms/table';
import { StatusBadge } from '@/components/ui/atoms/badge';
import { ProductTableActions } from './ProductTableActions';
import { ProductExpandableDetails } from './ProductExpandableDetails';
import { type Product } from '@/types/product';

// ============================================================================
// TIPOS
// ============================================================================

export interface ProductTableProps {
  /** Lista de productos a mostrar */
  products: Product[];
  /** Función para ajustar stock */
  onAdjustStock: (product: Product) => void;
  /** Función para ver producto */
  onView: (id: string) => void;
  /** Función para editar producto */
  onEdit: (id: string) => void;
  /** Clase CSS adicional */
  className?: string;
  /** Si está cargando */
  isLoading?: boolean;
  /** Número de filas de carga */
  loadingRows?: number;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function ProductTable({
  products,
  onAdjustStock,
  onView,
  onEdit,
  className,
  isLoading = false,
  loadingRows = 5,
}: ProductTableProps) {
  // Columnas de la tabla
  const columns: Column<Product>[] = [
    {
      key: 'producto',
      header: 'Producto',
      accessor: (item) => (
        <div className="flex items-center gap-3">
          {/* Miniatura */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-origen-crema to-gray-100 flex items-center justify-center overflow-hidden shrink-0">
            {item.mainImage ? (
              <img
                src={item.mainImage.url}
                alt={item.mainImage.alt || item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="w-4 h-4 text-gray-400" />
            )}
          </div>
          {/* Nombre y SKU */}
          <div className="min-w-0">
            <p className="text-sm font-medium text-origen-bosque truncate max-w-[200px]" title={item.name}>
              {item.name}
            </p>
            <p className="text-xs text-gray-500 truncate">{item.sku}</p>
          </div>
        </div>
      ),
      sortable: true,
      sortValue: (item) => item.name,
    },
    {
      key: 'precio',
      header: 'Precio',
      accessor: (item) => (
        <div className="whitespace-nowrap">
          <span className="text-sm font-semibold text-origen-pradera">
            {item.basePrice.toFixed(2)}€
          </span>
          {item.comparePrice && item.comparePrice > item.basePrice && (
            <span className="text-xs text-gray-400 line-through ml-1">
              {item.comparePrice.toFixed(2)}€
            </span>
          )}
        </div>
      ),
      sortable: true,
      sortValue: (item) => item.basePrice,
    },
    {
      key: 'stock',
      header: 'Stock',
      accessor: (item) => {
        const stockColor = 
          item.stock === 0 ? 'bg-red-500' :
          item.lowStockThreshold && item.stock <= item.lowStockThreshold ? 'bg-amber-500' :
          'bg-green-500';

        return (
          <div className="flex items-center gap-2">
            <div className={cn('w-2 h-2 rounded-full', stockColor)} />
            <span className="text-sm font-medium">{item.stock}</span>
          </div>
        );
      },
      sortable: true,
      sortValue: (item) => item.stock,
    },
    {
      key: 'estado',
      header: 'Estado',
      accessor: (item) => <StatusBadge status={item.status} size="sm" />,
      sortable: true,
      sortValue: (item) => item.status,
    },
    {
      key: 'ventas',
      header: 'Ventas',
      accessor: (item) => (
        <span className="text-sm">{item.sales || 0}</span>
      ),
      sortable: true,
      sortValue: (item) => item.sales || 0,
    },
    {
      key: 'acciones',
      header: '',
      accessor: (item) => (
        <ProductTableActions
          product={item}
          onAdjustStock={onAdjustStock}
          onView={onView}
          onEdit={onEdit}
        />
      ),
      className: 'text-right',
    },
  ];

  return (
    <Table
      data={products}
      columns={columns}
      keyExtractor={(item) => item.id}
      sortable
      initialSortColumn="producto"
      initialSortDirection="asc"
      loading={isLoading}
      loadingRows={loadingRows}
      expandable={{
        renderExpand: (item) => (
          <ProductExpandableDetails
            product={item}
          />
        ),
      }}
      onRowClick={(item) => onView(item.id)}
      rowClassName="cursor-pointer hover:bg-origen-crema/30 transition-colors"
      className={className}
      emptyMessage="No hay productos para mostrar"
    />
  );
}