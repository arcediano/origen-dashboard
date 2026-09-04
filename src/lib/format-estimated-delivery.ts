export type DeliveryTimeUnit = "HOURS" | "DAYS" | "WEEKS";

export const DELIVERY_TIME_UNIT_OPTIONS: Array<{ value: DeliveryTimeUnit; label: string }> = [
  { value: "HOURS", label: "Horas" },
  { value: "DAYS", label: "Días" },
  { value: "WEEKS", label: "Semanas" },
];

const UNIT_LABELS: Record<DeliveryTimeUnit, [singular: string, plural: string]> = {
  HOURS: ["hora", "horas"],
  DAYS: ["día", "días"],
  WEEKS: ["semana", "semanas"],
};

/**
 * Formatea el plazo estimado de entrega de una opción de envío. Un valor 0
 * se muestra como "Mismo día" en cualquier unidad.
 */
export function formatEstimatedDelivery(value: number, unit: DeliveryTimeUnit): string {
  if (value === 0) return "Mismo día";
  const [singular, plural] = UNIT_LABELS[unit];
  return `${value} ${value === 1 ? singular : plural}`;
}
