function createPlugin(
  id: string,
  options?: unknown,
): { id: string; options?: unknown } {
  return options === undefined ? { id } : { id, options };
}

export const admin = (): { id: string; options?: unknown } =>
  createPlugin('admin');
export const bearer = (): { id: string; options?: unknown } =>
  createPlugin('bearer');
export const captcha = (options?: unknown): { id: string; options?: unknown } =>
  createPlugin('captcha', options);
export const emailOTP = (
  options?: unknown,
): { id: string; options?: unknown } => createPlugin('email-otp', options);
export const haveIBeenPwned = (
  options?: unknown,
): { id: string; options?: unknown } =>
  createPlugin('have-i-been-pwned', options);
export const lastLoginMethod = (
  options?: unknown,
): { id: string; options?: unknown } =>
  createPlugin('last-login-method', options);
export const testUtils = (
  options?: unknown,
): { id: string; options?: unknown } => createPlugin('test-utils', options);
export const organization = (
  options?: unknown,
): { id: string; options?: unknown } => createPlugin('organization', options);
export const twoFactor = (
  options?: unknown,
): { id: string; options?: unknown } => createPlugin('two-factor', options);
