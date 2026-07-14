// @ts-nocheck
(function(){
  const $ = sel => document.querySelector(sel);
  const sheet = $('#sheet');
  const titles = new Set();
  const addFns = {};
  const usedExerciseSignatures = new Set();
  const PLACE = [
    { key: 'd', label: 'D', color: 'gi4-d', value: 1000 },
    { key: 'h', label: 'H', color: 'gi4-h', value: 100 },
    { key: 't', label: 'T', color: 'gi4-t', value: 10 },
    { key: 'e', label: 'E', color: 'gi4-e', value: 1 },
  ];

  function rnd(min, max){ return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(arr){ return arr[rnd(0, arr.length - 1)]; }
  const AXIS_END_PCT = 96;
  const axisPct = (value, max) => (value / max) * AXIS_END_PCT;
  function signaturePart(value){
    if (Array.isArray(value)) return `[${value.map(signaturePart).join(',')}]`;
    if (value && typeof value === 'object') {
      return `{${Object.keys(value).sort().map(key => `${key}:${signaturePart(value[key])}`).join('|')}}`;
    }
    return String(value);
  }
  function rememberExercise(namespace, value){
    const key = `${namespace}::${signaturePart(value)}`;
    if (usedExerciseSignatures.has(key)) return false;
    usedExerciseSignatures.add(key);
    return true;
  }
  function pickUnused(namespace, items, keyFn = item => item){
    const shuffled = [...items].sort(() => Math.random() - .5);
    for (const item of shuffled) {
      if (rememberExercise(namespace, keyFn(item))) return item;
    }
    return null;
  }
  function makeUnique(namespace, factory, attempts = 80){
    for (let attempt = 0; attempt < attempts; attempt++) {
      const value = factory();
      if (rememberExercise(namespace, value)) return value;
    }
    return null;
  }
  function appendNewExercise(container, maker){
    const exercise = maker();
    if (!exercise) return false;
    container.appendChild(exercise);
    return true;
  }
  function fmt(n){ return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function digits(n){
    return {
      d: Math.floor(n / 1000),
      h: Math.floor(n / 100) % 10,
      t: Math.floor(n / 10) % 10,
      e: n % 10,
    };
  }
  function numberFromDigits(ds){ return ds.d * 1000 + ds.h * 100 + ds.t * 10 + ds.e; }
  function randomNumber(){ return rnd(1000, 9999); }
  function uniqueNumbers(count){
    const set = new Set();
    let guard = 0;
    while (set.size < count && guard < count * 400) {
      guard++;
      const n = randomNumber();
      if (set.has(n)) continue;
      if (!rememberExercise('gi4_global_number', n)) continue;
      set.add(n);
    }
    return Array.from(set);
  }

  function renderSheetHeader(){
    if (sheet.querySelector('.sheetHeader')) return;
    const h = document.createElement('div');
    h.className = 'sheetHeader';
    h.style.cssText = 'text-align:center;margin:18px 0 12px 0;position:relative;';
    const title = document.createElement('h2');
    title.contentEditable = 'true';
    title.spellcheck = false;
    title.textContent = 'Extra oefenen op getalinzicht tot 10 000';
    title.style.cssText = 'display:inline-block;font-size:25px;font-weight:800;color:#1A3A5C;min-width:260px;outline:none;border-bottom:2px dashed transparent;cursor:text;padding:2px 6px;';
    title.addEventListener('focus', () => { title.style.borderBottomColor = '#4A90D9'; title.style.background = '#f0f8ff'; });
    title.addEventListener('blur', () => { title.style.borderBottomColor = 'transparent'; title.style.background = ''; });
    title.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); title.blur(); } });
    h.appendChild(title);
    const hint = document.createElement('div');
    hint.className = 'sheet-title-hint';
    hint.textContent = 'Klik op de titel om die aan te passen';
    h.appendChild(hint);
    sheet.insertBefore(h, sheet.firstChild);
  }

  function sol(text){
    const span = document.createElement('span');
    span.className = 'gi4-solution-answer';
    span.textContent = text;
    return span;
  }

  function lineWithSolution(text, cls = ''){
    const span = document.createElement('span');
    span.className = `gi4-line ${cls}`.trim();
    span.appendChild(sol(text));
    return span;
  }

  function ensureTitle(key, text, addFn){
    addFns[key] = addFn;
    if (titles.has(key)) return;
    const row = document.createElement('div');
    row.className = 'title-row';
    const inner = document.createElement('div');
    inner.className = 'title-row-inner';
    const h = document.createElement('div');
    h.className = 'exercise-title';
    h.dataset.titleKey = key;
    h.textContent = text;
    let add = null;
    if (addFn) {
      add = document.createElement('button');
      add.type = 'button';
      add.className = 'title-add-btn';
      add.textContent = '+ oefening';
      add.addEventListener('click', () => addFns[key]?.(1));
    }
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'title-delete-btn';
    del.innerHTML = '&times;';
    del.addEventListener('click', () => {
      document.querySelectorAll(`[data-title-key="${key}"]:not(.exercise-title)`).forEach(el => el.remove());
      row.remove();
      titles.delete(key);
    });
    if (add) inner.append(h, add, del);
    else inner.append(h, del);
    row.appendChild(inner);
    sheet.appendChild(row);
    titles.add(key);
  }

  function placeBlock(block, key){
    const all = sheet.querySelectorAll(`[data-title-key="${key}"]:not(.exercise-title)`);
    if (all.length) all[all.length - 1].after(block);
    else document.querySelector(`.exercise-title[data-title-key="${key}"]`)?.closest('.title-row')?.after(block);
  }

  function lastBlock(key){
    const all = sheet.querySelectorAll(`[data-title-key="${key}"]:not(.exercise-title)`);
    return all.length ? all[all.length - 1] : null;
  }

  function containerInLastBlock(key, selector, className, tag = 'div'){
    const b = lastBlock(key);
    if (!b) return null;
    let container = b.querySelector(selector);
    if (!container) {
      container = document.createElement(tag);
      container.className = className;
      b.appendChild(container);
    }
    return container;
  }

  function clearNode(node){
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function delButton(target, key){
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'delete-btn';
    btn.innerHTML = '&times;';
    btn.addEventListener('click', () => {
      target.remove();
      if (!document.querySelector(`[data-title-key="${key}"]:not(.exercise-title)`)) {
        document.querySelector(`.exercise-title[data-title-key="${key}"]`)?.closest('.title-row')?.remove();
        titles.delete(key);
      }
    });
    return btn;
  }

  function removeTitleIfEmpty(key){
    if (document.querySelector(`[data-title-key="${key}"]:not(.exercise-title)`)) return;
    document.querySelector(`.exercise-title[data-title-key="${key}"]`)?.closest('.title-row')?.remove();
    titles.delete(key);
  }

  function cleanupEmptyExerciseBlock(blockEl){
    if (!blockEl?.classList?.contains('gi4-block')) return;
    const key = blockEl.dataset.titleKey;
    if (!key) return;
    if (blockEl.querySelector('.row-delete-wrap')) return;
    blockEl.remove();
    removeTitleIfEmpty(key);
  }

  function rowDel(target){
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'row-delete-btn';
    btn.innerHTML = '&times;';
    const removeTarget = e => {
      e.preventDefault();
      e.stopPropagation();
      const blockEl = target.closest('.gi4-block');
      const parent = target.parentElement;
      target.remove();
      if (parent && !parent.querySelector(':scope > *:not(.row-delete-btn)')) parent.remove();
      cleanupEmptyExerciseBlock(blockEl);
    };
    btn.addEventListener('pointerdown', e => {
      e.preventDefault();
      e.stopPropagation();
    });
    btn.addEventListener('click', removeTarget);
    return btn;
  }

  function block(key, title, addFn, blockTitle){
    ensureTitle(key, title, addFn);
    const b = document.createElement('div');
    b.className = 'gi4-block';
    b.dataset.titleKey = key;
    if (blockTitle) {
      const t = document.createElement('div');
      t.className = 'gi4-block-title';
      t.textContent = blockTitle;
      b.appendChild(t);
    }
    placeBlock(b, key);
    return b;
  }

  function addLocalExerciseButton(blockEl, label, addFn){
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'title-add-btn gi4-local-add-btn';
    btn.textContent = label || '+ oefening bij deze keuze';
    btn.addEventListener('click', () => addFn?.(1));
    blockEl.appendChild(btn);
    return btn;
  }

  function makeSplitRow(n, example){
    const ds = digits(n);
    const row = document.createElement('div');
    row.className = 'gi4-row row-delete-wrap';
    row.appendChild(rowDel(row));
    if (example) {
      row.innerHTML += `<strong>${fmt(n)}</strong> = ${ds.d} D + ${ds.h} H + ${ds.t} T + ${ds.e} E`;
    } else {
      const strong = document.createElement('strong');
      strong.textContent = fmt(n);
      row.append(strong, ' = ', lineWithSolution(String(ds.d)), ' D + ', lineWithSolution(String(ds.h)), ' H + ', lineWithSolution(String(ds.t)), ' T + ', lineWithSolution(String(ds.e)), ' E');
    }
    return row;
  }

  function addSplit(extraCount){
    const key = 'gi4_split';
    const count = extraCount || Math.max(1, parseInt($('#splitCount').value, 10) || 6);
    const withExample = !extraCount && $('#splitExample')?.checked;
    const b = block(key, 'Splits de getallen in duizendtallen, honderdtallen, tientallen en eenheden.', addSplit);
    const grid = document.createElement('div');
    grid.className = 'gi4-grid';
    uniqueNumbers(count).forEach((n, i) => grid.appendChild(makeSplitRow(n, withExample && i === 0)));
    b.appendChild(grid);
  }

  function previousMultiple(n, base){ return Math.floor(n / base) * base; }
  function nextMultiple(n, base){ return Math.ceil(n / base) * base; }

  function makeNeighborTable(kind, rows, example){
    const base = kind === 'number' ? 1 : kind === 'ten' ? 10 : kind === 'hundred' ? 100 : 1000;
    const labels = {
      number: ['vorig getal', 'volgend getal', 'gi4-neighbor-yellow'],
      ten: ['vorig tiental', 'volgend tiental', 'gi4-neighbor-green'],
      hundred: ['vorig honderdtal', 'volgend honderdtal', 'gi4-neighbor-blue'],
      thousand: ['vorig duizendtal', 'volgend duizendtal', 'gi4-neighbor-red'],
    }[kind];
    const table = document.createElement('table');
    table.className = 'gi4-neighbor-table';
    table.innerHTML = `<thead><tr><th class="${labels[2]}">${labels[0]}</th><th></th><th class="${labels[2]}">${labels[1]}</th></tr></thead>`;
    const body = document.createElement('tbody');
    rows.forEach((n, i) => {
      const tr = document.createElement('tr');
      const prev = kind === 'number' ? n - 1 : previousMultiple(n, base);
      const next = kind === 'number' ? n + 1 : nextMultiple(n + 1, base);
      const filled = example && i === 0;
      const left = document.createElement('td');
      const middle = document.createElement('td');
      const right = document.createElement('td');
      if (filled) left.textContent = fmt(prev);
      else left.appendChild(lineWithSolution(fmt(prev), 'long'));
      middle.textContent = fmt(n);
      if (filled) right.textContent = fmt(next);
      else right.appendChild(lineWithSolution(fmt(next), 'long'));
      tr.append(left, middle, right);
      if (filled) tr.classList.add('example');
      body.appendChild(tr);
    });
    table.appendChild(body);
    return table;
  }

  function addNeighbors(extraCount){
    const key = 'gi4_neighbors';
    const rows = extraCount || Math.max(2, parseInt($('#neighborRows').value, 10) || 3);
    const nums = uniqueNumbers(rows);
    const b = block(key, 'Schrijf de buurgetallen, buurtientallen, buurhonderdtallen of buurtduizendtallen.', addNeighbors);
    const grid = document.createElement('div');
    grid.className = 'gi4-neighbor-grid';
    ['number', 'ten', 'hundred', 'thousand'].forEach(kind => grid.appendChild(makeNeighborTable(kind, nums, !extraCount)));
    b.appendChild(grid);
  }

  function placeTable(n, mode, opts = {}){
    const ds = digits(n);
    const table = document.createElement('table');
    table.className = 'gi4-place-table';
    if (opts.compact) table.classList.add('compact');
    if (opts.connect) table.classList.add('connect');
    table.innerHTML = '<thead><tr>' + PLACE.map(p => `<th class="${p.color}">${p.label}</th>`).join('') + '</tr></thead>';
    const tr = document.createElement('tr');
    PLACE.forEach(p => {
      const td = document.createElement('td');
      const wrap = document.createElement('div');
      wrap.className = 'gi4-material';
      if (opts.compact) wrap.classList.add('compact');
      if (opts.connect) wrap.classList.add('connect');
      const amount = ds[p.key];
      const shape = mode === 'dots' ? 'dot' : p.key;
      for (let i = 0; i < amount; i++) wrap.appendChild(materialPiece(shape, p.key, opts));
      td.appendChild(wrap);
      tr.appendChild(td);
    });
    const body = document.createElement('tbody');
    body.appendChild(tr);
    table.appendChild(body);
    return table;
  }

  function materialPiece(shape, key, opts = {}){
    if (shape === 'dot') {
      const span = document.createElement('span');
      span.className = `gi4-dot ${key === 'd' ? 'gi4-d' : key === 'h' ? 'gi4-h' : key === 't' ? 'gi4-t' : 'gi4-e'}`;
      if (opts.connect) span.classList.add('connect');
      span.textContent = key === 'd' ? '1000' : key === 'h' ? '100' : key === 't' ? '10' : '1';
      return span;
    }
    return makeMaterialSvg(key, opts);
  }

  function makeMaterialSvg(kind, opts = {}){
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('gi4-material-svg', `gi4-${kind}-piece`);
    const compact = !!opts.compact;
    const connect = !!opts.connect;
    const color = kind === 'd' ? '#ef2b2d' : kind === 'h' ? '#1976ad' : '#6ecf57';
    const stroke = kind === 'd' ? '#b91c1c' : kind === 'h' ? '#0f5f90' : '#29963c';

    if (kind === 't') {
      svg.setAttribute('width', connect ? '14' : compact ? '18' : '22');
      svg.setAttribute('height', connect ? '58' : compact ? '76' : '84');
      svg.setAttribute('viewBox', '0 0 22 84');
      svg.appendChild(svgRect(5, 4, 12, 76, '#6ecf57', '#257e31'));
      for (let y = 11.6; y < 80; y += 7.6) svg.appendChild(svgLine(5, y, 17, y, '#257e31', 1));
      return svg;
    }

    if (kind === 'd') {
      svg.setAttribute('width', connect ? '34' : compact ? '36' : '46');
      svg.setAttribute('height', connect ? '31' : compact ? '34' : '42');
      svg.setAttribute('viewBox', '0 0 46 42');

      const frontX = 4, frontY = 10, frontW = 30, frontH = 28;
      const depthX = 8, depthY = -7;
      const red = '#ef2b2d';
      const redTop = '#ff4b50';
      const redSide = '#c91f2a';
      const redLine = '#8f171d';

      svg.appendChild(svgPolygon(
        `${frontX},${frontY} ${frontX + depthX},${frontY + depthY} ${frontX + frontW + depthX},${frontY + depthY} ${frontX + frontW},${frontY}`,
        redTop,
        stroke
      ));
      svg.appendChild(svgPolygon(
        `${frontX + frontW},${frontY} ${frontX + frontW + depthX},${frontY + depthY} ${frontX + frontW + depthX},${frontY + frontH + depthY} ${frontX + frontW},${frontY + frontH}`,
        redSide,
        stroke
      ));
      svg.appendChild(svgRect(frontX, frontY, frontW, frontH, red, stroke));

      for (let i = 1; i < 10; i++) {
        const x = frontX + i * (frontW / 10);
        const y = frontY + i * (frontH / 10);
        svg.appendChild(svgLine(x, frontY, x, frontY + frontH, redLine, .45));
        svg.appendChild(svgLine(frontX, y, frontX + frontW, y, redLine, .45));

        const topX = frontX + i * (frontW / 10);
        svg.appendChild(svgLine(topX, frontY, topX + depthX, frontY + depthY, redLine, .35));
        const sideY = frontY + i * (frontH / 10);
        svg.appendChild(svgLine(frontX + frontW, sideY, frontX + frontW + depthX, sideY + depthY, redLine, .35));
      }
      for (let i = 1; i < 5; i++) {
        const x = frontX + depthX * (i / 5);
        const y = frontY + depthY * (i / 5);
        svg.appendChild(svgLine(x, y, x + frontW, y, redLine, .35));
        svg.appendChild(svgLine(frontX + frontW + x - frontX, y, frontX + frontW + x - frontX, y + frontH, redLine, .35));
      }
      return svg;
    }

    if (kind === 'h') {
      svg.setAttribute('width', connect ? '34' : compact ? '46' : '54');
      svg.setAttribute('height', connect ? '34' : compact ? '46' : '54');
      svg.setAttribute('viewBox', '0 0 54 54');
      svg.appendChild(svgRect(3, 3, 48, 48, '#1976ad', '#0f5f90'));
      for (let i = 1; i < 10; i++) {
        const p = 3 + i * 4.8;
        svg.appendChild(svgLine(p, 3, p, 51, '#083f61', .65));
        svg.appendChild(svgLine(3, p, 51, p, '#083f61', .65));
      }
      return svg;
    }

    svg.setAttribute('width', connect ? '22' : compact ? '25' : '29');
    svg.setAttribute('height', connect ? '22' : compact ? '25' : '29');
    svg.setAttribute('viewBox', '0 0 32 32');
    svg.appendChild(svgPolygon('20,10 26,5 26,23 20,29', '#e7b800', '#9a6f00'));
    svg.appendChild(svgPolygon('7,10 13,5 26,5 20,10', '#ffe779', '#9a6f00'));
    svg.appendChild(svgPolygon('7,10 20.5,10 20.5,29 7,29', '#ffd51c', '#9a6f00'));
    svg.appendChild(svgLine(20.5, 10, 26, 5, '#9a6f00', 1));
    svg.appendChild(svgLine(20.5, 29, 26, 23, '#9a6f00', 1));
    return svg;
  }

  function svgRect(x, y, w, h, fill, stroke){
    const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    r.setAttribute('x', x); r.setAttribute('y', y);
    r.setAttribute('width', w); r.setAttribute('height', h);
    r.setAttribute('fill', fill); r.setAttribute('stroke', stroke);
    r.setAttribute('stroke-width', '1');
    return r;
  }

  function svgLine(x1, y1, x2, y2, stroke, width){
    const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l.setAttribute('x1', x1); l.setAttribute('y1', y1);
    l.setAttribute('x2', x2); l.setAttribute('y2', y2);
    l.setAttribute('stroke', stroke); l.setAttribute('stroke-width', String(width || 1));
    return l;
  }

  function svgPolygon(points, fill, stroke){
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    p.setAttribute('points', points);
    p.setAttribute('fill', fill);
    p.setAttribute('stroke', stroke);
    p.setAttribute('stroke-width', '1');
    p.setAttribute('stroke-linejoin', 'round');
    return p;
  }

  function svgPath(d, fill, stroke, width){
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', d);
    p.setAttribute('fill', fill || 'none');
    p.setAttribute('stroke', stroke);
    p.setAttribute('stroke-width', String(width || 1));
    p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('stroke-linejoin', 'round');
    return p;
  }

  function jumpArrowSvg(){
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('gi4-jump-arrow-svg');
    svg.setAttribute('viewBox', '0 0 80 28');
    svg.setAttribute('aria-hidden', 'true');
    svg.appendChild(svgPath('M8 20 C24 5 52 5 68 20', 'none', '#7f8794', 2));
    svg.appendChild(svgPath('M60 18 L68 20 L65 12', 'none', '#7f8794', 2));
    return svg;
  }

  function pencil(n, filled){
    const ds = digits(n);
    const p = document.createElement('div');
    p.className = 'gi4-pencil';
    PLACE.forEach(part => {
      const span = document.createElement('span');
      span.className = part.color;
      if (filled) span.textContent = ds[part.key];
      else span.appendChild(sol(String(ds[part.key])));
      p.appendChild(span);
    });
    const tip = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    tip.classList.add('gi4-pencil-tip');
    tip.setAttribute('viewBox', '0 0 20 32');
    tip.setAttribute('aria-hidden', 'true');
    tip.appendChild(svgPolygon('1,1 19,16 1,31', '#ffd414', '#8a8f99'));
    p.appendChild(tip);
    return p;
  }

  function derangedAnswers(items){
    if (items.length < 2) return items.slice();
    const shuffled = items.slice().sort(() => Math.random() - .5);
    if (shuffled.every((item, i) => item !== items[i])) return shuffled;
    const offset = rnd(1, items.length - 1);
    return items.map((_, i) => items[(i + offset) % items.length]);
  }

  function addMaterial(extraCount){
    const key = 'gi4_material';
    const count = extraCount || Math.max(1, parseInt($('#materialCount').value, 10) || 4);
    const mode = $('#materialMode').value;
    const b = block(key, 'Hoeveel duizendtallen, honderdtallen, tientallen en eenheden zie je?', addMaterial);
    const grid = document.createElement('div');
    grid.className = 'gi4-material-grid';
    uniqueNumbers(count).forEach(n => {
      const card = document.createElement('div');
      card.className = 'gi4-value-card row-delete-wrap';
      card.appendChild(rowDel(card));
      card.appendChild(placeTable(n, mode === 'mixed' ? pick(['blocks', 'dots']) : mode, { compact: true }));
      const ds = digits(n);
      const row = document.createElement('div');
      row.className = 'gi4-row';
      row.append(
        lineWithSolution(String(ds.d)), ' D ',
        lineWithSolution(String(ds.h)), ' H ',
        lineWithSolution(String(ds.t)), ' T ',
        lineWithSolution(String(ds.e)), ' E'
      );
      const label = document.createElement('div');
      label.textContent = 'Dit is:';
      card.append(row, label);
      card.appendChild(pencil(n, false));
      grid.appendChild(card);
    });
    b.appendChild(grid);
  }

  function outlineDot(key){
    const span = materialPiece('dot', key, { connect: true });
    span.classList.add('outline');
    span.textContent = '';
    return span;
  }

  function completeNumber(target){
    if (target === 'thousand') {
      let n = rnd(11, 98) * 100;
      if (n % 1000 === 0) n += 100;
      return n;
    }
    let n = rnd(101, 989) * 10;
    if (n % 100 === 0) n += 10;
    return n;
  }

  function completeVisual(n, target){
    const ds = digits(n);
    const places = target === 'thousand' ? PLACE.slice(0, 2) : PLACE.slice(0, 3);
    const table = document.createElement('table');
    table.className = 'gi4-complete-table';
    table.innerHTML = '<thead><tr>' + places.map(p => `<th class="${p.color}">${p.label}</th>`).join('') + '</tr></thead>';
    const tr = document.createElement('tr');
    places.forEach(p => {
      const td = document.createElement('td');
      const wrap = document.createElement('div');
      wrap.className = 'gi4-complete-material';
      for (let i = 0; i < ds[p.key]; i++) wrap.appendChild(materialPiece('dot', p.key, { connect: true }));
      if ((target === 'thousand' && p.key === 'h') || (target === 'hundred' && p.key === 't')) {
        const missing = 10 - ds[p.key];
        for (let i = 0; i < missing; i++) wrap.appendChild(outlineDot(p.key));
      }
      td.appendChild(wrap);
      tr.appendChild(td);
    });
    const body = document.createElement('tbody');
    body.appendChild(tr);
    table.appendChild(body);
    return table;
  }

  function makeCompleteCard(n, target, example){
    const base = target === 'thousand' ? 1000 : 100;
    const targetNum = nextMultiple(n, base);
    const add = targetNum - n;
    const card = document.createElement('div');
    card.className = `gi4-complete-card row-delete-wrap${example ? ' example' : ''}`;
    card.appendChild(rowDel(card));
    card.appendChild(completeVisual(n, target));
    const lines = document.createElement('div');
    lines.className = 'gi4-complete-lines';
    if (example) {
      lines.innerHTML = `<p>Dit is <strong>${fmt(n)}</strong>.</p><p>Ik vul aan tot <strong>${fmt(targetNum)}</strong>.</p><p>Dat is <strong>${fmt(add)}</strong> erbij.</p>`;
    } else {
      const p1 = document.createElement('p');
      p1.append('Dit is ', lineWithSolution(fmt(n), 'long'), '.');
      const p2 = document.createElement('p');
      p2.append('Ik vul aan tot ', lineWithSolution(fmt(targetNum), 'long'), '.');
      const p3 = document.createElement('p');
      p3.append('Dat is ', lineWithSolution(fmt(add)), ' erbij.');
      lines.append(p1, p2, p3);
    }
    card.appendChild(lines);
    return card;
  }

  function addComplete(extraCount, forcedTarget){
    const target = forcedTarget || $('#completeTarget')?.value || 'hundred';
    const key = target === 'thousand' ? 'gi4_complete_thousand' : 'gi4_complete_hundred';
    const count = extraCount || Math.max(1, parseInt($('#completeCount').value, 10) || 4);
    const example = !extraCount && $('#completeExample')?.checked;
    const title = target === 'thousand'
      ? 'Schrijf het getal. Teken bij tot het volgende duizendtal. Vul in.'
      : 'Schrijf het getal. Kleur bij tot het volgende honderdtal. Vul in.';
    const b = block(key, title, addCount => addComplete(addCount || 1, target));
    const grid = document.createElement('div');
    grid.className = 'gi4-grid two';
    for (let i = 0; i < count; i++) {
      const n = makeUnique(`gi4_complete_${target}`, () => completeNumber(target));
      if (n) grid.appendChild(makeCompleteCard(n, target, example && i === 0));
    }
    b.appendChild(grid);
  }

  function connectDotsCard(n){
    const ds = digits(n);
    const card = document.createElement('div');
    card.className = 'gi4-connect-dot-card';
    PLACE.forEach(p => {
      const group = document.createElement('div');
      group.className = 'gi4-connect-dot-group';
      for (let i = 0; i < ds[p.key]; i++) group.appendChild(materialPiece('dot', p.key, { connect: true }));
      card.appendChild(group);
    });
    return card;
  }

  function makeConnectRow(n, answerNumber, mode){
    const row = document.createElement('div');
    row.className = `gi4-connect-row row-delete-wrap ${mode === 'dots' ? 'dots' : 'blocks'}`;
    row.dataset.number = String(n);
    row.dataset.answer = String(answerNumber);
    row.appendChild(rowDel(row));

    const card = document.createElement('div');
    card.className = 'gi4-connect-card';
    if (mode === 'dots') card.appendChild(connectDotsCard(n));
    else card.appendChild(placeTable(n, 'blocks', { compact: true, connect: true }));

    const lineSpace = document.createElement('div');
    lineSpace.className = 'gi4-connect-space';
    const leftDot = document.createElement('span');
    leftDot.className = 'gi4-connect-dot left';
    const rightDot = document.createElement('span');
    rightDot.className = 'gi4-connect-dot right';
    lineSpace.append(leftDot, rightDot);

    const answer = document.createElement('div');
    answer.className = 'gi4-connect-answer';
    if (mode === 'dots') {
      const number = document.createElement('span');
      number.className = 'gi4-connect-answer-number';
      number.textContent = fmt(answerNumber);
      number.dataset.number = String(answerNumber);
      answer.append(number);
    } else {
      answer.append(pencil(answerNumber, true));
    }

    row.append(card, lineSpace, answer);
    return row;
  }

  function renderConnectRows(wrap, nums, mode){
    clearNode(wrap);
    const answers = derangedAnswers(nums);
    wrap.dataset.mode = mode;
    nums.forEach((n, i) => wrap.appendChild(makeConnectRow(n, answers[i], mode)));
  }

  function addConnect(extraCount){
    const key = 'gi4_connect';
    if (extraCount) {
      const existing = lastBlock(key);
      const wrap = existing?.querySelector('.gi4-connect-list');
      if (wrap) {
        const mode = wrap.dataset.mode || 'blocks';
        const nums = Array.from(wrap.querySelectorAll('.gi4-connect-row'))
          .map(row => parseInt(row.dataset.number, 10))
          .filter(Number.isFinite);
        const n = uniqueNumbers(1)[0];
        if (n && !nums.includes(n)) nums.push(n);
        renderConnectRows(wrap, nums, mode);
        return;
      }
    }
    const mode = $('#connectMode')?.value || 'blocks';
    const maxCount = mode === 'dots' ? 5 : 4;
    const count = extraCount || Math.min(maxCount, Math.max(3, parseInt($('#connectCount').value, 10) || 4));
    const nums = uniqueNumbers(count);
    const title = mode === 'dots' ? 'Verbind de getalbeelden met het juiste getal.' : 'Verbind wat samen hoort.';
    const b = block(key, title, addConnect);
    const wrap = document.createElement('div');
    wrap.className = `gi4-connect-list ${mode === 'dots' ? 'dots' : 'blocks'}`;
    renderConnectRows(wrap, nums, mode);
    b.appendChild(wrap);
  }

  function addAxis(extraCount){
    const key = 'gi4_axis';
    const count = extraCount || Math.max(1, parseInt($('#axisCount').value, 10) || 3);
    const step = Math.max(1, parseInt($('#axisStep').value, 10) || 100);
    const b = block(key, 'Vul de getallenassen aan.', addAxis);
    const wrap = document.createElement('div');
    wrap.className = 'gi4-axis';
    for (let r = 0; r < count; r++) {
      const item = makeUnique('gi4_axis_row', () => ({ step, start: Math.floor(rnd(1000, 9000) / step) * step }));
      if (!item) continue;
      const { start } = item;
      const row = document.createElement('div');
      row.className = 'gi4-axis-row row-delete-wrap';
      row.appendChild(rowDel(row));
      row.appendChild(Object.assign(document.createElement('div'), { className: 'gi4-axis-line' }));
      for (let i = 0; i < 7; i++) {
        const left = 7 + i * 14;
        const tick = document.createElement('span');
        tick.className = 'gi4-tick';
        tick.style.left = `${left}%`;
        row.appendChild(tick);
        const show = i === 0 || i === 2 || i === 6 || Math.random() < .25;
        const val = start + i * step;
        if (show) {
          const label = document.createElement('span');
          label.className = 'gi4-tick-label';
          label.style.left = `${left}%`;
          label.textContent = fmt(val);
          row.appendChild(label);
        } else {
          const box = document.createElement('span');
          box.className = 'gi4-tick-box';
          box.style.left = `${left}%`;
          box.appendChild(sol(fmt(val)));
          row.appendChild(box);
        }
      }
      wrap.appendChild(row);
    }
    b.appendChild(wrap);
  }

  function makeAxisConnectRow(fine){
    const item = makeUnique('gi4_axis_connect_row', () => ({ fine, start: fine ? rnd(60, 90) * 100 : rnd(45, 80) * 100 }));
    if (!item) return null;
    const { start } = item;
    const unit = fine ? 10 : 100;
    const range = fine ? 500 : 2000;
    const end = start + range;
    const labels = fine
      ? [start, start + 50, start + 150, start + 250, start + 350, end]
      : [start, start + 500, start + 1000, start + 1500, end];
    const answers = fine
      ? [start + 40, start + 90, start + 180, start + 260, start + 330]
      : [start + 300, start + 900, start + 1100, start + 1400, start + 1800];
    const row = document.createElement('div');
    row.className = 'gi4-axis-connect-row row-delete-wrap';
    row.dataset.axisStart = String(start);
    row.dataset.axisRange = String(range);
    row.appendChild(rowDel(row));
    const axis = document.createElement('div');
    axis.className = 'gi4-axis-connect-axis';
    axis.appendChild(Object.assign(document.createElement('div'), { className: 'gi4-axis-connect-line' }));
    for (let v = start; v <= end; v += unit) {
      const tick = document.createElement('span');
      tick.className = labels.includes(v) ? 'major' : '';
      tick.dataset.value = String(v);
      tick.style.left = `${axisPct(v - start, range)}%`;
      axis.appendChild(tick);
    }
    labels.forEach(v => {
      const label = document.createElement('div');
      label.className = 'gi4-axis-connect-label';
      label.style.left = `${axisPct(v - start, range)}%`;
      label.textContent = fmt(v);
      axis.appendChild(label);
    });
    const cards = document.createElement('div');
    cards.className = 'gi4-axis-connect-cards';
    answers.sort(() => Math.random() - .5).forEach(v => {
      const card = document.createElement('div');
      card.className = 'gi4-axis-connect-card';
      card.dataset.value = String(v);
      card.textContent = fmt(v);
      cards.appendChild(card);
    });
    row.append(axis, cards);
    return row;
  }

  function addAxisConnect(extraCount){
    const key = 'gi4_axis_connect';
    const count = extraCount || Math.max(1, parseInt($('#axisConnectCount').value, 10) || 2);
    const b = block(key, 'Verbind de kaartjes met de juiste plaats op de getallenas.', addAxisConnect);
    const wrap = document.createElement('div');
    wrap.className = 'gi4-axis-connect';
    for (let i = 0; i < count; i++) appendNewExercise(wrap, () => makeAxisConnectRow(i % 2 === 1));
    b.appendChild(wrap);
  }

  function addJumps(extraCount, forcedMode){
    const mode = forcedMode || $('#jumpMode4')?.value || 'known';
    const forcedCount = typeof extraCount === 'number' ? extraCount : 0;
    const key = mode === 'discover' ? 'gi4_jumps_discover' : 'gi4_jumps';
    const count = forcedCount || Math.max(1, parseInt($('#jumpCount4').value, 10) || 4);
    const step = Math.max(1, parseInt($('#jumpStep4').value, 10) || 100);
    const title = mode === 'discover'
      ? 'Ontdek de sprong. Vul de ontbrekende getallen aan.'
      : `Tel met sprongen van ${fmt(step)}.`;
    const b = block(key, title, addCount => addJumps(addCount || 1, mode));
    if (mode !== 'discover') {
      const hint = document.createElement('div');
      hint.className = 'gi4-jump-step';
      hint.textContent = `Elke sprong is + ${fmt(step)}.`;
      b.appendChild(hint);
    }
    const wrap = document.createElement('div');
    wrap.className = 'gi4-jumps';
    for (let r = 0; r < count; r++) {
      const item = makeUnique('gi4_jumps_row', () => ({
        mode,
        step,
        start: rnd(1000, Math.max(1000, 9999 - step * 5)),
        visible: mode === 'discover'
          ? pick([[0, 1, 4], [0, 2, 3], [1, 2, 5], [2, 3, 5], [3, 4, 5], [0, 4, 5]])
          : [0, 1, 5],
      }));
      if (!item) continue;
      const { start, visible } = item;
      const row = document.createElement('div');
      row.className = 'gi4-jump-row row-delete-wrap';
      row.appendChild(rowDel(row));
      for (let i = 0; i < 6; i++) {
        const cell = document.createElement('div');
        cell.className = 'gi4-jump-cell';
        if (visible.includes(i)) cell.textContent = fmt(start + step * i);
        else cell.appendChild(sol(fmt(start + step * i)));
        row.appendChild(cell);
        if (i < 5) {
          const arrow = document.createElement('div');
          arrow.className = 'gi4-jump-arrow';
          arrow.appendChild(jumpArrowSvg());
          row.appendChild(arrow);
        }
      }
      wrap.appendChild(row);
    }
    b.appendChild(wrap);
  }

  function addCompare(extraCount){
    const key = 'gi4_compare';
    const count = extraCount || Math.max(2, parseInt($('#compareCount').value, 10) || 6);
    const mode = $('#compareMode')?.value || 'numbers';
    const b = block(key, 'Vul in. Kies <, > of =.', addCompare);
    const grid = document.createElement('div');
    grid.className = 'gi4-compare-grid';
    for (let i = 0; i < count; i++) {
      const item = makeUnique('gi4_compare_row', () => {
        const a = randomNumber();
        const equal = Math.random() < .22;
        const delta = pick([1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]);
        const sign = Math.random() < .5 ? -1 : 1;
        let bNum = equal ? a : a + sign * delta;
        if (bNum < 1000 || bNum > 9999) bNum = a - sign * delta;
        if (bNum < 1000 || bNum > 9999) bNum = randomNumber();
        return { mode, a, bNum, numberFirst: Math.random() < .5 };
      });
      if (!item) continue;
      const { a, bNum, numberFirst } = item;
      const row = document.createElement('div');
      row.className = `gi4-compare-row ${mode === 'value' ? 'value-mode' : 'number-mode'} row-delete-wrap`;
      row.appendChild(rowDel(row));
      const left = document.createElement('span');
      const right = document.createElement('span');
      if (mode === 'value') {
        left.textContent = numberFirst ? fmt(a) : valueExpr(a);
        right.textContent = numberFirst ? valueExpr(bNum) : fmt(bNum);
      } else {
        left.textContent = fmt(a);
        right.textContent = fmt(bNum);
      }
      const symbol = Object.assign(document.createElement('span'), { className: 'gi4-symbol-box' });
      symbol.appendChild(sol(a < bNum ? '<' : a > bNum ? '>' : '='));
      row.append(left, symbol, right);
      grid.appendChild(row);
    }
    b.appendChild(grid);
  }

  function addOrder(extraCount, forcedDir){
    const dir = forcedDir || $('#orderDirection').value;
    const key = `gi4_order_${dir}`;
    const count = extraCount || Math.max(1, parseInt($('#orderCount').value, 10) || 2);
    const title = dir === 'asc' ? 'Rangschik de getallen van klein naar groot.' : 'Rangschik de getallen van groot naar klein.';
    const b = block(key, title, addCount => addOrder(addCount || 1, dir));
    const grid = document.createElement('div');
    grid.className = 'gi4-order-grid';
    for (let i = 0; i < count; i++) {
      const item = makeUnique('gi4_order_row', () => ({ dir, nums: uniqueNumbers(5).sort(() => Math.random() - .5) }));
      if (!item) continue;
      const nums = item.nums;
      const row = document.createElement('div');
      row.className = 'gi4-order-row row-delete-wrap';
      row.appendChild(rowDel(row));
      const source = document.createElement('div');
      source.className = 'gi4-order-source';
      source.textContent = nums.map(fmt).join(' - ');
      const answer = document.createElement('div');
      answer.className = 'gi4-order-answer';
      const sorted = nums.slice().sort((a, b) => dir === 'asc' ? a - b : b - a);
      for (let j = 0; j < nums.length; j++) {
        answer.appendChild(lineWithSolution(fmt(sorted[j]), 'long'));
        if (j < nums.length - 1) answer.appendChild(document.createTextNode(dir === 'asc' ? '<' : '>'));
      }
      row.append(source, answer);
      grid.appendChild(row);
    }
    b.appendChild(grid);
  }

  function addValueCards(extraCount){
    const key = 'gi4_valuecards';
    const count = extraCount || Math.max(1, parseInt($('#valueCardCount').value, 10) || 4);
    const example = !extraCount && $('#valueCardExample')?.checked;
    const mode = $('#valueCardMode')?.value || 'schema';
    const b = block(key, 'Schrijf de waarde van elk cijfer.', addValueCards);
    const grid = document.createElement('div');
    grid.className = 'gi4-grid two';
    uniqueNumbers(count).forEach((n, i) => {
      grid.appendChild(makeValueCard(n, example && i === 0, mode));
    });
    b.appendChild(grid);
  }

  function svgText(text, x, y, opts = {}){
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.textContent = text;
    t.setAttribute('x', x);
    t.setAttribute('y', y);
    t.setAttribute('fill', opts.fill || '#1f2937');
    t.setAttribute('font-size', opts.size || '17');
    t.setAttribute('font-family', opts.family || 'Arial, sans-serif');
    t.setAttribute('font-weight', opts.weight || '700');
    if (opts.anchor) t.setAttribute('text-anchor', opts.anchor);
    if (opts.baseline) t.setAttribute('dominant-baseline', opts.baseline);
    return t;
  }

  function valueWorkSvg(n, example, mode){
    const ds = digits(n);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('gi4-value-work-svg');
    svg.setAttribute('viewBox', '0 0 360 205');
    svg.setAttribute('aria-hidden', 'true');

    const colors = ['#ef2b2d', '#6d95c7', '#4fb94f', '#ffd414'];
    const digitCenters = [186, 220, 254, 288];
    const cardX = 169;
    const cardY = 10;
    const cellW = 34;
    const cellH = 30;

    if (mode === 'plain') {
      PLACE.forEach((p, i) => {
        svg.appendChild(svgText(String(ds[p.key]), digitCenters[i], 33, {
          size: '21',
          weight: '700',
          anchor: 'middle',
        }));
      });
    } else {
      PLACE.forEach((p, i) => {
        svg.appendChild(svgRect(cardX + i * cellW, cardY, cellW, cellH, colors[i], '#8a8f99'));
        svg.appendChild(svgText(String(ds[p.key]), cardX + i * cellW + cellW / 2, cardY + 20, {
          size: '16',
          weight: '900',
          anchor: 'middle',
        }));
      });
      svg.appendChild(svgPolygon(
        `${cardX + 4 * cellW},${cardY} ${cardX + 4 * cellW + 20},${cardY + cellH / 2} ${cardX + 4 * cellW},${cardY + cellH}`,
        '#ffd414',
        '#8a8f99'
      ));
    }

    const rows = [
      { p: PLACE[0], y: 82, x: digitCenters[0], kind: 'down' },
      { p: PLACE[1], y: 114, x: digitCenters[1], kind: 'left' },
      { p: PLACE[2], y: 146, x: digitCenters[2], kind: 'left' },
      { p: PLACE[3], y: 178, x: digitCenters[3], kind: 'left' },
    ];

    rows.forEach(({ p, y, x, kind }) => {
      const val = ds[p.key] * p.value;
      if (example) {
        svg.appendChild(svgText(`${ds[p.key]} ${p.label} = ${fmt(val)}`, 24, y + 5, {
          size: '18',
          weight: '800',
        }));
      } else {
        svg.appendChild(svgLine(20, y, 62, y, '#d8dee8', 1.4));
        const digitAnswer = svgText(String(ds[p.key]), 41, y - 5, {
          size: '18',
          weight: '800',
          fill: '#0f8dc4',
          anchor: 'middle',
        });
        digitAnswer.classList.add('gi4-svg-solution-answer');
        svg.appendChild(digitAnswer);
        svg.appendChild(svgText(`${p.label} =`, 70, y + 5, {
          size: '18',
          weight: '700',
        }));
        svg.appendChild(svgLine(112, y, 172, y, '#d8dee8', 1.4));
        const answer = svgText(fmt(val), 122, y - 5, {
          size: '18',
          weight: '800',
          fill: '#0f8dc4',
        });
        answer.classList.add('gi4-svg-solution-answer');
        svg.appendChild(answer);
      }

      if (kind === 'down') {
        svg.appendChild(svgLine(x, cardY + cellH, x, y - 18, '#111827', 2.3));
        svg.appendChild(svgPolygon(`${x - 5},${y - 20} ${x + 5},${y - 20} ${x},${y - 11}`, '#111827', '#111827'));
      } else {
        const endX = example ? 145 : 185;
        svg.appendChild(svgLine(x, cardY + cellH, x, y - 2, '#111827', 2.3));
        svg.appendChild(svgLine(x, y - 2, endX, y - 2, '#111827', 2.3));
        svg.appendChild(svgPolygon(`${endX},${y - 2} ${endX + 9},${y - 8} ${endX + 9},${y + 4}`, '#111827', '#111827'));
      }
    });

    return svg;
  }

  function makeValueCard(n, example, mode){
    const ds = digits(n);
    const card = document.createElement('div');
    card.className = `gi4-value-card gi4-value-card-${mode} row-delete-wrap` + (example ? ' example' : '');
    card.appendChild(rowDel(card));
    if (mode === 'schema') card.appendChild(placeTable(n, 'dots', { compact: true }));
    card.appendChild(valueWorkSvg(n, example, mode));
    return card;
  }

  function valueExpr(n){
    const ds = digits(n);
    return `${ds.d} D ${ds.h} H ${ds.t} T ${ds.e} E`;
  }

  function exprFor(n){
    const ds = digits(n);
    const choices = [
      fmt(n),
      `${ds.d} D ${ds.h} H ${ds.t} T`.trim(),
      `${ds.d} D ${ds.h} H ${ds.e} E`.trim(),
      `${ds.d} D ${ds.t} T ${ds.e} E`.trim(),
      `${ds.d} D ${ds.h} H ${ds.t} T ${ds.e} E`.trim(),
    ];
    if (ds.d > 1 && ds.h > 0) choices.push(`${ds.h} H meer dan ${ds.d} D`);
    if (ds.t > 1 && ds.d > 0 && ds.h > 0) choices.push(`${ds.t} T meer dan ${ds.d} D en ${ds.h} H`);
    return pick(choices);
  }

  function addEquiv(extraCount){
    const key = 'gi4_equiv';
    const rows = extraCount ? Math.max(1, extraCount) : Math.max(2, parseInt($('#equivRows').value, 10) || 4);
    const b = block(key, 'Kleur wat evenveel is in dezelfde kleur.', addEquiv);
    const nums = uniqueNumbers(rows);
    const table = document.createElement('table');
    table.className = 'gi4-equivalent-table';
    nums.forEach((n, rowIndex) => {
      const tr = document.createElement('tr');
      tr.className = `gi4-equivalent-solution-${rowIndex % 6}`;
      const cells = [fmt(n), exprFor(n), exprFor(n)].sort(() => Math.random() - .5);
      cells.forEach(text => {
        const td = document.createElement('td');
        td.textContent = text;
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });
    b.appendChild(table);
  }

  function fractionBox(num, den, solutionNum = '', solutionDen = ''){
    const span = document.createElement('span');
    span.className = 'gi4-fraction-box';
    const top = document.createElement('span');
    top.className = 'gi4-fraction-cell';
    top.textContent = num ?? '';
    if ((num ?? '') === '' && solutionNum !== '') top.appendChild(sol(String(solutionNum)));
    const stroke = document.createElement('span');
    stroke.className = 'gi4-fraction-stroke';
    const bottom = document.createElement('span');
    bottom.className = 'gi4-fraction-cell';
    bottom.textContent = den ?? '';
    if ((den ?? '') === '' && solutionDen !== '') bottom.appendChild(sol(String(solutionDen)));
    span.append(top, stroke, bottom);
    return span;
  }

  function addFractionInstructions(blockEl, lines){
    const list = document.createElement('div');
    list.className = 'gi4-fraction-instructions';
    lines.forEach(line => {
      const row = document.createElement('div');
      row.className = 'gi4-fraction-instruction';
      const box = document.createElement('span');
      box.className = 'gi4-check-box';
      const text = document.createElement('span');
      text.innerHTML = line;
      row.append(box, text);
      list.appendChild(row);
    });
    blockEl.appendChild(list);
  }

  function markSolution(el){
    el.classList.add('solution-only');
    return el;
  }

  function fractionSvg(den, num = 0, kind = 'circle'){
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('gi4-fraction-shape');
    svg.setAttribute('viewBox', '0 0 120 90');
    svg.setAttribute('width', '120');
    svg.setAttribute('height', '90');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('aria-hidden', 'true');
    const fill = '#b9d87a';
    const stroke = '#6b7280';

    if (kind === 'circle') {
      const cx = 60, cy = 45, r = 32;
      for (let i = 0; i < num; i++) {
        const a1 = -Math.PI / 2 + i * 2 * Math.PI / den;
        const a2 = -Math.PI / 2 + (i + 1) * 2 * Math.PI / den;
        const x1 = cx + Math.cos(a1) * r, y1 = cy + Math.sin(a1) * r;
        const x2 = cx + Math.cos(a2) * r, y2 = cy + Math.sin(a2) * r;
        const large = a2 - a1 > Math.PI ? 1 : 0;
        svg.appendChild(markSolution(svgPath(`M${cx} ${cy} L${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, fill, 'none', 0)));
      }
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r);
      c.setAttribute('fill', 'none'); c.setAttribute('stroke', stroke); c.setAttribute('stroke-width', '1.4');
      svg.appendChild(c);
      const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ring.setAttribute('cx', cx);
      ring.setAttribute('cy', cy);
      ring.setAttribute('r', r + 6);
      ring.setAttribute('fill', 'none');
      ring.setAttribute('stroke', '#0f8dc4');
      ring.setAttribute('stroke-width', '2.4');
      ring.setAttribute('stroke-dasharray', '6 4');
      svg.appendChild(markSolution(ring));
      for (let i = 0; i < den; i++) {
        const a = -Math.PI / 2 + i * 2 * Math.PI / den;
        svg.appendChild(svgLine(cx, cy, cx + Math.cos(a) * r, cy + Math.sin(a) * r, stroke, 1));
      }
      return svg;
    }

    if (kind === 'triangle') {
      svg.appendChild(svgPolygon('60,12 20,76 100,76', 'none', stroke));
      svg.appendChild(svgLine(60, 12, 60, 76, stroke, 1));
      svg.appendChild(svgLine(20, 76, 60, 44, stroke, 1));
      svg.appendChild(svgLine(100, 76, 60, 44, stroke, 1));
      const ring = svgPolygon('56,7 13,79 107,79', 'none', '#0f8dc4');
      ring.setAttribute('stroke-width', '2.4');
      ring.setAttribute('stroke-dasharray', '6 4');
      svg.appendChild(markSolution(ring));
      return svg;
    }

    const x = 22, y = 18, w = 76, h = 54;
    for (let i = 0; i < num; i++) svg.appendChild(markSolution(svgRect(x + i * (w / den), y, w / den, h, fill, 'none')));
    svg.appendChild(svgRect(x, y, w, h, 'none', stroke));
    for (let i = 1; i < den; i++) svg.appendChild(svgLine(x + i * (w / den), y, x + i * (w / den), y + h, stroke, 1));
    if (kind === 'grid') svg.appendChild(svgLine(x, y + h / 2, x + w, y + h / 2, stroke, 1));
    const ring = svgRect(x - 7, y - 7, w + 14, h + 14, 'none', '#0f8dc4');
    ring.setAttribute('stroke-width', '2.4');
    ring.setAttribute('stroke-dasharray', '6 4');
    svg.appendChild(markSolution(ring));
    return svg;
  }

  function fractionCard(den, num, opts = {}){
    const card = document.createElement('div');
    card.className = 'gi4-fraction-card row-delete-wrap';
    card.appendChild(rowDel(card));
    card.appendChild(fractionSvg(den, num, opts.kind || pick(['circle', 'rect', 'grid'])));
    const side = document.createElement('div');
    side.className = 'gi4-fraction-side';
    side.appendChild(fractionBox(opts.showNum ? num : '', opts.showDen ? den : '', '', opts.showDen ? '' : den));
    card.appendChild(side);
    return card;
  }

  function revealFractionFill(svg){
    svg.querySelectorAll('.solution-only').forEach(el => {
      const fill = el.getAttribute('fill');
      if (fill && fill !== 'none') el.classList.remove('solution-only');
    });
    return svg;
  }

  function addFractionParts(extraCount){
    const key = 'gi4_fraction_parts';
    const count = extraCount || Math.max(1, parseInt($('#fractionPartsCount').value, 10) || 3);
    const b = block(key, 'Echte breuken: teller en noemer.', addFractionParts);
    addFractionInstructions(b, [
      'Trek een kring om <strong>het geheel</strong>.',
      'In hoeveel gelijke delen is het geheel verdeeld? Schrijf <strong>de noemer</strong>.',
      'Hoeveel breukdelen moet je nemen? Kijk naar <strong>de teller</strong>.',
      'Kleur het gevraagde deel van het geheel juist in.',
    ]);
    const grid = document.createElement('div');
    grid.className = 'gi4-grid three';
    for (let i = 0; i < count; i++) {
      const item = makeUnique('gi4_fraction_parts_card', () => {
        const den = pick([2, 3, 4, 5, 6, 8]);
        return { den, num: rnd(1, den - 1), kind: pick(['circle', 'rect', 'grid']) };
      });
      if (item) grid.appendChild(fractionCard(item.den, item.num, { showNum: true, kind: item.kind }));
    }
    b.appendChild(grid);
  }

  function addFractionColor(extraCount){
    const key = 'gi4_fraction_color';
    const count = extraCount || Math.max(1, parseInt($('#fractionColorCount').value, 10) || 4);
    const b = block(key, 'Echte breuken: kleur de breuk.', addFractionColor);
    addFractionInstructions(b, [
      'In hoeveel gelijke delen is het geheel verdeeld? Schrijf <strong>de noemer</strong>.',
      'Hoeveel breukdelen moet je nemen? Kijk naar <strong>de teller</strong>.',
      'Kleur het gevraagde deel van het geheel juist in.',
      'Welk deel is niet ingekleurd? Schrijf de breuk.',
    ]);
    const grid = document.createElement('div');
    grid.className = 'gi4-grid two';
    for (let i = 0; i < count; i++) {
      const item = makeUnique('gi4_fraction_color_card', () => {
        const den = pick([3, 4, 5, 6, 8]);
        return { den, num: rnd(1, den - 1), kind: pick(['circle', 'rect', 'grid']) };
      });
      if (!item) continue;
      const { den, num, kind } = item;
      const card = document.createElement('div');
      card.className = 'gi4-fraction-color-card row-delete-wrap';
      card.appendChild(rowDel(card));
      card.appendChild(fractionSvg(den, num, kind));
      const text = document.createElement('div');
      text.className = 'gi4-fraction-color-text';
      text.append('Kleur ', fractionBox(num, den), ' van het geheel in.');
      const not = document.createElement('div');
      not.append(fractionBox('', '', den - num, den), ' is niet ingekleurd.');
      text.appendChild(not);
      card.appendChild(text);
      grid.appendChild(card);
    }
    b.appendChild(grid);
  }

  function addFractionLines(extraCount){
    const key = 'gi4_fraction_lines';
    const count = extraCount || Math.max(1, parseInt($('#fractionLineCount').value, 10) || 2);
    const b = block(key, 'Echte breuken: getallenas en stroken.', addFractionLines);
    addFractionInstructions(b, [
      'Welk deel van het geheel is ingekleurd?',
      'Noteer de breuken op de getallenas.',
    ]);
    const wrap = document.createElement('div');
    wrap.className = 'gi4-fraction-lines';
    for (let r = 0; r < count; r++) {
      const item = makeUnique('gi4_fraction_lines_row', () => {
        const den = pick([4, 5, 6, 8]);
        const nums = [];
        while (nums.length < 3) {
          const n = rnd(1, den - 1);
          if (!nums.includes(n)) nums.push(n);
        }
        nums.sort((a, b) => a - b);
        return { den, nums };
      });
      if (!item) continue;
      const { den, nums } = item;
      const row = document.createElement('div');
      row.className = 'gi4-fraction-line-row row-delete-wrap';
      row.appendChild(rowDel(row));
      const axis = document.createElement('div');
      axis.className = 'gi4-fraction-axis';
      axis.innerHTML = '<span>0</span><span>1</span>';
      for (let i = 0; i <= den; i++) {
        const tick = document.createElement('i');
        tick.style.left = `${axisPct(i, den)}%`;
        axis.appendChild(tick);
      }
      nums.forEach(num => {
        const box = document.createElement('div');
        box.className = 'gi4-fraction-axis-answer';
        box.style.left = `${axisPct(num, den)}%`;
        const f = fractionBox('', '');
        f.querySelector('.gi4-fraction-cell:first-child')?.appendChild(sol(String(num)));
        f.querySelector('.gi4-fraction-cell:last-child')?.appendChild(sol(String(den)));
        box.appendChild(f);
        axis.appendChild(box);
      });
      row.appendChild(axis);
      ['green', 'yellow', 'orange'].forEach((color, i) => {
        const bar = document.createElement('div');
        bar.className = `gi4-fraction-bar ${color}`;
        for (let c = 0; c < den; c++) {
          const cell = document.createElement('span');
          if (c < nums[i]) cell.className = 'filled';
          bar.appendChild(cell);
        }
        row.appendChild(bar);
      });
      wrap.appendChild(row);
    }
    b.appendChild(wrap);
  }

  function addFractionConcepts(){
    const key = 'gi4_fraction_concepts';
    const style = $('#fractionConceptStyle')?.value || 'inline';
    const b = block(key, 'Echte breuken: begrippen.', addFractionConcepts);
    addFractionInstructions(b, [
      'Wat staat in het blauw?',
      'Omkring het juiste begrip.',
    ]);
    const table = document.createElement('table');
    table.className = 'gi4-fraction-concepts';
    ['teller', 'noemer', 'breukstreep', 'breuk'].forEach(focus => {
      const den = pick([2, 3, 4, 5, 6, 8]);
      const num = rnd(1, den - 1);
      const tr = document.createElement('tr');
      const nClass = focus === 'teller' || focus === 'breuk' ? ' class="blue"' : '';
      const sClass = focus === 'breukstreep' || focus === 'breuk' ? ' class="blue"' : '';
      const dClass = focus === 'noemer' || focus === 'breuk' ? ' class="blue"' : '';
      const visual = style === 'stacked'
        ? `<span class="gi4-concept-fraction stacked"><span${nClass}>${num}</span><span${sClass}></span><span${dClass}>${den}</span></span>`
        : `<span class="gi4-concept-fraction inline"><span${nClass}>${num}</span><span${sClass}>/</span><span${dClass}>${den}</span></span>`;
      const terms = ['de breuk', 'de teller', 'de noemer', 'de breukstreep'];
      tr.innerHTML = `<td>${visual}</td>` + terms.map(term => {
        const isCorrect = term === `de ${focus}`;
        return `<td${isCorrect ? ' class="gi4-concept-correct"' : ''}>${term}</td>`;
      }).join('');
      table.appendChild(tr);
    });
    b.appendChild(table);
  }

  function compactGridIndices(count){
    if (count <= 0) return new Set();
    const firstRow = Math.ceil(count / 2);
    const secondRow = Math.floor(count / 2);
    const indices = new Set();
    for (let c = 0; c < firstRow; c++) indices.add(c);
    for (let c = 0; c < secondRow; c++) indices.add(7 + c);
    return indices;
  }

  function fractionWholeGrid(coloredCells = 0, solutionCells = 0){
    const grid = document.createElement('div');
    grid.className = 'gi4-fraction-whole-grid';
    const filled = compactGridIndices(coloredCells);
    const solution = compactGridIndices(solutionCells);
    for (let i = 0; i < 14; i++) {
      const cell = document.createElement('span');
      if (filled.has(i)) cell.className = 'filled';
      if (!coloredCells && solution.has(i)) cell.classList.add('solution-fill');
      grid.appendChild(cell);
    }
    return grid;
  }

  function equivalentSeeds(){
    return [
      { num: 1, den: 2, factors: [2, 4, 5, 6] },
      { num: 1, den: 3, factors: [2, 3, 4] },
      { num: 2, den: 3, factors: [2, 3, 4] },
      { num: 1, den: 4, factors: [2, 3] },
      { num: 3, den: 4, factors: [2, 3] },
      { num: 2, den: 5, factors: [2] },
      { num: 3, den: 5, factors: [2] },
      { num: 1, den: 6, factors: [2] },
      { num: 5, den: 6, factors: [2] },
      { num: 3, den: 8, factors: [2] },
    ];
  }

  function equivalentSeed(namespace){
    return pickUnused(namespace, equivalentSeeds());
  }

  function fractionMiniBar(den, num, color = '#b9d87a', solution = false){
    const bar = document.createElement('div');
    bar.className = 'gi4-eq-mini-bar';
    bar.style.setProperty('--eq-fill', color);
    for (let i = 0; i < den; i++) {
      const cell = document.createElement('span');
      if (i < num) {
        if (solution) cell.classList.add('solution-fill');
        else cell.style.background = color;
      }
      bar.appendChild(cell);
    }
    return bar;
  }

  function makeFractionEquivCard(){
    const base = equivalentSeed('gi4_fraction_equiv_cards_seed');
    if (!base) return null;
    const factor = pick(base.factors);
    const color = pick(['#b9d87a', '#ffd414', '#ffc7dd', '#c8bee2', '#ffc879']);
    const rightNum = base.num * factor;
    const rightDen = base.den * factor;
    const card = document.createElement('div');
    card.className = 'gi4-fraction-equiv-card row-delete-wrap';
    card.appendChild(rowDel(card));

    const visuals = document.createElement('div');
    visuals.className = 'gi4-fraction-equiv-visuals';
    if (Math.random() < .45) {
      visuals.appendChild(revealFractionFill(fractionSvg(base.den, base.num, 'circle')));
      visuals.appendChild(fractionSvg(rightDen, rightNum, 'circle'));
    } else {
      visuals.appendChild(fractionMiniBar(base.den, base.num, color));
      visuals.appendChild(fractionMiniBar(rightDen, rightNum, color, true));
    }

    const answer = document.createElement('div');
    answer.className = 'gi4-fraction-equiv-answer';
    answer.append(
      fractionBox(base.num, base.den),
      document.createTextNode(' = '),
      fractionBox('', rightDen, rightNum, '')
    );
    card.append(visuals, answer);
    return card;
  }

  function makeFractionEquivBarsCard(){
    const base = equivalentSeed('gi4_fraction_equiv_bars_seed');
    if (!base) return null;
    const factorA = pick(base.factors);
    const possible = base.factors.filter(f => f !== factorA);
    const factorB = possible.length ? pick(possible) : factorA + 1;
    const values = [
      { num: base.num, den: base.den },
      { num: base.num * factorA, den: base.den * factorA },
      { num: base.num * factorB, den: base.den * factorB },
    ];
    const color = pick(['#b9d87a', '#ffd414', '#ffc879', '#c8bee2']);
    const card = document.createElement('div');
    card.className = 'gi4-fraction-equiv-bars row-delete-wrap';
    card.appendChild(rowDel(card));

    values.forEach((v, i) => {
      const row = document.createElement('div');
      row.className = 'gi4-eq-bar-row';
      row.appendChild(fractionMiniBar(v.den, v.num, color, i === 0 ? false : true));
      card.appendChild(row);
    });

    const answer = document.createElement('div');
    answer.className = 'gi4-fraction-equiv-answer three';
    values.forEach((v, i) => {
      answer.appendChild(fractionBox(i === 0 ? v.num : '', v.den, v.num, ''));
      if (i < values.length - 1) answer.append(' = ');
    });
    card.appendChild(answer);
    return card;
  }

  function makeFractionEquivAxisCard(){
    const variants = [
      { num: 1, den: 3, dens: [3, 6, 9, 12] },
      { num: 1, den: 2, dens: [2, 4, 8, 10] },
      { num: 2, den: 3, dens: [3, 6, 9, 12] },
      { num: 3, den: 4, dens: [4, 8, 12] },
    ];
    const base = pickUnused('gi4_fraction_equiv_axis_seed', variants);
    if (!base) return null;
    const color = base.den === 2 ? '#c8bee2' : '#b9d87a';
    const card = document.createElement('div');
    card.className = 'gi4-fraction-equiv-axis row-delete-wrap';
    card.appendChild(rowDel(card));

    const axis = document.createElement('div');
    axis.className = 'gi4-eq-axis';
    axis.innerHTML = '<span class="zero">0</span><span class="one">1</span>';
    for (let i = 1; i < base.den; i++) {
      const tick = document.createElement('i');
      tick.className = 'division-tick';
      tick.style.left = `${axisPct(i, base.den)}%`;
      axis.appendChild(tick);
    }
    const label = document.createElement('strong');
    label.style.left = `${axisPct(base.num, base.den)}%`;
    label.innerHTML = `${base.num}<small></small>${base.den}`;
    axis.appendChild(label);
    card.appendChild(axis);

    base.dens.forEach((den, i) => {
      const num = base.num * (den / base.den);
      const row = document.createElement('div');
      row.className = 'gi4-eq-axis-row';
      const shownNum = i <= 1 ? num : '';
      const shownDen = i === 0 ? den : (i >= 2 ? den : '');
      const solutionNum = shownNum === '' ? num : '';
      const solutionDen = shownDen === '' ? den : '';
      row.appendChild(fractionBox(shownNum, shownDen, solutionNum, solutionDen));
      row.appendChild(fractionMiniBar(den, num, color, i >= 2));
      card.appendChild(row);
    });

    const answer = document.createElement('div');
    answer.className = 'gi4-fraction-equiv-answer many';
    base.dens.forEach((den, i) => {
      const num = base.num * (den / base.den);
      const shownNum = i <= 1 ? num : '';
      const shownDen = i === 0 ? den : (i >= 2 ? den : '');
      answer.appendChild(fractionBox(shownNum, shownDen, shownNum === '' ? num : '', shownDen === '' ? den : ''));
      if (i < base.dens.length - 1) answer.append(' = ');
    });
    card.appendChild(answer);
    return card;
  }

  function addFractionEquiv(extraCount, forcedMode){
    const mode = forcedMode || $('#fractionEqMode')?.value || 'cards';
    const key = `gi4_fraction_equiv_${mode}`;
    const count = extraCount || Math.max(1, parseInt($('#fractionEqCount').value, 10) || 3);
    if (extraCount) {
      const existing = containerInLastBlock(key, '.gi4-fraction-equiv-grid', 'gi4-fraction-equiv-grid');
      if (existing) {
        for (let i = 0; i < count; i++) {
          appendNewExercise(existing, () => mode === 'axis' ? makeFractionEquivAxisCard() : mode === 'bars' ? makeFractionEquivBarsCard() : makeFractionEquivCard());
        }
        return;
      }
    }
    const title = mode === 'axis'
      ? 'Maak gelijkwaardige breuken. Kleur in. Schrijf de gelijkwaardige breuken. Vul aan.'
      : mode === 'bars'
        ? 'Maak gelijkwaardige breuken. Kleur in. Schrijf gelijkwaardige breuken.'
        : 'Maak gelijkwaardige breuken. Kleur in. Vul de breuken aan.';
    const b = block(key, title, addCount => addFractionEquiv(addCount || 1, mode));
    addFractionInstructions(b, mode === 'axis'
      ? ['Maak gelijkwaardige breuken. Kleur in.', 'Schrijf de gelijkwaardige breuken. Vul aan.']
      : ['Maak gelijkwaardige breuken. Kleur in.', mode === 'cards' ? 'Vul de breuken aan.' : 'Schrijf gelijkwaardige breuken.']);
    const tip = document.createElement('div');
    tip.className = 'gi4-fraction-tip';
    tip.innerHTML = '<strong>Tip!</strong> Je mag materiaal gebruiken.';
    b.appendChild(tip);
    const grid = document.createElement('div');
    grid.className = `gi4-fraction-equiv-grid ${mode}`;
    for (let i = 0; i < count; i++) {
      appendNewExercise(grid, () => mode === 'axis' ? makeFractionEquivAxisCard() : mode === 'bars' ? makeFractionEquivBarsCard() : makeFractionEquivCard());
    }
    b.appendChild(grid);
    addLocalExerciseButton(b, '+ oefening bij deze keuze', () => addFractionEquiv(1, mode));
  }

  function commonFractionSeeds(){
    return [
      { num: 1, den: 2, target: 6, kind: 'circle' },
      { num: 1, den: 3, target: 6, kind: 'circle' },
      { num: 1, den: 4, target: 12, kind: 'rect' },
      { num: 4, den: 6, target: 12, kind: 'grid' },
      { num: 3, den: 4, target: 8, kind: 'circle' },
      { num: 2, den: 5, target: 10, kind: 'circle' },
      { num: 1, den: 3, target: 12, kind: 'circle' },
      { num: 5, den: 6, target: 12, kind: 'grid' },
      { num: 3, den: 5, target: 10, kind: 'rect' },
      { num: 2, den: 4, target: 8, kind: 'rect' },
      { num: 5, den: 8, target: 16, kind: 'rect' },
    ];
  }

  function commonTwoSeeds(){
    return [
      { left: { num: 1, den: 3 }, right: { num: 5, den: 6 }, target: 6 },
      { left: { num: 3, den: 4 }, right: { num: 7, den: 12 }, target: 12 },
      { left: { num: 1, den: 2 }, right: { num: 3, den: 10 }, target: 10 },
      { left: { num: 3, den: 4 }, right: { num: 3, den: 8 }, target: 8 },
      { left: { num: 1, den: 3 }, right: { num: 5, den: 9 }, target: 9 },
      { left: { num: 1, den: 2 }, right: { num: 10, den: 12 }, target: 12 },
      { left: { num: 2, den: 5 }, right: { num: 7, den: 10 }, target: 10 },
      { left: { num: 5, den: 6 }, right: { num: 7, den: 12 }, target: 12 },
      { left: { num: 2, den: 3 }, right: { num: 5, den: 12 }, target: 12 },
    ];
  }

  function commonThreeSeeds(){
    return [
      { fractions: [{ num: 2, den: 3 }, { num: 1, den: 6 }, { num: 4, den: 12 }], target: 12 },
      { fractions: [{ num: 1, den: 2 }, { num: 2, den: 4 }, { num: 3, den: 8 }], target: 8 },
      { fractions: [{ num: 1, den: 3 }, { num: 2, den: 6 }, { num: 5, den: 12 }], target: 12 },
      { fractions: [{ num: 2, den: 5 }, { num: 1, den: 10 }, { num: 6, den: 20 }], target: 20 },
      { fractions: [{ num: 3, den: 4 }, { num: 5, den: 8 }, { num: 7, den: 12 }], target: 24 },
      { fractions: [{ num: 1, den: 2 }, { num: 3, den: 6 }, { num: 5, den: 10 }], target: 30 },
    ];
  }

  function commonMultiplierRow(factor, variant = 'top', showFactor = false){
    const row = document.createElement('div');
    row.className = `gi4-common-multiply ${variant}`;
    const factorLine = document.createElement('div');
    factorLine.className = 'gi4-common-factor-line';
    const line = document.createElement('span');
    line.className = 'gi4-line small';
    if (showFactor) line.textContent = String(factor);
    else line.appendChild(sol(String(factor)));
    factorLine.append('x ', line);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 92 28');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', variant === 'bottom' ? 'M5 6 C30 24 62 24 84 9' : 'M5 22 C30 4 62 4 84 19');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linecap', 'round');
    const head = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    head.setAttribute('d', variant === 'bottom' ? 'M76 10 L85 8 L81 17' : 'M76 18 L85 20 L81 11');
    head.setAttribute('fill', 'none');
    head.setAttribute('stroke', 'currentColor');
    head.setAttribute('stroke-width', '2');
    head.setAttribute('stroke-linecap', 'round');
    head.setAttribute('stroke-linejoin', 'round');
    svg.append(path, head);
    if (variant === 'bottom') row.append(svg, factorLine);
    else row.append(factorLine, svg);
    return row;
  }

  function commonEqAnswer(base, target){
    const factor = target / base.den;
    const targetNum = base.num * factor;
    const answer = document.createElement('div');
    answer.className = 'gi4-common-answer';
    answer.append(
      fractionBox(base.num, base.den),
      document.createTextNode(' = '),
      fractionBox('', target, targetNum, '')
    );
    return answer;
  }

  function makeCommonExplainCard(){
    const card = document.createElement('div');
    card.className = 'gi4-fraction-common-explain row-delete-wrap';
    card.appendChild(rowDel(card));
    const badge = document.createElement('div');
    badge.className = 'gi4-common-learn-badge';
    badge.textContent = 'Onthoud';
    const title = document.createElement('h3');
    title.textContent = 'Breuken met dezelfde noemer';

    const same = document.createElement('div');
    same.className = 'gi4-common-explain-top';
    [1, 3, 2].forEach(num => same.appendChild(revealFractionFill(fractionSvg(3, num, 'circle'))));
    const text = document.createElement('div');
    text.innerHTML = 'Bij <strong>1/3</strong>, <strong>2/3</strong> en <strong>3/3</strong> kijk je telkens naar derden.<br>Omdat de noemer gelijk is, noemen we deze breuken <strong>gelijknamig</strong>.';
    same.appendChild(text);

    const rule = document.createElement('p');
    rule.innerHTML = 'Wil je breuken makkelijk vergelijken of samen bekijken? Dan geef je ze eerst <strong>eenzelfde noemer</strong>.';
    const rule2 = document.createElement('p');
    rule2.innerHTML = 'Dat doe je door een breuk om te zetten naar een <strong>gelijkwaardige breuk</strong>: teller en noemer veranderen met dezelfde factor.';

    const steps = document.createElement('div');
    steps.className = 'gi4-common-steps';
    const left = document.createElement('div');
    left.className = 'gi4-common-step-visual';
    const convertLabel = document.createElement('strong');
    convertLabel.className = 'gi4-common-step-label';
    convertLabel.textContent = 'Maak eerst dezelfde noemer';
    const convertBars = document.createElement('div');
    convertBars.className = 'gi4-common-convert-bars';
    const oneFourth = document.createElement('div');
    oneFourth.appendChild(fractionMiniBar(4, 1, '#c8bee2'));
    oneFourth.appendChild(fractionBox(1, 4));
    const twoEighths = document.createElement('div');
    twoEighths.appendChild(fractionMiniBar(8, 2, '#c8bee2'));
    twoEighths.appendChild(fractionBox(2, 8));
    convertBars.append(oneFourth, twoEighths);
    const eq = document.createElement('div');
    eq.className = 'gi4-common-answer';
    eq.append(fractionBox(1, 4), ' = ', fractionBox(2, 8));
    const compareLabel = document.createElement('strong');
    compareLabel.className = 'gi4-common-step-label';
    compareLabel.textContent = 'Vergelijk daarna de tellers';
    const compare = document.createElement('div');
    compare.className = 'gi4-common-compare-bars';
    const converted = document.createElement('div');
    converted.appendChild(fractionMiniBar(8, 2, '#c8bee2'));
    converted.appendChild(fractionBox(2, 8));
    const symbol = document.createElement('div');
    symbol.className = 'gi4-common-compare-symbol';
    symbol.textContent = '<';
    const original = document.createElement('div');
    original.appendChild(fractionMiniBar(8, 3, '#ffc879'));
    original.appendChild(fractionBox(3, 8));
    compare.append(converted, symbol, original);
    left.append(convertLabel, convertBars, commonMultiplierRow(2, 'top', true), eq, commonMultiplierRow(2, 'bottom', true), compareLabel, compare);
    const right = document.createElement('div');
    right.innerHTML = '<strong>Voorbeeld</strong><br>Je wil <strong>1/4</strong> vergelijken met <strong>3/8</strong>.<br><br>Vierden en achtsten hebben nog geen gelijke noemer. Van <strong>1/4</strong> maak je <strong>2/8</strong>, want 4 x 2 = 8.<br><br>Nu vergelijk je <strong>2/8</strong> met <strong>3/8</strong>. De noemer is gelijk, dus je kijkt naar de tellers: <strong>2 &lt; 3</strong>.<br><br>Dus: <strong>2/8 &lt; 3/8</strong> en daarom ook <strong>1/4 &lt; 3/8</strong>.';
    steps.append(left, right);

    card.append(badge, title, same, rule, rule2, steps);
    return card;
  }

  function makeCommonRecognizeTable(){
    const denoms = [3, 4, 5, 7, 8];
    const values = denoms.flatMap(den => {
      const a = rnd(1, den - 1);
      let b = rnd(1, den - 1);
      if (b === a && den > 2) b = (b % (den - 1)) + 1;
      return [{ num: a, den }, { num: b, den }];
    }).sort(() => Math.random() - .5);
    const wrap = document.createElement('div');
    wrap.className = 'gi4-fraction-common-table row-delete-wrap';
    wrap.appendChild(rowDel(wrap));
    const table = document.createElement('table');
    values.forEach((value, index) => {
      if (index % 5 === 0) table.appendChild(document.createElement('tr'));
      const td = document.createElement('td');
      td.className = `gi4-common-den-${denoms.indexOf(value.den)}`;
      td.appendChild(fractionBox(value.num, value.den));
      table.lastElementChild.appendChild(td);
    });
    wrap.appendChild(table);
    return wrap;
  }

  function makeCommonEquivalentCard(){
    const seed = pickUnused('gi4_fraction_common_equivalent_seed', commonFractionSeeds());
    if (!seed) return null;
    const factor = seed.target / seed.den;
    const targetNum = seed.num * factor;
    const card = document.createElement('div');
    card.className = 'gi4-fraction-common-card row-delete-wrap';
    card.appendChild(rowDel(card));
    const visuals = document.createElement('div');
    visuals.className = 'gi4-common-visuals';
    visuals.appendChild(revealFractionFill(fractionSvg(seed.den, seed.num, seed.kind)));
    visuals.appendChild(fractionSvg(seed.target, targetNum, seed.kind));
    card.append(visuals, commonEqAnswer(seed, seed.target));
    return card;
  }

  function makeCommonArrowCard(){
    const seed = pickUnused('gi4_fraction_common_arrows_seed', commonFractionSeeds());
    if (!seed) return null;
    const factor = seed.target / seed.den;
    const targetNum = seed.num * factor;
    const card = document.createElement('div');
    card.className = 'gi4-fraction-common-arrow row-delete-wrap';
    card.appendChild(rowDel(card));
    const visuals = document.createElement('div');
    visuals.className = 'gi4-common-visuals';
    visuals.appendChild(revealFractionFill(fractionSvg(seed.den, seed.num, seed.kind)));
    const equals = document.createElement('strong');
    equals.textContent = '=';
    visuals.appendChild(equals);
    visuals.appendChild(fractionSvg(seed.target, targetNum, seed.kind));
    const work = document.createElement('div');
    work.className = 'gi4-common-work';
    work.append(commonMultiplierRow(factor), commonEqAnswer(seed, seed.target), commonMultiplierRow(factor, 'bottom'));
    card.append(visuals, work);
    return card;
  }

  function makeCommonTwoCard(){
    const seed = pickUnused('gi4_fraction_common_two_seed', commonTwoSeeds());
    if (!seed) return null;
    const convert = seed.left.den === seed.target ? seed.right : seed.left;
    const other = convert === seed.left ? seed.right : seed.left;
    const factor = seed.target / convert.den;
    const convertedNum = convert.num * factor;
    const otherNum = other.den === seed.target ? other.num : other.num * (seed.target / other.den);
    const card = document.createElement('div');
    card.className = 'gi4-fraction-common-two row-delete-wrap';
    card.appendChild(rowDel(card));

    const top = document.createElement('div');
    top.className = 'gi4-common-given';
    top.append(fractionBox(seed.left.num, seed.left.den), ' en ', fractionBox(seed.right.num, seed.right.den));

    const work = document.createElement('div');
    work.className = 'gi4-common-two-work';
    work.append(commonMultiplierRow(factor), commonEqAnswer(convert, seed.target), commonMultiplierRow(factor, 'bottom'));

    const final = document.createElement('div');
    final.className = 'gi4-common-final';
    final.append('De gelijknamige breuken zijn ', fractionBox('', seed.target, convertedNum, ''), ' en ', fractionBox('', seed.target, otherNum, ''), '.');
    card.append(top, work, final);
    return card;
  }

  function makeCommonThreeCard(){
    const seed = pickUnused('gi4_fraction_common_three_seed', commonThreeSeeds());
    if (!seed) return null;
    const card = document.createElement('div');
    card.className = 'gi4-fraction-common-three row-delete-wrap';
    card.appendChild(rowDel(card));
    const given = document.createElement('div');
    given.className = 'gi4-common-given';
    seed.fractions.forEach((f, i) => {
      given.appendChild(fractionBox(f.num, f.den));
      if (i < seed.fractions.length - 2) given.append(', ');
      else if (i === seed.fractions.length - 2) given.append(' en ');
    });
    const conversions = document.createElement('div');
    conversions.className = 'gi4-common-three-work';
    seed.fractions.filter(f => f.den !== seed.target).forEach(f => {
      const item = document.createElement('div');
      item.className = 'gi4-common-three-conversion';
      item.append(commonMultiplierRow(seed.target / f.den), commonEqAnswer(f, seed.target));
      conversions.appendChild(item);
    });
    const final = document.createElement('div');
    final.className = 'gi4-common-final';
    final.textContent = 'De gelijknamige breuken zijn ';
    seed.fractions.forEach((f, i) => {
      const num = f.num * (seed.target / f.den);
      final.appendChild(fractionBox('', seed.target, num, ''));
      if (i < seed.fractions.length - 2) final.append(', ');
      else if (i === seed.fractions.length - 2) final.append(' en ');
    });
    final.append('.');
    card.append(given, conversions, final);
    return card;
  }

  function makeCommonCard(mode){
    if (mode === 'explain') return makeCommonExplainCard();
    if (mode === 'recognize') return makeCommonRecognizeTable();
    if (mode === 'arrows') return makeCommonArrowCard();
    if (mode === 'two') return makeCommonTwoCard();
    if (mode === 'three') return makeCommonThreeCard();
    return makeCommonEquivalentCard();
  }

  function commonTitle(mode){
    if (mode === 'explain') return 'Gelijknamige breuken: kijk en leer.';
    if (mode === 'recognize') return 'Geef gelijknamige breuken dezelfde kleur.';
    if (mode === 'arrows') return 'Kijk goed. Vul de pijlen aan. Schrijf de gelijkwaardige breuken.';
    if (mode === 'two') return 'Maak de breuken gelijknamig.';
    if (mode === 'three') return 'Maak de drie breuken gelijknamig.';
    return 'Maak gelijkwaardige breuken. Kleur in. Vul de breuken aan.';
  }

  function commonInstructions(mode){
    if (mode === 'recognize') return ['Geef <strong>gelijknamige breuken</strong> dezelfde kleur.'];
    if (mode === 'arrows') return ['Kijk goed. Vul de pijlen aan.', 'Schrijf de <strong>gelijkwaardige breuken</strong>.'];
    if (mode === 'two') return ['Maak de breuken <strong>gelijknamig</strong>.', 'Schrijf bij de breuk <strong>met de kleinste noemer</strong> een gelijkwaardige breuk.'];
    if (mode === 'three') return ['Welke breuk heeft de grootste noemer? Omkring die noemer.', 'Schrijf bij elke overige breuk een gelijkwaardige breuk.', 'Maak de drie breuken gelijknamig. Gebruik als noemer de grootste noemer van de 3 breuken.'];
    if (mode === 'equivalent') return ['Maak <strong>gelijkwaardige breuken</strong>. Kleur in.', 'Vul de breuken aan.'];
    return [];
  }

  function addFractionCommon(extraCount, forcedMode){
    const mode = forcedMode || $('#fractionCommonMode')?.value || 'explain';
    const key = `gi4_fraction_common_${mode}`;
    const count = mode === 'explain' ? 1 : (extraCount || Math.max(1, parseInt($('#fractionCommonCount').value, 10) || 3));
    if (extraCount) {
      const existing = containerInLastBlock(key, `.gi4-fraction-common-grid.${mode}`, `gi4-fraction-common-grid ${mode}`);
      if (existing) {
        for (let i = 0; i < count; i++) appendNewExercise(existing, () => makeCommonCard(mode));
        return;
      }
    }
    const b = block(key, commonTitle(mode), addCount => addFractionCommon(addCount || 1, mode));
    const instructions = commonInstructions(mode);
    if (instructions.length) addFractionInstructions(b, instructions);
    if (['equivalent', 'arrows', 'two'].includes(mode)) {
      const tip = document.createElement('div');
      tip.className = 'gi4-fraction-tip';
      tip.innerHTML = '<strong>Tip!</strong> Je mag materiaal gebruiken.';
      b.appendChild(tip);
    }
    const grid = document.createElement('div');
    grid.className = `gi4-fraction-common-grid ${mode}`;
    for (let i = 0; i < count; i++) appendNewExercise(grid, () => makeCommonCard(mode));
    b.appendChild(grid);
    if (mode !== 'explain') addLocalExerciseButton(b, '+ oefening bij deze keuze', () => addFractionCommon(1, mode));
  }

  function compareSymbol(a, b){
    if (Math.abs(a - b) < 0.0001) return '=';
    return a < b ? '<' : '>';
  }

  function fractionCompareSeeds(){
    return [
      { left: { num: 2, den: 3 }, right: { num: 7, den: 9 }, target: 9, kind: 'circle' },
      { left: { num: 1, den: 4 }, right: { num: 3, den: 8 }, target: 8, kind: 'circle' },
      { left: { num: 2, den: 3 }, right: { num: 3, den: 6 }, target: 6, kind: 'rect' },
      { left: { num: 7, den: 10 }, right: { num: 3, den: 5 }, target: 10, kind: 'rect' },
      { left: { num: 2, den: 5 }, right: { num: 4, den: 10 }, target: 10, kind: 'rect' },
      { left: { num: 2, den: 3 }, right: { num: 7, den: 12 }, target: 12, kind: 'rect' },
      { left: { num: 3, den: 4 }, right: { num: 11, den: 12 }, target: 12, kind: 'rect' },
      { left: { num: 1, den: 2 }, right: { num: 6, den: 10 }, target: 10, kind: 'rect' },
      { left: { num: 3, den: 6 }, right: { num: 4, den: 12 }, target: 12, kind: 'rect' },
      { left: { num: 1, den: 3 }, right: { num: 1, den: 9 }, target: 9, kind: 'rect' },
      { left: { num: 3, den: 5 }, right: { num: 4, den: 10 }, target: 10, kind: 'rect' },
      { left: { num: 5, den: 6 }, right: { num: 7, den: 12 }, target: 12, kind: 'rect' },
      { left: { num: 2, den: 4 }, right: { num: 4, den: 8 }, target: 8, kind: 'rect' },
      { left: { num: 1, den: 6 }, right: { num: 3, den: 12 }, target: 12, kind: 'circle' },
    ];
  }

  function fractionOrderSeeds(){
    return [
      { fractions: [{ num: 4, den: 5 }, { num: 9, den: 10 }, { num: 1, den: 2 }], target: 10 },
      { fractions: [{ num: 1, den: 2 }, { num: 2, den: 3 }, { num: 1, den: 6 }], target: 6 },
      { fractions: [{ num: 3, den: 4 }, { num: 5, den: 6 }, { num: 7, den: 12 }], target: 12 },
      { fractions: [{ num: 3, den: 4 }, { num: 5, den: 8 }, { num: 1, den: 2 }], target: 8 },
      { fractions: [{ num: 2, den: 3 }, { num: 5, den: 6 }, { num: 7, den: 12 }], target: 12 },
      { fractions: [{ num: 1, den: 4 }, { num: 3, den: 8 }, { num: 5, den: 12 }], target: 24 },
    ];
  }

  function compareBox(symbol){
    const box = document.createElement('span');
    box.className = 'gi4-compare-symbol-box';
    box.appendChild(sol(symbol));
    return box;
  }

  function bigArrow(direction = 'right'){
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('gi4-frac-big-arrow');
    svg.setAttribute('viewBox', '0 0 56 84');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', direction === 'left' ? 'M38 4 V70 H9' : 'M18 4 V70 H47');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '4');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    const head = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    head.setAttribute('d', direction === 'left' ? 'M18 61 L7 70 L18 79' : 'M38 61 L49 70 L38 79');
    head.setAttribute('fill', 'none');
    head.setAttribute('stroke', 'currentColor');
    head.setAttribute('stroke-width', '4');
    head.setAttribute('stroke-linecap', 'round');
    head.setAttribute('stroke-linejoin', 'round');
    svg.append(path, head);
    return svg;
  }

  function shownFractionValue(f, target){
    return {
      num: f.num * (target / f.den),
      den: target,
    };
  }

  function makeFractionCompareMaterialCard(){
    const seed = pickUnused('gi4_fraction_compare_material_seed', fractionCompareSeeds());
    if (!seed) return null;
    const leftTarget = shownFractionValue(seed.left, seed.target);
    const rightTarget = shownFractionValue(seed.right, seed.target);
    const symbol = compareSymbol(seed.left.num / seed.left.den, seed.right.num / seed.right.den);
    const convert = seed.left.den === seed.target ? seed.right : seed.left;
    const convertTarget = shownFractionValue(convert, seed.target);
    const card = document.createElement('div');
    card.className = 'gi4-fraction-compare-card material row-delete-wrap';
    card.appendChild(rowDel(card));

    const top = document.createElement('div');
    top.className = 'gi4-frac-compare-top';
    const left = document.createElement('div');
    left.append(fractionBox(seed.left.num, seed.left.den), revealFractionFill(fractionSvg(seed.left.den, seed.left.num, seed.kind)));
    const right = document.createElement('div');
    right.append(revealFractionFill(fractionSvg(seed.right.den, seed.right.num, seed.kind)), fractionBox(seed.right.num, seed.right.den));
    top.append(left, compareBox(symbol), right);

    const work = document.createElement('div');
    work.className = `gi4-frac-compare-work ${convert === seed.left ? 'convert-left' : 'convert-right'}`;
    const convertVisual = document.createElement('div');
    convertVisual.className = 'gi4-frac-convert-visual';
    convertVisual.appendChild(bigDownArrow());
    const targetVisual = document.createElement('div');
    targetVisual.className = 'gi4-frac-target-visual';
    targetVisual.appendChild(fractionSvg(seed.target, convertTarget.num, seed.kind));
    convertVisual.appendChild(targetVisual);
    const conversion = document.createElement('div');
    conversion.className = 'gi4-common-work';
    conversion.append(commonMultiplierRow(seed.target / convert.den), commonEqAnswer(convert, seed.target), commonMultiplierRow(seed.target / convert.den, 'bottom'));
    if (convert === seed.left) work.append(convertVisual, conversion);
    else work.append(conversion, convertVisual);

    const final = document.createElement('div');
    final.className = 'gi4-frac-compare-final';
    final.append(fractionBox('', seed.target, leftTarget.num, ''), compareBox(symbol), fractionBox(seed.right.num, seed.right.den), ' DUS ', fractionBox(seed.left.num, seed.left.den), compareBox(symbol), fractionBox(seed.right.num, seed.right.den));
    if (seed.right.den !== seed.target) {
      final.innerHTML = '';
      final.append(fractionBox(seed.left.num, seed.left.den), compareBox(symbol), fractionBox('', seed.target, rightTarget.num, ''), ' DUS ', fractionBox(seed.left.num, seed.left.den), compareBox(symbol), fractionBox(seed.right.num, seed.right.den));
    }
    card.append(top, work, final);
    return card;
  }

  function makeFractionCompareArrowCard(){
    const seed = pickUnused('gi4_fraction_compare_arrows_seed', fractionCompareSeeds());
    if (!seed) return null;
    const symbol = compareSymbol(seed.left.num / seed.left.den, seed.right.num / seed.right.den);
    const convert = seed.left.den === seed.target ? seed.right : seed.left;
    const other = convert === seed.left ? seed.right : seed.left;
    const converted = shownFractionValue(convert, seed.target);
    const otherTarget = shownFractionValue(other, seed.target);
    const convertSide = convert === seed.left ? 'left' : 'right';
    const card = document.createElement('div');
    card.className = `gi4-fraction-compare-card arrows convert-${convertSide} row-delete-wrap`;
    card.appendChild(rowDel(card));

    const top = document.createElement('div');
    top.className = 'gi4-frac-compare-inline';
    const leftTop = document.createElement('div');
    leftTop.className = 'gi4-frac-top-left';
    leftTop.appendChild(fractionBox(seed.left.num, seed.left.den));
    const rightTop = document.createElement('div');
    rightTop.className = 'gi4-frac-top-right';
    rightTop.appendChild(fractionBox(seed.right.num, seed.right.den));
    top.append(leftTop, compareBox(symbol), rightTop);

    const work = document.createElement('div');
    work.className = 'gi4-frac-compare-arrow-work';
    const arrowSlot = document.createElement('div');
    arrowSlot.className = `gi4-frac-arrow-slot ${convertSide}`;
    arrowSlot.appendChild(bigArrow(convertSide === 'right' ? 'left' : 'right'));
    const conversion = document.createElement('div');
    conversion.className = 'gi4-common-work';
    conversion.append(commonMultiplierRow(seed.target / convert.den), commonEqAnswer({ num: convert.num, den: convert.den }, seed.target), commonMultiplierRow(seed.target / convert.den, 'bottom'));
    const conversionSlot = document.createElement('div');
    conversionSlot.className = 'gi4-frac-conversion-slot';
    conversionSlot.appendChild(conversion);
    work.append(arrowSlot, conversionSlot);

    const final = document.createElement('div');
    final.className = 'gi4-frac-compare-final';
    const leftCommon = seed.left === convert ? converted : otherTarget;
    const rightCommon = seed.right === convert ? converted : otherTarget;
    final.append(fractionBox('', seed.target, leftCommon.num, ''), compareBox(symbol), fractionBox('', seed.target, rightCommon.num, ''), ' DUS ', fractionBox(seed.left.num, seed.left.den), compareBox(symbol), fractionBox(seed.right.num, seed.right.den));
    card.append(top, work, final);
    return card;
  }

  function makeFractionCompareOrderCard(){
    const seed = pickUnused('gi4_fraction_compare_order_seed', fractionOrderSeeds());
    if (!seed) return null;
    const card = document.createElement('div');
    card.className = 'gi4-fraction-compare-order row-delete-wrap';
    card.appendChild(rowDel(card));
    const top = document.createElement('div');
    top.className = 'gi4-frac-order-top';
    seed.fractions.forEach(f => {
      const item = document.createElement('div');
      item.append(fractionBox(f.num, f.den), bigDownArrow(), fractionBox('', '', f.num * (seed.target / f.den), seed.target));
      top.appendChild(item);
    });
    const sorted = seed.fractions
      .map(f => ({ ...f, commonNum: f.num * (seed.target / f.den), value: f.num / f.den }))
      .sort((a, b) => a.value - b.value);
    const final = document.createElement('div');
    final.className = 'gi4-frac-order-final';
    final.append('DUS: ');
    sorted.forEach((f, i) => {
      final.appendChild(fractionBox('', seed.target, f.commonNum, ''));
      if (i < sorted.length - 1) final.append(' < ');
    });
    card.append(top, final);
    return card;
  }

  function bigDownArrow(){
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('gi4-frac-down-arrow');
    svg.setAttribute('viewBox', '0 0 24 42');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M12 2 V32');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '3');
    path.setAttribute('stroke-linecap', 'round');
    const head = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    head.setAttribute('d', 'M5 25 L12 36 L19 25');
    head.setAttribute('fill', 'none');
    head.setAttribute('stroke', 'currentColor');
    head.setAttribute('stroke-width', '3');
    head.setAttribute('stroke-linecap', 'round');
    head.setAttribute('stroke-linejoin', 'round');
    svg.append(path, head);
    return svg;
  }

  function makeFractionCompareCard(mode){
    if (mode === 'order') return makeFractionCompareOrderCard();
    if (mode === 'arrows') return makeFractionCompareArrowCard();
    return makeFractionCompareMaterialCard();
  }

  function fractionCompareTitle(mode){
    if (mode === 'order') return 'Maak de breuken gelijknamig. Rangschik daarna van klein naar groot.';
    if (mode === 'arrows') return 'Maak de breuken gelijknamig. Vergelijk daarna de breuken.';
    return 'Markeer de breuk met de grootste noemer. Maak gelijknamig en vergelijk.';
  }

  function fractionCompareInstructions(mode){
    if (mode === 'order') return ['Markeer de breuk met de grootste noemer.', 'Maak de breuken gelijknamig. Schrijf de gelijknamige breuken onder de pijlen.', 'Rangschik daarna de breuken van klein naar groot.'];
    if (mode === 'arrows') return ['Maak de breuken gelijknamig.', 'Vergelijk daarna de breuken. Vul in: &lt;, &gt; of =.', 'Je mag indien nodig materiaal gebruiken.'];
    return ['Markeer de breuk met de grootste noemer.', 'Maak de breuken gelijknamig. Je mag materiaal gebruiken.', 'Vergelijk daarna de breuken. Vul in: &lt;, &gt; of =.'];
  }

  function addFractionCompare(extraCount, forcedMode){
    const mode = forcedMode || $('#fractionCompareMode')?.value || 'material';
    const key = `gi4_fraction_compare_${mode}`;
    const count = extraCount || Math.max(1, parseInt($('#fractionCompareCount').value, 10) || 2);
    if (extraCount) {
      const existing = containerInLastBlock(key, `.gi4-fraction-compare-grid.${mode}`, `gi4-fraction-compare-grid ${mode}`);
      if (existing) {
        for (let i = 0; i < count; i++) appendNewExercise(existing, () => makeFractionCompareCard(mode));
        return;
      }
    }
    const b = block(key, fractionCompareTitle(mode), addCount => addFractionCompare(addCount || 1, mode));
    addFractionInstructions(b, fractionCompareInstructions(mode));
    if (mode !== 'order') {
      const tip = document.createElement('div');
      tip.className = 'gi4-fraction-tip';
      tip.innerHTML = '<strong>Tip!</strong> Je mag materiaal gebruiken.';
      b.appendChild(tip);
    }
    const grid = document.createElement('div');
    grid.className = `gi4-fraction-compare-grid ${mode}`;
    for (let i = 0; i < count; i++) appendNewExercise(grid, () => makeFractionCompareCard(mode));
    b.appendChild(grid);
    addLocalExerciseButton(b, '+ oefening bij deze keuze', () => addFractionCompare(1, mode));
  }

  function estimateSeeds(){
    return [
      [{ num: 1, den: 4 }, { num: 5, den: 8 }],
      [{ num: 6, den: 7 }, { num: 1, den: 5 }, { num: 4, den: 6 }],
      [{ num: 4, den: 7 }, { num: 9, den: 10 }, { num: 2, den: 9 }],
      [{ num: 1, den: 8 }, { num: 5, den: 6 }],
      [{ num: 6, den: 10 }, { num: 7, den: 8 }],
      [{ num: 3, den: 5 }, { num: 7, den: 12 }, { num: 2, den: 3 }],
    ];
  }

  function estimateOrderSeeds(){
    return [
      [{ num: 4, den: 6 }, { num: 2, den: 8 }, { num: 9, den: 10 }],
      [{ num: 10, den: 11 }, { num: 6, den: 10 }, { num: 1, den: 9 }],
      [{ num: 3, den: 12 }, { num: 5, den: 10 }, { num: 8, den: 9 }],
      [{ num: 7, den: 12 }, { num: 3, den: 9 }, { num: 5, den: 6 }],
      [{ num: 1, den: 8 }, { num: 5, den: 6 }, { num: 3, den: 4 }],
      [{ num: 2, den: 5 }, { num: 7, den: 10 }, { num: 1, den: 2 }],
    ];
  }

  function estimateCompareSeeds(){
    return [
      [{ num: 5, den: 10 }, { num: 7, den: 9 }],
      [{ num: 7, den: 8 }, { num: 3, den: 12 }],
      [{ num: 4, den: 5 }, { num: 1, den: 3 }],
      [{ num: 7, den: 10 }, { num: 2, den: 4 }],
      [{ num: 2, den: 5 }, { num: 8, den: 10 }],
      [{ num: 1, den: 6 }, { num: 3, den: 4 }],
      [{ num: 4, den: 8 }, { num: 1, den: 2 }],
      [{ num: 9, den: 11 }, { num: 4, den: 12 }],
      [{ num: 6, den: 12 }, { num: 9, den: 10 }],
    ];
  }

  function estimateFigureSeeds(){
    return [
      { kind: 'pear', fractions: [{ num: 5, den: 8 }, { num: 3, den: 8 }, { num: 7, den: 8 }, { num: 1, den: 8 }] },
      { kind: 'apple', fractions: [{ num: 1, den: 8 }, { num: 1, den: 4 }, { num: 1, den: 6 }, { num: 1, den: 2 }] },
      { kind: 'orange', fractions: [{ num: 2, den: 6 }, { num: 2, den: 3 }, { num: 5, den: 6 }, { num: 1, den: 3 }] },
      { kind: 'leaf', fractions: [{ num: 3, den: 12 }, { num: 9, den: 10 }, { num: 2, den: 5 }, { num: 1, den: 2 }] },
      { kind: 'pear', fractions: [{ num: 4, den: 6 }, { num: 2, den: 8 }, { num: 9, den: 10 }, { num: 3, den: 4 }] },
      { kind: 'apple', fractions: [{ num: 7, den: 12 }, { num: 3, den: 9 }, { num: 5, den: 6 }, { num: 1, den: 4 }] },
    ];
  }

  function estimateBar(f){
    const bar = document.createElement('div');
    bar.className = 'gi4-estimate-bar';
    for (let i = 0; i < f.den; i++) {
      const part = document.createElement('span');
      if (i < f.num) part.classList.add('solution-fill');
      bar.appendChild(part);
    }
    return bar;
  }

  function estimateAxis(){
    const axis = document.createElement('div');
    axis.className = 'gi4-estimate-axis';
    axis.innerHTML = '<span class="zero">0</span><span class="half">1<br><small></small>2</span><span class="one">1</span><i></i>';
    return axis;
  }

  function estimateClosest(f){
    const v = f.num / f.den;
    const anchors = [
      { value: 0, label: '0' },
      { value: .5, label: '1/2' },
      { value: 1, label: '1' },
    ];
    return anchors.reduce((best, item) => Math.abs(v - item.value) < Math.abs(v - best.value) ? item : best).label;
  }

  function fractionText(f){
    const wrap = document.createElement('span');
    wrap.className = 'gi4-plain-fraction';
    wrap.innerHTML = `<span>${f.num}</span><b></b><span>${f.den}</span>`;
    return wrap;
  }

  function makeEstimateStripCard(){
    const fractions = pickUnused('gi4_fraction_estimate_strips_seed', estimateSeeds(), item => item);
    if (!fractions) return null;
    const card = document.createElement('div');
    card.className = 'gi4-fraction-estimate-card strips row-delete-wrap';
    card.appendChild(rowDel(card));
    card.appendChild(estimateAxis());
    const rows = document.createElement('div');
    rows.className = 'gi4-estimate-strip-rows';
    fractions.forEach(f => {
      const row = document.createElement('div');
      row.className = 'gi4-estimate-strip-row';
      row.append(fractionText(f), estimateBar(f));
      const near = document.createElement('div');
      near.className = 'gi4-estimate-near';
      near.append('→ ', fractionText(f), ' ligt dicht bij ', lineWithSolution(estimateClosest(f), 'small'));
      row.appendChild(near);
      rows.appendChild(row);
    });
    const sorted = [...fractions].sort((a, b) => a.num / a.den - b.num / b.den);
    const order = document.createElement('div');
    order.className = 'gi4-estimate-order';
    sorted.forEach((f, i) => {
      order.appendChild(fractionBox('', '', f.num, f.den));
      if (i < sorted.length - 1) order.append(' < ');
    });
    card.append(rows, order);
    return card;
  }

  function makeEstimateCompareCard(){
    const allPairs = estimateCompareSeeds();
    const picked = makeUnique('gi4_fraction_estimate_compare_seed', () => {
      const shuffled = [...allPairs].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 1);
    });
    const pairs = picked || allPairs.slice(0, 1);
    const card = document.createElement('div');
    card.className = 'gi4-fraction-estimate-card compare row-delete-wrap';
    card.appendChild(rowDel(card));
    const grid = document.createElement('div');
    grid.className = 'gi4-estimate-compare-grid';
    pairs.forEach(pair => {
      const row = document.createElement('div');
      row.className = 'gi4-estimate-compare-row';
      const symbol = compareSymbol(pair[0].num / pair[0].den, pair[1].num / pair[1].den);
      row.append(fractionBox(pair[0].num, pair[0].den), compareBox(symbol), fractionBox(pair[1].num, pair[1].den));
      grid.appendChild(row);
    });
    card.appendChild(grid);
    return card;
  }

  function appendEstimateCompareRows(grid, amount){
    for (let i = 0; i < amount; i++) {
      appendNewExercise(grid, makeEstimateCompareCard);
    }
  }

  function makeEstimateOrderCard(){
    const fractions = pickUnused('gi4_fraction_estimate_order_seed', estimateOrderSeeds(), item => item);
    if (!fractions) return null;
    const card = document.createElement('div');
    card.className = 'gi4-fraction-estimate-card order row-delete-wrap';
    card.appendChild(rowDel(card));
    const given = document.createElement('div');
    given.className = 'gi4-estimate-given';
    fractions.forEach(f => given.appendChild(fractionBox(f.num, f.den)));
    const sorted = [...fractions].sort((a, b) => a.num / a.den - b.num / b.den);
    const answer = document.createElement('div');
    answer.className = 'gi4-estimate-order';
    sorted.forEach((f, i) => {
      answer.appendChild(fractionBox('', '', f.num, f.den));
      if (i < sorted.length - 1) answer.append(' < ');
    });
    card.append(given, answer);
    return card;
  }

  function estimateFigureSvg(kind, fraction, highlight){
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('gi4-estimate-figure-svg');
    svg.setAttribute('viewBox', '0 0 100 90');
    const shapeFill = '#fff';
    let shape;
    if (kind === 'leaf') {
      shape = svgPath('M14 58 C29 19 68 12 88 34 C71 76 35 79 14 58 Z', shapeFill, '#4b5563', 2.2);
      svg.appendChild(shape);
      svg.appendChild(svgPath('M24 57 C43 50 60 42 80 31', 'none', '#4b5563', 1.7));
    } else if (kind === 'pear') {
      shape = svgPath('M50 18 C62 18 71 29 69 42 C79 51 72 75 50 76 C28 75 21 51 31 42 C29 29 38 18 50 18 Z', shapeFill, '#4b5563', 2.2);
      svg.appendChild(shape);
      svg.appendChild(svgPath('M50 18 C49 10 56 8 64 10', 'none', '#4b5563', 2));
    } else if (kind === 'orange') {
      shape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      shape.setAttribute('cx', '50'); shape.setAttribute('cy', '48'); shape.setAttribute('r', '30');
      shape.setAttribute('fill', shapeFill); shape.setAttribute('stroke', '#4b5563'); shape.setAttribute('stroke-width', '2');
      svg.appendChild(shape);
      svg.appendChild(svgPath('M50 18 C50 10 58 8 66 12', 'none', '#4b5563', 2));
    } else {
      shape = svgPath('M50 20 C67 13 82 26 80 47 C78 67 62 78 50 70 C38 78 22 67 20 47 C18 26 33 13 50 20 Z', shapeFill, '#4b5563', 2);
      svg.appendChild(shape);
      svg.appendChild(svgPath('M50 20 C49 11 55 8 64 10', 'none', '#4b5563', 2));
    }
    if (highlight) shape.classList.add('solution-fill');
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '50');
    text.setAttribute('y', '43');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '18');
    text.setAttribute('font-weight', '700');
    text.textContent = fraction.num;
    const line = svgLine(38, 48, 62, 48, '#1f2937', 1.6);
    const den = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    den.setAttribute('x', '50');
    den.setAttribute('y', '66');
    den.setAttribute('text-anchor', 'middle');
    den.setAttribute('font-size', '18');
    den.setAttribute('font-weight', '700');
    den.textContent = fraction.den;
    svg.append(text, line, den);
    return svg;
  }

  function makeEstimateFigureCard(){
    const seed = pickUnused('gi4_fraction_estimate_figures_seed', estimateFigureSeeds(), item => item);
    if (!seed) return null;
    const maxValue = Math.max(...seed.fractions.map(f => f.num / f.den));
    const card = document.createElement('div');
    card.className = 'gi4-fraction-estimate-card figures row-delete-wrap';
    card.appendChild(rowDel(card));
    seed.fractions.forEach(f => {
      const item = document.createElement('div');
      item.className = 'gi4-estimate-figure';
      item.appendChild(estimateFigureSvg(seed.kind, f, f.num / f.den === maxValue));
      card.appendChild(item);
    });
    return card;
  }

  function makeFractionEstimateCard(mode){
    if (mode === 'compare') return makeEstimateCompareCard();
    if (mode === 'order') return makeEstimateOrderCard();
    if (mode === 'figures') return makeEstimateFigureCard();
    return makeEstimateStripCard();
  }

  function fractionEstimateTitle(mode){
    if (mode === 'compare') return 'Breuken schatten: vergelijk de breuken.';
    if (mode === 'order') return 'Breuken schatten: rangschik van klein naar groot.';
    if (mode === 'figures') return 'Breuken schatten: kleur de grootste breuk.';
    return 'Breuken schatten met stroken en getallenas.';
  }

  function fractionEstimateInstructions(mode){
    if (mode === 'compare') return [
      'Kijk goed naar de teller en de noemer.',
      'Schat: ligt de breuk dichter bij 0, 1/2 of 1? Is de breuk meer of minder dan 1/2?',
      'Vergelijk. Vul in: &lt;, &gt; of =.',
      'Je mag indien nodig je breukenstroken of de getallenas gebruiken.',
    ];
    if (mode === 'order') return [
      'Kijk goed naar de teller en de noemer.',
      'Schat: ligt de breuk dichter bij 0, 1/2 of 1?',
      'Rangschik de breuken van klein naar groot.',
      'Je mag indien nodig je breukenstroken of de getallenas gebruiken.',
    ];
    if (mode === 'figures') return ['Kleur in elke reeks de grootste breuk.'];
    return [
      'Kleur de breuken in op de stroken.',
      'Vergelijk met de getallenas. Schat: ligt de breuk dichter bij 0, 1/2 of 1?',
      'Vergelijk de breuken met elkaar. Orden van klein naar groot.',
    ];
  }

  function addFractionEstimate(extraCount, forcedMode){
    const mode = forcedMode || $('#fractionEstimateMode')?.value || 'strips';
    const key = `gi4_fraction_estimate_${mode}`;
    const count = extraCount || Math.max(1, parseInt($('#fractionEstimateCount').value, 10) || 2);
    if (extraCount) {
      const existing = containerInLastBlock(key, `.gi4-fraction-estimate-grid.${mode}`, `gi4-fraction-estimate-grid ${mode}`);
      if (existing) {
        if (mode === 'compare') {
          appendEstimateCompareRows(existing, count);
          return;
        }
        for (let i = 0; i < count; i++) appendNewExercise(existing, () => makeFractionEstimateCard(mode));
        return;
      }
    }
    const b = block(key, fractionEstimateTitle(mode), addCount => addFractionEstimate(addCount || 1, mode));
    addFractionInstructions(b, fractionEstimateInstructions(mode));
    const grid = document.createElement('div');
    grid.className = `gi4-fraction-estimate-grid ${mode}`;
    if (mode === 'compare') {
      appendEstimateCompareRows(grid, count);
    } else {
      for (let i = 0; i < count; i++) appendNewExercise(grid, () => makeFractionEstimateCard(mode));
    }
    b.appendChild(grid);
    addLocalExerciseButton(b, '+ oefening bij deze keuze', () => addFractionEstimate(1, mode));
  }

  function makeFractionWholeCard(){
    const item = makeUnique('gi4_fraction_whole_card', () => {
      const den = pick([2, 3, 4, 5, 7]);
      return { den, num: rnd(1, den - 1), unit: rnd(1, Math.max(1, Math.floor(14 / den))) };
    });
    if (!item) return null;
    const { den, num, unit } = item;
    const card = document.createElement('div');
    card.className = 'gi4-fraction-whole-card row-delete-wrap';
    card.appendChild(rowDel(card));
    card.append('Dit is ', fractionBox(num, den), ' van het geheel.');
    card.appendChild(fractionWholeGrid(num * unit));
    const label = document.createElement('div');
    label.textContent = 'Het geheel is:';
    card.appendChild(label);
    card.appendChild(fractionWholeGrid(0, den * unit));
    return card;
  }

  function addFractionWhole(extraCount){
    const key = 'gi4_fraction_whole';
    const count = extraCount || Math.max(1, parseInt($('#fractionWholeCount').value, 10) || 3);
    if (extraCount) {
      const existing = containerInLastBlock(key, '.gi4-grid.three', 'gi4-grid three');
      if (existing) {
        for (let i = 0; i < count; i++) appendNewExercise(existing, makeFractionWholeCard);
        return;
      }
    }
    const b = block(key, 'Echte breuken: teken het geheel.', addFractionWhole);
    addFractionInstructions(b, [
      'Je krijgt een deel van het geheel.',
      'Teken zelf het geheel.',
    ]);
    const grid = document.createElement('div');
    grid.className = 'gi4-grid three';
    for (let i = 0; i < count; i++) {
      appendNewExercise(grid, makeFractionWholeCard);
    }
    b.appendChild(grid);
  }

  function mixedSeeds(){
    return [
      { num: 7, den: 4, kind: 'circle' }, { num: 9, den: 5, kind: 'circle' },
      { num: 3, den: 2, kind: 'bar' }, { num: 8, den: 3, kind: 'bar' },
      { num: 12, den: 5, kind: 'bar' }, { num: 11, den: 8, kind: 'bar' },
      { num: 13, den: 4, kind: 'circle' }, { num: 17, den: 5, kind: 'bar' },
      { num: 12, den: 6, kind: 'circle' }, { num: 16, den: 5, kind: 'bar' },
    ];
  }

  function mixedValue(seed){
    const whole = Math.floor(seed.num / seed.den);
    const rem = seed.num % seed.den;
    return { ...seed, whole, rem };
  }

  function mixedNumberBox(whole = '', num = '', den = '', solutionWhole = '', solutionNum = '', solutionDen = ''){
    const wrap = document.createElement('span');
    wrap.className = 'gi4-mixed-number';
    const w = document.createElement('span');
    w.className = 'gi4-mixed-whole';
    w.textContent = whole ?? '';
    if ((whole ?? '') === '') w.classList.add('empty');
    if ((whole ?? '') === '' && solutionWhole !== '') w.appendChild(sol(String(solutionWhole)));
    wrap.appendChild(w);
    wrap.appendChild(fractionBox(num, den, solutionNum, solutionDen));
    return wrap;
  }

  function mixedVisual(seed, opts = {}){
    const item = mixedValue(seed);
    const wrap = document.createElement('div');
    wrap.className = `gi4-mixed-visual ${item.kind === 'circle' ? 'circles' : 'bars'}`;
    const wholes = Math.ceil(item.num / item.den);
    let rest = item.num;
    for (let i = 0; i < wholes; i++) {
      const fill = Math.min(item.den, Math.max(0, rest));
      rest -= item.den;
      if (item.kind === 'circle') {
        const svg = fractionSvg(item.den, fill, 'circle');
        if (opts.showFill) revealFractionFill(svg);
        wrap.appendChild(svg);
      } else {
        const bar = document.createElement('div');
        bar.className = 'gi4-mixed-bar';
        for (let j = 0; j < item.den; j++) {
          const part = document.createElement('span');
          if (j < fill) {
            part.classList.add('filled');
            if (!opts.showFill) part.classList.add('solution-only');
          }
          bar.appendChild(part);
        }
        wrap.appendChild(bar);
      }
    }
    if (opts.arrows) wrap.appendChild(Object.assign(document.createElement('div'), { className: 'gi4-mixed-swap-arrows', textContent: '↕' }));
    return wrap;
  }

  function shuffledMixedSeeds(namespace, count, source = mixedSeeds()){
    const seedPool = [...source];
    const selected = [];
    for (let i = 0; i < count && seedPool.length; i++) {
      const next = pickUnused(`${namespace}_${i}`, seedPool, item => `${item.num}/${item.den}/${item.kind}`);
      if (!next) break;
      selected.push(next);
      const idx = seedPool.findIndex(item => item.num === next.num && item.den === next.den && item.kind === next.kind);
      if (idx >= 0) seedPool.splice(idx, 1);
    }
    if (selected.length < count) {
      [...source].sort(() => Math.random() - .5).some(item => {
        if (selected.some(existing => existing.num === item.num && existing.den === item.den && existing.kind === item.kind)) return false;
        selected.push(item);
        return selected.length >= count;
      });
    }
    return selected;
  }

  function makeMixedExplainCard(){
    const card = document.createElement('div');
    card.className = 'gi4-mixed-explain row-delete-wrap';
    card.appendChild(rowDel(card));
    [
      ['stambreuk', 'De teller is 1.', fractionBox(1, 4), { num: 1, den: 4, kind: 'circle' }],
      ['echte breuk', 'De teller is kleiner dan de noemer.', fractionBox(3, 4), { num: 3, den: 4, kind: 'circle' }],
      ['geheel', 'De teller is gelijk aan de noemer.', fractionBox(4, 4), { num: 4, den: 4, kind: 'circle' }],
      ['onechte breuk', 'De teller is groter dan de noemer.', fractionBox(5, 4), { num: 5, den: 4, kind: 'circle' }],
      ['gemengd getal', 'Gehelen met nog een breukdeel.', mixedNumberBox(1, 1, 4), { num: 5, den: 4, kind: 'circle' }],
      ['omzetten', 'Splits eerst de gehelen af.', fractionBox(5, 4), { num: 5, den: 4, kind: 'circle' }],
    ].forEach(([title, text, notation, visual]) => {
      const box = document.createElement('div');
      box.className = 'gi4-mixed-explain-box';
      const h = document.createElement('strong');
      h.textContent = title;
      const p = document.createElement('p');
      p.textContent = text;
      const example = document.createElement('div');
      example.className = 'gi4-mixed-example';
      example.append('bv. ', notation);
      box.append(h, p, example, mixedVisual(visual, { showFill: true }));
      card.appendChild(box);
    });
    return card;
  }

  function makeMixedConvertCard(){
    const seed = mixedValue(pickUnused('gi4_mixed_convert_seed', mixedSeeds()) || pick(mixedSeeds()));
    const card = document.createElement('div');
    card.className = 'gi4-mixed-convert-card row-delete-wrap';
    card.appendChild(rowDel(card));
    const top = document.createElement('div');
    top.className = 'gi4-mixed-card-top';
    top.append(fractionBox(seed.num, seed.den), mixedVisual(seed, { arrows: true }));
    const split = document.createElement('div');
    split.className = 'gi4-mixed-equation';
    split.append(fractionBox(seed.num, seed.den), ' = ', fractionBox('', seed.den, seed.whole * seed.den, ''), ' + ', fractionBox('', seed.den, seed.rem, ''));
    const result = document.createElement('div');
    result.className = 'gi4-mixed-equation';
    result.append(fractionBox(seed.num, seed.den), ' = ', mixedNumberBox('', '', seed.den, seed.whole, seed.rem || '', ''));
    card.append(top, split, result);
    return card;
  }

  function makeMixedClassifyCard(){
    const card = document.createElement('div');
    card.className = 'gi4-mixed-classify-card row-delete-wrap';
    card.appendChild(rowDel(card));
    const legend = document.createElement('div');
    legend.className = 'gi4-mixed-legend';
    legend.innerHTML = '<span>Kleur: <b class="orange">stambreuken</b></span><span><b class="green">onechte breuken</b></span><span><b class="blue">gemengde getallen</b></span>';
    const grid = document.createElement('div');
    grid.className = 'gi4-mixed-classify-grid';
    [
      ['proper', fractionBox(4, 5)], ['mixed', mixedNumberBox(1, 5, 6)], ['improper', fractionBox(9, 8)],
      ['unit', fractionBox(1, 7)], ['unit', fractionBox(1, 4)], ['mixed', mixedNumberBox(2, 3, 5)],
      ['improper', fractionBox(7, 4)], ['improper', fractionBox(11, 9)], ['mixed', mixedNumberBox(3, 1, 3)], ['proper', fractionBox(2, 7)],
    ].forEach(([type, node]) => {
      const tile = document.createElement('div');
      tile.className = `gi4-mixed-tile classify ${type}`;
      tile.appendChild(node);
      grid.appendChild(tile);
    });
    const fill = document.createElement('div');
    fill.className = 'gi4-mixed-fill-sentence';
    fill.append('De overige breuken noemen we ', lineWithSolution('echte breuken', 'wide'), '.');
    card.append(legend, grid, fill);
    return card;
  }

  function makeMixedVisualCard(){
    const seed = mixedValue(pickUnused('gi4_mixed_visual_seed', mixedSeeds()) || pick(mixedSeeds()));
    const card = document.createElement('div');
    card.className = 'gi4-mixed-visual-card row-delete-wrap';
    card.appendChild(rowDel(card));
    card.appendChild(mixedVisual(seed, { showFill: true }));
    const see = document.createElement('div');
    see.className = 'gi4-mixed-equation';
    see.append('Ik zie: ');
    for (let i = 0; i < seed.whole; i++) {
      see.append(fractionBox('', seed.den, seed.den, ''));
      if (i < seed.whole - 1 || seed.rem) see.append(' + ');
    }
    if (seed.rem) see.append(fractionBox('', seed.den, seed.rem, ''));
    const result = document.createElement('div');
    result.className = 'gi4-mixed-equation';
    result.append('Dit is: ', fractionBox('', seed.den, seed.num, ''), ' = ', mixedNumberBox('', '', seed.den, seed.whole, seed.rem || '', ''));
    card.append(see, result);
    return card;
  }

  function makeMixedAxisCard(){
    const candidates = mixedSeeds().filter(s => s.num / s.den <= 4 && s.num % s.den !== 0);
    const seed = mixedValue(pickUnused('gi4_mixed_axis_seed', candidates) || pick(candidates));
    const max = Math.max(seed.whole + 1, 2);
    const card = document.createElement('div');
    card.className = 'gi4-mixed-axis-card row-delete-wrap';
    card.appendChild(rowDel(card));
    const axis = document.createElement('div');
    axis.className = 'gi4-mixed-axis';
    const axisPos = axisPct(seed.num / seed.den, max);
    axis.style.setProperty('--pos', `${axisPos}%`);
    const marker = document.createElement('div');
    marker.className = 'gi4-mixed-axis-marker';
    if (axisPos > 72) marker.classList.add('edge-right');
    if (axisPos < 28) marker.classList.add('edge-left');
    const wholeLine = lineWithSolution(String(seed.whole), 'gi4-mixed-axis-whole-line');
    const restFraction = document.createElement('span');
    restFraction.className = 'gi4-mixed-axis-rest';
    restFraction.innerHTML = '<span>·</span><i></i><span>·</span>';
    restFraction.firstElementChild.appendChild(sol(String(seed.rem)));
    restFraction.lastElementChild.appendChild(sol(String(seed.den)));
    marker.append(fractionBox(seed.num, seed.den), ' = ', wholeLine, restFraction);
    axis.appendChild(marker);
    for (let i = 0; i <= max; i++) {
      const lab = document.createElement('span');
      lab.style.left = `${axisPct(i, max)}%`;
      lab.textContent = i;
      axis.appendChild(lab);
    }
    for (let i = 1; i < max * seed.den; i++) {
      const tick = document.createElement('i');
      tick.style.left = `${axisPct(i, max * seed.den)}%`;
      if (i % seed.den === 0) tick.classList.add('whole');
      axis.appendChild(tick);
    }
    const sum = document.createElement('div');
    sum.className = 'gi4-mixed-axis-sum';
    sum.append(fractionBox(seed.num, seed.den), ' = ');
    for (let i = 0; i < seed.whole; i++) {
      sum.append(fractionBox('', seed.den, seed.den, ''));
      if (i < seed.whole - 1 || seed.rem) sum.append(' + ');
    }
    if (seed.rem) sum.append(fractionBox('', seed.den, seed.rem, ''));
    sum.append(' = ', mixedNumberBox('', '', seed.den, seed.whole, seed.rem || '', ''));
    card.append(axis, sum);
    return card;
  }

  function makeMixedConnectCard(){
    const picked = shuffledMixedSeeds('gi4_mixed_connect_seed', 6);
    const seeds = picked.map(mixedValue);
    const card = document.createElement('div');
    card.className = 'gi4-mixed-connect-card row-delete-wrap';
    card.appendChild(rowDel(card));
    const top = document.createElement('div');
    top.className = 'gi4-mixed-connect-row';
    const bottom = document.createElement('div');
    bottom.className = 'gi4-mixed-connect-row bottom';
    seeds.forEach(seed => {
      const tile = document.createElement('div');
      tile.className = 'gi4-mixed-tile';
      tile.dataset.value = `${seed.num}/${seed.den}`;
      tile.append(fractionBox(seed.num, seed.den), Object.assign(document.createElement('span'), { className: 'gi4-connect-dot right' }));
      top.appendChild(tile);
    });
    const order = [2, 4, 0, 5, 1, 3].filter(i => i < seeds.length);
    order.map(i => seeds[i]).forEach(seed => {
      const tile = document.createElement('div');
      tile.className = 'gi4-mixed-tile';
      tile.dataset.value = `${seed.num}/${seed.den}`;
      tile.append(mixedNumberBox(seed.whole, seed.rem || '', seed.rem ? seed.den : ''), Object.assign(document.createElement('span'), { className: 'gi4-connect-dot left' }));
      bottom.appendChild(tile);
    });
    card.append(top, bottom);
    return card;
  }

  function makeMixedTableCard(){
    const picked = shuffledMixedSeeds('gi4_mixed_table_seed', 5);
    const rows = picked.map(mixedValue);
    const card = document.createElement('div');
    card.className = 'gi4-mixed-table-card row-delete-wrap';
    card.appendChild(rowDel(card));
    const table = document.createElement('table');
    table.innerHTML = '<tr><th>onechte breuk</th><th>gemengd getal</th></tr>';
    rows.forEach((seed, idx) => {
      const tr = document.createElement('tr');
      const a = document.createElement('td');
      const b = document.createElement('td');
      if (idx % 2 === 0) {
        a.appendChild(fractionBox('', '', seed.num, seed.den));
        b.appendChild(mixedNumberBox(seed.whole, seed.rem || '', seed.rem ? seed.den : ''));
      } else {
        a.appendChild(fractionBox(seed.num, seed.den));
        b.appendChild(mixedNumberBox('', '', seed.den, seed.whole, seed.rem || '', ''));
      }
      tr.append(a, b);
      table.appendChild(tr);
    });
    card.appendChild(table);
    return card;
  }

  function makeMixedSolveCard(){
    const pool = [
      { a: [8, 10], op: '+', b: [7, 10], w: 1, r: 5, d: 10, blankB: true },
      { a: [3, 4], op: '+', b: [10, 4], w: 3, r: 1, d: 4 },
      { a: [16, 5], op: '-', b: [7, 5], w: 1, r: 4, d: 5 },
      { a: [4, 7], op: '+', b: [9, 7], w: 1, r: 6, d: 7 },
      { a: [9, 5], op: '-', b: [4, 5], w: 1, r: 1, d: 5, blankB: true },
      { a: [11, 8], op: '-', b: [3, 8], w: 1, r: 0, d: 8, blankA: true },
      { a: [5, 6], op: '+', b: [7, 6], w: 2, r: 0, d: 6, blankB: true },
      { a: [14, 9], op: '-', b: [5, 9], w: 1, r: 0, d: 9 },
      { a: [6, 8], op: '+', b: [7, 8], w: 1, r: 5, d: 8, blankB: true },
      { a: [15, 4], op: '-', b: [6, 4], w: 2, r: 1, d: 4 },
      { a: [7, 3], op: '+', b: [5, 3], w: 4, r: 0, d: 3 },
      { a: [13, 10], op: '+', b: [9, 10], w: 2, r: 2, d: 10, blankB: true },
    ];
    const selected = [];
    const poolLeft = [...pool];
    for (let i = 0; i < 6 && poolLeft.length; i++) {
      const next = pickUnused(`gi4_mixed_solve_seed_${i}`, poolLeft, item => `${item.a.join('/')}${item.op}${item.b.join('/')}`);
      if (!next) break;
      selected.push(next);
      poolLeft.splice(poolLeft.indexOf(next), 1);
    }
    if (selected.length < 6) {
      [...pool].sort(() => Math.random() - .5).some(item => {
        if (selected.includes(item)) return false;
        selected.push(item);
        return selected.length >= 6;
      });
    }
    const card = document.createElement('div');
    card.className = 'gi4-mixed-solve-card row-delete-wrap';
    card.appendChild(rowDel(card));
    selected.forEach(item => {
      const row = document.createElement('div');
      row.className = 'gi4-mixed-solve-row';
      const answer = item.r
        ? mixedNumberBox(item.w, '', item.d, '', item.r, '')
        : lineWithSolution(String(item.w), 'small');
      row.append(
        fractionBox(item.blankA ? '' : item.a[0], item.blankA ? '' : item.a[1], item.a[0], item.a[1]),
        ` ${item.op} `,
        fractionBox(item.blankB ? '' : item.b[0], item.blankB ? '' : item.b[1], item.b[0], item.b[1]),
        ' = ',
        answer
      );
      card.appendChild(row);
    });
    return card;
  }

  function mixedPartsFromImproper(num, den){
    return { whole: Math.floor(num / den), rem: num % den, den, num };
  }

  function mixedBoxFromImproper(num, den, blank = false){
    const m = mixedPartsFromImproper(num, den);
    if (!m.rem) {
      if (blank) return lineWithSolution(String(m.whole), 'small');
      const whole = document.createElement('span');
      whole.className = 'gi4-mixed-number gi4-mixed-whole-only';
      whole.textContent = String(m.whole);
      return whole;
    }
    if (!blank) return mixedNumberBox(m.whole, m.rem || '', m.rem ? den : '');
    return mixedNumberBox('', '', m.rem ? den : '', String(m.whole), m.rem ? String(m.rem) : '', '');
  }

  function mixedPlain(whole, rem, den){
    const span = document.createElement('span');
    span.className = 'gi4-mixed-plain';
    if (!rem) {
      span.textContent = String(whole);
      return span;
    }
    span.append(String(whole), fractionBox(rem, den));
    return span;
  }

  function fillMixedAxis(axis, max, den){
    axis.style.setProperty('--segments', String(max * den));
    for (let i = 0; i <= max; i++) {
      const lab = document.createElement('span');
      lab.className = 'gi4-mixed-order-axis-label';
      lab.style.left = `${axisPct(i, max)}%`;
      lab.textContent = i;
      axis.appendChild(lab);
    }
    for (let i = 0; i <= max * den; i++) {
      const tick = document.createElement('i');
      tick.dataset.value = String(i);
      tick.style.left = `${axisPct(i, max * den)}%`;
      if (i % den === 0) tick.classList.add('whole');
      axis.appendChild(tick);
    }
  }

  function makeMixedOrderStrip(max, den, filled){
    const strip = document.createElement('div');
    strip.className = 'gi4-mixed-order-strip';
    strip.style.setProperty('--segments', String(max * den));
    for (let i = 0; i < max * den; i++) {
      const cell = document.createElement('span');
      if (i < filled) cell.classList.add('filled');
      strip.appendChild(cell);
    }
    return strip;
  }

  function makeMixedOrderExplainCard(){
    const card = document.createElement('div');
    card.className = 'gi4-mixed-order-explain row-delete-wrap';
    card.appendChild(rowDel(card));
    const text = document.createElement('div');
    text.className = 'gi4-mixed-order-text';
    text.innerHTML = '<strong>Onthoud</strong><p>Elk stuk tussen twee natuurlijke getallen kan je verdelen in gelijke breukdelen.</p><p>Voor 1 schrijf je een echte breuk. Na 1 schrijf je eerst het geheel en daarna het breukdeel.</p>';
    const axis = document.createElement('div');
    axis.className = 'gi4-mixed-order-demo-axis';
    fillMixedAxis(axis, 2, 4);
    [
      [1, '1/4'], [2, '2/4'], [3, '3/4'],
      [5, '1 1/4'], [6, '1 2/4'], [7, '1 3/4']
    ].forEach(([step, node]) => {
      const lab = document.createElement('div');
      lab.className = 'gi4-mixed-order-demo-label';
      lab.style.left = `${axisPct(step, 8)}%`;
      lab.textContent = node;
      axis.appendChild(lab);
    });
    const order = document.createElement('div');
    order.className = 'gi4-mixed-order-chain';
    order.innerHTML = '<span class="natural">0</span> &lt; 1/4 &lt; 2/4 &lt; 3/4 &lt; <span class="natural">1</span> &lt; 1 1/4 &lt; 1 2/4 &lt; 1 3/4 &lt; <span class="natural">2</span>';
    card.append(text, axis, order);
    return card;
  }

  function makeMixedOrderStripAxisCard(){
    const seed = makeUnique('gi4_mixed_order_strip_axis_seed', () => {
      const den = pick([3, 4, 5, 6]);
      const max = pick([2, 3, 4]);
      const whole = rnd(1, max - 1);
      const rem = rnd(1, den - 1);
      return { den, max, filled: whole * den + rem };
    }) || { den: 4, max: 2, filled: 5 };
    const card = document.createElement('div');
    card.className = 'gi4-mixed-order-card gi4-mixed-strip-axis-card row-delete-wrap';
    card.appendChild(rowDel(card));
    const axis = document.createElement('div');
    axis.className = 'gi4-mixed-order-axis';
    fillMixedAxis(axis, seed.max, seed.den);
    const neighbor = seed.filled + 2 < seed.max * seed.den ? seed.filled + 2 : seed.filled - 2;
    [seed.filled, neighbor].filter(v => v > 0 && v < seed.max * seed.den).forEach((value, idx) => {
      const marker = document.createElement('div');
      marker.className = `gi4-mixed-order-marker ${value === seed.filled ? 'blue' : 'gray'} ${idx % 2 ? 'bottom' : 'top'}`;
      marker.style.left = `${axisPct(value, seed.max * seed.den)}%`;
      marker.appendChild(mixedBoxFromImproper(value, seed.den, true));
      axis.appendChild(marker);
    });
    card.append(axis, makeMixedOrderStrip(seed.max, seed.den, seed.filled));
    return card;
  }

  function makeMixedBetweenNaturalsCard(){
    const seed = makeUnique('gi4_mixed_between_seed', () => {
      const den = pick([3, 4, 5, 6]);
      const start = pick([1, 2]);
      const count = pick([3, 4]);
      const nums = Array.from({ length: den - 1 }, (_, i) => start * den + i + 1).sort(() => Math.random() - .5).slice(0, count).sort((a, b) => a - b);
      return { den, start, max: start + 1, nums };
    }) || { den: 4, start: 1, max: 2, nums: [5, 6, 7] };
    const card = document.createElement('div');
    card.className = 'gi4-mixed-order-card gi4-mixed-between-card row-delete-wrap';
    card.appendChild(rowDel(card));
    const axis = document.createElement('div');
    axis.className = 'gi4-mixed-order-axis';
    fillMixedAxis(axis, seed.max, seed.den);
    seed.nums.forEach((value, idx) => {
      const marker = document.createElement('div');
      marker.className = `gi4-mixed-order-marker gray ${idx % 2 ? 'bottom' : 'top'}`;
      marker.style.left = `${axisPct(value, seed.max * seed.den)}%`;
      marker.appendChild(mixedBoxFromImproper(value, seed.den, true));
      axis.appendChild(marker);
    });
    const sentence = document.createElement('div');
    sentence.className = 'gi4-mixed-order-sentence';
    sentence.append('De gemengde getallen ');
    seed.nums.forEach((value, idx) => {
      if (idx) sentence.append(idx === seed.nums.length - 1 ? ' en ' : ', ');
      sentence.appendChild(mixedBoxFromImproper(value, seed.den, true));
    });
    sentence.append(' liggen tussen de natuurlijke getallen ', lineWithSolution(seed.start, 'small'), ' en ', lineWithSolution(seed.start + 1, 'small'), '.');
    card.append(axis, sentence);
    return card;
  }

  function makeMixedAxisConnectOrderCard(){
    const seed = makeUnique('gi4_mixed_axis_connect_order_seed', () => {
      const den = pick([4, 6]);
      const values = Array.from({ length: den - 1 }, (_, i) => den + i + 1).sort(() => Math.random() - .5).slice(0, den === 4 ? 3 : 5);
      return { den, max: 2, values: values.sort((a, b) => a - b) };
    }) || { den: 4, max: 2, values: [5, 6, 7] };
    const card = document.createElement('div');
    card.className = 'gi4-mixed-order-card gi4-mixed-axis-connect-order row-delete-wrap';
    card.appendChild(rowDel(card));
    const axis = document.createElement('div');
    axis.className = 'gi4-mixed-order-axis';
    fillMixedAxis(axis, seed.max, seed.den);
    const cards = document.createElement('div');
    cards.className = 'gi4-mixed-axis-connect-cards';
    cards.style.setProperty('--connect-count', seed.values.length);
    seed.values.sort(() => Math.random() - .5).forEach(value => {
      const tile = document.createElement('div');
      tile.className = 'gi4-mixed-order-connect-tile';
      tile.dataset.value = String(value);
      tile.append(mixedBoxFromImproper(value, seed.den), Object.assign(document.createElement('span'), { className: 'gi4-connect-dot top' }));
      cards.appendChild(tile);
    });
    const compare = document.createElement('div');
    compare.className = 'gi4-mixed-order-compare';
    [[seed.values[0], seed.values[1]], [seed.den * 2, seed.values.at(-1)], [seed.values[1], seed.values.at(-1)]].forEach(([a, b]) => {
      const row = document.createElement('span');
      row.append(mixedBoxFromImproper(a, seed.den), lineWithSolution(a < b ? '<' : a > b ? '>' : '=', 'small'), mixedBoxFromImproper(b, seed.den));
      compare.appendChild(row);
    });
    card.append(axis, cards, compare);
    return card;
  }

  function makeMixedSequenceCard(rowCount = 3){
    const rows = [
      { den: 3, start: 3, count: 7 },
      { den: 7, start: 25, count: 7 },
      { den: 5, start: 5, count: 7 },
      { den: 4, start: 4, count: 7 },
      { den: 6, start: 8, count: 7 },
      { den: 8, start: 16, count: 7 },
    ].slice(0, Math.max(1, Math.min(6, rowCount)));
    const card = document.createElement('div');
    card.className = 'gi4-mixed-sequence-card row-delete-wrap';
    card.appendChild(rowDel(card));
    rows.forEach((rowSeed, rowIndex) => {
      const row = document.createElement('div');
      row.className = `gi4-mixed-sequence-row color-${rowIndex + 1}`;
      for (let i = 0; i < rowSeed.count; i++) {
        const value = rowSeed.start + i;
        const blank = [3, 5].includes(i) || (rowIndex === 2 && [1, 3, 4, 6].includes(i));
        const tile = document.createElement('div');
        tile.className = 'gi4-mixed-sequence-tile';
        tile.appendChild(mixedBoxFromImproper(value, rowSeed.den, blank));
        row.appendChild(tile);
      }
      card.appendChild(row);
    });
    return card;
  }

  function makeMixedBeforeAfterCard(rowCount = 4){
    const seeds = shuffledMixedSeeds('gi4_mixed_before_after_seed', Math.max(1, Math.min(8, rowCount)), mixedSeeds().filter(s => s.num / s.den <= 4));
    const card = document.createElement('div');
    card.className = 'gi4-mixed-before-after-card row-delete-wrap';
    card.appendChild(rowDel(card));
    const table = document.createElement('table');
    table.innerHTML = '<tr><th>net voor</th><th>breuk</th><th>net na</th></tr>';
    seeds.forEach(seed => {
      const tr = document.createElement('tr');
      const before = document.createElement('td');
      const middle = document.createElement('td');
      const after = document.createElement('td');
      before.appendChild(mixedBoxFromImproper(Math.max(0, seed.num - 1), seed.den, true));
      middle.appendChild(fractionBox(seed.num, seed.den));
      after.appendChild(mixedBoxFromImproper(seed.num + 1, seed.den, true));
      tr.append(before, middle, after);
      table.appendChild(tr);
    });
    card.appendChild(table);
    return card;
  }

  function makeMixedCard(mode, amount){
    if (mode === 'explain') return makeMixedExplainCard();
    if (mode === 'classify') return makeMixedClassifyCard();
    if (mode === 'visual') return makeMixedVisualCard();
    if (mode === 'axis') return makeMixedAxisCard();
    if (mode === 'connect') return makeMixedConnectCard();
    if (mode === 'table') return makeMixedTableCard();
    if (mode === 'solve') return makeMixedSolveCard();
    if (mode === 'orderExplain') return makeMixedOrderExplainCard();
    if (mode === 'orderStripAxis') return makeMixedOrderStripAxisCard();
    if (mode === 'betweenNaturals') return makeMixedBetweenNaturalsCard();
    if (mode === 'axisConnectOrder') return makeMixedAxisConnectOrderCard();
    if (mode === 'mixedSequence') return makeMixedSequenceCard(amount);
    if (mode === 'mixedBeforeAfter') return makeMixedBeforeAfterCard(amount);
    return makeMixedConvertCard();
  }

  function mixedTitle(mode){
    if (mode === 'explain') return 'Onechte breuken en gemengde getallen: kijk en leer.';
    if (mode === 'classify') return 'Kleur de soorten breuken.';
    if (mode === 'visual') return 'Schrijf als onechte breuk en als gemengd getal.';
    if (mode === 'axis') return 'Zet de onechte breuk om naar een gemengd getal.';
    if (mode === 'connect') return 'Verbind wat evenveel is.';
    if (mode === 'table') return 'Zet om tussen onechte breuk en gemengd getal.';
    if (mode === 'solve') return 'Onechte breuken en gemengde getallen: los op.';
    if (mode === 'orderExplain') return 'Gemengde getallen op een getallenlijn.';
    if (mode === 'orderStripAxis') return 'Welk gemengd getal hoort bij de strokenvoorstelling?';
    if (mode === 'betweenNaturals') return 'Welke gemengde getallen liggen tussen de natuurlijke getallen?';
    if (mode === 'axisConnectOrder') return 'Verbind de gemengde getallen met de juiste plaats op de as.';
    if (mode === 'mixedSequence') return 'Vul in elke rij de ontbrekende gemengde getallen in.';
    if (mode === 'mixedBeforeAfter') return 'Wat komt net voor? Wat komt net na?';
    return 'Van onechte breuk naar gemengd getal.';
  }

  function mixedInstructions(mode){
    if (mode === 'explain') return [];
    if (mode === 'classify') return ['Kleur de <strong>stambreuken</strong>, de <strong>onechte breuken</strong> en de <strong>gemengde getallen</strong>.', 'Vul aan.'];
    if (mode === 'visual') return ['Vul in.', 'Schrijf als <strong>onechte breuk</strong> en als <strong>gemengd getal</strong>.'];
    if (mode === 'axis') return ['Welk gemengd getal hoort bij de onechte breuk?', 'Schrijf het gemengd getal ook op de getallenlijn.', '<strong>Tip!</strong> Zoek eerst de gehelen.'];
    if (mode === 'connect') return ['Verbind wat evenveel is.'];
    if (mode === 'table') return ['Schrijf de onechte breuken als gemengd getal.', 'Schrijf de gemengde getallen als onechte breuken.'];
    if (mode === 'solve') return ['Los op.'];
    if (mode === 'orderExplain') return [];
    if (mode === 'orderStripAxis') return ['Welk <strong>gemengd getal</strong> hoort bij de strokenvoorstelling?', 'Schrijf dat gemengd getal in het blauwe vak op de getallenlijn.', 'Vul daarna de overige gemengde getallen aan in de grijze vakken.'];
    if (mode === 'betweenNaturals') return ['Welke gemengde getallen liggen tussen de natuurlijke getallen?', 'Vul de gemengde getallen aan.'];
    if (mode === 'axisConnectOrder') return ['Verbind de gemengde getallen met de juiste plaats op de as.', 'Vul in: &lt; of &gt;.'];
    if (mode === 'mixedSequence') return ['Vul in elke rij de ontbrekende getallen in.'];
    if (mode === 'mixedBeforeAfter') return ['Wat komt net voor? Wat komt net na?', 'Vul de gemengde getallen aan.'];
    return ['Kleur de <strong>onechte breuken</strong>.', 'Wissel in. Kleur de gehelen en de overige breukdelen.', 'Vul aan.', 'Schrijf het <strong>gemengd getal</strong>.'];
  }

  function addFractionMixed(extraCount, forcedMode){
    const mode = forcedMode || $('#fractionMixedMode')?.value || 'explain';
    const key = `gi4_fraction_mixed_${mode}`;
    const requested = Math.max(1, Math.min(8, parseInt($('#fractionMixedCount').value, 10) || 3));
    const singleCardModes = new Set(['explain', 'orderExplain', 'mixedSequence', 'mixedBeforeAfter']);
    const count = singleCardModes.has(mode) ? 1 : (extraCount || requested);
    if (extraCount) {
      const existing = containerInLastBlock(key, `.gi4-mixed-grid.${mode}`, `gi4-mixed-grid ${mode}`);
      if (existing) {
        for (let i = 0; i < count; i++) appendNewExercise(existing, () => makeMixedCard(mode, requested));
        return;
      }
    }
    const b = block(key, mixedTitle(mode), mode === 'orderExplain' ? null : addCount => addFractionMixed(addCount || 1, mode));
    const instructions = mixedInstructions(mode);
    if (instructions.length) addFractionInstructions(b, instructions);
    const grid = document.createElement('div');
    grid.className = `gi4-mixed-grid ${mode}`;
    for (let i = 0; i < count; i++) appendNewExercise(grid, () => makeMixedCard(mode, requested));
    b.appendChild(grid);
    if (mode !== 'explain' && mode !== 'orderExplain') addLocalExerciseButton(b, '+ oefening bij deze keuze', () => addFractionMixed(1, mode));
  }

  function bind(id, fn){
    const el = $(id);
    if (!el) return;
    let lock = false;
    el.addEventListener('click', () => {
      if (lock) return;
      lock = true;
      try { fn(); } finally { setTimeout(() => lock = false, 250); }
    });
  }

  function attachSidebarButtons(){
    document.querySelectorAll('.sidebar-content > .btn-toevoegen').forEach(btn => {
      const card = btn.previousElementSibling;
      if (card?.classList.contains('config-kaart')) {
        card.appendChild(btn);
        btn.classList.add('in-config');
      }
    });
  }

  function removeSolutionLines(){
    sheet.querySelectorAll('.gi4-solution-svg').forEach(svg => svg.remove());
  }

  function svgSolutionLine(x1, y1, x2, y2){
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1.toFixed(1));
    line.setAttribute('y1', y1.toFixed(1));
    line.setAttribute('x2', x2.toFixed(1));
    line.setAttribute('y2', y2.toFixed(1));
    return line;
  }

  function svgSolutionDot(x, y, r = 3.4){
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', x.toFixed(1));
    dot.setAttribute('cy', y.toFixed(1));
    dot.setAttribute('r', r.toFixed(1));
    return dot;
  }

  function makeOverlay(target, className){
    const rect = target.getBoundingClientRect();
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('gi4-solution-svg', className);
    svg.setAttribute('width', rect.width);
    svg.setAttribute('height', rect.height);
    svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
    return svg;
  }

  function centerRelative(el, root){
    const a = el.getBoundingClientRect();
    const b = root.getBoundingClientRect();
    return {
      x: a.left - b.left + a.width / 2,
      y: a.top - b.top + a.height / 2,
    };
  }

  function drawConnectSolutionLines(){
    sheet.querySelectorAll('.gi4-connect-list').forEach(wrap => {
      const rows = Array.from(wrap.querySelectorAll('.gi4-connect-row'));
      if (!rows.length) return;
      const svg = makeOverlay(wrap, 'gi4-connect-solution-svg');
      rows.forEach(sourceRow => {
        const number = sourceRow.dataset.number;
        const targetRow = rows.find(row => row.dataset.answer === number);
        if (!targetRow) return;
        const from = sourceRow.querySelector('.gi4-connect-dot.left');
        const to = targetRow.querySelector('.gi4-connect-dot.right');
        if (!from || !to) return;
        const p1 = centerRelative(from, wrap);
        const p2 = centerRelative(to, wrap);
        svg.appendChild(svgSolutionLine(p1.x, p1.y, p2.x, p2.y));
      });
      wrap.appendChild(svg);
    });
  }

  function drawMixedConnectSolutionLines(){
    sheet.querySelectorAll('.gi4-mixed-connect-card').forEach(card => {
      const topTiles = Array.from(card.querySelectorAll('.gi4-mixed-connect-row:first-of-type .gi4-mixed-tile'));
      const bottomTiles = Array.from(card.querySelectorAll('.gi4-mixed-connect-row:last-of-type .gi4-mixed-tile'));
      if (!topTiles.length || !bottomTiles.length) return;
      const svg = makeOverlay(card, 'gi4-connect-solution-svg');
      topTiles.forEach(top => {
        const target = bottomTiles.find(tile => tile.dataset.value === top.dataset.value);
        if (!target) return;
        const from = top.querySelector('.gi4-connect-dot.right');
        const to = target.querySelector('.gi4-connect-dot.left');
        if (!from || !to) return;
        const p1 = centerRelative(from, card);
        const p2 = centerRelative(to, card);
        svg.appendChild(svgSolutionLine(p1.x, p1.y, p2.x, p2.y));
      });
      card.appendChild(svg);
    });
  }

  function drawAxisConnectSolutionLines(){
    sheet.querySelectorAll('.gi4-axis-connect-row').forEach(row => {
      const axis = row.querySelector('.gi4-axis-connect-axis');
      const axisLine = row.querySelector('.gi4-axis-connect-line');
      const cards = Array.from(row.querySelectorAll('.gi4-axis-connect-card'));
      const start = parseInt(row.dataset.axisStart, 10);
      const range = parseInt(row.dataset.axisRange, 10);
      if (!axis || !axisLine || !cards.length || !Number.isFinite(start) || !Number.isFinite(range) || range <= 0) return;
      const svg = makeOverlay(row, 'gi4-axis-connect-solution-svg');
      const rowRect = row.getBoundingClientRect();
      const lineRect = axisLine.getBoundingClientRect();
      cards.forEach(card => {
        const value = parseInt(card.dataset.value, 10);
        if (!Number.isFinite(value)) return;
        const cardRect = card.getBoundingClientRect();
        const x1 = cardRect.left - rowRect.left + cardRect.width / 2;
        const y1 = cardRect.top - rowRect.top - 8;
        const tick = axis.querySelector(`span[data-value="${value}"]`);
        const tickRect = tick?.getBoundingClientRect();
        const x2 = tickRect
          ? tickRect.left - rowRect.left + tickRect.width / 2
          : lineRect.left - rowRect.left + ((value - start) / range) * lineRect.width;
        const y2 = lineRect.top - rowRect.top + 11;
        svg.appendChild(svgSolutionLine(x1, y1, x2, y2));
        svg.appendChild(svgSolutionDot(x2, y2, 3.2));
      });
      row.appendChild(svg);
    });
  }

  function drawMixedAxisConnectSolutionLines(){
    sheet.querySelectorAll('.gi4-mixed-axis-connect-order').forEach(card => {
      const axis = card.querySelector('.gi4-mixed-order-axis');
      const tiles = Array.from(card.querySelectorAll('.gi4-mixed-order-connect-tile'));
      if (!axis || !tiles.length) return;
      const den = Math.max(...tiles.map(tile => {
        const frac = tile.querySelector('.gi4-fraction-box');
        return parseInt(frac?.lastElementChild?.textContent || '0', 10);
      }).filter(Number.isFinite));
      const maxLabel = Math.max(...Array.from(axis.querySelectorAll('.gi4-mixed-order-axis-label'))
        .map(label => parseInt(label.textContent || '0', 10))
        .filter(Number.isFinite));
      if (!Number.isFinite(den) || den <= 0 || !Number.isFinite(maxLabel) || maxLabel <= 0) return;
      const svg = makeOverlay(card, 'gi4-mixed-axis-connect-solution-svg');
      const cardRect = card.getBoundingClientRect();
      const axisRect = axis.getBoundingClientRect();
      const axisY = axisRect.bottom - cardRect.top;
      tiles.forEach(tile => {
        const value = parseInt(tile.dataset.value, 10);
        if (!Number.isFinite(value)) return;
        const dot = tile.querySelector('.gi4-connect-dot.top') || tile;
        const p1 = centerRelative(dot, card);
        const tick = axis.querySelector(`i[data-value="${value}"]`);
        const tickRect = tick?.getBoundingClientRect();
        const x2 = tickRect
          ? tickRect.left - cardRect.left + tickRect.width / 2
          : axisRect.left - cardRect.left + axisPct(value, maxLabel * den) / 100 * axisRect.width;
        const y2 = axisY + 20;
        svg.appendChild(svgSolutionLine(p1.x, p1.y, x2, y2));
        svg.appendChild(svgSolutionDot(x2, y2, 3.2));
      });
      card.appendChild(svg);
    });
  }

  function drawSolutionLines(){
    removeSolutionLines();
    if (!sheet.classList.contains('solutions-mode')) return;
    drawConnectSolutionLines();
    drawMixedConnectSolutionLines();
    drawAxisConnectSolutionLines();
    drawMixedAxisConnectSolutionLines();
  }

  function setSolutionsMode(on){
    sheet.classList.toggle('solutions-mode', on);
    document.body.classList.toggle('solutions-mode', on);
    const btn = $('#btnToggleSolutions');
    if (btn) btn.textContent = on ? 'Verberg oplossingen' : 'Toon oplossingen';
    const title = sheet.querySelector('.sheetHeader h2');
    if (title) {
      if (on) {
        if (!title.dataset.baseTitle) title.dataset.baseTitle = title.textContent;
        if (!/oplossingen/i.test(title.textContent)) title.textContent = `${title.textContent} - oplossingen`;
      } else if (title.dataset.baseTitle) {
        title.textContent = title.dataset.baseTitle;
        delete title.dataset.baseTitle;
      }
    }
    requestAnimationFrame(drawSolutionLines);
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderSheetHeader();
    attachSidebarButtons();
    bind('#btnAddSplit', addSplit);
    bind('#btnAddNeighbors', addNeighbors);
    bind('#btnAddMaterial', addMaterial);
    bind('#btnAddConnect', addConnect);
    bind('#btnAddComplete', addComplete);
    bind('#btnAddAxis', addAxis);
    bind('#btnAddAxisConnect', addAxisConnect);
    bind('#btnAddJumps', addJumps);
    bind('#btnAddCompare', addCompare);
    bind('#btnAddOrder', addOrder);
    bind('#btnAddValueCards', addValueCards);
    bind('#btnAddEquiv', addEquiv);
    bind('#btnAddFractionParts', addFractionParts);
    bind('#btnAddFractionColor', addFractionColor);
    bind('#btnAddFractionLines', addFractionLines);
    bind('#btnAddFractionConcepts', addFractionConcepts);
    bind('#btnAddFractionWhole', addFractionWhole);
    bind('#btnAddFractionEquiv', addFractionEquiv);
    bind('#btnAddFractionCommon', addFractionCommon);
    bind('#btnAddFractionCompare', addFractionCompare);
    bind('#btnAddFractionEstimate', addFractionEstimate);
    bind('#btnAddFractionMixed', addFractionMixed);
    $('#btnToggleSolutions')?.addEventListener('click', () => setSolutionsMode(!sheet.classList.contains('solutions-mode')));
    $('#btnDownloadSolutions')?.addEventListener('click', async () => {
      const wasOn = sheet.classList.contains('solutions-mode');
      setSolutionsMode(true);
      await window.GI_Pdf?.maakPdf?.('verbetersleutel-getalinzicht.pdf', { solutions: true });
      if (!wasOn) setSolutionsMode(false);
    });
    $('#btnClearSheet')?.addEventListener('click', () => {
      sheet.innerHTML = '';
      titles.clear();
      usedExerciseSignatures.clear();
      setSolutionsMode(false);
      renderSheetHeader();
    });
    window.GI4DrawSolutionLines = drawSolutionLines;
    window.GI4SetSolutionsMode = setSolutionsMode;
  });
})();
