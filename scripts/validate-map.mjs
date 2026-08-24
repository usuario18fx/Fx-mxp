import fs from 'node:fs';

const file = new URL('../public/index.html', import.meta.url);
const source = fs.readFileSync(file, 'utf8');
const scriptMatch = source.match(/<script>([\s\S]*)<\/script>/);

if (!scriptMatch) throw new Error('No se encontró el script principal');

const markup = source.slice(0, source.indexOf('<script>'));
const script = scriptMatch[1];
const ids = [...markup.matchAll(/id="([^"]+)"/g)].map(match => match[1]);
const runtimeIds = [...script.matchAll(/id=["']([^"'${}]+)["']/g)].map(match => match[1]);
const availableIds = [...new Set([...ids, ...runtimeIds])];
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
const refs = [...script.matchAll(/\$\(['"]([^'"]+)['"]\)/g)].map(match => match[1]);
const missingIds = [...new Set(refs.filter(id => !availableIds.includes(id)))];
const functions = [...script.matchAll(/(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(match => match[1]);
const duplicateFunctions = [...new Set(functions.filter((name, index) => functions.indexOf(name) !== index))];
const inlineHandlers = [...markup.matchAll(/on(?:click|change|input|submit)="([A-Za-z_$][\w$]*)\s*\(/g)].map(match => match[1]);
const missingHandlers = [...new Set(inlineHandlers.filter(name => !functions.includes(name)))];

new Function(script);

if (duplicateIds.length) throw new Error(`IDs duplicados: ${duplicateIds.join(', ')}`);
if (missingIds.length) throw new Error(`Referencias DOM sin elemento: ${missingIds.join(', ')}`);
if (duplicateFunctions.length) throw new Error(`Funciones duplicadas: ${duplicateFunctions.join(', ')}`);
if (missingHandlers.length) throw new Error(`Handlers inline sin función: ${missingHandlers.join(', ')}`);

console.log(JSON.stringify({
  syntax: 'ok',
  htmlIds: ids.length,
  runtimeIds: runtimeIds.length,
  domReferences: refs.length,
  functions: functions.length,
  duplicateIds,
  missingIds,
  duplicateFunctions,
  missingHandlers
}, null, 2));
