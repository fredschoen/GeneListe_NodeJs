const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
const CSV_PATH = path.join(__dirname, 'Data', 'Qui.csv');

app.use(express.json());
app.use(express.static(__dirname));

let headers = [];
let rows = [];
let delimiter = ';';
const TXT_PATH = path.join(__dirname, 'Data', 'qui.txt');

function detectDelimiter(line) {
  return line.includes(';') ? ';' : '\t';
}

function loadCsv() {
  const raw = fs.readFileSync(CSV_PATH, 'utf8');
  const lines = raw.split(/\r?\n/).filter(l => l.trim().length);
  if (!lines.length) {
    headers = [];
    rows = [];
    delimiter = ';';
    return;
  }
  delimiter = detectDelimiter(lines[0]);
  headers = lines[0].split(delimiter).map(h => h.trim());
  rows = lines.slice(1).map(line => {
    const cells = line.split(delimiter).map(c => c.trim());
    const row = {};
    headers.forEach((h, i) => { row[h || `Col${i + 1}`] = cells[i] ?? ''; });
    for (let j = headers.length; j < cells.length; j++) {
      row[`Col${j + 1}`] = cells[j];
    }
    return row;
  });
  console.log(`[loadCsv] Chargé ${rows.length} lignes depuis ${CSV_PATH}`);
}

function rowsToCsv() {
  const lines = [];
  lines.push(headers.join(delimiter));
  rows.forEach(row => {
    const cells = headers.map(h => (row[h] ?? '').toString());
    lines.push(cells.join(delimiter));
  });
  return lines.join('\n');
}

function findIdKey() {
  return headers.find(h => h.toLowerCase() === 'id');
}

function findKey(name) {
  const needle = name.toLowerCase();
  return headers.find(h => h.toLowerCase() === needle);
}

