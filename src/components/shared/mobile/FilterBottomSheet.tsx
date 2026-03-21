/**
 * @component FilterBottomSheet
 * @description Panel de filtros a pantalla completa para móvil.
 *
 * ARQUITECTURA DEFINITIVA — dos elementos fixed independientes:
 *
 *  1. Sheet (z-60):  position:fixed, bottom:-100vh → bottom:0
 *     - Pantalla completa (100dvh/100vh).
 *     - Contenedor de scroll simple. Sin flex, sin grid, sin overflow:hidden.
 *     - padding-bottom reserva espacio para el footer.
 *
 *  2. Footer (z-62): position:fixed, bottom:0, SIEMPRE en el viewport.
 *     - Elemento completamente independiente del sheet.
 *     - Garantía absoluta: nunca puede quedar fuera de pantalla.
 *
 *  Sin Framer Motion, sin CSS transform → sin bug iOS Safari overflow.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface ChipOption {
  label: string;
  value: string;
  icon?: React.ElementType;
  count?: number;
}

export interface ToggleOption {
  id: string;
  label: string;
  icon?: React.ElementType;
  value: boolean;
  onChange: (value: boolean) => void;
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
    }
  | {
      type: 'toggles';
      id: string;
      title: string;
      options: ToggleOption[];
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

// ─── DRAFT STATE ──────────────────────────────────────────────────────────────

type DraftValue =
  | { type: 'chips'; value: string }
  | { type: 'daterange'; from: string; to: string }
  | { type: 'numberrange'; min: string; max: string }
  | { type: 'toggles'; values: Record<string, boolean> };

type Draft = Record<string, DraftValue>;

function buildDraft(sections: FilterSection[]): Draft {
  const d: Draft = {};
  sections.forEach((s) => {
    if (s.type === 'chips')       d[s.id] = { type: 'chips',       value: s.value };
    if (s.type === 'daterange')   d[s.id] = { type: 'daterange',   from: s.valueFrom, to: s.valueTo };
    if (s.type === 'numberrange') d[s.id] = { type: 'numberrange', min: s.valueMin,   max: s.valueMax };
    if (s.type === 'toggles')    d[s.id] = { type: 'toggles',     values: Object.fromEntries(s.options.map((o) => [o.id, o.value])) };
  });
  return d;
}

function clearDraft(sections: FilterSection[]): Draft {
  const d: Draft = {};
  sections.forEach((s) => {
    if (s.type === 'chips')       d[s.id] = { type: 'chips',       value: '' };
    if (s.type === 'daterange')   d[s.id] = { type: 'daterange',   from: '', to: '' };
    if (s.type === 'numberrange') d[s.id] = { type: 'numberrange', min: '',  max: '' };
    if (s.type === 'toggles')    d[s.id] = { type: 'toggles',     values: Object.fromEntries(s.options.map((o) => [o.id, false])) };
  });
  return d;
}

// ─── SECCIONES ────────────────────────────────────────────────────────────────

function ChipsSection({ section, value, onChange }: {
  section: FilterSection & { type: 'chips' };
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-text-subtle uppercase tracking-wide mb-3">
        {section.title}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 scrollbar-hide">
        {section.options.map((opt) => {
          const active = value === opt.value;
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                'flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border min-h-[44px] transition-colors',
                active
                  ? 'bg-origen-bosque border-origen-bosque text-white'
                  : 'bg-surface border-border-subtle text-origen-bosque',
              )}
            >
              {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
              {opt.label}
              {opt.count !== undefined && opt.count > 0 && (
                <span className={cn('text-xs font-bold', active ? 'text-white/70' : 'text-text-subtle')}>
                  {opt.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const dateInputCls = [
  'w-full h-12 px-3 text-sm font-medium text-origen-bosque',
  'bg-surface border border-border-subtle rounded-xl',
  'focus:outline-none focus:ring-2 focus:ring-origen-pradera/25 focus:border-origen-pradera transition-colors',
  '[&::-webkit-calendar-picker-indicator]:opacity-40',
].join(' ');

function DateRangeSection({ section, from, to, onFrom, onTo }: {
  section: FilterSection & { type: 'daterange' };
  from: string; to: string;
  onFrom: (v: string) => void; onTo: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-text-subtle uppercase tracking-wide mb-3">{section.title}</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-medium text-text-subtle mb-1.5 block uppercase tracking-wide">Desde</label>
          <input type="date" value={from} onChange={(e) => onFrom(e.target.value)} className={dateInputCls} />
        </div>
        <div>
          <label className="text-[10px] font-medium text-text-subtle mb-1.5 block uppercase tracking-wide">Hasta</label>
          <input type="date" value={to} onChange={(e) => onTo(e.target.value)} className={dateInputCls} />
        </div>
      </div>
    </div>
  );
}

function NumberRangeSection({ section, min, max, onMin, onMax }: {
  section: FilterSection & { type: 'numberrange' };
  min: string; max: string;
  onMin: (v: string) => void; onMax: (v: string) => void;
}) {
  const inputCls = cn(
    'w-full h-12 text-sm font-medium text-origen-bosque border border-border-subtle bg-surface rounded-xl',
    'focus:outline-none focus:ring-2 focus:ring-origen-pradera/25 focus:border-origen-pradera transition-colors',
    section.prefix ? 'pl-7 pr-3' : 'px-3',
  );
  return (
    <div>
      <p className="text-[11px] font-semibold text-text-subtle uppercase tracking-wide mb-3">{section.title}</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-medium text-text-subtle mb-1.5 block uppercase tracking-wide">Mínimo</label>
          <div className="relative">
            {section.prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-text-subtle pointer-events-none">{section.prefix}</span>}
            <input type="number" value={min} onChange={(e) => onMin(e.target.value)} placeholder="0" className={inputCls} min="0" inputMode="decimal" />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-medium text-text-subtle mb-1.5 block uppercase tracking-wide">Máximo</label>
          <div className="relative">
            {section.prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-subtle pointer-events-none">{section.prefix}</span>}
            <input type="number" value={max} onChange={(e) => onMax(e.target.value)} placeholder="∞" className={inputCls} min="0" inputMode="decimal" />
          </div>
        </div>
      </div>
    </div>
  );
}

function TogglesSection({ section, values, onToggle }: {
  section: FilterSection & { type: 'toggles' };
  values: Record<string, boolean>;
  onToggle: (optionId: string, value: boolean) => void;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-text-subtle uppercase tracking-wide mb-3">
        {section.title}
      </p>
      <div className="flex flex-col gap-1">
        {section.options.map((opt) => {
          const active = values[opt.id] ?? false;
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onToggle(opt.id, !active)}
              className={cn(
                'flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors min-h-[44px]',
                active
                  ? 'bg-origen-bosque/10 text-origen-bosque'
                  : 'bg-surface text-origen-bosque/70',
              )}
            >
              {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
              <span className="flex-1 text-left">{opt.label}</span>
              <div
                className={cn(
                  'w-10 h-6 rounded-full p-0.5 transition-colors',
                  active ? 'bg-origen-bosque' : 'bg-border',
                )}
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-full bg-white shadow-sm transition-transform',
                    active ? 'translate-x-4' : 'translate-x-0',
                  )}
                />
              </div>
            </button>
          );
        })}
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
  const [draft, setDraft] = useState<Draft>({});
  const [mounted, setMounted]   = useState(false);
  const [visible, setVisible]   = useState(false);

  // ── Sincronizar draft al abrir ────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) setDraft(buildDraft(sections));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── Animación: mounted controla si el DOM existe, visible dispara la transición CSS
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const id = setTimeout(() => setMounted(false), 380);
      return () => clearTimeout(id);
    }
  }, [isOpen]);

  // ── Bloquear scroll del body (iOS-safe) ──────────────────────────────────
  // iOS Safari ignora overflow:hidden en body. La técnica correcta es position:fixed + top:-scrollY.
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflowY = 'scroll'; // evita salto de scrollbar en desktop
    } else {
      const scrollY = Math.abs(parseInt(document.body.style.top || '0', 10));
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflowY = '';
      window.scrollTo(0, scrollY);
    }
    return () => {
      const scrollY = Math.abs(parseInt(document.body.style.top || '0', 10));
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflowY = '';
      if (scrollY) window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  // ── Notificar BottomTabBar ────────────────────────────────────────────────
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('filter-sheet:toggle', { detail: { open: isOpen } }));
    return () => {
      if (isOpen) window.dispatchEvent(new CustomEvent('filter-sheet:toggle', { detail: { open: false } }));
    };
  }, [isOpen]);

  // ── Helpers draft ─────────────────────────────────────────────────────────
  const setChips  = (id: string, v: string) =>
    setDraft((p) => ({ ...p, [id]: { type: 'chips', value: v } }));
  const setDateFrom = (id: string, v: string) =>
    setDraft((p) => { const c = p[id] as { type:'daterange'; from:string; to:string }|undefined; return { ...p, [id]: { type:'daterange', from:v, to:c?.to??'' } }; });
  const setDateTo = (id: string, v: string) =>
    setDraft((p) => { const c = p[id] as { type:'daterange'; from:string; to:string }|undefined; return { ...p, [id]: { type:'daterange', from:c?.from??'', to:v } }; });
  const setNumMin = (id: string, v: string) =>
    setDraft((p) => { const c = p[id] as { type:'numberrange'; min:string; max:string }|undefined; return { ...p, [id]: { type:'numberrange', min:v, max:c?.max??'' } }; });
  const setNumMax = (id: string, v: string) =>
    setDraft((p) => { const c = p[id] as { type:'numberrange'; min:string; max:string }|undefined; return { ...p, [id]: { type:'numberrange', min:c?.min??'', max:v } }; });
  const setToggle = (sectionId: string, optionId: string, v: boolean) =>
    setDraft((p) => { const c = p[sectionId] as { type:'toggles'; values:Record<string,boolean> }|undefined; return { ...p, [sectionId]: { type:'toggles', values: { ...c?.values, [optionId]: v } } }; });

  const handleApply = () => {
    sections.forEach((s) => {
      const d = draft[s.id];
      if (!d) return;
      if (s.type === 'chips' && d.type === 'chips') s.onChange(d.value);
      if (s.type === 'daterange' && d.type === 'daterange') { s.onChangeFrom(d.from); s.onChangeTo(d.to); }
      if (s.type === 'numberrange' && d.type === 'numberrange') { s.onChangeMin(d.min); s.onChangeMax(d.max); }
      if (s.type === 'toggles' && d.type === 'toggles') { s.options.forEach((opt) => opt.onChange(d.values[opt.id] ?? false)); }
    });
    onClose();
  };

  const handleClear = () => {
    setDraft(clearDraft(sections));
    onClearAll();
    onClose();
  };

  const hasActive = sections.some((s) => {
    const d = draft[s.id];
    if (!d) return false;
    if (d.type === 'chips')       return Boolean(d.value);
    if (d.type === 'daterange')   return Boolean(d.from || d.to);
    if (d.type === 'numberrange') return Boolean(d.min || d.max);
    if (d.type === 'toggles')    return Object.values(d.values).some(Boolean);
    return false;
  });

  // ── Transición CSS: animar top (más fiable que bottom+height en móvil) ───
  const transition = 'top 0.38s cubic-bezier(0.32, 0.72, 0, 1)';

  if (!mounted) return null;

  return createPortal(
    <>
      {/* ── Overlay ── */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 55,
          backgroundColor: 'rgba(0,0,0,0.5)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.25s ease',
          pointerEvents: visible ? 'auto' : 'none',
        }}
        onPointerDown={onClose}
        aria-hidden
      />

      {/* ── Sheet (pantalla completa, flex column) ──────────────────────────
          Usa display:flex para que el footer sea parte del layout y siempre
          quede visible en la parte inferior sin trucos de z-index.
          - top animado: 100% (oculto) → 0 (visible)
          - overflow:hidden en el contenedor; scroll solo en el área de contenido
          ─────────────────────────────────────────────────────────────────── */}
      <div
        role="dialog"
        aria-modal
        aria-label={title}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: visible ? 0 : '100%',
          left: 0, right: 0, bottom: 0,
          zIndex: 60,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'hsl(var(--surface))',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          transition,
        } as React.CSSProperties}
      >
        {/* Header */}
        <div style={{ flexShrink: 0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderBottom:'1px solid hsl(var(--border-subtle))' }}>
          <h2 style={{ fontSize:16, fontWeight:600, color:'hsl(var(--bosque))' }}>{title}</h2>
          <button
            onClick={onClose}
            style={{ width:32, height:32, borderRadius:9999, backgroundColor:'hsl(var(--surface-alt))', display:'flex', alignItems:'center', justifyContent:'center', border:'none', cursor:'pointer' }}
            aria-label="Cerrar filtros"
          >
            <X style={{ width:16, height:16, color:'hsl(var(--hoja))' }} />
          </button>
        </div>

        {/* Secciones de filtros — área scrollable */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
          <div style={{ padding:'20px', display:'flex', flexDirection:'column', gap:24 }}>
            {sections.map((section) => {
              const d = draft[section.id];

              if (section.type === 'chips') {
                return (
                  <ChipsSection
                    key={section.id}
                    section={section}
                    value={(d?.type === 'chips' ? d.value : '') ?? ''}
                    onChange={(v) => setChips(section.id, v)}
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
                    onFrom={(v) => setDateFrom(section.id, v)}
                    onTo={(v) => setDateTo(section.id, v)}
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
                    onMin={(v) => setNumMin(section.id, v)}
                    onMax={(v) => setNumMax(section.id, v)}
                  />
                );
              }
              if (section.type === 'toggles') {
                const dt = d?.type === 'toggles' ? d.values : {};
                return (
                  <TogglesSection
                    key={section.id}
                    section={section}
                    values={dt}
                    onToggle={(optId, v) => setToggle(section.id, optId, v)}
                  />
                );
              }
              return null;
            })}
          </div>
        </div>

        {/* Footer — parte del flex layout, siempre al fondo */}
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            gap: 12,
            padding: '16px 20px',
            paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
            backgroundColor: 'hsl(var(--surface))',
            borderTop: '1px solid hsl(var(--border-subtle))',
          } as React.CSSProperties}
        >
          <button
            onClick={handleClear}
            disabled={!hasActive}
            className={cn(
              'flex-1 h-12 rounded-2xl border-2 text-sm font-medium transition-all active:scale-95',
              hasActive
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
            {resultCount !== undefined ? `Ver ${resultCount} ${resultLabel}` : 'Aplicar filtros'}
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
