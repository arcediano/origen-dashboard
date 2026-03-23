/**
 * Tests unitarios para las funciones de utilidad en src/lib/utils/index.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cn,
  formatFileSize,
  formatCurrency,
  formatDate,
  generateId,
  truncateText,
  capitalize,
  formatPhoneNumber,
  getInitials,
  debounce,
} from '@/lib/utils';

// ── cn ───────────────────────────────────────────────────────────────────────

describe('cn', () => {
  it('combina clases simples', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('ignora valores undefined y null', () => {
    expect(cn('foo', undefined, 'bar')).toBe('foo bar');
  });

  it('ignora valores boolean false', () => {
    expect(cn('foo', false, 'bar')).toBe('foo bar');
  });

  it('resuelve conflictos de Tailwind (tailwind-merge): p-2 vs p-4 → gana p-4', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('acepta objetos condicionales', () => {
    expect(cn({ 'font-bold': true, 'font-normal': false })).toBe('font-bold');
  });

  it('devuelve string vacío sin argumentos', () => {
    expect(cn()).toBe('');
  });

  it('combina arrays de clases', () => {
    const result = cn(['text-sm', 'text-lg']);
    expect(result).toContain('text-lg');
  });
});

// ── formatFileSize ───────────────────────────────────────────────────────────

describe('formatFileSize', () => {
  it('devuelve "0 Bytes" para 0', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
  });

  it('formatea menos de 1 KB como Bytes', () => {
    expect(formatFileSize(500)).toBe('500 Bytes');
  });

  it('formatea exactamente 1 KB', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
  });

  it('formatea exactamente 1 MB', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
  });

  it('formatea exactamente 1 GB', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
  });

  it('redondea a 2 decimales en KB', () => {
    // 1500 bytes = 1.46 KB
    expect(formatFileSize(1500)).toBe('1.46 KB');
  });

  it('formatea 2 MB', () => {
    expect(formatFileSize(2 * 1024 * 1024)).toBe('2 MB');
  });
});

// ── formatCurrency ───────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formatea 0 céntimos', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
    expect(result).toContain('€');
  });

  it('convierte 100 céntimos → 1 €', () => {
    const result = formatCurrency(100);
    expect(result).toMatch(/1[,.]00/);
  });

  it('formatea 5000 céntimos → 50 €', () => {
    const result = formatCurrency(5000);
    expect(result).toMatch(/50[,.]00/);
  });

  it('formatea 199 céntimos → 1,99 €', () => {
    const result = formatCurrency(199);
    expect(result).toContain('1');
    expect(result).toContain('99');
  });

  it('formatea 10000 céntimos → 100 €', () => {
    const result = formatCurrency(10000);
    expect(result).toMatch(/100/);
  });

  it('el resultado contiene el símbolo de euro', () => {
    expect(formatCurrency(500)).toContain('€');
  });
});

// ── formatDate ───────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('formatea un objeto Date y devuelve string', () => {
    const date = new Date('2024-06-15');
    const result = formatDate(date);
    expect(typeof result).toBe('string');
    expect(result).toContain('2024');
  });

  it('formatea un string ISO de fecha', () => {
    const result = formatDate('2024-01-15');
    expect(result).toContain('2024');
  });

  it('incluye el año en la salida', () => {
    const result = formatDate(new Date('2025-03-10'));
    expect(result).toContain('2025');
  });

  it('el mes de enero aparece correctamente en español', () => {
    const result = formatDate(new Date('2024-01-15'));
    expect(result.toLowerCase()).toMatch(/enero/);
  });

  it('el mes de diciembre aparece correctamente en español', () => {
    const result = formatDate(new Date('2024-12-25'));
    expect(result.toLowerCase()).toMatch(/diciembre/);
  });

  it('incluye el día en la salida', () => {
    const result = formatDate(new Date('2024-06-05'));
    expect(result).toContain('5');
  });
});

// ── generateId ───────────────────────────────────────────────────────────────

describe('generateId', () => {
  it('devuelve un string', () => {
    expect(typeof generateId()).toBe('string');
  });

  it('devuelve un string no vacío', () => {
    expect(generateId().length).toBeGreaterThan(0);
  });

  it('genera IDs únicos en cada llamada', () => {
    const ids = Array.from({ length: 10 }, () => generateId());
    const unique = new Set(ids);
    expect(unique.size).toBe(10);
  });

  it('tiene longitud razonable (> 5 caracteres)', () => {
    expect(generateId().length).toBeGreaterThan(5);
  });
});

// ── truncateText ─────────────────────────────────────────────────────────────

describe('truncateText', () => {
  it('no trunca texto más corto que el límite', () => {
    expect(truncateText('hola', 10)).toBe('hola');
  });

  it('no trunca texto exactamente igual al límite', () => {
    expect(truncateText('hola', 4)).toBe('hola');
  });

  it('trunca texto más largo y añade "..."', () => {
    expect(truncateText('hola mundo', 4)).toBe('hola...');
  });

  it('trunca a 0 caracteres deja solo "..."', () => {
    expect(truncateText('hola', 0)).toBe('...');
  });

  it('trunca texto largo correctamente', () => {
    const long = 'Este es un texto muy largo que debe ser truncado';
    const result = truncateText(long, 10);
    expect(result).toBe('Este es un...');
  });
});

// ── capitalize ───────────────────────────────────────────────────────────────

describe('capitalize', () => {
  it('capitaliza la primera letra de una palabra en minúsculas', () => {
    expect(capitalize('hola')).toBe('Hola');
  });

  it('pone el resto del texto en minúsculas', () => {
    expect(capitalize('HOLA MUNDO')).toBe('Hola mundo');
  });

  it('mantiene correctamente una cadena ya capitalizada', () => {
    expect(capitalize('Hola')).toBe('Hola');
  });

  it('maneja string vacío sin error', () => {
    expect(capitalize('')).toBe('');
  });

  it('funciona con un solo carácter', () => {
    expect(capitalize('a')).toBe('A');
  });
});

// ── formatPhoneNumber ────────────────────────────────────────────────────────

describe('formatPhoneNumber', () => {
  it('formatea número español de 9 dígitos con espacios (XXX XX XX XX)', () => {
    expect(formatPhoneNumber('600000000')).toBe('600 00 00 00');
  });

  it('devuelve el original si no tiene 9 dígitos', () => {
    expect(formatPhoneNumber('12345')).toBe('12345');
  });

  it('con prefijo +34 devuelve el original (11 dígitos, no se formatea)', () => {
    // La función solo formatea si tras quitar no-dígitos quedan exactamente 9
    // +34600000000 → 34600000000 (11 dígitos) → devuelve original
    expect(formatPhoneNumber('+34600000000')).toBe('+34600000000');
  });

  it('con prefijo 0034 devuelve el original (13 dígitos, no se formatea)', () => {
    expect(formatPhoneNumber('0034600000000')).toBe('0034600000000');
  });

  it('maneja número con guiones (9 dígitos tras limpiar → formateado)', () => {
    // 600-00-00-00 → 600000000 (9 dígitos) → formateado
    expect(formatPhoneNumber('600-00-00-00')).toBe('600 00 00 00');
  });
});

// ── getInitials ──────────────────────────────────────────────────────────────

describe('getInitials', () => {
  it('extrae dos iniciales de nombre y apellido', () => {
    expect(getInitials('María García')).toBe('MG');
  });

  it('extrae solo la primera inicial para un nombre simple', () => {
    expect(getInitials('María')).toBe('M');
  });

  it('limita a 2 caracteres aunque haya más palabras', () => {
    expect(getInitials('Juan Carlos Rodríguez López')).toBe('JC');
  });

  it('devuelve siempre mayúsculas', () => {
    expect(getInitials('ana pérez')).toBe('AP');
  });

  it('funciona con nombres de una sola letra', () => {
    const result = getInitials('A B');
    expect(result).toBe('AB');
  });
});

// ── debounce ─────────────────────────────────────────────────────────────────

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('no llama a la función antes del tiempo de espera', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(299);
    expect(fn).not.toHaveBeenCalled();
  });

  it('llama a la función exactamente después del tiempo de espera', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('cancela llamadas previas si se invoca varias veces rápido', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    debounced();
    debounced();

    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('pasa los argumentos correctamente a la función original', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('hola', 42);
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith('hola', 42);
  });

  it('permite llamadas sucesivas con espera completa entre ellas', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    vi.advanceTimersByTime(100);
    debounced();
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(2);
  });
});
