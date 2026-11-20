#!/usr/bin/env node
// Post-deploy smoke test, run by .github/workflows/ci.yml after a push to main or version-01.
// Netlify (not GitHub) does the deploying. This waits until the site at SITE_URL serves the files
// this commit changed, byte for byte, then checks the pages that must always load.
//
// Usage: SITE_URL=https://version-01--vick-does-creative.netlify.app node scripts/smoke-check.mjs
// Env:   SITE_URL (required), TIMEOUT_S (default 420), INTERVAL_S (default 15)

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, appendFileSync } from 'node:fs';

const site = (process.env.SITE_URL || '').replace(/\/$/, '');
if (!site) { console.log('::error::SITE_URL is not set'); process.exit(1); }
const timeout = Number(process.env.TIMEOUT_S || 420) * 1000;
const interval = Number(process.env.INTERVAL_S || 15) * 1000;
const bust = `cb=${Date.now()}`;

// Files Netlify serves as-is (publish = "."). Skip anything not served or rewritten.
// Anything inside a dot-folder or dot-file (.github, .githooks, .vscode, .gitignore…) is skipped too.
const NOT_SERVED = /(^|\/)\.|^(docs|netlify|scripts|tools|node_modules)\/|^(package(-lock)?\.json|netlify\.toml)$|\.md$/;

let changed = [];
try {
  changed = execFileSync('git', ['diff', '--name-only', '--diff-filter=AM', 'HEAD~1', 'HEAD'], { encoding: 'utf8' })
    .split('\n').filter(Boolean).filter((f) => !NOT_SERVED.test(f) && existsSync(f) && f !== 'index.html');
} catch { /* first commit or shallow history: fall back to the always-load checks */ }
changed = changed.slice(0, 6);

const get = async (path) => {
  const res = await fetch(`${site}/${path}${path.includes('?') ? '&' : '?'}${bust}`, { redirect: 'follow', cache: 'no-store' });
  return { status: res.status, body: Buffer.from(await res.arrayBuffer()) };
};

const summary = [`### Smoke test: ${site}`, ''];
const writeSummary = (status) => {
  if (!process.env.GITHUB_STEP_SUMMARY) return;
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, [...summary, '', `**Result: ${status}**`, ''].join('\n') + '\n');
};

const started = Date.now();
if (changed.length) {
  console.log(`Waiting for ${site} to serve this commit's changes:\n  ${changed.join('\n  ')}`);
  for (;;) {
    const pending = [];
    for (const f of changed) {
      try {
        const { status, body } = await get(f);
        if (status !== 200 || !body.equals(readFileSync(f))) pending.push(`${f} (${status})`);
      } catch (e) { pending.push(`${f} (${e.message})`); }
    }
    if (!pending.length) {
      const secs = Math.round((Date.now() - started) / 1000);
      console.log(`✓ Live after ${secs}s.`);
      summary.push(`✅ This commit's ${changed.length} changed file(s) were live after ${secs}s: ${changed.map((f) => `\`${f}\``).join(', ')}`);
      break;
    }
    if (Date.now() - started > timeout) {
      console.log(`::error title=Netlify didn't publish this commit::After ${timeout / 1000}s these were still old or missing: ${pending.join(', ')}. Check the deploy log at app.netlify.com.`);
      summary.push(`❌ Netlify hadn't published this commit after ${timeout / 1000}s. Still old or missing: ${pending.join(', ')}`);
      writeSummary('failed');
      process.exit(1);
    }
    await new Promise((r) => setTimeout(r, interval));
  }
} else {
  console.log('No served files changed in this commit; checking the pages load.');
  summary.push('No served files changed in this commit, so only the always-load checks ran.');
}
summary.push('', '| | Path | HTTP |', '| --- | --- | --- |');

// Pages that must always load.
let bad = 0;
for (const path of ['', 'src/main.js', 'src/styles.css', 'admin/']) {
  const { status } = await get(path);
  console.log(`${status === 200 ? '✓' : '✗'} /${path} → ${status}`);
  summary.push(`| ${status === 200 ? '✅' : '❌'} | \`/${path}\` | ${status} |`);
  if (status !== 200) { bad++; console.log(`::error title=Page didn't load::/${path} returned ${status} on ${site}`); }
}
writeSummary(bad ? 'failed' : 'passed');
process.exit(bad ? 1 : 0);
