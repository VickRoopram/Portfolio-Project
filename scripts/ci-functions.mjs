#!/usr/bin/env node
// Loads every Netlify Function (netlify/functions/*) the way Netlify's Node runtime would and checks
// it exports a default handler and a `config.path`. Catches TypeScript syntax errors, broken imports
// (e.g. a renamed netlify/lib file) and missing exports before they reach Netlify.
// Needs `npm ci` first. Runs on Node 24 (same as Netlify's functions runtime), which strips TypeScript natively.

import { readdirSync, appendFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const dir = 'netlify/functions';
const files = readdirSync(dir)
  .filter((f) => /\.(m?[jt]s)$/.test(f))
  .sort();
const rows = [];
let failed = 0;
const esc = (s) => String(s).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');

for (const f of files) {
  const path = join(dir, f);
  let problem = '';
  try {
    const mod = await import(pathToFileURL(resolve(path)).href);
    if (typeof mod.default !== 'function') problem = 'No default export handler function.';
    else if (!mod.config || !mod.config.path) problem = 'No `config.path` export, so the function has no route.';
  } catch (e) {
    problem = `Fails to load: ${(e && e.message) || e}`.split('\n')[0];
  }
  const route = problem ? '' : [].concat((await import(pathToFileURL(resolve(path)).href)).config.path).join(', ');
  if (problem) {
    failed++;
    console.log(
      process.env.GITHUB_ACTIONS
        ? `::error file=${path},title=Netlify Function::${esc(problem)}`
        : `✗ ${path}  ${problem}`,
    );
  } else {
    console.log(`✓ ${path} → ${route}`);
  }
  rows.push(`| ${problem ? '❌' : '✅'} | \`${path}\` | ${problem ? problem.replace(/\|/g, '\\|') : route} |`);
}

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    [
      `### Netlify Functions: ${failed ? `${failed} failed` : `all ${files.length} load`}`,
      '',
      '| | Function | Route / problem |',
      '| --- | --- | --- |',
      ...rows,
      '',
    ].join('\n') + '\n',
  );
}
process.exit(failed ? 1 : 0);
