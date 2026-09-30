/**
 * Utilidades de zonas de entrega del paso de envíos.
 */

import type { ShippingZone } from './types';

let zoneCounter = 0;
export function nextLocalId(prefix: string): string {
  zoneCounter += 1;
  return `${prefix}-${Date.now()}-${zoneCounter}`;
}

/**
 * Interpreta la entrada de códigos postales: individual (`28001`), comodín
 * (`280*`) o rango (`28000-28050`, se expande hasta 100 códigos; uno mayor se
 * guarda como un único rango). Las entradas no reconocidas se ignoran.
 */
export function parsePostalInput(raw: string): ShippingZone[] {
  const zones: ShippingZone[] = [];
  const entries = raw.split(',').map((s) => s.trim()).filter(Boolean);

  for (const entry of entries) {
    if (entry.includes('-') && !entry.includes('*')) {
      const [fromRaw, toRaw] = entry.split('-');
      const from = parseInt(fromRaw, 10);
      const to = parseInt(toRaw, 10);
      if (!isNaN(from) && !isNaN(to) && to >= from) {
        if (to - from + 1 <= 100) {
          for (let cp = from; cp <= to; cp++) {
            const val = String(cp).padStart(5, '0');
            zones.push({ id: nextLocalId(`postal-${val}`), type: 'postal', value: val, label: val });
          }
        } else {
          zones.push({ id: nextLocalId('postal-range'), type: 'postal', value: entry, label: `CPs ${entry}` });
        }
      }
    } else if (entry.includes('*')) {
      zones.push({ id: nextLocalId('postal-wild'), type: 'postal', value: entry, label: `CPs ${entry}` });
    } else if (/^\d{5}$/.test(entry)) {
      zones.push({ id: nextLocalId(`postal-${entry}`), type: 'postal', value: entry, label: entry });
    }
  }
  return zones;
}
