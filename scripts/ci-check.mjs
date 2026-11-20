#!/usr/bin/env node
// Repo health checks run by .github/workflows/ci.yml (and locally: `npm run check`).
// No dependencies: Node built-ins only, so it runs the same on a laptop and in CI.
//
// Fails (exit 1) on:
//   syntax      JavaScript that doesn't parse (node --check)
//   references  Relative imports / local src & href in HTML and CSS that point at missing files
//   conflicts   Unresolved merge-conflict markers
//   sizes       Files at or over 50 MiB (GitHub warns at 50 MiB and blocks at 100 MiB)
//   secrets     Secret-looking files (.env, private keys) committed by mistake
//   json        JSON that doesn't parse
// Warns (doesn't fail) on files over 10 MiB and on OS junk like .DS_Store.
//
// In GitHub Actions each problem becomes an annotation on the exact file and line (shown in the PR's
// "Files changed" tab), and a results table is written to the run's summary page.

import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, existsSync, statSync, appendFileSync } from 'node:fs';
import { dirname, join, normalize, extname, basename } from 'node:path';

const MiB = 1024 * 1024;
const FAIL_SIZE = 50 * MiB;
const WARN_SIZE = 10 * MiB;
const TEXT_EXT = new Set(['.js', '.mjs', '.mts', '.ts', '.css', '.html', '.json', '.md', '.toml', '.yml', '.yaml', '.py', '.txt', '.svg']);
const CHECKS = {
  syntax: 'JavaScript parses',
  references: 'Imports and links point at real files',
  conflicts: 'No merge-conflict markers',
  sizes: 'No files of 50 MiB or more',
  secrets: 'No secret or key files',
  json: 'JSON files parse',
};

const problems = []; // { level: 'error'|'warning', check, file, line?, msg }
const add = (level, check, file, msg, line) => problems.push({ level, check, file, line, msg });
const lineOf = (text, index) => text.slice(0, index).split('\n').length;

const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)
  .filter((f) => existsSync(f)); // skip files deleted in the working tree

