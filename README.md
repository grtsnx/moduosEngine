# NestJS API scaffold

Secured NestJS API scaffold. Set `PLATFORM_NAME` and related env vars for your deployment. Includes production-oriented middleware, standardized API responses, environment validation, and CI checks.

## Requirements

- [Bun](https://bun.sh) >= 1.0.0
- [PostgreSQL](https://www.postgresql.org/) when using database features locally

## Getting started

```bash
# Install dependencies (runs prisma generate via postinstall)
bun install

# Copy environment template
cp .env.sample .env

# Optional: set DATABASE_URL and REDIS_URL in .env, then apply migrations
bun run prisma:migrate:dev

# Optional: create a superadmin (writes BACKOFFICE_ADMIN_* to .env and seeds the DB)
bun run seed:superadmin

# Start in watch mode
bun run start:dev
```

When dependencies are configured, startup logs show connection status:

```
✓ Redis connected
✓ Database connected
✓ Queue connected
```

If `REDIS_URL` or `DATABASE_URL` is unset, the corresponding service logs a warning and is disabled (development/test only).

The server runs at `http://localhost:3000` by default.

## Environment variables

Copy [`.env.sample`](.env.sample) to `.env` and adjust values.

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No (default: `3000`) | HTTP port |
| `NODE_ENV` | No (default: `development`) | `development`, `production`, or `test` |
| `TRUST_PROXY` | No (default: `false`) | `false`, `true`, or trusted proxy hop count (e.g. `1`) |
| `PRODUCTION_URL` | Yes in production | Public production API URL |
| `DEVELOPMENT_URL` | Yes in production | Public development/staging API URL |
| `PLATFORM_URL` | Yes in production | Frontend or platform URL for CORS/CSP |
| `PLATFORM_NAME` | Yes in production | Platform name for docs, logs, and email copy |
| `ENABLE_API_DOCS` | No | `true`/`false`; defaults to `true` in dev, `false` in production |
| `LOG_LEVEL` | No (default: `info`) | `fatal`, `error`, `warn`, `info`, `debug`, `trace` |
| `CORS_ORIGINS` | No | Comma-separated extra browser origins allowed by Nest CORS and Better Auth trusted-origin checks |
| `REDIS_URL` | Yes in production | Redis URL for BullMQ async email and cache |
| `DATABASE_URL` | Yes in production | PostgreSQL connection string for Prisma |
| `EMAIL_PROVIDER` | No (default: `test` without `DATABASE_URL`) | `test`, `google`, or `smtp`; must not be `test` when `DATABASE_URL` is set or in production |
| `BETTER_AUTH_SECRET` | Yes when `DATABASE_URL` is set (min 32 chars) | Better Auth secret; also required in production |
| `PLATFORM_SUPPORT` | Yes | From address for transactional email |
| `PLATFORM_LOGO_URL` | No | Logo URL in email templates |
| `COLOR_CODE` | No (default: `#635BFF`) | Brand accent color in emails |
| `RATE_LIMIT_TTL` | No (default: `60000`) | Rate limit window in milliseconds |
| `RATE_LIMIT_MAX` | No (default: `30`) | Max requests per IP per window |
| `EMAIL_ADDRESS`, `EMAIL_PASSWORD` | When `EMAIL_PROVIDER=google` | Gmail credentials |
| `SMTP_PORT` | No (default: `587`) | SMTP server port |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | When `EMAIL_PROVIDER=smtp` | SMTP credentials |
| `BETTER_AUTH_SECRET` | Yes in production | Better Auth secret (minimum 32 chars) |
| `BETTER_AUTH_URL` | No (derived from `PLATFORM_URL`/localhost) | Better Auth base URL; must be HTTPS in production |
| `BETTER_AUTH_API_KEY` | Required for Better Auth Dash/Sentinel | Better Auth Infrastructure API key |
| `BETTER_AUTH_API_URL` | No | Override Better Auth Infrastructure API base URL (used for local/ngrok validation and dashboard JWT checks) |
| `BETTER_AUTH_IDENTIFY_URL` | No | Better Auth Infrastructure identify/KV endpoint for Dash and Sentinel |
| `BETTER_AUTH_RATE_LIMIT_WINDOW` | No (default: `60`) | Better Auth rate-limit window in seconds |
| `BETTER_AUTH_RATE_LIMIT_MAX` | No (default: `100`) | Better Auth max requests per rate-limit window |
| `BETTER_AUTH_DASH_STARTUP_CHECKS` | No (default: `true` when API key is set) | Fail-fast startup dash schema checks (`user/session` required query fields) |
| `CAPTCHA_ENABLED` | No (default: `false`) | Enable Cloudflare Turnstile captcha on protected auth POSTs |
| `TURNSTILE_SECRET_KEY` | Yes when `CAPTCHA_ENABLED=true` | Cloudflare Turnstile secret key (server-side verify only; site key stays on the frontend) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Optional (both required to enable) | Google OAuth |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | Optional (both required to enable) | GitHub OAuth |
| `APPLE_CLIENT_ID`, `APPLE_CLIENT_SECRET` | Optional (both required to enable) | Apple OAuth |
| `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` | Optional (both required to enable) | Microsoft OAuth |
| `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` | Optional (both required to enable) | Discord OAuth |
| `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET` | Optional (both required to enable) | Twitter/X OAuth |
| `BACKOFFICE_ADMIN_EMAIL` | No | Superadmin email for `bun run seed:superadmin` / `bun run prisma:seed` |
| `BACKOFFICE_ADMIN_PASSWORD` | No | Superadmin password (required with email to run the seed) |
| `BACKOFFICE_ADMIN_NAME` | No (default: `Superadmin`) | Display name for the seeded superadmin user |

Production example:

```env
NODE_ENV=production
PORT=3000
TRUST_PROXY=1
PRODUCTION_URL=https://api.example.com
DEVELOPMENT_URL=https://api-dev.example.com
PLATFORM_URL=https://app.example.com
PLATFORM_NAME=your-platform
ENABLE_API_DOCS=false
LOG_LEVEL=info
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=secret
PLATFORM_SUPPORT=noreply@example.com
REDIS_URL=redis://redis.example.com:6379
DATABASE_URL=postgresql://user:pass@postgres.example.com:5432/penielvault
RATE_LIMIT_TTL=60000
RATE_LIMIT_MAX=30
BETTER_AUTH_SECRET=production-secret-minimum-32-characters-long
BETTER_AUTH_URL=https://api.example.com
BETTER_AUTH_API_KEY=better-auth-api-key
BETTER_AUTH_RATE_LIMIT_WINDOW=60
BETTER_AUTH_RATE_LIMIT_MAX=100
BETTER_AUTH_DASH_STARTUP_CHECKS=true
CAPTCHA_ENABLED=false
```

Ngrok/local proxy note for Better Auth Dash:

- Keep `BETTER_AUTH_URL`, `PRODUCTION_URL`, and `PLATFORM_URL` on the same active ngrok origin.
- Set `TRUST_PROXY=true` (or explicit hop count) when traffic is proxied.

### Cloudflare Turnstile captcha

Bot protection is optional and **endpoint-scoped** (not global). Controlled by env:

```env
CAPTCHA_ENABLED=true
TURNSTILE_SECRET_KEY=your-turnstile-secret
```

The Turnstile **site key** is client-only (frontend widget). This backend does not collect or use it.

When `CAPTCHA_ENABLED=true`, Better Auth verifies Turnstile only on these **POST** auth endpoints (server-internal paths):

| Internal path | Public alias |
|---------------|--------------|
| `/sign-up/email` | `/v1/api/auth/sign/up/email` |
| `/sign-in/email` | `/v1/api/auth/sign/in/email` |
| `/request-password-reset` | `/v1/api/auth/request/password/reset` |
| `/email-otp/send-verification-otp` | `/v1/api/auth/email/otp/send` |
| `/sign-in/email-otp` | `/v1/api/auth/sign/in/email/otp` |
| `/email-otp/request-password-reset` | `/v1/api/auth/email/otp/request/password/reset` |
| `/forget-password/email-otp` | `/v1/api/auth/forget/password/email/otp` |

Those protected POSTs must include header `x-captcha-response` with a valid Turnstile token. Captcha does **not** apply to other auth routes (for example OTP verify, get-session, organization/admin, OAuth callbacks, passkey, or 2FA).

Clients should render a Cloudflare Turnstile widget with their site key, then attach the token:

```ts
await authClient.signIn.email({
  email: 'user@example.com',
  password: 'secure-password',
  fetchOptions: {
    headers: {
      'x-captcha-response': turnstileToken,
    },
  },
});
```

Leave `CAPTCHA_ENABLED=false` (default) for local development without Turnstile.

## Social OAuth and callback URLs

Social sign-in uses Better Auth OAuth. A provider is enabled only when **both** its client ID and secret are set in env (for example `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`).

Supported providers: `google`, `github`, `apple`, `microsoft`, `discord`, `twitter`.

### Two different callback URLs

OAuth involves two callback concepts:

1. **Provider redirect URI** (register at Google/GitHub/etc.) — where the OAuth provider sends the user back to **this API**.
2. **Application `callbackURL`** (sent in the API request body) — where Better Auth sends the user after auth completes, usually your **frontend** route.

### Provider redirect URIs (OAuth console)

Register these redirect URIs in each provider dashboard. Better Auth uses:

```text
{BETTER_AUTH_URL}/v1/api/auth/callback/{provider}
```

Examples when `BETTER_AUTH_URL=https://api.example.com`:

| Provider | Redirect URI |
|----------|--------------|
| Google | `https://api.example.com/v1/api/auth/callback/google` |
| GitHub | `https://api.example.com/v1/api/auth/callback/github` |
| Apple | `https://api.example.com/v1/api/auth/callback/apple` |
| Microsoft | `https://api.example.com/v1/api/auth/callback/microsoft` |
| Discord | `https://api.example.com/v1/api/auth/callback/discord` |
| Twitter | `https://api.example.com/v1/api/auth/callback/twitter` |

Notes:

- `BETTER_AUTH_URL` must be the public API origin (scheme + host, no path). Better Auth appends `basePath` (`/v1/api/auth`) automatically.
- In production, use HTTPS redirect URIs.
- When tunneling locally (ngrok), set `BETTER_AUTH_URL` to the active ngrok origin and register that same callback URL in the provider console.
- OAuth callback routes are not rewritten to public aliases; providers should call the internal callback path above.

### Application `callbackURL` (frontend post-login redirect)

When starting social sign-in or linking an account, send an absolute frontend URL in `callbackURL`. Its **origin** must be in the trusted-origin allowlist (see CORS/trusted origins below).

| Action | Public API route | Example body |
|--------|------------------|--------------|
| Sign in with social | `POST /v1/api/auth/sign/in/social` | `{ "provider": "google", "callbackURL": "https://app.example.com/dashboard" }` |
| Link social account (session required) | `POST /v1/api/user/link/social` | `{ "provider": "google", "callbackURL": "https://app.example.com/settings" }` |

Validation rules:

- `callbackURL` must be a valid absolute `http://` or `https://` URL.
- Malformed values return `400`.
- Origins outside the trusted allowlist return `403` (`callbackURL origin is not trusted`).

Example:

```bash
curl -X POST https://api.example.com/v1/api/auth/sign/in/social \
  -H 'Content-Type: application/json' \
  -d '{
    "provider": "google",
    "callbackURL": "https://app.example.com/dashboard"
  }'
```

The response redirects (or returns a URL) to the provider; after provider callback handling, Better Auth completes the flow and redirects to your `callbackURL`.

### CORS policy

Nest CORS is configured in `configure-app.ts` with `credentials: true`.

**Allowed origins**

| Environment | Default origins | Also includes |
|-------------|-----------------|---------------|
| Development | `PRODUCTION_URL`, `DEVELOPMENT_URL`, `PLATFORM_URL`, `http://localhost:{PORT}` | every value in `CORS_ORIGINS` |
| Production | `PRODUCTION_URL`, `PLATFORM_URL` | every value in `CORS_ORIGINS` |

`DEVELOPMENT_URL` and `http://localhost:{PORT}` are **not** included in production CORS defaults.

**Validation**

- `CORS_ORIGINS` cannot contain `*` (credentials are enabled).
- In production, every `CORS_ORIGINS` entry must use `https://`.
- Each entry must be a valid absolute URL; origins are normalized from the URL value.

**Allowed methods**

`GET`, `PATCH`, `POST`, `PUT`, `DELETE`, `OPTIONS`

**Allowed request headers**

`Content-Type`, `Authorization`, `X-Visitor-Id`, `X-Request-Id`, `X-Device-Id`, `X-Device-Name`

Example for a separate frontend and admin app:

```env
PLATFORM_URL=https://app.example.com
PRODUCTION_URL=https://api.example.com
CORS_ORIGINS=https://admin.example.com,https://staging.example.com
```

### Better Auth trusted origins (callbackURL / CSRF)

Separate from Nest CORS, Better Auth builds a `trustedOrigins` allowlist from:

- `PRODUCTION_URL`
- `DEVELOPMENT_URL`
- `PLATFORM_URL`
- `BETTER_AUTH_URL`
- `CORS_ORIGINS`
- `http://localhost:{PORT}` in development only

In production, only `https://` origins are kept.

This list is used to validate `callbackURL` on:

- `POST /sign-in/social`
- `POST /link-social`
- `POST /organization/get-invitation-url`

If your frontend origin is not covered by `PLATFORM_URL` / `PRODUCTION_URL` / `DEVELOPMENT_URL`, add it to `CORS_ORIGINS`.

### CSP `connect-src`

Helmet CSP `connect-src` allows API calls from:

- `'self'`
- `PRODUCTION_URL`
- `DEVELOPMENT_URL`
- `PLATFORM_URL`
- `http://localhost:{PORT}` (when set)

Keep these env URLs aligned with the origins your browser clients actually use.

## Email

Transactional email via `@nestjs-modules/mailer` with Handlebars templates and optional BullMQ async delivery.

### Providers

| Provider | Use case | Required vars |
|----------|----------|---------------|
| `test` | Local dev and CI (jsonTransport, no network) | `PLATFORM_SUPPORT` |
| `google` | Gmail | `EMAIL_ADDRESS`, `EMAIL_PASSWORD` |
| `smtp` | Custom SMTP | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` (`SMTP_PORT` optional, default `587`) |

Shared branding vars: `PLATFORM_NAME`, `PLATFORM_SUPPORT`, `PLATFORM_URL`, `PLATFORM_LOGO_URL`, `COLOR_CODE`.

### Sync send

```typescript
import { SendMailsService } from 'src/lib';

await sendMailsService.sendWelcomeEmail('user@example.com', {
  firstName: 'Alex',
  ctaUrl: 'https://app.example.com/dashboard',
});
```

### Async send (BullMQ)

Requires `REDIS_URL`. The API enqueues jobs on the `email` queue; a **separate worker process** consumes them (see [Worker process](#worker-process)).

```typescript
await sendMailsService.sendEmailAsync(
  'user@example.com',
  'Welcome to your-platform',
  'welcome',
  { firstName: 'Alex' },
);
```

Job payload shape:

```typescript
{
  to: string | string[];
  subject: string;
  template: string;
  context?: Record<string, unknown>;
}
```

Queue hardening defaults:

- malformed email jobs are rejected before enqueue/processing
- deduplicated `jobId` for identical payloads
- retry with exponential backoff (`attempts=3`)
- automatic Redis cleanup (`removeOnComplete` / `removeOnFail`)

### Templates

Templates live in `src/lib/email/templates/` and are copied to `dist` on build.

**`welcome.hbs`** — Stripe-inspired welcome email:

| Variable | Source |
|----------|--------|
| `platformName`, `platformSupport`, `platformUrl`, `logoUrl`, `brandColor`, `year` | Auto-merged from env |
| `firstName` | Required in context |
| `ctaUrl` | Optional; defaults to `PLATFORM_URL` in `sendWelcomeEmail` |

Sample test data lives in `test/fixtures/` (import via `test/fixtures`).

## Database (Prisma)

PostgreSQL access via [Prisma ORM v7](https://www.prisma.io/) with the `@prisma/adapter-pg` driver adapter. The client is generated to `generated/prisma/` (gitignored; created on `bun install` via `postinstall`).

### Setup

```bash
cp .env.sample .env
# Set DATABASE_URL in .env
bun run prisma:migrate:dev
bun run start:dev
```

### Better Auth schema generation

When you add or remove Better Auth plugins (OTP, 2FA, organization, passkey, `better-auth-harmony`, etc.), regenerate the Prisma schema from the live auth config:

```bash
# Requires DATABASE_URL in .env (CLI loads src/lib/betterauth/core/auth.cli.ts)
bun run auth:generate
bun run prisma:migrate:dev
bun run prisma:generate
```

| Item | Notes |
|------|-------|
| Config entrypoint | `src/lib/betterauth/core/auth.cli.ts` → `buildAuth()` in `auth-options.ts` |
| `DATABASE_URL` | **Required** for `auth:generate`; without it the CLI cannot load the Prisma adapter config |
| `BETTER_AUTH_SECRET` | Optional for generate only — the CLI config sets a 32+ char fallback when unset |
| Up-to-date output | `Your schema is already up to date.` means `prisma/schema.prisma` matches the current plugin set (no file changes) |

Plugin-driven fields already in this repo include `User.normalizedEmail` (`@unique`) from `better-auth-harmony` for email normalization and disposable-domain blocking.

### Superadmin seed

After migrations, create a backoffice superadmin (Better Auth `admin` role) for `/v1/api/admin/*` routes:

```bash
bun run seed:superadmin
```

This script:

1. Generates credentials (or reuses existing `BACKOFFICE_ADMIN_*` values in `.env`)
2. Writes `BACKOFFICE_ADMIN_EMAIL`, `BACKOFFICE_ADMIN_PASSWORD`, and `BACKOFFICE_ADMIN_NAME` to `.env`
3. Runs the Prisma seed to create or update the user in the database

Custom credentials:

```bash
bun run seed:superadmin -- --email=admin@example.com --password='YourSecurePass123' --name='Admin User'
```

Preview without writing `.env` or seeding:

```bash
bun scripts/seed-superadmin.mjs --dry-run
```

Manual seed (set env vars yourself, then run):

```bash
bun run prisma:seed
```

Sign in with the seeded email and password via `POST /v1/api/auth/sign/in/email`. The user has `role: admin` and can call admin routes such as `GET /v1/api/admin/list/users`.

### Usage

```typescript
import { PrismaService } from 'src/lib';

// In a service constructor
constructor(private readonly prisma: PrismaService) {}

// When DATABASE_URL is set
const db = this.prisma.client();
await db.$queryRaw`SELECT 1`;
```

`DATABASE_URL` is optional in development and test (Prisma is disabled when unset). It is **required** in production.

### Prisma scripts

| Command | Description |
|---------|-------------|
| `bun run prisma:generate` | Regenerate Prisma Client after schema changes |
| `bun run prisma:migrate:dev` | Create/apply migrations in development |
| `bun run prisma:migrate:deploy` | Apply pending migrations in production |
| `bun run prisma:seed` | Seed backoffice superadmin from `BACKOFFICE_ADMIN_*` env vars |
| `bun run seed:superadmin` | Write superadmin credentials to `.env` and run `prisma:seed` |

## Worker process

The **email worker** is a separate Node process that consumes BullMQ jobs from Redis. The HTTP API only **enqueues** emails via `QueueService`; it never sends them in the background itself. That split keeps API latency predictable and lets you scale workers independently in production.

All worker wiring lives under `src/middleware/worker/`:

| File | Role |
|------|------|
| `middleware/worker/worker.module.ts` | Nest module: config, logging, `SendMailsModule`, `EmailWorkerModule` |
| `middleware/worker/bootstrap-worker.ts` | Bootstraps the worker application context (no HTTP) |
| `middleware/queue/email-worker.module.ts` | Registers `EmailProcessor` (BullMQ consumer) |
| `middleware/worker/worker.ts` | Process entry point (like `main.ts`) — run via `start:worker` scripts |

In production, run the HTTP API and email worker as separate processes:

```bash
bun run start:prod          # HTTP API (enqueue only)
bun run start:worker:prod   # BullMQ email worker
```

Development:

```bash
bun run start:dev
bun run start:worker
```

The worker entry point is `src/middleware/worker/worker.ts`; it calls `bootstrapWorker()` in the same folder.

## Health checks

| Endpoint | Type | Description |
|----------|------|-------------|
| `GET /health` | Liveness | Process is up; no dependency checks |
| `GET /health/ready` | Readiness | Redis ping + queue configuration + database ping; returns **503** when unhealthy |

Both endpoints are excluded from rate limiting for load balancer probes.

## Testing

### Fixtures (`test/fixtures/`)

Shared test data for edge cases. Import from `test/fixtures` in specs:
Detailed fixture/test-data catalog: [`test/fixtures/README.md`](test/fixtures/README.md).

| Fixture file | Edge cases covered |
|--------------|-------------------|
| `email.fixture.ts` | Welcome recipient/context, multi-recipient, job payload, missing `ctaUrl` |
| `env.fixture.ts` | Dev/prod config snapshots, invalid NODE_ENV/PORT, partial google/smtp creds, empty `PLATFORM_SUPPORT`, production `DATABASE_URL` |
| `database.fixture.ts` | Valid/unset/whitespace `DATABASE_URL` values |
| `redis.fixture.ts` | Empty/whitespace/valid URLs, key patterns, sample values |
| `queue.fixture.ts` | `email.send` and custom job names/payloads |
| `gravatar.fixture.ts` | Custom options, `ensureHttpsUrl` for http/`//`/bare/https |
| `mail-transport.fixture.ts` | test/google/smtp/invalid provider configs, missing `PLATFORM_SUPPORT` |
| `platform.fixture.ts` | Empty env, mail-from with/without name, context overrides |
| `betterauth.fixture.ts` | Auth requests/responses, malicious callback/redirect URLs, malformed URL payloads |

### Edge-case coverage by layer

| Layer | Spec | Notable edge cases |
|-------|------|-------------------|
| **lib/email** | `sendMail.service.spec.ts` | ETIMEDOUT, SMTP failure, multi-recipient, `ctaUrl` fallback, enqueue false/rejected |
| **lib/redis** | `redis.service.spec.ts` | Disabled Redis, null key, no TTL, lock fail, empty pattern, startup connect/warn/error logs |
| **lib/prisma** | `prisma.service.spec.ts` | Disabled DB, ping success/failure, connect/disconnect lifecycle, `client()` throws when unset, startup connect/warn logs |
| **lib/gravatar** | `gravatar.service.spec.ts` | All URL normalization branches via fixture table |
| **lib/betterauth** | `auth-env.spec.ts`, `auth-options.spec.ts`, `email-harmony.spec.ts`, `existing-user-signup.spec.ts`, `normalize-auth-path.spec.ts`, `request-url-guard.spec.ts` | Trusted origins, plugin wiring (`emailHarmony`, OTP, 2FA), disposable-domain blocking, normalized-email schema checks, duplicate sign-up OTP resend, callback/redirect allowlist |
| **middleware/common** | `platform-context.spec.ts` | Empty env defaults, overrides, mail-from edge cases |
| **middleware/common** | `redis-connection.spec.ts` | Empty, whitespace, valid URL |
| **middleware/common** | `normalize-forwarded-headers.spec.ts` | Duplicate `x-forwarded-*` normalization and pass-through behavior |
| **middleware/common** | `wrap-redis-error.spec.ts` | Error and non-Error values |
| **middleware/config** | `env.validation.spec.ts` | Production URLs, `DATABASE_URL` in production, test defaults, partial credentials |
| **middleware/config** | `mail-transport.factory.spec.ts` | All providers, invalid provider, missing support |
| **middleware/queue** | `queue.service.spec.ts` | Disabled queue, custom job name, startup connect/warn logs |
| **middleware/queue** | `email.processor.spec.ts` | Unknown job ignored, test env skip, no Redis skip |
| **middleware/health** | `health-indicators.spec.ts` | Redis, queue, and Prisma readiness indicators |
| **middleware/worker** | `worker.module.spec.ts` | Worker module compiles; API boot does not start BullMQ worker |
| **middleware/worker** | `bootstrap-worker.spec.ts` | Application context bootstrap and startup log |
| **e2e/auth** | `auth-*.e2e-spec.ts`, `auth-core.e2e-spec.ts` | Untrusted callback/redirect rejection, disposable-domain sign-up rejection (`better-auth-harmony`), magic-link rate-limit abuse path, full auth route coverage |

## Scripts

### Rename project

Replace the package/brand name everywhere in the repo (case-insensitive: `penielvault`, `PenielVault`, `PENIELVAULT`, plus kebab/snake variants). Skips `node_modules`, `dist`, `.git`, and lockfiles by default.

```bash
# Preview changes
bun run rename:project -- --from=penielvault --to=moduos --dry-run

# Apply
bun run rename:project -- --from=penielvault --to=moduos
```

Useful flags:

| Flag | Description |
|------|-------------|
| `--dry-run` | Print matched files without writing |
| `--include-lockfiles` | Also rewrite `bun.lock` / other lockfiles |
| `--no-rename-paths` | Do not rename files/dirs whose names contain the old name |

After renaming, run `bun install` so the lockfile picks up the new `package.json` name.

| Command | Description |
|---------|-------------|
| `bun run start:dev` | Start with hot reload |
| `bun run start:prod` | Run compiled API |
| `bun run start:worker` | Run email worker (watch via nest) |
| `bun run start:worker:prod` | Run compiled email worker |
| `bun run build` | Compile TypeScript |
| `bun run lint` | ESLint |
| `bun run lint:fix` | ESLint autofix |
| `bun run typecheck` | TypeScript check (no emit) |
| `bun run format:check` | Prettier format verification |
| `bun run test` | All unit tests |
| `bun run auth:generate` | Regenerate Prisma schema from Better Auth config (`src/lib/betterauth/core/auth.cli.ts`) |
| `bun run check:betterauth-versions` | Verifies pinned/compatible `better-auth` + `@better-auth/infra` pairing |
| `bun run test:auth` | Better Auth unit tests |
| `bun run test:dto` | DTO validation/unit tests |
| `bun run test:app` | App layer unit tests |
| `bun run test:redis` | Redis service + connection helpers |
| `bun run test:prisma` | Prisma / database service |
| `bun run test:queue` | BullMQ queue producer + email processor |
| `bun run test:email` | Email send / enqueue |
| `bun run test:health` | Readiness indicators (Redis, queue, database) |
| `bun run test:worker` | Email worker bootstrap and module |
| `bun run test:config` | Env validation, mail transport, app config |
| `bun run test:filters` | Response envelope + exception filter |
| `bun run test:gravatar` | Gravatar URL helpers |
| `bun run test:platform` | Platform branding context |
| `bun run test:lib` | All lib layer unit tests |
| `bun run test:middleware` | All middleware layer unit tests |
| `bun run test:cov` | Unit tests with coverage gates |
| `bun run test:e2e` | End-to-end tests |
| `bun run test:e2e:auth` | Better Auth integration e2e suite (requires `DATABASE_URL`) |
| `bun run test:e2e:auth:if-configured` | Runs auth e2e only when `DATABASE_URL` is set |
| `bun run prisma:generate` | Regenerate Prisma Client |
| `bun run prisma:migrate:dev` | Apply migrations in development |
| `bun run prisma:migrate:deploy` | Apply migrations in production |
| `bun run prisma:seed` | Seed backoffice superadmin from env |
| `bun run seed:superadmin` | Generate superadmin creds, update `.env`, and seed |
| `bun run rename:project` | Globally rename the project/brand name (`--from` / `--to`) |
| `bun run check` | Full CI pipeline locally |
| `bun run audit:security` | Vulnerability scan of dependencies (`bun audit`) |

## API response format

All endpoints return the `handleResponse` envelope:

```json
{
  "statusCode": 200,
  "statusType": "OK",
  "message": "OK",
  "data": {}
}
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Root message |
| `GET` | `/health` | Liveness probe |
| `GET` | `/health/ready` | Readiness probe (Redis + queue + database) |
| `GET` | `/v1/docs` | Swagger UI (when docs enabled) |
| `GET` | `/v1/api-reference` | Scalar API reference (when docs enabled) |

## Project structure

```
penielvault/
├── .github/workflows/ci.yml   # Staged CI DAG: quality gates -> tests -> security rescan
├── .env.sample                # Environment variable template (copy to .env)
├── prisma.config.ts           # Prisma CLI config (schema path, DATABASE_URL)
├── prisma/
│   ├── schema.prisma          # Prisma schema (models go here)
│   ├── seed.ts                # Backoffice superadmin seed
│   └── migrations/            # Versioned SQL migrations
├── scripts/
│   ├── seed-superadmin.mjs    # Writes BACKOFFICE_ADMIN_* to .env and runs seed
│   └── rename-project.mjs     # Globally rename package/brand name (`rename:project`)
├── generated/prisma/          # Generated Prisma Client (gitignored; postinstall)
├── nest-cli.json              # NestJS compiler config (assets, source root)
├── package.json               # Scripts, dependencies, Jest config
├── src/
│   ├── main.ts                # HTTP API entry point
│   ├── app/                   # Application layer (HTTP routes, app wiring)
│   │   ├── app.module.ts      # Root module: config, throttling, health, queue, lib
│   │   ├── app.controller.ts  # Routes: /, /health, /health/ready
│   │   ├── app.service.ts     # Liveness + readiness logic
│   │   └── index.ts           # Barrel export for src/app
│   ├── lib/                   # Shared domain services (import via src/lib only)
│   │   ├── lib.module.ts      # Aggregates email, redis, prisma, gravatar modules
│   │   ├── index.ts           # Root barrel (subfolders have no index.ts)
│   │   ├── email/
│   │   │   ├── sendMail.module.ts
│   │   │   ├── sendMail.service.ts   # Sync send + enqueue async jobs
│   │   │   └── templates/            # Handlebars email templates (*.hbs)
│   │   ├── redis/
│   │   │   ├── redis.module.ts
│   │   │   └── redis.service.ts      # Cache, locks, ping (when REDIS_URL set)
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts     # PostgreSQL via Prisma (when DATABASE_URL set)
│   │   ├── betterauth/               # Better Auth config, hooks, and docs catalog
│   │   │   ├── core/                 # Auth instance, env, email, Nest module, CLI
│   │   │   │   ├── auth-options.ts   # Plugin wiring (harmony, OTP, 2FA, org, admin)
│   │   │   │   ├── auth-env.ts
│   │   │   │   ├── auth-email.ts
│   │   │   │   ├── auth.cli.ts
│   │   │   │   ├── existing-user-signup.ts
│   │   │   │   ├── betterauth.module.ts
│   │   │   │   ├── auth-logger.ts
│   │   │   │   └── redis-secondary-storage.ts
│   │   │   ├── hooks/                # Pre-request validation and signup helpers
│   │   │   │   ├── auth-before-hook.ts
│   │   │   │   ├── sign-up-validation.ts
│   │   │   │   ├── request-url-guard.ts
│   │   │   │   └── auth-gravatar.ts
│   │   │   ├── response/             # Auth response envelope helpers
│   │   │   │   ├── response-envelope.ts
│   │   │   │   ├── response-messages.ts
│   │   │   │   └── redirect-paths.ts
│   │   │   ├── paths/                # Public route constants and path normalizer
│   │   │   │   ├── auth-paths.ts
│   │   │   │   └── normalize-auth-path.ts
│   │   │   ├── catalog/              # Swagger/Scalar auth route catalog
│   │   │   │   ├── auth-api-catalog.ts
│   │   │   │   └── auth-api-catalog-samples.ts
│   │   │   ├── startup/              # Boot-time schema and dash checks
│   │   │   │   ├── auth-schema-startup-checks.ts
│   │   │   │   └── dash-startup-checks.ts
│   │   │   └── testing/              # Test-only buildTestAuth helper
│   │   │       └── auth-test.ts
│   │   └── gravatar/
│   │       ├── gravatar.module.ts
│   │       └── gravatar.service.ts   # Avatar URL helpers
│   └── middleware/            # Cross-cutting infra (import via src/middleware)
│       ├── index.ts           # Public barrel for middleware exports
│       ├── config/
│       │   ├── env.validation.ts     # Validated EnvConfig + validateEnv()
│       │   ├── configure-app.ts      # Helmet, CORS, validation pipe, versioning
│       │   ├── mail-transport.factory.ts  # Nodemailer transport by EMAIL_PROVIDER
│       │   └── setup-api-docs.ts     # Swagger + Scalar (dev / opt-in prod)
│       ├── common/
│       │   ├── platform-context.ts   # Email template branding from env
│       │   ├── redis-connection.ts   # REDIS_URL parsing for ioredis / BullMQ
│       │   └── wrap-redis-error.ts   # Consistent Redis error messages
│       ├── filters/
│       │   ├── responseHandler.filter.ts  # handleResponse success envelope
│       │   └── global-exception.filter.ts # Normalized error responses
│       ├── types/
│       │   ├── email.types.ts        # SendEmailJobPayload, WelcomeEmailContext
│       │   └── gravatar.types.ts
│       ├── health/
│       │   ├── health.module.ts      # Terminus module wiring
│       │   ├── redis.health.ts       # Readiness: Redis ping
│       │   ├── queue.health.ts       # Readiness: queue configured
│       │   └── prisma.health.ts      # Readiness: database ping
│       ├── queue/
│       │   ├── queue.module.ts       # QueueService only (API enqueues)
│       │   ├── queue.service.ts      # BullMQ producer
│       │   ├── email-job.validation.ts # Email job payload validation rules
│       │   ├── email-worker.module.ts # EmailProcessor (worker consumes)
│       │   ├── email.processor.ts    # BullMQ job handler for email.send
│       │   └── queue.constants.ts
│       └── worker/
│           ├── worker.ts             # Worker process entry (no HTTP)
│           ├── worker.module.ts      # Nest module for worker process
│           └── bootstrap-worker.ts   # createApplicationContext + startup log
└── test/
    ├── setup-env.ts           # Jest env defaults (clears REDIS_URL/DATABASE_URL for isolation)
    ├── mocks/                 # Jest module mocks (e.g. Prisma client ESM shim)
    ├── fixtures/              # Shared edge-case data for unit specs
    ├── app/                   # App layer unit tests
    ├── lib/                   # Lib layer unit tests
    │   └── betterauth/        # Mirrors src/lib/betterauth/ (auth-options, email-harmony, existing-user-signup, normalize-auth-path, …)
    ├── middleware/            # Middleware unit tests (mirrors src/middleware/)
    └── e2e/                   # HTTP integration tests (supertest)
        └── auth/              # Auth e2e helpers + route coverage specs
```

### Folder guide

| Path | Purpose |
|------|---------|
| **`src/app/`** | HTTP application shell — controllers, services, and `AppModule` that wires everything together. Keep route handlers thin; business logic belongs in `lib/` or future feature modules. |
| **`src/lib/`** | Reusable services used by the API and worker (email, Redis, Prisma, Better Auth, gravatar). Export only through `src/lib/index.ts`. Subfolders are implementation details. |
| **`src/lib/betterauth/`** | Better Auth integration split by concern: `core/` (config + Nest wiring), `hooks/` (signup guards), `response/` (API envelope), `paths/` (route constants), `catalog/` (docs), `startup/` (schema checks), `testing/` (e2e helpers). Import through `src/lib/index.ts` barrels where exported. |
| **`src/middleware/`** | Infrastructure that is not domain logic: env validation, security bootstrap, response envelopes, queues, health checks, and the email worker. Shared across API and worker processes. |
| **`src/middleware/config/`** | Boot-time configuration — env schema, CORS/Helmet setup, mail transport factory, optional API docs. |
| **`src/middleware/common/`** | Small shared helpers (platform branding context, Redis URL parsing, error wrapping). |
| **`src/middleware/filters/`** | Global `handleResponse` envelope and exception normalization. |
| **`src/middleware/types/`** | TypeScript types shared between lib, queue, and tests. |
| **`src/middleware/health/`** | Terminus indicators used by `GET /health/ready`. |
| **`src/middleware/queue/`** | BullMQ producer (`QueueModule` / API) and consumer (`EmailWorkerModule` / worker). |
| **`src/middleware/worker/`** | Everything for the standalone email worker process — entry file, module, and bootstrap. |
| **`src/main.ts`** | Starts the HTTP API (`nest start` / `node dist/src/main`). |
| **`test/fixtures/`** | Centralized test data; import as `test/fixtures` from specs. |
| **`test/e2e/`** | Full HTTP tests against `AppModule` with real middleware stack. |

Imports use absolute barrel paths: `src/app`, `src/lib` (root only), and `src/middleware`. Never use relative `../../middleware/...` paths in app, lib, or test code. Lib subfolders have no `index.ts`.

## Security features

- Helmet with CSP
- Strict env validation for CORS/proxy/SMTP
- Env-driven CORS allowlist (production excludes localhost/dev defaults)
- Configurable proxy trust (`TRUST_PROXY`, default `false`)
- Better Auth trusted-origin allowlist enforcement for `callbackURL` and `redirectTo`
- Better Auth email normalization and disposable-domain blocking via `better-auth-harmony` (`normalizedEmail` unique column)
- Better Auth duplicate sign-up handling: enumeration-safe success response + OTP resend for unverified users
- Better Auth plugin hardening: explicit 2FA issuer/lockout, org invitation/member limits, hashed magic-link tokens
- Better Auth secure defaults: password length policy, reset token TTL, session revocation on password reset
- Better Auth rate limiting (`BETTER_AUTH_RATE_LIMIT_WINDOW`, `BETTER_AUTH_RATE_LIMIT_MAX`)
- Better Auth dash fail-fast startup checks for schema/query compatibility (`BETTER_AUTH_DASH_STARTUP_CHECKS`)
- Better Auth dash compatibility defaults (`experimental.joins=true` hardcoded for Prisma performance)
- Optional Cloudflare Turnstile captcha on selected auth POSTs (`CAPTCHA_ENABLED`, `TURNSTILE_SECRET_KEY`)
- Global rate limiting (env-driven; default 30 req/min per IP)
- Request body size limit (10kb)
- Global validation pipe with whitelist
- Global exception filter (no stack traces in production)
- SMTP TLS hardening (`requireTLS`, TLS >=1.2, unsafe file/url source access disabled)
- BullMQ job payload validation, dedupe, retry, and retention limits
- API docs disabled in production by default
- Ngrok/proxy mismatch warnings for `BETTER_AUTH_URL`, `PRODUCTION_URL`, `PLATFORM_URL`, and `TRUST_PROXY`

## CI

GitHub Actions runs on push/PR to `main`, `master`, `dev`, and `auth` with a staged DAG:

```mermaid
flowchart TD
  A0["Stage 0: changes"]
  A1["Stage 1: static-checks"]
  A2["Stage 1: dependency-audit (conditional)"]
  B["Stage 2: quality-gate"]
  C1["Stage 3: test-unit-core"]
  C2["Stage 3: test-unit-services"]
  C3["Stage 3: test-unit-auth-dto"]
  C4["Stage 3: test-e2e"]
  C5["Stage 3: test-e2e-auth"]
  C6["Stage 3: test-cov (main/master push only)"]
  D["CI Success"]

  A0 --> A2
  A1 --> B
  A2 --> B
  A0 --> C1
  A0 --> C2
  A0 --> C3
  A0 --> C4
  A0 --> C5
  B --> C1
  B --> C2
  B --> C3
  B --> C4
  B --> C5
  B --> C6
  C1 --> D
  C2 --> D
  C3 --> D
  C4 --> D
  C5 --> D
  C6 --> D
```

Behavior:

1. `static-checks` always runs and executes format, lint, typecheck, build + artifact assertions, and Better Auth version guard in one job (single install/setup).
2. `changes` computes path-based booleans used to decide which Stage 3 test jobs run on PRs and non-trunk pushes.
3. On pushes to `main`/`master`, the full suite runs unconditionally: all unit shards, general e2e, auth e2e, and `test-cov`.
4. On PRs/non-trunk pushes, only relevant tests run by directory mapping; jobs not selected are skipped.
5. `dependency-audit` always runs on `main`/`master` pushes and otherwise runs only when dependency/setup files change.
6. `CI Success` is the single aggregate check; skipped jobs are acceptable, but any `failure`/`cancelled` dependency fails the check.

### Disable CI (repository variable)

Local `.env` does **not** control GitHub Actions. The workflow reads `vars.CI_ENABLED` (a repository **variable**), not a secret and not `process.env` from `.env`.

#### Setup (exact clicks)

1. Open the repo on GitHub → **Settings**
2. **Secrets and variables** → **Actions**
3. Open the **Variables** tab (not **Secrets**)
4. **New repository variable**
5. Fill the fields separately:

| Field | Value |
|-------|-------|
| **Name** | `CI_ENABLED` |
| **Value** | `false` |

6. Save

Do **not** create an Actions **secret**. Secrets use `secrets.*` and are hidden; this kill switch must be a **variable** (`vars.CI_ENABLED`).

Do **not** put `CI_ENABLED = false` in the Value box. Name is `CI_ENABLED`, Value is only `false`.

#### Controls

| Action | How |
|--------|-----|
| Disable push/PR CI | Variable `CI_ENABLED` = `false` (steps above) |
| Re-enable CI | Delete `CI_ENABLED`, or set Value to anything other than `false` (e.g. `true`) |
| Run once while disabled | Actions → **CI** → **Run workflow** (`workflow_dispatch` always runs) |

#### Behavior when disabled

- Push and pull-request jobs are skipped (no install/test burn).
- The aggregate **CI Success** job still finishes green, so required status checks are not blocked.
- Manual **Run workflow** ignores the kill switch and runs the full staged DAG.

Defined in [`.github/workflows/ci.yml`](.github/workflows/ci.yml). Also noted in [`.env.sample`](.env.sample) so developers do not look for a local env flag.

Run the same pipeline locally:

```bash
bun run check
```

Auth integration e2e can be run locally with:

```bash
bun run test:e2e:auth
```

Security hardening notes, control matrix, and residual risk register are documented in [`docs/security-hardening.md`](docs/security-hardening.md).

## License

UNLICENSED — private project.
