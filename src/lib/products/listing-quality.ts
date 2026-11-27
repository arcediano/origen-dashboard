/**
 * Calidad de la ficha de producto: qué elementos que ayudan a vender tiene ya el producto y
 * cuáles faltan. Es orientativo (no bloquea publicar; eso lo decide el checklist de requisitos).
 */
import type { Product } from '@/types/product';

export interface ListingQualityTip {
  id: 'photos' | 'description' | 'nutrition' | 'production' | 'certifications';
  message: string;
}

export interface ListingQuality {
  /** 0-100 */
  score: number;
  tips: ListingQualityTip[];
}

const MIN_PHOTOS = 3;
const MIN_DESCRIPTION = 600;

type QualityInput = Pick<Product, 'fullDescription' | 'gallery' | 'mainImage' | 'nutritionalInfo' | 'productionInfo' | 'certifications'>;

export function getListingQuality(product: QualityInput): ListingQuality {
  const photoCount = (product.mainImage ? 1 : 0) + (product.gallery?.filter((g) => g.id !== product.mainImage?.id).length ?? 0);
  const production = product.productionInfo;
  const hasProduction = !!(production?.story?.trim() || production?.productionMethod?.trim());

  const checks: Array<[boolean, ListingQualityTip]> = [
    [photoCount >= MIN_PHOTOS, { id: 'photos', message: `Añade más fotos (tienes ${photoCount}, lo ideal son ${MIN_PHOTOS} o más): enseñan el producto desde varios ángulos.` }],
    [(product.fullDescription ?? '').trim().length >= MIN_DESCRIPTION, { id: 'description', message: `Amplía la descripción hasta ${MIN_DESCRIPTION} caracteres o más: sabor, textura y cómo se disfruta.` }],
    [!!product.nutritionalInfo, { id: 'nutrition', message: 'Añade la información nutricional: genera confianza y es lo que más consultan los compradores.' }],
    [hasProduction, { id: 'production', message: 'Cuenta cómo y dónde se elabora: la historia detrás del producto ayuda a decidir la compra.' }],
    [(product.certifications?.length ?? 0) > 0, { id: 'certifications', message: 'Si tienes sellos o certificaciones (ecológico, DOP…), añádelos: dan credibilidad.' }],
  ];

  const done = checks.filter(([ok]) => ok).length;
  return {
    score: Math.round((done / checks.length) * 100),
    tips: checks.filter(([ok]) => !ok).map(([, tip]) => tip),
  };
}
