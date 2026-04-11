import { describe, expect, it } from 'vitest';
import { validatePasswordChange } from '@/lib/security/change-password';

describe('validatePasswordChange', () => {
  it('devuelve error si falta algún campo', () => {
    expect(
      validatePasswordChange({
        current: '',
        new: 'NewSecurePass1!',
        confirm: 'NewSecurePass1!',
      }),
    ).toBe('Completa todos los campos de contraseña.');
  });

  it('devuelve error si la nueva contraseña tiene menos de 8 caracteres', () => {
    expect(
      validatePasswordChange({
        current: 'CurrentPass1!',
        new: 'Ab1!',
        confirm: 'Ab1!',
      }),
    ).toBe('La nueva contraseña debe tener al menos 8 caracteres.');
  });

  it('devuelve error si la nueva contraseña no cumple la política', () => {
    expect(
      validatePasswordChange({
        current: 'CurrentPass1!',
        new: 'passwordlargo',
        confirm: 'passwordlargo',
      }),
    ).toBe('La nueva contraseña debe incluir mayúscula, minúscula, número y símbolo.');
  });

  it('devuelve error si la nueva contraseña es igual a la actual', () => {
    expect(
      validatePasswordChange({
        current: 'CurrentPass1!',
        new: 'CurrentPass1!',
        confirm: 'CurrentPass1!',
      }),
    ).toBe('La nueva contraseña debe ser diferente a la actual.');
  });

  it('devuelve error si la confirmación no coincide', () => {
    expect(
      validatePasswordChange({
        current: 'CurrentPass1!',
        new: 'NewSecurePass1!',
        confirm: 'OtherSecurePass1!',
      }),
    ).toBe('Las contraseñas no coinciden.');
  });

  it('devuelve null para una contraseña válida', () => {
    expect(
      validatePasswordChange({
        current: 'CurrentPass1!',
        new: 'NewSecurePass1!',
        confirm: 'NewSecurePass1!',
      }),
    ).toBeNull();
  });
});
