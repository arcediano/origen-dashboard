import { describe, it, expect } from 'vitest';
import { ensureRichTextHtml, getVisibleTextLength } from '@/lib/html-sanitizer';

describe('ensureRichTextHtml', () => {
  it('devuelve vacío para valores vacíos', () => {
    expect(ensureRichTextHtml()).toBe('');
    expect(ensureRichTextHtml(null)).toBe('');
    expect(ensureRichTextHtml('')).toBe('');
    expect(ensureRichTextHtml('   ')).toBe('');
  });

  it('deja pasar HTML (ya escrito por RichTextEditor) sin tocarlo', () => {
    expect(ensureRichTextHtml('<p>Hola</p>')).toBe('<p>Hola</p>');
  });

  it('convierte texto plano legado en párrafos, separando por línea en blanco', () => {
    expect(ensureRichTextHtml('Primer párrafo.\n\nSegundo párrafo.')).toBe(
      '<p>Primer párrafo.</p><p>Segundo párrafo.</p>',
    );
  });

  it('convierte saltos de línea sueltos (dentro de un párrafo) en <br>', () => {
    expect(ensureRichTextHtml('Línea 1\nLínea 2')).toBe('<p>Línea 1<br>Línea 2</p>');
  });

  it('escapa caracteres HTML del texto plano legado para no romper el markup', () => {
    expect(ensureRichTextHtml('Precio < 5€ & > calidad')).toBe(
      '<p>Precio &lt; 5€ &amp; &gt; calidad</p>',
    );
  });
});

describe('getVisibleTextLength', () => {
  it('cuenta la longitud del texto visible, no las etiquetas HTML', () => {
    expect(getVisibleTextLength('<p>' + 'x'.repeat(100) + '</p>')).toBe(100);
  });

  it('cuenta igual que el texto plano cuando no hay HTML', () => {
    expect(getVisibleTextLength('x'.repeat(50))).toBe(50);
  });

  it('devuelve 0 para valores vacíos', () => {
    expect(getVisibleTextLength()).toBe(0);
    expect(getVisibleTextLength(null)).toBe(0);
  });
});
