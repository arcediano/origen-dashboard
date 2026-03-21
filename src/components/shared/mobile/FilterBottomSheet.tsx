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
            <button
              key={option.value}
              type="button"
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
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── SECCIÓN: RANGO DE FECHAS ─────────────────────────────────────────────────

const dateInputCls = [
  'w-full h-12 px-3 text-sm font-medium text-origen-bosque',
  'bg-surface border border-border-subtle rounded-xl',
  'focus:outline-none focus:ring-2 focus:ring-origen-pradera/25 focus:border-origen-pradera',
  'transition-colors',
  '[&::-webkit-calendar-picker-indicator]:opacity-40',
  '[&::-webkit-calendar-picker-indicator]:cursor-pointer',
  '[&::-webkit-calendar-picker-indicator]:hover:opacity-70',
].join(' ');

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
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-medium text-text-subtle mb-1.5 block tracking-wide uppercase">
            Desde
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => onFromChange(e.target.value)}
            className={dateInputCls}
          />
        </div>
        <div>
          <label className="text-[11px] font-medium text-text-subtle mb-1.5 block tracking-wide uppercase">
            Hasta
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => onToChange(e.target.value)}
            className={dateInputCls}
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
    'w-full h-12 text-sm font-medium text-origen-bosque border border-border-subtle bg-surface rounded-xl',
    'focus:outline-none focus:ring-2 focus:ring-origen-pradera/25 focus:border-origen-pradera transition-colors',
    section.prefix ? 'pl-7 pr-3' : 'px-3',
  );

  return (
    <div>
      <h3 className="text-xs font-semibold text-text-subtle uppercase tracking-wide mb-3">
        {section.title}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-medium text-text-subtle mb-1.5 block tracking-wide uppercase">Mínimo</label>
          <div className="relative">
            {section.prefix && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-text-subtle pointer-events-none">
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
          <label className="text-[11px] font-medium text-text-subtle mb-1.5 block tracking-wide uppercase">Máximo</label>
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

  // ── Bloquear scroll del body mientras el sheet está abierto ─────────────
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // ── Notificar al BottomTabBar para que se oculte mientras el sheet está abierto ──
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('filter-sheet:toggle', { detail: { open: isOpen } }),
    );
    return () => {
      if (isOpen) {
        window.dispatchEvent(
          new CustomEvent('filter-sheet:toggle', { detail: { open: false } }),
        );
      }
    };
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

  // ── Animación CSS pura — SIN transform (evita el bug iOS Safari) ──────────
  // Framer Motion aplica transform:translateY() como inline style permanente.
  // iOS Safari tiene un bug: overflow-y:auto en cualquier descendiente de un
  // elemento con transform inline no funciona. Solución: animar con la propiedad
  // CSS `bottom` en lugar de `transform`. Sin transform = sin bug.
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      // Doble rAF para que el DOM monte antes de disparar la transición CSS
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const id = setTimeout(() => setMounted(false), 380);
      return () => clearTimeout(id);
    }
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <>
      {/* ── Overlay ── */}
      <div
        className="fixed inset-0 z-[55] bg-black/50"
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.25s ease',
          pointerEvents: visible ? 'auto' : 'none',
        } as React.CSSProperties}
        onPointerDown={onClose}
        aria-hidden
      />

      {/* ── Bottom Sheet ─────────────────────────────────────────────────────
          CLAVE: animated via `bottom` CSS property, NOT `transform`.
          - Sin transform → sin bug iOS Safari con overflow-y en flex children.
          - flex flex-col funciona porque el contenedor NO tiene transform.
          - flex-1 + min-h-0 en la zona de scroll: patrón estándar que funciona
            correctamente cuando el padre flex no tiene transform activo.
          ───────────────────────────────────────────────────────────────────── */}
      <div
        className="fixed left-0 right-0 z-[60] bg-surface rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
        style={{
          height: '90vh',
          bottom: visible ? 0 : '-90vh',
          transition: 'bottom 0.38s cubic-bezier(0.32, 0.72, 0, 1)',
        } as React.CSSProperties}
        role="dialog"
        aria-modal
        aria-label={title}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
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

        {/* Zona de scroll — flex-1 + min-h-0 funciona sin transform en el padre */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 space-y-6"
          style={{ minHeight: 0, WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
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

        {/* Footer — flex-shrink-0, siempre visible al ser hermano del scroll */}
        <div
          className="flex gap-3 px-5 pt-4 border-t border-border-subtle bg-surface flex-shrink-0"
          style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' } as React.CSSProperties}
        >
          <button
            onClick={handleClearAll}
            disabled={!hasAnyActive}
            className={cn(
              'flex-1 h-12 rounded-2xl border-2 text-sm font-medium transition-all active:scale-95',
              hasAnyActive
                ? 'border-origen-bosque/40 text-origen-bosque hover:border-origen-bosque/70'
                : 'border-border text-text-subtle opacity-40 cursor-not-allowed',
            )}
          >
            Limpiar filtros
          </button>
          <button
            onClick={handleApply}
            className="flex-[2] h-12 rounded-2xl bg-origen-bosque text-white text-sm font-semibold active:scale-95 transition-all hover:bg-origen-pino"
          >
            {resultCount !== undefined
              ? `Ver ${resultCount} ${resultLabel}`
              : 'Aplicar filtros'}
          </button>
        </div>
      </div>
    </>
  );
}
