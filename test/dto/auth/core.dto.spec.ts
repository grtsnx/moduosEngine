import { validate } from 'class-validator';

import { SignInEmailRequestDto, SignUpEmailRequestDto } from 'src/dto';

describe('auth core DTOs', () => {
  const validSignUp = {
    email: 'alex@example.com',
    password: 'SecurePass123!',
    confirmPassword: 'SecurePass123!',
    firstName: 'Alex',
    lastName: 'Example',
  };

  it('accepts valid sign-up payload', async () => {
    const dto = Object.assign(new SignUpEmailRequestDto(), validSignUp);

    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects weak password on sign-up', async () => {
    const dto = Object.assign(new SignUpEmailRequestDto(), {
      ...validSignUp,
      password: 'short',
      confirmPassword: 'short',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects missing confirmPassword on sign-up', async () => {
    const dto = Object.assign(new SignUpEmailRequestDto(), {
      ...validSignUp,
      confirmPassword: undefined,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects confirmPassword mismatch on sign-up', async () => {
    const dto = Object.assign(new SignUpEmailRequestDto(), {
      ...validSignUp,
      confirmPassword: 'OtherPass123!',
    });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'confirmPassword')).toBe(
      true,
    );
  });

  it('rejects empty firstName or lastName on sign-up', async () => {
    const missingFirstName = Object.assign(new SignUpEmailRequestDto(), {
      ...validSignUp,
      firstName: '',
    });
    const missingLastName = Object.assign(new SignUpEmailRequestDto(), {
      ...validSignUp,
      lastName: '',
    });

    expect((await validate(missingFirstName)).length).toBeGreaterThan(0);
    expect((await validate(missingLastName)).length).toBeGreaterThan(0);
  });

  it('rejects invalid sign-in email', async () => {
    const dto = Object.assign(new SignInEmailRequestDto(), {
      email: 'not-an-email',
      password: 'SecurePass123!',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
