/**
 * @file ProductTable.tsx
 * @description Tabla de productos con ordenación y filas expandibles
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Table, type Column } from '@arcediano/ux-library';
import { StatusBadge } from '@arcediano/ux-library';
import { ProductImage } from '@arcediano/ux-library';
import { ProductTableActions } from './ProductTableActions';
import { ProductExpandableDetails } from './ProductExpandableDetails';
import { type Product } from '@/types/product';

// ============================================================================
// TIPOS
// ============================================================================

export interface ProductTableProps {
  products: Product[];
  onAdjustStock: (product: Product) => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onStatusChange?: (product: Product, newStatus: 'draft' | 'pending_approval') => void;
  className?: string;
  isLoading?: boolean;
  loadingRows?: number;
}

// ============================================================================
// CELDA DE PRODUCTO
// ============================================================================

function ProductCell({ item }: { item: Product }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-origen-crema to-origen-crema/30 overflow-hidden shrink-0">
        <ProductImage src={item.mainImage?.url} alt={item.mainImage?.alt || item.name} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-origen-bosque truncate max-w-[200px]" title={item.name}>
          {item.name}
        </p>
        <p className="text-xs text-muted-foreground truncate">{item.sku}</p>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function ProductTable({
  products,
  onAdjustStock,
  onView,
  onEdit,
  onStatusChange,
  className,
  isLoading = false,
  loadingRows = 5,
}: ProductTableProps) {
  const columns: Column<Product>[] = [
    {
      key: 'producto',
      header: 'Producto',
      accessor: (item) => <ProductCell item={item} />,
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
            <span className="text-xs text-text-subtle line-through ml-1">
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
          item.stock === 0 ? 'bg-feedback-danger' :
          item.lowStockThreshold && item.stock <= item.lowStockThreshold ? 'bg-amber-500' :
          'bg-feedback-success';
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
      accessor: (item) => <span className="text-sm">{item.sales || 0}</span>,
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
          onStatusChange={onStatusChange}
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
        renderExpand: (item) => <ProductExpandableDetails product={item} />,
      }}
      onRowClick={(item) => onView(item.id)}
      rowClassName="cursor-pointer hover:bg-origen-crema/30 transition-colors"
      className={className}
      emptyMessage="No hay productos para mostrar"
    />
  );
}



