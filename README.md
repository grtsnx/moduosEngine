<div align="center">

# NestJS API scaffold

**Production-minded NestJS backend** — Better Auth, Prisma, Redis/BullMQ email worker, helmeted middleware, and a staged CI DAG.

[![Bun](https://img.shields.io/badge/runtime-Bun-f9f1e1?style=for-the-badge&logo=bun&logoColor=000)](https://bun.sh)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io)
[![Better Auth](https://img.shields.io/badge/Better%20Auth-000000?style=for-the-badge)](https://www.better-auth.com)
[![License](https://img.shields.io/badge/license-UNLICENSED-6b7280?style=for-the-badge)](#license)

</div>

> [!TIP]
> **New here?** Clone → `bun install` → copy `.env.sample` → `bun run start:dev` → hit `http://localhost:3000/health`. Postgres/Redis are optional in local/dev.

---

## Table of contents

| | |
|---|---|
| **Start** | [Architecture](#architecture) · [Quick start](#quick-start) · [Day-one cheat sheet](#day-one-cheat-sheet) |
| **Config** | [Environment variables](#environment-variables) · [Turnstile captcha](#cloudflare-turnstile-captcha) |
| **Auth** | [OAuth & callbacks](#social-oauth-and-callback-urls) · [CORS / trusted origins](#cors-policy) |
| **Platform** | [Email](#email) · [Database](#database-prisma) · [Worker](#worker-process) · [Health](#health-checks) |
| **Ship** | [Scripts](#scripts) · [Testing](#testing) · [CI](#ci) · [Security](#security-features) |
| **Codebase** | [API shape](#api-response-format) · [Endpoints](#endpoints) · [Project structure](#project-structure) |

---

## Architecture

Two processes. The API stays fast; the worker owns async email.

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {
  'primaryColor': '#e0f2fe',
  'primaryTextColor': '#0f172a',
  'primaryBorderColor': '#0284c7',
  'lineColor': '#64748b',
  'secondaryColor': '#dcfce7',
  'tertiaryColor': '#fef3c7',
  'fontFamily': 'ui-sans-serif, system-ui'
}}}%%
flowchart LR
  Client["Browser / mobile"]
  API["API process<br/><code>bun run start:dev</code>"]
  Redis[("Redis")]
  PG[("PostgreSQL")]
  Worker["Email worker<br/><code>bun run start:worker</code>"]
  SMTP["SMTP / Gmail"]

  Client -->|"HTTPS · /v1/api/*"| API
  API -->|"Prisma"| PG
  API -->|"enqueue email jobs"| Redis
  Worker -->|"BullMQ consume"| Redis
  Worker -->|"send mail"| SMTP
  API -.->|"sync send when needed"| SMTP

  classDef api fill:#e0f2fe,stroke:#0284c7,color:#0f172a
  classDef data fill:#fef3c7,stroke:#d97706,color:#0f172a
  classDef worker fill:#dcfce7,stroke:#16a34a,color:#0f172a
  classDef client fill:#f1f5f9,stroke:#475569,color:#0f172a

  class Client client
  class API api
  class Worker worker
  class Redis,PG,SMTP data
```

| Piece | Role | When you need it |
|-------|------|------------------|
| **API** | HTTP, Better Auth, enqueue-only for async mail | Always |
| **Postgres** | Prisma + Better Auth tables | Auth / DB features (`DATABASE_URL`) |
| **Redis** | Cache, secondary auth storage, BullMQ | Async email / production (`REDIS_URL`) |
| **Worker** | Consumes `email` queue | Async email only |

---

## Quick start

```bash
bun install                          # also runs prisma generate
cp .env.sample .env                  # edit PLATFORM_* and secrets as needed

# Optional — only if you set DATABASE_URL / REDIS_URL
bun run prisma:migrate:dev
bun run seed:superadmin              # creates BACKOFFICE_ADMIN_* + DB admin user

bun run start:dev                    # API → http://localhost:3000
# second terminal, if async email:
bun run start:worker
```

Healthy boot looks like:

```text
✓ Redis connected
✓ Database connected
✓ Queue connected
```

> [!NOTE]
> Missing `REDIS_URL` / `DATABASE_URL` in development → that service warns and **disables**. Production requires them (see env validation).

---

## Day-one cheat sheet

| I want to… | Do this |
|------------|---------|
| Hit a live probe | `GET /health` (liveness) · `GET /health/ready` (deps) |
| Browse OpenAPI | `GET /v1/docs` or `/v1/api-reference` (dev default on) |
| Sign in as admin | Seed with `bun run seed:superadmin` → `POST /v1/api/auth/sign/in/email` |
| Run the same checks as CI | `bun run check` |
| Rename the brand (`penielvault` → `moduos`) | `bun run rename:project -- --from=… --to=… --dry-run` |
| Pause GitHub CI burn | Repo **Variable** `CI_ENABLED=false` — [exact steps](#disable-ci-repository-variable) |

---

## Environment variables

Copy [`.env.sample`](.env.sample) → `.env`. Grouped for scanning; full production example further down.

### Core runtime

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No (`3000`) | HTTP port |
| `NODE_ENV` | No (`development`) | `development` · `production` · `test` |
| `TRUST_PROXY` | No (`false`) | `false` / `true` / hop count (e.g. `1`) behind a reverse proxy |
| `PRODUCTION_URL` | Prod | Public production API origin |
| `DEVELOPMENT_URL` | Prod | Staging / dev API origin |
| `PLATFORM_URL` | Prod | Frontend origin (CORS / CSP / email links) |
| `PLATFORM_NAME` | Prod | Brand name in docs, logs, emails |
| `ENABLE_API_DOCS` | No | Defaults **on** in dev, **off** in prod |
| `LOG_LEVEL` | No (`info`) | `fatal` … `trace` |
| `CORS_ORIGINS` | No | Extra browser origins (comma-separated; no `*`) |
| `RATE_LIMIT_TTL` / `RATE_LIMIT_MAX` | No (`60000` / `30`) | Global throttle window |

### Data & jobs

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Prod (+ auth) | Postgres for Prisma / Better Auth |
| `REDIS_URL` | Prod | Redis for BullMQ + optional auth secondary storage |

### Email

| Variable | Required | Description |
|----------|----------|-------------|
| `PLATFORM_SUPPORT` | Yes | From-address for transactional mail |
| `EMAIL_PROVIDER` | Cond. | `test` · `google` · `smtp` — not `test` when DB is set / in prod |
| `EMAIL_ADDRESS` / `EMAIL_PASSWORD` | Google | Gmail app password flow |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | SMTP | Custom SMTP (`SMTP_PORT` default `587`) |
| `PLATFORM_LOGO_URL` / `COLOR_CODE` | No | Email branding (`COLOR_CODE` default `#635BFF`) |

### Better Auth

| Variable | Required | Description |
|----------|----------|-------------|
| `BETTER_AUTH_SECRET` | When DB set / prod | ≥ 32 characters |
| `BETTER_AUTH_URL` | No | Auth base URL (HTTPS in prod); often equals API public origin |
| `BETTER_AUTH_API_KEY` | Dash/Sentinel | Better Auth Infrastructure key |
| `BETTER_AUTH_API_URL` / `BETTER_AUTH_IDENTIFY_URL` | No | Infra overrides (ngrok / local dash) |
| `BETTER_AUTH_RATE_LIMIT_WINDOW` / `_MAX` | No (`60` / `100`) | Auth-layer rate limits |
| `BETTER_AUTH_DASH_STARTUP_CHECKS` | No | Fail-fast schema checks when API key set |

### Captcha · OAuth · backoffice

| Variable | Required | Description |
|----------|----------|-------------|
| `CAPTCHA_ENABLED` | No (`false`) | Turnstile on selected auth POSTs |
| `TURNSTILE_SECRET_KEY` | If captcha on | **Server secret only** — site key stays on the frontend |
| `GOOGLE_*` / `GITHUB_*` / `APPLE_*` / `MICROSOFT_*` / `DISCORD_*` / `TWITTER_*` | Optional | Both ID + secret required to enable a provider |
| `BACKOFFICE_ADMIN_EMAIL` / `_PASSWORD` / `_NAME` | Seed | Used by `seed:superadmin` / `prisma:seed` |

<details>
<summary><strong>Production <code>.env</code> example</strong></summary>

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

</details>

> [!WARNING]
> **Ngrok / tunnels:** keep `BETTER_AUTH_URL`, `PRODUCTION_URL`, and `PLATFORM_URL` on the **same** active tunnel origin, and set `TRUST_PROXY=true` (or a hop count) when traffic is proxied.

### Cloudflare Turnstile captcha

Optional and **endpoint-scoped** (not global):

```env
CAPTCHA_ENABLED=true
TURNSTILE_SECRET_KEY=your-turnstile-secret
```

Site key = frontend only. Backend never needs it.

| Internal path | Public alias |
|---------------|--------------|
| `/sign-up/email` | `/v1/api/auth/sign/up/email` |
| `/sign-in/email` | `/v1/api/auth/sign/in/email` |
| `/request-password-reset` | `/v1/api/auth/request/password/reset` |
| `/email-otp/send-verification-otp` | `/v1/api/auth/email/otp/send` |
| `/sign-in/email-otp` | `/v1/api/auth/sign/in/email/otp` |
| `/email-otp/request-password-reset` | `/v1/api/auth/email/otp/request/password/reset` |
| `/forget-password/email-otp` | `/v1/api/auth/forget/password/email/otp` |

Send header `x-captcha-response` with a valid Turnstile token on those POSTs only.

```ts
await authClient.signIn.email({
  email: 'user@example.com',
  password: 'secure-password',
  fetchOptions: {
    headers: { 'x-captcha-response': turnstileToken },
  },
});
```

---

## Social OAuth and callback URLs

A provider enables only when **both** client ID and secret are set. Supported: `google`, `github`, `apple`, `microsoft`, `discord`, `twitter`.

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'fontFamily': 'ui-sans-serif, system-ui' }}}%%
sequenceDiagram
  participant App as Frontend
  participant API as This API
  participant IdP as Google / GitHub / …

  App->>API: POST /v1/api/auth/sign/in/social<br/>callbackURL = https://app…/dashboard
  API->>IdP: Redirect to provider
  IdP->>API: GET /v1/api/auth/callback/{provider}
  API->>App: Redirect to callbackURL (trusted origin)
```

### Two URLs (don't mix them up)

| Kind | Where you set it | Example |
|------|------------------|---------|
| **Provider redirect URI** | Google/GitHub console | `https://api.example.com/v1/api/auth/callback/google` |
| **App `callbackURL`** | Request body from frontend | `https://app.example.com/dashboard` |

Provider redirect pattern:

```text
{BETTER_AUTH_URL}/v1/api/auth/callback/{provider}
```

| Provider | Redirect URI (when `BETTER_AUTH_URL=https://api.example.com`) |
|----------|---------------------------------------------------------------|
| Google | `…/callback/google` |
| GitHub | `…/callback/github` |
| Apple | `…/callback/apple` |
| Microsoft | `…/callback/microsoft` |
| Discord | `…/callback/discord` |
| Twitter | `…/callback/twitter` |

`callbackURL` must be an absolute `http(s)` URL whose **origin** is trusted (see below). Bad → `400`; untrusted origin → `403`.

```bash
curl -X POST https://api.example.com/v1/api/auth/sign/in/social \
  -H 'Content-Type: application/json' \
  -d '{ "provider": "google", "callbackURL": "https://app.example.com/dashboard" }'
```

| Action | Route | Body sketch |
|--------|-------|-------------|
| Social sign-in | `POST /v1/api/auth/sign/in/social` | `{ "provider", "callbackURL" }` |
| Link account (session) | `POST /v1/api/user/link/social` | `{ "provider", "callbackURL" }` |

### CORS policy

Nest CORS in `configure-app.ts` uses `credentials: true`.

| Environment | Default origins | Plus |
|-------------|-----------------|------|
| Development | `PRODUCTION_URL`, `DEVELOPMENT_URL`, `PLATFORM_URL`, `http://localhost:{PORT}` | `CORS_ORIGINS` |
| Production | `PRODUCTION_URL`, `PLATFORM_URL` | `CORS_ORIGINS` (HTTPS only) |

Methods: `GET` `PATCH` `POST` `PUT` `DELETE` `OPTIONS`  
Headers: `Content-Type`, `Authorization`, `X-Visitor-Id`, `X-Request-Id`, `X-Device-Id`, `X-Device-Name`

```env
PLATFORM_URL=https://app.example.com
PRODUCTION_URL=https://api.example.com
CORS_ORIGINS=https://admin.example.com,https://staging.example.com
```

### Better Auth trusted origins

Allowlist (separate from Nest CORS) built from `PRODUCTION_URL`, `DEVELOPMENT_URL`, `PLATFORM_URL`, `BETTER_AUTH_URL`, `CORS_ORIGINS`, plus localhost in development. Prod keeps HTTPS only.

Validates `callbackURL` on social sign-in, link-social, and org invitation URL flows. Missing frontend origin → add it to `CORS_ORIGINS`.

### CSP `connect-src`

Helmet allows `'self'` plus the same public URL origins (and localhost when set). Keep env URLs aligned with what browsers actually call.

---

## Email

`@nestjs-modules/mailer` + Handlebars; optional BullMQ async delivery.

| Provider | When | Vars |
|----------|------|------|
| `test` | Local / CI (no network) | `PLATFORM_SUPPORT` |
| `google` | Gmail | `EMAIL_ADDRESS`, `EMAIL_PASSWORD` |
| `smtp` | Custom SMTP | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` |

**Sync**

```typescript
import { SendMailsService } from 'src/lib';

await sendMailsService.sendWelcomeEmail('user@example.com', {
  firstName: 'Alex',
  ctaUrl: 'https://app.example.com/dashboard',
});
```

**Async** (needs `REDIS_URL` + [worker](#worker-process))

```typescript
await sendMailsService.sendEmailAsync(
  'user@example.com',
  'Welcome to your-platform',
  'welcome',
  { firstName: 'Alex' },
);
```

Templates: `src/lib/email/templates/` (copied to `dist` on build). Branding auto-merges from env; `welcome.hbs` needs `firstName` (+ optional `ctaUrl`).

Queue defaults: payload validation, deduped `jobId`, 3 attempts with backoff, Redis cleanup on complete/fail.

---

## Database (Prisma)

Prisma ORM v7 + `@prisma/adapter-pg`. Client lands in `generated/prisma/` (gitignored; `postinstall` generates it).

```bash
# Set DATABASE_URL, then:
bun run prisma:migrate:dev
bun run start:dev
```

### Better Auth schema generation

After adding/removing auth plugins:

```bash
bun run auth:generate          # needs DATABASE_URL
bun run prisma:migrate:dev
bun run prisma:generate
```

| Item | Notes |
|------|-------|
| Entrypoint | `src/lib/betterauth/core/auth.cli.ts` → `buildAuth()` |
| `DATABASE_URL` | Required for generate |
| “Already up to date” | Schema matches current plugin set |

Includes `User.normalizedEmail` (`@unique`) via `better-auth-harmony`.

### Superadmin seed

```bash
bun run seed:superadmin
# or preview:
bun scripts/seed-superadmin.mjs --dry-run
# custom:
bun run seed:superadmin -- --email=admin@example.com --password='YourSecurePass123' --name='Admin User'
```

Writes `BACKOFFICE_ADMIN_*` to `.env`, seeds Better Auth `role: admin` for `/v1/api/admin/*`. Sign in via `POST /v1/api/auth/sign/in/email`.

```typescript
import { PrismaService } from 'src/lib';
const db = this.prisma.client();
await db.$queryRaw`SELECT 1`;
```

| Command | Description |
|---------|-------------|
| `bun run prisma:generate` | Regenerate client |
| `bun run prisma:migrate:dev` | Dev migrations |
| `bun run prisma:migrate:deploy` | Prod migrations |
| `bun run prisma:seed` | Seed from `BACKOFFICE_ADMIN_*` |
| `bun run seed:superadmin` | Write env + seed |

---

## Worker process

API **enqueues**; worker **sends**. Scale and deploy them separately.

| File | Role |
|------|------|
| `middleware/worker/worker.ts` | Process entry (like `main.ts`) |
| `middleware/worker/worker.module.ts` | Nest module for worker |
| `middleware/worker/bootstrap-worker.ts` | App context, no HTTP |
| `middleware/queue/email-worker.module.ts` | `EmailProcessor` consumer |

```bash
# prod
bun run start:prod
bun run start:worker:prod

# dev (two terminals)
bun run start:dev
bun run start:worker
```

---

## Health checks

| Endpoint | Type | Behavior |
|----------|------|----------|
| `GET /health` | Liveness | Process up — no dep checks |
| `GET /health/ready` | Readiness | Redis + queue + DB; **503** if unhealthy |

Both excluded from rate limiting (LB-friendly).

---

## Testing

Fixtures live in [`test/fixtures/`](test/fixtures/README.md) — import as `test/fixtures`.

| Area | Specs cover |
|------|-------------|
| Email / Redis / Prisma / Gravatar | Disabled deps, timeouts, lifecycle, URL edge cases |
| Better Auth | Trusted origins, harmony/OTP/2FA, disposable domains, callback allowlist |
| Middleware | Env validation, queue, health indicators, worker bootstrap |
| Auth e2e | Untrusted redirects, disposable signup, rate-limit abuse, route coverage |

```bash
bun run test              # unit
bun run test:e2e          # HTTP e2e
bun run test:e2e:auth     # needs E2E_DATABASE_URL / dedicated *test* DB
bun run check             # full local CI mirror
```

---

## Scripts

### Rename project

Globally replace the package/brand name (case-insensitive + kebab/snake). Skips `node_modules`, `dist`, `.git`, lockfiles by default.

```bash
bun run rename:project -- --from=penielvault --to=moduos --dry-run
bun run rename:project -- --from=penielvault --to=moduos
bun install   # refresh lockfile name after apply
```

| Flag | Meaning |
|------|---------|
| `--dry-run` | Preview only |
| `--include-lockfiles` | Also rewrite lockfiles |
| `--no-rename-paths` | Don't rename matching filenames |

### Command reference

<details>
<summary><strong>Day-to-day</strong></summary>

| Command | Description |
|---------|-------------|
| `bun run start:dev` | API with hot reload |
| `bun run start:prod` | Compiled API |
| `bun run start:worker` / `:prod` | Email worker |
| `bun run build` | Compile |
| `bun run lint` / `lint:fix` | ESLint |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run format:check` | Prettier check |
| `bun run check` | Full CI pipeline locally |
| `bun run audit:security` | `bun audit` |

</details>

<details>
<summary><strong>Auth · DB · brand</strong></summary>

| Command | Description |
|---------|-------------|
| `bun run auth:generate` | Prisma schema from Better Auth config |
| `bun run check:betterauth-versions` | Pin guard for `better-auth` + infra |
| `bun run prisma:*` / `seed:superadmin` | DB lifecycle |
| `bun run rename:project` | Global brand rename |

</details>

<details>
<summary><strong>Test shards</strong></summary>

| Command | Scope |
|---------|-------|
| `bun run test` / `test:cov` | All unit / coverage gates |
| `bun run test:auth` · `test:dto` · `test:app` · … | Layer shards (see `package.json`) |
| `bun run test:e2e` · `test:e2e:auth` | E2E suites |

</details>

---

## API response format

Every successful/error path goes through the shared envelope:

```json
{
  "statusCode": 200,
  "statusType": "OK",
  "message": "OK",
  "data": {}
}
```

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Root ping |
| `GET` | `/health` | Liveness |
| `GET` | `/health/ready` | Readiness (Redis + queue + DB) |
| `GET` | `/v1/docs` | Swagger UI (when docs on) |
| `GET` | `/v1/api-reference` | Scalar reference (when docs on) |
| | `/v1/api/auth/*` | Better Auth (public aliases + internal paths) |

Auth catalog also surfaces in OpenAPI when docs are enabled.

---

## Project structure

```text
.
├── .github/workflows/ci.yml      # Staged CI DAG + CI_ENABLED kill switch
├── .env.sample
├── prisma/                       # schema · migrations · seed
├── scripts/                      # seed-superadmin · rename-project
├── generated/prisma/             # gitignored client
├── src/
│   ├── main.ts                   # HTTP entry
│   ├── app/                      # Controllers · AppModule (thin)
│   ├── lib/                      # Domain services (email, redis, prisma, betterauth, gravatar)
│   └── middleware/               # Config, filters, queue, health, worker
└── test/                         # unit · fixtures · e2e
```

| Path | Purpose |
|------|---------|
| `src/app/` | HTTP shell — keep handlers thin |
| `src/lib/` | Reusable services; import via `src/lib` barrel only |
| `src/lib/betterauth/` | Auth by concern: `core/` `hooks/` `response/` `paths/` `catalog/` `startup/` `testing/` |
| `src/middleware/` | Cross-cutting: env, security boot, envelopes, queues, health, worker |
| `test/fixtures/` | Shared edge-case data |
| `test/e2e/` | Full HTTP stack tests |

Imports: absolute barrels `src/app`, `src/lib`, `src/middleware` — avoid deep relative `../../` paths.

---

## Security features

- Helmet + CSP; body limit 10kb; whitelist validation pipe
- Strict env validation (CORS/proxy/SMTP); prod CORS excludes localhost defaults
- Better Auth trusted origins, password policy, reset TTL, session revoke on reset
- `better-auth-harmony` normalized email + disposable-domain block
- Enumeration-safe duplicate signup + OTP resend for unverified users
- Optional Turnstile on selected auth POSTs (`TURNSTILE_SECRET_KEY` only)
- Global + auth-layer rate limits; SMTP TLS ≥ 1.2
- BullMQ payload validation / dedupe / retry / retention
- Docs off in production by default

---

## CI

Runs on push/PR to `main`, `master`, `dev`, `auth` (+ manual dispatch).

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {
  'primaryColor': '#ede9fe',
  'primaryTextColor': '#1e1b4b',
  'primaryBorderColor': '#7c3aed',
  'lineColor': '#94a3b8',
  'secondaryColor': '#dbeafe',
  'tertiaryColor': '#dcfce7'
}}}%%
flowchart TD
  A0["Stage 0 · changes"]
  A1["Stage 1 · static-checks"]
  A2["Stage 1 · dependency-audit"]
  B["Stage 2 · quality-gate"]
  C1["Unit · core"]
  C2["Unit · services"]
  C3["Unit · auth/dto"]
  C4["E2E"]
  C5["Auth E2E"]
  C6["Coverage · main/master push"]
  D["CI Success"]

  A0 --> A2
  A1 --> B
  A2 --> B
  A0 --> C1 & C2 & C3 & C4 & C5
  B --> C1 & C2 & C3 & C4 & C5 & C6
  C1 & C2 & C3 & C4 & C5 & C6 --> D

  classDef stage fill:#ede9fe,stroke:#7c3aed,color:#1e1b4b
  classDef tests fill:#dbeafe,stroke:#2563eb,color:#0f172a
  classDef ok fill:#dcfce7,stroke:#16a34a,color:#14532d
  class A0,A1,A2,B stage
  class C1,C2,C3,C4,C5,C6 tests
  class D ok
```

| Behavior | Detail |
|----------|--------|
| Static checks | format · lint · typecheck · build artifacts · Better Auth version guard |
| Selective tests | Path filters on PRs / non-trunk; **full suite** on `main`/`master` push |
| Aggregate | Require **CI Success**; skipped jobs OK; `failure`/`cancelled` fail the check |
| Local mirror | `bun run check` |

### Disable CI (repository variable)

> [!IMPORTANT]
> This is a GitHub **Actions variable**, not a Secret and **not** something in local `.env`. The workflow reads `vars.CI_ENABLED`.

#### Exact clicks

1. Repo → **Settings**
2. **Secrets and variables** → **Actions**
3. **Variables** tab ← not Secrets
4. **New repository variable**
5. Fields:

| Field | Exact value |
|-------|-------------|
| **Name** | `CI_ENABLED` |
| **Value** | `false` |

6. Save

| Do | Don't |
|----|-------|
| Use the **Variables** tab | Create an Actions **secret** |
| Name=`CI_ENABLED`, Value=`false` | Put `CI_ENABLED = false` in the Value box |

| Action | How |
|--------|-----|
| Disable push/PR CI | Variable above |
| Re-enable | Delete variable, or set Value ≠ `false` |
| Run once while disabled | Actions → **CI** → **Run workflow** |

When disabled: push/PR jobs skip, **CI Success** stays green (branch protection friendly), manual dispatch still runs the full DAG.

Defined in [`.github/workflows/ci.yml`](.github/workflows/ci.yml); noted in [`.env.sample`](.env.sample).

---

## License

**UNLICENSED** — private project.
