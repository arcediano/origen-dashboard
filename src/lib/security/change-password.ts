export interface ChangePasswordFormState {
  current: string;
  new: string;
  confirm: string;
}

const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).+$/;

export function validatePasswordChange(password: ChangePasswordFormState): string | null {
  if (!password.current || !password.new || !password.confirm) {
    return 'Completa todos los campos de contraseña.';
  }

  if (password.new.length < 8) {
    return 'La nueva contraseña debe tener al menos 8 caracteres.';
  }

  if (!PASSWORD_POLICY.test(password.new)) {
    return 'La nueva contraseña debe incluir mayúscula, minúscula, número y símbolo.';
  }

  if (password.new === password.current) {
    return 'La nueva contraseña debe ser diferente a la actual.';
  }

  if (password.new !== password.confirm) {
    return 'Las contraseñas no coinciden.';
  }

  return null;
}
