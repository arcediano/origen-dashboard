'use client';

/**
 * @component NetContentField
 * @description Formato de venta (contenido neto: a qué cantidad corresponde el precio):
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
        <span className="text-sm font-medium text-foreground">Formato de venta</span>
        <Tooltip
          content="Lo que recibe el cliente por este precio"
          detailed="Indica la cantidad de producto que incluye una unidad a la venta: un tarro de 500 g, una pieza de 1 kg, una botella de 750 ml o un pack de 6 unidades. Así el cliente sabe a qué cantidad corresponde lo que paga."
          size="sm"
        />
      </div>
      <div className="flex max-w-xs gap-2">
        <Input
          type="number"
          inputMode="decimal"
          aria-label="Cantidad del formato de venta"
          value={netContent ?? ''}
          onChange={(e) => onChange('netContent', e.target.value ? parseFloat(e.target.value) : undefined)}
          min={0}
          step="any"
          inputSize="lg"
          placeholder="Ej: 500"
          containerClassName="min-w-0 flex-1"
        />
        <Select
          className="w-28 shrink-0"
          value={netContentUnit ?? 'g'}
          onValueChange={(v) => onChange('netContentUnit', v as NetContentUnit)}
        >
          <SelectTrigger className="h-12 rounded-xl" aria-label="Unidad del formato">
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
        Cantidad que lleva cada unidad (p. ej. 500 g, 1 kg, 750 ml, 6 unidades). Se muestra junto al precio: «12,50 € · 500 g».
      </p>
    </div>
  );
}
