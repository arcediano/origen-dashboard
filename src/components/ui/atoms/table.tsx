/**
 * @file table.tsx
 * @description Componente de tabla responsive con scroll horizontal en móvil - CORREGIDO
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronRight } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  accessor: (item: T) => React.ReactNode;
  sortable?: boolean;
  sortValue?: (item: T) => string | number;
  className?: string;
  headerClassName?: string;
  width?: string;
  /** Ocultar en móvil */
  hideOnMobile?: boolean;
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  className?: string;
  emptyMessage?: string;
  loading?: boolean;
  loadingRows?: number;
  sortable?: boolean;
  initialSortColumn?: string;
  initialSortDirection?: 'asc' | 'desc';
  rowClassName?: string | ((item: T) => string);
  expandable?: {
    renderExpand: (item: T) => React.ReactNode;
  };
}

export function Table<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  className,
  emptyMessage = 'No hay datos para mostrar',
  loading = false,
  loadingRows = 5,
  sortable = true,
  initialSortColumn,
  initialSortDirection = 'asc',
  rowClassName,
  expandable,
}: TableProps<T>) {
  const [sortColumn, setSortColumn] = React.useState<string | undefined>(initialSortColumn);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(initialSortDirection);
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

  const handleSort = (column: Column<T>) => {
    if (!sortable || !column.sortable) return;

    if (sortColumn === column.key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column.key);
      setSortDirection('asc');
    }
  };

  const toggleRowExpand = (rowKey: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowKey)) {
        newSet.delete(rowKey);
      } else {
        newSet.add(rowKey);
      }
      return newSet;
    });
  };

  const getSortIcon = (column: Column<T>) => {
    if (!sortable || !column.sortable) return null;

    if (sortColumn !== column.key) {
      return <ChevronsUpDown className="w-4 h-4 ml-1 text-gray-400 flex-shrink-0" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4 ml-1 text-origen-pradera flex-shrink-0" />
      : <ChevronDown className="w-4 h-4 ml-1 text-origen-pradera flex-shrink-0" />;
  };

  const sortedData = React.useMemo(() => {
    if (!sortColumn) return data;

    const column = columns.find(c => c.key === sortColumn);
    if (!column || !column.sortable || !column.sortValue) return data;

    return [...data].sort((a, b) => {
      const aVal = column.sortValue!(a);
      const bVal = column.sortValue!(b);

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      
      return sortDirection === 'asc' 
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }, [data, sortColumn, sortDirection, columns]);

  const LoadingRow = () => (
    <tr className="animate-pulse">
      {columns.map((_, idx) => (
        <td key={idx} className="px-2 sm:px-4 py-2 sm:py-3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );

  const getRowClassName = (item: T) => {
    if (typeof rowClassName === 'function') {
      return rowClassName(item);
    }
    return rowClassName || '';
  };

  return (
    <div className={cn('bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100', className)}>
      {/* Contenedor con scroll horizontal en móvil */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] md:min-w-full">{/* Ancho mínimo para móvil */}
          {/* Cabecera */}
          <thead className="bg-origen-crema border-b-2 border-origen-pradera/30">
            <tr>
              {expandable && <th className="w-10 px-2 py-3 sm:py-4" />}
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{ width: column.width }}
                  className={cn(
                    'px-2 sm:px-4 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-origen-bosque uppercase tracking-wider',
                    column.sortable && sortable && 'cursor-pointer hover:text-origen-pradera transition-colors',
                    column.hideOnMobile && 'hidden md:table-cell',
                    column.headerClassName
                  )}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center">
                    <span className="truncate">{column.header}</span>
                    {getSortIcon(column)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Cuerpo */}
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: loadingRows }).map((_, idx) => (
                <LoadingRow key={idx} />
              ))
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (expandable ? 1 : 0)} className="px-4 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-origen-crema flex items-center justify-center mb-3">
                      <span className="text-origen-pradera text-lg">📦</span>
                    </div>
                    <p className="text-sm font-medium text-gray-700">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedData.map((item, index) => {
                const rowKey = keyExtractor(item);
                const isExpanded = expandedRows.has(rowKey);

                return (
                  <React.Fragment key={rowKey}>
                    {/* Fila principal */}
                    <tr
                      className={cn(
                        'transition-all duration-200',
                        index % 2 === 0 ? 'bg-white' : 'bg-origen-crema/5',
                        onRowClick && 'cursor-pointer hover:bg-origen-crema/20',
                        isExpanded && 'bg-origen-crema/20 border-l-4 border-origen-pradera',
                        getRowClassName(item)
                      )}
                      onClick={() => onRowClick?.(item)}
                    >
                      {/* Botón expandir */}
                      {expandable && (
                        <td className="px-2 py-2 sm:py-3">
                          <button
                            onClick={(e) => toggleRowExpand(rowKey, e)}
                            className={cn(
                              'w-6 h-6 rounded-md flex items-center justify-center transition-all',
                              isExpanded 
                                ? 'bg-origen-pradera text-white' 
                                : 'text-gray-500 hover:text-origen-pradera hover:bg-origen-pradera/10'
                            )}
                            aria-label={isExpanded ? 'Contraer' : 'Expandir'}
                          >
                            <ChevronRight className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-90')} />
                          </button>
                        </td>
                      )}

                      {/* Celdas de datos */}
                      {columns.map((column) => (
                        <td
                          key={`${rowKey}-${column.key}`}
                          className={cn(
                            'px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm',
                            column.hideOnMobile && 'hidden md:table-cell',
                            column.className
                          )}
                        >
                          {column.accessor(item)}
                        </td>
                      ))}
                    </tr>

                    {/* Fila expandida */}
                    {expandable && isExpanded && (
                      <tr className="bg-gradient-to-br from-origen-crema/20 to-white border-y-2 border-origen-pradera/20">
                        <td colSpan={columns.length + 1} className="p-3 sm:p-6">
                          <div className="text-sm sm:text-base">
                            {expandable.renderExpand(item)}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}