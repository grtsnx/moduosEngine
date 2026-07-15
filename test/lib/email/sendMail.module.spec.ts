import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const TEMPLATE_NAMES = [
  'auth-otp.hbs',
  'auth-org-invite.hbs',
  'welcome.hbs',
] as const;

describe('SendMailsModule template directory', () => {
  it('resolves template files next to compiled module output', () => {
    const templateDir = join(__dirname, '../../../src/lib/email/templates');
    const files = readdirSync(templateDir);

    for (const templateName of TEMPLATE_NAMES) {
      expect(files).toContain(templateName);
      expect(existsSync(join(templateDir, templateName))).toBe(true);
    }
  });

  it('includes auth-otp template in build output when dist exists', () => {
    const builtTemplate = join(
      process.cwd(),
      'dist/src/lib/email/templates/auth-otp.hbs',
    );
    const builtPartial = join(
      process.cwd(),
      'dist/src/lib/email/templates/partials/stripe-layout-open.hbs',
    );

    if (!existsSync(join(process.cwd(), 'dist/src/main.js'))) {
      return;
    }

    expect(existsSync(builtTemplate)).toBe(true);
    expect(existsSync(builtPartial)).toBe(true);
  });
});
