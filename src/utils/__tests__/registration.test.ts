import { registerErrorMessage, validateRegistration } from '@/utils/registration';
import { ApiError } from '@/types/api';
import type { OwnerRegistration } from '@/types/auth';

const VALID: OwnerRegistration = {
  first_name: 'Ana',
  last_name: 'Ruiz',
  identity_document: 'V-12345678',
  email: ' ana@example.com ',
  username: 'anaruiz',
  password: 'password123',
  password_confirmation: 'password123',
  address: '',
  sex: 'female',
  phone: '',
  phone_type: 'whatsapp',
};

describe('validateRegistration', () => {
  it('un formulario completo se puede enviar', () => {
    expect(validateRegistration(VALID)).toEqual({ canSubmit: true });
  });

  it('explica el correo, la contraseña corta y la confirmación distinta', () => {
    expect(
      validateRegistration({
        ...VALID,
        email: 'ana@',
        password: 'corta',
        password_confirmation: 'otra',
      }),
    ).toEqual({
      canSubmit: false,
      email: 'Correo inválido.',
      password: 'Mínimo 8 caracteres.',
      password_confirmation: 'Las contraseñas no coinciden.',
    });
  });

  it('no muestra errores en campos aún vacíos, pero no deja enviar', () => {
    expect(
      validateRegistration({
        ...VALID,
        first_name: ' ',
        email: '',
        password: '',
        password_confirmation: '',
      }),
    ).toEqual({ canSubmit: false });
  });
});

describe('registerErrorMessage', () => {
  it('los 422 por campo se muestran en cada campo (sin mensaje general)', () => {
    const err = new ApiError({
      message: 'Revisa los datos ingresados.',
      status: 422,
      kind: 'validation',
      fieldErrors: { email: ['ya está en uso'] },
    });
    expect(registerErrorMessage(err)).toBeUndefined();
  });

  it('sin red, 5xx o 429 hay un mensaje general', () => {
    expect(
      registerErrorMessage(
        new ApiError({ message: 'Sin conexión.', status: 0, kind: 'network' }),
      ),
    ).toBe('Sin conexión.');
    expect(registerErrorMessage(new Error('x'))).toBe('No se pudo crear la cuenta.');
  });

  it('un 422 con errores fuera del formulario (base) también se muestra', () => {
    const err = new ApiError({
      message: 'Revisa los datos ingresados.',
      status: 422,
      kind: 'validation',
      fieldErrors: { base: ['no se pudo registrar'] },
    });
    expect(registerErrorMessage(err)).toBe('no se pudo registrar');
  });
});
