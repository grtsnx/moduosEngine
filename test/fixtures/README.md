# Test Fixture Catalog

All fixture values in `test/fixtures/` are synthetic and safe for CI logs.
No real user credentials, production tokens, or external API secrets are stored.

## Fixture inventory

| File | Test data | Intent |
| --- | --- | --- |
| `betterauth.fixture.ts` | synthetic auth payloads, callback/redirect edge-case URLs (valid + malicious + malformed) | Validate Better Auth response handling, redirect validation, and abuse-path rejection |
| `env.fixture.ts` | validated env snapshots and invalid env matrices | Validate strict env parsing and production hardening requirements |
| `email.fixture.ts` | synthetic recipients/subjects/template contexts | Validate transactional email rendering and queue payload behavior |
| `database.fixture.ts` | valid/empty/whitespace DB URL strings | Validate DB enable/disable behavior |
| `redis.fixture.ts` | valid/empty Redis URLs, cache key patterns | Validate Redis configuration and key-path behavior |
| `queue.fixture.ts` | queue job names + payloads | Validate queue enqueue/processor contract |
| `gravatar.fixture.ts` | deterministic avatar URL permutations | Validate URL normalization rules |
| `mail-transport.fixture.ts` | provider-specific transport settings | Validate SMTP/google/test transport branching |
| `platform.fixture.ts` | branding/support defaults and overrides | Validate platform context fallback behavior |

## Dash e2e synthetic data

Dash integration tests generate the following runtime-only synthetic artifacts:

- ephemeral RSA keypair for mock Better Auth Infra JWKS;
- short-lived signed JWTs carrying `apiKeyHash`;
- local mock API responses for `/api/auth/jwks` and `/api/auth/check-jti`.

These artifacts are generated in-memory at test runtime and are never persisted.
