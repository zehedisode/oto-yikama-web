// .codegraph/ klasorunu olusturur, madge ile JSON ve ozet uretir,
// ardindan build-graph-html.mjs'i cagirir.

import { mkdirSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const cacheDir = resolve(root, '.codegraph');

mkdirSync(cacheDir, { recursive: true });

const run = (cmd) => execSync(cmd, { cwd: root, stdio: ['ignore', 'pipe', 'inherit'] }).toString();

console.log('madge --json calistiriliyor...');
const json = run('npx madge --extensions js,jsx --json ./src');
writeFileSync(resolve(cacheDir, 'dependency-graph.json'), json, 'utf8');

console.log('madge --summary calistiriliyor...');
const summary = run('npx madge --extensions js,jsx --summary ./src');
writeFileSync(resolve(cacheDir, 'dependency-summary.txt'), summary, 'utf8');

console.log('HTML uretiliyor...');
execSync('node ./scripts/build-graph-html.mjs', { cwd: root, stdio: 'inherit' });

console.log('Tamamlandi:');
console.log(`  ${resolve(cacheDir, 'dependency-graph.json')}`);
console.log(`  ${resolve(cacheDir, 'dependency-summary.txt')}`);
console.log(`  ${resolve(cacheDir, 'dependency-graph.html')}`);
