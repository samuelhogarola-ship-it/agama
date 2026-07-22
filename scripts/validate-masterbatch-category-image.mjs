import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const roots = [
  'index.html',
  'index.en.html',
  'build.js',
  'masterbatch',
  'productos',
  'filiales',
  'eventos',
  'entregas',
  'entrada-de-blog',
];
const textExtensions = new Set(['.html', '.js']);
const legacyPattern = /assets\/img\/master(?:-p-(?:320|500))?\.(?:jpg|webp)/g;
const cleanPattern = /assets\/img\/master-clean(?:-p-(?:320|500))?\.(?:jpg|webp)/g;
const requiredAssets = [
  'assets/img/master-clean.jpg',
  'assets/img/master-clean.webp',
  'assets/img/master-clean-p-500.jpg',
  'assets/img/master-clean-p-500.webp',
  'assets/img/master-clean-p-320.webp',
];
const legacyReferences = [];
let cleanReferenceCount = 0;

function inspectFile(relativeFile) {
  const source = fs.readFileSync(path.join(repoRoot, relativeFile), 'utf8');
  const legacyMatches = source.match(legacyPattern) || [];
  if (legacyMatches.length > 0) legacyReferences.push(relativeFile);
  cleanReferenceCount += (source.match(cleanPattern) || []).length;
}

function visit(relativeEntry) {
  const absoluteEntry = path.join(repoRoot, relativeEntry);
  const stat = fs.statSync(absoluteEntry);
  if (stat.isFile()) {
    if (textExtensions.has(path.extname(relativeEntry))) inspectFile(relativeEntry);
    return;
  }
  for (const entry of fs.readdirSync(absoluteEntry, { withFileTypes: true })) {
    const child = path.join(relativeEntry, entry.name);
    if (entry.isDirectory()) visit(child);
    else if (textExtensions.has(path.extname(entry.name))) inspectFile(child);
  }
}

for (const asset of requiredAssets) {
  const absoluteAsset = path.join(repoRoot, asset);
  if (!fs.existsSync(absoluteAsset) || fs.statSync(absoluteAsset).size === 0) {
    throw new Error(`Missing clean Masterbatch asset: ${asset}`);
  }
}

for (const root of roots) visit(root);

if (legacyReferences.length > 0) {
  throw new Error(`Legacy Masterbatch image references remain in:\n${legacyReferences.join('\n')}`);
}
if (cleanReferenceCount === 0) {
  throw new Error('No public references to the clean Masterbatch category image were found.');
}

console.log(`Masterbatch category image OK: ${cleanReferenceCount} clean references and no legacy references.`);
