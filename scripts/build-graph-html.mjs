// docs/dependency-graph.json'i okuyup tek dosyalık offline interaktif HTML uretir.
// Ek bagimlilik kullanmaz; tarayicida vanilla SVG ile force-benzeri kolonlu layout cizer.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const inputPath = resolve(root, '.codegraph/dependency-graph.json');
const outputPath = resolve(root, '.codegraph/dependency-graph.html');

const graph = JSON.parse(readFileSync(inputPath, 'utf8'));

const modules = Object.keys(graph);
const incoming = Object.fromEntries(modules.map((m) => [m, 0]));
modules.forEach((m) => {
    (graph[m] || []).forEach((dep) => {
        if (incoming[dep] !== undefined) incoming[dep] += 1;
    });
});

const layerOf = (m) => {
    if (m === 'app.jsx') return 'app';
    if (m.startsWith('tabs/')) return 'tabs';
    if (m.startsWith('ui/')) return 'ui';
    if (m.startsWith('core/')) return 'core';
    return 'other';
};

const colorOf = {
    app: '#f59e0b',
    tabs: '#3b82f6',
    ui: '#10b981',
    core: '#a855f7',
    other: '#94a3b8'
};

const payload = {
    modules: modules.map((id) => ({
        id,
        layer: layerOf(id),
        color: colorOf[layerOf(id)],
        incoming: incoming[id]
    })),
    edges: modules.flatMap((src) =>
        (graph[src] || []).map((dst) => ({ src, dst }))
    )
};

