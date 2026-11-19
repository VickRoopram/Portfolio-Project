#!/usr/bin/env node
// Repo health checks run by .github/workflows/ci.yml (and locally: `npm run check`).
// No dependencies: Node built-ins only, so it runs the same on a laptop and in CI.
//
// Fails (exit 1) on:
//   1. JavaScript that doesn't parse (node --check)
//   2. Relative imports / local src & href in HTML and CSS that point at missing files
//   3. Unresolved merge-conflict markers
//   4. Files at or over 50 MiB (GitHub warns at 50 MiB and blocks at 100 MiB)
//   5. Secret-looking files (.env, private keys) committed by mistake
//   6. JSON that doesn't parse
// Warns (doesn't fail) on files over 10 MiB and on OS junk like .DS_Store.

import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, normalize, extname, basename } from 'node:path';

const MiB = 1024 * 1024;
const FAIL_SIZE = 50 * MiB;
const WARN_SIZE = 10 * MiB;
const TEXT_EXT = new Set(['.js', '.mjs', '.mts', '.ts', '.css', '.html', '.json', '.md', '.toml', '.yml', '.yaml', '.py', '.txt', '.svg']);

const errors = [];
const warnings = [];
const fail = (file, msg) => errors.push(`${file}: ${msg}`);
const warn = (file, msg) => warnings.push(`${file}: ${msg}`);

const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)
  .filter((f) => existsSync(f)); // skip files deleted in the working tree

// Local paths only: skip URLs, data:, anchors, template placeholders and bare "./".
const isLocal = (p) => p && !/^([a-z]+:|\/\/|#|\$\{|\{\{)/i.test(p) && p !== './' && p !== '.';
const clean = (p) => p.split(/[?#]/)[0];
const resolveRef = (from, ref) => (ref.startsWith('/') ? normalize(ref.slice(1)) : normalize(join(dirname(from), ref)));

for (const file of files) {
  const ext = extname(file).toLowerCase();
  const size = statSync(file).size;

  // 4. Size
  if (size >= FAIL_SIZE) fail(file, `${(size / MiB).toFixed(1)} MiB. Keep media under 50 MiB (store originals in Google Drive, commit web copies).`);
  else if (size > WARN_SIZE) warn(file, `${(size / MiB).toFixed(1)} MiB. Large for a website; check it's a web-sized copy.`);

  // 5. Secrets and junk
  const name = basename(file);
  if (name === '.env' || name.startsWith('.env.') || /\.(pem|key|p12)$/i.test(name) || /^id_(rsa|ed25519)/.test(name)) {
    fail(file, 'looks like a secret or credentials file. Remove it from git and rotate the secret.');
  }
  if (name === '.DS_Store' || name === 'Thumbs.db') warn(file, 'OS junk file committed. `git rm --cached` it.');

  if (!TEXT_EXT.has(ext)) continue;
  const text = readFileSync(file, 'utf8');

  // 3. Conflict markers (line-start only, so docs that mention them in prose are fine)
  if (/^(<{7} |>{7} |={7}$)/m.test(text)) fail(file, 'unresolved merge-conflict markers (<<<<<<< / ======= / >>>>>>>).');

  // 1. Syntax
  if (ext === '.js' || ext === '.mjs') {
    const r = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (r.status !== 0) fail(file, `syntax error\n${(r.stderr || '').trim().split('\n').slice(0, 5).join('\n')}`);
  }

  // 6. JSON
  if (ext === '.json' && !file.startsWith('.vscode/')) { // .vscode/*.json is JSONC (comments allowed)
    try { JSON.parse(text); } catch (e) { fail(file, `invalid JSON: ${e.message}`); }
  }

  // 2. Broken local references
  const refs = [];
  if (ext === '.js' || ext === '.mjs') {
    for (const m of text.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|^\s*import\s+)['"](\.{1,2}\/[^'"]+)['"]/gm)) refs.push(m[1]);
  }
  let base = file;
  if (ext === '.html') {
    // Honour <base href="…">: the page's relative links resolve from there.
    const b = text.match(/<base\s+href\s*=\s*"([^"]+)"/i);
    if (b) base = join(resolveRef(file, b[1]), '_');
    for (const m of text.matchAll(/<(?!base\b)[a-z]+\b[^>]*?\b(?:src|href)\s*=\s*"([^"]+)"/gi)) refs.push(m[1]);
  }
  if (ext === '.css') {
    // @supports (…) conditions use dummy url()s for feature tests; skip them.
    const css = text.replace(/@supports\s*\([^{]*/g, '');
    for (const m of css.matchAll(/@import\s+(?:url\()?['"]([^'"]+)['"]/g)) refs.push(m[1]);
    for (const m of css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) refs.push(m[1]);
  }
  for (const raw of refs) {
    const ref = clean(raw.trim());
    if (!isLocal(ref)) continue;
    // Served by Netlify functions / Blobs at runtime, not files in the repo.
    if (/^\/?(api|media|\.netlify)\//.test(ref)) continue;
    const target = resolveRef(base, ref);
    if (target.endsWith('/') ? !existsSync(join(target, 'index.html')) : !existsSync(target)) {
      fail(file, `points at "${raw}", but ${target} is not in the repo.`);
    }
  }
}

for (const w of warnings) console.log(`::warning::${w.split('\n')[0]}`);
if (errors.length) {
  for (const e of errors) console.log(`::error::${e.split('\n')[0]}\n${e.split('\n').slice(1).join('\n')}`);
  console.log(`\n✗ ${errors.length} problem(s) in ${files.length} files. Fix them before merging.`);
  process.exit(1);
}
console.log(`✓ ${files.length} files checked: syntax, references, conflict markers, sizes, secrets, JSON. ${warnings.length} warning(s).`);
