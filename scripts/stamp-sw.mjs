// Build sonrasi calistirilir. Bundle ve CSS dosyalarinin SHA1 hash'i ile
// service-worker.js'teki CACHE_VERSION sabitini guncelliyoruz. Boylece her
// deploy yeni bir cache anahtari kullanir, eski cache otomatik temizlenir
// ve service worker stale icerik sunmaz.

import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const swPath = resolve(root, 'service-worker.js');
const filesToHash = [
    resolve(root, 'assets/js/app.js'),
    resolve(root, 'assets/css/tailwind.css')
];

const hash = createHash('sha1');
for (const f of filesToHash) {
    try {
        hash.update(readFileSync(f));
    } catch (err) {
        console.warn(`stamp-sw: ${f} okunamadi, atlaniyor (${err.message})`);
    }
}
const stamp = hash.digest('hex').slice(0, 10);

const sw = readFileSync(swPath, 'utf8');
const updated = sw.replace(
    /const\s+CACHE_VERSION\s*=\s*['"][^'"]+['"];/,
    `const CACHE_VERSION = 'zehedisode-${stamp}';`
);

if (updated === sw) {
    console.warn('stamp-sw: CACHE_VERSION satiri bulunamadi, dosya degistirilmedi.');
    process.exit(1);
}

writeFileSync(swPath, updated, 'utf8');
console.log(`stamp-sw: CACHE_VERSION -> zehedisode-${stamp}`);
