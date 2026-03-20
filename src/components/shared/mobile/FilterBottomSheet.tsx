/**
 * @component FilterBottomSheet
 * @description Bottom sheet de filtros estilo nativo para móvil.
 *              - z-[60] para estar sobre el BottomTabBar (z-50)
 *              - Estado draft interno: filtros se aplican SOLO al pulsar "Ver resultados"
 *              - onPointerDown con stopPropagation en el sheet para evitar que el overlay
 *                capture eventos de foco en inputs
 *              - Fechas apiladas verticalmente (full-width) para evitar overflow
 *
 * Tokens Origen v3.0.
 */

'use client';

import React, { useEffect, useState } from 'react';
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

// ─── ESTADO DRAFT INTERNO ─────────────────────────────────────────────────────

type DraftValue =
  | { type: 'chips'; value: string }
  | { type: 'daterange'; from: string; to: string }
  | { type: 'numberrange'; min: string; max: string };

type Draft = Record<string, DraftValue>;

function buildInitialDraft(sections: FilterSection[]): Draft {
  const d: Draft = {};
  sections.forEach((s) => {
    if (s.type === 'chips')       d[s.id] = { type: 'chips',       value: s.value };
    if (s.type === 'daterange')   d[s.id] = { type: 'daterange',   from: s.valueFrom, to: s.valueTo };
    if (s.type === 'numberrange') d[s.id] = { type: 'numberrange', min: s.valueMin,   max: s.valueMax };
  });
  return d;
}

function buildClearedDraft(sections: FilterSection[]): Draft {
  const d: Draft = {};
  sections.forEach((s) => {
    if (s.type === 'chips')       d[s.id] = { type: 'chips',       value: ''  };
    if (s.type === 'daterange')   d[s.id] = { type: 'daterange',   from: '', to: ''   };
    if (s.type === 'numberrange') d[s.id] = { type: 'numberrange', min: '',   max: '' };
  });
  return d;
}

// ─── SECCIÓN: CHIPS ───────────────────────────────────────────────────────────

