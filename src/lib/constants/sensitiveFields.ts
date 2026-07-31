/**
 * Mapeo de campos técnicos a etiquetas legibles para comunicación de cambios sensibles.
 * Corresponde con la lista de SENSITIVE_FIELDS en useProductForm.ts
 */

export const SENSITIVE_FIELD_LABELS: Record<
  string,
  { label: string; short: string }
> = {
  // Campos atómicos
  name: {
    label: 'Nombre del producto',
    short: 'el nombre',
  },
  shortDescription: {
    label: 'Descripción corta',
    short: 'la descripción corta',
  },
  fullDescription: {
    label: 'Descripción completa',
    short: 'la descripción completa',
  },
  mainImage: {
    label: 'Imagen principal',
    short: 'la imagen principal',
  },
  gallery: {
    label: 'Galería de imágenes',
    short: 'la galería de imágenes',
  },
  categoryId: {
    label: 'Categoría',
    short: 'la categoría',
  },
  subcategoryId: {
    label: 'Subcategoría',
    short: 'la subcategoría',
  },
  certifications: {
    label: 'Certificaciones',
    short: 'las certificaciones',
  },
  // Subcampos de nutritionalInfo
  allergens: {
    label: 'Alérgenos',
    short: 'los alérgenos',
  },
  mayContain: {
    label: 'Puede contener trazas de',
    short: 'la información de trazas',
  },
  ingredients: {
    label: 'Lista de ingredientes',
    short: 'la lista de ingredientes',
  },
  // Subcampos de productionInfo
  origin: {
    label: 'Origen del producto',
    short: 'el origen del producto',
  },
  farmName: {
    label: 'Nombre de la finca o explotación',
    short: 'el nombre de la finca',
  },
  producerName: {
    label: 'Nombre del productor',
    short: 'el nombre del productor',
  },
  batchNumber: {
    label: 'Número de lote',
    short: 'el número de lote',
  },
  harvestDate: {
    label: 'Fecha de cosecha',
    short: 'la fecha de cosecha',
  },
  productionDate: {
    label: 'Fecha de producción',
    short: 'la fecha de producción',
  },
  expiryDate: {
    label: 'Fecha de caducidad',
    short: 'la fecha de caducidad',
  },
};

/**
 * Helper para formatear una lista de campos en una frase natural.
 * Utiliza la forma corta de las etiquetas y las une con coma + "y".
 *
 * Ejemplos:
 * - ['name'] → "el nombre"
 * - ['name', 'origin'] → "el nombre y el origen del producto"
 * - ['name', 'origin', 'allergens'] → "el nombre, el origen del producto y los alérgenos"
 */
export function formatFieldsInSentence(fields: string[]): string {
  const parts = fields
    .map((f) => SENSITIVE_FIELD_LABELS[f]?.short ?? f)
    .filter(Boolean);

  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];

  return `${parts.slice(0, -1).join(', ')} y ${parts[parts.length - 1]}`;
}
