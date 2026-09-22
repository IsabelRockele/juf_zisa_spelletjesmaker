const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(process.argv[2] || `${__dirname}/app.js`, 'utf8');
const context = vm.createContext({ Math: Object.create(Math) });
vm.runInContext(source.slice(source.indexOf('  const _rrRnd ='), source.indexOf('  function _rrKader(')), context);

// Onafhankelijke controle: vergelijk de tientallenovergangen per cijferpositie.
function heeftBrug(a, b, aftrekken) {
  for (let eenheid = 10; eenheid <= Math.max(a, b) * 10; eenheid *= 10) {
    if (aftrekken ? a % eenheid < b % eenheid : a % eenheid + b % eenheid >= eenheid) return true;
  }
  return false;
}

let aantal = 0;
function controleer(niveau, brug, keuze, index) {
  const o = context._rrRooster(niveau, brug, keuze, index);
  const aftrekken = keuze === 'aftrekken' || (keuze === 'gemengd' && index % 2 === 1);
  assert.equal(o.bewerking, aftrekken ? 'aftrekken' : 'optellen');
  assert.equal(o.rijen.length, 3);
  assert.equal(o.kolommen.length, 3);
  assert.equal(new Set(o.rijen).size, 3, 'dubbele rij');
  assert.equal(new Set(o.kolommen).size, 3, 'dubbele kolom');
  o.rijen.forEach((r, ri) => o.kolommen.forEach((k, ki) => {
    const antwoord = aftrekken ? r - k : r + k;
    assert.equal(o.waarden[ri][ki], antwoord);
    assert.ok(antwoord >= 0 && antwoord <= niveau);
    if (brug !== 'beide') assert.equal(heeftBrug(r, k, aftrekken), brug === 'met');
  }));
  aantal++;
}

// Herhaalbaar toeval, plus extreme lotingen die de vaste terugvalkeuze bereiken.
let seed = 20260922;
for (const [random, herhalingen] of [[() => ((seed = (1664525 * seed + 1013904223) >>> 0) / 2 ** 32), 100], [() => 0, 2], [() => 0.999999, 2]]) {
  context.Math.random = random;
  for (const niveau of [20, 100, 1000]) {
    for (const brug of ['zonder', 'met', 'beide']) {
      for (const keuze of ['optellen', 'aftrekken', 'gemengd']) {
        for (let i = 0; i < herhalingen; i++) controleer(niveau, brug, keuze, i);
      }
    }
  }
}
console.log(`${aantal} rekenroosters gecontroleerd: unieke rijen/kolommen, bewerking, bereik en brug.`);
