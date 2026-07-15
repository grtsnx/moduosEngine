import { execSync } from 'node:child_process';

import { resolveE2eDatabaseUrl } from './auth/e2e-database-guard';

process.env.DATABASE_URL = resolveE2eDatabaseUrl();
process.env.E2E_AUTH_INTEGRATION = 'true';
process.env.NODE_ENV = 'test';
process.env.EMAIL_PROVIDER = 'test';
process.env.PLATFORM_SUPPORT = 'noreply@test.local';
process.env.PLATFORM_NAME = 'penielvault-test';
process.env.COLOR_CODE = '#635BFF';
process.env.BETTER_AUTH_SECRET = 'test-secret-minimum-32-characters-long';
process.env.BETTER_AUTH_URL = 'http://localhost:3000';
process.env.PRODUCTION_URL = process.env.BETTER_AUTH_URL;
process.env.DEVELOPMENT_URL = process.env.BETTER_AUTH_URL;
process.env.PLATFORM_URL = process.env.BETTER_AUTH_URL;
process.env.CORS_ORIGINS = 'https://app.example.com';
process.env.BETTER_AUTH_RATE_LIMIT_WINDOW = '60';
process.env.BETTER_AUTH_RATE_LIMIT_MAX = '5000';
process.env.BETTER_AUTH_RATE_LIMIT_ENABLED = 'false';
process.env.BETTER_AUTH_REQUIRE_EMAIL_VERIFICATION = 'false';
process.env.BETTER_AUTH_DASH_STARTUP_CHECKS = 'false';
process.env.BETTER_AUTH_TEST_UTILS = 'true';
process.env.REDIS_URL = '';
delete process.env.BETTER_AUTH_API_KEY;
delete process.env.BETTER_AUTH_API_URL;

execSync('bun run prisma:migrate:deploy', {
  stdio: 'inherit',
  env: process.env,
});
