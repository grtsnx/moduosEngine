#!/usr/bin/env bun

/**
 * Globally rename the project brand / package name across the repo.
 *
 * Usage:
 *   bun scripts/rename-project.mjs --from=penielvault --to=moduos
 *   bun scripts/rename-project.mjs --from=penielvault --to=moduos --dry-run
 *   bun run rename:project -- --from=penielvault --to=moduos
 *
 * Matches the old name case-insensitively and preserves each match's casing
 * style (lower, UPPER, Title, Pascal). Also rewrites kebab/snake variants.
 * Skips node_modules, dist, .git, and this script itself.
 */

import {
  existsSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';

const ROOT = process.cwd();
const SELF_RELATIVE = 'scripts/rename-project.mjs';

const SKIP_DIR_NAMES = new Set([
  '.git',
  '.turbo',
  '.next',
  '.cache',
  'node_modules',
  'dist',
  'coverage',
  'build',
  '.cursor',
  '.claude',
]);

const SKIP_FILE_NAMES = new Set([
  'bun.lock',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
]);

const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.mdc',
  '.yml',
  '.yaml',
  '.toml',
  '.env',
  '.sample',
  '.prisma',
  '.sql',
  '.hbs',
  '.html',
  '.css',
  '.scss',
  '.txt',
  '.svg',
  '.sh',
  '.http',
]);

function parseArgs(argv) {
  const options = {
    from: undefined,
    to: undefined,
    dryRun: false,
    includeLockfiles: false,
    renamePaths: true,
  };

  for (const arg of argv) {
    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    if (arg === '--include-lockfiles') {
      options.includeLockfiles = true;
      continue;
    }
    if (arg === '--no-rename-paths') {
      options.renamePaths = false;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }

    const match = arg.match(/^--(from|to)=(.*)$/);
    if (match) {
      options[match[1]] = match[2];
    }
  }

  return options;
}

function printHelp() {
  console.log(`Rename the project name globally.

Usage:
  bun scripts/rename-project.mjs --from=<old> --to=<new> [--dry-run]

Options:
  --from=NAME            Current project name (e.g. penielvault)
  --to=NAME              New project name (e.g. moduos)
  --dry-run              Show changes without writing
  --include-lockfiles    Also rewrite bun.lock / package-lock.json (off by default)
  --no-rename-paths      Do not rename files/dirs whose names contain the old name
  -h, --help             Show this help
`);
}

function splitNameParts(name) {
  const trimmed = name.trim();
  if (!trimmed) return [];

  if (/[-_\s]/.test(trimmed)) {
    return trimmed.split(/[-_\s]+/).filter(Boolean);
  }

  if (/[a-z][A-Z]/.test(trimmed)) {
    return trimmed.split(/(?=[A-Z])/).filter(Boolean);
  }

  return [trimmed];
}

function toLowerJoined(parts, joiner = '') {
  return parts.map((part) => part.toLowerCase()).join(joiner);
}

function toPascal(parts) {
  return parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
}

function toTitle(parts) {
  return parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Preserve the casing style of `match` when applying `toParts`.
 */
function matchCase(match, toParts) {
  const lower = toLowerJoined(toParts);
  const upper = lower.toUpperCase();

  if (match === match.toLowerCase()) {
    return lower;
  }
  if (match === match.toUpperCase()) {
    return upper;
  }
  if (
    match[0] === match[0].toUpperCase() &&
    match.slice(1) === match.slice(1).toLowerCase()
  ) {
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }
  // PenielVault / BringBills style
  return toPascal(toParts);
}

/** Explicit separator variants that case-insensitive solid matching would miss. */
function buildSeparatorPairs(fromParts, toParts) {
  const pairs = new Map();
  const fromSolid = toLowerJoined(fromParts);
  const add = (source, target) => {
    if (!source || source === target) return;
    // Skip forms already covered by the solid case-insensitive pass.
    if (source.toLowerCase() === fromSolid) return;
    pairs.set(source, target);
  };

  add(toLowerJoined(fromParts, '-'), toLowerJoined(toParts, '-'));
  add(toLowerJoined(fromParts, '_'), toLowerJoined(toParts, '_'));
  add(toTitle(fromParts), toTitle(toParts));
  add(
    toLowerJoined(fromParts, '-').toUpperCase(),
    toLowerJoined(toParts, '-').toUpperCase(),
  );
  add(
    toLowerJoined(fromParts, '_').toUpperCase(),
    toLowerJoined(toParts, '_').toUpperCase(),
  );

  return [...pairs.entries()].sort((a, b) => b[0].length - a[0].length);
}

function shouldSkipDir(name) {
  return SKIP_DIR_NAMES.has(name);
}

function isProbablyTextFile(filePath) {
  const base = filePath.split('/').pop() ?? '';
  if (base === '.env' || base.startsWith('.env.') || base.endsWith('.sample')) {
    return true;
  }
  if (base === 'Dockerfile' || base === 'Makefile' || base === 'AGENTS.md') {
    return true;
  }

  const dot = base.lastIndexOf('.');
  if (dot === -1) return false;
  return TEXT_EXTENSIONS.has(base.slice(dot).toLowerCase());
}

function walkFiles(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (shouldSkipDir(entry)) continue;

    const full = join(dir, entry);
    let stats;
    try {
      stats = statSync(full);
    } catch {
      continue;
    }

    if (stats.isDirectory()) {
      walkFiles(full, files);
      continue;
    }

    if (stats.isFile()) {
      files.push(full);
    }
  }

  return files;
}

