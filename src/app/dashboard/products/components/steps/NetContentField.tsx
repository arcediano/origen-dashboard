'use client';

/**
 * @component NetContentField
 * @description Contenido neto que se vende (a qué cantidad corresponde el precio):
 * cantidad + unidad (g, kg, ml, l, unidades). Compartido por el paso de precios y la
 * pantalla de revisión del alta con IA.
 */

import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tooltip } from '@arcediano/ux-library';
import { Package } from 'lucide-react';
import { NET_CONTENT_UNIT_LABELS, type NetContentUnit } from '@/types/product';

interface NetContentFieldProps {
  netContent?: number;
  netContentUnit?: NetContentUnit;
  onChange: (field: 'netContent' | 'netContentUnit', value: number | NetContentUnit | undefined) => void;
}

export function NetContentField({ netContent, netContentUnit, onChange }: NetContentFieldProps) {
  return (
    <div className="space-y-2" data-testid="net-content">
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5 text-hoja-tinta" aria-hidden="true" />
        <span className="text-sm font-medium text-foreground">Contenido que vendes</span>
        <Tooltip
          content="Cantidad a la que corresponde el precio"
          detailed="Indica cuánto producto recibe el cliente por el precio de venta: 500 g, 1 kg, 750 ml, 1 l o un número de unidades. Así el cliente sabe a qué cantidad corresponde lo que paga."
          size="sm"
        />
      </div>
      <div className="flex max-w-md gap-2">
        <Input
          type="number"
          inputMode="decimal"
          aria-label="Cantidad del contenido que vendes"
          value={netContent ?? ''}
          onChange={(e) => onChange('netContent', e.target.value ? parseFloat(e.target.value) : undefined)}
          min={0}
          step="any"
          inputSize="lg"
          placeholder="Ej: 500"
          containerClassName="min-w-0 flex-1"
        />
        <Select value={netContentUnit ?? 'g'} onValueChange={(v) => onChange('netContentUnit', v as NetContentUnit)}>
          <SelectTrigger className="h-12 w-32 shrink-0 rounded-xl" aria-label="Unidad del contenido">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(NET_CONTENT_UNIT_LABELS) as NetContentUnit[]).map((unit) => (
              <SelectItem key={unit} value={unit}>
                {NET_CONTENT_UNIT_LABELS[unit]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p className="text-xs text-muted-foreground">
        Recomendable: es lo que el cliente ve junto al precio (p. ej. «12,50 € · 500 g»).
      </p>
    </div>
  );
}
