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

loadCsv();

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

app.post('/api/save', (req, res) => {
  const csv = rowsToCsv();
  fs.writeFileSync(CSV_PATH, csv, 'utf8');
  res.json({ ok: true, saved: rows.length, path: CSV_PATH });
});

app.post('/api/reload', (req, res) => {
  loadCsv();
  res.json({ ok: true, headers, rows });
});

app.listen(PORT, () => {
  console.log(`Serveur GeneListe sur http://127.0.0.1:${PORT}`);
});