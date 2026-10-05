/**
 * Catálogo de certificaciones del NEGOCIO que el productor puede declarar en el paso 4.
 * Las propias de un producto (sin gluten, vegano…) se declaran al crear el producto.
 * Los ids deben coincidir con el catálogo del backend
 * (`producers/constants/certification-catalog.ts`, ADR-020 §5): el backend
 * deriva `name`/`issuingBody` de ahí, por eso ya no se piden en el formulario.
 */

export interface CertificationCatalogEntry {
  id: string;
  name: string;
  description: string;
}

export const CERTIFICATION_CATALOG: CertificationCatalogEntry[] = [
  { id: 'ecologico', name: 'Agricultura ecológica', description: 'Producción ecológica certificada' },
  { id: 'comercio_justo', name: 'Comercio justo', description: 'Prácticas de comercio ético' },
  { id: 'denominacion_origen', name: 'Denominación de origen', description: 'DOP / IGP de tu producto' },
  { id: 'artesania', name: 'Producto artesano', description: 'Elaboración artesanal certificada' },
  { id: 'produccion_integrada', name: 'Producción integrada', description: 'Sistema sostenible de producción' },
  { id: 'bienestar_animal', name: 'Bienestar animal', description: 'Certificación de bienestar animal' },
  { id: 'agricultura_regenerativa', name: 'Agricultura regenerativa', description: 'Prácticas que regeneran el suelo' },
];

export const CERTIFICATION_IDS = CERTIFICATION_CATALOG.map((c) => c.id);

export function getCertificationName(id: string): string {
  return CERTIFICATION_CATALOG.find((c) => c.id === id)?.name ?? id;
}