const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>Bagimlilik Grafi - Oto Yikama Pro</title>
<style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: 'Segoe UI', system-ui, sans-serif; background: #0b1115; color: #e2e8f0; }
    header { padding: 16px 24px; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
    header h1 { margin: 0; font-size: 18px; }
    header p { margin: 4px 0 0; font-size: 12px; color: #94a3b8; }
    .legend { display: flex; gap: 12px; font-size: 11px; }
    .legend span { display: inline-flex; align-items: center; gap: 6px; }
    .legend i { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }
    main { display: flex; height: calc(100vh - 78px); }
    aside { width: 280px; border-right: 1px solid #1e293b; padding: 12px; overflow-y: auto; font-size: 12px; }
    aside h2 { margin: 0 0 8px; font-size: 13px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
    aside ul { list-style: none; padding: 0; margin: 0 0 16px; }
    aside li { padding: 6px 8px; border-radius: 4px; cursor: pointer; display: flex; justify-content: space-between; gap: 8px; }
    aside li:hover, aside li.active { background: #1e293b; }
    aside li b { color: #e2e8f0; font-weight: 600; }
    aside li small { color: #64748b; font-size: 10px; }
    .graph-wrap { flex: 1; overflow: auto; position: relative; }
    svg { display: block; }
    .node-label { font-size: 11px; fill: #e2e8f0; pointer-events: none; }
    .node circle { stroke: #0b1115; stroke-width: 2px; cursor: pointer; transition: r 120ms; }
    .node:hover circle { r: 11; }
    .edge { stroke: #334155; stroke-width: 1; fill: none; opacity: 0.45; transition: stroke 120ms, opacity 120ms; }
    .edge.active { stroke: #f59e0b; opacity: 1; stroke-width: 1.6; }
    .node.dim circle { opacity: 0.2; }
    .node.dim text { opacity: 0.3; }
    .info { position: absolute; top: 12px; right: 12px; background: #111827; border: 1px solid #1e293b; padding: 10px 12px; border-radius: 6px; font-size: 11px; max-width: 320px; display: none; }
    .info h3 { margin: 0 0 6px; font-size: 12px; }
    .info ul { margin: 4px 0 0; padding-left: 14px; }
    .info code { background: #1e293b; padding: 1px 4px; border-radius: 3px; }
</style>
</head>
<body>
<header>
    <div>
        <h1>Bagimlilik Grafi</h1>
        <p>${modules.length} modul - ${payload.edges.length} import iliskisi</p>
    </div>
    <div class="legend">
        <span><i style="background:${colorOf.app}"></i>app</span>
        <span><i style="background:${colorOf.tabs}"></i>tabs</span>
        <span><i style="background:${colorOf.ui}"></i>ui</span>
        <span><i style="background:${colorOf.core}"></i>core</span>
    </div>
</header>
<main>
    <aside id="sidebar"></aside>
    <div class="graph-wrap">
        <svg id="graph" width="1200" height="700"></svg>
        <div class="info" id="info"></div>
    </div>
</main>
<script>
const DATA = ${JSON.stringify(payload)};

const layers = ['core', 'ui', 'tabs', 'app'];
const layerX = { core: 200, ui: 500, tabs: 850, app: 1080, other: 1080 };

const grouped = {};
layers.forEach((l) => grouped[l] = []);
grouped.other = [];
DATA.modules.forEach((m) => grouped[m.layer].push(m));
Object.values(grouped).forEach((arr) => arr.sort((a, b) => b.incoming - a.incoming || a.id.localeCompare(b.id)));

const positions = {};
const allLayers = [...layers, 'other'];
allLayers.forEach((layer) => {
    const list = grouped[layer];
    const spacing = 30;
    const totalH = list.length * spacing;
    const startY = Math.max(40, (700 - totalH) / 2);
    list.forEach((mod, idx) => {
        positions[mod.id] = { x: layerX[layer], y: startY + idx * spacing + 20 };
    });
});

const svg = document.getElementById('graph');
const NS = 'http://www.w3.org/2000/svg';

const edgeEls = DATA.edges.map((e) => {
    const a = positions[e.src];
    const b = positions[e.dst];
    if (!a || !b) return null;
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('class', 'edge');
    const mx = (a.x + b.x) / 2;
    path.setAttribute('d', \`M\${a.x},\${a.y} C\${mx},\${a.y} \${mx},\${b.y} \${b.x},\${b.y}\`);
    path.dataset.src = e.src;
    path.dataset.dst = e.dst;
    svg.appendChild(path);
    return path;
});

const nodeIndex = {};
DATA.modules.forEach((mod) => {
    const pos = positions[mod.id];
    if (!pos) return;
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'node');
    g.dataset.id = mod.id;
    g.setAttribute('transform', \`translate(\${pos.x}, \${pos.y})\`);

    const circle = document.createElementNS(NS, 'circle');
    circle.setAttribute('r', Math.min(11, 5 + Math.sqrt(mod.incoming) * 2));
    circle.setAttribute('fill', mod.color);
    g.appendChild(circle);

    const text = document.createElementNS(NS, 'text');
    text.setAttribute('class', 'node-label');
    text.setAttribute('x', mod.layer === 'app' ? -10 : 14);
    text.setAttribute('y', 4);
    text.setAttribute('text-anchor', mod.layer === 'app' ? 'end' : 'start');
    text.textContent = mod.id;
    g.appendChild(text);

    g.addEventListener('mouseenter', () => highlight(mod.id));
    g.addEventListener('mouseleave', () => highlight(null));
    g.addEventListener('click', () => showInfo(mod.id));

    svg.appendChild(g);
    nodeIndex[mod.id] = g;
});

function highlight(id) {
    if (!id) {
        svg.querySelectorAll('.node').forEach((n) => n.classList.remove('dim'));
        svg.querySelectorAll('.edge').forEach((e) => e.classList.remove('active'));
        return;
    }
    const connected = new Set([id]);
    DATA.edges.forEach((e) => {
        if (e.src === id) connected.add(e.dst);
        if (e.dst === id) connected.add(e.src);
    });
    svg.querySelectorAll('.node').forEach((n) => {
        n.classList.toggle('dim', !connected.has(n.dataset.id));
    });
    svg.querySelectorAll('.edge').forEach((e) => {
        e.classList.toggle('active', e.dataset.src === id || e.dataset.dst === id);
    });
}

const info = document.getElementById('info');
function showInfo(id) {
    const imports = DATA.edges.filter((e) => e.src === id).map((e) => e.dst);
    const importedBy = DATA.edges.filter((e) => e.dst === id).map((e) => e.src);
    info.style.display = 'block';
    info.innerHTML = \`<h3>\${id}</h3>
        <p>Import edilen: <b>\${imports.length}</b> | Import eden: <b>\${importedBy.length}</b></p>
        <p><b>Import ettigi:</b></p>
        <ul>\${imports.length ? imports.map((i) => \`<li><code>\${i}</code></li>\`).join('') : '<li><i>(yok)</i></li>'}</ul>
        <p style="margin-top:6px"><b>Import edenler:</b></p>
        <ul>\${importedBy.length ? importedBy.map((i) => \`<li><code>\${i}</code></li>\`).join('') : '<li><i>(yok)</i></li>'}</ul>\`;
}

// Sidebar
const sidebar = document.getElementById('sidebar');
allLayers.forEach((layer) => {
    if (!grouped[layer].length) return;
    const h = document.createElement('h2');
    h.textContent = layer;
    sidebar.appendChild(h);
    const ul = document.createElement('ul');
    grouped[layer].forEach((mod) => {
        const li = document.createElement('li');
        li.innerHTML = \`<b>\${mod.id.replace(layer + '/', '')}</b><small>\${mod.incoming}x</small>\`;
        li.addEventListener('mouseenter', () => highlight(mod.id));
        li.addEventListener('mouseleave', () => highlight(null));
        li.addEventListener('click', () => {
            showInfo(mod.id);
            const pos = positions[mod.id];
            if (pos) {
                const wrap = document.querySelector('.graph-wrap');
                wrap.scrollTo({ left: pos.x - wrap.clientWidth / 2, top: pos.y - wrap.clientHeight / 2, behavior: 'smooth' });
            }
        });
        ul.appendChild(li);
    });
    sidebar.appendChild(ul);
});
</script>
</body>
</html>`;

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, html, 'utf8');
console.log(`Olusturuldu: ${outputPath}`);
console.log(`  ${modules.length} modul, ${payload.edges.length} kenar.`);
