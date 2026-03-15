/**
 * @file Pagination.tsx
 * @description Componente de paginación reutilizable - VERSIÓN RESPONSIVE
 */

'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/atoms/button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageInfo?: boolean;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showPageInfo = true,
  className,
}: PaginationProps) {
  return (
    <div className={cn('flex items-center justify-center gap-2 sm:gap-3', className)}>
      {/* Botón anterior */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-9 w-9 sm:h-10 sm:w-10 p-0 rounded-lg border-2 hover:border-origen-pradera"
        aria-label="Página anterior"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
      </Button>

      {/* Información de página */}
      {showPageInfo && (
        <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white rounded-lg border border-gray-200 text-sm sm:text-base">
          <span className="font-medium text-origen-bosque">{currentPage}</span>
          <span className="text-gray-400 mx-1">/</span>
          <span className="text-gray-500">{totalPages}</span>
        </div>
      )}

      {/* Botón siguiente */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-9 w-9 sm:h-10 sm:w-10 p-0 rounded-lg border-2 hover:border-origen-pradera"
        aria-label="Página siguiente"
      >
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
      </Button>
    </div>
  );
}