function ChipsSection({
  section,
  draftValue,
  onDraftChange,
}: {
  section: FilterSection & { type: 'chips' };
  draftValue: string;
  onDraftChange: (value: string) => void;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-text-subtle uppercase tracking-wide mb-3">
        {section.title}
      </h3>
      {/* Carrusel horizontal — mismo patrón que apps nativas */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 scrollbar-none">
        {section.options.map((option) => {
          const isActive = draftValue === option.value;
          const Icon = option.icon;
          return (
            <motion.button
              key={option.value}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => onDraftChange(option.value)}
              className={cn(
                'flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border',
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
// Apiladas verticalmente para evitar overflow en pantallas ~375px

function DateRangeSection({
  section,
  from,
  to,
  onFromChange,
  onToChange,
}: {
  section: FilterSection & { type: 'daterange' };
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-text-subtle uppercase tracking-wide mb-3">
        {section.title}
      </h3>
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-[11px] text-text-subtle mb-1.5 block">Desde</label>
          <input
            type="date"
            value={from}
            onChange={(e) => onFromChange(e.target.value)}
            className="w-full h-11 px-3 text-sm border border-border-subtle bg-surface-alt rounded-xl focus:outline-none focus:ring-1 focus:ring-origen-pradera"
          />
        </div>
        <div>
          <label className="text-[11px] text-text-subtle mb-1.5 block">Hasta</label>
          <input
            type="date"
            value={to}
            onChange={(e) => onToChange(e.target.value)}
            className="w-full h-11 px-3 text-sm border border-border-subtle bg-surface-alt rounded-xl focus:outline-none focus:ring-1 focus:ring-origen-pradera"
          />
        </div>
      </div>
    </div>
  );
}

// ─── SECCIÓN: RANGO NUMÉRICO ──────────────────────────────────────────────────

function NumberRangeSection({
  section,
  min,
  max,
  onMinChange,
  onMaxChange,
}: {
  section: FilterSection & { type: 'numberrange' };
  min: string;
  max: string;
  onMinChange: (v: string) => void;
  onMaxChange: (v: string) => void;
}) {
  const inputCls = cn(
    'w-full h-11 text-sm border border-border-subtle bg-surface-alt rounded-xl',
    'focus:outline-none focus:ring-1 focus:ring-origen-pradera',
    section.prefix ? 'pl-7 pr-3' : 'px-3',
  );

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
              value={min}
              onChange={(e) => onMinChange(e.target.value)}
              placeholder="0"
              className={inputCls}
              min="0"
              inputMode="decimal"
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
              value={max}
              onChange={(e) => onMaxChange(e.target.value)}
              placeholder="∞"
              className={inputCls}
              min="0"
              inputMode="decimal"
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
  // ── Estado draft: se inicializa al abrir, se aplica al confirmar ──────────
  const [draft, setDraft] = useState<Draft>({});

  useEffect(() => {
    if (isOpen) {
      setDraft(buildInitialDraft(sections));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── Helpers de draft ──────────────────────────────────────────────────────
  const setChips = (id: string, value: string) =>
    setDraft((prev) => ({ ...prev, [id]: { type: 'chips', value } }));

  const setDateFrom = (id: string, from: string) =>
    setDraft((prev) => {
      const cur = prev[id] as { type: 'daterange'; from: string; to: string } | undefined;
      return { ...prev, [id]: { type: 'daterange', from, to: cur?.to ?? '' } };
    });

  const setDateTo = (id: string, to: string) =>
    setDraft((prev) => {
      const cur = prev[id] as { type: 'daterange'; from: string; to: string } | undefined;
      return { ...prev, [id]: { type: 'daterange', from: cur?.from ?? '', to } };
    });

  const setNumMin = (id: string, min: string) =>
    setDraft((prev) => {
      const cur = prev[id] as { type: 'numberrange'; min: string; max: string } | undefined;
      return { ...prev, [id]: { type: 'numberrange', min, max: cur?.max ?? '' } };
    });

  const setNumMax = (id: string, max: string) =>
    setDraft((prev) => {
      const cur = prev[id] as { type: 'numberrange'; min: string; max: string } | undefined;
      return { ...prev, [id]: { type: 'numberrange', min: cur?.min ?? '', max } };
    });

  // ── Aplicar: llama onChange del padre solo al confirmar ───────────────────
  const handleApply = () => {
    sections.forEach((s) => {
      const d = draft[s.id];
      if (!d) return;
      if (s.type === 'chips' && d.type === 'chips') {
        s.onChange(d.value);
      }
      if (s.type === 'daterange' && d.type === 'daterange') {
        s.onChangeFrom(d.from);
        s.onChangeTo(d.to);
      }
      if (s.type === 'numberrange' && d.type === 'numberrange') {
        s.onChangeMin(d.min);
        s.onChangeMax(d.max);
      }
    });
    onClose();
  };

  // ── Limpiar: resetea draft Y llama al padre ───────────────────────────────
  const handleClearAll = () => {
    setDraft(buildClearedDraft(sections));
    onClearAll();
    onClose();
  };

  // ── ¿Hay algo activo en el draft? ─────────────────────────────────────────
  const hasAnyActive = sections.some((s) => {
    const d = draft[s.id];
    if (!d) return false;
    if (d.type === 'chips')       return Boolean(d.value);
    if (d.type === 'daterange')   return Boolean(d.from || d.to);
    if (d.type === 'numberrange') return Boolean(d.min || d.max);
    return false;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay — z-[55] para estar sobre BottomTabBar (z-50) */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-[2px]"
            onPointerDown={onClose}
            aria-hidden
          />

          {/* Sheet — z-[60], pantalla completa para tapar header */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onPointerDown={(e) => e.stopPropagation()}
            className="fixed inset-0 z-[60] bg-surface flex flex-col"
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
                const d = draft[section.id];

                if (section.type === 'chips') {
                  const dv = (d?.type === 'chips' ? d.value : '') ?? '';
                  return (
                    <ChipsSection
                      key={section.id}
                      section={section}
                      draftValue={dv}
                      onDraftChange={(val) => setChips(section.id, val)}
                    />
                  );
                }

                if (section.type === 'daterange') {
                  const dd = d?.type === 'daterange' ? d : { from: '', to: '' };
                  return (
                    <DateRangeSection
                      key={section.id}
                      section={section}
                      from={dd.from}
                      to={dd.to}
                      onFromChange={(v) => setDateFrom(section.id, v)}
                      onToChange={(v) => setDateTo(section.id, v)}
                    />
                  );
                }

                if (section.type === 'numberrange') {
                  const dn = d?.type === 'numberrange' ? d : { min: '', max: '' };
                  return (
                    <NumberRangeSection
                      key={section.id}
                      section={section}
                      min={dn.min}
                      max={dn.max}
                      onMinChange={(v) => setNumMin(section.id, v)}
                      onMaxChange={(v) => setNumMax(section.id, v)}
                    />
                  );
                }

                return null;
              })}
            </div>

            {/* Footer CTA */}
            <div className="flex gap-3 px-5 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))] border-t border-border-subtle flex-shrink-0 bg-surface">
              {hasAnyActive && (
                <button
                  onClick={handleClearAll}
                  className="flex-1 h-12 rounded-2xl border-2 border-origen-pradera/40 text-sm font-medium text-origen-pradera active:scale-95 transition-transform"
                >
                  Limpiar todo
                </button>
              )}
              <button
                onClick={handleApply}
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
