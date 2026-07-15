#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SUPPORTED_PAIRS = new Map([
  ['1.6.23', new Set(['0.3.4'])],
]);

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function readInstalledVersion(packageName) {
  const packageJsonPath = join(
    process.cwd(),
    'node_modules',
    ...packageName.split('/'),
    'package.json',
  );
  const pkg = readJson(packageJsonPath);
  return String(pkg.version || '').trim();
}

function hasLooseRange(value) {
  return /[~^]/.test(value);
}

const rootPackage = readJson(join(process.cwd(), 'package.json'));
const deps = rootPackage.dependencies ?? {};
const coreSpec = String(deps['better-auth'] ?? '');
const infraSpec = String(deps['@better-auth/infra'] ?? '');

if (!coreSpec || !infraSpec) {
  console.error('[better-auth-version-guard] Missing better-auth or @better-auth/infra dependency.');
  process.exit(1);
}

if (hasLooseRange(coreSpec) || hasLooseRange(infraSpec)) {
  console.error(
    `[better-auth-version-guard] Use pinned versions only. Found better-auth=${coreSpec}, @better-auth/infra=${infraSpec}`,
  );
  process.exit(1);
}

const coreVersion = readInstalledVersion('better-auth');
const infraVersion = readInstalledVersion('@better-auth/infra');

console.log(`[better-auth-version-guard] Resolved better-auth=${coreVersion}`);
console.log(`[better-auth-version-guard] Resolved @better-auth/infra=${infraVersion}`);

const allowedInfra = SUPPORTED_PAIRS.get(coreVersion);
if (!allowedInfra || !allowedInfra.has(infraVersion)) {
  const allowedPairs = Array.from(SUPPORTED_PAIRS.entries())
    .flatMap(([core, infraVersions]) =>
      Array.from(infraVersions).map((infra) => `${core} + ${infra}`),
    )
    .join(', ');

  console.error(
    `[better-auth-version-guard] Unsupported pairing: better-auth=${coreVersion}, @better-auth/infra=${infraVersion}. Supported: ${allowedPairs}`,
  );
  process.exit(1);
}

console.log('[better-auth-version-guard] Supported Better Auth pairing confirmed.');