function applyReplacements(content, fromSolid, toParts, separatorPairs) {
  let next = content;
  let hits = 0;

  // Separator forms first (longer / more specific).
  for (const [from, to] of separatorPairs) {
    if (!next.includes(from)) continue;
    const pieces = next.split(from);
    hits += pieces.length - 1;
    next = pieces.join(to);
  }

  const solidRe = new RegExp(escapeRegExp(fromSolid), 'gi');
  next = next.replace(solidRe, (match) => {
    hits += 1;
    return matchCase(match, toParts);
  });

  return { next, hits };
}

function renamePathIfNeeded(filePath, fromSolid, toParts, separatorPairs, dryRun) {
  const name = filePath.split('/').pop() ?? '';
  const { next: newName, hits } = applyReplacements(
    name,
    fromSolid,
    toParts,
    separatorPairs,
  );

  if (hits === 0 || newName === name) {
    return filePath;
  }

  const target = join(dirname(filePath), newName);
  if (existsSync(target)) {
    console.warn(
      `  skip rename (target exists): ${relative(ROOT, filePath)} → ${newName}`,
    );
    return filePath;
  }

  if (!dryRun) {
    renameSync(filePath, target);
  }

  console.log(`  renamed: ${relative(ROOT, filePath)} → ${newName}`);
  return target;
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (!options.from || !options.to) {
    printHelp();
    console.error('Error: --from and --to are required.');
    process.exit(1);
  }

  const fromParts = splitNameParts(options.from);
  const toParts = splitNameParts(options.to);

  if (fromParts.length === 0 || toParts.length === 0) {
    console.error('Error: --from and --to must be non-empty.');
    process.exit(1);
  }

  const fromSolid = toLowerJoined(fromParts);
  const toSolid = toLowerJoined(toParts);

  if (fromSolid === toSolid) {
    console.error('Error: --from and --to must differ.');
    process.exit(1);
  }

  const separatorPairs = buildSeparatorPairs(fromParts, toParts);

  console.log(
    options.dryRun
      ? 'Dry run — no files will be written.\n'
      : 'Applying project rename…\n',
  );
  console.log('Solid name (case-insensitive):');
  console.log(`  ${fromSolid} → ${toSolid}`);
  if (separatorPairs.length > 0) {
    console.log('Separator variants:');
    for (const [from, to] of separatorPairs) {
      console.log(`  ${JSON.stringify(from)} → ${JSON.stringify(to)}`);
    }
  }
  console.log('');

  const files = walkFiles(ROOT);
  let filesChanged = 0;
  let totalHits = 0;
  const changedPaths = [];

  for (const filePath of files) {
    const rel = relative(ROOT, filePath);
    if (rel === SELF_RELATIVE) {
      continue;
    }

    const base = filePath.split('/').pop() ?? '';
    if (!options.includeLockfiles && SKIP_FILE_NAMES.has(base)) {
      continue;
    }
    if (!isProbablyTextFile(filePath)) {
      continue;
    }

    let content;
    try {
      content = readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }

    if (content.includes('\u0000')) {
      continue;
    }

    const { next, hits } = applyReplacements(
      content,
      fromSolid,
      toParts,
      separatorPairs,
    );
    if (hits === 0) {
      continue;
    }

    filesChanged += 1;
    totalHits += hits;
    changedPaths.push(rel);

    console.log(`  update (${hits}): ${rel}`);

    if (!options.dryRun) {
      writeFileSync(filePath, next, 'utf8');
    }
  }

  if (options.renamePaths) {
    console.log('\nPath renames:');
    const pathCandidates = walkFiles(ROOT)
      .filter((filePath) => relative(ROOT, filePath) !== SELF_RELATIVE)
      .sort((a, b) => b.split('/').length - a.split('/').length);

    let pathRenames = 0;
    for (const filePath of pathCandidates) {
      const before = filePath;
      const after = renamePathIfNeeded(
        before,
        fromSolid,
        toParts,
        separatorPairs,
        options.dryRun,
      );
      if (after !== before) pathRenames += 1;
    }

    if (pathRenames === 0) {
      console.log('  (none)');
    }
  }

  console.log(
    `\nDone. ${filesChanged} file(s), ${totalHits} replacement(s)${
      options.dryRun ? ' (dry run)' : ''
    }.`,
  );

  if (filesChanged > 0 && !options.includeLockfiles) {
    console.log(
      'Tip: run `bun install` after renaming so bun.lock picks up the new package name.',
    );
  }

  if (changedPaths.length > 0 && options.dryRun) {
    console.log('\nFiles that would change:');
    for (const path of changedPaths) {
      console.log(`  - ${path}`);
    }
  }
}

main();
