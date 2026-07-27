/**
 * HTML Sanitizer para renderizado seguro de texto enriquecido
 * Permite un conjunto restrictivo de etiquetas HTML
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Configuración de purificación para renderizado en el dashboard
 * Permite solo etiquetas básicas de formato de texto
 */
const SANITIZE_CONFIG: Parameters<typeof DOMPurify.sanitize>[1] = {
  ALLOWED_TAGS: [
    'p', // párrafos
    'b', 'strong', 'i', 'em', // formato
    'ul', 'ol', 'li', // listas
    'br', // saltos de línea
    'a', // enlaces
    'blockquote', // citas
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  KEEP_CONTENT: true,
  ALLOW_DATA_ATTR: false,
};

/**
 * Sanitiza HTML manteniendo un conjunto restrictivo de etiquetas seguras
 * @param html - HTML crudo a sanitizar
 * @returns HTML sanitizado seguro para renderizar en el DOM
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }
  return DOMPurify.sanitize(html, SANITIZE_CONFIG);
}

/**
 * Renderiza HTML sanitizado de forma segura con dangerouslySetInnerHTML
 * @param html - HTML a renderizar
 * @returns Objeto para usar con dangerouslySetInnerHTML
 */
export function createSafeHtml(html: string): { __html: string } {
  return {
    __html: sanitizeHtml(html),
  };
}
