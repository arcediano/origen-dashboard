/**
 * @component FilterBottomSheet
 * @description Bottom sheet de filtros estilo nativo para móvil.
 *              Sube desde abajo con animación spring, overlay semitransparente.
 *              Soporta secciones: chips (selección táctil), daterange y numberrange.
 *
 * Tokens Origen v3.0.
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface ChipOption {
  label: string;
  value: string;
  icon?: React.ElementType;
  count?: number;
}

export type FilterSection =
  | {
      type: 'chips';
      id: string;
      title: string;
      options: ChipOption[];
      value: string;
      onChange: (value: string) => void;
    }
  | {
      type: 'daterange';
      id: string;
      title: string;
      valueFrom: string;
      valueTo: string;
      onChangeFrom: (value: string) => void;
      onChangeTo: (value: string) => void;
    }
  | {
      type: 'numberrange';
      id: string;
      title: string;
      valueMin: string;
      valueMax: string;
      onChangeMin: (value: string) => void;
      onChangeMax: (value: string) => void;
      prefix?: string;
    };

export interface FilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  sections: FilterSection[];
  onClearAll: () => void;
  resultCount?: number;
  resultLabel?: string;
  title?: string;
}

// ─── SECCIÓN: CHIPS ───────────────────────────────────────────────────────────

function ChipsSection({ section }: { section: FilterSection & { type: 'chips' } }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-text-subtle uppercase tracking-wide mb-3">
        {section.title}
      </h3>
      <div className="flex flex-wrap gap-2">
        {section.options.map((option) => {
          const isActive = section.value === option.value;
          const Icon = option.icon;
          return (
            <motion.button
              key={option.value}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => section.onChange(option.value)}
              className={cn(
                'inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border',
                'min-h-[44px] transition-colors duration-150',
                isActive
                  ? 'bg-origen-bosque border-origen-bosque text-white'
                  : 'bg-surface-alt border-border-subtle text-origen-bosque hover:border-origen-pradera/50',
              )}
            >
              {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
              {option.label}
              {option.count !== undefined && option.count > 0 && (
                <span className={cn(
                  'text-xs font-bold',
                  isActive ? 'text-white/70' : 'text-text-subtle',
                )}>
                  {option.count}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ─── SECCIÓN: RANGO DE FECHAS ─────────────────────────────────────────────────

function DateRangeSection({ section }: { section: FilterSection & { type: 'daterange' } }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-text-subtle uppercase tracking-wide mb-3">
        {section.title}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] text-text-subtle mb-1.5 block">Desde</label>
          <input
            type="date"
            value={section.valueFrom}
            onChange={(e) => section.onChangeFrom(e.target.value)}
            className="w-full h-11 px-3 text-sm border border-border-subtle bg-surface-alt rounded-xl focus:outline-none focus:ring-1 focus:ring-origen-pradera"
          />
        </div>
        <div>
          <label className="text-[11px] text-text-subtle mb-1.5 block">Hasta</label>
          <input
            type="date"
            value={section.valueTo}
            onChange={(e) => section.onChangeTo(e.target.value)}
            className="w-full h-11 px-3 text-sm border border-border-subtle bg-surface-alt rounded-xl focus:outline-none focus:ring-1 focus:ring-origen-pradera"
          />
        </div>
      </div>
    </div>
  );
}

// ─── SECCIÓN: RANGO NUMÉRICO ──────────────────────────────────────────────────

function NumberRangeSection({ section }: { section: FilterSection & { type: 'numberrange' } }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-text-subtle uppercase tracking-wide mb-3">
        {section.title}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] text-text-subtle mb-1.5 block">Mínimo</label>
          <div className="relative">
            {section.prefix && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-subtle pointer-events-none">
                {section.prefix}
              </span>
            )}
            <input
              type="number"
              value={section.valueMin}
              onChange={(e) => section.onChangeMin(e.target.value)}
              placeholder="0"
              className={cn(
                'w-full h-11 text-sm border border-border-subtle bg-surface-alt rounded-xl',
                'focus:outline-none focus:ring-1 focus:ring-origen-pradera',
                section.prefix ? 'pl-7 pr-3' : 'px-3',
              )}
              min="0"
            />
          </div>
        </div>
        <div>
          <label className="text-[11px] text-text-subtle mb-1.5 block">Máximo</label>
          <div className="relative">
            {section.prefix && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-subtle pointer-events-none">
                {section.prefix}
              </span>
            )}
            <input
              type="number"
              value={section.valueMax}
              onChange={(e) => section.onChangeMax(e.target.value)}
              placeholder="∞"
              className={cn(
                'w-full h-11 text-sm border border-border-subtle bg-surface-alt rounded-xl',
                'focus:outline-none focus:ring-1 focus:ring-origen-pradera',
                section.prefix ? 'pl-7 pr-3' : 'px-3',
              )}
              min="0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export function FilterBottomSheet({
  isOpen,
  onClose,
  sections,
  onClearAll,
  resultCount,
  resultLabel = 'resultados',
  title = 'Filtros',
}: FilterBottomSheetProps) {
  const hasAnyActive = sections.some((s) => {
    if (s.type === 'chips') return Boolean(s.value);
    if (s.type === 'daterange') return Boolean(s.valueFrom || s.valueTo);
    if (s.type === 'numberrange') return Boolean(s.valueMin || s.valueMax);
    return false;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
            aria-hidden
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl shadow-2xl max-h-[85dvh] flex flex-col"
            role="dialog"
            aria-modal
            aria-label={title}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle flex-shrink-0">
              <h2 className="text-base font-semibold text-origen-bosque">{title}</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-surface-alt flex items-center justify-center active:scale-95 transition-transform"
                aria-label="Cerrar filtros"
              >
                <X className="w-4 h-4 text-text-subtle" />
              </button>
            </div>

            {/* Content — scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 space-y-6">
              {sections.map((section) => {
                if (section.type === 'chips')       return <ChipsSection       key={section.id} section={section} />;
                if (section.type === 'daterange')   return <DateRangeSection   key={section.id} section={section} />;
                if (section.type === 'numberrange') return <NumberRangeSection key={section.id} section={section} />;
                return null;
              })}
            </div>

            {/* Footer CTA */}
            <div className="flex gap-3 px-5 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] border-t border-border-subtle flex-shrink-0 bg-surface">
              {hasAnyActive && (
                <button
                  onClick={onClearAll}
                  className="flex-1 h-12 rounded-2xl border-2 border-origen-pradera/40 text-sm font-medium text-origen-pradera active:scale-95 transition-transform"
                >
                  Limpiar todo
                </button>
              )}
              <button
                onClick={onClose}
                className={cn(
                  'h-12 rounded-2xl bg-origen-pradera text-white text-sm font-semibold active:scale-95 transition-transform',
                  hasAnyActive ? 'flex-[2]' : 'flex-1',
                )}
              >
                {resultCount !== undefined
                  ? `Ver ${resultCount} ${resultLabel}`
                  : 'Aplicar filtros'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
