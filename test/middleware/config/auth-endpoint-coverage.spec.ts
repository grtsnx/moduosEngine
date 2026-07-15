import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import {
  ADMIN_E2E_COVERED_PUBLIC_SUFFIXES,
  AUTH_API_CATALOG,
  AUTH_E2E_COVERED_PUBLIC_SUFFIXES,
  ORGANISATION_E2E_COVERED_PUBLIC_SUFFIXES,
  TEAMS_E2E_COVERED_PUBLIC_SUFFIXES,
  USER_E2E_COVERED_PUBLIC_SUFFIXES,
  catalogPublicPath,
} from 'src/lib/betterauth/catalog/auth-api-catalog';
import { AUTH_DOCUMENTED_PATHS } from 'src/middleware/config/setup-auth-docs';

describe('auth endpoint coverage audit', () => {
  it('documents all catalogued Better Auth routes', () => {
    expect(AUTH_DOCUMENTED_PATHS).toHaveLength(AUTH_API_CATALOG.length);
  });

  it('maps e2e-covered auth paths to at least one auth e2e spec reference', () => {
    const e2eDir = join(process.cwd(), 'test/e2e');
    const e2eSources = readdirSync(e2eDir)
      .filter(
        (file) => file.startsWith('auth-') && file.endsWith('.e2e-spec.ts'),
      )
      .map((file) => readFileSync(join(e2eDir, file), 'utf8'))
      .join('\n');

    for (const suffix of AUTH_E2E_COVERED_PUBLIC_SUFFIXES) {
      expect(e2eSources).toContain(`authPath('${suffix}')`);
    }

    for (const suffix of USER_E2E_COVERED_PUBLIC_SUFFIXES) {
      expect(e2eSources).toContain(`userPath('${suffix}')`);
    }

    for (const suffix of ORGANISATION_E2E_COVERED_PUBLIC_SUFFIXES) {
      expect(e2eSources).toContain(`organisationPath('${suffix}')`);
    }

    for (const suffix of TEAMS_E2E_COVERED_PUBLIC_SUFFIXES) {
      expect(e2eSources).toContain(`teamsPath('${suffix}')`);
    }

    for (const suffix of ADMIN_E2E_COVERED_PUBLIC_SUFFIXES) {
      expect(e2eSources).toContain(`adminPath('${suffix}')`);
    }
  });

  it('documents routes under domain-scoped API prefixes', () => {
    for (const path of AUTH_DOCUMENTED_PATHS) {
      expect(
        path.startsWith('/v1/api/auth/') ||
          path.startsWith('/v1/api/user/') ||
          path.startsWith('/v1/api/organisation/') ||
          path.startsWith('/v1/api/teams/') ||
          path.startsWith('/v1/api/admin/'),
      ).toBe(true);
    }
  });

  it('uses catalogPublicPath for documented paths', () => {
    expect(AUTH_DOCUMENTED_PATHS).toEqual(
      AUTH_API_CATALOG.map((entry) => catalogPublicPath(entry)),
    );
  });
});
