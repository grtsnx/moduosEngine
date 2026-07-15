## Learned User Preferences

- Use penielvault naming everywhere; replace any leftover bringbills references.
- Prefer explanation-first answers when asked to explain before changing code.
- Unauthenticated requests under Better Auth global protection should fail with an auth error, not succeed with empty or null data.
- After email OTP account verification, users should receive an authenticated session so they can enter the app without a separate sign-in.
- For Cloudflare Turnstile captcha, backend env should only require the secret key (`TURNSTILE_SECRET_KEY`), not the client site key.
- Referral system should track attributions without rewards.
- Prefer Better Auth for organizations and teams; expose teams on dedicated API endpoints (not only nested under organisation).

## Learned Workspace Facts

- This repo is the NestJS backend for the penielvault product (`package.json` name `penielvault`; workspace folder is `modusbackend`).
- Auth is Better Auth (email OTP, twoFactor, organization, admin, bearer, passkey, haveIBeenPwned, lastLoginMethod) mounted under NestJS, with Prisma as the ORM.
- Auth API routes are under `/v1/api/auth`; user profile is at `GET /v1/api/user/profile` and requires an authenticated session for meaningful data.
- Many public user/org routes are catalog path-rewrites into Better Auth (`/v1/api/auth/*`), not Nest controller handlers; Nest `AuthGuard` does not cover those rewritten auth routes.
- Public organisation routes use `/v1/api/organisation` (rewritten to Better Auth `/organization/*`); organisation plugin is enabled, while Better Auth `teams` still needs config/schema when added.
- Backoffice superadmin is seeded with `bun run seed:superadmin` using `BACKOFFICE_ADMIN_*` env vars; the user gets Better Auth `role: admin` for `/v1/api/admin/*`.
- Cloudflare Turnstile captcha is optional via `CAPTCHA_ENABLED=true` and `TURNSTILE_SECRET_KEY`; clients send `x-captcha-response` on protected sign-up/sign-in endpoints.
- HIBP password breach checks run in production by default; override with `BETTER_AUTH_HIBP_ENABLED=true|false` (off in test by default).
- Better Auth `testUtils` must only be loaded via `buildTestAuth()` in tests, never in production auth.
