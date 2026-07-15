import { mergeAuthPaths } from 'src/middleware/config/setup-auth-docs';
import { authOkResponse } from 'test/fixtures';
import {
  adminPath,
  authPath,
  organisationPath,
  userPath,
} from 'src/lib/betterauth/paths/auth-paths';

describe('setup-auth-docs', () => {
  it('merges auth paths with envelope sample responses', () => {
    const document = mergeAuthPaths({ paths: {}, openapi: '3.0.0', info: {} });
    const authOkPath = document.paths?.[authPath('/ok')] as
      Record<string, { responses?: Record<string, unknown> }> | undefined;

    expect(authOkPath?.get?.responses?.['200']).toEqual(
      expect.objectContaining({
        content: {
          'application/json': {
            example: authOkResponse,
          },
        },
      }),
    );
  });

  it('assigns split Swagger tags by domain', () => {
    const document = mergeAuthPaths({ paths: {}, openapi: '3.0.0', info: {} });

    const authOk = document.paths?.[authPath('/ok')]?.get as
      { tags?: string[] } | undefined;
    const signInEmail = document.paths?.[authPath('/sign/in/email')]?.post as
      { tags?: string[] } | undefined;
    const signInOtp = document.paths?.[authPath('/sign/in/email/otp')]?.post as
      { tags?: string[] } | undefined;
    const passkeySignIn = document.paths?.[authPath('/passkey/sign/in')]
      ?.post as { tags?: string[] } | undefined;
    const updateUser = document.paths?.[userPath('/update/user')]?.post as
      { tags?: string[] } | undefined;
    const createOrg = document.paths?.[organisationPath('/create')]?.post as
      { tags?: string[] } | undefined;
    const listUsers = document.paths?.[adminPath('/list/users')]?.get as
      { tags?: string[] } | undefined;

    expect(authOk?.tags).toEqual(['Server']);
    expect(signInEmail?.tags).toEqual(['Auth']);
    expect(signInOtp?.tags).toEqual(['Auth']);
    expect(passkeySignIn?.tags).toEqual(['Auth']);
    expect(updateUser?.tags).toEqual(['User']);
    expect(createOrg?.tags).toEqual(['Organisation']);
    expect(listUsers?.tags).toEqual(['Backoffice']);

    expect(document.tags?.map((tag) => tag.name)).toEqual(
      expect.arrayContaining([
        'Auth',
        'User',
        'Organisation',
        'Teams',
        'Referral',
        'Backoffice',
      ]),
    );

    for (const tag of document.tags ?? []) {
      expect(tag.description).not.toMatch(/Better Auth/i);
    }
  });

  it('documents routes under domain-scoped API prefixes', () => {
    const document = mergeAuthPaths({ paths: {}, openapi: '3.0.0', info: {} });

    for (const path of Object.keys(document.paths ?? {})) {
      expect(
        path.startsWith('/v1/api/auth/') ||
          path.startsWith('/v1/api/user/') ||
          path.startsWith('/v1/api/organisation/') ||
          path.startsWith('/v1/api/teams/') ||
          path.startsWith('/v1/api/admin/'),
      ).toBe(true);
    }
  });

  it('marks protected routes with session security', () => {
    const document = mergeAuthPaths({ paths: {}, openapi: '3.0.0', info: {} });

    const profile = document.paths?.[userPath('/profile')]?.get as
      { security?: Array<Record<string, string[]>> } | undefined;
    const signUp = document.paths?.[authPath('/sign/up/email')]?.post as
      { security?: Array<Record<string, string[]>> } | undefined;
    const listSessions = document.paths?.[userPath('/list/sessions')]?.get as
      { security?: Array<Record<string, string[]>> } | undefined;
    const adminList = document.paths?.[adminPath('/list/users')]?.get as
      { security?: Array<Record<string, string[]>> } | undefined;

    expect(profile?.security).toEqual([
      { sessionCookie: [] },
      { bearerAuth: [] },
    ]);
    expect(listSessions?.security).toEqual([
      { sessionCookie: [] },
      { bearerAuth: [] },
    ]);
    expect(adminList?.security).toEqual([
      { sessionCookie: [] },
      { bearerAuth: [] },
    ]);
    expect(signUp?.security).toEqual([]);
  });
});
