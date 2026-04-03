/**
 * Validación de identificadores fiscales españoles.
 * NIF (personas físicas), NIE (extranjeros residentes), CIF (personas jurídicas).
 *
 * Implementa los algoritmos de dígito de control oficiales de la AEAT.
 */

export type TaxIdType = 'NIF' | 'NIE' | 'CIF';

export interface TaxIdValidationResult {
  valid: boolean;
  type?: TaxIdType;
  error?: string;
}

const NIF_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';

function validateNif(value: string): TaxIdValidationResult {
  // 8 dígitos + 1 letra
  if (!/^\d{8}[A-Z]$/.test(value)) return { valid: false };
  const num = parseInt(value.slice(0, 8), 10);
  const expected = NIF_LETTERS[num % 23];
  if (value[8] !== expected) {
    return { valid: false, error: 'El dígito de control del NIF no es correcto' };
  }
  return { valid: true, type: 'NIF' };
}

function validateNie(value: string): TaxIdValidationResult {
  // X, Y o Z + 7 dígitos + 1 letra
  if (!/^[XYZ]\d{7}[A-Z]$/.test(value)) return { valid: false };
  const prefix: Record<string, string> = { X: '0', Y: '1', Z: '2' };
  const num = parseInt(prefix[value[0]] + value.slice(1, 8), 10);
  const expected = NIF_LETTERS[num % 23];
  if (value[8] !== expected) {
    return { valid: false, error: 'El dígito de control del NIE no es correcto' };
  }
  return { valid: true, type: 'NIE' };
}

// Letras de control CIF: posiciones par = suma directa, impar = suma dígitos del doble
const CIF_CONTROL_LETTERS = 'JABCDEFGHI';

function validateCif(value: string): TaxIdValidationResult {
  // 1 letra (tipo entidad) + 7 dígitos + 1 dígito o letra de control
  if (!/^[ABCDEFGHJKLMNPQRSUVW]\d{7}[0-9A-J]$/.test(value)) return { valid: false };

  const body = value.slice(1, 8);
  let sumOdd = 0;
  let sumEven = 0;

  for (let i = 0; i < body.length; i++) {
    const d = parseInt(body[i], 10);
    if ((i + 1) % 2 === 0) {
      sumEven += d;
    } else {
      const doubled = d * 2;
      sumOdd += doubled > 9 ? doubled - 9 : doubled;
    }
  }

  const total = (sumOdd + sumEven) % 10;
  const controlDigit = total === 0 ? 0 : 10 - total;
  const lastChar = value[8];

  // Tipos que siempre usan letra de control: P, Q, S, W
  // Tipos que siempre usan dígito: A, B, E, H
  // Resto: cualquiera de los dos
  const letterTypes = 'PQSW';
  const digitTypes = 'ABEH';
  const entityType = value[0];

  if (letterTypes.includes(entityType)) {
    if (lastChar !== CIF_CONTROL_LETTERS[controlDigit]) {
      return { valid: false, error: 'El dígito de control del CIF no es correcto' };
    }
  } else if (digitTypes.includes(entityType)) {
    if (lastChar !== String(controlDigit)) {
      return { valid: false, error: 'El dígito de control del CIF no es correcto' };
    }
  } else {
    // Acepta dígito o letra
    const validDigit = lastChar === String(controlDigit);
    const validLetter = lastChar === CIF_CONTROL_LETTERS[controlDigit];
    if (!validDigit && !validLetter) {
      return { valid: false, error: 'El dígito de control del CIF no es correcto' };
    }
  }

  return { valid: true, type: 'CIF' };
}

/**
 * Valida un identificador fiscal español (NIF, NIE o CIF).
 * Normaliza automáticamente a mayúsculas y elimina espacios/guiones.
 */
export function validateSpanishTaxId(raw: string): TaxIdValidationResult {
  const value = raw.toUpperCase().replace(/[\s\-\.]/g, '');

  if (!value) {
    return { valid: false, error: 'El NIF/CIF es obligatorio' };
  }

  if (value.length < 9) {
    return { valid: false, error: 'Demasiado corto. Comprueba que has introducido todos los caracteres' };
  }

  if (value.length > 9) {
    return { valid: false, error: 'Demasiado largo. El NIF/CIF tiene 9 caracteres' };
  }

  // Intentar NIF
  const nifResult = validateNif(value);
  if (nifResult.valid || nifResult.error) return nifResult;

  // Intentar NIE
  const nieResult = validateNie(value);
  if (nieResult.valid || nieResult.error) return nieResult;

  // Intentar CIF
  const cifResult = validateCif(value);
  if (cifResult.valid || cifResult.error) return cifResult;

  return {
    valid: false,
    error: 'Formato no reconocido. Ejemplos válidos: 12345678A (NIF), X1234567L (NIE), B12345678 (CIF)',
  };
}
