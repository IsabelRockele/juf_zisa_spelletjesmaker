(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const key = 'wiskanjers-tafelstart-v1';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(key)) || {}; } catch (_) {}
  const validFact = f => f && Number.isInteger(f.t) && f.t >= 1 && f.t <= 10 && Number.isInteger(f.n) && f.n >= 0 && f.n <= 10 && ['mul', 'div'].includes(f.op);
  let difficult = Array.isArray(saved.difficult) ? saved.difficult.filter(validFact).slice(-100) : [];
  const initialTables = Array.isArray(saved.tables) ? saved.tables : [2];
  for (let t = 1; t <= 10; t++) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox'; input.name = 'table'; input.value = t; input.checked = initialTables.includes(t);
    label.append(input, document.createTextNode(String(t))); $('tables').append(label);
  }
  if (['mul', 'div', 'mix'].includes(saved.operation)) document.querySelector(`input[value="${saved.operation}"]`).checked = true;
  let tables, operation, queue = [], index = 0, sessionHard = [], revealed = false;
  let reciteIndex = 0, answersHidden = false;
  function readSettings() {
    tables = [...document.querySelectorAll('input[name="table"]:checked')].map(input => Number(input.value));
    operation = document.querySelector('input[name="operation"]:checked').value;
    $('error').textContent = tables.length ? '' : 'Kies minstens één tafel.';
    return tables.length > 0;
  }
  function renderRecite() {
    const t = tables[reciteIndex];
    $('recite-title').textContent = `De tafel van ${t} · ${reciteIndex + 1} van ${tables.length}`;
    $('recite-rows').replaceChildren();
    const ops = operation === 'mix' ? ['mul', 'div'] : [operation];
    for (const op of ops) {
      const column = document.createElement('div');
      for (let n = 0; n <= 10; n++) {
        const row = document.createElement('div');
        row.textContent = op === 'mul' ? `${n} × ${t} = ${answersHidden ? '?' : n * t}` : `${n * t} : ${t} = ${answersHidden ? '?' : n}`;
        column.appendChild(row);
      }
      $('recite-rows').appendChild(column);
    }
    $('recite-toggle').textContent = answersHidden ? 'Toon de antwoorden' : 'Verberg de antwoorden';
    $('recite-toggle').setAttribute('aria-pressed', String(answersHidden));
    $('recite-next').hidden = reciteIndex === tables.length - 1;
  }
  $('recite-start').addEventListener('click', () => {
    if (!readSettings()) return;
    persist(); reciteIndex = 0; answersHidden = false;
    $('setup').hidden = true; $('recite').hidden = false; renderRecite();
  });
  $('recite-toggle').addEventListener('click', () => { answersHidden = !answersHidden; renderRecite(); });
  $('recite-next').addEventListener('click', () => { reciteIndex++; answersHidden = false; renderRecite(); });
  $('recite-back').addEventListener('click', () => { $('recite').hidden = true; setup(); });
  $('recite-practice').addEventListener('click', () => $('settings').requestSubmit());
  const id = f => `${f.t}:${f.n}:${f.op}`;
  const shuffle = list => {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
    return copy;
  };
  const eligible = f => tables.includes(f.t) && (operation === 'mix' || f.op === operation);
  function persist() {
    try { localStorage.setItem(key, JSON.stringify({ tables, operation, difficult })); } catch (_) {}
  }
  function setup() {
    $('practice').hidden = true; $('finished').hidden = true; $('setup').hidden = false;
    $('saved-info').textContent = difficult.length ? `${difficult.length} moeilijke sommen bewaard. Passende sommen komen bij een volgende tafelstart opnieuw aan bod.` : 'Er zijn nog geen moeilijke sommen bewaard.';
  }
  function draw() {
    const f = queue[index]; revealed = false;
    $('phase').textContent = index < 3 ? '1 · Opwarmen' : index < 11 ? '2 · Door elkaar' : '3 · Nog eens';
    $('progress').textContent = `Som ${index + 1} van ${index < 11 ? 14 : queue.length}`;
    $('meter').max = index < 11 ? 14 : queue.length; $('meter').value = index;
    $('sum').textContent = f.op === 'mul' ? `${f.n} × ${f.t} = ?` : `${f.n * f.t} : ${f.t} = ?`;
    $('answer').textContent = '\u00a0'; $('reveal').hidden = false; $('assessment').hidden = true;
    $('instruction').textContent = index < 11 ? 'Denk zelf. Schrijf. Toon samen.' : 'Deze proberen we opnieuw. Weet je het al vlotter?';
  }
  $('settings').addEventListener('submit', event => {
    event.preventDefault();
    if (!readSettings()) return;
    $('recite').hidden = true;
    $('error').textContent = ''; persist();
    const pool = tables.flatMap(t => Array.from({ length: 11 }, (_, i) => i).flatMap(n => (operation === 'mix' ? ['mul', 'div'] : [operation]).map(op => ({ t, n, op }))));
    const warm = shuffle(pool.filter(f => [0, 1, 2, 5, 10].includes(f.n))).slice(0, 3);
    const prior = shuffle(difficult.filter(eligible)).slice(0, 3);
    const middle = [...prior];
    const rest = shuffle(pool.filter(f => !middle.some(m => id(m) === id(f)) && !warm.some(w => id(w) === id(f))));
    // Fill any remaining slots when saved facts overlap with the warm-up.
    middle.push(...rest.slice(0, 8 - middle.length));
    while (middle.length < 8) middle.push(...shuffle(pool).slice(0, 8 - middle.length));
    queue = [...warm, ...shuffle(middle)]; index = 0; sessionHard = [];
    $('setup').hidden = true; $('finished').hidden = true; $('practice').hidden = false; draw();
  });
  $('reveal').addEventListener('click', () => {
    revealed = true; const f = queue[index];
    $('answer').textContent = String(f.op === 'mul' ? f.n * f.t : f.n);
    $('reveal').hidden = true; $('assessment').hidden = false; $('next').focus();
  });
  function advance(hard) {
    if (!revealed) return;
    const f = queue[index];
    if (hard) {
      if (!sessionHard.some(s => id(s) === id(f))) sessionHard.push(f);
      if (!difficult.some(s => id(s) === id(f))) difficult.push(f);
      difficult = difficult.slice(-100);
    } else {
      difficult = difficult.filter(s => id(s) !== id(f));
    }
    persist(); index++;
    if (index === 11) {
      const repeat = shuffle(sessionHard).slice(0, 3);
      queue.push(...(repeat.length ? repeat : shuffle(queue).slice(0, 3)));
    }
    if (index >= queue.length) {
      $('practice').hidden = true; $('finished').hidden = false;
      $('recap').textContent = `${queue.length} sommen samen geoefend. ${difficult.filter(eligible).length} sommen uit deze tafels staan klaar om later opnieuw te oefenen.`;
      $('restart').focus();
    } else { draw(); $('reveal').focus(); }
  }
  $('hard').addEventListener('click', () => advance(true));
  $('next').addEventListener('click', () => advance(false));
  $('stop').addEventListener('click', setup); $('restart').addEventListener('click', setup);
  setup();
})();
