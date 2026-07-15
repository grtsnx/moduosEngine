import { AUTH_API_CATALOG } from 'src/lib/betterauth/catalog/auth-api-catalog';
import { AUTH_API_RESPONSE_SAMPLES } from 'src/lib/betterauth/catalog/auth-api-catalog-samples';
import { catalogPublicPath } from 'src/lib/betterauth/catalog/auth-api-catalog';

type OpenApiDocument = {
  paths?: Record<string, Record<string, unknown>>;
  tags?: Array<{ name: string; description?: string }>;
  openapi?: string;
  info?: Record<string, unknown>;
};

type AuthApiSecurity = 'public' | 'session' | 'admin';

const SESSION_SECURITY: Array<Record<string, string[]>> = [
  { sessionCookie: [] },
  { bearerAuth: [] },
];

function resolveOpenApiSecurity(
  security: AuthApiSecurity,
): Array<Record<string, string[]>> {
  if (security === 'public') {
    return [];
  }

  return SESSION_SECURITY;
}

export const AUTH_DOCUMENTED_PATHS = AUTH_API_CATALOG.map((catalogEntry) =>
  catalogPublicPath(catalogEntry),
);

export function mergeAuthPaths(document: OpenApiDocument): OpenApiDocument {
  const paths = { ...document.paths };

  for (const catalogEntry of AUTH_API_CATALOG) {
    const path = catalogPublicPath(catalogEntry);
    const existing = paths[path] ?? {};
    const adminNote =
      catalogEntry.security === 'admin' ? ' Requires an admin session.' : '';

    paths[path] = {
      ...existing,
      [catalogEntry.method]: {
        tags: [catalogEntry.tag],
        summary: catalogEntry.summary,
        description: adminNote || undefined,
        security: resolveOpenApiSecurity(catalogEntry.security),
        ...(catalogEntry.requestExample
          ? {
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    example: catalogEntry.requestExample,
                  },
                },
              },
            }
          : {}),
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                example:
                  AUTH_API_RESPONSE_SAMPLES[catalogEntry.responseSampleId],
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                example: {
                  statusCode: 400,
                  statusType: 'BAD_REQUEST',
                  message: 'Invalid request',
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                example: {
                  statusCode: 401,
                  statusType: 'UNAUTHORIZED',
                  message: 'Unauthorized',
                },
              },
            },
          },
        },
      },
    };
  }

  return {
    ...document,
    paths,
    tags: [
      ...(document.tags ?? []),
      {
        name: 'Auth',
        description: 'Core authentication and session',
      },
      {
        name: 'User',
        description: 'Profile, sessions, accounts, and security settings',
      },
      {
        name: 'Organisation',
        description: 'Organization management',
      },
      {
        name: 'Teams',
        description: 'Organization teams management',
      },
      {
        name: 'Referral',
        description: 'Referral codes and attribution (no rewards)',
      },
      {
        name: 'Backoffice',
        description: 'Admin operations',
      },
    ],
  };
}
