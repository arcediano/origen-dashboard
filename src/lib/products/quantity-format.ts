export function formatProductQuantity(
  quantity: number,
  saleMode?: 'UNIT' | 'WEIGHT',
): string {
  if (saleMode !== 'WEIGHT') return `${quantity} uds`;
  if (quantity >= 1000) {
    return `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 3 }).format(quantity / 1000)} kg`;
  }
  return `${quantity} g`;
}