function parseGeneSegments(gene) {
  return String(gene || '')
    .split(/[&#]/)
    .map(s => s.trim())
    .filter(Boolean);
}

function compareGene(a, b) {
  return a.localeCompare(b, 'fr', { numeric: true, sensitivity: 'base' });
}

function buildPersonLabel(row, keys) {
  const nom = (row[keys.nom] || '').trim();
  const prenom = (row[keys.prenom] || '').trim();
  const s = (row[keys.s] || '').trim();
  const naissAaaa = (row[keys.naissAaaa] || '').trim();
  const main = [nom, prenom].filter(Boolean).join(' ').trim() || '(sans nom)';
  const bits = [main];
  const bracket = [s, naissAaaa].filter(Boolean).join(' ');
  if (bracket) bits.push(`[${bracket}]`);
  return bits.join(' ');
}

function buildGeneTreeText() {
  const keys = {
    id: findKey('id'),
    gene: findKey('gene'),
    nom: findKey('nom'),
    prenom: findKey('prenom'),
    s: findKey('s'),
    naissAaaa: findKey('naiss_aaaa'),
  };
  if (!keys.gene) {
    return 'Impossible de generer qui.txt: colonne "Gene" absente.';
  }

  const treeRoot = { token: null, row: null, children: new Map() };
  const sorted = [...rows]
    .filter(r => (r[keys.gene] || '').trim().length > 0)
    .sort((ra, rb) => compareGene(ra[keys.gene] || '', rb[keys.gene] || ''));

  sorted.forEach(row => {
    const segments = parseGeneSegments(row[keys.gene]);
    if (!segments.length) return;
    let cursor = treeRoot;
    segments.forEach(seg => {
      if (!cursor.children.has(seg)) {
        cursor.children.set(seg, { token: seg, row: null, children: new Map() });
      }
      cursor = cursor.children.get(seg);
    });
    if (!cursor.row) cursor.row = row;
  });

  const lines = [
    `Arbre genealogique (${new Date().toISOString()})`,
    '',
  ];

  function buildSpouseInlineText(node) {
    const spouseNode = node.children.get('0');
    if (!spouseNode || !spouseNode.row) return '';
    return `  & ${buildPersonLabel(spouseNode.row, keys)}`;
  }

  function walk(node, prefix, isLast) {
    const connector = isLast ? '└─ ' : '├─ ';
    const label = node.row ? ` ${buildPersonLabel(node.row, keys)}` : '';
    const spouseInline = buildSpouseInlineText(node);
    lines.push(`${prefix}${connector}${node.token}${label}${spouseInline}`);
    const children = Array.from(node.children.values())
      .filter(child => child.token !== '0');
    children.sort((a, b) => compareGene(a.token, b.token));
    const childPrefix = `${prefix}${isLast ? '   ' : '│  '}`;
    children.forEach((child, idx) => {
      walk(child, childPrefix, idx === children.length - 1);
    });
  }

  const roots = Array.from(treeRoot.children.values());
  roots.sort((a, b) => compareGene(a.token, b.token));
  roots.forEach((node, idx) => walk(node, '', idx === roots.length - 1));

  if (!roots.length) {
    lines.push('(aucune donnee)');
  }

  return lines.join('\n');
}

function writeQuiTxt() {
  const content = buildGeneTreeText();
  fs.writeFileSync(TXT_PATH, content, 'utf8');
  return TXT_PATH;
}

loadCsv();
writeQuiTxt();

app.get('/api/data', (req, res) => {
  res.json({ headers, rows });
});

app.get('/api/row/:id', (req, res) => {
  const idKey = findIdKey();
  if (!idKey) return res.status(400).json({ error: 'Colonne ID absente' });
  const row = rows.find(r => r[idKey] === req.params.id);
  if (!row) return res.status(404).json({ error: 'Entrée non trouvée' });
  res.json({ headers, row });
});

app.post('/api/row', (req, res) => {
  const idKey = findIdKey();
  if (!idKey) return res.status(400).json({ error: 'Colonne ID absente' });
  const maxId = rows.reduce((max, r) => {
    const n = Number(r[idKey]);
    return Number.isFinite(n) ? Math.max(max, n) : max;
  }, 0);
  const newId = String(maxId + 1);
  const newRow = {};
  headers.forEach(h => { newRow[h] = ''; });
  newRow[idKey] = newId;
  rows.unshift(newRow);
  res.json({ ok: true, row: newRow });
});

app.patch('/api/row/:id', (req, res) => {
  const { field, value } = req.body || {};
  if (!field) return res.status(400).json({ error: 'Champ manquant' });
  const idKey = findIdKey();
  if (!idKey) return res.status(400).json({ error: 'Colonne ID absente' });
  const row = rows.find(r => r[idKey] === req.params.id);
  if (!row) return res.status(404).json({ error: 'Entrée non trouvée' });
  if (field === idKey) return res.status(400).json({ error: 'ID non modifiable' });
  row[field] = value ?? '';
  res.json({ ok: true, row });
});

app.delete('/api/row/:id', (req, res) => {
  const idKey = findIdKey();
  if (!idKey) return res.status(400).json({ error: 'Colonne ID absente' });
  const idx = rows.findIndex(r => r[idKey] === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Entrée non trouvée' });
  const removed = rows.splice(idx, 1)[0];
  res.json({ ok: true, removed });
});

app.post('/api/renumber', (req, res) => {
  const idKey = findIdKey();
  if (!idKey) return res.status(400).json({ error: 'Colonne ID absente' });
  rows.forEach((row, index) => {
    row[idKey] = String(index + 1);
  });
  res.json({ ok: true, updated: rows.length, rows });
});

app.post('/api/save', (req, res) => {
  try {
    const now = new Date();
    const pad2 = (n) => String(n).padStart(2, '0');
    const timestamp =
      `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}` +
      `_${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`;
    const saveDir = path.join(__dirname, 'Data/Save');
    const backupPath = path.join(saveDir, `qui_${timestamp}.csv`);
    fs.mkdirSync(saveDir, { recursive: true });
    fs.copyFileSync(CSV_PATH, backupPath);

    const csv = rowsToCsv();
    //console.log(csv);
    fs.writeFileSync(CSV_PATH, csv, 'utf8');
    const txtPath = writeQuiTxt();
    res.json({ ok: true, saved: rows.length, path: CSV_PATH, backup: backupPath, txt: txtPath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/export/js', (req, res) => {
  try {
    const jsPath = path.join(__dirname, 'Qui.js');
    const payload = {
      headers,
      rows,
    };
    const content =
`// Généré automatiquement depuis ${path.relative(__dirname, CSV_PATH)} le ${new Date().toISOString()}
(function(){
  const headers = ${JSON.stringify(payload.headers, null, 2)};
  const rows = ${JSON.stringify(payload.rows, null, 2)};
  window.renderJs = function(renderFn){
    if (typeof renderFn === 'function') {
      renderFn(headers, rows);
    } else if (typeof window.render === 'function') {
      window.render(headers, rows);
    } else {
      console.warn('Aucune fonction render disponible pour afficher les données JS.');
    }
  };
})();`;

    fs.writeFileSync(jsPath, content, 'utf8');
    res.json({ ok: true, path: jsPath, headers: headers.length, rows: rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reload', (req, res) => {
  loadCsv();
  writeQuiTxt();
  res.json({ ok: true, headers, rows });
});

app.post('/api/export/txt', (req, res) => {
  try {
    const txtPath = writeQuiTxt();
    res.json({ ok: true, path: txtPath, rows: rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur GeneListe sur http://127.0.0.1:${PORT}`);
});
