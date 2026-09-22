const assert = require('node:assert/strict');
const { pool, choices } = require('./math.js');
let checked = 0;
for (const operation of ['split', 'add', 'sub', 'mix', 'mul', 'div', 'tables']) {
  for (const range of [10, 20]) for (const bridge of ['without', 'with', 'mixed']) {
    const questions = pool({ operation, range, bridge, tables: [2, 5, 9] });
    assert.ok(questions.length > 0);
    for (const q of questions) {
      if (q.op === 'split') { assert.equal(q.answer + q.part, +q.text); assert.ok(+q.text <= range); }
      else {
        const [a, symbol, b] = q.text.split(' '); const x = +a, y = +b;
        assert.equal(q.answer, symbol === '+' ? x + y : symbol === '−' ? x - y : symbol === '×' ? x * y : x / y);
        if (q.op === 'add' || q.op === 'sub') {
          assert.ok(q.answer >= 0 && q.answer <= range && x <= range && y <= range);
          const cross = q.op === 'add' ? x < 10 && y < 10 && q.answer > 10 : x > 10 && x < 20 && y < 10 && q.answer < 10;
          if (range === 20 && bridge !== 'mixed') assert.equal(cross, bridge === 'with', q.text);
        } else assert.ok([2, 5, 9].includes(y));
      }
      for (let repeat = 0; repeat < 5; repeat++) {
        const values = choices(q); assert.equal(values.length, 4); assert.equal(new Set(values).size, 4); assert.ok(values.includes(q.answer)); assert.ok(values.every(n => Number.isInteger(n) && n >= 0 && n <= q.max));
      }
      checked++;
    }
  }
}
const withBridge = op => pool({ operation: op, range: 20, bridge: 'with', tables: [] });
assert.ok(withBridge('add').some(q => q.text === '8 + 5'));
assert.ok(withBridge('sub').some(q => q.text === '14 − 6'));
assert.ok(!withBridge('add').some(q => q.text === '8 + 2'));
assert.ok(!withBridge('sub').some(q => q.text === '10 − 6'));
console.log(`${checked} oefeningen gecontroleerd: bewerkingen, bereik, brugkeuze, tafelkeuze en antwoordknoppen correct.`);
const { pick, key } = require('./math.js');
let turns = 0;
for (const operation of ['split', 'add', 'sub', 'mix', 'mul', 'div', 'tables']) {
  for (const range of [10, 20]) for (const bridge of ['without', 'with', 'mixed']) {
    // One selected table is the smallest permitted table pool.
    const questions = pool({ operation, range, bridge, tables: [1] });
    const active = Array(4).fill(null);
    for (let turn = 0; turn < 300; turn++) {
      const i = turn < 4 ? turn : Math.floor(Math.random() * 4);
      const before = active[i];
      active[i] = pick(questions, active.filter((q, j) => j !== i), before);
      const keys = active.filter(Boolean).map(key);
      assert.equal(new Set(keys).size, keys.length);
      if (before) assert.notEqual(key(before), key(active[i]));
      turns++;
    }
  }
}
assert.equal(key({op:'add',text:'3 + 5'}),key({op:'add',text:'5 + 3'}));
console.log(`${turns} teamwissels gecontroleerd: vier teams houden steeds verschillende oefeningen.`);
let pointCount = 0;
for (const operation of ['gap-add','gap-sub','gap-mix','ten-add','ten-sub','ten-mix']) {
  for (const range of [10,20]) for (const bridge of ['without','with','mixed']) for (const gapPosition of ['first','second','mixed']) {
    const questions = pool({operation,range,bridge,gapPosition,tables:[]});
    assert.ok(questions.length >= 5);
    for (const q of questions) {
      const [a,sign,b,equal,total] = q.text.replace('…',q.answer).split(' ');
      assert.equal(equal,'='); assert.equal(sign === '+' ? +a + +b : +a - +b,+total);
      assert.equal(q.text.split('…').length,2);
      assert.ok(q.answer >= 0 && q.answer <= q.max);
      assert.ok(choices(q).includes(q.answer));
      if (operation.startsWith('ten-')) { assert.equal(+total,10); assert.ok(+a <= 20); assert.equal(q.text.split(' ')[2],'…'); }
      else {
        assert.ok([+a,+b,+total].every(n=>n>=0 && n<=range));
        if (gapPosition !== 'mixed') assert.equal(q.text.split(' ')[gapPosition === 'first' ? 0 : 2],'…');
        const crossing = sign === '+' ? +a < 10 && +b < 10 && +total > 10 : +a > 10 && +a < 20 && +b < 10 && +total < 10;
        if (range === 20 && bridge !== 'mixed') assert.equal(crossing,bridge === 'with');
      }
      pointCount++;
    }
    const active = Array(4).fill(null);
    for (let turn=0;turn<40;turn++) { const i=turn%4; active[i]=pick(questions,active.filter((q,j)=>j!==i),active[i]); const keys=active.filter(Boolean).map(key); assert.equal(new Set(keys).size,keys.length); }
  }
}
const points = pool({operation:'gap-mix',range:10,bridge:'mixed',tables:[]});
for (const text of ['8 + … = 10','… + 5 = 9','… − 4 = 5','9 − … = 5']) assert.ok(points.some(q=>q.text===text),text);
const tens=pool({operation:'ten-mix',range:10,bridge:'with',tables:[]});
assert.ok(tens.some(q=>q.text==='17 − … = 10' && q.answer===7));
assert.ok(tens.some(q=>q.text==='8 + … = 10' && q.answer===2));
console.log(`${pointCount} puntoefeningen gecontroleerd, inclusief ontbrekende termen, brugkeuze, tot 10 aanvullen/wegnemen en vier verschillende teams.`);
