const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const read = name => fs.readFileSync(`${process.argv[2] || __dirname}/${name}.js`, 'utf8');
const context = vm.createContext({
  window: {},
  document: { createElement: () => ({ dataset: {}, innerHTML: '' }) },
});
vm.runInContext(read('generator') + '\n' + read('preview'), context);
const vragen = ['88 + 10', '36 + 54', '100 - 8', '30 + 51', '50 - 8', '30 + 54',
  '82 + 10', '20 + 53', '20 + 77', '44 - 4', '41 - 10', '68 - 3',
  '82 - 10', '54 - 21', '70 - 3', '30 + 62'];
const blok = {
  id: 'gemengd-test', bewerking: 'gemengd', niveau: 100, brug: 'zonder',
  opdrachtzin: 'Kijk goed naar het teken. Reken uit.', hulpmiddelen: ['per-bewerking'],
  config: { hulpPerBewerking: { optellen: { hulpmiddelen: [] }, aftrekken: { hulpmiddelen: [] } } },
  oefeningen: vragen.map(vraag => ({ vraag, antwoord: 42, hulpConfig: {
    bewerking: vraag.includes('+') ? 'optellen' : 'aftrekken',
    niveau: 100, brug: 'zonder', hulpmiddelen: [], tot100Hulp: 'vakje',
  } })),
};
context.blok = blok;
const before = JSON.stringify(blok);
const html = vm.runInContext('Preview.maakBlokElement(blok).innerHTML', context);
assert.match(html, /class="oefeningen-grid "/);
assert.match(html, /blok-type-badge">Gemengd</);
assert.equal((html.match(/class="oefening-item/g) || []).length, 16);
assert.equal(JSON.stringify(blok), before, 'Rendering must preserve saved settings');

// Run the real PDF block dispatcher, recording the rows passed to the drawing routine.
const pdf = read('pdf-engine');
const dispatcher = pdf.slice(pdf.indexOf(' async function _tekenBlok('), pdf.indexOf('  function _pdfBreuk('));
Object.assign(context, {
  rows: [], headings: [], separators: [], y: 15,
  KOLOMMEN: 4, RIJHOOGTE: 18, RIJ_GAP: 3, VOOR_ZIN: 3, ZINRUIMTE: 9, NABLOK: 10, ML: 14, CW: 182,
  checkRuimte() {},
  doc: { setFont() {}, setFontSize() {}, setTextColor() {}, text(t) { context.headings.push(t); } },
  lijn() { context.separators.push(true); },
  _tekenRij(oefeningen, kolommen) { context.rows.push({ vragen: oefeningen.map(o => o.vraag), kolommen }); },
});
vm.runInContext(dispatcher, context);
(async () => {
  await vm.runInContext('_tekenBlok(blok)', context);
  assert.deepEqual(context.rows.map(r => r.vragen.length), [4, 4, 4, 4]);
  assert.ok(context.rows.every(r => r.kolommen === 4));
  assert.deepEqual(Array.from(context.rows.flatMap(r => Array.from(r.vragen))), vragen);
  assert.deepEqual(context.headings, [blok.opdrachtzin]);
  assert.equal(context.separators.length, 1);
  // Actual aids must retain their own layout and per-operation configuration.
  for (const hulpmiddel of ['tienraam-start', 'aftrek-tienramen-kringen', 'schrijflijnen', 'splitsbeen']) {
    blok.config.hulpPerBewerking.optellen.hulpmiddelen = [hulpmiddel];
    assert.equal(vm.runInContext('Generator.normaliseerGemengdBlok(blok)', context), blok);
  }
  console.log('Gemengd raster: preview 4 kolommen, PDF 4 x 4 in dezelfde volgorde; hulpmiddelen behouden.');
})().catch(error => { console.error(error); process.exitCode = 1; });
