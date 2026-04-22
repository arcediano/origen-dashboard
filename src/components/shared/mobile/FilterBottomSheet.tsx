/**
 * @component FilterBottomSheet
 * @description Panel de filtros a pantalla completa para móvil.
 *              Usa FilterBottomSheet de @arcediano/ux-library como contenedor
 *              y añade la lógica de secciones y estado draft específica del dashboard.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { FilterBottomSheet as FilterPanel, DateRangeInput } from '@arcediano/ux-library';
import { cn } from '@/lib/utils';

// ─── TIPOS ───────────────────────────────────────────────────────────────────

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

// ─── DRAFT STATE ─────────────────────────────────────────────────────────────

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

// ─── SECCIONES ───────────────────────────────────────────────────────────────

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

function DateRangeSection({ section, from, to, onFrom, onTo }: {
  section: FilterSection & { type: 'daterange' };
  from: string; to: string;
  onFrom: (v: string) => void; onTo: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-text-subtle uppercase tracking-wide mb-3">{section.title}</p>
      <DateRangeInput
        labelFrom="Desde"
        labelTo="Hasta"
        valueFrom={from}
        valueTo={to}
        onChangeFrom={onFrom}
        onChangeTo={onTo}
        inputSize="md"
      />
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <div className={cn('w-10 h-6 rounded-full p-0.5 transition-colors', active ? 'bg-origen-bosque' : 'bg-border')}>
                <div className={cn('w-5 h-5 rounded-full bg-white shadow-sm transition-transform', active ? 'translate-x-4' : 'translate-x-0')} />
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

  // Sincronizar draft al abrir
  useEffect(() => {
    if (isOpen) setDraft(buildDraft(sections));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Notificar BottomTabBar (comportamiento específico del dashboard)
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('filter-sheet:toggle', { detail: { open: isOpen } }));
    return () => {
      if (isOpen) window.dispatchEvent(new CustomEvent('filter-sheet:toggle', { detail: { open: false } }));
    };
  }, [isOpen]);

  // ─── Helpers draft ──────────────────────────────────────────────────────────
  const setChips    = (id: string, v: string) =>
    setDraft((p) => ({ ...p, [id]: { type: 'chips', value: v } }));
  const setDateFrom = (id: string, v: string) =>
    setDraft((p) => { const c = p[id] as { type:'daterange'; from:string; to:string }|undefined; return { ...p, [id]: { type:'daterange', from:v, to:c?.to??'' } }; });
  const setDateTo   = (id: string, v: string) =>
    setDraft((p) => { const c = p[id] as { type:'daterange'; from:string; to:string }|undefined; return { ...p, [id]: { type:'daterange', from:c?.from??'', to:v } }; });
  const setNumMin   = (id: string, v: string) =>
    setDraft((p) => { const c = p[id] as { type:'numberrange'; min:string; max:string }|undefined; return { ...p, [id]: { type:'numberrange', min:v, max:c?.max??'' } }; });
  const setNumMax   = (id: string, v: string) =>
    setDraft((p) => { const c = p[id] as { type:'numberrange'; min:string; max:string }|undefined; return { ...p, [id]: { type:'numberrange', min:c?.min??'', max:v } }; });
  const setToggle   = (sectionId: string, optionId: string, v: boolean) =>
    setDraft((p) => { const c = p[sectionId] as { type:'toggles'; values:Record<string,boolean> }|undefined; return { ...p, [sectionId]: { type:'toggles', values: { ...c?.values, [optionId]: v } } }; });

  const handleApply = () => {
    sections.forEach((s) => {
      const d = draft[s.id];
      if (!d) return;
      if (s.type === 'chips'       && d.type === 'chips')       s.onChange(d.value);
      if (s.type === 'daterange'   && d.type === 'daterange')   { s.onChangeFrom(d.from); s.onChangeTo(d.to); }
      if (s.type === 'numberrange' && d.type === 'numberrange') { s.onChangeMin(d.min); s.onChangeMax(d.max); }
      if (s.type === 'toggles'    && d.type === 'toggles')     { s.options.forEach((opt) => opt.onChange(d.values[opt.id] ?? false)); }
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

  const footer = (
    <div className="flex gap-3">
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
  );

  return (
    <FilterPanel
      open={isOpen}
      onClose={onClose}
      title={title}
      footer={footer}
    >
      <div className="flex flex-col gap-6">
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
    </FilterPanel>
  );
}