// Local paths only: skip URLs, data:, anchors, template placeholders and bare "./".
const isLocal = (p) => p && !/^([a-z]+:|\/\/|#|\$\{|\{\{)/i.test(p) && p !== './' && p !== '.';
const clean = (p) => p.split(/[?#]/)[0];
const resolveRef = (from, ref) => (ref.startsWith('/') ? normalize(ref.slice(1)) : normalize(join(dirname(from), ref)));
const reEscape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

for (const file of files) {
  const ext = extname(file).toLowerCase();
  const size = statSync(file).size;

  if (size >= FAIL_SIZE) add('error', 'sizes', file, `${(size / MiB).toFixed(1)} MiB. Keep media under 50 MiB (originals in Google Drive, web copies in git).`);
  else if (size > WARN_SIZE) add('warning', 'sizes', file, `${(size / MiB).toFixed(1)} MiB. Large for a website; check it's a web-sized copy.`);

  const name = basename(file);
  if (name === '.env' || name.startsWith('.env.') || /\.(pem|key|p12)$/i.test(name) || /^id_(rsa|ed25519)/.test(name)) {
    add('error', 'secrets', file, 'Looks like a secret or credentials file. Remove it from git and rotate the secret.');
  }
  if (name === '.DS_Store' || name === 'Thumbs.db') add('warning', 'secrets', file, 'OS junk file committed. Run `git rm --cached` on it.');

  if (!TEXT_EXT.has(ext)) continue;
  const text = readFileSync(file, 'utf8');

  // Conflict markers at line start only, so docs that mention them in prose are fine.
  const conflict = /^(<{7} |>{7} |={7}$)/m.exec(text);
  if (conflict) add('error', 'conflicts', file, 'Unresolved merge-conflict marker. Pick the right side and delete the markers.', lineOf(text, conflict.index));

  if (ext === '.js' || ext === '.mjs') {
    const r = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (r.status !== 0) {
      const err = r.stderr || '';
      const line = Number((err.match(new RegExp(`${reEscape(file)}:(\\d+)`)) || [])[1]) || undefined;
      const msg = (err.split('\n').find((l) => /Error/.test(l)) || 'Syntax error').trim();
      add('error', 'syntax', file, msg, line);
    }
  }

  if (ext === '.json' && !file.startsWith('.vscode/')) { // .vscode/*.json is JSONC (comments allowed)
    try { JSON.parse(text); } catch (e) { add('error', 'json', file, `Invalid JSON: ${e.message}`); }
  }

  // Broken local references: [ref, index in text]
  const refs = [];
  let base = file;
  if (ext === '.js' || ext === '.mjs') {
    for (const m of text.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|^\s*import\s+)['"](\.{1,2}\/[^'"]+)['"]/gm)) refs.push([m[1], m.index]);
  }
  if (ext === '.html') {
    // Honour <base href="…">: the page's relative links resolve from there.
    const b = text.match(/<base\s+href\s*=\s*"([^"]+)"/i);
    if (b) base = join(resolveRef(file, b[1]), '_');
    for (const m of text.matchAll(/<(?!base\b)[a-z]+\b[^>]*?\b(?:src|href)\s*=\s*"([^"]+)"/gi)) refs.push([m[1], m.index]);
  }
  if (ext === '.css') {
    // @supports (…) conditions use dummy url()s for feature tests; blank them out (same length, so lines stay right).
    const css = text.replace(/@supports\s*\([^{]*/g, (s) => s.replace(/[^\n]/g, ' '));
    for (const m of css.matchAll(/@import\s+(?:url\()?['"]([^'"]+)['"]/g)) refs.push([m[1], m.index]);
    for (const m of css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) refs.push([m[1], m.index]);
  }
  for (const [raw, index] of refs) {
    const ref = clean(raw.trim());
    if (!isLocal(ref)) continue;
    if (/^\/?(api|media|\.netlify)\//.test(ref)) continue; // served by Netlify Functions / Blobs at runtime
    const target = resolveRef(base, ref);
    if (target.endsWith('/') ? !existsSync(join(target, 'index.html')) : !existsSync(target)) {
      add('error', 'references', file, `Points at "${raw}", but ${target} isn't in the repo (renamed, moved or not committed?).`, lineOf(text, index));
    }
  }
}

// ── Report ────────────────────────────────────────────────────────────────────
const inCI = !!process.env.GITHUB_ACTIONS;
const esc = (s) => String(s).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
const errors = problems.filter((p) => p.level === 'error');
const warnings = problems.filter((p) => p.level === 'warning');

for (const p of problems) {
  if (inCI) {
    const loc = `file=${esc(p.file)}${p.line ? `,line=${p.line}` : ''},title=${esc(CHECKS[p.check])}`;
    console.log(`::${p.level} ${loc}::${esc(p.msg)}`);
  } else {
    console.log(`${p.level === 'error' ? '✗' : '!'} ${p.file}${p.line ? `:${p.line}` : ''}  ${p.msg}`);
  }
}

if (process.env.GITHUB_STEP_SUMMARY) {
  const rows = Object.entries(CHECKS).map(([key, label]) => {
    const e = errors.filter((p) => p.check === key).length;
    const w = warnings.filter((p) => p.check === key).length;
    return `| ${e ? '❌' : w ? '⚠️' : '✅'} | ${label} | ${e} | ${w} |`;
  });
  const detail = problems.length
    ? ['', '| | File | Problem |', '| --- | --- | --- |',
       ...problems.map((p) => `| ${p.level === 'error' ? '❌' : '⚠️'} | \`${p.file}${p.line ? `:${p.line}` : ''}\` | ${p.msg.replace(/\|/g, '\\|')} |`)]
    : [];
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, [
    `### Repo checks: ${errors.length ? `${errors.length} problem(s)` : 'all passed'} (${files.length} files)`, '',
    '| | Check | Errors | Warnings |', '| --- | --- | --- | --- |', ...rows, ...detail, '',
  ].join('\n') + '\n');
}

if (errors.length) {
  console.log(`\n✗ ${errors.length} problem(s) in ${files.length} files. Fix them before merging.`);
  process.exit(1);
}
console.log(`✓ ${files.length} files checked: syntax, references, conflict markers, sizes, secrets, JSON. ${warnings.length} warning(s).`);
