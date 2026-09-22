(function (root) {
  function pool({ operation, range, bridge, tables, gapPosition = 'mixed' }) {
    const result = [];
    if (operation.startsWith('gap-')) {
      const base = pool({ operation: operation.slice(4), range, bridge, tables });
      for (const q of base) {
        const [a, symbol, b] = q.text.split(' ');
        for (const position of gapPosition === 'mixed' ? ['first', 'second'] : [gapPosition]) {
          result.push({ op: `gap-${q.op}`, text: `${position === 'first' ? '…' : a} ${symbol} ${position === 'second' ? '…' : b} = ${q.answer}`, answer: +(position === 'first' ? a : b), max: range, equation: true });
        }
      }
      return result;
    }
    if (operation.startsWith('ten-')) {
      if (operation !== 'ten-sub') for (let a = 0; a < 10; a++) result.push({ op: 'gap-add', text: `${a} + … = 10`, answer: 10 - a, max: 10, equation: true });
      if (operation !== 'ten-add') for (let a = 11; a <= 20; a++) result.push({ op: 'gap-sub', text: `${a} − … = 10`, answer: a - 10, max: 10, equation: true });
      return result;
    }
    const ops = operation === 'mix' ? ['add', 'sub'] : operation === 'tables' ? ['mul', 'div'] : [operation];
    for (const op of ops) {
      if (op === 'mul' || op === 'div') {
        for (const t of tables) for (let n = 1; n <= 10; n++) result.push({ text: op === 'mul' ? `${n} × ${t}` : `${n * t} : ${t}`, answer: op === 'mul' ? n * t : n, max: op === 'mul' ? 100 : 10, op });
      } else if (op === 'split') {
        for (let total = 2; total <= range; total++) for (let part = 0; part <= total; part++) result.push({ text: `${total}`, part, answer: total - part, max: range, op });
      } else {
        for (let a = 1; a <= range; a++) for (let b = 1; b <= range; b++) {
          const answer = op === 'add' ? a + b : a - b;
          if (answer < 0 || answer > range) continue;
          const crosses = op === 'add' ? a % 10 + b % 10 > 10 : a % 10 < b % 10 && a % 10 !== 0;
          if (range > 10 && bridge !== 'mixed' && crosses !== (bridge === 'with')) continue;
          result.push({ text: `${a} ${op === 'add' ? '+' : '−'} ${b}`, answer, max: range, op });
        }
      }
    }
    return result;
  }
  function shuffle(values) { const a = [...values]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function choices(q) {
    const values = new Set([q.answer]);
    for (const d of shuffle([-10, -2, -1, 1, 2, 10])) if (values.size < 4 && q.answer + d >= 0 && q.answer + d <= q.max) values.add(q.answer + d);
    for (let n = 0; values.size < 4; n++) values.add(n);
    return shuffle(values);
  }
  function key(q) {
    if (q.op === 'split') return `split:${q.text}:${q.part}`;
    if (q.op === 'gap-add') { const parts = q.text.split(' '); return `gap-add:${parts[0] === '…' ? parts[2] : parts[0]}:${parts[4]}`; }
    if (q.equation) return `${q.op}:${q.text}`;
    const [a, , b] = q.text.split(' ');
    return ['add', 'mul'].includes(q.op) ? `${q.op}:${[+a, +b].sort((x, y) => x - y).join(':')}` : `${q.op}:${q.text}`;
  }
  function pick(questions, active = [], previous = null) {
    const blocked = new Set(active.filter(Boolean).map(key));
    if (previous) blocked.add(key(previous));
    const available = questions.filter(q => !blocked.has(key(q)));
    if (!available.length) throw new Error('Te weinig verschillende oefeningen voor de teams.');
    return available[Math.floor(Math.random() * available.length)];
  }
  root.DragonMath = { pool, shuffle, choices, key, pick };
  if (typeof module !== 'undefined') module.exports = root.DragonMath;
})(globalThis);
