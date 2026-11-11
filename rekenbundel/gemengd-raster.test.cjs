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

async function controleerHulpmiddelen() {
  const calls = [];
  const mockDoc = new Proxy({}, {
    get(_, name) {
      if (name === 'getTextWidth') return value => String(value).length * 2;
      if (name === 'getNumberOfPages') return () => 1;
      if (name === 'addPage') return () => calls.push(['pagina']);
      if (name === 'addImage' || name === 'roundedRect') return (...args) => calls.push([name, ...args]);
      return () => {};
    },
  });
  const sandbox = vm.createContext({ window: {}, mockDoc });
  vm.runInContext(read('generator') + '\n' + read('tot20-hulp') + '\n' + read('tot100-hulp'), sandbox);
  vm.runInContext(`
    Tot20Hulp.png = async () => 'tienraam';
    Tot100Hulp.png = async () => 'weergave';
  `, sandbox);
  vm.runInContext(pdf.replace(/return \{\s*genereer[^}]*\};/, `return {
    async test(blok, startY) {
      doc = mockDoc;
      y = startY;
      await _tekenBlok(blok);
    },
  };`), sandbox);

  const normaal = hulpmiddel => ({ hulpmiddelen: hulpmiddel ? hulpmiddel.split('+') : [] });
  const afbeelding = tot100Hulp => ({ hulpmiddelen: [], tot100Hulp });
  const opties = [
    [normaal('splitsbeen'), normaal('splitsbeen')],
    [normaal('schrijflijnen'), normaal('splitsbeen+schrijflijnen')],
    [normaal('schrijflijnen'), normaal('')],
    [normaal('compenseren'), normaal('aanvullen')],
    [{...normaal('compenseren'), compenserenVariant:'zonder-hulp'}, {...normaal('aanvullen'), aanvullenVariant:'met-schijfjes'}],
    [{...normaal('transformeren'), transformerenVariant:'schema'}, {...normaal('transformeren'), transformerenVariant:'kaal'}],
    [{...normaal('transformeren'), transformerenVariant:'pijltjes'}, {...normaal('aanvullen'), aanvullenVariant:'met-schema'}],
    [afbeelding('invullijn'), afbeelding('cirkelrekenen')],
    [afbeelding('duizend-splits'), afbeelding('duizend-splits-zelf')],
    ...[
      ['tienramen-kleur', 'aftrek-tienramen-kringen'],
      ['tienraam-start', 'aftrek-tienramen'],
      ['zelf-splitsbenen', 'aftrek-zelf-splitsbenen'],
    ].map(pair => pair.map(key => ({ ...normaal(key), niveau: 20 }))),
  ];

  async function teken(opt, aft, aantal, startY = 15) {
    calls.length = 0;
    sandbox.blok = {
      bewerking: 'gemengd', opdrachtzin: 'Reken uit.',
      config: { hulpPerBewerking: { optellen: opt, aftrekken: aft } },
      oefeningen: Array.from({length: aantal}, (_, index) => ({
        vraag: index % 2 ? '47 - 19 =' : '27 + 19 =',
        antwoord: index % 2 ? 28 : 46, andereGetal: index % 2 ? 47 : 27,
        compenseerGetal: 19, tiental: 20, compenseerDelta: 1,
        transformeerGetal: 19, transformeerDelta: 1,
        hulpConfig: {
          bewerking: index % 2 ? 'aftrekken' : 'optellen',
          niveau: 100, brug: 'met', metVoorbeeld: index < 2,
          ...(index % 2 ? aft : opt),
        },
      })),
    };
    await vm.runInContext(`PdfEngine.test(blok, ${startY})`, sandbox);
    const posities = calls.flatMap(([naam, ...args]) => {
      if (naam === 'addImage') return [{ x: args[2], y: args[3], breedte: args[4], hoogte: args[5] }];
      if (naam === 'roundedRect' && [85, 87].includes(args[2])) {
        return [{ x: args[0], y: args[1], breedte: args[2], hoogte: args[3] }];
      }
      return [];
    });
    assert.equal(posities.length, aantal, JSON.stringify({opt, aft, posities}));
    return posities;
  }

  for (const [opt, aft] of opties) {
    const [a, b, c] = await teken(opt, aft, 3);
    assert.equal(a.y, b.y, JSON.stringify([opt, aft]));
    assert.ok(a.x < b.x && c.x === a.x);
    assert.ok(c.y >= a.y + Math.max(a.hoogte, b.hoogte));
  }
  for (const variant of ['sprongen-duizend-splits', 'sprongen-duizend-splits-zelf']) {
    const [a, b, c] = await teken(normaal('splitsbeen'), afbeelding(variant), 3);
    assert.equal(b.breedte, 182);
    assert.ok(a.y < b.y && b.y < c.y);
  }
  const [a, b] = await teken(normaal('splitsbeen'), normaal('schrijflijnen'), 2, 250);
  assert.equal(calls.filter(([naam]) => naam === 'pagina').length, 1);
  assert.equal(a.y, b.y);
  assert.ok(a.y < 100);
  console.log('Gemengde hulpmiddelen: twee per rij, brede getallenlijnen apart, pagina-einde behoudt het paar.');
}

controleerHulpmiddelen().catch(error => { console.error(error); process.exitCode = 1; });
