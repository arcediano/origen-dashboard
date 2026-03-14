/**
 * Utilidades para SKU (Stock Keeping Unit)
 * @module lib/utils/sku
 */

/**
 * Genera un SKU único basado en categoría y timestamp
 * @example generateSku('Quesos', 'Queso Manchego') // -> QUE-123456789
 */
export function generateSku(category?: string, productName?: string): string {
  let prefix = 'PRD';

  if (category) {
    const categoryMatch = category.match(/[A-Za-z]/g);
    if (categoryMatch && categoryMatch.length >= 3) {
      prefix = categoryMatch.slice(0, 3).join('').toUpperCase();
    }
  } else if (productName) {
    const nameMatch = productName.match(/[A-Za-z]/g);
    if (nameMatch && nameMatch.length >= 3) {
      prefix = nameMatch.slice(0, 3).join('').toUpperCase();
    }
  }

  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

  return `${prefix}-${timestamp}${random}`;
}

/**
 * Valida el formato de SKU (PREFIJO-123456789)
 * @example validateSkuFormat('QUE-123456789') // -> true
 */
export function validateSkuFormat(sku: string): boolean {
  const skuRegex = /^[A-Z0-9]{2,5}-[0-9]{9}$/;
  return skuRegex.test(sku);
}

/**
 * Extrae información del SKU
 * @example parseSku('QUE-123456789') // -> { prefix: 'QUE', code: '123456789' }
 */
export function parseSku(sku: string): { prefix: string; code: string } | null {
  const match = sku.match(/^([A-Z0-9]{2,5})-([0-9]{9})$/);
  if (!match) return null;
  return { prefix: match[1], code: match[2] };
}

/**
 * Genera un SKU inteligente basado en el nombre del producto
 * @example generateSkuFromName('Queso Curado Artesanal') // -> QUCUAR-123456789
 */
export function generateSkuFromName(productName: string): string {
  if (!productName || productName.trim() === '') return generateSku();

  const clean = productName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .toUpperCase();

  const words = clean.split(/\s+/).filter(word => word.length > 2);

  if (words.length === 0) return generateSku();

  let prefix = '';
  if (words.length === 1) {
    prefix = words[0].substring(0, 3);
  } else if (words.length === 2) {
    prefix = words[0].substring(0, 2) + words[1].substring(0, 2);
  } else {
    prefix = words[0].substring(0, 2) + words[1].substring(0, 2) + words[2].substring(0, 2);
  }

  prefix = prefix.substring(0, 5);
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

  return `${prefix}-${timestamp}${random}`;
}

/**
 * Genera un SKU combinando categoría (3 letras) y nombre del producto (hasta 2 letras)
 * @example generateOptimizedSku('Quesos', 'Manchego') // -> QUEMA-123456789
 */
export function generateOptimizedSku(category: string, productName: string): string {
  if (!category && !productName) return generateSku();

  let categoryPrefix = 'PRD';
  if (category) {
    const catMatch = category.match(/[A-Za-z]/g);
    if (catMatch && catMatch.length >= 3) {
      categoryPrefix = catMatch.slice(0, 3).join('').toUpperCase();
    }
  }

  if (!productName || productName.trim() === '') {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${categoryPrefix}-${timestamp}${random}`;
  }

  const clean = productName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .toUpperCase();

  const words = clean.split(/\s+/).filter(word => word.length > 2);
  let namePrefix = '';
  if (words.length >= 1) namePrefix = words[0].substring(0, 2);
  if (words.length >= 2) namePrefix += words[1].substring(0, 1);

  const finalPrefix = (categoryPrefix + namePrefix).substring(0, 5);
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

  return `${finalPrefix}-${timestamp}${random}`;
}
