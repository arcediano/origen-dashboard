'use client';

import * as React from 'react';
import { Button, Input } from '@arcediano/ux-library';
import { PROVINCIAS_ESPANA } from '@/constants/provinces';
import { nextLocalId, parsePostalInput } from '@/lib/onboarding/zones';
import type { ShippingZone } from '@/lib/onboarding/types';
import { cn } from '@/lib/utils';
import { Info, MapPin, Plus, X } from 'lucide-react';
import { FieldError, SelectField } from './FormBits';

type ZoneMode = 'province' | 'postal' | 'named';

const MODES: Array<{ id: ZoneMode; label: string }> = [
  { id: 'province', label: 'Provincia' },
  { id: 'postal', label: 'Código postal' },
  { id: 'named', label: 'Zona con nombre' },
];

interface ZoneEditorProps {
  zones: ShippingZone[];
  onAdd: (zones: ShippingZone[]) => void;
  onRemove: (id: string) => void;
  /** Provincia del productor (paso 1) para el atajo "añadir mi provincia". */
  homeProvince?: string;
  error?: string;
}

const TYPE_LABEL: Record<ShippingZone['type'], string> = {
  province: 'Provincia',
  postal: 'Código postal',
  custom: 'Zona',
};

/** Alta y listado de zonas de entrega (provincias, códigos postales o zonas con nombre). */
export function ZoneEditor({ zones, onAdd, onRemove, homeProvince, error }: ZoneEditorProps) {
  const [mode, setMode] = React.useState<ZoneMode>('province');
  const [value, setValue] = React.useState('');
  const [name, setName] = React.useState('');
  const [parseError, setParseError] = React.useState('');

  const hasAllSpain = zones.some((z) => z.value === 'ES');
  const hasProvince = (p: string) => zones.some((z) => z.type === 'province' && z.value === p);

  const reset = () => {
    setValue('');
    setName('');
    setParseError('');
  };

  const add = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setParseError('');

    if (mode === 'province') {
      if (hasProvince(trimmed)) return setParseError('Esa provincia ya está en tu lista.');
      onAdd([{ id: nextLocalId('province'), type: 'province', value: trimmed, label: trimmed }]);
    } else if (mode === 'postal') {
      const parsed = parsePostalInput(trimmed);
      if (parsed.length === 0) return setParseError('Formato no reconocido. Usa: 28001, 280*, 28000-28050');
      onAdd(parsed);
    } else {
      if (!name.trim()) return;
      if (parsePostalInput(trimmed).length === 0) return setParseError('Añade al menos un código postal para definir la zona.');
      onAdd([{ id: nextLocalId('named'), type: 'custom', value: trimmed, label: name.trim() }]);
    }
    reset();
  };

  return (
    <div className="space-y-4">
      {/* Atajos */}
      <div className="flex flex-wrap gap-2">
        {homeProvince && !hasProvince(homeProvince) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-auto"
            onClick={() => onAdd([{ id: nextLocalId('province'), type: 'province', value: homeProvince, label: homeProvince }])}
          >
            <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Mi provincia ({homeProvince})
          </Button>
        )}
        {!hasAllSpain && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-auto"
            onClick={() => onAdd([{ id: nextLocalId('custom-ES'), type: 'custom', value: 'ES', label: 'Toda España' }])}
          >
            <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Toda España
          </Button>
        )}
      </div>

      {/* Tipo de zona */}
      <div role="tablist" aria-label="Tipo de zona" className="grid grid-cols-3 overflow-hidden rounded-xl border border-border">
        {MODES.map((m, i) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={mode === m.id}
            onClick={() => { setMode(m.id); reset(); }}
            className={cn(
              'min-h-11 px-2 py-2 text-xs font-semibold leading-tight transition-colors',
              i > 0 && 'border-l border-border',
              mode === m.id ? 'bg-origen-bosque text-white' : 'bg-surface-alt text-text-subtle hover:bg-origen-crema/40 hover:text-origen-bosque',
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {mode === 'named' && (
          <Input
            id="onb-zone-name"
            aria-label="Nombre de la zona"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre de la zona (ej.: Área metropolitana de Madrid)"
          />
        )}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="flex-1">
            {mode === 'province' ? (
              <SelectField
                id="onb-zone-value"
                label="Provincia"
                value={value}
                onValueChange={(v) => { setValue(v); setParseError(''); }}
                options={PROVINCIAS_ESPANA.map((p) => ({ value: p, label: p }))}
                placeholder="Selecciona una provincia"
              />
            ) : (
              <Input
                id="onb-zone-value"
                aria-label="Códigos postales"
                value={value}
                onChange={(e) => { setValue(e.target.value); setParseError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
                placeholder="Ej.: 28001, 280*, 28000-28050"
                error={parseError || undefined}
              />
            )}
          </div>
          <Button
            type="button"
            onClick={add}
            disabled={!value.trim() || (mode === 'named' && !name.trim())}
            variant="primary"
            className={cn('w-full sm:w-auto sm:shrink-0', mode === 'province' && 'sm:mt-6')}
          >
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" /> Añadir zona
          </Button>
        </div>
        {mode === 'province' && parseError && <FieldError>{parseError}</FieldError>}
        {mode !== 'province' && !parseError && (
          <p className="flex items-start gap-1.5 text-xs text-text-subtle">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-hoja-tinta" aria-hidden="true" />
            <span>Formatos: individual <code className="rounded bg-surface px-1">28001</code>, comodín <code className="rounded bg-surface px-1">280*</code> o rango <code className="rounded bg-surface px-1">28000-28050</code>.</span>
          </p>
        )}
      </div>

      {/* Lista */}
      {zones.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-origen-bosque">Zonas donde entregas ({zones.length})</h3>
          <ul className={cn('flex flex-wrap gap-2', zones.length > 12 && 'max-h-40 overflow-y-auto rounded-lg bg-surface p-2')}>
            {zones.map((z) => (
              <li
                key={z.id}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-origen-pradera/30 bg-origen-crema/30 py-1 pl-3 pr-1 text-sm text-origen-bosque"
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-hoja-tinta" aria-hidden="true" />
                <span className="truncate">{z.label}</span>
                <span className="sr-only">({TYPE_LABEL[z.type]})</span>
                <button
                  type="button"
                  onClick={() => onRemove(z.id)}
                  aria-label={`Quitar la zona ${z.label}`}
                  className="-my-2 -mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-subtle hover:bg-feedback-danger-subtle hover:text-feedback-danger"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <FieldError>{error}</FieldError>
    </div>
  );
}

export default ZoneEditor;
