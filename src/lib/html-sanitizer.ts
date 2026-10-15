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

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Convierte texto plano legado (guardado antes de que el campo usara RichTextEditor) en HTML de párrafos/<br>, preservando los saltos de línea que el usuario ya había escrito. */
function legacyPlainTextToHtml(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/**
 * Normaliza un campo de texto enriquecido a HTML, aceptando tanto el HTML que
 * ya escribe RichTextEditor como texto plano legado guardado antes de que
 * existiera. Úsalo tanto para alimentar el editor (`value`) como para
 * renderizar el campo, para no perder párrafos/saltos de línea antiguos.
 */
export function ensureRichTextHtml(value?: string | null): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('<') ? value : legacyPlainTextToHtml(trimmed);
}

/** Longitud del texto visible de un campo que puede venir en HTML o en texto plano legado; las etiquetas no cuentan para los límites de caracteres. */
export function getVisibleTextLength(value?: string | null): number {
  if (!value) return 0;
  return value
    .replace(/<(p|div|br|li)[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim().length;
}
