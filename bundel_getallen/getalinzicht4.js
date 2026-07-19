// @ts-nocheck
(function(){
  const $ = sel => document.querySelector(sel);
  const sheet = $('#sheet');
  const titles = new Set();
  const addFns = {};
  const usedExerciseSignatures = new Set();
  const PLACE = [
    { key: 'td', label: 'TD', color: 'gi4-td', value: 10000 },
    { key: 'd', label: 'D', color: 'gi4-d', value: 1000 },
    { key: 'h', label: 'H', color: 'gi4-h', value: 100 },
    { key: 't', label: 'T', color: 'gi4-t', value: 10 },
    { key: 'e', label: 'E', color: 'gi4-e', value: 1 },
  ];
  const levelState = { level: 'grade4', range: 'auto' };

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
  function activeRange(){
    if (levelState.range === '10000') return 10000;
    if (levelState.range === '100000') return 100000;
    return levelState.level === 'grade4' ? 10000 : 100000;
  }
  function activeMax(){ return activeRange() === 100000 ? 99999 : 9999; }
  function activeMin(){ return activeRange() === 100000 ? 10000 : 1000; }
  function activePlaces(){
    return activeRange() === 100000 ? PLACE : PLACE.slice(1);
  }
  function placesForNumber(n){
    return n >= 10000 ? PLACE : PLACE.slice(1);
  }
  function placeExpansion(n){
    const ds = digits(n);
    return placesForNumber(n).map(p => `${ds[p.key]} ${p.label}`).join(' + ');
  }
  function placeQuestionText(){
    return activeRange() === 100000
      ? 'tienduizendtallen, duizendtallen, honderdtallen, tientallen en eenheden'
      : 'duizendtallen, honderdtallen, tientallen en eenheden';
  }
  function digits(n){
    return {
      td: Math.floor(n / 10000),
      d: Math.floor(n / 1000) % 10,
      h: Math.floor(n / 100) % 10,
      t: Math.floor(n / 10) % 10,
      e: n % 10,
    };
  }
  function numberFromDigits(ds){ return (ds.td || 0) * 10000 + ds.d * 1000 + ds.h * 100 + ds.t * 10 + ds.e; }
  function randomNumber(){ return rnd(activeMin(), activeMax()); }
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

  function appendToLastContainer(key, selector, className, maker, tag = 'div'){
    const existing = containerInLastBlock(key, selector, className, tag);
    if (!existing) return false;
    return appendNewExercise(existing, maker);
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

  function removeExerciseBlockGroup(key, currentBlock){
    const keys = key === 'gi4_g5_neighbors' || key === 'gi4_g5_neighbors_big'
      ? ['gi4_g5_neighbors', 'gi4_g5_neighbors_big']
      : [key];
    keys.forEach(k => {
      if (k === key) currentBlock?.remove();
      else document.querySelectorAll(`[data-title-key="${k}"]:not(.exercise-title)`).forEach(el => el.remove());
      removeTitleIfEmpty(k);
    });
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
      if (parent && parent.tagName === 'TBODY' && !parent.querySelector('tr')) {
        const tableCard = parent.closest('.row-delete-wrap');
        if (tableCard && tableCard !== target) tableCard.remove();
      }
      if (parent && parent.tagName !== 'TBODY' && !parent.querySelector(':scope > *:not(.row-delete-btn)')) parent.remove();
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
    const controls = document.createElement('div');
    controls.className = 'gi4-block-controls';
    if (addFn) {
      const add = document.createElement('button');
      add.type = 'button';
      add.className = 'title-add-btn gi4-block-add-btn';
      add.textContent = '+ oefening';
      add.addEventListener('click', () => addFns[key]?.(1));
      controls.appendChild(add);
    }
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'gi4-block-remove-btn';
    del.textContent = 'verwijder opdracht';
    del.addEventListener('click', () => {
      removeExerciseBlockGroup(key, b);
    });
    controls.appendChild(del);
    const nativeAppendChild = b.appendChild.bind(b);
    const nativeAppend = b.append.bind(b);
    nativeAppendChild(controls);
    b.appendChild = node => {
      if (node === controls) return nativeAppendChild(node);
      return b.insertBefore(node, controls);
    };
    b.append = (...nodes) => {
      nodes.forEach(node => b.insertBefore(typeof node === 'string' ? document.createTextNode(node) : node, controls));
    };
    const watchLocalButtons = () => {
      const explicit = b.querySelector('.gi4-local-add-btn');
      const generic = controls.querySelector('.gi4-block-add-btn');
      if (generic) generic.hidden = !!explicit;
    };
    new MutationObserver(watchLocalButtons).observe(b, { childList: true, subtree: true });
    if (blockTitle) {
      const t = document.createElement('div');
      t.className = 'gi4-block-title';
      t.textContent = blockTitle;
      b.appendChild(t);
    }
    placeBlock(b, key);
    watchLocalButtons();
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
    const places = placesForNumber(n);
    const row = document.createElement('div');
    row.className = 'gi4-row row-delete-wrap';
    row.appendChild(rowDel(row));
    if (example) {
      row.innerHTML += `<strong>${fmt(n)}</strong> = ${placeExpansion(n)}`;
    } else {
      const strong = document.createElement('strong');
      strong.textContent = fmt(n);
      row.append(strong, ' = ');
      places.forEach((p, i) => {
        if (i > 0) row.append(' + ');
        row.append(lineWithSolution(String(ds[p.key])), ` ${p.label}`);
      });
    }
    return row;
  }

  function addSplit(extraCount){
    const key = 'gi4_split';
    const count = extraCount || Math.max(1, parseInt($('#splitCount').value, 10) || 6);
    const withExample = !extraCount && $('#splitExample')?.checked;
    const b = block(key, `Splits de getallen in ${placeQuestionText()}.`, addSplit);
    const grid = document.createElement('div');
    grid.className = 'gi4-grid';
    uniqueNumbers(count).forEach((n, i) => grid.appendChild(makeSplitRow(n, withExample && i === 0)));
    b.appendChild(grid);
  }

  function placeExpressionForNumber(n, allowRegroup = true){
    const ds = digits(n);
    const places = placesForNumber(n);
    const terms = [];
    if (allowRegroup && activeRange() === 100000 && Math.random() < .35) {
      const thousands = ds.td * 10 + ds.d;
      if (thousands) terms.push(`${thousands} D`);
      if (ds.h) terms.push(`${ds.h} H`);
      if (ds.t) terms.push(`${ds.t} T`);
      if (ds.e) terms.push(`${ds.e} E`);
    } else {
      places.forEach(p => {
        if (ds[p.key]) terms.push(`${ds[p.key]} ${p.label}`);
      });
    }
    return terms.length ? terms.join(' ') : '0 E';
  }

  function makePlaceValuePracticeTable(rows){
    const places = activePlaces();
    const table = document.createElement('table');
    table.className = 'gi4-build-table';
    table.innerHTML = '<thead><tr>' + places.map(p => `<th class="${p.color}">${p.label}</th>`).join('') + '</tr></thead>';
    const body = document.createElement('tbody');
    for (let i = 0; i < rows; i++) {
      const tr = document.createElement('tr');
      places.forEach(() => {
        const td = document.createElement('td');
        td.appendChild(lineWithSolution('', 'short'));
        tr.appendChild(td);
      });
      body.appendChild(tr);
    }
    table.appendChild(body);
    return table;
  }

  function addBuildNumbers(extraCount){
    const key = 'gi4_build_numbers';
    const rows = extraCount || Math.max(2, parseInt($('#buildNumberCount')?.value, 10) || 5);
    const b = block(key, 'Schrijf de getallen. Gebruik indien nodig de plaatswaardekaart.', addBuildNumbers);
    const wrap = document.createElement('div');
    wrap.className = 'gi4-build-number-card row-delete-wrap';
    wrap.style.setProperty('--build-rows', String(rows));
    wrap.appendChild(rowDel(wrap));
    wrap.appendChild(makePlaceValuePracticeTable(rows));
    const list = document.createElement('div');
    list.className = 'gi4-build-number-list';
    uniqueNumbers(rows).forEach(n => {
      const row = document.createElement('div');
      row.className = 'gi4-build-number-row';
      row.append(document.createTextNode(`${placeExpressionForNumber(n)} = `), lineWithSolution(fmt(n), 'long'));
      list.appendChild(row);
    });
    wrap.appendChild(list);
    b.appendChild(wrap);
  }

  function previousMultiple(n, base){ return Math.floor(n / base) * base; }
  function nextMultiple(n, base){ return Math.ceil(n / base) * base; }

  function makeNeighborTable(kind, rows, example){
    const base = kind === 'number' ? 1 : kind === 'ten' ? 10 : kind === 'hundred' ? 100 : kind === 'thousand' ? 1000 : 10000;
    const labels = {
      number: ['vorig getal', 'volgend getal', 'gi4-neighbor-yellow'],
      ten: ['vorig tiental', 'volgend tiental', 'gi4-neighbor-green'],
      hundred: ['vorig honderdtal', 'volgend honderdtal', 'gi4-neighbor-blue'],
      thousand: ['vorig duizendtal', 'volgend duizendtal', 'gi4-neighbor-red'],
      tenThousand: ['vorig tienduizendtal', 'volgend tienduizendtal', 'gi4-neighbor-purple'],
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
    const includeTenThousands = activeRange() === 100000;
    const b = block(key, includeTenThousands
      ? 'Schrijf de buurgetallen, buurtientallen, buurhonderdtallen, buurtduizendtallen of buurtienduizendtallen.'
      : 'Schrijf de buurgetallen, buurtientallen, buurhonderdtallen of buurtduizendtallen.', addNeighbors);
    const grid = document.createElement('div');
    grid.className = 'gi4-neighbor-grid';
    const kinds = includeTenThousands ? ['number', 'ten', 'hundred', 'thousand', 'tenThousand'] : ['number', 'ten', 'hundred', 'thousand'];
    kinds.forEach(kind => grid.appendChild(makeNeighborTable(kind, nums, !extraCount)));
    b.appendChild(grid);
  }

  function placeTable(n, mode, opts = {}){
    const ds = digits(n);
    const places = opts.places || placesForNumber(n);
    const table = document.createElement('table');
    table.className = 'gi4-place-table';
    if (opts.compact) table.classList.add('compact');
    if (opts.connect) table.classList.add('connect');
    table.innerHTML = '<thead><tr>' + places.map(p => `<th class="${p.color}">${p.label}</th>`).join('') + '</tr></thead>';
    const tr = document.createElement('tr');
    places.forEach(p => {
      const td = document.createElement('td');
      const wrap = document.createElement('div');
      wrap.className = 'gi4-material';
      if (opts.compact) wrap.classList.add('compact');
      if (opts.connect) wrap.classList.add('connect');
      const amount = ds[p.key];
      const shape = mode === 'dots' || p.key === 'td' ? 'dot' : p.key;
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
      span.className = `gi4-dot ${key === 'td' ? 'gi4-td' : key === 'd' ? 'gi4-d' : key === 'h' ? 'gi4-h' : key === 't' ? 'gi4-t' : 'gi4-e'}`;
      if (opts.connect) span.classList.add('connect');
      span.textContent = key === 'td' ? '10 000' : key === 'd' ? '1000' : key === 'h' ? '100' : key === 't' ? '10' : '1';
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
    const places = placesForNumber(n);
    const p = document.createElement('div');
    p.className = 'gi4-pencil';
    if (places.length === 5) p.classList.add('wide');
    places.forEach(part => {
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

  function addMaterial(extraCount, forcedMode){
    const key = 'gi4_material';
    const count = extraCount || Math.max(1, parseInt($('#materialCount').value, 10) || 4);
    const mode = forcedMode || $('#materialMode').value;
    const b = block(key, `Hoeveel ${placeQuestionText()} zie je?`, addMaterial);
    const grid = document.createElement('div');
    grid.className = 'gi4-material-grid';
    uniqueNumbers(count).forEach(n => {
      const card = document.createElement('div');
      card.className = 'gi4-value-card row-delete-wrap';
      card.appendChild(rowDel(card));
      card.appendChild(placeTable(n, mode === 'mixed' ? pick(['blocks', 'dots']) : mode, { compact: true }));
      const ds = digits(n);
      const places = placesForNumber(n);
      const row = document.createElement('div');
      row.className = 'gi4-row';
      places.forEach((p, index) => {
        if (index > 0) row.append(' ');
        row.append(lineWithSolution(String(ds[p.key])), ` ${p.label}`);
      });
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
    if (target === 'tenThousand') {
      let n = rnd(11, 98) * 1000;
      if (n % 10000 === 0) n += 1000;
      return n;
    }
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
    const places = target === 'tenThousand' ? PLACE.slice(0, 2) : target === 'thousand' ? PLACE.slice(1, 3) : PLACE.slice(2, 4);
    const table = document.createElement('table');
    table.className = 'gi4-complete-table';
    table.innerHTML = '<thead><tr>' + places.map(p => `<th class="${p.color}">${p.label}</th>`).join('') + '</tr></thead>';
    const tr = document.createElement('tr');
    places.forEach(p => {
      const td = document.createElement('td');
      const wrap = document.createElement('div');
      wrap.className = 'gi4-complete-material';
      for (let i = 0; i < ds[p.key]; i++) wrap.appendChild(materialPiece('dot', p.key, { connect: true }));
      if ((target === 'tenThousand' && p.key === 'd') || (target === 'thousand' && p.key === 'h') || (target === 'hundred' && p.key === 't')) {
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
    const base = target === 'tenThousand' ? 10000 : target === 'thousand' ? 1000 : 100;
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
    const key = target === 'tenThousand' ? 'gi4_complete_ten_thousand' : target === 'thousand' ? 'gi4_complete_thousand' : 'gi4_complete_hundred';
    const count = extraCount || Math.max(1, parseInt($('#completeCount').value, 10) || 4);
    const example = !extraCount && $('#completeExample')?.checked;
    const title = target === 'tenThousand'
      ? 'Schrijf het getal. Teken bij tot het volgende tienduizendtal. Vul in.'
      : target === 'thousand'
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
    const places = placesForNumber(n);
    const card = document.createElement('div');
    card.className = 'gi4-connect-dot-card';
    if (places.length === 5) card.classList.add('wide');
    places.forEach(p => {
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
    let step = Math.max(1, parseInt($('#axisStep').value, 10) || 100);
    if (activeRange() === 10000 && step > 1000) step = 1000;
    const b = block(key, 'Vul de getallenassen aan.', addAxis);
    const wrap = document.createElement('div');
    wrap.className = 'gi4-axis';
    const maxStart = Math.max(activeMin(), activeMax() - step * 6);
    for (let r = 0; r < count; r++) {
      const item = makeUnique('gi4_axis_row', () => ({ step, start: Math.floor(rnd(activeMin(), maxStart) / step) * step }));
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
    const big = activeRange() === 100000;
    const item = makeUnique('gi4_axis_connect_row', () => ({
      fine,
      big,
      start: big
        ? (fine ? rnd(60, 90) * 1000 : rnd(15, 70) * 1000)
        : (fine ? rnd(60, 90) * 100 : rnd(45, 80) * 100)
    }));
    if (!item) return null;
    const { start } = item;
    const unit = big ? (fine ? 100 : 1000) : (fine ? 10 : 100);
    const range = big ? (fine ? 5000 : 20000) : (fine ? 500 : 2000);
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
    let step = Math.max(1, parseInt($('#jumpStep4').value, 10) || 100);
    if (activeRange() === 10000 && step > 1000) step = 1000;
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
      const maxStart = Math.max(activeMin(), activeMax() - step * 5);
      const item = makeUnique('gi4_jumps_row', () => ({
        mode,
        step,
        start: rnd(activeMin(), maxStart),
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
        const delta = pick(activeRange() === 100000
          ? [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000]
          : [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]);
        const sign = Math.random() < .5 ? -1 : 1;
        let bNum = equal ? a : a + sign * delta;
        if (bNum < activeMin() || bNum > activeMax()) bNum = a - sign * delta;
        if (bNum < activeMin() || bNum > activeMax()) bNum = randomNumber();
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
    const places = placesForNumber(n);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('gi4-value-work-svg');
    svg.setAttribute('viewBox', `0 0 430 ${places.length === 5 ? 235 : 205}`);
    svg.setAttribute('aria-hidden', 'true');

    const colors = places.map(p => p.key === 'td' ? '#b57de8' : p.key === 'd' ? '#ef2b2d' : p.key === 'h' ? '#6d95c7' : p.key === 't' ? '#4fb94f' : '#ffd414');
    const cardX = places.length === 5 ? 190 : 190;
    const cardY = 10;
    const cellW = 34;
    const cellH = 30;
    const digitCenters = places.map((_, i) => cardX + i * cellW + cellW / 2);

    if (mode === 'plain') {
      places.forEach((p, i) => {
        svg.appendChild(svgText(String(ds[p.key]), digitCenters[i], 33, {
          size: '21',
          weight: '700',
          anchor: 'middle',
        }));
      });
    } else {
      places.forEach((p, i) => {
        svg.appendChild(svgRect(cardX + i * cellW, cardY, cellW, cellH, colors[i], '#8a8f99'));
        svg.appendChild(svgText(String(ds[p.key]), cardX + i * cellW + cellW / 2, cardY + 20, {
          size: '16',
          weight: '900',
          anchor: 'middle',
        }));
      });
      svg.appendChild(svgPolygon(
        `${cardX + places.length * cellW},${cardY} ${cardX + places.length * cellW + 20},${cardY + cellH / 2} ${cardX + places.length * cellW},${cardY + cellH}`,
        '#ffd414',
        '#8a8f99'
      ));
    }

    const rows = places.map((p, i) => ({
      p,
      y: 82 + i * 32,
      x: digitCenters[i],
      kind: 'left',
    }));

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
        digitAnswer.classList.add('gi4-svg-solution-answer', 'solution-only');
        svg.appendChild(digitAnswer);
        svg.appendChild(svgText(`${p.label} =`, 70, y + 5, {
          size: '18',
          weight: '700',
        }));
        svg.appendChild(svgLine(112, y, 178, y, '#d8dee8', 1.4));
        const answer = svgText(fmt(val), 122, y - 5, {
          size: '18',
          weight: '800',
          fill: '#0f8dc4',
        });
        answer.classList.add('gi4-svg-solution-answer', 'solution-only');
        svg.appendChild(answer);
      }

      if (kind === 'down') {
        svg.appendChild(svgLine(x, cardY + cellH, x, y - 18, '#111827', 2.3));
        svg.appendChild(svgPolygon(`${x - 5},${y - 20} ${x + 5},${y - 20} ${x},${y - 11}`, '#111827', '#111827'));
      } else {
        const endX = example ? Math.min(178, x - 24) : 190;
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

  function addShortValues(extraCount){
    const key = 'gi4_short_values';
    const count = extraCount || Math.max(2, parseInt($('#shortValueCount')?.value, 10) || 6);
    const b = block(key, 'Schrijf de waarde van het aangeduide cijfer.', addShortValues);
    const grid = document.createElement('div');
    grid.className = 'gi4-short-value-grid';
    uniqueNumbers(count).forEach(n => {
      const ds = digits(n);
      const candidates = placesForNumber(n).filter(p => ds[p.key] > 0);
      const p = pick(candidates);
      const card = document.createElement('div');
      card.className = 'gi4-short-value-card row-delete-wrap';
      card.appendChild(rowDel(card));
      const number = document.createElement('div');
      number.className = 'gi4-short-value-number';
      placesForNumber(n).forEach(part => {
        const span = document.createElement('span');
        span.textContent = String(ds[part.key]);
        if (part.key === p.key) span.className = 'marked';
        number.appendChild(span);
      });
      const row = document.createElement('div');
      row.className = 'gi4-short-value-row';
      row.append(document.createTextNode(`${ds[p.key]} ${p.label} = `), lineWithSolution(fmt(ds[p.key] * p.value), 'long'));
      card.append(number, row);
      grid.appendChild(card);
    });
    b.appendChild(grid);
  }

  function valueExpr(n){
    const ds = digits(n);
    return placesForNumber(n).map(p => `${ds[p.key]} ${p.label}`).join(' ');
  }

  function exprFor(n){
    const ds = digits(n);
    const places = placesForNumber(n);
    const fullExpr = places.map(p => `${ds[p.key]} ${p.label}`).join(' ');
    const choices = [
      fmt(n),
      fullExpr,
      places.slice(0, -1).map(p => `${ds[p.key]} ${p.label}`).join(' '),
      places.filter((_, i) => i !== 1).map(p => `${ds[p.key]} ${p.label}`).join(' '),
      places.filter((_, i) => i !== places.length - 2).map(p => `${ds[p.key]} ${p.label}`).join(' '),
    ];
    if (ds.d > 1 && ds.h > 0) choices.push(`${ds.h} H meer dan ${ds.d} D`);
    if (ds.t > 1 && ds.d > 0 && ds.h > 0) choices.push(`${ds.t} T meer dan ${ds.d} D en ${ds.h} H`);
    if (ds.td > 1 && ds.d > 0) choices.push(`${ds.d} D meer dan ${ds.td} TD`);
    if (ds.h > 1 && ds.td > 0) choices.push(`${ds.h} H meer dan ${fmt(ds.td * 10000)}`);
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

  function addG5Material(extraCount){
    const count = extraCount || Math.max(1, parseInt($('#g5MaterialCount')?.value, 10) || 4);
    addMaterial(count, 'dots');
  }

  function addG5ValueCards(extraCount){
    const count = extraCount || Math.max(1, parseInt($('#g5ValueCardCount')?.value, 10) || 4);
    const example = !extraCount && $('#g5ValueCardExample')?.checked;
    const key = 'gi4_g5_valuecards';
    const b = block(key, 'Schrijf de waarde van de cijfers.', addG5ValueCards);
    const grid = document.createElement('div');
    grid.className = 'gi4-grid two';
    uniqueNumbers(count).forEach((n, i) => grid.appendChild(makeValueCard(n, example && i === 0, 'plain')));
    b.appendChild(grid);
  }

  function addG5BuildNumbers(extraCount){
    const count = extraCount || Math.max(2, parseInt($('#g5BuildNumberCount')?.value, 10) || 5);
    addBuildNumbers(count);
  }

  function nextThousandNumber(){
    const thousands = rnd(10, 98);
    const rest = rnd(1, 9) * 100;
    return thousands * 1000 + rest;
  }

  function makeNextThousandCard(n, example){
    const next = nextMultiple(n, 1000);
    const diff = next - n;
    const card = document.createElement('div');
    card.className = `gi4-next-thousand-card row-delete-wrap${example ? ' example' : ''}`;
    card.appendChild(rowDel(card));
    const number = document.createElement('div');
    number.className = 'gi4-next-thousand-number';
    number.textContent = fmt(n);
    const line1 = document.createElement('p');
    line1.append('Het volgende duizendtal is ');
    if (example) {
      const strong = document.createElement('strong');
      strong.textContent = fmt(next);
      line1.append(strong, '.');
    } else {
      line1.append(lineWithSolution(fmt(next), 'long'), '.');
    }
    const line2 = document.createElement('p');
    line2.append('Dat is ');
    if (example) {
      const strong = document.createElement('strong');
      strong.textContent = fmt(diff);
      line2.append(strong, ' erbij.');
    } else {
      line2.append(lineWithSolution(fmt(diff)), ' erbij.');
    }
    card.append(number, line1, line2);
    return card;
  }

  function addG5NextThousand(extraCount){
    const key = 'gi4_g5_next_thousand';
    const count = extraCount || Math.max(1, parseInt($('#g5NextThousandCount')?.value, 10) || 3);
    const example = !extraCount && $('#g5NextThousandExample')?.checked;
    if (extraCount) {
      const existing = containerInLastBlock(key, '.gi4-next-thousand-grid', 'gi4-next-thousand-grid');
      if (existing) {
        for (let i = 0; i < count; i++) {
          const n = makeUnique('gi4_next_thousand_row', nextThousandNumber);
          if (n) existing.appendChild(makeNextThousandCard(n, false));
        }
        return;
      }
    }
    const b = block(key, 'Wat is het volgende duizendtal? Vul aan tot het volgende duizendtal.', addG5NextThousand);
    const grid = document.createElement('div');
    grid.className = 'gi4-next-thousand-grid';
    for (let i = 0; i < count; i++) {
      const n = makeUnique('gi4_next_thousand_row', nextThousandNumber);
      if (n) grid.appendChild(makeNextThousandCard(n, example && i === 0));
    }
    b.appendChild(grid);
  }

  function makeG5Axis(min, max, majorStep, minorStep){
    const axis = document.createElement('div');
    axis.className = 'gi4-g5-axis';
    axis.dataset.min = String(min);
    axis.dataset.max = String(max);
    const line = document.createElement('div');
    line.className = 'gi4-g5-axis-line';
    axis.appendChild(line);
    for (let v = min; v <= max; v += minorStep) {
      const pct = ((v - min) / (max - min)) * 100;
      const tick = document.createElement('span');
      tick.className = v % majorStep === 0 ? 'major' : '';
      tick.style.left = `${pct}%`;
      axis.appendChild(tick);
      if (v % majorStep === 0) {
        const label = document.createElement('div');
        label.className = 'gi4-g5-axis-label';
        label.style.left = `${pct}%`;
        label.textContent = fmt(v);
        axis.appendChild(label);
      }
    }
    return axis;
  }

  function g5AxisConnectExercise(fine){
    const start = fine ? rnd(650, 850) * 100 : rnd(2, 6) * 10000;
    const range = fine ? 5000 : 20000;
    const majorStep = fine ? 1000 : 5000;
    const minorStep = fine ? 100 : 1000;
    const end = start + range;
    const cardValues = fine
      ? [start + 400, start + 1200, start + 2300, start + 3100, start + 3700, start + 4600]
      : [start + 2000, start + 4000, start + 9000, start + 11000, start + 16000, start + 18000];
    const row = document.createElement('div');
    row.className = 'gi4-g5-axis-order-row row-delete-wrap';
    row.dataset.axisStart = String(start);
    row.dataset.axisRange = String(range);
    row.appendChild(rowDel(row));
    row.appendChild(makeG5Axis(start, end, majorStep, minorStep));
    const cards = document.createElement('div');
    cards.className = 'gi4-g5-axis-cards';
    cardValues.sort(() => Math.random() - .5).forEach(v => {
      const card = document.createElement('div');
      card.className = 'gi4-g5-axis-card';
      card.dataset.value = String(v);
      card.textContent = fmt(v);
      cards.appendChild(card);
    });
    row.appendChild(cards);
    return row;
  }

  function g5ApproxAxisExercise(){
    const row = document.createElement('div');
    row.className = 'gi4-g5-axis-order-row approx row-delete-wrap';
    row.dataset.axisStart = '0';
    row.dataset.axisRange = '100000';
    row.appendChild(rowDel(row));
    row.appendChild(makeG5Axis(0, 100000, 10000, 5000));
    const cards = document.createElement('div');
    cards.className = 'gi4-g5-axis-cards narrow';
    [rnd(20, 28) * 1000 + rnd(1, 9) * 10, rnd(31, 39) * 1000 + rnd(1, 9) * 100, rnd(55, 65) * 1000 + rnd(1, 9) * 25, rnd(92, 98) * 1000 + rnd(1, 9) * 10]
      .forEach(v => {
        const card = document.createElement('div');
        card.className = 'gi4-g5-axis-card';
        card.dataset.value = String(v);
        card.textContent = fmt(v);
        cards.appendChild(card);
      });
    row.appendChild(cards);
    return row;
  }

  function addG5AxisOrder(extraCount, forcedMode){
    const mode = forcedMode || $('#g5AxisOrderMode')?.value || 'connect';
    const key = `gi4_g5_axis_order_${mode}`;
    const count = extraCount || Math.max(1, parseInt($('#g5AxisOrderCount')?.value, 10) || 2);
    const title = mode === 'approx'
      ? 'Waar liggen de getallen ongeveer? Verbind de kaartjes met de juiste plaats op de getallenas.'
      : 'Verbind de kaartjes met de juiste plaats op de getallenas.';
    if (extraCount) {
      const existing = containerInLastBlock(key, '.gi4-g5-axis-order', 'gi4-g5-axis-order');
      if (existing) {
        for (let i = 0; i < count; i++) existing.appendChild(mode === 'approx' ? g5ApproxAxisExercise() : g5AxisConnectExercise(existing.children.length % 2 === 1));
        return;
      }
    }
    const b = block(key, title, addCount => addG5AxisOrder(addCount || 1, mode));
    const wrap = document.createElement('div');
    wrap.className = 'gi4-g5-axis-order';
    for (let i = 0; i < count; i++) wrap.appendChild(mode === 'approx' ? g5ApproxAxisExercise() : g5AxisConnectExercise(i % 2 === 1));
    b.appendChild(wrap);
  }

  function makeG5PlaceCompareCard(){
    let a = randomNumber();
    let bNum = a + pick([-1, 1]) * pick([1, 2, 5, 10, 20, 100, 1000]);
    if (bNum < 10000 || bNum > 99999) bNum = randomNumber();
    const card = document.createElement('div');
    card.className = 'gi4-g5-place-compare-card row-delete-wrap';
    card.appendChild(rowDel(card));
    const tables = document.createElement('div');
    tables.className = 'gi4-g5-place-compare-tables';
    tables.appendChild(placeTable(a, 'dots', { compact: true }));
    tables.appendChild(placeTable(bNum, 'dots', { compact: true }));
    const row = document.createElement('div');
    row.className = 'gi4-g5-place-compare-row';
    row.append('Dus: ', document.createTextNode(fmt(a)), Object.assign(document.createElement('span'), { className: 'gi4-symbol-box' }), document.createTextNode(fmt(bNum)));
    row.querySelector('.gi4-symbol-box').appendChild(sol(a < bNum ? '<' : a > bNum ? '>' : '='));
    card.append(tables, row);
    return card;
  }

  function makeG5PlainCompareRow(){
    const row = document.createElement('div');
    row.className = 'gi4-g5-plain-compare-row row-delete-wrap';
    row.appendChild(rowDel(row));
    const a = randomNumber();
    let bNum = a + pick([-1, 1]) * pick([1, 7, 10, 100, 1000, 5000]);
    if (bNum < 10000 || bNum > 99999) bNum = randomNumber();
    const box = Object.assign(document.createElement('span'), { className: 'gi4-symbol-box' });
    box.appendChild(sol(a < bNum ? '<' : a > bNum ? '>' : '='));
    row.append(fmt(a), box, fmt(bNum));
    return row;
  }

  function addG5Compare(extraCount, forcedMode){
    const mode = forcedMode || $('#g5CompareMode')?.value || 'plain';
    const key = `gi4_g5_compare_${mode}`;
    const count = extraCount || Math.max(1, parseInt($('#g5CompareCount')?.value, 10) || 4);
    const selector = mode === 'place' ? '.gi4-g5-place-compare' : '.gi4-g5-plain-compare';
    const className = mode === 'place' ? 'gi4-g5-place-compare' : 'gi4-g5-plain-compare';
    const maker = mode === 'place' ? makeG5PlaceCompareCard : makeG5PlainCompareRow;
    if (extraCount) {
      const existing = containerInLastBlock(key, selector, className);
      if (existing) {
        for (let i = 0; i < count; i++) existing.appendChild(maker());
        return;
      }
    }
    const b = block(key, 'Vergelijk. Vul in: <, > of =.', addCount => addG5Compare(addCount || 1, mode));
    const wrap = document.createElement('div');
    wrap.className = className;
    for (let i = 0; i < count; i++) wrap.appendChild(maker());
    b.appendChild(wrap);
  }

  function makeG5OrderRow(dir){
    const nums = uniqueNumbers(4).sort(() => Math.random() - .5);
    const row = document.createElement('div');
    row.className = 'gi4-g5-order-line row-delete-wrap';
    row.appendChild(rowDel(row));
    const title = document.createElement('div');
    title.textContent = dir === 'asc'
      ? 'Rangschik de getallen van klein naar groot.'
      : 'Rangschik de getallen van groot naar klein.';
    const source = document.createElement('div');
    source.className = 'gi4-g5-order-source';
    source.textContent = nums.map(fmt).join(' - ');
    const ans = document.createElement('div');
    ans.className = 'gi4-g5-order-answer';
    nums.slice().sort((a, b) => dir === 'asc' ? a - b : b - a).forEach((n, i) => {
      if (i) ans.append(dir === 'asc' ? ' < ' : ' > ');
      ans.appendChild(lineWithSolution(fmt(n), 'long'));
    });
    row.append(title, source, ans);
    return row;
  }

  function addG5Order(extraCount, forcedDir){
    const dir = forcedDir || $('#g5OrderDirection')?.value || 'asc';
    const key = `gi4_g5_order_${dir}`;
    const count = extraCount || Math.max(1, parseInt($('#g5OrderCount')?.value, 10) || 2);
    const title = dir === 'asc'
      ? 'Rangschik de getallen van klein naar groot.'
      : 'Rangschik de getallen van groot naar klein.';
    if (extraCount) {
      const existing = containerInLastBlock(key, '.gi4-g5-order-list', 'gi4-g5-order-list');
      if (existing) {
        for (let i = 0; i < count; i++) existing.appendChild(makeG5OrderRow(dir));
        return;
      }
    }
    const b = block(key, title, addCount => addG5Order(addCount || 1, dir));
    const wrap = document.createElement('div');
    wrap.className = 'gi4-g5-order-list';
    for (let i = 0; i < count; i++) wrap.appendChild(makeG5OrderRow(dir));
    b.appendChild(wrap);
  }

  function makeG5NeighborTable(kind, nums, withExample = false){
    const base = kind === 'number' ? 1 : kind === 'hundred' ? 100 : kind === 'thousand' ? 1000 : 10000;
    const labels = {
      number: ['vorig getal', 'volgend getal', 'gi4-neighbor-yellow'],
      hundred: ['vorig honderdtal', 'volgend honderdtal', 'gi4-neighbor-blue'],
      thousand: ['vorig duizendtal', 'volgend duizendtal', 'gi4-neighbor-red'],
      tenThousand: ['vorig tienduizendtal', 'volgend tienduizendtal', 'gi4-neighbor-purple'],
    }[kind];
    const makeRow = (n, example) => {
      const tr = document.createElement('tr');
      tr.className = 'row-delete-wrap';
      const prev = kind === 'number' ? n - 1 : previousMultiple(n, base);
      const next = kind === 'number' ? n + 1 : nextMultiple(n + 1, base);
      const left = document.createElement('td');
      const middle = document.createElement('td');
      const right = document.createElement('td');
      const actions = document.createElement('td');
      actions.className = 'gi4-g5-neighbor-actions';
      actions.appendChild(rowDel(tr));
      if (example) left.textContent = fmt(prev);
      else left.appendChild(lineWithSolution(fmt(prev), 'long'));
      middle.textContent = fmt(n);
      if (example) right.textContent = fmt(next);
      else right.appendChild(lineWithSolution(fmt(next), 'long'));
      if (example) tr.className = 'example';
      tr.classList.add('row-delete-wrap');
      tr.append(left, middle, right, actions);
      return tr;
    };
    const table = document.createElement('table');
    table.className = 'gi4-g5-neighbor-table';
    table.dataset.kind = kind;
    table.innerHTML = `<thead><tr><th class="${labels[2]}">${labels[0]}</th><th></th><th class="${labels[2]}">${labels[1]}</th><th class="gi4-g5-neighbor-actions"></th></tr></thead>`;
    const body = document.createElement('tbody');
    nums.forEach((n, i) => body.appendChild(makeRow(n, withExample && i === 0)));
    table.appendChild(body);
    return table;
  }

  function makeG5NeighborRow(kind, n){
    const body = makeG5NeighborTable(kind, [n], false).querySelector('tbody');
    return body?.firstElementChild;
  }

  function addG5Neighbors(extraCount){
    const key = 'gi4_g5_neighbors';
    const rows = extraCount || Math.max(1, parseInt($('#g5NeighborRows')?.value, 10) || 3);
    if (extraCount) {
      const small = lastBlock(key);
      const big = lastBlock(`${key}_big`);
      const targets = [
        [small, 'number'],
        [small, 'hundred'],
        [big, 'thousand'],
        [big, 'tenThousand'],
      ];
      let appended = false;
      targets.forEach(([blockEl, kind]) => {
        const body = blockEl?.querySelector(`.gi4-g5-neighbor-table[data-kind="${kind}"] tbody`);
        if (!body) return;
        uniqueNumbers(rows).forEach(n => {
          const tr = makeG5NeighborRow(kind, n);
          if (tr) body.appendChild(tr);
        });
        appended = true;
      });
      if (appended) return;
    }
    const numsA = uniqueNumbers(rows);
    const numsB = uniqueNumbers(rows);
    const withExample = $('#g5NeighborExample')?.checked;
    const b1 = block(key, 'Schrijf de buurtallen of de buurhonderdtallen.', addG5Neighbors);
    const grid1 = document.createElement('div');
    grid1.className = 'gi4-g5-neighbor-grid';
    grid1.append(makeG5NeighborTable('number', numsA, withExample), makeG5NeighborTable('hundred', numsB, withExample));
    b1.appendChild(grid1);
    const b2 = block(`${key}_big`, 'Schrijf de buurduizendtallen of de buurtienduizendtallen.', addG5Neighbors);
    const grid2 = document.createElement('div');
    grid2.className = 'gi4-g5-neighbor-grid';
    grid2.append(makeG5NeighborTable('thousand', uniqueNumbers(rows), withExample), makeG5NeighborTable('tenThousand', uniqueNumbers(rows), withExample));
    b2.appendChild(grid2);
  }

  function makeG5JumpRow(step){
    const centerIndex = 3;
    const start = Math.floor(rnd(15000, 90000 - step * 3) / step) * step;
    const center = start + centerIndex * step;
    const row = document.createElement('div');
    row.className = 'gi4-g5-jump-row row-delete-wrap';
    row.appendChild(rowDel(row));
    const tag = document.createElement('div');
    tag.className = 'gi4-g5-jump-tag';
    tag.textContent = `Maak sprongen van ${fmt(step)}.`;
    const axis = document.createElement('div');
    axis.className = 'gi4-g5-jump-axis';
    for (let i = 0; i < 7; i++) {
      const value = start + i * step;
      const cell = document.createElement('div');
      cell.className = i === centerIndex ? 'center' : '';
      if (i === centerIndex || Math.random() < .25) cell.textContent = fmt(value);
      else cell.appendChild(lineWithSolution(fmt(value), 'long'));
      axis.appendChild(cell);
    }
    row.append(tag, axis);
    return row;
  }

  function g5JumpSteps(count){
    const base = [100, 200, 500, 1000, 2000, 3000, 5000, 10000];
    const shuffled = [...base].sort(() => Math.random() - .5);
    const steps = [];
    for (let i = 0; i < count; i++) steps.push(shuffled[i % shuffled.length]);
    return steps;
  }

  function addG5Jumps(extraCount){
    const key = 'gi4_g5_jumps';
    const rows = extraCount || Math.max(1, parseInt($('#g5JumpRows')?.value, 10) || 3);
    const steps = g5JumpSteps(rows);
    if (extraCount) {
      const existing = containerInLastBlock(key, '.gi4-g5-jumps', 'gi4-g5-jumps');
      if (existing) {
        for (let i = 0; i < rows; i++) existing.appendChild(makeG5JumpRow(steps[i]));
        return;
      }
    }
    const b = block(key, 'Maak sprongen op de getallenas. Vul de getallen aan.', addG5Jumps);
    const wrap = document.createElement('div');
    wrap.className = 'gi4-g5-jumps';
    for (let i = 0; i < rows; i++) wrap.appendChild(makeG5JumpRow(steps[i % steps.length]));
    b.appendChild(wrap);
  }

  function addG5Riddles(extraCount){
    const key = 'gi4_g5_riddles';
    const count = extraCount || Math.max(1, parseInt($('#g5RiddleCount')?.value, 10) || 3);
    const riddles = [
      {
        lines: ['Het grootste getal dat je kunt maken met vijf verschillende cijfers is:', 'Het kleinste getal dat je kunt maken met vijf verschillende cijfers is:'],
        answers: ['98 765', '10 234'],
        join: ' en '
      },
      {
        lines: ['Ik zoek 2 getallen.', 'Beide getallen liggen tussen 45 600 en 45 700.', 'In elk getal komt elk cijfer slechts 1 keer voor.', 'De som van de cijfers is bij elk getal precies 20.'],
        answers: ['45 623', '45 632'],
        join: ' en '
      },
      {
        lines: ['Ik zoek twee getallen.', 'Beide getallen liggen tussen 82 850 en 82 950.', 'Elk getal heeft slechts 2 verschillende cijfers.'],
        answers: ['82 882', '82 888'],
        join: ' en '
      },
      {
        lines: ['Ik zoek een getal tussen 60 000 en 70 000.', 'Het honderdtal is 8.', 'Het tiental is dubbel zoveel als het eenheidscijfer.'],
        answers: ['bv. 60 821'],
        join: ''
      },
    ];
    const makeCard = index => {
      const templateIndex = index % riddles.length;
      const riddle = riddles[templateIndex];
      const card = document.createElement('div');
      card.className = 'gi4-g5-riddle-card row-delete-wrap';
      card.appendChild(rowDel(card));
      riddle.lines.forEach(line => {
        const p = document.createElement('p');
        p.textContent = line;
        card.appendChild(p);
      });
      const answer = document.createElement('div');
      answer.className = 'gi4-g5-riddle-answer';
      riddle.answers.forEach((answerText, answerIndex) => {
        if (answerIndex) answer.append(riddle.join || ' ');
        answer.appendChild(lineWithSolution(answerText, 'long'));
      });
      card.appendChild(answer);
      return card;
    };
    if (extraCount) {
      const existing = containerInLastBlock(key, '.gi4-g5-riddle-grid', 'gi4-g5-riddle-grid');
      if (existing) {
        for (let i = 0; i < count; i++) existing.appendChild(makeCard(existing.children.length + i));
        return;
      }
    }
    const b = block(key, 'Lees de getalraadsels. Vul in.', addG5Riddles);
    const grid = document.createElement('div');
    grid.className = 'gi4-g5-riddle-grid';
    for (let i = 0; i < count; i++) {
      const card = makeCard(i);
      grid.appendChild(card);
    }
    b.appendChild(grid);
  }

  function addG5Equiv(extraCount){
    const rows = extraCount || Math.max(2, parseInt($('#g5EquivRows')?.value, 10) || 4);
    addEquiv(rows);
  }

  function gcd(a, b){
    while (b) {
      const t = b;
      b = a % b;
      a = t;
    }
    return Math.abs(a);
  }

  function lcm(a, b){
    return Math.abs(a * b) / gcd(a, b);
  }

  function g5SimplifySeeds(){
    return [
      { num: 6, den: 10, color: '#f49b83' },
      { num: 4, den: 12, color: '#b9dca8' },
      { num: 6, den: 8, color: '#ffe09a' },
      { num: 9, den: 12, color: '#7ed0ee' },
      { num: 8, den: 12, color: '#c7b8e8' },
      { num: 10, den: 15, color: '#f8c37d' },
      { num: 12, den: 16, color: '#9fd7c5' },
      { num: 15, den: 20, color: '#f4a9c4' },
    ];
  }

  function pickUnusedOrAny(namespace, items, keyFn = item => item){
    return pickUnused(namespace, items, keyFn) || pick(items);
  }

  function makeG5SimplifyStrip(num, den, simplifiedNum, simplifiedDen, color){
    const visual = document.createElement('div');
    visual.className = 'gi4-g5-simplify-strip';
    const top = document.createElement('div');
    const bottom = document.createElement('div');
    top.className = 'gi4-g5-simplify-strip-row';
    bottom.className = 'gi4-g5-simplify-strip-row';
    top.style.setProperty('--den', den);
    bottom.style.setProperty('--den', simplifiedDen);
    for (let i = 0; i < den; i++) {
      const cell = document.createElement('span');
      if (i < num) cell.style.background = color;
      top.appendChild(cell);
    }
    for (let i = 0; i < simplifiedDen; i++) {
      const cell = document.createElement('span');
      if (i < simplifiedNum) cell.classList.add('solution-fill');
      cell.style.setProperty('--eq-fill', color);
      bottom.appendChild(cell);
    }
    visual.append(top, bottom);
    return visual;
  }

  function makeG5FractionSimplifyCard(){
    const seed = pickUnusedOrAny('gi4_g5_fraction_simplify_seed', g5SimplifySeeds(), s => `${s.num}/${s.den}`);
    if (!seed) return null;
    const divisor = gcd(seed.num, seed.den);
    const simpleNum = seed.num / divisor;
    const simpleDen = seed.den / divisor;
    const card = document.createElement('div');
    card.className = 'gi4-g5-simplify-card row-delete-wrap';
    card.appendChild(rowDel(card));
    card.appendChild(makeG5SimplifyStrip(seed.num, seed.den, simpleNum, simpleDen, seed.color));

    const calc = makeG5FractionArrowWork({
      num: seed.num,
      den: seed.den,
      resultNum: simpleNum,
      resultDen: simpleDen,
      op: ':',
      factor: divisor,
      showResultDen: true
    });

    const info = document.createElement('div');
    info.className = 'gi4-g5-simplify-info';
    info.append('De GGD van ', seed.num, ' en ', seed.den, ' is ', lineWithSolution(String(divisor), 'short'), '.');
    const step = document.createElement('div');
    step.className = 'gi4-g5-simplify-info';
    step.append('Ik deel teller en noemer door ', lineWithSolution(String(divisor), 'short'), '.');
    const final = document.createElement('div');
    final.className = 'gi4-g5-simplify-final';
    final.append('Ik vereenvoudig ', fractionBox(seed.num, seed.den), ' naar ', fractionBox('', '', simpleNum, simpleDen), '.');
    card.append(calc, info, step, final);
    return card;
  }

  function makeG5FractionArrowWork({ num, den, resultNum, resultDen, op = ':', factor = '', showResultDen = true }){
    const wrap = document.createElement('div');
    wrap.className = 'gi4-g5-fraction-arrow-work';
    const top = document.createElement('div');
    top.className = 'gi4-g5-fraction-arrow-label top';
    top.append(`${op} `, lineWithSolution(String(factor), 'short'));
    const arrows = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    arrows.setAttribute('class', 'gi4-g5-fraction-arrow-svg');
    arrows.setAttribute('viewBox', '0 0 260 160');
    arrows.innerHTML = `
      <defs>
        <marker id="gi4ArrowHead" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z"></path>
        </marker>
      </defs>
      <path class="gi4-g5-fraction-arrow-path" d="M 101 63 C 116 27, 144 27, 159 63" marker-end="url(#gi4ArrowHead)"></path>
      <path class="gi4-g5-fraction-arrow-path" d="M 101 97 C 116 133, 144 133, 159 97" marker-end="url(#gi4ArrowHead)"></path>
    `;
    const eq = document.createElement('div');
    eq.className = 'gi4-g5-fraction-arrow-equation';
    eq.append(fractionBox(num, den), ' = ', fractionBox('', showResultDen ? resultDen : '', resultNum, showResultDen ? '' : resultDen));
    const bottom = document.createElement('div');
    bottom.className = 'gi4-g5-fraction-arrow-label bottom';
    bottom.append(`${op} `, lineWithSolution(String(factor), 'short'));
    wrap.append(arrows, top, eq, bottom);
    return wrap;
  }

  function addG5FractionSimplify(extraCount){
    const key = 'gi4_g5_fraction_simplify';
    const count = extraCount || Math.max(1, parseInt($('#g5FractionSimplifyCount')?.value, 10) || 4);
    if (extraCount) {
      const existing = containerInLastBlock(key, '.gi4-g5-simplify-grid', 'gi4-g5-simplify-grid');
      if (existing) {
        for (let i = 0; i < count; i++) appendNewExercise(existing, makeG5FractionSimplifyCard);
        return;
      }
    }
    const b = block(key, 'Vereenvoudig de breuken. Vul in.', addG5FractionSimplify);
    addFractionInstructions(b, ['Vereenvoudig de breuken.', 'Kleur de eenvoudigste gelijkwaardige breuk.', 'Schrijf de eenvoudigste gelijkwaardige breuk.', 'Vul in.']);
    const grid = document.createElement('div');
    grid.className = 'gi4-g5-simplify-grid';
    for (let i = 0; i < count; i++) appendNewExercise(grid, makeG5FractionSimplifyCard);
    b.appendChild(grid);
  }

  function g5EquivalentSeeds(){
    return [
      { num: 1, den: 2, factor: 3, color: '#f8c879' },
      { num: 2, den: 3, factor: 4, color: '#9fd7c5' },
      { num: 2, den: 10, factor: 2, color: '#c8a4cf', simplify: true },
      { num: 6, den: 9, factor: 3, color: '#f4a9b6', simplify: true },
      { num: 3, den: 4, factor: 3, color: '#b9dca8' },
      { num: 4, den: 5, factor: 2, color: '#7ed0ee' },
      { num: 5, den: 6, factor: 2, color: '#ffe09a' },
      { num: 8, den: 12, factor: 4, color: '#b7d9f2', simplify: true },
    ];
  }

  function g5PickEquivalentSeed(namespace, mode = 'mixed'){
    const seeds = g5EquivalentSeeds().filter(seed => {
      if (mode === 'expand') return !seed.simplify;
      if (mode === 'simplify') return seed.simplify;
      return true;
    });
    return pickUnusedOrAny(namespace, seeds, s => `${s.num}/${s.den}/${s.factor}/${s.simplify ? 's' : 'e'}`);
  }

  function makeG5FractionEquivalentCard(mode = 'mixed'){
    const seed = g5PickEquivalentSeed(`gi4_g5_fraction_equivalent_${mode}`, mode);
    if (!seed) return null;
    const simplify = !!seed.simplify;
    const divisor = seed.factor;
    const sourceNum = seed.num;
    const sourceDen = seed.den;
    const targetNum = simplify ? sourceNum / divisor : sourceNum * divisor;
    const targetDen = simplify ? sourceDen / divisor : sourceDen * divisor;
    const card = document.createElement('div');
    card.className = `gi4-g5-equivalent-card row-delete-wrap ${simplify ? 'simplify' : 'expand'}`;
    card.appendChild(rowDel(card));
    card.appendChild(makeG5SimplifyStrip(sourceNum, sourceDen, targetNum, targetDen, seed.color));
    const op = simplify ? ':' : 'x';
    const calc = makeG5FractionArrowWork({
      num: sourceNum,
      den: sourceDen,
      resultNum: targetNum,
      resultDen: targetDen,
      op,
      factor: divisor,
      showResultDen: true
    });
    card.appendChild(calc);
    const final = document.createElement('div');
    final.className = 'gi4-g5-simplify-final';
    if (simplify) final.append('Ik vereenvoudig ', fractionBox(sourceNum, sourceDen), ' naar ', fractionBox('', '', targetNum, targetDen), '.');
    else final.append('Ik maak ', fractionBox(sourceNum, sourceDen), ' gelijkwaardig met ', fractionBox('', targetDen, targetNum, ''), '.');
    card.appendChild(final);
    return card;
  }

  function addG5FractionEquivalent(extraCount, forcedMode){
    const mode = forcedMode || $('#g5FractionEquivalentMode')?.value || 'mixed';
    const key = `gi4_g5_fraction_equivalent_${mode}`;
    const count = extraCount || Math.max(1, parseInt($('#g5FractionEquivalentCount')?.value, 10) || 4);
    if (extraCount) {
      const existing = containerInLastBlock(key, '.gi4-g5-simplify-grid', 'gi4-g5-simplify-grid');
      if (existing) {
        for (let i = 0; i < count; i++) appendNewExercise(existing, () => makeG5FractionEquivalentCard(mode));
        return;
      }
    }
    const b = block(key, 'Kleur de gelijkwaardige breuken. Vul de pijlen aan.', addCount => addG5FractionEquivalent(addCount || 1, mode));
    addFractionInstructions(b, ['Kleur de gelijkwaardige breuken.', 'Vul de pijlen aan.', 'Schrijf de gelijkwaardige breuken.']);
    const grid = document.createElement('div');
    grid.className = 'gi4-g5-simplify-grid';
    for (let i = 0; i < count; i++) appendNewExercise(grid, () => makeG5FractionEquivalentCard(mode));
    b.appendChild(grid);
  }

  function g5CommonCompareSeeds(){
    return [
      { a: { num: 1, den: 2 }, b: { num: 3, den: 10 } },
      { a: { num: 5, den: 6 }, b: { num: 9, den: 12 } },
      { a: { num: 2, den: 3 }, b: { num: 7, den: 9 } },
      { a: { num: 1, den: 2 }, b: { num: 2, den: 5 } },
      { a: { num: 3, den: 4 }, b: { num: 4, den: 6 } },
      { a: { num: 2, den: 3 }, b: { num: 3, den: 4 } },
      { a: { num: 5, den: 8 }, b: { num: 2, den: 3 } },
      { a: { num: 4, den: 5 }, b: { num: 7, den: 10 } },
    ];
  }

  function g5CompareRelation(a, b){
    return a < b ? '<' : a > b ? '>' : '=';
  }

  function makeG5CommonCompareCard(example = false){
    const seed = pickUnusedOrAny('gi4_g5_fraction_common_compare', g5CommonCompareSeeds(), s => `${s.a.num}/${s.a.den}-${s.b.num}/${s.b.den}`);
    if (!seed) return null;
    const commonDen = lcm(seed.a.den, seed.b.den);
    const factorA = commonDen / seed.a.den;
    const factorB = commonDen / seed.b.den;
    const commonA = { num: seed.a.num * factorA, den: commonDen };
    const commonB = { num: seed.b.num * factorB, den: commonDen };
    const card = document.createElement('div');
    card.className = 'gi4-g5-common-compare-card row-delete-wrap';
    card.appendChild(rowDel(card));
    const top = document.createElement('div');
    top.className = 'gi4-g5-common-top';
    const topBox = Object.assign(document.createElement('span'), { className: 'gi4-symbol-box' });
    const relation = g5CompareRelation(seed.a.num / seed.a.den, seed.b.num / seed.b.den);
    if (example) topBox.textContent = relation;
    else topBox.appendChild(sol(relation));
    top.append(fractionBox(seed.a.num, seed.a.den), topBox, fractionBox(seed.b.num, seed.b.den));

    const work = document.createElement('div');
    work.className = 'gi4-g5-common-work';
    work.append(
      makeG5FractionArrowWork({ num: seed.a.num, den: seed.a.den, resultNum: commonA.num, resultDen: commonA.den, op: 'x', factor: factorA, showResultDen: true }),
      makeG5FractionArrowWork({ num: seed.b.num, den: seed.b.den, resultNum: commonB.num, resultDen: commonB.den, op: 'x', factor: factorB, showResultDen: true })
    );
    const bottom = document.createElement('div');
    bottom.className = 'gi4-g5-common-bottom';
    const bottomBox = Object.assign(document.createElement('span'), { className: 'gi4-symbol-box' });
    if (example) bottomBox.textContent = g5CompareRelation(commonA.num, commonB.num);
    else bottomBox.appendChild(sol(g5CompareRelation(commonA.num, commonB.num)));
    bottom.append(
      example ? fractionBox(commonA.num, commonDen) : fractionBox('', commonDen, commonA.num, ''),
      bottomBox,
      example ? fractionBox(commonB.num, commonDen) : fractionBox('', commonDen, commonB.num, '')
    );
    if (example) card.classList.add('example');
    card.append(top, work, bottom);
    return card;
  }

  function addG5FractionCommonCompare(extraCount){
    const key = 'gi4_g5_fraction_common_compare';
    const count = extraCount || Math.max(1, parseInt($('#g5FractionCommonCompareCount')?.value, 10) || 3);
    if (extraCount) {
      const existing = containerInLastBlock(key, '.gi4-g5-common-grid', 'gi4-g5-common-grid');
      if (existing) {
        for (let i = 0; i < count; i++) appendNewExercise(existing, () => makeG5CommonCompareCard(false));
        return;
      }
    }
    const withExample = $('#g5FractionCommonExample')?.checked;
    const b = block(key, 'Maak de breuken gelijknamig. Vergelijk daarna de breuken.', addG5FractionCommonCompare);
    addFractionInstructions(b, ['Maak de breuken gelijknamig.', 'Vergelijk daarna de breuken. Vul aan: <, > of =.']);
    const grid = document.createElement('div');
    grid.className = 'gi4-g5-common-grid';
    for (let i = 0; i < count; i++) appendNewExercise(grid, () => makeG5CommonCompareCard(withExample && i === 0));
    b.appendChild(grid);
  }

  function makeG5CommonShortCard(example = false){
    const seed = pickUnusedOrAny('gi4_g5_fraction_common_short', g5CommonCompareSeeds(), s => `${s.a.num}/${s.a.den}-${s.b.num}/${s.b.den}`);
    if (!seed) return null;
    const commonDen = lcm(seed.a.den, seed.b.den);
    const commonA = { num: seed.a.num * (commonDen / seed.a.den), den: commonDen };
    const commonB = { num: seed.b.num * (commonDen / seed.b.den), den: commonDen };
    const relation = g5CompareRelation(commonA.num, commonB.num);
    const card = document.createElement('div');
    card.className = 'gi4-g5-common-short-card row-delete-wrap';
    if (example) card.classList.add('example');
    card.appendChild(rowDel(card));
    const top = document.createElement('div');
    top.className = 'gi4-g5-common-short-top';
    const box = Object.assign(document.createElement('span'), { className: 'gi4-symbol-box' });
    if (example) box.textContent = relation;
    else box.appendChild(sol(relation));
    top.append(fractionBox(seed.a.num, seed.a.den), box, fractionBox(seed.b.num, seed.b.den));
    const arrows = document.createElement('div');
    arrows.className = 'gi4-g5-common-down-arrows';
    arrows.innerHTML = '<span></span><span></span>';
    const bottom = document.createElement('div');
    bottom.className = 'gi4-g5-common-short-bottom';
    bottom.append(
      example ? fractionBox(commonA.num, commonA.den) : fractionBox('', '', commonA.num, commonA.den),
      example ? fractionBox(commonB.num, commonB.den) : fractionBox('', '', commonB.num, commonB.den)
    );
    card.append(top, arrows, bottom);
    return card;
  }

  function addG5FractionCommonShort(extraCount){
    const key = 'gi4_g5_fraction_common_short';
    const count = extraCount || Math.max(1, parseInt($('#g5FractionCommonShortCount')?.value, 10) || 6);
    if (extraCount) {
      const existing = containerInLastBlock(key, '.gi4-g5-common-short-grid', 'gi4-g5-common-short-grid');
      if (existing) {
        for (let i = 0; i < count; i++) appendNewExercise(existing, () => makeG5CommonShortCard(false));
        return;
      }
    }
    const withExample = $('#g5FractionCommonShortExample')?.checked;
    const b = block(key, 'Maak de breuken gelijknamig. Vergelijk daarna de breuken.', addG5FractionCommonShort);
    addFractionInstructions(b, ['Maak de breuken gelijknamig.', 'Vergelijk daarna de breuken. Vul in: <, > of =.']);
    const grid = document.createElement('div');
    grid.className = 'gi4-g5-common-short-grid';
    for (let i = 0; i < count; i++) appendNewExercise(grid, () => makeG5CommonShortCard(withExample && i === 0));
    b.appendChild(grid);
  }

  function makeG5FractionArrowCard(){
    const seed = pickUnusedOrAny('gi4_g5_fraction_arrows', g5SimplifySeeds(), s => `${s.num}/${s.den}`);
    if (!seed) return null;
    const divisor = gcd(seed.num, seed.den);
    const simpleNum = seed.num / divisor;
    const simpleDen = seed.den / divisor;
    const card = document.createElement('div');
    card.className = 'gi4-g5-arrow-card row-delete-wrap';
    card.appendChild(rowDel(card));
    const calc = makeG5FractionArrowWork({
      num: seed.num,
      den: seed.den,
      resultNum: simpleNum,
      resultDen: simpleDen,
      op: ':',
      factor: divisor,
      showResultDen: false
    });
    card.appendChild(calc);
    return card;
  }

  function addG5FractionArrows(extraCount){
    const key = 'gi4_g5_fraction_arrows';
    const count = extraCount || Math.max(1, parseInt($('#g5FractionArrowCount')?.value, 10) || 6);
    if (extraCount) {
      const existing = containerInLastBlock(key, '.gi4-g5-arrow-grid', 'gi4-g5-arrow-grid');
      if (existing) {
        for (let i = 0; i < count; i++) appendNewExercise(existing, makeG5FractionArrowCard);
        return;
      }
    }
    const b = block(key, 'Vereenvoudig de breuken. Vul de pijlen aan.', addG5FractionArrows);
    addFractionInstructions(b, ['Denk na: wat is de GGD van de teller en de noemer?', 'Noteer indien nodig op een wisbordje.', 'Vul de pijlen aan.', 'Vereenvoudig de breuken.']);
    const grid = document.createElement('div');
    grid.className = 'gi4-g5-arrow-grid';
    for (let i = 0; i < count; i++) appendNewExercise(grid, makeG5FractionArrowCard);
    b.appendChild(grid);
  }

  function makeG5FractionShortRow(){
    const seed = pickUnusedOrAny('gi4_g5_fraction_short', g5SimplifySeeds(), s => `${s.num}/${s.den}`);
    if (!seed) return null;
    const divisor = gcd(seed.num, seed.den);
    const row = document.createElement('div');
    row.className = 'gi4-g5-fraction-short-row row-delete-wrap';
    row.appendChild(rowDel(row));
    row.append(fractionBox(seed.num, seed.den), ' = ', fractionBox('', '', seed.num / divisor, seed.den / divisor));
    return row;
  }

  function addG5FractionShort(extraCount){
    const key = 'gi4_g5_fraction_short';
    const count = extraCount || Math.max(1, parseInt($('#g5FractionShortCount')?.value, 10) || 6);
    if (extraCount) {
      const existing = containerInLastBlock(key, '.gi4-g5-fraction-short-grid', 'gi4-g5-fraction-short-grid');
      if (existing) {
        for (let i = 0; i < count; i++) appendNewExercise(existing, makeG5FractionShortRow);
        return;
      }
    }
    const b = block(key, 'Vereenvoudig de breuken.', addG5FractionShort);
    addFractionInstructions(b, ['Vereenvoudig de breuken.', 'Je mag pijlen tekenen indien nodig.']);
    const grid = document.createElement('div');
    grid.className = 'gi4-g5-fraction-short-grid';
    for (let i = 0; i < count; i++) appendNewExercise(grid, makeG5FractionShortRow);
    b.appendChild(grid);
  }

  function makeG5FractionSeriesRow(){
    const series = [
      { base: { num: 3, den: 9 }, options: [{ num: 2, den: 3 }, { num: 1, den: 3 }, { num: 1, den: 6 }, { num: 6, den: 18 }] },
      { base: { num: 6, den: 12 }, options: [{ num: 2, den: 6 }, { num: 2, den: 4 }, { num: 12, den: 24 }, { num: 1, den: 2 }] },
      { base: { num: 4, den: 10 }, options: [{ num: 2, den: 5 }, { num: 4, den: 20 }, { num: 8, den: 20 }, { num: 1, den: 5 }] },
      { base: { num: 8, den: 24 }, options: [{ num: 1, den: 3 }, { num: 2, den: 6 }, { num: 4, den: 12 }, { num: 3, den: 8 }] },
    ];
    const item = pickUnusedOrAny('gi4_g5_fraction_series', series, s => `${s.base.num}/${s.base.den}`);
    if (!item) return null;
    const row = document.createElement('div');
    row.className = 'gi4-g5-fraction-series row-delete-wrap';
    row.appendChild(rowDel(row));
    const base = document.createElement('div');
    base.className = 'gi4-g5-fraction-flower';
    base.appendChild(fractionBox(item.base.num, item.base.den));
    row.appendChild(base);
    item.options.forEach(opt => {
      const cell = document.createElement('div');
      cell.className = 'gi4-g5-fraction-option';
      if (item.base.num * opt.den === opt.num * item.base.den) cell.classList.add('solution-equivalent');
      if (gcd(opt.num, opt.den) === 1 && item.base.num * opt.den === opt.num * item.base.den) cell.classList.add('solution-simplest');
      cell.appendChild(fractionBox(opt.num, opt.den));
      row.appendChild(cell);
    });
    return row;
  }

  function addG5FractionSeries(extraCount){
    const key = 'gi4_g5_fraction_series';
    const count = extraCount || Math.max(1, parseInt($('#g5FractionSeriesCount')?.value, 10) || 2);
    if (extraCount) {
      const existing = containerInLastBlock(key, '.gi4-g5-fraction-series-grid', 'gi4-g5-fraction-series-grid');
      if (existing) {
        for (let i = 0; i < count; i++) appendNewExercise(existing, makeG5FractionSeriesRow);
        return;
      }
    }
    const b = block(key, 'Kleur alle gelijkwaardige breuken. Omkring de eenvoudigste breuk.', addG5FractionSeries);
    addFractionInstructions(b, ['Kleur in elke reeks alle gelijkwaardige breuken.', 'Omkring van deze gelijkwaardige breuken de eenvoudigste breuk.']);
    const grid = document.createElement('div');
    grid.className = 'gi4-g5-fraction-series-grid';
    for (let i = 0; i < count; i++) appendNewExercise(grid, makeG5FractionSeriesRow);
    b.appendChild(grid);
  }

  function makeG5FractionColorTable(){
    const groups = [
      [{ num: 2, den: 3 }, { num: 4, den: 6 }, { num: 6, den: 9 }],
      [{ num: 1, den: 2 }, { num: 5, den: 10 }, { num: 10, den: 20 }],
      [{ num: 3, den: 4 }, { num: 6, den: 8 }, { num: 9, den: 12 }],
      [{ num: 5, den: 7 }, { num: 10, den: 14 }, { num: 15, den: 21 }],
    ];
    const cells = groups.flatMap((group, groupIndex) => group.map(value => ({ ...value, groupIndex }))).sort(() => Math.random() - .5);
    const table = document.createElement('div');
    table.className = 'gi4-g5-fraction-color-table row-delete-wrap';
    table.appendChild(rowDel(table));
    cells.forEach(cellData => {
      const cell = document.createElement('div');
      cell.className = `gi4-g5-fraction-color-cell solution-group-${cellData.groupIndex}`;
      cell.appendChild(fractionBox(cellData.num, cellData.den));
      table.appendChild(cell);
    });
    return table;
  }

  function addG5FractionColorTable(extraCount){
    const key = 'gi4_g5_fraction_color_table';
    const count = extraCount || Math.max(1, parseInt($('#g5FractionColorTableCount')?.value, 10) || 1);
    if (extraCount) {
      const existing = containerInLastBlock(key, '.gi4-g5-fraction-color-wrap', 'gi4-g5-fraction-color-wrap');
      if (existing) {
        for (let i = 0; i < count; i++) appendNewExercise(existing, makeG5FractionColorTable);
        return;
      }
    }
    const b = block(key, 'Geef de gelijkwaardige breuken dezelfde kleur.', addG5FractionColorTable);
    addFractionInstructions(b, ['Geef de gelijkwaardige breuken eenzelfde kleur.']);
    const wrap = document.createElement('div');
    wrap.className = 'gi4-g5-fraction-color-wrap';
    for (let i = 0; i < count; i++) appendNewExercise(wrap, makeG5FractionColorTable);
    b.appendChild(wrap);
  }

  function g5FractionOperationColorItems(){
    return [
      { group: 0, parts: [{ f: [1, 3] }, ' + ', { f: [8, 9] }] },
      { group: 1, parts: ['4 x ', { f: [4, 10] }] },
      { group: 1, parts: [{ m: [1, 3, 5] }] },
      { group: 2, parts: [{ f: [4, 6] }, ' van 42'] },
      { group: 3, parts: [{ f: [6, 9] }, ' x 18'] },
      { group: 4, parts: [{ m: [1, 4, 6] }] },
      { group: 3, parts: [{ f: [1, 2] }, ' van 24'] },
      { group: 0, parts: [{ f: [11, 9] }] },
      { group: 5, parts: ['5 x ', { f: [4, 9] }] },
      { group: 4, parts: [{ m: [1, 2, 3] }] },
      { group: 1, parts: [{ f: [16, 10] }] },
      { group: 2, parts: [{ f: [7, 3] }, ' x 12'] },
      { group: 4, parts: ['2 - ', { f: [2, 6] }] },
      { group: 0, parts: [{ m: [1, 2, 9] }] },
      { group: 5, parts: [{ m: [2, 2, 9] }] },
    ];
  }

  function appendG5FractionOperationParts(target, parts){
    parts.forEach(part => {
      if (typeof part === 'string') {
        target.appendChild(document.createTextNode(part));
      } else if (part.f) {
        target.appendChild(fractionBox(part.f[0], part.f[1]));
      } else if (part.m) {
        target.appendChild(mixedNumberBox(part.m[0], part.m[1], part.m[2]));
      }
    });
  }

  function makeG5FractionOperationColorTable(){
    const table = document.createElement('div');
    table.className = 'gi4-g5-fraction-operation-color-table row-delete-wrap';
    table.appendChild(rowDel(table));
    g5FractionOperationColorItems().forEach(item => {
      const cell = document.createElement('div');
      cell.className = `gi4-g5-fraction-operation-color-cell solution-group-${item.group}`;
      appendG5FractionOperationParts(cell, item.parts);
      table.appendChild(cell);
    });
    return table;
  }

  function addG5FractionOperationColor(extraCount){
    const key = 'gi4_g5_fraction_operation_color';
    const count = extraCount || Math.max(1, parseInt($('#g5FractionOperationColorCount')?.value, 10) || 1);
    if (extraCount) {
      const existing = containerInLastBlock(key, '.gi4-g5-fraction-operation-color-wrap', 'gi4-g5-fraction-operation-color-wrap');
      if (existing) {
        for (let i = 0; i < count; i++) appendNewExercise(existing, makeG5FractionOperationColorTable);
        return;
      }
    }
    const b = block(key, 'Geef wat evenveel is dezelfde kleur.', addG5FractionOperationColor);
    addFractionInstructions(b, ['Geef wat evenveel is dezelfde kleur.']);
    const wrap = document.createElement('div');
    wrap.className = 'gi4-g5-fraction-operation-color-wrap';
    for (let i = 0; i < count; i++) appendNewExercise(wrap, makeG5FractionOperationColorTable);
    b.appendChild(wrap);
    addLocalExerciseButton(b, '+ oefening bij deze keuze', () => addG5FractionOperationColor(1));
  }

  function g5FractionOperatorSeeds(){
    return [
      { num: 4, den: 7, total: 63 },
      { num: 3, den: 5, total: 20 },
      { num: 3, den: 4, total: 12 },
      { num: 5, den: 8, total: 56 },
      { num: 2, den: 9, total: 72 },
      { num: 7, den: 10, total: 90 },
      { num: 4, den: 6, total: 48 },
      { num: 5, den: 12, total: 84 },
      { num: 6, den: 11, total: 99 },
      { num: 3, den: 8, total: 64 },
    ];
  }

  function g5FractionOperatorSeed(namespace){
    return pickUnused(namespace, g5FractionOperatorSeeds(), seed => `${seed.num}/${seed.den}-${seed.total}`);
  }

  function g5FractionOperatorResult(seed){
    return seed.total / seed.den * seed.num;
  }

  function greenText(text){
    const span = document.createElement('span');
    span.className = 'gi4-green-text';
    span.textContent = text;
    return span;
  }

  function g5OperatorValueSlot(value, reduced = '', reducedPos = 'above', solutionOnly = true){
    const slot = document.createElement('span');
    slot.className = 'gi4-g5-operator-op-slot';
    const placeholder = Object.assign(document.createElement('span'), { className: 'op-placeholder', textContent: '.' });
    const answer = document.createElement('span');
    answer.className = solutionOnly ? 'gi4-solution-answer op-answer' : 'op-answer always';
    answer.textContent = String(value);
    if (reduced !== '') {
      answer.classList.add('is-cancelled');
      const small = document.createElement('span');
      small.className = `op-reduced ${reducedPos}`;
      small.textContent = String(reduced);
      answer.appendChild(small);
    }
    if (solutionOnly) slot.append(placeholder, answer);
    else slot.appendChild(answer);
    return slot;
  }

  function g5OperatorCancelledFraction(seed, solutionOnly = true){
    const part = seed.total / seed.den;
    const converted = document.createElement('span');
    converted.className = 'gi4-g5-operator-converted';
    const top = document.createElement('span');
    top.className = 'op-top';
    top.append(
      g5OperatorValueSlot(seed.num, '', 'above', solutionOnly),
      Object.assign(document.createElement('b'), { textContent: 'x' }),
      g5OperatorValueSlot(seed.total, part, 'above', solutionOnly)
    );
    const line = Object.assign(document.createElement('span'), { className: 'op-line' });
    const bottom = document.createElement('span');
    bottom.className = 'op-bottom';
    bottom.appendChild(g5OperatorValueSlot(seed.den, 1, 'below', solutionOnly));
    converted.append(top, line, bottom);
    return converted;
  }

  function makeG5FractionOperatorIntro(){
    const blockEl = block('gi4_g5_fraction_operator_intro', 'Breuk als operator: kijk en leer.', addCount => addG5FractionOperator(addCount || 1, 'intro'));
    const card = document.createElement('div');
    card.className = 'gi4-g5-operator-intro keep-together';
    card.innerHTML = '<div class="gi4-common-learn-badge">Kijk en leer!</div><h3>Breuk als operator</h3>';

    const grid = document.createElement('div');
    grid.className = 'gi4-g5-operator-intro-grid';

    const model = document.createElement('div');
    model.className = 'gi4-g5-operator-intro-panel';
    const seed = { num: 3, den: 4, total: 12 };
    const modelTitle = document.createElement('strong');
    modelTitle.append('Hoeveel is ', fractionBox(seed.num, seed.den), ` van ${seed.total}?`);
    const bar = fractionQuantityBar(seed, true);
    const steps = document.createElement('div');
    steps.className = 'gi4-g5-operator-steps';
    steps.innerHTML = `<span>het geheel &rarr; ${seed.total}</span><span>1 breukdeel &rarr; ${seed.total} : ${seed.den} = ${seed.total / seed.den}</span><span>${seed.num} breukdelen &rarr; ${seed.num} x ${seed.total / seed.den} = ${g5FractionOperatorResult(seed)}</span>`;
    model.append(modelTitle, bar, steps);

    const algebra = document.createElement('div');
    algebra.className = 'gi4-g5-operator-intro-panel algebra';
    const title = document.createElement('strong');
    title.className = 'gi4-g5-operator-title-line';
    title.append(fractionBox(seed.num, seed.den), greenText(' van '), `${seed.total} = `, fractionBox(seed.num, seed.den), greenText(' x '), String(seed.total));
    const calcWrap = document.createElement('div');
    calcWrap.className = 'gi4-g5-operator-intro-calc-wrap';
    const calc = document.createElement('div');
    calc.className = 'gi4-g5-operator-calc';
    const calcLine1 = document.createElement('div');
    calcLine1.className = 'gi4-g5-operator-calc-line';
    calcLine1.append(
      fractionBox(seed.num, seed.den),
      ` x ${seed.total} = `,
      g5OperatorCancelledFraction(seed, false)
    );
    const calcLine2 = document.createElement('div');
    calcLine2.className = 'gi4-g5-operator-calc-line indent';
    calcLine2.textContent = `= ${seed.num} x ${seed.total / seed.den}`;
    const calcLine3 = document.createElement('div');
    calcLine3.className = 'gi4-g5-operator-calc-line indent strong';
    calcLine3.textContent = `= ${g5FractionOperatorResult(seed)}`;
    calc.append(calcLine1, calcLine2, calcLine3);
    const rule = document.createElement('div');
    rule.className = 'gi4-g5-operator-rule';
    rule.innerHTML = '<span>geheel</span><span>&darr;</span><span>1 breukdeel</span><span>&darr;</span><span>breukdelen</span>';
    calcWrap.append(calc, rule);
    const answer = document.createElement('strong');
    answer.className = 'gi4-g5-operator-answer';
    answer.append(fractionBox(seed.num, seed.den), greenText(' van '), `${seed.total} = `, fractionBox(seed.num, seed.den), greenText(' x '), `${seed.total} = ${g5FractionOperatorResult(seed)}`);
    algebra.append(title, calcWrap, answer);

    grid.append(model, algebra);
    card.appendChild(grid);
    blockEl.appendChild(card);
  }

  function makeG5FractionOperatorCard(){
    const seed = g5FractionOperatorSeed('gi4_g5_fraction_operator_card');
    if (!seed) return null;
    const part = seed.total / seed.den;
    const result = g5FractionOperatorResult(seed);
    const card = document.createElement('div');
    card.className = 'gi4-g5-operator-card row-delete-wrap';
    card.appendChild(rowDel(card));

    const title = document.createElement('div');
    title.className = 'gi4-g5-operator-card-title';
    title.append(fractionBox(seed.num, seed.den), greenText(' van '), `${seed.total} = `, fractionBox(seed.num, seed.den), greenText(' x '), String(seed.total));

    const equation = document.createElement('div');
    equation.className = 'gi4-g5-operator-equation';
    equation.append(
      fractionBox(seed.num, seed.den),
      ` x ${seed.total} = `,
      g5OperatorCancelledFraction(seed, true),
      ' = ',
      Object.assign(lineWithSolution(String(result), 'tiny'), { className: 'gi4-line tiny boxed-solution' })
    );

    const notes = document.createElement('div');
    notes.className = 'gi4-g5-operator-note-lines';
    const divideLine = document.createElement('span');
    divideLine.appendChild(sol(`${seed.total} : ${seed.den} = ${part}`));
    const multiplyLine = document.createElement('span');
    multiplyLine.appendChild(sol(`${seed.num} x ${part} = ${result}`));
    notes.append(divideLine, multiplyLine);

    const final = document.createElement('div');
    final.className = 'gi4-g5-operator-final';
    final.append(fractionBox(seed.num, seed.den), ` van ${seed.total} = `, lineWithSolution(String(result), 'short'));

    card.append(title, equation, notes, final);
    return card;
  }

  function g5FractionOperatorMultiplySeeds(){
    return [
      { num: 2, den: 7, total: 21 },
      { num: 3, den: 8, total: 24 },
      { num: 5, den: 6, total: 12 },
      { num: 3, den: 10, total: 40 },
      { num: 5, den: 9, total: 27 },
      { num: 3, den: 5, total: 35 },
      { num: 4, den: 7, total: 63 },
      { num: 7, den: 8, total: 32 },
      { num: 6, den: 11, total: 55 },
      { num: 5, den: 12, total: 48 },
    ];
  }

  function makeG5FractionOperatorMultiplyRow(){
    const seed = pickUnusedOrAny('gi4_g5_fraction_operator_multiply_row', g5FractionOperatorMultiplySeeds(), s => `${s.num}/${s.den}-${s.total}`);
    const part = seed.total / seed.den;
    const result = g5FractionOperatorResult(seed);
    const row = document.createElement('div');
    row.className = 'gi4-g5-operator-list-row row-delete-wrap';
    row.appendChild(rowDel(row));
    const prompt = document.createElement('span');
    prompt.className = 'gi4-g5-operator-list-prompt';
    prompt.append(fractionBox(seed.num, seed.den), ` x ${seed.total} = `);
    const answerLine = document.createElement('span');
    answerLine.className = 'gi4-g5-operator-list-answer';
    const solution = document.createElement('span');
    solution.className = 'solution-only gi4-g5-operator-list-solution';
    solution.append(g5OperatorCancelledFraction(seed, false), ` = ${result}`);
    const helper = document.createElement('span');
    helper.className = 'solution-only gi4-g5-operator-list-helper';
    helper.textContent = `${seed.total} : ${seed.den} = ${part}`;
    answerLine.append(solution, helper);
    row.append(prompt, answerLine);
    return row;
  }

  function g5FractionMultiplySeeds(){
    return [
      { whole: 5, num: 2, den: 5 },
      { whole: 7, num: 2, den: 9 },
      { whole: 4, num: 5, den: 6 },
      { whole: 3, num: 4, den: 7 },
      { whole: 2, num: 5, den: 8 },
      { whole: 4, num: 2, den: 3 },
      { whole: 6, num: 3, den: 4 },
      { whole: 8, num: 5, den: 12 },
      { whole: 9, num: 2, den: 5 },
      { whole: 3, num: 7, den: 10 },
    ];
  }

  function g5FractionProductSolution(seed){
    const productNum = seed.whole * seed.num;
    const den = seed.den;
    const wrap = document.createElement('span');
    wrap.className = 'solution-only gi4-g5-fraction-product-solution';
    wrap.append(fractionBox(productNum, den));
    if (productNum % den === 0) {
      wrap.append(` = ${productNum / den}`);
      return wrap;
    }
    const whole = Math.floor(productNum / den);
    const rem = productNum % den;
    wrap.append(' = ', mixedNumberBox(whole, rem, den));
    const d = gcd(rem, den);
    if (d > 1) wrap.append(' = ', mixedNumberBox(whole, rem / d, den / d));
    return wrap;
  }

  function makeG5FractionMultiplyRow(){
    const seed = pickUnusedOrAny('gi4_g5_fraction_multiply_row', g5FractionMultiplySeeds(), s => `${s.whole}-${s.num}/${s.den}`);
    const row = document.createElement('div');
    row.className = 'gi4-g5-operator-list-row row-delete-wrap';
    row.appendChild(rowDel(row));
    const prompt = document.createElement('span');
    prompt.className = 'gi4-g5-operator-list-prompt';
    prompt.append(`${seed.whole} x `, fractionBox(seed.num, seed.den), ' = ');
    const answerLine = document.createElement('span');
    answerLine.className = 'gi4-g5-operator-list-answer';
    answerLine.appendChild(g5FractionProductSolution(seed));
    row.append(prompt, answerLine);
    return row;
  }

  function g5OperatorMatchAnswerKey(seed){
    const productNum = seed.kind === 'wholeFraction' ? seed.whole * seed.num : seed.total / seed.den * seed.num;
    if (seed.kind === 'fractionTotal') return String(productNum);
    if (productNum % seed.den === 0) return String(productNum / seed.den);
    const whole = Math.floor(productNum / seed.den);
    const rem = productNum % seed.den;
    const d = gcd(rem, seed.den);
    const finalNum = rem / d;
    const finalDen = seed.den / d;
    return whole > 0 ? `${whole}-${finalNum}/${finalDen}` : `${finalNum}/${finalDen}`;
  }

  function g5OperatorMatchAnswerLabel(key){
    if (key === '2-1/4') return mixedNumberBox(2, 1, 4);
    if (key === '3/4') return fractionBox(3, 4);
    return document.createTextNode(key);
  }

  function g5OperatorMatchProductWork(seed){
    const wrap = document.createElement('span');
    wrap.className = 'solution-only gi4-g5-operator-match-work';
    if (seed.kind === 'fractionTotal') {
      const part = seed.total / seed.den;
      wrap.textContent = `${seed.num} x ${part} = ${seed.num * part}`;
      return wrap;
    }

    const productNum = seed.whole * seed.num;
    wrap.append(fractionBox(productNum, seed.den));
    if (productNum % seed.den === 0) {
      wrap.append(` = ${productNum / seed.den}`);
      return wrap;
    }
    const whole = Math.floor(productNum / seed.den);
    const rem = productNum % seed.den;
    if (whole > 0) wrap.append(' = ', mixedNumberBox(whole, rem, seed.den));
    const d = gcd(rem, seed.den);
    if (d > 1) {
      if (whole > 0) wrap.append(' = ', mixedNumberBox(whole, rem / d, seed.den / d));
      else wrap.append(' = ', fractionBox(productNum / d, seed.den / d));
    }
    return wrap;
  }

  function g5OperatorMatchSeeds(){
    return [
      { side: 'left', color: '#38bdf8', kind: 'wholeFraction', whole: 9, num: 3, den: 12 },
      { side: 'left', color: '#ef4444', kind: 'fractionTotal', num: 3, den: 5, total: 35 },
      { side: 'left', color: '#fb923c', kind: 'wholeFraction', whole: 3, num: 2, den: 8 },
      { side: 'left', color: '#b565c0', kind: 'fractionTotal', num: 4, den: 5, total: 35 },
      { side: 'right', color: '#fb7185', kind: 'fractionTotal', num: 7, den: 8, total: 32 },
      { side: 'right', color: '#4ade80', kind: 'fractionTotal', num: 3, den: 4, total: 28 },
      { side: 'right', color: '#0ea5e9', kind: 'wholeFraction', whole: 6, num: 3, den: 8 },
      { side: 'right', color: '#a78b7b', kind: 'wholeFraction', whole: 3, num: 3, den: 12 },
    ].map(seed => ({ ...seed, answer: g5OperatorMatchAnswerKey(seed) }));
  }

  function makeG5OperatorMatchExercise(seed){
    const row = document.createElement('div');
    row.className = `gi4-g5-operator-match-exercise ${seed.side}`;
    row.dataset.answer = seed.answer;
    row.style.setProperty('--match-color', seed.color);
    const dot = document.createElement('span');
    dot.className = seed.side === 'left' ? 'gi4-connect-dot right' : 'gi4-connect-dot left';
    const prompt = document.createElement('span');
    prompt.className = 'gi4-g5-operator-match-prompt';
    if (seed.kind === 'fractionTotal') prompt.append(fractionBox(seed.num, seed.den), ` x ${seed.total} = `);
    else prompt.append(`${seed.whole} x `, fractionBox(seed.num, seed.den), ' = ');
    const answer = document.createElement('span');
    answer.className = 'gi4-g5-operator-match-line';
    answer.appendChild(g5OperatorMatchProductWork(seed));
    row.append(prompt, answer, dot);
    return row;
  }

  function makeG5OperatorMatchResult(key){
    const circle = document.createElement('div');
    circle.className = 'gi4-g5-operator-match-result';
    circle.dataset.answer = key;
    circle.append(
      Object.assign(document.createElement('span'), { className: 'gi4-connect-dot left' }),
      Object.assign(document.createElement('span'), { className: 'gi4-connect-dot right' }),
      g5OperatorMatchAnswerLabel(key)
    );
    return circle;
  }

  function makeG5FractionOperatorMatchCard(){
    const seeds = g5OperatorMatchSeeds();
    const card = document.createElement('div');
    card.className = 'gi4-g5-operator-match-card row-delete-wrap';
    card.appendChild(rowDel(card));

    const left = document.createElement('div');
    left.className = 'gi4-g5-operator-match-col';
    seeds.filter(seed => seed.side === 'left').forEach(seed => left.appendChild(makeG5OperatorMatchExercise(seed)));

    const center = document.createElement('div');
    center.className = 'gi4-g5-operator-match-center';
    ['21', '3/4', '2-1/4', '28'].forEach(key => center.appendChild(makeG5OperatorMatchResult(key)));

    const right = document.createElement('div');
    right.className = 'gi4-g5-operator-match-col';
    seeds.filter(seed => seed.side === 'right').forEach(seed => right.appendChild(makeG5OperatorMatchExercise(seed)));

    card.append(left, center, right);
    return card;
  }

  function makeG5FractionOperatorListGrid(count, maker){
    const grid = document.createElement('div');
    grid.className = 'gi4-g5-operator-list-grid';
    for (let i = 0; i < count; i++) appendNewExercise(grid, maker);
    return grid;
  }

  function addG5FractionOperator(extraCount, forcedMode){
    const mode = forcedMode || $('#g5FractionOperatorMode')?.value || 'cards';
    if (mode === 'intro') {
      makeG5FractionOperatorIntro();
      return;
    }
    if (mode === 'matchResults') {
      const key = 'gi4_g5_fraction_operator_match';
      if (extraCount) {
        const existing = containerInLastBlock(key, '.gi4-g5-operator-match-wrap', 'gi4-g5-operator-match-wrap');
        if (existing) {
          appendNewExercise(existing, makeG5FractionOperatorMatchCard);
          requestAnimationFrame(drawSolutionLines);
          return;
        }
      }
      const blockEl = block(key, 'Verbind de oefeningen met de juiste oplossing.', addCount => addG5FractionOperator(addCount || 1, 'matchResults'));
      addFractionInstructions(blockEl, ['Denk goed na. Wat moet je zoeken?', 'Werk uit.', 'Verbind de oefeningen met de juiste oplossing.']);
      const wrap = document.createElement('div');
      wrap.className = 'gi4-g5-operator-match-wrap';
      appendNewExercise(wrap, makeG5FractionOperatorMatchCard);
      blockEl.appendChild(wrap);
      addLocalExerciseButton(blockEl, '+ oefening bij deze keuze', () => addG5FractionOperator(1, 'matchResults'));
      requestAnimationFrame(drawSolutionLines);
      return;
    }
    if (mode === 'multiplyOperator' || mode === 'multiplyFraction') {
      const key = `gi4_g5_fraction_operator_${mode}`;
      const maker = mode === 'multiplyOperator' ? makeG5FractionOperatorMultiplyRow : makeG5FractionMultiplyRow;
      const count = extraCount || Math.max(1, Math.min(12, parseInt($('#g5FractionOperatorCount')?.value, 10) || 6));
      if (extraCount) {
        const existing = containerInLastBlock(key, '.gi4-g5-operator-list-grid', 'gi4-g5-operator-list-grid');
        if (existing) {
          for (let i = 0; i < count; i++) appendNewExercise(existing, maker);
          return;
        }
      }
      const title = mode === 'multiplyOperator' ? 'Los de vermenigvuldigingen op.' : 'Vermenigvuldig de breuken.';
      const blockEl = block(key, title, addCount => addG5FractionOperator(addCount || 1, mode));
      addFractionInstructions(blockEl, mode === 'multiplyOperator'
        ? ['Los de vermenigvuldigingen op.']
        : ['Vermenigvuldig de breuken.', 'Schrijf je uitkomst steeds in de eenvoudigste vorm of als gemengd getal.']);
      blockEl.appendChild(makeG5FractionOperatorListGrid(count, maker));
      addLocalExerciseButton(blockEl, '+ oefening bij deze keuze', () => addG5FractionOperator(1, mode));
      return;
    }
    const key = 'gi4_g5_fraction_operator_cards';
    const count = extraCount || Math.max(1, Math.min(8, parseInt($('#g5FractionOperatorCount')?.value, 10) || 2));
    if (extraCount) {
      const existing = containerInLastBlock(key, '.gi4-g5-operator-grid', 'gi4-g5-operator-grid');
      if (existing) {
        for (let i = 0; i < count; i++) appendNewExercise(existing, makeG5FractionOperatorCard);
        return;
      }
    }
    const blockEl = block(key, 'Breuk als operator.', addCount => addG5FractionOperator(addCount || 1, 'cards'));
    addFractionInstructions(blockEl, ['Los samen stap voor stap op.']);
    const grid = document.createElement('div');
    grid.className = 'gi4-g5-operator-grid';
    for (let i = 0; i < count; i++) appendNewExercise(grid, makeG5FractionOperatorCard);
    blockEl.appendChild(grid);
    addLocalExerciseButton(blockEl, '+ oefening bij deze keuze', () => addG5FractionOperator(1, 'cards'));
  }

  function divisorsOf(n){
    const result = [];
    for (let i = 1; i <= n; i++) if (n % i === 0) result.push(i);
    return result;
  }

  function divisorPairsOf(n){
    const pairs = [];
    for (let i = 1; i <= Math.sqrt(n); i++) {
      if (n % i === 0) pairs.push([i, n / i]);
    }
    return pairs;
  }

  function multiplesOf(n, count = 9){
    return Array.from({ length: count }, (_, i) => n * i);
  }

  function addG5GcdLcmInfo(){
    const key = 'gi4_g5_gcd_lcm_info';
    const b = block(key, 'GGD en KGV: kijk en leer.', addG5GcdLcmInfo);
    const card = document.createElement('div');
    card.className = 'gi4-g5-info-card row-delete-wrap';
    card.innerHTML = `
      <div class="gi4-g5-info-title">GGD en KGV</div>
      <div class="gi4-g5-info-cols">
        <section>
          <h4>Grootste gemeenschappelijke deler (GGD)</h4>
          <p><strong>Delers</strong> zijn alle getallen waardoor ik een getal kan delen.</p>
          <ol><li>Ik zoek de delers van elk getal.</li><li>Ik duid de gemeenschappelijke delers aan.</li><li>Ik kies de grootste gemeenschappelijke deler.</li></ol>
          <div class="gi4-g5-info-example">
            <div class="gi4-g5-info-divisors"><strong>6</strong><div><span>1</span><span>6</span><span class="hit">2</span><span>3</span></div></div>
            <div class="gi4-g5-info-divisors"><strong>10</strong><div><span>1</span><span>10</span><span class="hit">2</span><span>5</span></div></div>
          </div>
          <p class="example">De GGD van 6 en 10 is 2.</p>
        </section>
        <section>
          <h4>Kleinste gemeenschappelijk veelvoud (KGV)</h4>
          <p><strong>Veelvouden</strong> zijn producten van dat getal.</p>
          <ol><li>Ik schrijf veelvouden van elk getal.</li><li>Ik duid de gemeenschappelijke veelvouden aan.</li><li>Ik kies het kleinste gemeenschappelijk veelvoud groter dan 0.</li></ol>
          <div class="gi4-g5-info-example">
            <div class="gi4-g5-info-multiples"><strong>4</strong><span>0 - 4 - 8 - <b>12</b> - 16 - 20 - 24 - ...</span></div>
            <div class="gi4-g5-info-multiples"><strong>6</strong><span>0 - 6 - <b>12</b> - 18 - 24 - 30 - ...</span></div>
          </div>
          <p class="example">Het KGV van 4 en 6 is 12.</p>
        </section>
      </div>`;
    card.appendChild(rowDel(card));
    b.appendChild(card);
  }

  function addG5Divisibility(extraCount){
    const key = 'gi4_g5_divisibility';
    const count = extraCount || Math.max(6, parseInt($('#g5DivisibilityCount')?.value, 10) || 10);
    const nums = Array.from({ length: count }, () => rnd(12, 100));
    if (extraCount) {
      const existing = containerInLastBlock(key, '.gi4-g5-divisibility-cloud', 'gi4-g5-divisibility-cloud');
      if (existing) {
        nums.forEach(n => existing.appendChild(makeG5DivisibilityNumber(n)));
        return;
      }
    }
    const b = block(key, 'Omkring de getallen die deelbaar zijn door 10, 5, 2 en 3.', addG5Divisibility);
    addFractionInstructions(b, ['Omkring de getallen die deelbaar zijn door 10 met groen.', 'Omkring de getallen die deelbaar zijn door 5 met rood.', 'Omkring de getallen die deelbaar zijn door 2 met blauw.', 'Omkring de getallen die deelbaar zijn door 3 met geel.']);
    const cloud = document.createElement('div');
    cloud.className = 'gi4-g5-divisibility-cloud row-delete-wrap';
    cloud.appendChild(rowDel(cloud));
    nums.forEach(n => cloud.appendChild(makeG5DivisibilityNumber(n)));
    b.append(cloud, makeG5DivisibilityRules());
  }

  function makeG5DivisibilityNumber(n){
    const item = document.createElement('span');
    item.textContent = n;
    [10, 5, 2, 3].forEach(d => { if (n % d === 0) item.classList.add(`div-by-${d}`); });
    return item;
  }

  function makeG5DivisibilityRules(){
    const wrap = document.createElement('div');
    wrap.className = 'gi4-g5-divisibility-rules row-delete-wrap';
    wrap.appendChild(rowDel(wrap));
    const left = [
      'Een getal is deelbaar door 10 ...',
      'Een getal is deelbaar door 2 ...',
      'Een getal is deelbaar door 5 ...',
      'Een getal is deelbaar door 3 ...',
    ];
    const right = [
      '... als het getal eindigt op 0.',
      '... als het getal eindigt op 0 of 5.',
      '... als het getal eindigt op 0, 2, 4, 6 of 8.',
      '... als de som van de cijfers deelbaar is door 3.',
    ];
    const leftCol = document.createElement('div');
    const rightCol = document.createElement('div');
    left.forEach(text => leftCol.appendChild(makeG5ConnectRule(text, 'right')));
    right.sort(() => Math.random() - .5).forEach(text => rightCol.appendChild(makeG5ConnectRule(text, 'left')));
    wrap.append(leftCol, rightCol);
    return wrap;
  }

  function makeG5ConnectRule(text, dotSide){
    const item = document.createElement('div');
    item.className = `gi4-g5-connect-rule dot-${dotSide}`;
    item.textContent = text;
    item.appendChild(document.createElement('i'));
    return item;
  }

  function makeG5DivisorsCard(n, example = false){
    const card = document.createElement('div');
    card.className = 'gi4-g5-divisors-card row-delete-wrap';
    if (example) card.classList.add('example');
    card.appendChild(rowDel(card));
    const title = document.createElement('strong');
    title.textContent = n;
    const list = document.createElement('div');
    list.className = 'gi4-g5-divisor-list';
    const pairs = divisorPairsOf(n);
    for (let i = 0; i < Math.max(4, pairs.length); i++) {
      const pair = pairs[i] || ['', ''];
      pair.forEach(value => {
        const line = document.createElement('span');
        if (example && value !== '') line.textContent = value;
        else if (value !== '') line.appendChild(sol(String(value)));
        list.appendChild(line);
      });
    }
    card.append(title, list);
    return card;
  }

  function addG5Divisors(extraCount){
    const key = 'gi4_g5_divisors';
    const count = extraCount || Math.max(1, parseInt($('#g5DivisorsCount')?.value, 10) || 6);
    if (extraCount) {
      const existing = containerInLastBlock(key, '.gi4-g5-divisors-grid', 'gi4-g5-divisors-grid');
      if (existing) {
        for (let i = 0; i < count; i++) existing.appendChild(makeG5DivisorsCard(pick([12, 15, 16, 18, 21, 24, 28, 30]), false));
        return;
      }
    }
    const withExample = $('#g5DivisorsExample')?.checked;
    const b = block(key, 'Schrijf alle delers bij elk getal.', addG5Divisors);
    addFractionInstructions(b, ['Schrijf alle delers bij elk getal.', 'Je hoeft elke deler maar 1 keer te noteren.']);
    const grid = document.createElement('div');
    grid.className = 'gi4-g5-divisors-grid';
    const nums = [12, 15, 21, 16, 24, 18, 28, 30].sort(() => Math.random() - .5).slice(0, count);
    nums.forEach((n, i) => grid.appendChild(makeG5DivisorsCard(n, withExample && i === 0)));
    b.appendChild(grid);
  }

  function makeG5GcdCard(a, bNum){
    const common = divisorsOf(a).filter(d => bNum % d === 0);
    const card = document.createElement('div');
    card.className = 'gi4-g5-gcd-card row-delete-wrap';
    card.appendChild(rowDel(card));
    const title = document.createElement('strong');
    title.textContent = `Zoek de GGD van ${a} en ${bNum}.`;
    const cols = document.createElement('div');
    cols.className = 'gi4-g5-gcd-cols';
    [a, bNum].forEach(n => {
      const col = document.createElement('div');
      const heading = document.createElement('strong');
      heading.textContent = n;
      const writing = document.createElement('span');
      writing.className = 'gi4-g5-gcd-writing-line';
      const answers = document.createElement('span');
      answers.className = 'gi4-g5-gcd-col-solutions';
      const divs = divisorsOf(n);
      answers.appendChild(sol(divs.join(', ')));
      col.append(heading, writing, answers);
      cols.appendChild(col);
    });
    const line1 = document.createElement('p');
    line1.append(`De gemeenschappelijke delers van ${a} en ${bNum} zijn `, lineWithSolution(common.join(', '), 'long'), '.');
    const line2 = document.createElement('p');
    line2.append(`De grootste gemeenschappelijke deler van ${a} en ${bNum} is `, lineWithSolution(String(gcd(a, bNum)), 'short'), '.');
    card.append(title, cols, line1, line2);
    return card;
  }

  function addG5Gcd(extraCount){
    const key = 'gi4_g5_gcd';
    const count = extraCount || Math.max(1, parseInt($('#g5GcdCount')?.value, 10) || 2);
    const pairs = [[20,15],[12,21],[18,30],[24,36],[40,60],[28,42]];
    if (extraCount) {
      const existing = containerInLastBlock(key, '.gi4-g5-gcd-grid', 'gi4-g5-gcd-grid');
      if (existing) { for (let i = 0; i < count; i++) existing.appendChild(makeG5GcdCard(...pick(pairs))); return; }
    }
    const b = block(key, 'Schrijf alle delers. Onderstreep de gemeenschappelijke delers. Omkring de GGD.', addG5Gcd);
    addFractionInstructions(b, ['Schrijf alle delers bij elk getal.', 'Onderstreep de gemeenschappelijke delers.', 'Omkring de GGD.', 'Vul aan.']);
    const grid = document.createElement('div');
    grid.className = 'gi4-g5-gcd-grid';
    pairs.sort(() => Math.random() - .5).slice(0, count).forEach(pair => grid.appendChild(makeG5GcdCard(...pair)));
    b.appendChild(grid);
  }

  function addG5Multiples(extraCount){
    const key = 'gi4_g5_multiples';
    const rows = extraCount || Math.max(2, parseInt($('#g5MultiplesCount')?.value, 10) || 4);
    const withExample = !extraCount && $('#g5MultiplesExample')?.checked;
    const nums = [2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - .5).slice(0, rows);
    if (extraCount) {
      const existing = containerInLastBlock(key, '.gi4-g5-multiples-table tbody', '', 'tbody');
      if (existing) {
        nums.forEach(n => existing.appendChild(makeG5MultiplesRow(n, false)));
        return;
      }
    }
    const b = block(key, 'Schrijf de eerste 9 veelvouden bij elk getal.', addG5Multiples);
    const table = document.createElement('table');
    table.className = 'gi4-g5-multiples-table';
    const body = document.createElement('tbody');
    nums.forEach((n, i) => body.appendChild(makeG5MultiplesRow(n, withExample && i === 0)));
    table.appendChild(body);
    b.appendChild(table);
  }

  function makeG5MultiplesRow(n, example = false){
    const tr = document.createElement('tr');
    tr.className = 'row-delete-wrap';
    if (example) tr.classList.add('example');
    const label = document.createElement('th');
    label.textContent = `veelvouden van ${n}`;
    const td = document.createElement('td');
    const text = multiplesOf(n).join(', ');
    if (example) td.textContent = text;
    else td.appendChild(lineWithSolution(text, 'long'));
    const remove = document.createElement('td');
    remove.className = 'gi4-table-delete-cell';
    remove.appendChild(rowDel(tr));
    tr.append(label, td, remove);
    return tr;
  }

  function makeG5LcmCard(a, bNum){
    const common = multiplesOf(a, 16).filter(v => v > 0 && v % bNum === 0).slice(0, 5);
    const card = document.createElement('div');
    card.className = 'gi4-g5-lcm-card row-delete-wrap';
    card.appendChild(rowDel(card));
    const title = document.createElement('strong');
    title.textContent = `Zoek het KGV van ${a} en ${bNum}.`;
    const table = document.createElement('table');
    table.className = 'gi4-g5-lcm-lines';
    [a, bNum].forEach(n => {
      const tr = document.createElement('tr');
      const th = document.createElement('th');
      th.textContent = n;
      const td = document.createElement('td');
      td.appendChild(lineWithSolution(multiplesOf(n, 9).join(', '), 'long'));
      tr.append(th, td);
      table.appendChild(tr);
    });
    const line1 = document.createElement('p');
    line1.append(`De gemeenschappelijke veelvouden van ${a} en ${bNum} zijn `, lineWithSolution(common.join(', '), 'long'), '.');
    const line2 = document.createElement('p');
    line2.append(`Het kleinste gemeenschappelijke veelvoud van ${a} en ${bNum} is `, lineWithSolution(String(lcm(a, bNum)), 'short'), '.');
    card.append(title, table, line1, line2);
    return card;
  }

  function addG5Lcm(extraCount){
    const key = 'gi4_g5_lcm';
    const count = extraCount || Math.max(1, parseInt($('#g5LcmCount')?.value, 10) || 2);
    const pairs = [[3,4],[6,9],[4,6],[8,3],[6,3],[5,10]];
    if (extraCount) {
      const existing = containerInLastBlock(key, '.gi4-g5-lcm-grid', 'gi4-g5-lcm-grid');
      if (existing) { for (let i = 0; i < count; i++) existing.appendChild(makeG5LcmCard(...pick(pairs))); return; }
    }
    const b = block(key, 'Schrijf de eerste 9 veelvouden. Onderstreep de gemeenschappelijke veelvouden. Omkring het KGV.', addG5Lcm);
    addFractionInstructions(b, ['Schrijf bij elk getal de eerste 9 veelvouden.', 'Onderstreep de gemeenschappelijke veelvouden.', 'Omkring het KGV.', 'Vul aan.']);
    const grid = document.createElement('div');
    grid.className = 'gi4-g5-lcm-grid';
    pairs.sort(() => Math.random() - .5).slice(0, count).forEach(pair => grid.appendChild(makeG5LcmCard(...pair)));
    b.appendChild(grid);
  }

  function addG5GcdLcmMatch(extraCount){
    const key = 'gi4_g5_gcd_lcm_match';
    const count = extraCount || Math.max(4, parseInt($('#g5GcdLcmMatchCount')?.value, 10) || 8);
    const items = [
      ['KGV', 6, 4], ['GGD', 18, 30], ['KGV', 4, 10], ['GGD', 24, 48],
      ['KGV', 8, 3], ['GGD', 40, 60], ['KGV', 6, 3], ['GGD', 24, 36],
      ['KGV', 5, 10], ['GGD', 28, 42], ['KGV', 3, 4], ['GGD', 12, 21],
    ].sort(() => Math.random() - .5).slice(0, count);
    const b = block(key, 'Zoek de GGD of het KGV. Geef oefeningen met hetzelfde resultaat dezelfde kleur.', addG5GcdLcmMatch);
    addFractionInstructions(b, ['Zoek de GGD of het KGV van de getallen op het kaartje.', 'Geef oefeningen die hetzelfde resultaat hebben eenzelfde kleur.']);
    const grid = document.createElement('div');
    grid.className = 'gi4-g5-match-grid';
    items.forEach(([kind, a, bNum]) => {
      const card = document.createElement('div');
      card.className = `gi4-g5-match-card solution-${kind === 'KGV' ? lcm(a,bNum) : gcd(a,bNum)} row-delete-wrap`;
      card.appendChild(rowDel(card));
      const kindText = document.createElement('strong');
      kindText.textContent = `${kind} van`;
      const nums = document.createElement('span');
      nums.textContent = `${a} en ${bNum}`;
      card.append(kindText, nums);
      grid.appendChild(card);
    });
    b.appendChild(grid);
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

  function fractionQuantitySeeds(){
    return [
      { num: 1, den: 5, total: 10 }, { num: 3, den: 4, total: 8 },
      { num: 3, den: 4, total: 12 }, { num: 4, den: 7, total: 14 },
      { num: 4, den: 5, total: 15 }, { num: 2, den: 3, total: 9 },
      { num: 1, den: 6, total: 24 }, { num: 1, den: 8, total: 16 },
      { num: 4, den: 5, total: 20 }, { num: 5, den: 9, total: 27 },
      { num: 2, den: 6, total: 18 }, { num: 3, den: 4, total: 32 },
      { num: 2, den: 7, total: 21 }, { num: 7, den: 9, total: 54 },
      { num: 4, den: 5, total: 40 }, { num: 3, den: 5, total: 35 },
      { num: 5, den: 8, total: 72 }, { num: 6, den: 7, total: 56 },
    ];
  }

  function fractionQuantitySeed(namespace){
    return pickUnused(namespace, fractionQuantitySeeds(), item => `${item.num}/${item.den}-${item.total}`);
  }

  function fractionQuantityResult(seed){ return seed.total / seed.den * seed.num; }

  function fractionQuantityArray(kind, total, colored, den = 1, opts = {}){
    const { fillColor = kind === 'blocks' ? '#2563eb' : '#22c55e', emptyColor = kind === 'blocks' ? '#ef4444' : '#fef3c7', columns = den } = opts;
    const wrap = document.createElement('div');
    wrap.className = `gi4-quantity-array ${kind}`;
    wrap.style.setProperty('--qty-den', String(den));
    wrap.style.setProperty('--qty-cols', String(columns));
    for (let i = 0; i < total; i++) {
      const item = document.createElement('span');
      item.className = i < colored ? 'filled' : '';
      item.style.setProperty('--qty-color', fillColor);
      item.style.setProperty('--qty-empty', emptyColor);
      wrap.appendChild(item);
    }
    return wrap;
  }

  function fractionQuantityBar(seed, showFill = true){
    const wrap = document.createElement('div');
    wrap.className = 'gi4-quantity-bar-wrap';
    const total = document.createElement('div');
    total.className = 'gi4-quantity-bar-total';
    total.textContent = String(seed.total);
    const bar = document.createElement('div');
    bar.className = 'gi4-quantity-bar';
    bar.style.gridTemplateColumns = `repeat(${seed.den}, 1fr)`;
    for (let i = 0; i < seed.den; i++) {
      const group = document.createElement('span');
      if (showFill && i < seed.num) group.classList.add('filled');
      bar.appendChild(group);
    }
    const brace = document.createElement('div');
    brace.className = 'gi4-quantity-bar-brace';
    brace.style.width = `${seed.num / seed.den * 100}%`;
    brace.textContent = '?';
    wrap.append(total, bar, brace);
    return wrap;
  }

  function makeFractionQuantityIntro(){
    const b = block('gi4_fraction_quantity_intro', 'Breuk van een hoeveelheid: kijk en leer.', null);
    const card = document.createElement('div');
    card.className = 'gi4-quantity-intro keep-together';
    card.innerHTML = '<div class="gi4-common-learn-badge">Kijk en leer!</div><h3>de breuk als operator</h3>';
    const grid = document.createElement('div');
    grid.className = 'gi4-quantity-intro-grid';
    [
      { num: 1, den: 5, total: 10, kind: 'balls' },
      { num: 3, den: 4, total: 8, kind: 'bar' },
    ].forEach(seed => {
      const box = document.createElement('div');
      box.className = 'gi4-quantity-intro-card';
      const title = document.createElement('strong');
      title.append('Hoeveel is ', fractionBox(seed.num, seed.den), ` van ${seed.total}?`);
      box.appendChild(title);
      if (seed.kind === 'balls') box.appendChild(fractionQuantityArray('balls', seed.total, fractionQuantityResult(seed), seed.den));
      else box.appendChild(fractionQuantityBar(seed));
      const work = document.createElement('div');
      work.className = 'gi4-quantity-work';
      work.innerHTML = `<span>geheel &rarr; ${seed.total}</span><span>1 breukdeel &rarr; ${seed.total / seed.den}</span>`;
      if (seed.num > 1) work.innerHTML += `<span>${seed.num} breukdelen &rarr; ${fractionQuantityResult(seed)}</span>`;
      const answer = document.createElement('strong');
      answer.className = 'gi4-quantity-answer';
      answer.append(fractionBox(seed.num, seed.den), ` van ${seed.total} = ${fractionQuantityResult(seed)}`);
      box.append(work, answer);
      grid.appendChild(box);
    });
    card.appendChild(grid);
    b.appendChild(card);
  }

  function makeFractionQuantityPartCard(){
    const variants = [
      { kind: 'balls', total: 6, colored: 4, den: 3, cols: 3, label: 'balletjes', color: 'groen', fill: '#22c55e', empty: '#fecaca' },
      { kind: 'blocks', total: 12, colored: 6, den: 2, cols: 6, label: 'blokjes', color: 'blauw', fill: '#2563eb', empty: '#fee2e2' },
      { kind: 'balls', total: 9, colored: 6, den: 3, cols: 3, label: 'balletjes', color: 'oranje', fill: '#fb923c', empty: '#bbf7d0' },
      { kind: 'blocks', total: 15, colored: 5, den: 3, cols: 3, label: 'blokjes', color: 'blauw', fill: '#2563eb', empty: '#fef3c7' },
    ];
    const seed = pickUnused('gi4_fraction_quantity_part', variants, item => `${item.kind}-${item.total}-${item.colored}`);
    if (!seed) return null;
    const card = document.createElement('div');
    card.className = 'gi4-quantity-part-card row-delete-wrap';
    card.appendChild(rowDel(card));
    card.appendChild(fractionQuantityArray(seed.kind, seed.total, seed.colored, seed.den, { fillColor: seed.fill, emptyColor: seed.empty, columns: seed.cols }));
    const text = document.createElement('div');
    text.className = 'gi4-quantity-part-text';
    text.innerHTML = `<strong>Welk deel van de ${seed.label} is ${seed.color}?</strong>`;
    text.append(
      Object.assign(document.createElement('span'), { innerHTML: `Hoeveel is het <strong>geheel?</strong> ` }),
      lineWithSolution(String(seed.total), 'tiny'),
      Object.assign(document.createElement('span'), { innerHTML: `In hoeveel <strong>gelijke delen</strong> verdeel ik het geheel? ` }),
      lineWithSolution(String(seed.den), 'tiny'),
      Object.assign(document.createElement('span'), { innerHTML: `<strong>Hoeveel breukdelen</strong> zijn ${seed.color}? ` }),
      lineWithSolution(String(seed.colored / (seed.total / seed.den)), 'tiny')
    );
    const fracLine = document.createElement('div');
    fracLine.className = 'gi4-quantity-frac-line';
    fracLine.append('-> ', fractionBox('', '', seed.colored / (seed.total / seed.den), seed.den), ` van de ${seed.label} is ${seed.color}.`);
    text.appendChild(fracLine);
    card.appendChild(text);
    return card;
  }

  function makeFractionQuantityOperatorCard(mode = 'operator', fixedSeed = null, withDelete = true){
    const seed = fixedSeed || fractionQuantitySeed(`gi4_fraction_quantity_${mode}`);
    if (!seed) return null;
    const card = document.createElement('div');
    card.className = `gi4-quantity-operator-card ${mode} row-delete-wrap`;
    if (withDelete) card.appendChild(rowDel(card));
    const title = document.createElement('strong');
    title.className = 'gi4-quantity-card-title';
    title.append('Hoeveel is ', fractionBox(seed.num, seed.den), ` van ${seed.total}?`);
    card.appendChild(title);
    if (mode === 'operator') {
      const model = document.createElement('div');
      model.className = 'gi4-quantity-strip-model';
      model.appendChild(fractionQuantityBar(seed, true));
      card.appendChild(model);
    }
    const work = document.createElement('div');
    work.className = 'gi4-quantity-operator-work';
    const workRow = (label, answer, op = '', opAnswer = '') => {
      const row = document.createElement('div');
      row.className = 'gi4-quantity-work-row';
      row.append(Object.assign(document.createElement('span'), { className: 'gi4-quantity-work-label', textContent: label }), lineWithSolution(String(answer), 'tiny'));
      if (op) row.append(Object.assign(document.createElement('b'), { textContent: op }), lineWithSolution(String(opAnswer), 'tiny'));
      else row.append(Object.assign(document.createElement('b'), { textContent: '' }), Object.assign(document.createElement('span'), { className: 'gi4-quantity-empty-slot' }));
      return row;
    };
    work.appendChild(workRow('geheel ->', seed.total, ':', seed.den));
    work.appendChild(workRow('1 breukdeel ->', seed.total / seed.den));
    if (seed.num > 1) {
      work.appendChild(workRow(`${seed.num} breukdelen ->`, fractionQuantityResult(seed), 'x', seed.num));
    }
    const answer = document.createElement('div');
    answer.className = 'gi4-quantity-final';
    answer.append(fractionBox(seed.num, seed.den), ` van ${seed.total} = `, lineWithSolution(String(fractionQuantityResult(seed)), 'tiny'));
    card.append(work, answer);
    return card;
  }

  function makeFractionQuantityQuestionsCard(){
    const variants = [
      { total: 12, blue: 3, red: 9, groups: 4 },
      { total: 10, blue: 6, red: 4, groups: 5 },
      { total: 15, blue: 6, red: 9, groups: 5 },
      { total: 8, blue: 4, red: 4, groups: 4 },
    ];
    const seed = pickUnused('gi4_fraction_quantity_questions', variants, item => `${item.total}-${item.blue}-${item.groups}`);
    if (!seed) return null;
    const card = document.createElement('div');
    card.className = 'gi4-quantity-questions-card row-delete-wrap';
    card.appendChild(rowDel(card));
    card.appendChild(fractionQuantityArray('blocks', seed.total, seed.blue, seed.groups, { fillColor: '#2563eb', emptyColor: '#ef4444', columns: seed.groups }));
    const blueParts = seed.blue / (seed.total / seed.groups);
    const redParts = seed.red / (seed.total / seed.groups);
    const lines = document.createElement('div');
    lines.className = 'gi4-quantity-question-lines';
    lines.append(
      `Het geheel is `, lineWithSolution(String(seed.total), 'tiny'), ` blokken. Het geheel is verdeeld in `, lineWithSolution(String(seed.groups), 'tiny'), ` gelijke groepen.`,
    );
    const questionRow = document.createElement('div');
    questionRow.className = 'gi4-quantity-color-question-row';
    const blue = document.createElement('span');
    blue.append('Welk deel van de blokken is blauw? ', fractionBox('', '', blueParts, seed.groups));
    const red = document.createElement('span');
    red.append('Welk deel van de blokken is rood? ', fractionBox('', '', redParts, seed.groups));
    questionRow.append(blue, red);
    lines.appendChild(questionRow);
    card.appendChild(lines);
    return card;
  }

  function makeFractionQuantityQuickItem(seed){
    const item = document.createElement('div');
    item.className = 'gi4-quantity-quick-item row-delete-wrap';
    item.dataset.promptKey = `${seed.num}/${seed.den}-${seed.total}`;
    item.appendChild(rowDel(item));
    item.append(fractionBox(seed.num, seed.den), ` van ${seed.total} = `, lineWithSolution(String(fractionQuantityResult(seed)), 'tiny'));
    item.appendChild(Object.assign(document.createElement('span'), { className: 'gi4-quantity-note-lines' }));
    return item;
  }

  function appendFractionQuantityQuickItems(list, amount){
    const existing = Array.from(list.querySelectorAll('.gi4-quantity-quick-item')).map(item => item.dataset.promptKey);
    const pool = fractionQuantitySeeds().filter(s => s.total >= 20);
    for (let i = 0; i < amount; i++) {
      const seed = pool.find(item => !existing.includes(`${item.num}/${item.den}-${item.total}`)) || pick(pool);
      list.appendChild(makeFractionQuantityQuickItem(seed));
      existing.push(`${seed.num}/${seed.den}-${seed.total}`);
    }
  }

  function makeFractionQuantityQuickCard(count = 6){
    const card = document.createElement('div');
    card.className = 'gi4-quantity-quick-card';
    const list = document.createElement('div');
    list.className = 'gi4-quantity-quick-grid';
    appendFractionQuantityQuickItems(list, count);
    card.appendChild(list);
    return card;
  }

  function makeFractionQuantitySameCard(){
    const card = document.createElement('div');
    card.className = 'gi4-quantity-same-card row-delete-wrap';
    card.appendChild(rowDel(card));
    const values = [
      { num: 3, den: 7, total: 49 }, { num: 4, den: 6, total: 36 },
      { num: 5, den: 8, total: 32 }, { num: 2, den: 7, total: 63 },
      { num: 2, den: 6, total: 60 }, { num: 7, den: 9, total: 27 },
      { num: 3, den: 8, total: 48 }, { num: 3, den: 5, total: 40 },
    ];
    values.forEach(seed => {
      const item = document.createElement('span');
      item.dataset.answer = String(fractionQuantityResult(seed));
      item.append(fractionBox(seed.num, seed.den), ` van ${seed.total}`);
      card.appendChild(item);
    });
    return card;
  }

  function fractionQuantityCompareSeeds(mode){
    if (mode === 'compareSameWhole') return [
      [{ num: 1, den: 5, total: 10 }, { num: 3, den: 5, total: 10 }],
      [{ num: 5, den: 6, total: 24 }, { num: 2, den: 6, total: 24 }],
      [{ num: 2, den: 7, total: 21 }, { num: 5, den: 7, total: 21 }],
      [{ num: 1, den: 4, total: 16 }, { num: 3, den: 4, total: 16 }],
    ];
    if (mode === 'compareSolve') return [
      [{ num: 1, den: 4, total: 12 }, { num: 1, den: 4, total: 8 }],
      [{ num: 2, den: 3, total: 9 }, { num: 2, den: 3, total: 15 }],
      [{ num: 3, den: 5, total: 20 }, { num: 3, den: 5, total: 15 }],
      [{ num: 4, den: 6, total: 24 }, { num: 4, den: 6, total: 18 }],
    ];
    return [
      [{ num: 1, den: 5, total: 10 }, { num: 1, den: 5, total: 15 }],
      [{ num: 5, den: 6, total: 24 }, { num: 5, den: 6, total: 12 }],
      [{ num: 2, den: 7, total: 21 }, { num: 2, den: 7, total: 35 }],
      [{ num: 3, den: 8, total: 16 }, { num: 3, den: 8, total: 24 }],
    ];
  }

  function fractionQuantityComparePair(mode){
    return pickUnused(`gi4_fraction_quantity_${mode}`, fractionQuantityCompareSeeds(mode), pair => pair.map(s => `${s.num}/${s.den}-${s.total}`).join('|'));
  }

  function fractionQuantityCompareStrip(seed){
    const box = document.createElement('div');
    box.className = 'gi4-quantity-compare-strip';
    box.appendChild(fractionQuantityBar(seed, true));
    box.appendChild(fractionBox(seed.num, seed.den));
    return box;
  }

  function makeFractionQuantityCompareCard(mode){
    const pair = fractionQuantityComparePair(mode);
    if (!pair) return null;
    const card = document.createElement('div');
    card.className = `gi4-quantity-compare-card ${mode} row-delete-wrap`;
    card.appendChild(rowDel(card));
    const strips = document.createElement('div');
    strips.className = 'gi4-quantity-compare-strips';
    pair.forEach(seed => strips.appendChild(fractionQuantityCompareStrip(seed)));
    const compare = document.createElement('div');
    compare.className = 'gi4-quantity-compare-line';
    const symbol = compareSymbol(fractionQuantityResult(pair[0]), fractionQuantityResult(pair[1]));
    compare.append(fractionBox(pair[0].num, pair[0].den), ` van ${pair[0].total} `, compareBox(symbol), fractionBox(pair[1].num, pair[1].den), ` van ${pair[1].total}`);
    card.append(strips, compare);
    return card;
  }

  function makeFractionQuantityCompareSolveCard(){
    const pair = fractionQuantityComparePair('compareSolve');
    if (!pair) return null;
    const card = document.createElement('div');
    card.className = 'gi4-quantity-compare-solve-card row-delete-wrap';
    card.appendChild(rowDel(card));
    const top = document.createElement('div');
    top.className = 'gi4-quantity-compare-solve-top';
    pair.forEach(seed => top.appendChild(fractionQuantityBar(seed, true)));
    const solve = document.createElement('div');
    solve.className = 'gi4-quantity-compare-solve-grid';
    pair.forEach(seed => solve.appendChild(makeFractionQuantityOperatorCard('solve', seed, false)));
    const line = document.createElement('div');
    line.className = 'gi4-quantity-compare-line';
    line.append(`${pair[0].total} `, compareBox(compareSymbol(pair[0].total, pair[1].total)), ` ${pair[1].total}`);
    line.append(document.createElement('br'));
    line.append(fractionBox(pair[0].num, pair[0].den), ` van ${pair[0].total} `, compareBox(compareSymbol(fractionQuantityResult(pair[0]), fractionQuantityResult(pair[1]))), fractionBox(pair[1].num, pair[1].den), ` van ${pair[1].total}`);
    card.append(top, solve, line);
    return card;
  }

  function fractionQuantityCompareQuickPairs(){
    return [
      [{ num: 1, den: 4, total: 16 }, { num: 1, den: 4, total: 8 }],
      [{ num: 2, den: 3, total: 15 }, { num: 2, den: 3, total: 21 }],
      [{ num: 5, den: 7, total: 14 }, { num: 5, den: 7, total: 21 }],
      [{ num: 7, den: 10, total: 70 }, { num: 7, den: 10, total: 80 }],
      [{ num: 1, den: 9, total: 18 }, { num: 4, den: 9, total: 18 }],
      [{ num: 5, den: 6, total: 54 }, { num: 2, den: 6, total: 54 }],
      [{ num: 4, den: 5, total: 30 }, { num: 2, den: 5, total: 30 }],
      [{ num: 2, den: 3, total: 24 }, { num: 1, den: 3, total: 24 }],
      [{ num: 2, den: 6, total: 36 }, { num: 2, den: 6, total: 24 }],
      [{ num: 7, den: 8, total: 56 }, { num: 7, den: 8, total: 48 }],
    ];
  }

  function makeFractionQuantityCompareQuickRow(){
    const pair = pickUnused('gi4_fraction_quantity_compare_quick_row', fractionQuantityCompareQuickPairs(), pair => pair.map(s => `${s.num}/${s.den}-${s.total}`).join('|'));
    if (!pair) return null;
    const row = document.createElement('div');
    row.className = 'gi4-quantity-compare-quick-row row-delete-wrap';
    row.appendChild(rowDel(row));
    row.append(fractionBox(pair[0].num, pair[0].den), ` van ${pair[0].total}`, compareBox(compareSymbol(fractionQuantityResult(pair[0]), fractionQuantityResult(pair[1]))), fractionBox(pair[1].num, pair[1].den), ` van ${pair[1].total}`);
    return row;
  }

  function makeFractionQuantityCard(mode){
    if (mode === 'part') return makeFractionQuantityPartCard();
    if (mode === 'operator') return makeFractionQuantityOperatorCard('operator');
    if (mode === 'solve') return makeFractionQuantityOperatorCard('solve');
    if (mode === 'questions') return makeFractionQuantityQuestionsCard();
    if (mode === 'quick') return makeFractionQuantityQuickItem(fractionQuantitySeed('gi4_fraction_quantity_quick_item'));
    if (mode === 'compareSamePart' || mode === 'compareSameWhole') return makeFractionQuantityCompareCard(mode);
    if (mode === 'compareSolve') return makeFractionQuantityCompareSolveCard();
    if (mode === 'compareQuick') return makeFractionQuantityCompareQuickRow();
    if (mode === 'same') return makeFractionQuantitySameCard();
    return null;
  }

  function addFractionQuantity(extraCount, forcedMode){
    const mode = forcedMode || $('#fractionQuantityMode')?.value || 'intro';
    if (mode === 'intro') {
      makeFractionQuantityIntro();
      return;
    }
    const key = `gi4_fraction_quantity_${mode}`;
    const requested = Math.max(1, Math.min(10, parseInt($('#fractionQuantityCount')?.value, 10) || 4));
    const count = extraCount || requested;
    if (extraCount) {
      if (mode === 'quick') {
        const list = containerInLastBlock(key, '.gi4-quantity-quick-grid', 'gi4-quantity-quick-grid');
        if (list) {
          appendFractionQuantityQuickItems(list, count);
          return;
        }
      }
      const existing = containerInLastBlock(key, `.gi4-quantity-grid.${mode}`, `gi4-quantity-grid ${mode}`);
      if (existing) {
        for (let i = 0; i < count; i++) appendNewExercise(existing, () => makeFractionQuantityCard(mode));
        return;
      }
    }
    const titles = {
      part: 'Breuk van een hoeveelheid: benoem de breuk.',
      operator: 'Breuk van een hoeveelheid: met stroken.',
      solve: 'Breuk van een hoeveelheid: los op.',
      questions: 'Breuk van een hoeveelheid: breukvragen.',
      compareSamePart: 'Breuken: hoeveelheden vergelijken.',
      compareSameWhole: 'Breuken: hoeveelheden vergelijken.',
      compareSolve: 'Breuken: hoeveelheden vergelijken en oplossen.',
      compareQuick: 'Breuken: hoeveelheden vergelijken.',
      quick: 'Breuk van een hoeveelheid: korte opgaven.',
      same: 'Breuk van een hoeveelheid: dezelfde uitkomst.',
    };
    const instructions = {
      part: ['Vul aan.', 'Benoem de breuk van het geheel.'],
      operator: ['Gebruik de strook.', 'Vul aan.', 'Noteer de juiste hoeveelheid.'],
      solve: ['Los op.', 'Gebruik indien nodig je klikblokjes.'],
      questions: ['Los op met behulp van de breukvragen.'],
      compareSamePart: ['Neem hetzelfde deel van elk geheel.', 'Vul in: &lt; of &gt;.'],
      compareSameWhole: ['Neem een ander aantal breukdelen van eenzelfde geheel.', 'Vul in: &lt; of &gt;.'],
      compareSolve: ['Los op.', 'Gebruik indien nodig je klikblokjes.', 'Vergelijk.', 'Vul in: &lt; of &gt;.'],
      compareQuick: ['Denk na: zijn de gehelen gelijk? Kijk dan naar het aantal breukdelen.', 'Zijn de gehelen niet gelijk? Kijk dan naar de grootte van het geheel en de breukdelen.', 'Vul in: &lt; of &gt;.'],
      quick: ['Los op.', 'Je mag indien nodig tussenstappen noteren.'],
      same: ['Omcirkel met dezelfde kleur de oefeningen met dezelfde uitkomst.'],
    };
    const b = block(key, titles[mode], addCount => addFractionQuantity(addCount || 1, mode));
    addFractionInstructions(b, instructions[mode] || ['Vul aan.']);
    if (mode === 'quick') {
      b.appendChild(makeFractionQuantityQuickCard(count));
    } else {
      const grid = document.createElement('div');
      grid.className = `gi4-quantity-grid ${mode}`;
      for (let i = 0; i < count; i++) appendNewExercise(grid, () => makeFractionQuantityCard(mode));
      b.appendChild(grid);
    }
    addLocalExerciseButton(b, '+ oefening bij deze keuze', () => addFractionQuantity(1, mode));
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

  function decimalComma(value){
    return Number(value).toFixed(1).replace('.', ',');
  }

  function decimalWord(t){
    const words = ['nul','een','twee','drie','vier','vijf','zes','zeven','acht','negen','tien'];
    return `${words[t] || t} tiende${t === 1 ? '' : 'n'}`;
  }

  function decimalHundredComma(value){
    return Number(value / 100).toFixed(2).replace('.', ',');
  }

  function decimalNumberWord(n){
    const ones = ['nul','een','twee','drie','vier','vijf','zes','zeven','acht','negen'];
    const teens = ['tien','elf','twaalf','dertien','veertien','vijftien','zestien','zeventien','achttien','negentien'];
    const tens = ['', '', 'twintig', 'dertig', 'veertig', 'vijftig', 'zestig', 'zeventig', 'tachtig', 'negentig'];
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    const t = Math.floor(n / 10);
    const o = n % 10;
    if (o === 0) return tens[t];
    return `${ones[o]}en${tens[t]}`;
  }

  function decimalHundredWord(h){
    return `${decimalNumberWord(h)} honderdste${h === 1 ? '' : 'n'}`;
  }

  function decimalFractionText(t){
    return `${t}/10`;
  }

  function ensureDecimalLayoutStyles(){
    if (document.getElementById('gi4-decimal-layout-fixes')) return;
    const style = document.createElement('style');
    style.id = 'gi4-decimal-layout-fixes';
    style.textContent = `
      .row-delete-wrap{overflow:visible!important;position:relative;padding-right:6px}
      .row-delete-btn{z-index:500!important;top:-10px!important;right:-10px!important;pointer-events:auto!important}
      .gi4-solution-answer,.gi4-svg-solution-answer{display:none!important}
      .solutions-mode .gi4-solution-answer{display:inline!important}
      .solutions-mode .gi4-svg-solution-answer{display:initial!important}
      .solution-only{display:none!important}
      .solutions-mode .solution-only{display:inline-flex!important}
      .solutions-mode svg .solution-only{display:initial!important}
      .solution-highlight{background:transparent!important;box-shadow:none!important}
      .solutions-mode .solution-highlight{background:#dbeafe!important;box-shadow:0 0 0 2px #0ea5e9 inset!important}
      .gi4-decimal-grid{overflow:visible!important}
      .gi4-decimal-axis{--gi4-axis-end:96%;overflow:visible}
      .gi4-decimal-axis-line{left:0;right:auto;width:calc(var(--gi4-axis-end,96%) + 10px)}
      .gi4-decimal-axis-line::after{right:-10px}
      .gi4-decimal-strip{width:var(--gi4-axis-end,96%)!important;max-width:var(--gi4-axis-end,96%)!important;margin-left:0;margin-right:auto;box-sizing:border-box;flex:0 0 var(--gi4-axis-end,96%)}
      .gi4-decimal-missing-card{grid-column:1 / -1;overflow:hidden;padding:14px 18px 12px}
      .gi4-decimal-missing-axis{--missing-axis-side:38px;position:relative;width:100%;max-width:650px;margin:0 auto;padding:42px var(--missing-axis-side) 4px;box-sizing:border-box;overflow:visible}
      .gi4-decimal-missing-track{position:relative;height:30px}
      .gi4-decimal-missing-line{position:absolute;left:0;right:-12px;top:18px;border-top:1.5px solid #374151}
      .gi4-decimal-missing-line::after{content:"";position:absolute;right:-1px;top:-4.5px;width:8px;height:8px;border-top:1.5px solid #374151;border-right:1.5px solid #374151;transform:rotate(45deg);background:#fff}
      .gi4-decimal-missing-tick{position:absolute;top:7px;height:20px;border-left:1.2px solid #374151;transform:translateX(-.5px)}
      .gi4-decimal-missing-tick.major{top:-6px;height:33px}
      .gi4-decimal-missing-end{position:absolute;top:-38px;transform:translateX(-50%);min-width:37px;min-height:31px;border:1.2px solid #d8b600;background:#ffe27c;border-radius:7px;display:grid;place-items:center;font-weight:800;font-size:16px;box-sizing:border-box}
      .gi4-decimal-missing-grid{position:relative;height:146px;margin-top:0}
      .gi4-decimal-missing-col{position:absolute;top:0;width:52px;transform:translateX(-50%);display:grid;justify-items:center;align-content:start;gap:8px;min-width:0}
      .gi4-decimal-missing-chip{position:static;transform:none;min-width:40px;min-height:31px;padding:3px 7px;border:1.2px solid #d8b600;border-radius:7px;display:grid;place-items:center;background:#fff0a6;font-weight:800;font-size:16px;box-sizing:border-box;white-space:nowrap}
      .gi4-decimal-missing-fraction{min-width:40px;min-height:46px;padding:4px 6px;border:1.2px solid #cbd5e1;border-radius:7px;background:#fff;display:grid;grid-template-rows:16px 1px 16px;justify-items:center;align-items:center;font-weight:800;font-size:15px;line-height:1;box-sizing:border-box}
      .gi4-decimal-missing-fraction.simple{background:#f4fbff}
      .gi4-decimal-missing-fraction i{width:25px;border-top:1.3px solid #374151}
      .gi4-decimal-jump-card,.gi4-decimal-greatest-card,.gi4-decimal-contents-card{overflow:visible}
      .gi4-decimal-jump-tag{display:inline-flex;align-self:flex-start;margin-bottom:10px;background:#fed7aa;border:1.5px solid #fb923c;border-radius:7px;padding:5px 10px;font-weight:700}
      .gi4-decimal-greatest-card{display:flex;align-items:center;justify-content:space-around;gap:14px;flex-wrap:wrap;padding:18px 20px}
      .gi4-decimal-greatest-choice{min-width:118px;min-height:66px;border:1.5px solid #b7c9d8;border-radius:8px;display:flex;align-items:center;justify-content:center;background:#fff}
      .gi4-decimal-compare-card.reference{padding:12px 14px 14px;min-height:218px;display:flex;flex-direction:column;gap:10px}
      .gi4-decimal-compare-card.reference .gi4-decimal-axis{height:46px;margin:0 12px 0}
      .gi4-decimal-reference-grid{display:grid;grid-template-columns:1fr 52px 1fr;gap:14px;margin-top:12px;align-items:start}
      .gi4-decimal-reference-grid > .gi4-compare-box{align-self:start;margin-top:20px}
      .gi4-decimal-reference-stack{display:flex;flex-direction:column;align-items:center;gap:7px}
      .gi4-decimal-reference-stack .gi4-decimal-compare-value{min-height:42px;display:flex;align-items:center;justify-content:center;text-align:center}
      .gi4-decimal-compare-row.reference{display:grid;grid-template-columns:1fr 52px 1fr;align-items:center;gap:14px;margin-top:0}
      .gi4-decimal-compare-row.reference .gi4-decimal-compare-value{text-align:center}
      .gi4-decimal-reference-arrow{width:0;height:24px;border-left:2px solid #111;position:relative;font-size:0;line-height:0}
      .gi4-decimal-reference-arrow::after{content:"";position:absolute;left:-5px;bottom:-1px;border-left:4px solid transparent;border-right:4px solid transparent;border-top:7px solid #111}
      .gi4-decimal-reference-answer{border:1.5px solid #b7c9d8;border-radius:9px;padding:7px 10px;background:#fff;min-width:132px;min-height:38px;text-align:center;display:flex;align-items:center;justify-content:center;line-height:1.2}
      .gi4-reference-solution-note{font-size:.85em;color:#0284c7;font-weight:700}
      .gi4-decimal-contents-answer{display:flex;flex-direction:column;align-items:center;gap:8px}
      .gi4-decimal-contents-order-line{display:flex;align-items:center;justify-content:center;gap:12px;width:100%;margin-top:8px;font-weight:700}
      .gi4-decimal-contents-blank{display:inline-block;width:64px;height:18px;border-bottom:1.8px solid #cbd5e1}
      .gi4-decimal-order-list{display:grid;grid-template-columns:repeat(11,minmax(30px,1fr));gap:4px;align-items:start;margin-top:10px}
      .gi4-decimal-order-col{display:flex;flex-direction:column;align-items:center;gap:5px;min-width:0}
      .gi4-decimal-order-decimal{min-width:34px;padding:4px 6px;border:1.4px solid #d8b600;background:#fff1a8;border-radius:7px;font-weight:800;line-height:1.05;text-align:center;box-sizing:border-box}
      .gi4-decimal-order-decimal.whole{color:#e11d48}
      .gi4-decimal-order-fraction{min-width:32px;padding:2px 4px;border:1.2px solid #b7d98b;border-radius:6px;background:#fff;display:inline-grid;grid-template-rows:auto 1px auto;justify-items:center;align-items:center;gap:2px;font-weight:800;line-height:1;box-sizing:border-box}
      .gi4-decimal-order-fraction i{width:22px;border-top:1.4px solid #1f2937}
      .gi4-decimal-order-fraction.simple{margin-top:4px}
    `;
    (document.head || document.documentElement).appendChild(style);
  }
  ensureDecimalLayoutStyles();

  function decimalStrip(t, opts = {}){
    const { show = true, color = '#9bd2ea', compact = false, axisEnd = 96 } = opts;
    const strip = document.createElement('div');
    strip.className = `gi4-decimal-strip${compact ? ' compact' : ''}`;
    strip.style.setProperty('--gi4-axis-end', `${axisEnd}%`);
    strip.style.width = `${axisEnd}%`;
    strip.style.maxWidth = `${axisEnd}%`;
    for (let i = 0; i < 10; i++) {
      const cell = document.createElement('span');
      if (i < t) {
        if (show) cell.style.background = color;
        else cell.classList.add('solution-fill');
      }
      strip.appendChild(cell);
    }
    return strip;
  }

  function decimalAxis(t = null, opts = {}){
    const { labels = true, decimals = false, axisEnd = 96 } = opts;
    const pos = value => value / 10 * axisEnd;
    const axis = document.createElement('div');
    axis.className = 'gi4-decimal-axis';
    axis.style.setProperty('--gi4-axis-end', `${axisEnd}%`);
    const line = document.createElement('div');
    line.className = 'gi4-decimal-axis-line';
    axis.appendChild(line);
    for (let i = 0; i <= 10; i++) {
      const tick = document.createElement('span');
      tick.className = `gi4-decimal-axis-tick${i === 0 || i === 5 || i === 10 ? ' major' : ''}`;
      tick.style.left = `${pos(i)}%`;
      axis.appendChild(tick);
      if (decimals && i > 0 && i < 10) {
        const d = document.createElement('span');
        d.className = 'gi4-decimal-axis-decimal';
        d.style.left = `${pos(i)}%`;
        d.textContent = decimalComma(i / 10);
        axis.appendChild(d);
      }
    }
    if (labels) {
      [['0', 0], ['1/2', axisEnd / 2], ['1', axisEnd]].forEach(([text, left]) => {
        const lab = document.createElement('span');
        lab.className = 'gi4-decimal-axis-label';
        lab.style.left = `${left}%`;
        lab.textContent = text;
        axis.appendChild(lab);
      });
    }
    if (t !== null) {
      const marker = document.createElement('span');
      marker.className = 'gi4-decimal-axis-marker';
      marker.style.left = `${pos(t)}%`;
      axis.appendChild(marker);
    }
    return axis;
  }

  function decimalCircle(t, show = true){
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.classList.add('gi4-decimal-circle');
    const cx = 50, cy = 50, r = 38;
    for (let i = 0; i < 10; i++) {
      const a1 = -90 + i * 36;
      const a2 = a1 + 36;
      const p1 = [cx + r * Math.cos(a1 * Math.PI / 180), cy + r * Math.sin(a1 * Math.PI / 180)];
      const p2 = [cx + r * Math.cos(a2 * Math.PI / 180), cy + r * Math.sin(a2 * Math.PI / 180)];
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${cx} ${cy} L ${p1[0]} ${p1[1]} A ${r} ${r} 0 0 1 ${p2[0]} ${p2[1]} Z`);
      path.setAttribute('fill', i < t && show ? '#9bd2ea' : '#fff');
      if (i < t && !show) path.classList.add('solution-fill-svg');
      path.setAttribute('stroke', '#475569');
      path.setAttribute('stroke-width', '1.4');
      svg.appendChild(path);
    }
    return svg;
  }

  function decimalGridVisual(t, show = true){
    const grid = document.createElement('div');
    grid.className = 'gi4-decimal-grid-visual';
    for (let i = 0; i < 10; i++) {
      const cell = document.createElement('span');
      if (i < t) {
        if (show) cell.style.background = '#9bd2ea';
        else cell.classList.add('solution-fill');
      }
      grid.appendChild(cell);
    }
    return grid;
  }

  function decimalEggs(t, show = true){
    const box = document.createElement('div');
    box.className = 'gi4-decimal-eggs';
    for (let i = 0; i < 10; i++) {
      const egg = document.createElement('span');
      if (i < t) {
        if (show) egg.classList.add('filled');
        else egg.classList.add('solution-fill');
      }
      box.appendChild(egg);
    }
    return box;
  }

  function decimalVisual(t, type = 'strip', show = true){
    if (type === 'circle') return decimalCircle(t, show);
    if (type === 'grid') return decimalGridVisual(t, show);
    if (type === 'eggs') return decimalEggs(t, show);
    if (type === 'axis') {
      const wrap = document.createElement('div');
      wrap.className = 'gi4-decimal-axis-visual';
      wrap.append(decimalAxis(t), decimalStrip(t, { show }));
      return wrap;
    }
    return decimalStrip(t, { show });
  }

  function decimalAnswerBox(t, withDecimal = true){
    const box = document.createElement('div');
    box.className = 'gi4-decimal-answer-box';
    box.append(fractionBox('', '10', String(t), ''));
    if (withDecimal) {
      const eq = document.createElement('span');
      eq.textContent = '=';
      const line = lineWithSolution(decimalComma(t / 10), 'short');
      box.append(eq, line);
    }
    return box;
  }

  function decimalHundredthsAnswerBox(h){
    const box = document.createElement('div');
    box.className = 'gi4-decimal-answer-box';
    box.append(fractionBox('', '100', String(h), ''));
    const eq = document.createElement('span');
    eq.textContent = '=';
    box.append(eq, lineWithSolution(decimalHundredComma(h), 'short'));
    return box;
  }

  function makeDecimalTenthsCircleCard(t){
    const card = document.createElement('div');
    card.className = 'gi4-decimal-tenths-card row-delete-wrap';
    card.appendChild(rowDel(card));
    const title = document.createElement('div');
    title.className = 'gi4-decimal-card-title';
    title.innerHTML = `<strong>${decimalWord(t)}</strong> van het geheel`;
    card.append(title, decimalCircle(t, false), decimalAnswerBox(t));
    return card;
  }

  function makeDecimalTenthsAxisQuestion(t){
    const card = document.createElement('div');
    card.className = 'gi4-decimal-tenths-axis-question row-delete-wrap';
    card.appendChild(rowDel(card));
    const arrow = document.createElement('span');
    arrow.className = 'gi4-decimal-tenths-axis-arrow';
    const sentence = document.createElement('div');
    sentence.className = 'gi4-decimal-tenths-axis-sentence';
    sentence.append(lineWithSolution(String(t), 'short'), document.createTextNode(' tienden van het geheel'));
    card.append(arrow, sentence, decimalAnswerBox(t));
    return card;
  }

  function makeDecimalTenthsIntroExercise(){
    const data = pickUnused('gi4_decimal_tenths_intro', [
      [7, 4, 2, 8],
      [3, 6, 1, 9],
      [5, 8, 4, 7],
      [2, 9, 3, 6],
    ], set => set.join('-'));
    if (!data) return null;
    const card = document.createElement('div');
    card.className = 'gi4-decimal-tenths-intro row-delete-wrap';
    card.appendChild(rowDel(card));
    const circleGrid = document.createElement('div');
    circleGrid.className = 'gi4-decimal-tenths-circle-grid';
    circleGrid.append(makeDecimalTenthsCircleCard(data[0]), makeDecimalTenthsCircleCard(data[1]));

    const axisWrap = document.createElement('div');
    axisWrap.className = 'gi4-decimal-tenths-axis-wrap';
    const axis = decimalAxis(null, { labels: false, axisEnd: 92 });
    const zero = document.createElement('span');
    zero.className = 'gi4-decimal-tenths-axis-end';
    zero.style.left = '0%';
    zero.textContent = '0';
    const one = document.createElement('span');
    one.className = 'gi4-decimal-tenths-axis-end';
    one.style.left = '92%';
    one.textContent = '1';
    axis.append(zero, one);
    [data[2], data[3]].forEach((t, idx) => {
      const marker = document.createElement('span');
      marker.className = 'gi4-decimal-tenths-pointer';
      marker.style.left = `${t / 10 * 92}%`;
      marker.style.setProperty('--pointer-drop', idx === 0 ? '30px' : '54px');
      axis.appendChild(marker);
    });
    const questions = document.createElement('div');
    questions.className = 'gi4-decimal-tenths-axis-questions';
    questions.append(makeDecimalTenthsAxisQuestion(data[2]), makeDecimalTenthsAxisQuestion(data[3]));
    axisWrap.append(axis, questions);
    card.append(circleGrid, axisWrap);
    return card;
  }

  function addDecimalTenthsIntro(extraCount){
    const key = 'gi4_decimal_tenths_intro';
    const count = extraCount || Math.max(1, Math.min(4, parseInt($('#decimalTenthsIntroCount')?.value, 10) || 1));
    if (extraCount) {
      const existing = containerInLastBlock(key, '.gi4-decimal-tenths-stack', 'gi4-decimal-tenths-stack');
      if (existing) {
        for (let i = 0; i < count; i++) appendNewExercise(existing, makeDecimalTenthsIntroExercise);
        return;
      }
    }
    const b = block(key, 'Kommagetallen tot 1: tienden en tiendelige breuken.', addCount => addDecimalTenthsIntro(addCount || 1));
    addFractionInstructions(b, ['Kleur het deel van het geheel.', 'Schrijf de tiendelige breuk en het kommagetal.', 'Welk deel van het geheel is aangeduid? Vul in.']);
    const stack = document.createElement('div');
    stack.className = 'gi4-decimal-tenths-stack';
    for (let i = 0; i < count; i++) appendNewExercise(stack, makeDecimalTenthsIntroExercise);
    b.appendChild(stack);
  }

  function decimalHundredthsGrid(h, show = false){
    const grid = document.createElement('div');
    grid.className = 'gi4-decimal-hundred-grid-visual';
    for (let i = 0; i < 100; i++) {
      const cell = document.createElement('span');
      if (i < h) {
        if (show) cell.style.background = '#9bd2ea';
        else cell.classList.add('solution-fill');
      }
      grid.appendChild(cell);
    }
    return grid;
  }

  function decimalHundredthsPuzzle(h, show = false){
    const grid = decimalHundredthsGrid(h, show);
    grid.classList.add('puzzle');
    return grid;
  }

  function decimalHundredthsCircle(h, show = false){
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 110 110');
    svg.classList.add('gi4-decimal-hundred-circle');
    const cx = 55, cy = 55, r = 43;
    if (h > 0 && show) {
      const a1 = -90;
      const a2 = -90 + h * 3.6;
      const large = h > 50 ? 1 : 0;
      const p1 = [cx + r * Math.cos(a1 * Math.PI / 180), cy + r * Math.sin(a1 * Math.PI / 180)];
      const p2 = [cx + r * Math.cos(a2 * Math.PI / 180), cy + r * Math.sin(a2 * Math.PI / 180)];
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${cx} ${cy} L ${p1[0]} ${p1[1]} A ${r} ${r} 0 ${large} 1 ${p2[0]} ${p2[1]} Z`);
      path.setAttribute('fill', '#9bd2ea');
      path.setAttribute('stroke', 'none');
      svg.appendChild(path);
    }
    const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    ring.setAttribute('cx', cx);
    ring.setAttribute('cy', cy);
    ring.setAttribute('r', r);
    ring.setAttribute('fill', 'none');
    ring.setAttribute('stroke', '#475569');
    ring.setAttribute('stroke-width', '1.3');
    svg.appendChild(ring);
    for (let i = 0; i < 10; i++) {
      const a = (-90 + i * 36) * Math.PI / 180;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', cx);
      line.setAttribute('y1', cy);
      line.setAttribute('x2', cx + Math.cos(a) * r);
      line.setAttribute('y2', cy + Math.sin(a) * r);
      line.setAttribute('stroke', '#94a3b8');
      line.setAttribute('stroke-width', '1.1');
      svg.appendChild(line);
    }
    for (let i = 0; i < 100; i++) {
      const a = (-90 + i * 3.6) * Math.PI / 180;
      const isTen = i % 10 === 0;
      const outer = r + 1;
      const inner = r - (isTen ? 7 : 4);
      const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      tick.setAttribute('x1', cx + Math.cos(a) * inner);
      tick.setAttribute('y1', cy + Math.sin(a) * inner);
      tick.setAttribute('x2', cx + Math.cos(a) * outer);
      tick.setAttribute('y2', cy + Math.sin(a) * outer);
      tick.setAttribute('stroke', isTen ? '#64748b' : '#aeb8c4');
      tick.setAttribute('stroke-width', isTen ? '1' : '.65');
      svg.appendChild(tick);
    }
    return svg;
  }

  function decimalHundredthsVisual(h, type){
    if (type === 'circle') return decimalHundredthsCircle(h, false);
    if (type === 'puzzle') return decimalHundredthsPuzzle(h, false);
    return decimalHundredthsGrid(h, false);
  }

  function decimalHundredthsVisualFilled(h, type){
    if (type === 'circle') return decimalHundredthsCircle(h, true);
    if (type === 'axis') return decimalHundredthsAxisVisual(h);
    if (type === 'bars') return decimalHundredthsBarsVisual(h);
    if (type === 'puzzle') return decimalHundredthsPuzzle(h, true);
    return decimalHundredthsGrid(h, true);
  }

  function decimalHundredthsBarsVisual(h){
    const wrap = document.createElement('div');
    wrap.className = 'gi4-decimal-hundred-bars';
    const tenths = Math.floor(h / 10);
    const rest = h % 10;
    for (let r = 0; r < 10; r++) {
      const bar = document.createElement('div');
      bar.className = 'gi4-decimal-hundred-bar';
      for (let i = 0; i < 10; i++) {
        const cell = document.createElement('span');
        if (r < tenths || (r === tenths && i < rest)) cell.className = 'filled';
        bar.appendChild(cell);
      }
      wrap.appendChild(bar);
    }
    return wrap;
  }

  function decimalHundredthsAxisVisual(h){
    const wrap = document.createElement('div');
    wrap.className = 'gi4-decimal-hundred-axis-visual';
    const axis = document.createElement('div');
    axis.className = 'gi4-decimal-hundred-axis';
    for (let i = 0; i <= 100; i++) {
      const tick = document.createElement('span');
      tick.className = `tick${i % 10 === 0 ? ' tenth' : ''}`;
      tick.style.left = `${i}%`;
      axis.appendChild(tick);
      if (i % 10 === 0) {
        const label = document.createElement('span');
        label.className = 'label';
        label.style.left = `${i}%`;
        label.textContent = i === 0 ? '0' : i === 100 ? '1' : decimalComma(i / 100);
        axis.appendChild(label);
      }
    }
    const marker = document.createElement('span');
    marker.className = 'marker';
    marker.style.left = `${h}%`;
    axis.appendChild(marker);
    const arc = document.createElement('span');
    arc.className = 'arc';
    arc.style.width = `${h}%`;
    axis.appendChild(arc);
    wrap.appendChild(axis);
    return wrap;
  }

  function makeDecimalHundredthsCard(){
    const item = pickUnused('gi4_decimal_hundredths', [
      { h: 4, type: 'puzzle' }, { h: 70, type: 'circle' }, { h: 46, type: 'grid' },
      { h: 25, type: 'grid' }, { h: 8, type: 'puzzle' }, { h: 62, type: 'circle' },
      { h: 35, type: 'grid' }, { h: 90, type: 'circle' }, { h: 13, type: 'puzzle' },
    ], item => `${item.h}-${item.type}`);
    if (!item) return null;
    const card = document.createElement('div');
    card.className = 'gi4-decimal-hundred-card row-delete-wrap';
    card.appendChild(rowDel(card));
    card.append(decimalHundredthsVisual(item.h, item.type));
    const title = document.createElement('div');
    title.className = 'gi4-decimal-card-title center';
    title.innerHTML = `<strong>${decimalHundredWord(item.h)}</strong><br>van het geheel`;
    card.append(title, decimalHundredthsAnswerBox(item.h));
    return card;
  }

  function addDecimalHundredths(extraCount){
    const key = 'gi4_decimal_hundredths';
    const count = extraCount || Math.max(1, Math.min(9, parseInt($('#decimalHundredthsCount')?.value, 10) || 3));
    if (extraCount) {
      const existing = containerInLastBlock(key, '.gi4-decimal-grid.hundredths', 'gi4-decimal-grid hundredths');
      if (existing) {
        for (let i = 0; i < count; i++) appendNewExercise(existing, makeDecimalHundredthsCard);
        return;
      }
    }
    const b = block(key, 'Kommagetallen tot 1: honderdsten en decimale breuken.', addCount => addDecimalHundredths(addCount || 1));
    addFractionInstructions(b, ['Kleur het gevraagde deel.', 'Schrijf de passende breuk.', 'Schrijf het passend kommagetal.']);
    const grid = document.createElement('div');
    grid.className = 'gi4-decimal-grid hundredths';
    for (let i = 0; i < count; i++) appendNewExercise(grid, makeDecimalHundredthsCard);
    b.appendChild(grid);
  }

  function decimalHundredthsTableRow(){
    const item = pickUnused('gi4_decimal_hundredths_table', [
      { h: 43, type: 'puzzle' },
      { h: 26, type: 'circle' },
      { h: 72, type: 'bars' },
      { h: 89, type: 'grid' },
      { h: 61, type: 'axis' },
      { h: 35, type: 'grid' },
      { h: 58, type: 'circle' },
      { h: 47, type: 'puzzle' },
      { h: 64, type: 'axis' },
    ], item => `${item.h}-${item.type}`);
    if (!item) return null;
    const h = item.h;
    const tenths = Math.floor(h / 10);
    const hundredths = h % 10;
    const tr = document.createElement('tr');
    tr.className = 'row-delete-wrap';
    const visual = document.createElement('td');
    visual.className = 'gi4-decimal-hundred-table-visual';
    visual.appendChild(rowDel(tr));
    visual.appendChild(decimalHundredthsVisualFilled(h, item.type));

    const amount = document.createElement('td');
    amount.className = 'gi4-decimal-hundred-table-amount';
    amount.append(
      lineWithSolution(String(tenths), 'short'), document.createTextNode(' tienden'),
      document.createElement('br'),
      document.createTextNode('en '), lineWithSolution(String(hundredths), 'short'), document.createTextNode(' honderdsten'),
      document.createElement('br'),
      Object.assign(document.createElement('strong'), { textContent: 'OF' }),
      document.createElement('br'),
      lineWithSolution(String(h), 'short'), document.createTextNode(' honderdsten')
    );

    const fraction = document.createElement('td');
    fraction.className = 'gi4-decimal-hundred-table-fraction';
    const topLine = document.createElement('div');
    topLine.className = 'gi4-decimal-hundred-table-mixed-fractions';
    topLine.append(fractionBox('', '10', String(tenths), ''), document.createTextNode(' en '), fractionBox('', '100', String(hundredths), ''));
    const of = Object.assign(document.createElement('div'), { className: 'gi4-decimal-hundred-table-of', textContent: 'OF' });
    fraction.append(topLine, of, fractionBox('', '100', String(h), ''));

    const comma = document.createElement('td');
    comma.className = 'gi4-decimal-hundred-table-comma';
    comma.appendChild(lineWithSolution(decimalHundredComma(h), 'long'));
    tr.append(visual, amount, fraction, comma);
    return tr;
  }

  function addDecimalHundredthsTable(extraCount){
    const key = 'gi4_decimal_hundredths_table';
    const count = extraCount || Math.max(2, Math.min(6, parseInt($('#decimalHundredthsTableCount')?.value, 10) || 5));
    if (extraCount) {
      const body = containerInLastBlock(key, '.gi4-decimal-hundred-table tbody', '', 'tbody');
      if (body) {
        for (let i = 0; i < count; i++) appendNewExercise(body, decimalHundredthsTableRow);
        return;
      }
    }
    const b = block(key, 'Kommagetallen tot 1: welk deel van het geheel zie je?', addCount => addDecimalHundredthsTable(addCount || 1));
    addFractionInstructions(b, ['Welk deel van het geheel zie je? Vul in.', 'Schrijf de honderddelige breuk.', 'Schrijf het kommagetal.']);
    const table = document.createElement('table');
    table.className = 'gi4-decimal-hundred-table';
    table.innerHTML = '<thead><tr><th>Welk deel van het geheel?</th><th>Dit zijn ...</th><th>breuk</th><th>kommagetal</th></tr></thead>';
    const body = document.createElement('tbody');
    for (let i = 0; i < count; i++) appendNewExercise(body, decimalHundredthsTableRow);
    table.appendChild(body);
    b.appendChild(table);
  }

  function decimalHundredthsConvertSeed(mode){
    const sets = {
      grid: [
        { h: 28, color: '#f8d48a' },
        { h: 76, color: '#f6b3c1' },
        { h: 42, color: '#a7d9c7' },
        { h: 65, color: '#b9d6f2' },
        { h: 93, color: '#f2a38b' },
        { h: 17, color: '#d7c3ed' },
      ],
      axis: [
        { h: 67 },
        { h: 5 },
        { h: 38 },
        { h: 74 },
        { h: 91 },
        { h: 26 },
      ],
    };
    return pickUnused(`gi4_decimal_hundredths_convert_${mode}`, sets[mode] || sets.grid, item => item.h);
  }

  function decimalHundredthsFilledGrid(h, color = '#f8d48a'){
    const grid = decimalHundredthsGrid(h, true);
    grid.classList.add('large');
    grid.querySelectorAll('span').forEach((cell, idx) => {
      if (idx < h) cell.style.background = color;
    });
    return grid;
  }

  function makeDecimalHundredthsConvertWork(h, compact = false){
    const tenths = Math.floor(h / 10);
    const rest = h % 10;
    const wrap = document.createElement('div');
    wrap.className = `gi4-decimal-hundred-convert-work${compact ? ' compact' : ''}`;
    const hundredSum = document.createElement('div');
    hundredSum.className = 'hundred-sum';
    const groupedHundredths = document.createElement('span');
    groupedHundredths.className = 'hundred-sum-group';
    groupedHundredths.append(
      fractionBox('', '100', String(tenths * 10), ''),
      document.createTextNode(' + '),
      fractionBox('', '100', String(rest), '')
    );
    hundredSum.append(
      groupedHundredths,
      document.createTextNode(' = '),
      fractionBox('', '100', String(h), '')
    );
    const tenthSum = document.createElement('div');
    tenthSum.className = 'tenth-sum';
    tenthSum.append(
      fractionBox('', '10', String(tenths), ''),
      document.createTextNode(' + '),
      fractionBox('', '100', String(rest), '')
    );
    wrap.append(hundredSum, tenthSum);
    return wrap;
  }

  function makeDecimalHundredthsConvertGridCard(){
    const item = decimalHundredthsConvertSeed('grid');
    if (!item) return null;
    const card = document.createElement('div');
    card.className = 'gi4-decimal-hundred-convert-card grid row-delete-wrap';
    card.appendChild(rowDel(card));
    const visual = document.createElement('div');
    visual.className = 'gi4-decimal-hundred-convert-visual';
    visual.appendChild(decimalHundredthsFilledGrid(item.h, item.color));
    const table = document.createElement('div');
    table.className = 'gi4-decimal-hundred-convert-table';
    const headA = Object.assign(document.createElement('div'), { textContent: 'breuk' });
    const headB = Object.assign(document.createElement('div'), { textContent: 'kommagetal' });
    const fraction = document.createElement('div');
    fraction.appendChild(makeDecimalHundredthsConvertWork(item.h));
    const decimal = document.createElement('div');
    decimal.appendChild(lineWithSolution(decimalHundredComma(item.h), 'long'));
    table.append(headA, headB, fraction, decimal);
    card.append(visual, table);
    return card;
  }

  function makeDecimalHundredthsConvertAxisCard(){
    const item = decimalHundredthsConvertSeed('axis');
    if (!item) return null;
    const card = document.createElement('div');
    card.className = 'gi4-decimal-hundred-convert-card axis row-delete-wrap';
    card.appendChild(rowDel(card));
    card.appendChild(decimalHundredthsAxisVisual(item.h));
    const answer = document.createElement('div');
    answer.className = 'gi4-decimal-hundred-axis-answer';
    answer.append(
      lineWithSolution(String(Math.floor(item.h / 10)), 'short'),
      document.createTextNode(' tienden en '),
      lineWithSolution(String(item.h % 10), 'short'),
      document.createTextNode(' honderdsten = '),
      fractionBox('', '100', String(item.h), ''),
      document.createTextNode(' = '),
      lineWithSolution(decimalHundredComma(item.h), 'long')
    );
    card.appendChild(answer);
    return card;
  }

  function addDecimalHundredthsConvert(extraCount, forcedMode){
    const mode = forcedMode || $('#decimalHundredthsConvertMode')?.value || 'grid';
    const key = `gi4_decimal_hundredths_convert_${mode}`;
    const count = extraCount || Math.max(1, Math.min(6, parseInt($('#decimalHundredthsConvertCount')?.value, 10) || 2));
    if (extraCount) {
      const existing = containerInLastBlock(key, `.gi4-decimal-hundred-convert-grid.${mode}`, `gi4-decimal-hundred-convert-grid ${mode}`);
      if (existing) {
        for (let i = 0; i < count; i++) appendNewExercise(existing, mode === 'axis' ? makeDecimalHundredthsConvertAxisCard : makeDecimalHundredthsConvertGridCard);
        return;
      }
    }
    const b = block(key, 'Kommagetallen tot 1: schrijf als breuk en kommagetal.', addCount => addDecimalHundredthsConvert(addCount || 1, mode));
    addFractionInstructions(b, ['Welk deel van het geheel zie je?', 'Schrijf als breuk en kommagetal.']);
    const grid = document.createElement('div');
    grid.className = `gi4-decimal-hundred-convert-grid ${mode}`;
    for (let i = 0; i < count; i++) appendNewExercise(grid, mode === 'axis' ? makeDecimalHundredthsConvertAxisCard : makeDecimalHundredthsConvertGridCard);
    b.appendChild(grid);
  }

  function decimalHundredthsCompareSeeds(mode){
    const sets = {
      hundred: [
        { h: 34, frac: { num: 1, den: 4 } },
        { h: 50, frac: { num: 5, den: 10 } },
        { h: 78, frac: { num: 3, den: 5 } },
        { h: 62, frac: { num: 3, den: 4 } },
        { h: 15, frac: { num: 1, den: 5 } },
        { h: 88, frac: { num: 4, den: 5 } },
      ],
      reference: [
        { h: 52, frac: { num: 8, den: 10 }, labels: ['dicht bij 0,25', '0,50', '0,75'] },
        { h: 34, frac: { num: 3, den: 4 }, labels: ['minder dan de helft', 'juist de helft', 'meer dan de helft'] },
        { h: 15, frac: { num: 3, den: 5 }, labels: ['minder dan de helft', 'juist de helft', 'meer dan de helft'] },
        { h: 74, frac: { num: 7, den: 10 }, labels: ['dicht bij 0,25', '0,50', '0,75'] },
        { h: 48, frac: { num: 1, den: 4 }, labels: ['minder dan de helft', 'juist de helft', 'meer dan de helft'] },
        { h: 83, frac: { num: 4, den: 5 }, labels: ['dicht bij 0,25', '0,50', '0,75'] },
      ],
      image: [
        { type: 'grid', left: 62, right: 74 },
        { type: 'grid', left: 38, right: 55 },
        { type: 'grid', left: 86, right: 69 },
        { type: 'strip', left: { num: 4, den: 5 }, right: { num: 3, den: 4 } },
        { type: 'strip', left: { num: 2, den: 5 }, right: { num: 3, den: 5 } },
        { type: 'strip', left: { num: 1, den: 4 }, right: { num: 2, den: 5 } },
      ],
    };
    return pickUnusedOrAny(`gi4_decimal_hundredths_compare_${mode}`, sets[mode] || sets.hundred, item => item.type === 'grid'
      ? `${item.type}-${item.left}-${item.right}`
      : item.frac
        ? `${item.h}-${item.frac.num}/${item.frac.den}`
        : `${item.type}-${item.left.num}/${item.left.den}-${item.right.num}/${item.right.den}`);
  }

  function decimalCompareSymbolBox(a, b){
    const box = document.createElement('span');
    box.className = 'gi4-symbol-box';
    box.appendChild(sol(compareSymbol(a, b)));
    return box;
  }

  function decimalCompareFractionValue(frac){
    return Math.round((frac.num / frac.den) * 100);
  }

  function decimalCompareConversionArrow(dir){
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', `decimal-conversion-arrow ${dir}`);
    svg.setAttribute('viewBox', '0 0 118 34');
    svg.innerHTML = `
      <defs>
        <marker id="gi4DecimalCompareArrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z"></path>
        </marker>
      </defs>
      <path d="${dir === 'top' ? 'M 12 29 C 38 3, 80 3, 106 29' : 'M 12 5 C 38 31, 80 31, 106 5'}" marker-end="url(#gi4DecimalCompareArrow)"></path>
    `;
    return svg;
  }

  function makeDecimalHundredthsHundredCard(){
    const item = decimalHundredthsCompareSeeds('hundred');
    if (!item) return null;
    const h = item.h;
    const frac = item.frac;
    const factor = 100 / frac.den;
    const fracHundred = frac.num * factor;
    const card = document.createElement('div');
    card.className = 'gi4-decimal-hundred-compare-card hundred row-delete-wrap';
    card.appendChild(rowDel(card));

    const top = document.createElement('div');
    top.className = 'gi4-decimal-hundred-compare-top';
    top.append(decimalHundredComma(h), decimalCompareSymbolBox(h, fracHundred), fractionBox(frac.num, frac.den));

    const work = document.createElement('div');
    work.className = 'gi4-decimal-hundred-compare-work';
    const dec = document.createElement('div');
    dec.className = 'decimal-side';
    dec.append(
      Object.assign(document.createElement('span'), { className: 'down-arrow' }),
      fractionBox('', '100', String(h), '')
    );
    const fracWork = document.createElement('div');
    fracWork.className = 'fraction-side';
    const opTop = document.createElement('div');
    opTop.className = 'op-label top';
    opTop.append('x ', lineWithSolution(String(factor), 'short'));
    const opBottom = document.createElement('div');
    opBottom.className = 'op-label bottom';
    opBottom.append('x ', lineWithSolution(String(factor), 'short'));
    const eq = document.createElement('div');
    eq.className = 'fraction-conversion';
    eq.append(fractionBox(frac.num, frac.den), ' = ', fractionBox('', '100', String(fracHundred), ''));
    fracWork.append(opTop, decimalCompareConversionArrow('top'), eq, decimalCompareConversionArrow('bottom'), opBottom);
    work.append(dec, fracWork);
    card.append(top, work);
    return card;
  }

  function decimalReferenceText(value, labels){
    if (labels?.some(label => label.includes('0,25'))) {
      const refs = [25, 50, 75];
      const nearest = refs.reduce((best, ref) => Math.abs(value - ref) < Math.abs(value - best) ? ref : best, refs[0]);
      return nearest === 25 ? 'dicht bij 0,25' : nearest === 50 ? 'dicht bij 0,50' : 'dicht bij 0,75';
    }
    if (value < 50) return 'minder dan de helft';
    if (value === 50) return 'juist de helft';
    return 'meer dan de helft';
  }

  function makeDecimalReferenceBox(labels, activeText){
    const box = document.createElement('div');
    box.className = 'gi4-decimal-reference-choice';
    labels.forEach((label, idx) => {
      if (idx) box.appendChild(document.createTextNode(' / '));
      const part = document.createElement('span');
      part.textContent = label;
      if (label === activeText || (activeText === 'dicht bij 0,50' && label === '0,50') || (activeText === 'dicht bij 0,75' && label === '0,75')) {
        part.className = 'solution-highlight';
      }
      box.appendChild(part);
    });
    return box;
  }

  function makeDecimalHundredthsReferenceAxis(){
    const wrap = document.createElement('div');
    wrap.className = 'gi4-decimal-reference-axis';
    [0, 25, 50, 75, 100].forEach(pos => {
      const label = document.createElement('span');
      label.className = 'label';
      label.style.left = `${pos}%`;
      label.textContent = pos === 0 ? '0' : pos === 100 ? '1' : decimalHundredComma(pos);
      wrap.appendChild(label);
    });
    for (let i = 0; i <= 16; i++) {
      const tick = document.createElement('span');
      tick.className = `tick${i % 4 === 0 ? ' main' : ''}`;
      tick.style.left = `${i * 6.25}%`;
      wrap.appendChild(tick);
    }
    return wrap;
  }

  function makeDecimalHundredthsReferenceCard(){
    const item = decimalHundredthsCompareSeeds('reference');
    if (!item) return null;
    const fracValue = decimalCompareFractionValue(item.frac);
    const card = document.createElement('div');
    card.className = 'gi4-decimal-hundred-compare-card reference row-delete-wrap';
    card.appendChild(rowDel(card));
    const top = document.createElement('div');
    top.className = 'gi4-decimal-hundred-compare-top';
    top.append(decimalHundredComma(item.h), decimalCompareSymbolBox(item.h, fracValue), fractionBox(item.frac.num, item.frac.den));
    const options = document.createElement('div');
    options.className = 'gi4-decimal-reference-options';
    [item.h, fracValue].forEach(value => {
      const side = document.createElement('div');
      side.className = 'gi4-decimal-reference-side';
      side.appendChild(Object.assign(document.createElement('span'), { className: 'down-arrow' }));
      const active = decimalReferenceText(value, item.labels);
      const labels = item.labels?.some(label => label.includes('0,25'))
        ? ['dicht bij 0,25', '0,50', '0,75']
        : ['minder dan de helft', 'juist de helft', 'meer dan de helft'];
      side.appendChild(makeDecimalReferenceBox(labels, active));
      options.appendChild(side);
    });
    card.append(top, options);
    return card;
  }

  function decimalHundredthsCompareStrip(frac){
    const wrap = document.createElement('div');
    wrap.className = 'gi4-decimal-image-strip';
    wrap.style.gridTemplateColumns = `repeat(${frac.den}, 1fr)`;
    for (let i = 0; i < frac.den; i++) {
      const cell = document.createElement('span');
      if (i < frac.num) cell.className = 'filled';
      wrap.appendChild(cell);
    }
    return wrap;
  }

  function makeDecimalImageAnswer(value){
    const wrap = document.createElement('div');
    wrap.className = 'gi4-decimal-image-answer';
    wrap.append(fractionBox('', '100', String(value), ''), document.createTextNode(' = '), lineWithSolution(decimalHundredComma(value), 'short'));
    return wrap;
  }

  function makeDecimalImageStripAnswer(frac){
    const factor = 100 / frac.den;
    const value = frac.num * factor;
    const wrap = document.createElement('div');
    wrap.className = 'gi4-decimal-image-strip-answer';
    const conversion = document.createElement('div');
    conversion.className = 'strip-conversion';
    const top = document.createElement('span');
    top.className = 'op-label top';
    top.append('x ', lineWithSolution(String(factor), 'short'));
    const bottom = document.createElement('span');
    bottom.className = 'op-label bottom';
    bottom.append('x ', lineWithSolution(String(factor), 'short'));
    const arrows = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    arrows.setAttribute('class', 'strip-arrow-svg');
    arrows.setAttribute('viewBox', '0 0 150 130');
    arrows.innerHTML = `
      <defs>
        <marker id="gi4StripCompareArrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z"></path>
        </marker>
      </defs>
      <path class="top-arrow" d="M 34 18 C 60 2, 90 2, 116 18" marker-end="url(#gi4StripCompareArrow)"></path>
      <path class="bottom-arrow" d="M 34 105 C 60 121, 90 121, 116 105" marker-end="url(#gi4StripCompareArrow)"></path>
    `;
    conversion.append(
      fractionBox('', String(frac.den), String(frac.num), ''),
      document.createTextNode(' = '),
      fractionBox('', '100', String(value), ''),
      document.createTextNode(' = '),
      lineWithSolution(decimalHundredComma(value), 'short'),
      arrows,
      top,
      bottom
    );
    wrap.appendChild(conversion);
    return wrap;
  }

  function makeDecimalHundredthsImageCard(){
    const item = decimalHundredthsCompareSeeds('image');
    if (!item) return null;
    const card = document.createElement('div');
    card.className = `gi4-decimal-hundred-image-card ${item.type} row-delete-wrap`;
    card.appendChild(rowDel(card));
    const top = document.createElement('div');
    top.className = 'gi4-decimal-hundred-image-top';
    const leftValue = item.type === 'grid' ? item.left : decimalCompareFractionValue(item.left);
    const rightValue = item.type === 'grid' ? item.right : decimalCompareFractionValue(item.right);
    const left = document.createElement('div');
    left.className = 'image-side';
    const right = document.createElement('div');
    right.className = 'image-side';
    if (item.type === 'grid') {
      const leftVisual = decimalHundredthsFilledGrid(item.left, '#f8d48a');
      const rightVisual = decimalHundredthsFilledGrid(item.right, '#f8d48a');
      leftVisual.classList.add('image-compare');
      rightVisual.classList.add('image-compare');
      left.append(leftVisual, makeDecimalImageAnswer(item.left));
      right.append(rightVisual, makeDecimalImageAnswer(item.right));
    } else {
      left.append(decimalHundredthsCompareStrip(item.left), makeDecimalImageStripAnswer(item.left));
      right.append(decimalHundredthsCompareStrip(item.right), makeDecimalImageStripAnswer(item.right));
    }
    top.append(left, decimalCompareSymbolBox(leftValue, rightValue), right);
    card.appendChild(top);
    return card;
  }

  function addDecimalHundredthsCompare(extraCount, forcedMode){
    const mode = forcedMode || $('#decimalHundredthsCompareMode')?.value || 'hundred';
    const key = `gi4_decimal_hundredths_compare_${mode}`;
    const count = extraCount || Math.max(1, Math.min(6, parseInt($('#decimalHundredthsCompareCount')?.value, 10) || 3));
    if (extraCount) {
      const existing = containerInLastBlock(key, `.gi4-decimal-hundred-compare-grid.${mode}`, `gi4-decimal-hundred-compare-grid ${mode}`);
      if (existing) {
        for (let i = 0; i < count; i++) appendNewExercise(existing, mode === 'image' ? makeDecimalHundredthsImageCard : mode === 'reference' ? makeDecimalHundredthsReferenceCard : makeDecimalHundredthsHundredCard);
        return;
      }
    }
    const title = mode === 'image'
      ? 'Kommagetallen tot 1: vergelijk met afbeeldingen.'
      : mode === 'reference'
        ? 'Kommagetallen tot 1: vergelijk met referentiepunten.'
        : 'Kommagetallen tot 1: zet op noemer 100 en vergelijk.';
    const b = block(key, title, addCount => addDecimalHundredthsCompare(addCount || 1, mode));
    addFractionInstructions(b, mode === 'image'
      ? ['Schrijf de breuk.', 'Schrijf het kommagetal.', 'Vergelijk. Schrijf <, > of =.']
      : mode === 'reference'
        ? ['Vergelijk de hoeveelheden met de referentiepunten.', 'Markeer wat past.', 'Schrijf <, > of =.']
        : ['Zet beide hoeveelheden op <strong>noemer 100</strong>.', 'Vergelijk daarna de hoeveelheden met elkaar.', 'Schrijf <, > of =.']
    );
    if (mode === 'reference') b.appendChild(makeDecimalHundredthsReferenceAxis());
    const grid = document.createElement('div');
    grid.className = `gi4-decimal-hundred-compare-grid ${mode}`;
    for (let i = 0; i < count; i++) appendNewExercise(grid, mode === 'image' ? makeDecimalHundredthsImageCard : mode === 'reference' ? makeDecimalHundredthsReferenceCard : makeDecimalHundredthsHundredCard);
    b.appendChild(grid);
  }

  function decimalHundredthsAxisConnectSeed(){
    const sets = [
      { hidden: [4, 5, 6, 7, 8], cards: [35, 48, 73, 65, 87] },
      { hidden: [1, 3, 5, 6, 8], cards: [12, 29, 54, 67, 83] },
      { hidden: [2, 4, 5, 7, 9], cards: [18, 36, 44, 71, 92] },
      { hidden: [1, 2, 6, 8, 9], cards: [7, 24, 58, 76, 91] },
    ];
    return pickUnusedOrAny('gi4_decimal_hundredths_axis_connect', sets, set => `${set.hidden.join('-')}-${set.cards.join('-')}`);
  }

  function makeDecimalHundredthsAxisConnectCard(){
    const seed = decimalHundredthsAxisConnectSeed();
    if (!seed) return null;
    const card = document.createElement('div');
    card.className = 'gi4-decimal-hundred-axis-connect row-delete-wrap';
    card.dataset.axisStart = '0';
    card.dataset.axisRange = '100';
    card.appendChild(rowDel(card));

    const top = document.createElement('div');
    top.className = 'gi4-decimal-axis-connect-labels';
    for (let i = 0; i <= 10; i++) {
      const label = document.createElement('div');
      label.className = 'gi4-decimal-axis-connect-label';
      label.style.left = `${i * 10}%`;
      if (seed.hidden.includes(i)) {
        label.appendChild(lineWithSolution(decimalComma(i / 10), 'short'));
        label.classList.add('empty');
      } else {
        label.textContent = i === 0 ? '0' : i === 10 ? '1' : decimalComma(i / 10);
      }
      top.appendChild(label);
    }

    const axis = document.createElement('div');
    axis.className = 'gi4-decimal-axis-connect-axis';
    for (let i = 0; i <= 100; i++) {
      const tick = document.createElement('span');
      tick.className = `tick${i % 10 === 0 ? ' tenth' : ''}`;
      tick.style.left = `${i}%`;
      tick.dataset.value = String(i);
      axis.appendChild(tick);
    }

    const cards = document.createElement('div');
    cards.className = 'gi4-decimal-axis-connect-cards';
    [...seed.cards].sort(() => Math.random() - .5).forEach(value => {
      const tile = document.createElement('div');
      tile.className = 'gi4-decimal-axis-connect-card';
      tile.dataset.value = String(value);
      const dot = document.createElement('span');
      dot.className = 'gi4-connect-dot top';
      tile.append(dot, document.createTextNode(decimalHundredComma(value)));
      cards.appendChild(tile);
    });
    card.append(top, axis, cards);
    return card;
  }

  function addDecimalHundredthsAxisConnect(extraCount){
    const key = 'gi4_decimal_hundredths_axis_connect';
    const count = extraCount || Math.max(1, Math.min(4, parseInt($('#decimalHundredthsAxisConnectCount')?.value, 10) || 1));
    if (extraCount) {
      const existing = containerInLastBlock(key, '.gi4-decimal-axis-connect-grid', 'gi4-decimal-axis-connect-grid');
      if (existing) {
        for (let i = 0; i < count; i++) appendNewExercise(existing, makeDecimalHundredthsAxisConnectCard);
        return;
      }
    }
    const b = block(key, 'Kommagetallen tot 1: vul aan op de getallenas.', addDecimalHundredthsAxisConnect);
    addFractionInstructions(b, ['Welke getallen ontbreken? Vul aan.', 'Verbind de kaartjes met de juiste plaats op de getallenas.']);
    const grid = document.createElement('div');
    grid.className = 'gi4-decimal-axis-connect-grid';
    for (let i = 0; i < count; i++) appendNewExercise(grid, makeDecimalHundredthsAxisConnectCard);
    b.appendChild(grid);
  }

  function decimalHundredthsJumpSeed(){
    const rows = [
      { step: 1, start: 56, length: 11, shown: [0, 4, 5, 6, 8] },
      { step: 2, start: 22, length: 6, shown: [3, 4] },
      { step: 5, start: 25, length: 6, shown: [2, 3] },
      { step: -1, start: 84, length: 9, shown: [0, 3, 5] },
      { step: -2, start: 70, length: 7, shown: [1, 3, 6] },
      { step: 5, start: 5, length: 7, shown: [1, 4] },
      { step: 2, start: 64, length: 7, shown: [0, 2, 5] },
      { step: -5, start: 95, length: 7, shown: [0, 3, 5] },
    ];
    return pickUnusedOrAny('gi4_decimal_hundredths_jumps', rows, row => `${row.step}-${row.start}-${row.length}`);
  }

  function makeDecimalHundredthsJumpRow(){
    const data = decimalHundredthsJumpSeed();
    if (!data) return null;
    const card = document.createElement('div');
    card.className = 'gi4-decimal-hundred-jump-card row-delete-wrap';
    card.appendChild(rowDel(card));
    const tag = document.createElement('div');
    tag.className = 'gi4-decimal-hundred-jump-tag';
    tag.textContent = `Maak sprongen van ${decimalHundredComma(Math.abs(data.step))}.`;
    const row = document.createElement('div');
    row.className = 'gi4-decimal-hundred-jump-row';
    for (let i = 0; i < data.length; i++) {
      const value = data.start + i * data.step;
      const cell = document.createElement('span');
      if (data.shown.includes(i)) cell.textContent = decimalHundredComma(value);
      else cell.appendChild(lineWithSolution(decimalHundredComma(value), 'short'));
      row.appendChild(cell);
    }
    card.append(tag, row);
    return card;
  }

  function addDecimalHundredthsJumps(extraCount){
    const key = 'gi4_decimal_hundredths_jumps';
    const count = extraCount || Math.max(1, Math.min(8, parseInt($('#decimalHundredthsJumpsCount')?.value, 10) || 3));
    if (extraCount) {
      const existing = containerInLastBlock(key, '.gi4-decimal-hundred-jumps', 'gi4-decimal-hundred-jumps');
      if (existing) {
        for (let i = 0; i < count; i++) appendNewExercise(existing, makeDecimalHundredthsJumpRow);
        return;
      }
    }
    const b = block(key, 'Kommagetallen tot 1: tel verder of tel terug.', addDecimalHundredthsJumps);
    addFractionInstructions(b, ['Tel verder of tel terug.']);
    const grid = document.createElement('div');
    grid.className = 'gi4-decimal-hundred-jumps';
    for (let i = 0; i < count; i++) appendNewExercise(grid, makeDecimalHundredthsJumpRow);
    b.appendChild(grid);
  }

  function addDecimalIntro(){
    const b = block('gi4_decimal_intro', 'Kommagetallen: tienden onthouden.', null);
    const card = document.createElement('div');
    card.className = 'gi4-decimal-intro keep-together';
    card.innerHTML = `
      <div class="gi4-decimal-intro-title">Onthoud</div>
      <p>Een geheel kan je verdelen in <strong>10 gelijke delen</strong>. Elk deel is <strong>1 tiende</strong>.</p>
      <p>Een tiendelige breuk kan je ook schrijven als een kommagetal: <strong>1/10 = 0,1</strong>.</p>`;
    const examples = document.createElement('div');
    examples.className = 'gi4-decimal-intro-grid';
    [
      { t: 1, text: '1 tiende = 1/10 = 0,1', type: 'strip' },
      { t: 4, text: '4 tienden = 4/10 = 0,4', type: 'circle' },
      { t: 10, text: '10 tienden = 10/10 = 1 geheel', type: 'grid' },
    ].forEach(item => {
      const ex = document.createElement('div');
      ex.className = 'gi4-decimal-intro-card';
      ex.append(decimalVisual(item.t, item.type, true));
      const p = document.createElement('p');
      p.textContent = item.text;
      ex.appendChild(p);
      examples.appendChild(ex);
    });
    card.appendChild(examples);
    b.appendChild(card);
  }

  function decimalMixedLabel(tenths){
    const whole = Math.floor(tenths / 10);
    const rest = tenths % 10;
    return { whole, rest, decimal: decimalComma(tenths / 10), improper: `${tenths}/10` };
  }

  function decimalMixedNumber(tenths, blanks = false){
    const { whole, rest } = decimalMixedLabel(tenths);
    const wrap = document.createElement('span');
    wrap.className = 'gi4-decimal-mixed-number';
    wrap.appendChild(blanks ? lineWithSolution(String(whole), 'tiny') : document.createTextNode(String(whole)));
    if (rest) wrap.appendChild(fractionBox(blanks ? '' : rest, blanks ? '' : 10, blanks ? String(rest) : '', blanks ? '10' : ''));
    return wrap;
  }

  function decimalMixedCubeSvg(compact = false){
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('gi4-decimal-mixed-cube-svg');
    if (compact) svg.classList.add('compact');
    svg.setAttribute('viewBox', '0 0 82 72');
    svg.setAttribute('aria-hidden', 'true');
    const front = { x: 8, y: 20, w: 46, h: 46 };
    const dx = 16, dy = -12;
    const yellow = '#ffd83d';
    const top = '#ffe56e';
    const side = '#caa100';
    const stroke = '#8a6a00';
    const grid = '#9d7a00';

    svg.appendChild(svgPolygon(
      `${front.x},${front.y} ${front.x + dx},${front.y + dy} ${front.x + front.w + dx},${front.y + dy} ${front.x + front.w},${front.y}`,
      top,
      stroke
    ));
    svg.appendChild(svgPolygon(
      `${front.x + front.w},${front.y} ${front.x + front.w + dx},${front.y + dy} ${front.x + front.w + dx},${front.y + front.h + dy} ${front.x + front.w},${front.y + front.h}`,
      side,
      stroke
    ));
    svg.appendChild(svgRect(front.x, front.y, front.w, front.h, yellow, stroke));

    for (let i = 1; i < 10; i++) {
      const p = i / 10;
      const x = front.x + front.w * p;
      const y = front.y + front.h * p;
      svg.appendChild(svgLine(x, front.y, x, front.y + front.h, grid, .55));
      svg.appendChild(svgLine(front.x, y, front.x + front.w, y, grid, .55));

      svg.appendChild(svgLine(front.x + front.w * p, front.y, front.x + dx + front.w * p, front.y + dy, grid, .45));
      svg.appendChild(svgLine(front.x + front.w, front.y + front.h * p, front.x + front.w + dx, front.y + dy + front.h * p, grid, .45));
    }
    for (let i = 1; i < 5; i++) {
      const p = i / 5;
      svg.appendChild(svgLine(front.x + dx * p, front.y + dy * p, front.x + front.w + dx * p, front.y + dy * p, grid, .4));
      svg.appendChild(svgLine(front.x + front.w + dx * p, front.y + dy * p, front.x + front.w + dx * p, front.y + front.h + dy * p, grid, .4));
    }
    return svg;
  }

  function decimalMixedPlateSvg(compact = false){
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('gi4-decimal-mixed-plate-svg');
    if (compact) svg.classList.add('compact');
    svg.setAttribute('viewBox', '0 0 96 48');
    svg.setAttribute('aria-hidden', 'true');
    const A = { x: 9, y: 28 }, B = { x: 69, y: 28 }, C = { x: 88, y: 14 }, D = { x: 28, y: 14 };
    const A2 = { x: 9, y: 34 }, B2 = { x: 69, y: 34 }, C2 = { x: 88, y: 20 };
    const fill = '#ffd83d';
    const side = '#caa100';
    const stroke = '#8a6a00';
    const grid = '#9d7a00';
    svg.appendChild(svgPolygon(`${A.x},${A.y} ${B.x},${B.y} ${B2.x},${B2.y} ${A2.x},${A2.y}`, '#e5b900', stroke));
    svg.appendChild(svgPolygon(`${B.x},${B.y} ${C.x},${C.y} ${C2.x},${C2.y} ${B2.x},${B2.y}`, side, stroke));
    svg.appendChild(svgPolygon(`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y} ${D.x},${D.y}`, fill, stroke));

    const lerp = (p, q, t) => ({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });
    for (let i = 1; i < 10; i++) {
      const t = i / 10;
      const top1 = lerp(D, C, t);
      const bot1 = lerp(A, B, t);
      svg.appendChild(svgLine(top1.x, top1.y, bot1.x, bot1.y, grid, .65));
      const left = lerp(A, D, t);
      const right = lerp(B, C, t);
      svg.appendChild(svgLine(left.x, left.y, right.x, right.y, grid, .65));
    }
    return svg;
  }

  function decimalMixedRodSvg(compact = false){
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('gi4-decimal-mixed-rod-svg');
    if (compact) svg.classList.add('compact');
    svg.setAttribute('viewBox', '0 0 112 32');
    svg.setAttribute('aria-hidden', 'true');
    const A = { x: 8, y: 17 }, B = { x: 91, y: 17 }, C = { x: 103, y: 10 }, D = { x: 20, y: 10 };
    const A2 = { x: 8, y: 24 }, B2 = { x: 91, y: 24 }, C2 = { x: 103, y: 17 };
    const fill = '#ffd83d';
    const side = '#caa100';
    const stroke = '#8a6a00';
    const grid = '#9d7a00';
    svg.appendChild(svgPolygon(`${A.x},${A.y} ${B.x},${B.y} ${B2.x},${B2.y} ${A2.x},${A2.y}`, '#e5b900', stroke));
    svg.appendChild(svgPolygon(`${B.x},${B.y} ${C.x},${C.y} ${C2.x},${C2.y} ${B2.x},${B2.y}`, side, stroke));
    svg.appendChild(svgPolygon(`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y} ${D.x},${D.y}`, fill, stroke));
    const lerp = (p, q, t) => ({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });
    for (let i = 1; i < 10; i++) {
      const t = i / 10;
      const top = lerp(D, C, t);
      const bot = lerp(A, B, t);
      svg.appendChild(svgLine(top.x, top.y, bot.x, bot.y, grid, .65));
    }
    return svg;
  }

  function decimalMixedHundredthsLabel(totalHundredths){
    const whole = Math.floor(totalHundredths / 100);
    const rest = totalHundredths % 100;
    const tenths = Math.floor(rest / 10);
    const hundredths = rest % 10;
    return {
      whole,
      tenths,
      hundredths,
      decimal: Number(totalHundredths / 100).toFixed(2).replace('.', ','),
    };
  }

  function decimalMixedHundredthsSeed(namespace){
    return pickUnusedOrAny(namespace, [
      { whole: 1, tenths: 3, hundredths: 2 },
      { whole: 1, tenths: 5, hundredths: 8 },
      { whole: 1, tenths: 7, hundredths: 4 },
      { whole: 1, tenths: 9, hundredths: 6 },
      { whole: 2, tenths: 1, hundredths: 5 },
      { whole: 2, tenths: 4, hundredths: 3 },
      { whole: 3, tenths: 0, hundredths: 7 },
      { whole: 4, tenths: 6, hundredths: 8 },
    ], item => `${item.whole}-${item.tenths}-${item.hundredths}`);
  }

  function decimalMixedHundredthsAxisSeed(){
    return pickUnusedOrAny('gi4_decimal_mixed_hundred_axis', [
      { whole: 1, tenths: 2, hundredths: 8 },
      { whole: 1, tenths: 4, hundredths: 6 },
      { whole: 1, tenths: 5, hundredths: 3 },
      { whole: 1, tenths: 6, hundredths: 9 },
      { whole: 1, tenths: 7, hundredths: 4 },
      { whole: 1, tenths: 8, hundredths: 1 },
      { whole: 1, tenths: 9, hundredths: 5 },
    ], item => `${item.whole}-${item.tenths}-${item.hundredths}`);
  }

  function decimalMixedHundredthsStripSeed(){
    return pickUnusedOrAny('gi4_decimal_mixed_hundred_strip_table', [
      { whole: 2, tenths: 7, hundredths: 3 },
      { whole: 3, tenths: 4, hundredths: 5 },
      { whole: 4, tenths: 8, hundredths: 2 },
      { whole: 5, tenths: 1, hundredths: 9 },
      { whole: 6, tenths: 3, hundredths: 7 },
      { whole: 7, tenths: 6, hundredths: 8 },
      { whole: 8, tenths: 2, hundredths: 4 },
    ], item => `${item.whole}-${item.tenths}-${item.hundredths}`);
  }

  function decimalMixedHundredthsTotal(item){
    return item.whole * 100 + item.tenths * 10 + item.hundredths;
  }

  function decimalMixedHundredthsModel(item){
    const model = document.createElement('div');
    model.className = 'gi4-decimal-mixed-hundred-model';
    const cubes = document.createElement('div');
    cubes.className = 'model-cubes';
    for (let i = 0; i < item.whole; i++) cubes.appendChild(decimalMixedCubeSvg(true));
    const plates = document.createElement('div');
    plates.className = 'model-plates';
    for (let i = 0; i < item.tenths; i++) plates.appendChild(decimalMixedPlateSvg(true));
    const rods = document.createElement('div');
    rods.className = 'model-rods';
    for (let i = 0; i < item.hundredths; i++) rods.appendChild(decimalMixedRodSvg(true));
    model.append(cubes, plates, rods);
    return model;
  }

  function decimalMixedHundredthsSentences(item){
    const total = decimalMixedHundredthsTotal(item);
    const { decimal } = decimalMixedHundredthsLabel(total);
    const wrap = document.createElement('div');
    wrap.className = 'gi4-decimal-mixed-hundred-text';
    const row1 = document.createElement('div');
    row1.append('Dit is ', lineWithSolution(String(item.whole), 'tiny'), ' geheel, ', lineWithSolution(String(item.tenths), 'tiny'), ' tienden en ', lineWithSolution(String(item.hundredths), 'tiny'), ' honderdsten.');
    const row2 = document.createElement('div');
    row2.append('Samen zijn dat ', lineWithSolution(String(total), 'short'), ' honderdsten.');
    const row3 = document.createElement('div');
    row3.className = 'equation';
    row3.append(fractionBox('', '100', String(total), ''), document.createTextNode(' = '), lineWithSolution(String(item.whole), 'tiny'), fractionBox('', '100', String(item.tenths * 10 + item.hundredths), ''), document.createTextNode(' = '), lineWithSolution(decimal, 'short'));
    wrap.append(row1, row2, row3);
    return wrap;
  }

  function makeDecimalMixedHundredthsMaterialsCard(){
    const item = decimalMixedHundredthsSeed('gi4_decimal_mixed_hundred_materials');
    if (!item) return null;
    const card = document.createElement('div');
    card.className = 'gi4-decimal-mixed-hundred-card materials row-delete-wrap';
    card.appendChild(rowDel(card));
    card.append(decimalMixedHundredthsModel(item), decimalMixedHundredthsSentences(item));
    return card;
  }

  function decimalMixedHundredthsAxis(item){
    const total = decimalMixedHundredthsTotal(item);
    const max = Math.max(2, Math.ceil(total / 100));
    const wrap = document.createElement('div');
    wrap.className = 'gi4-decimal-mixed-hundred-axis';
    wrap.style.setProperty('--mixed-h-max', String(max));
    const axis = document.createElement('div');
    axis.className = 'axis';
    axis.appendChild(Object.assign(document.createElement('div'), { className: 'axis-line' }));
    for (let i = 0; i <= max * 10; i++) {
      const tick = document.createElement('span');
      tick.className = `tick${i % 10 === 0 ? ' major' : ''}`;
      tick.style.left = `${i / (max * 10) * 100}%`;
      axis.appendChild(tick);
      if (i % 10 === 0) {
        const label = document.createElement('span');
        label.className = 'label';
        label.style.left = `${i / (max * 10) * 100}%`;
        label.textContent = String(i / 10);
        axis.appendChild(label);
      }
    }
    const marker = document.createElement('span');
    marker.className = 'marker';
    marker.style.left = `${total / (max * 100) * 100}%`;
    axis.appendChild(marker);
    const topBracket = document.createElement('span');
    topBracket.className = 'top-bracket';
    topBracket.style.left = '0%';
    topBracket.style.width = `${total / (max * 100) * 100}%`;
    axis.appendChild(topBracket);

    const makeRuler = (kind, width, showMarker = false) => {
      const ruler = document.createElement('div');
      ruler.className = `ruler ${kind}`;
      const rulerBracket = document.createElement('span');
      rulerBracket.className = 'ruler-bracket';
      rulerBracket.style.left = '0%';
      rulerBracket.style.width = `${width}%`;
      ruler.appendChild(rulerBracket);
      for (let i = 0; i <= 100; i++) {
        const tick = document.createElement('span');
        tick.className = `ruler-tick${i % 10 === 0 ? ' major' : ''}`;
        tick.style.left = `${i}%`;
        ruler.appendChild(tick);
      }
      if (showMarker) {
        const rulerMarker = document.createElement('span');
        rulerMarker.className = 'ruler-marker';
        rulerMarker.style.left = `${width}%`;
        ruler.appendChild(rulerMarker);
      }
      return ruler;
    };
    const rulers = document.createElement('div');
    rulers.className = 'rulers';
    rulers.append(makeRuler('whole', 100), makeRuler('rest', total % 100, true));
    wrap.append(axis, rulers);
    return wrap;
  }

  function decimalMixedHundredthsStrip(item, show = true){
    const total = decimalMixedHundredthsTotal(item);
    const value = total / 100;
    const start = Math.max(0, item.whole - 1);
    const end = start + 2;
    const position = (value - start) / (end - start) * 100;
    const wrap = document.createElement('div');
    wrap.className = 'gi4-decimal-mixed-hundred-strip';
    const labels = document.createElement('div');
    labels.className = 'strip-labels';
    for (let i = start; i <= end; i++) {
      const label = document.createElement('span');
      label.style.left = `${(i - start) / (end - start) * 100}%`;
      label.textContent = String(i);
      labels.appendChild(label);
    }
    const fill = document.createElement('div');
    fill.className = 'strip-fill';
    fill.style.width = `${position}%`;
    if (!show) fill.classList.add('solution-fill');
    const axis = document.createElement('div');
    axis.className = 'strip-axis';
    for (let i = 0; i <= 20; i++) {
      const tick = document.createElement('span');
      tick.className = `tick${i % 10 === 0 ? ' major' : ''}`;
      tick.style.left = `${i / 20 * 100}%`;
      axis.appendChild(tick);
    }
    const marker = document.createElement('span');
    marker.className = 'strip-marker';
    marker.style.left = `${position}%`;
    const lens = document.createElement('span');
    lens.className = 'lens-detail';
    const lensFill = document.createElement('span');
    lensFill.className = 'lens-fill';
    lensFill.style.width = `${item.hundredths * 10}%`;
    lens.appendChild(lensFill);
    for (let i = 0; i < 10; i++) {
      const cell = document.createElement('span');
      cell.className = `lens-cell${i < item.hundredths ? ' filled' : ''}`;
      cell.style.left = `${i * 10}%`;
      lens.appendChild(cell);
    }
    for (let i = 0; i <= 10; i++) {
      const tick = document.createElement('span');
      tick.className = `lens-tick${i === item.hundredths ? ' red' : ''}`;
      tick.style.left = `${i * 10}%`;
      lens.appendChild(tick);
    }
    marker.appendChild(lens);
    axis.append(marker, Object.assign(document.createElement('span'), { className: 'axis-line' }));
    wrap.append(labels, fill, axis);
    return wrap;
  }

  function makeDecimalMixedHundredthsStripTableCard(example = false){
    const item = decimalMixedHundredthsStripSeed();
    if (!item) return null;
    const total = decimalMixedHundredthsTotal(item);
    const rest = item.tenths * 10 + item.hundredths;
    const { decimal } = decimalMixedHundredthsLabel(total);
    const card = document.createElement('div');
    card.className = `gi4-decimal-mixed-hundred-strip-card row-delete-wrap${example ? ' example' : ''}`;
    card.appendChild(rowDel(card));
    const title = document.createElement('div');
    title.className = 'strip-title';
    title.textContent = `${item.whole} geheel en ${item.tenths} tienden en ${item.hundredths} honderdsten van het geheel`;
    const table = document.createElement('table');
    table.className = 'gi4-decimal-mixed-hundred-strip-table';
    table.innerHTML = '<thead><tr><th>Dit is ...</th><th>gemengd getal</th><th>onechte breuk</th><th>kommagetal</th></tr></thead>';
    const row = document.createElement('tr');
    const first = document.createElement('td');
    if (example) first.append(document.createTextNode(`${item.whole} + `));
    else first.append(lineWithSolution(String(item.whole), 'tiny'), document.createTextNode(' + '));
    first.append(
      example ? fractionBox(item.tenths, 10) : fractionBox('', '10', String(item.tenths), ''),
      document.createTextNode(' + '),
      example ? fractionBox(item.hundredths, 100) : fractionBox('', '100', String(item.hundredths), '')
    );
    const mixed = document.createElement('td');
    mixed.append(example ? document.createTextNode(`${item.whole} `) : lineWithSolution(String(item.whole), 'tiny'), example ? fractionBox(rest, 100) : fractionBox('', '100', String(rest), ''));
    const improper = document.createElement('td');
    improper.appendChild(example ? fractionBox(total, 100) : fractionBox('', '100', String(total), ''));
    const dec = document.createElement('td');
    dec.appendChild(example ? document.createTextNode(decimal) : lineWithSolution(decimal, 'short'));
    row.append(first, mixed, improper, dec);
    table.appendChild(row);
    card.append(title, decimalMixedHundredthsStrip(item, example), table);
    return card;
  }

  function makeDecimalMixedHundredthsAxisCard(){
    const item = decimalMixedHundredthsAxisSeed();
    if (!item) return null;
    const card = document.createElement('div');
    card.className = 'gi4-decimal-mixed-hundred-card axis-card row-delete-wrap';
    card.appendChild(rowDel(card));
    card.append(decimalMixedHundredthsAxis(item), decimalMixedHundredthsSentences(item));
    return card;
  }

  function decimalHundredPlaceWorkSvg(item){
    const places = ['E', 't', 'h'];
    const values = {
      E: { count: item.whole, value: String(item.whole) },
      t: { count: item.tenths, value: decimalComma(item.tenths / 10) },
      h: { count: item.hundredths, value: Number(item.hundredths / 100).toFixed(2).replace('.', ',') },
    };
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('gi4-decimal-place-work-svg');
    svg.setAttribute('viewBox', '0 0 360 175');
    svg.setAttribute('aria-hidden', 'true');
    const miniX = 160;
    const miniY = 8;
    const cellW = 50;
    const commaW = 12;
    const miniH = 34;
    const centers = {};
    places.forEach((place, idx) => {
      const x = miniX + idx * cellW + (idx > 0 ? commaW : 0);
      centers[place] = x + cellW / 2;
      svg.appendChild(svgRect(x, miniY, cellW, miniH, place === 'E' ? '#ffd51c' : '#ffe69a', '#7a7f86'));
    });
    const commaX = miniX + cellW;
    svg.appendChild(svgRect(commaX, miniY, commaW, miniH, '#c8c8c8', '#7a7f86'));
    svg.appendChild(svgText(',', commaX + commaW / 2, miniY + 22, { anchor: 'middle', size: 18, weight: 900 }));
    const rows = { E: 78, t: 116, h: 154 };
    const labelX = 60;
    const leftX1 = 0;
    const leftX2 = 48;
    const rightX1 = 96;
    const rightX2 = 156;
    places.forEach(place => {
      const y = rows[place];
      const bendY = y - 13;
      const end = rightX2 + 8;
      svg.appendChild(svgPath(`M${centers[place]} ${miniY + miniH} V${bendY} H${end}`, 'none', '#555', 1.4));
      svg.appendChild(svgPath(`M${end} ${bendY} l8 -4 v8 z`, '#555', '#555', 1));
      svg.appendChild(svgLine(leftX1, y, leftX2, y, '#cbd5e1', 1.3));
      svg.appendChild(svgText(`${place} =`, labelX, y + 5, { size: 18, weight: 700 }));
      svg.appendChild(svgLine(rightX1, y, rightX2, y, '#cbd5e1', 1.3));
      const leftSol = svgText(String(values[place].count), (leftX1 + leftX2) / 2, y - 4, { size: 13, anchor: 'middle', fill: '#0284c7' });
      const rightSol = svgText(values[place].value, (rightX1 + rightX2) / 2, y - 4, { size: 13, anchor: 'middle', fill: '#0284c7' });
      leftSol.classList.add('solution-only');
      rightSol.classList.add('solution-only');
      svg.append(leftSol, rightSol);
    });
    return svg;
  }

  function makeDecimalMixedHundredthsPlaceCard(){
    const item = decimalMixedHundredthsSeed('gi4_decimal_mixed_hundred_place');
    if (!item) return null;
    const total = decimalMixedHundredthsTotal(item);
    const card = document.createElement('div');
    card.className = 'gi4-decimal-mixed-hundred-place-card row-delete-wrap';
    card.appendChild(rowDel(card));
    const board = document.createElement('div');
    board.className = 'gi4-decimal-place-board cols-3 hundredths';
    [
      ['E', 'ones', item.whole, '1'],
      ['t', 'tenths', item.tenths, '0,1'],
      ['h', 'hundredths', item.hundredths, '0,01'],
    ].forEach(([label, cls, count, tokenText]) => {
      const col = document.createElement('div');
      col.className = `place ${cls}`;
      col.innerHTML = `<strong>${label}</strong>`;
      for (let i = 0; i < count; i++) {
        const token = document.createElement('span');
        token.className = 'gi4-decimal-place-token';
        token.textContent = tokenText;
        col.appendChild(token);
      }
      board.appendChild(col);
    });
    const sentence = document.createElement('div');
    sentence.className = 'gi4-decimal-place-counts';
    sentence.append(lineWithSolution(String(item.whole), 'tiny'), ' eenheden, ', lineWithSolution(String(item.tenths), 'tiny'), ' tienden en ', lineWithSolution(String(item.hundredths), 'tiny'), ' honderdsten');
    const work = document.createElement('div');
    work.className = 'gi4-decimal-place-work hundredths';
    work.appendChild(decimalHundredPlaceWorkSvg(item));
    const decimal = document.createElement('div');
    decimal.className = 'gi4-decimal-place-decimal';
    decimal.append('Dit is ', lineWithSolution(decimalMixedHundredthsLabel(total).decimal, 'short'));
    card.append(board, sentence, work, decimal);
    return card;
  }

  function decimalMixedHundredthsTableVisual(item){
    const wrap = document.createElement('div');
    wrap.className = 'gi4-decimal-mixed-hundred-table-visual';
    wrap.appendChild(decimalMixedHundredthsModel(item));
    const sum = document.createElement('div');
    sum.className = 'visual-sum';
    const rest = item.tenths * 10 + item.hundredths;
    sum.append(
      markSolution(sol(String(item.whole)), 'answer-pill'),
      document.createTextNode(' + '),
      fractionBox('', '10', String(item.tenths), ''),
      document.createTextNode(' = '),
      fractionBox('', '100', String(item.tenths * 10), ''),
      document.createTextNode(' + '),
      fractionBox('', '100', String(item.hundredths), '')
    );
    sum.dataset.rest = String(rest);
    wrap.appendChild(sum);
    return wrap;
  }

  function makeDecimalMixedHundredthsTableRow(){
    const item = decimalMixedHundredthsSeed('gi4_decimal_mixed_hundred_table');
    if (!item) return null;
    const total = decimalMixedHundredthsTotal(item);
    const rest = item.tenths * 10 + item.hundredths;
    const tr = document.createElement('tr');
    tr.className = 'row-delete-wrap';
    const visual = document.createElement('td');
    visual.append(rowDel(tr), decimalMixedHundredthsTableVisual(item));
    const mixed = document.createElement('td');
    mixed.append(lineWithSolution(String(item.whole), 'tiny'), fractionBox('', '100', String(rest), ''));
    const improper = document.createElement('td');
    improper.appendChild(fractionBox('', '100', String(total), ''));
    const decimal = document.createElement('td');
    decimal.appendChild(lineWithSolution(decimalMixedHundredthsLabel(total).decimal, 'short'));
    tr.append(visual, mixed, improper, decimal);
    return tr;
  }

  function appendDecimalMixedHundredthsTableRows(body, count){
    for (let i = 0; i < count; i++) {
      const row = makeDecimalMixedHundredthsTableRow();
      if (row) body.appendChild(row);
    }
  }

  function makeDecimalMixedHundredthsTable(rowCount = 2){
    const card = document.createElement('div');
    card.className = 'gi4-decimal-mixed-hundred-table-card row-delete-wrap';
    const table = document.createElement('table');
    table.className = 'gi4-decimal-mixed-hundred-table';
    table.innerHTML = '<thead><tr><th></th><th>gemengd<br>getal</th><th>onechte<br>breuk</th><th>komma-<br>getal</th></tr></thead>';
    const body = document.createElement('tbody');
    appendDecimalMixedHundredthsTableRows(body, rowCount);
    table.appendChild(body);
    card.appendChild(table);
    return body.children.length ? card : null;
  }

  function decimalMixedHundredthsWritePromptPool(){
    const mixedHundredthsPrompt = (whole, numerator) => {
      const span = document.createElement('span');
      span.append(String(whole), ' ', fractionBox(numerator, 100));
      return span;
    };
    return [
      [fractionBox(15, 100), '0,15'],
      [mixedHundredthsPrompt(1, 37), '1,37'],
      [fractionBox(264, 100), '2,64'],
      ['3 E 4 t 2 h', '3,42'],
      ['6 E 1 t 3 h', '6,13'],
      ['8 E 2 h', '8,02'],
      ['704 honderdsten', '7,04'],
      ['5 T 2 E 9 t 3 h', '52,93'],
      ['6 tienden 8 honderdsten', '0,68'],
      ['3 H 2 E 4 t 1 h', '302,41'],
      ['2 E 7 h', '2,07'],
      ['9 E 8 t 5 h', '9,85'],
    ];
  }

  function makeDecimalMixedHundredthsWriteRow(item){
    const row = document.createElement('div');
    row.className = 'gi4-decimal-write-row row-delete-wrap';
    row.appendChild(rowDel(row));
    const [prompt, answer] = item;
    const promptEl = document.createElement('span');
    promptEl.className = 'gi4-decimal-write-prompt';
    if (prompt instanceof Node) promptEl.appendChild(prompt);
    else promptEl.textContent = prompt;
    row.append(
      promptEl,
      Object.assign(document.createElement('span'), { className: 'gi4-decimal-write-equals', textContent: '=' }),
      lineWithSolution(answer, 'short')
    );
    return row;
  }

  function appendDecimalMixedHundredthsWriteRows(list, amount){
    const used = Array.from(list.querySelectorAll('.gi4-decimal-write-row'))
      .map(row => row.dataset.promptKey)
      .filter(Boolean);
    const pool = decimalMixedHundredthsWritePromptPool().map(item => ({
      item,
      key: signaturePart(item[0] instanceof Node ? item[0].textContent : item[0]),
    }));
    for (let i = 0; i < amount; i++) {
      if (used.length === 6 && !list.querySelector('.gi4-decimal-write-group-line')) {
        const sep = document.createElement('div');
        sep.className = 'gi4-decimal-write-group-line';
        list.appendChild(sep);
      }
      const next = pool.find(entry => !used.includes(entry.key)) || pick(pool);
      const row = makeDecimalMixedHundredthsWriteRow(next.item);
      row.dataset.promptKey = next.key;
      list.appendChild(row);
      used.push(next.key);
    }
  }

  function decimalHundredDigitValueSvg(value, example = false){
    const raw = String(value);
    const hasTens = raw.length > 3;
    const digits = raw.padStart(hasTens ? 4 : 3, '0').split('').map(Number);
    const labels = hasTens ? ['T', 'E', 't', 'h'] : ['E', 't', 'h'];
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('gi4-decimal-hundred-value-svg');
    svg.setAttribute('viewBox', `0 0 ${hasTens ? 350 : 320} ${hasTens ? 270 : 230}`);
    svg.setAttribute('aria-hidden', 'true');
    const digitX = hasTens ? [212, 248, 288, 328] : [188, 238, 278];
    const topY = 22;
    digits.forEach((d, i) => {
      svg.appendChild(svgText(String(d), digitX[i], topY, { size: 18, weight: 700, anchor: 'middle' }));
      if ((!hasTens && i === 0) || (hasTens && i === 1)) {
        svg.appendChild(svgText(',', (digitX[i] + digitX[i + 1]) / 2, topY, { size: 18, weight: 900, anchor: 'middle' }));
      }
      const y = 92 + i * 44;
      const arrowEnd = 168;
      const arrowY = y - 12;
      svg.appendChild(svgLine(digitX[i], topY + 12, digitX[i], arrowY, '#555', 1.25));
      svg.appendChild(svgPath(`M${digitX[i]} ${arrowY} H${arrowEnd}`, 'none', '#555', 1.25));
      svg.appendChild(svgPath(`M${arrowEnd} ${arrowY} l8 -4 v8 z`, '#555', '#555', 1));
      svg.appendChild(svgLine(16, y, 64, y, '#cbd5e1', 1.3));
      svg.appendChild(svgText(`${labels[i]} =`, 76, y + 5, { size: 16, weight: 700 }));
      svg.appendChild(svgLine(116, y, 156, y, '#cbd5e1', 1.3));
      const val = labels[i] === 'T' ? String(d * 10) : labels[i] === 'E' ? String(d) : labels[i] === 't' ? decimalComma(d / 10) : Number(d / 100).toFixed(2).replace('.', ',');
      const left = svgText(String(d), 40, y - 5, { size: 13, fill: '#0284c7', anchor: 'middle' });
      const right = svgText(val, 136, y - 5, { size: 13, fill: '#0284c7', anchor: 'middle' });
      if (!example) {
        left.classList.add('solution-only');
        right.classList.add('solution-only');
      }
      svg.append(left, right);
    });
    return svg;
  }

  function makeDecimalMixedHundredthsValueCard(example = false){
    const value = pickUnusedOrAny('gi4_decimal_mixed_hundred_value_card', [152, 925, 7036, 817, 8249, 534, 246, 608], v => String(v));
    const card = document.createElement('div');
    card.className = `gi4-decimal-hundred-value-card row-delete-wrap${example ? ' example' : ''}`;
    card.appendChild(rowDel(card));
    card.appendChild(decimalHundredDigitValueSvg(value, example));
    return card;
  }

  function makeDecimalMixedHundredthsWriteValueCard(count = 8, example = false){
    const card = document.createElement('div');
    card.className = 'gi4-decimal-hundred-write-card row-delete-wrap';
    card.appendChild(rowDel(card));
    const list = document.createElement('div');
    list.className = 'gi4-decimal-write-list hundredths';
    appendDecimalMixedHundredthsWriteRows(list, count);
    const sep = document.createElement('div');
    sep.className = 'gi4-decimal-write-separator';
    const values = document.createElement('div');
    values.className = 'gi4-decimal-hundred-value-grid';
    for (let i = 0; i < 3; i++) values.appendChild(makeDecimalMixedHundredthsValueCard(example && i === 0));
    card.append(list, sep, values);
    return card;
  }

  function makeDecimalMixedHundredthsWriteDecimalCard(count = 8){
    const card = document.createElement('div');
    card.className = 'gi4-decimal-hundred-write-card row-delete-wrap';
    card.appendChild(rowDel(card));
    const list = document.createElement('div');
    list.className = 'gi4-decimal-write-list hundredths';
    appendDecimalMixedHundredthsWriteRows(list, count);
    card.appendChild(list);
    return card;
  }

  function makeDecimalMixedHundredthsDigitValueGrid(count = 3, example = false){
    const wrap = document.createElement('div');
    wrap.className = 'gi4-decimal-hundred-value-grid';
    for (let i = 0; i < count; i++) wrap.appendChild(makeDecimalMixedHundredthsValueCard(example && i === 0));
    return wrap;
  }

  function decimalMixedHundredthsCompareSeeds(){
    return [
      { decimal: 136, whole: 1, frac: { num: 1, den: 5 } },
      { decimal: 345, whole: 3, frac: { num: 1, den: 2 } },
      { decimal: 260, whole: 2, frac: { num: 3, den: 5 } },
      { decimal: 480, whole: 4, frac: { num: 3, den: 4 } },
      { decimal: 712, whole: 7, frac: { num: 1, den: 10 } },
      { decimal: 625, whole: 6, frac: { num: 1, den: 4 } },
      { decimal: 508, whole: 5, frac: { num: 1, den: 20 } },
      { decimal: 291, whole: 2, frac: { num: 9, den: 10 } },
      { decimal: 854, whole: 8, frac: { num: 3, den: 5 } },
      { decimal: 175, whole: 1, frac: { num: 4, den: 5 } },
    ];
  }

  function decimalMixedHundredthsCompareCard(){
    const item = pickUnusedOrAny('gi4_decimal_mixed_hundred_compare_100', decimalMixedHundredthsCompareSeeds(), s => `${s.decimal}-${s.whole}-${s.frac.num}/${s.frac.den}`);
    const decWhole = Math.floor(item.decimal / 100);
    const decRest = item.decimal % 100;
    const factor = 100 / item.frac.den;
    const fracHundred = item.frac.num * factor;
    const mixedTotal = item.whole * 100 + fracHundred;
    const card = document.createElement('div');
    card.className = 'gi4-decimal-hundred-compare-card mixed-hundred row-delete-wrap';
    card.appendChild(rowDel(card));

    const top = document.createElement('div');
    top.className = 'gi4-decimal-hundred-compare-top mixed';
    const mixed = document.createElement('span');
    mixed.className = 'gi4-mixed-inline';
    mixed.append(String(item.whole), ' ', fractionBox(item.frac.num, item.frac.den));
    top.append(decimalMixedHundredthsLabel(item.decimal).decimal, decimalCompareSymbolBox(item.decimal, mixedTotal), mixed);

    const work = document.createElement('div');
    work.className = 'gi4-decimal-hundred-compare-work mixed';
    const dec = document.createElement('div');
    dec.className = 'decimal-side';
    const decResult = document.createElement('div');
    decResult.className = 'gi4-decimal-mixed-hundred-compare-result';
    decResult.append(
      lineWithSolution(String(decWhole), 'tiny'),
      fractionBox('', '100', String(decRest), '')
    );
    dec.append(Object.assign(document.createElement('span'), { className: 'down-arrow' }), decResult);

    const fracWork = document.createElement('div');
    fracWork.className = 'fraction-side';
    const opTop = document.createElement('div');
    opTop.className = 'op-label top';
    opTop.append('x ', lineWithSolution(String(factor), 'short'));
    const opBottom = document.createElement('div');
    opBottom.className = 'op-label bottom';
    opBottom.append('x ', lineWithSolution(String(factor), 'short'));
    const eq = document.createElement('div');
    eq.className = 'fraction-conversion mixed';
    const converted = document.createElement('span');
    converted.className = 'gi4-mixed-inline';
    converted.append(String(item.whole), ' ', fractionBox('', '100', String(fracHundred), ''));
    const original = document.createElement('span');
    original.className = 'gi4-mixed-inline';
    original.append(String(item.whole), ' ', fractionBox(item.frac.num, item.frac.den));
    eq.append(original, ' = ', converted);
    fracWork.append(opTop, decimalCompareConversionArrow('top'), eq, decimalCompareConversionArrow('bottom'), opBottom);
    work.append(dec, fracWork);
    card.append(top, work);
    return card;
  }

  function makeDecimalMixedHundredthsCompareGrid(count = 2){
    const wrap = document.createElement('div');
    wrap.className = 'gi4-decimal-hundred-compare-grid mixed-hundred';
    for (let i = 0; i < count; i++) appendNewExercise(wrap, decimalMixedHundredthsCompareCard);
    return wrap;
  }

  function decimalMixedHundredthsCompactCompareSeeds(){
    return [
      { decimal: 372, whole: 3, frac: { num: 3, den: 4 }, decimalSide: 'left' },
      { decimal: 120, whole: 1, frac: { num: 2, den: 5 }, decimalSide: 'right' },
      { decimal: 532, whole: 5, frac: { num: 1, den: 2 }, decimalSide: 'right' },
      { decimal: 248, whole: 2, frac: { num: 1, den: 2 }, decimalSide: 'left' },
      { decimal: 684, whole: 6, frac: { num: 4, den: 5 }, decimalSide: 'left' },
      { decimal: 715, whole: 7, frac: { num: 1, den: 10 }, decimalSide: 'right' },
      { decimal: 450, whole: 4, frac: { num: 3, den: 5 }, decimalSide: 'right' },
      { decimal: 891, whole: 8, frac: { num: 9, den: 10 }, decimalSide: 'left' },
    ];
  }

  function makeDecimalMixedHundredthsDecimalWork(total){
    const decWhole = Math.floor(total / 100);
    const decRest = total % 100;
    const dec = document.createElement('div');
    dec.className = 'decimal-side';
    const decResult = document.createElement('div');
    decResult.className = 'gi4-decimal-mixed-hundred-compare-result';
    decResult.append(
      lineWithSolution(String(decWhole), 'tiny'),
      fractionBox('', '100', String(decRest), '')
    );
    dec.append(Object.assign(document.createElement('span'), { className: 'down-arrow' }), decResult);
    return dec;
  }

  function makeDecimalMixedHundredthsFractionWork(item){
    const factor = 100 / item.frac.den;
    const fracHundred = item.frac.num * factor;
    const fracWork = document.createElement('div');
    fracWork.className = 'fraction-side';
    const opTop = document.createElement('div');
    opTop.className = 'op-label top';
    opTop.append('x ', lineWithSolution(String(factor), 'short'));
    const opBottom = document.createElement('div');
    opBottom.className = 'op-label bottom';
    opBottom.append('x ', lineWithSolution(String(factor), 'short'));
    const eq = document.createElement('div');
    eq.className = 'fraction-conversion mixed';
    const converted = document.createElement('span');
    converted.className = 'gi4-mixed-inline';
    converted.append(String(item.whole), ' ', fractionBox('', '100', String(fracHundred), ''));
    const original = document.createElement('span');
    original.className = 'gi4-mixed-inline';
    original.append(String(item.whole), ' ', fractionBox(item.frac.num, item.frac.den));
    eq.append(original, ' = ', converted);
    fracWork.append(opTop, decimalCompareConversionArrow('top'), eq, decimalCompareConversionArrow('bottom'), opBottom);
    return fracWork;
  }

  function decimalMixedHundredthsCompactCompareCard(){
    const item = pickUnusedOrAny('gi4_decimal_mixed_hundred_compare_compact', decimalMixedHundredthsCompactCompareSeeds(), s => `${s.decimal}-${s.whole}-${s.frac.num}/${s.frac.den}-${s.decimalSide}`);
    const fracHundred = item.frac.num * (100 / item.frac.den);
    const mixedTotal = item.whole * 100 + fracHundred;
    const card = document.createElement('div');
    card.className = 'gi4-decimal-hundred-compare-card mixed-hundred compact row-delete-wrap';
    card.appendChild(rowDel(card));

    const decTop = document.createElement('span');
    decTop.textContent = decimalMixedHundredthsLabel(item.decimal).decimal;
    const mixedTop = document.createElement('span');
    mixedTop.className = 'gi4-mixed-inline';
    mixedTop.append(String(item.whole), ' ', fractionBox(item.frac.num, item.frac.den));
    const top = document.createElement('div');
    top.className = 'gi4-decimal-hundred-compare-top mixed compact';
    const sign = decimalCompareSymbolBox(item.decimal, mixedTotal);
    top.append(item.decimalSide === 'left' ? decTop : mixedTop, sign, item.decimalSide === 'left' ? mixedTop : decTop);

    const work = document.createElement('div');
    work.className = 'gi4-decimal-hundred-compare-work mixed compact';
    const decimalWork = makeDecimalMixedHundredthsDecimalWork(item.decimal);
    const fractionWork = makeDecimalMixedHundredthsFractionWork(item);
    decimalWork.classList.add(item.decimalSide === 'left' ? 'side-left' : 'side-right');
    fractionWork.classList.add(item.decimalSide === 'left' ? 'side-right' : 'side-left');
    if (item.decimalSide === 'left') work.append(decimalWork, document.createElement('span'), fractionWork);
    else work.append(fractionWork, document.createElement('span'), decimalWork);
    card.append(top, work);
    return card;
  }

  function makeDecimalMixedHundredthsCompactCompareGrid(count = 3){
    const wrap = document.createElement('div');
    wrap.className = 'gi4-decimal-hundred-compare-grid mixed-hundred compact';
    for (let i = 0; i < count; i++) appendNewExercise(wrap, decimalMixedHundredthsCompactCompareCard);
    return wrap;
  }

  function decimalMixedHundredthsReferenceSeeds(){
    return [
      { min: 0, max: 2, decimal: 152, whole: 1, frac: { num: 9, den: 10 }, labels: ['1', '1,50', '2'], kind: 'near' },
      { min: 2, max: 4, decimal: 328, whole: 3, frac: { num: 4, den: 5 }, labels: ['minder dan de helft', 'juist de helft', 'meer dan de helft'], kind: 'half' },
      { min: 1, max: 3, decimal: 174, whole: 2, frac: { num: 1, den: 4 }, labels: ['1', '1,50', '2'], kind: 'near' },
      { min: 4, max: 6, decimal: 462, whole: 4, frac: { num: 3, den: 4 }, labels: ['minder dan de helft', 'juist de helft', 'meer dan de helft'], kind: 'half' },
      { min: 5, max: 7, decimal: 641, whole: 6, frac: { num: 3, den: 5 }, labels: ['minder dan de helft', 'juist de helft', 'meer dan de helft'], kind: 'half' },
      { min: 7, max: 9, decimal: 782, whole: 8, frac: { num: 1, den: 5 }, labels: ['7', '7,50', '8'], kind: 'near' },
    ];
  }

  function decimalMixedReferenceAxis(seed){
    const wrap = document.createElement('div');
    wrap.className = 'gi4-decimal-mixed-reference-axis';
    const steps = (seed.max - seed.min) * 10;
    [0, 0.5, 1, 1.5, 2].forEach(offset => {
      const value = seed.min + offset;
      const pos = (offset / (seed.max - seed.min)) * 100;
      const label = document.createElement('span');
      label.className = 'label';
      label.style.left = `${pos}%`;
      label.textContent = Number.isInteger(value) ? String(value) : decimalComma(value);
      wrap.appendChild(label);
    });
    for (let i = 0; i <= steps; i++) {
      const tick = document.createElement('span');
      tick.className = `tick${i % 5 === 0 ? ' main' : ''}`;
      tick.style.left = `${(i / steps) * 100}%`;
      wrap.appendChild(tick);
    }
    return wrap;
  }

  function decimalMixedReferenceText(value, seed){
    const rest = value % 100;
    if (seed.kind === 'half') {
      if (rest < 50) return 'minder dan de helft';
      if (rest === 50) return 'juist de helft';
      return 'meer dan de helft';
    }
    const refs = seed.labels.map(label => Math.round(Number(label.replace(',', '.')) * 100));
    const nearest = refs.reduce((best, ref) => Math.abs(value - ref) < Math.abs(value - best) ? ref : best, refs[0]);
    return decimalHundredComma(nearest);
  }

  function makeDecimalMixedReferenceChoice(seed, active){
    const box = document.createElement('div');
    box.className = 'gi4-decimal-reference-choice mixed';
    if (seed.kind === 'near') {
      box.append(document.createTextNode('ligt dicht bij '));
      seed.labels.forEach((label, idx) => {
        if (idx) box.append(document.createTextNode(' / '));
        const span = document.createElement('span');
        span.textContent = label;
        if (label === active) span.className = 'solution-highlight';
        box.appendChild(span);
      });
      box.append(document.createTextNode('.'));
      return box;
    }
    seed.labels.forEach((label, idx) => {
      if (idx) box.append(document.createTextNode(' / '));
      const span = document.createElement('span');
      span.textContent = label;
      if (label === active) span.className = 'solution-highlight';
      box.appendChild(span);
    });
    return box;
  }

  function decimalMixedHundredthsReferenceCard(){
    const seed = pickUnusedOrAny('gi4_decimal_mixed_hundred_reference', decimalMixedHundredthsReferenceSeeds(), s => `${s.min}-${s.max}-${s.decimal}-${s.whole}-${s.frac.num}/${s.frac.den}`);
    const fracValue = seed.whole * 100 + Math.round((seed.frac.num / seed.frac.den) * 100);
    const card = document.createElement('div');
    card.className = 'gi4-decimal-hundred-compare-card mixed-reference row-delete-wrap';
    card.appendChild(rowDel(card));
    card.appendChild(decimalMixedReferenceAxis(seed));
    const top = document.createElement('div');
    top.className = 'gi4-decimal-hundred-compare-top mixed-reference';
    const mixed = document.createElement('span');
    mixed.className = 'gi4-mixed-inline';
    mixed.append(String(seed.whole), ' ', fractionBox(seed.frac.num, seed.frac.den));
    top.append(decimalMixedHundredthsLabel(seed.decimal).decimal, decimalCompareSymbolBox(seed.decimal, fracValue), mixed);
    const options = document.createElement('div');
    options.className = 'gi4-decimal-reference-options mixed';
    [
      { value: seed.decimal, title: 'Het <strong>kommagetal</strong>' },
      { value: fracValue, title: 'Het <strong>gemengd getal</strong>' },
    ].forEach(item => {
      const side = document.createElement('div');
      side.className = 'gi4-decimal-reference-side';
      side.appendChild(Object.assign(document.createElement('span'), { className: 'down-arrow' }));
      const title = document.createElement('div');
      title.className = 'gi4-decimal-reference-title';
      title.innerHTML = item.title;
      const active = decimalMixedReferenceText(item.value, seed);
      side.append(title, makeDecimalMixedReferenceChoice(seed, active));
      options.appendChild(side);
    });
    card.append(top, options);
    return card;
  }

  function makeDecimalMixedHundredthsReferenceGrid(count = 2){
    const wrap = document.createElement('div');
    wrap.className = 'gi4-decimal-hundred-compare-grid mixed-reference';
    for (let i = 0; i < count; i++) appendNewExercise(wrap, decimalMixedHundredthsReferenceCard);
    return wrap;
  }

  function decimalMixedHundredthsShortCompareSeeds(){
    return [
      { left: { whole: 4, frac: { num: 1, den: 5 } }, right: 475 },
      { left: 250, right: { whole: 2, frac: { num: 2, den: 4 } } },
      { left: { whole: 3, frac: { num: 4, den: 5 } }, right: 312 },
      { left: 640, right: { whole: 6, frac: { num: 3, den: 5 } } },
      { left: { whole: 8, frac: { num: 1, den: 4 } }, right: 825 },
      { left: 705, right: { whole: 7, frac: { num: 1, den: 10 } } },
      { left: { whole: 5, frac: { num: 3, den: 4 } }, right: 552 },
      { left: 918, right: { whole: 9, frac: { num: 1, den: 5 } } },
      { left: { whole: 1, frac: { num: 2, den: 5 } }, right: 145 },
    ];
  }

  function decimalMixedHundredthsCompareValue(item){
    if (typeof item === 'number') return item;
    if (item?.kind === 'fraction100') return item.value;
    return item.whole * 100 + Math.round(item.frac.num / item.frac.den * 100);
  }

  function decimalMixedHundredthsCompareDisplay(item){
    if (typeof item === 'number') return document.createTextNode(decimalMixedHundredthsLabel(item).decimal);
    if (item?.kind === 'fraction100') return fractionBox(item.value, 100);
    const span = document.createElement('span');
    span.className = 'gi4-mixed-inline';
    span.append(String(item.whole), ' ', fractionBox(item.frac.num, item.frac.den));
    return span;
  }

  function decimalMixedHundredthsShortCompareCard(){
    const seed = pickUnusedOrAny('gi4_decimal_mixed_hundred_short_compare', decimalMixedHundredthsShortCompareSeeds(), s => `${JSON.stringify(s.left)}-${JSON.stringify(s.right)}`);
    const card = document.createElement('div');
    card.className = 'gi4-decimal-mixed-short-compare row-delete-wrap';
    card.appendChild(rowDel(card));
    card.append(
      decimalMixedHundredthsCompareDisplay(seed.left),
      decimalCompareSymbolBox(decimalMixedHundredthsCompareValue(seed.left), decimalMixedHundredthsCompareValue(seed.right)),
      decimalMixedHundredthsCompareDisplay(seed.right)
    );
    return card;
  }

  function makeDecimalMixedHundredthsShortCompareGrid(count = 3){
    const wrap = document.createElement('div');
    wrap.className = 'gi4-decimal-mixed-short-compare-grid';
    for (let i = 0; i < count; i++) appendNewExercise(wrap, decimalMixedHundredthsShortCompareCard);
    return wrap;
  }

  function decimalMixedHundredthsGreatestSets(){
    return [
      [{ whole: 2, frac: { num: 3, den: 4 } }, 285, { whole: 2, frac: { num: 1, den: 5 } }],
      [{ whole: 3, frac: { num: 1, den: 2 } }, 365, 530],
      [{ kind: 'fraction100', value: 113 }, { whole: 1, frac: { num: 3, den: 10 } }, 123],
      [{ whole: 4, frac: { num: 4, den: 5 } }, 440, { whole: 4, frac: { num: 1, den: 4 } }],
      [{ kind: 'fraction100', value: 168 }, 68, { whole: 1, frac: { num: 3, den: 4 } }],
      [{ whole: 2, frac: { num: 9, den: 10 } }, { whole: 2, frac: { num: 1, den: 5 } }, 230],
      [{ whole: 6, frac: { num: 1, den: 4 } }, 605, { kind: 'fraction100', value: 618 }],
      [475, { whole: 4, frac: { num: 3, den: 5 } }, { kind: 'fraction100', value: 491 }],
    ];
  }

  function decimalMixedHundredthsGreatestCard(){
    const set = pickUnusedOrAny('gi4_decimal_mixed_hundred_greatest', decimalMixedHundredthsGreatestSets(), values => values.map(v => JSON.stringify(v)).join('-'));
    const max = Math.max(...set.map(decimalMixedHundredthsCompareValue));
    const card = document.createElement('div');
    card.className = 'gi4-decimal-mixed-hundred-greatest-card row-delete-wrap';
    card.appendChild(rowDel(card));
    set.forEach(item => {
      const choice = document.createElement('span');
      choice.className = 'gi4-decimal-greatest-choice';
      choice.appendChild(decimalMixedHundredthsCompareDisplay(item));
      if (decimalMixedHundredthsCompareValue(item) === max) choice.classList.add('solution-highlight');
      card.appendChild(choice);
    });
    return card;
  }

  function makeDecimalMixedHundredthsGreatestGrid(count = 6){
    const wrap = document.createElement('div');
    wrap.className = 'gi4-decimal-mixed-hundred-greatest-grid';
    for (let i = 0; i < count; i++) appendNewExercise(wrap, decimalMixedHundredthsGreatestCard);
    return wrap;
  }

  function decimalMixedHundredthsAxisApproxSeeds(){
    return [
      { start: 80, labels: 10, cards: [87, 112, 145, { whole: 1, frac: { num: 1, den: 4 } }, { kind: 'fraction100', value: 162 }, { whole: 1, frac: { num: 1, den: 2 } }] },
      { start: 210, labels: 10, cards: [218, 236, { whole: 2, frac: { num: 1, den: 2 } }, 287, 303, { whole: 3, frac: { num: 1, den: 4 } }] },
      { start: 430, labels: 10, cards: [438, 472, { whole: 4, frac: { num: 3, den: 5 } }, 511, 546, { whole: 5, frac: { num: 1, den: 2 } }] },
      { start: 690, labels: 10, cards: [707, { whole: 7, frac: { num: 1, den: 4 } }, 768, 802, { whole: 8, frac: { num: 3, den: 10 } }, 861] },
    ];
  }

  function decimalMixedAxisCardValue(item){
    if (typeof item === 'number') return item;
    if (item?.kind === 'fraction100') return item.value;
    return decimalMixedHundredthsCompareValue(item);
  }

  function decimalMixedAxisCardDisplay(item){
    if (item?.kind === 'fraction100') return fractionBox(item.value, 100);
    return decimalMixedHundredthsCompareDisplay(item);
  }

  function decimalMixedHundredthsAxisApproxCard(){
    const seed = pickUnusedOrAny('gi4_decimal_mixed_hundred_axis_approx', decimalMixedHundredthsAxisApproxSeeds(), s => `${s.start}-${s.cards.map(c => typeof c === 'number' ? c : c.kind === 'fraction100' ? `${c.value}/100` : `${c.whole}-${c.frac.num}/${c.frac.den}`).join('-')}`);
    const card = document.createElement('div');
    card.className = 'gi4-decimal-mixed-axis-approx row-delete-wrap';
    card.dataset.axisStart = String(seed.start);
    card.dataset.axisRange = String(seed.labels * 10);
    card.appendChild(rowDel(card));

    const labels = document.createElement('div');
    labels.className = 'gi4-decimal-mixed-axis-approx-labels';
    for (let i = 0; i <= seed.labels; i++) {
      const value = seed.start + i * 10;
      const label = document.createElement('div');
      label.className = 'gi4-decimal-mixed-axis-approx-label';
      label.style.left = `${i * 100 / seed.labels}%`;
      label.textContent = decimalMixedHundredthsLabel(value).decimal;
      labels.appendChild(label);
    }

    const axis = document.createElement('div');
    axis.className = 'gi4-decimal-mixed-axis-approx-axis';
    for (let i = 0; i <= seed.labels; i++) {
      const tick = document.createElement('span');
      tick.style.left = `${i * 100 / seed.labels}%`;
      axis.appendChild(tick);
    }

    const cards = document.createElement('div');
    cards.className = 'gi4-decimal-axis-connect-cards mixed-approx';
    [...seed.cards].sort(() => Math.random() - .5).forEach(item => {
      const tile = document.createElement('div');
      tile.className = 'gi4-decimal-axis-connect-card mixed';
      tile.dataset.value = String(decimalMixedAxisCardValue(item));
      const dot = document.createElement('span');
      dot.className = 'gi4-connect-dot top';
      tile.append(dot, decimalMixedAxisCardDisplay(item));
      cards.appendChild(tile);
    });
    card.append(labels, axis, cards);
    return card;
  }

  function makeDecimalMixedHundredthsAxisApproxGrid(count = 1){
    const wrap = document.createElement('div');
    wrap.className = 'gi4-decimal-mixed-axis-approx-grid';
    for (let i = 0; i < count; i++) appendNewExercise(wrap, decimalMixedHundredthsAxisApproxCard);
    return wrap;
  }

  function decimalMixedHundredthsPatternSeeds(){
    return [
      { start: 259, step: 1, length: 11, shown: [0, 1, 2] },
      { start: 495, step: 2, length: 11, shown: [0, 1, 2] },
      { start: 925, step: -5, length: 11, shown: [0, 1, 2] },
      { start: 348, step: 3, length: 9, shown: [0, 1, 2] },
      { start: 770, step: -2, length: 9, shown: [0, 1, 2] },
      { start: 118, step: 5, length: 10, shown: [0, 1, 2] },
      { start: 605, step: -1, length: 10, shown: [0, 1, 2] },
    ];
  }

  function decimalMixedHundredthsPatternRow(){
    const data = pickUnusedOrAny('gi4_decimal_mixed_hundred_patterns', decimalMixedHundredthsPatternSeeds(), r => `${r.start}-${r.step}-${r.length}`);
    const row = document.createElement('div');
    row.className = 'gi4-decimal-mixed-pattern-row row-delete-wrap';
    row.appendChild(rowDel(row));
    for (let i = 0; i < data.length; i++) {
      const value = data.start + i * data.step;
      const cell = document.createElement('span');
      if (data.shown.includes(i)) cell.textContent = decimalMixedHundredthsLabel(value).decimal;
      else cell.appendChild(lineWithSolution(decimalMixedHundredthsLabel(value).decimal, 'short'));
      row.appendChild(cell);
    }
    return row;
  }

  function makeDecimalMixedHundredthsPatternGrid(count = 3){
    const wrap = document.createElement('div');
    wrap.className = 'gi4-decimal-mixed-pattern-grid';
    for (let i = 0; i < count; i++) appendNewExercise(wrap, decimalMixedHundredthsPatternRow);
    return wrap;
  }

  function makeDecimalMixedHundredthsCard(mode){
    if (mode === 'axis') return makeDecimalMixedHundredthsAxisCard();
    if (mode === 'place') return makeDecimalMixedHundredthsPlaceCard();
    if (mode === 'table') return makeDecimalMixedHundredthsTable();
    if (mode === 'stripTable') return makeDecimalMixedHundredthsStripTableCard(false);
    if (mode === 'writeDecimal') return makeDecimalMixedHundredthsWriteDecimalCard();
    if (mode === 'digitValue') return makeDecimalMixedHundredthsValueCard();
    if (mode === 'compareHundred') return decimalMixedHundredthsCompareCard();
    if (mode === 'compareHundredCompact') return decimalMixedHundredthsCompactCompareCard();
    if (mode === 'compareReference') return decimalMixedHundredthsReferenceCard();
    if (mode === 'compareShort') return decimalMixedHundredthsShortCompareCard();
    if (mode === 'compareGreatest') return decimalMixedHundredthsGreatestCard();
    if (mode === 'axisApprox') return decimalMixedHundredthsAxisApproxCard();
    if (mode === 'patterns') return decimalMixedHundredthsPatternRow();
    if (mode === 'writeValue') return makeDecimalMixedHundredthsWriteDecimalCard();
    return makeDecimalMixedHundredthsMaterialsCard();
  }

  function addDecimalMixedHundredths(extraCount, forcedMode){
    const mode = forcedMode || $('#decimalMixedHundredthsMode')?.value || 'materials';
    const maxCount = mode === 'writeDecimal' || mode === 'writeValue' ? 12 : mode === 'digitValue' ? 6 : 6;
    const requested = Math.max(1, Math.min(maxCount, parseInt($('#decimalMixedHundredthsCount')?.value, 10) || 2));
    const count = extraCount || requested;
    const key = `gi4_decimal_mixed_hundredths_${mode}`;
    if (extraCount) {
      if (mode === 'table') {
        const body = containerInLastBlock(key, '.gi4-decimal-mixed-hundred-table tbody');
        if (body) {
          appendDecimalMixedHundredthsTableRows(body, count);
          return;
        }
      }
      if (mode === 'writeDecimal' || mode === 'writeValue') {
        const list = containerInLastBlock(key, '.gi4-decimal-write-list.hundredths');
        if (list) {
          appendDecimalMixedHundredthsWriteRows(list, count);
          return;
        }
      }
      if (mode === 'digitValue') {
        const grid = containerInLastBlock(key, '.gi4-decimal-hundred-value-grid');
        if (grid) {
          for (let i = 0; i < count; i++) grid.appendChild(makeDecimalMixedHundredthsValueCard(false));
          return;
        }
      }
      if (mode === 'compareHundred') {
        const grid = containerInLastBlock(key, '.gi4-decimal-hundred-compare-grid.mixed-hundred');
        if (grid) {
          for (let i = 0; i < count; i++) appendNewExercise(grid, decimalMixedHundredthsCompareCard);
          return;
        }
      }
      if (mode === 'compareHundredCompact') {
        const grid = containerInLastBlock(key, '.gi4-decimal-hundred-compare-grid.mixed-hundred.compact');
        if (grid) {
          for (let i = 0; i < count; i++) appendNewExercise(grid, decimalMixedHundredthsCompactCompareCard);
          return;
        }
      }
      if (mode === 'compareReference') {
        const grid = containerInLastBlock(key, '.gi4-decimal-hundred-compare-grid.mixed-reference');
        if (grid) {
          for (let i = 0; i < count; i++) appendNewExercise(grid, decimalMixedHundredthsReferenceCard);
          return;
        }
      }
      if (mode === 'compareShort') {
        const grid = containerInLastBlock(key, '.gi4-decimal-mixed-short-compare-grid');
        if (grid) {
          for (let i = 0; i < count; i++) appendNewExercise(grid, decimalMixedHundredthsShortCompareCard);
          return;
        }
      }
      if (mode === 'compareGreatest') {
        const grid = containerInLastBlock(key, '.gi4-decimal-mixed-hundred-greatest-grid');
        if (grid) {
          for (let i = 0; i < count; i++) appendNewExercise(grid, decimalMixedHundredthsGreatestCard);
          return;
        }
      }
      if (mode === 'axisApprox') {
        const grid = containerInLastBlock(key, '.gi4-decimal-mixed-axis-approx-grid');
        if (grid) {
          for (let i = 0; i < count; i++) appendNewExercise(grid, decimalMixedHundredthsAxisApproxCard);
          return;
        }
      }
      if (mode === 'patterns') {
        const grid = containerInLastBlock(key, '.gi4-decimal-mixed-pattern-grid');
        if (grid) {
          for (let i = 0; i < count; i++) appendNewExercise(grid, decimalMixedHundredthsPatternRow);
          return;
        }
      }
      const existing = containerInLastBlock(key, '.gi4-decimal-mixed-hundred-grid', `gi4-decimal-mixed-hundred-grid ${mode}`);
      if (existing) {
        for (let i = 0; i < count; i++) appendNewExercise(existing, () => makeDecimalMixedHundredthsCard(mode));
        return;
      }
    }
    const titles = {
      materials: 'Kommagetallen (> 1): onechte breuk, gemengd getal en decimaal getal.',
      axis: 'Kommagetallen (> 1): getallenas en honderdsten.',
      place: 'Kommagetallen (> 1): plaatswaarde met honderdsten.',
      table: 'Kommagetallen (> 1): vul de tabel aan.',
      stripTable: 'Kommagetallen (> 1): strook, gemengd getal en onechte breuk.',
      writeDecimal: 'Kommagetallen (> 1): schrijf de kommagetallen.',
      digitValue: 'Kommagetallen (> 1): schrijf de waarde van de cijfers.',
      compareHundred: 'Kommagetallen (> 1): zet op noemer 100 en vergelijk.',
      compareHundredCompact: 'Kommagetallen (> 1): zet op noemer 100 en vergelijk.',
      compareReference: 'Kommagetallen (> 1): vergelijk met referentiepunten.',
      compareShort: 'Kommagetallen (> 1): vergelijk kort.',
      compareGreatest: 'Kommagetallen (> 1): kleur de grootste waarde.',
      axisApprox: 'Kommagetallen (> 1): ongeveer op de getallenas.',
      patterns: 'Kommagetallen (> 1): vul de patronen aan.',
      writeValue: 'Kommagetallen (> 1): schrijf de kommagetallen.',
    };
    const b = block(key, titles[mode], addCount => addDecimalMixedHundredths(addCount || 1, mode));
    const instructions = {
      materials: ['Vul in.'],
      axis: ['Vul in.'],
      place: ['Hoeveel eenheden? Hoeveel tienden? Hoeveel honderdsten?', 'Schrijf het kommagetal.'],
      table: ['Vul de tabel aan.'],
      stripTable: ['Schrijf het gemengd getal en de onechte breuk.', 'Schrijf het kommagetal.'],
      writeDecimal: ['Schrijf de kommagetallen.'],
      digitValue: ['Geef de waarde van de cijfers.'],
      compareHundred: ['Zet de breukdelen op <strong>noemer 100</strong>.', 'Vergelijk daarna de hoeveelheden met elkaar.', 'Schrijf &lt;, &gt; of =.'],
      compareHundredCompact: ['Zet de breukdelen op noemer 100 (= decimale breuk).', 'Vergelijk daarna de hoeveelheden met elkaar.', 'Schrijf &lt;, &gt; of =.', '<strong>Tip!</strong> Voeg waar nodig nullen toe aan het kommagetal om makkelijker te vergelijken.'],
      compareReference: ['Vergelijk de getallen of de breukdelen met <strong>de referentiepunten</strong>.', 'Markeer wat past.', 'Schrijf &lt;, &gt; of =.'],
      compareShort: ['Denk na: zijn de gehelen gelijk?', 'Vergelijk de breukdelen met referentiepunten.', 'Schrijf &lt;, &gt; of =.'],
      compareGreatest: ['Vergelijk de getallen met elkaar.', 'Denk aan de referentiepunten of schrijf de breukdelen met noemer 100.', 'Kleur de grootste waarde in elke reeks van 3.'],
      axisApprox: ['Waar liggen de getallen ongeveer?', 'Verbind de kaartjes met de juiste plaats op de getallenas.'],
      patterns: ['Kijk goed: tel je verder of terug? Welke sprong moet je maken?', 'Vul de patronen aan.'],
      writeValue: ['Schrijf de kommagetallen.'],
    };
    addFractionInstructions(b, instructions[mode] || ['Vul in.']);
    if (mode === 'table') {
      const table = makeDecimalMixedHundredthsTable(count);
      if (table) b.appendChild(table);
      addLocalExerciseButton(b, '+ oefening bij deze keuze', () => addDecimalMixedHundredths(1, mode));
      return;
    }
    if (mode === 'writeDecimal' || mode === 'writeValue') {
      b.appendChild(makeDecimalMixedHundredthsWriteDecimalCard(count));
      addLocalExerciseButton(b, '+ oefening bij deze keuze', () => addDecimalMixedHundredths(1, mode));
      return;
    }
    if (mode === 'digitValue') {
      const example = !!$('#decimalMixedHundredthsExample')?.checked;
      b.appendChild(makeDecimalMixedHundredthsDigitValueGrid(count, example));
      addLocalExerciseButton(b, '+ oefening bij deze keuze', () => addDecimalMixedHundredths(1, mode));
      return;
    }
    if (mode === 'compareHundred') {
      b.appendChild(makeDecimalMixedHundredthsCompareGrid(count));
      addLocalExerciseButton(b, '+ oefening bij deze keuze', () => addDecimalMixedHundredths(1, mode));
      return;
    }
    if (mode === 'compareHundredCompact') {
      b.appendChild(makeDecimalMixedHundredthsCompactCompareGrid(count));
      addLocalExerciseButton(b, '+ oefening bij deze keuze', () => addDecimalMixedHundredths(1, mode));
      return;
    }
    if (mode === 'compareReference') {
      b.appendChild(makeDecimalMixedHundredthsReferenceGrid(count));
      addLocalExerciseButton(b, '+ oefening bij deze keuze', () => addDecimalMixedHundredths(1, mode));
      return;
    }
    if (mode === 'compareShort') {
      b.appendChild(makeDecimalMixedHundredthsShortCompareGrid(count));
      addLocalExerciseButton(b, '+ oefening bij deze keuze', () => addDecimalMixedHundredths(1, mode));
      return;
    }
    if (mode === 'compareGreatest') {
      b.appendChild(makeDecimalMixedHundredthsGreatestGrid(count));
      addLocalExerciseButton(b, '+ oefening bij deze keuze', () => addDecimalMixedHundredths(1, mode));
      return;
    }
    if (mode === 'axisApprox') {
      b.appendChild(makeDecimalMixedHundredthsAxisApproxGrid(count));
      addLocalExerciseButton(b, '+ oefening bij deze keuze', () => addDecimalMixedHundredths(1, mode));
      return;
    }
    if (mode === 'patterns') {
      b.appendChild(makeDecimalMixedHundredthsPatternGrid(count));
      addLocalExerciseButton(b, '+ oefening bij deze keuze', () => addDecimalMixedHundredths(1, mode));
      return;
    }
    const grid = document.createElement('div');
    grid.className = `gi4-decimal-mixed-hundred-grid ${mode}`;
    const example = mode === 'stripTable' && !!$('#decimalMixedHundredthsExample')?.checked;
    for (let i = 0; i < count; i++) appendNewExercise(grid, () => mode === 'stripTable' ? makeDecimalMixedHundredthsStripTableCard(example && i === 0) : makeDecimalMixedHundredthsCard(mode));
    b.appendChild(grid);
    addLocalExerciseButton(b, '+ oefening bij deze keuze', () => addDecimalMixedHundredths(1, mode));
  }

  function decimalMixedModel(tenths, opts = {}){
    const { compact = false, strips = false, showPartial = true } = opts;
    const { whole, rest } = decimalMixedLabel(tenths);
    const model = document.createElement('div');
    model.className = `gi4-decimal-mixed-model${compact ? ' compact' : ''}${strips ? ' strips' : ''}`;
    for (let i = 0; i < whole; i++) {
      if (strips) {
        const block = document.createElement('span');
        block.className = 'gi4-decimal-mixed-strip-full';
        model.appendChild(block);
      } else {
        model.appendChild(decimalMixedCubeSvg(compact));
      }
    }
    if (rest || showPartial) {
      const partial = document.createElement('span');
      partial.className = strips ? 'gi4-decimal-mixed-strip-part' : 'gi4-decimal-mixed-plates';
      if (strips) {
        for (let i = 0; i < 10; i++) {
          const cell = document.createElement('i');
          if (i < rest) cell.className = 'filled';
          partial.appendChild(cell);
        }
      } else {
        for (let i = 0; i < rest; i++) partial.appendChild(decimalMixedPlateSvg(compact));
      }
      model.appendChild(partial);
    }
    return model;
  }

  function decimalMixedStripAxis(tenths, maxWhole = 2, opts = {}){
    const { show = true } = opts;
    const wrap = document.createElement('div');
    wrap.className = 'gi4-decimal-mixed-scale';
    wrap.style.setProperty('--gi4-mixed-max', String(maxWhole));
    const strips = document.createElement('div');
    strips.className = 'gi4-decimal-mixed-scale-strips';
    const total = maxWhole * 10;
    strips.style.gridTemplateColumns = `repeat(${total}, 1fr)`;
    for (let i = 0; i < total; i++) {
      const cell = document.createElement('span');
      if (i < tenths) cell.classList.add(show ? 'filled' : 'solution-fill');
      if (i % 10 === 0) cell.classList.add('start');
      strips.appendChild(cell);
    }
    const axis = document.createElement('div');
    axis.className = 'gi4-decimal-mixed-scale-axis';
    axis.appendChild(Object.assign(document.createElement('div'), { className: 'gi4-decimal-mixed-scale-line' }));
    for (let i = 0; i <= total; i++) {
      const tick = document.createElement('span');
      tick.className = `tick${i % 10 === 0 ? ' major' : ''}`;
      tick.style.left = `${i / total * 100}%`;
      axis.appendChild(tick);
      if (i % 10 === 0) {
        const lab = document.createElement('span');
        lab.className = 'label';
        lab.style.left = `${i / total * 100}%`;
        lab.textContent = String(i / 10);
        axis.appendChild(lab);
      }
    }
    const marker = document.createElement('span');
    marker.className = 'marker';
    marker.style.left = `${tenths / total * 100}%`;
    axis.appendChild(marker);
    wrap.append(strips, axis);
    return wrap;
  }

  function decimalMixedWords(tenths){
    const { whole, rest } = decimalMixedLabel(tenths);
    const wholeTxt = whole === 1 ? '1 geheel' : `${whole} gehelen`;
    const restTxt = rest === 1 ? '1 tiende' : `${rest} tienden`;
    return `${wholeTxt} en ${restTxt}`;
  }

  function addDecimalMixedIntro(){
    const b = block('gi4_decimal_mixed_intro', 'Kommagetallen groter dan 1: onthouden.', null);
    const card = document.createElement('div');
    card.className = 'gi4-decimal-mixed-intro keep-together';
    card.innerHTML = '<div class="gi4-decimal-intro-title">Onthoud</div><p>Na 1 geheel tel je verder in tienden. <strong>12 tienden</strong> is <strong>1 geheel en 2 tienden</strong>.</p>';
    const grid = document.createElement('div');
    grid.className = 'gi4-decimal-mixed-intro-grid';
    [
      { value: 12, text: '12 tienden = 12/10 = 1 2/10 = 1,2', max: 2 },
      { value: 15, text: '15 tienden = 15/10 = 1 5/10 = 1,5', max: 2 },
    ].forEach(item => {
      const ex = document.createElement('div');
      ex.className = 'gi4-decimal-mixed-intro-card';
      ex.append(decimalMixedModel(item.value), decimalMixedStripAxis(item.value, item.max));
      const p = document.createElement('p');
      p.textContent = item.text;
      ex.appendChild(p);
      grid.appendChild(ex);
    });
    card.appendChild(grid);
    b.appendChild(card);
  }

  function decimalMixedSeed(namespace){
    const values = [11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 26, 27, 28, 29];
    return pickUnused(namespace, values);
  }

  function makeDecimalMixedFillCard(){
    const value = decimalMixedSeed('gi4_decimal_mixed_fill');
    if (!value) return null;
    const { whole, rest, decimal } = decimalMixedLabel(value);
    const card = document.createElement('div');
    card.className = 'gi4-decimal-mixed-fill-card row-delete-wrap';
    card.appendChild(rowDel(card));
    const visual = Math.random() > .5 ? decimalMixedModel(value) : decimalMixedStripAxis(value, whole + 1);
    const sentence = document.createElement('div');
    sentence.className = 'gi4-decimal-mixed-sentence';
    sentence.append('Dit zijn ', lineWithSolution(String(whole), 'tiny'), ' gehelen en ', lineWithSolution(String(rest), 'tiny'), ' tienden.');
    const total = document.createElement('div');
    total.className = 'gi4-decimal-mixed-sentence';
    total.append('Samen zijn dat ', lineWithSolution(String(value), 'tiny'), ' tienden.');
    const equation = document.createElement('div');
    equation.className = 'gi4-decimal-mixed-equation';
    equation.append(fractionBox('', '10', String(value), ''), document.createTextNode(' = '), decimalMixedNumber(value, true), document.createTextNode(' = '), lineWithSolution(decimal, 'short'));
    card.append(visual, sentence, total, equation);
    return card;
  }

  function makeDecimalMixedStripAxisCard(example = false){
    const value = decimalMixedSeed('gi4_decimal_mixed_strip_axis');
    if (!value) return null;
    const { decimal } = decimalMixedLabel(value);
    const max = Math.max(2, Math.ceil(value / 10));
    const card = document.createElement('div');
    card.className = `gi4-decimal-mixed-strip-axis-card row-delete-wrap${example ? ' example' : ''}`;
    card.appendChild(rowDel(card));
    const title = document.createElement('div');
    title.className = 'gi4-decimal-card-title';
    title.innerHTML = `<strong>${decimalMixedWords(value)}</strong> van het geheel`;
    const scale = decimalMixedStripAxis(value, max, { show: example });
    const equation = document.createElement('div');
    equation.className = 'gi4-decimal-mixed-equation-box';
    equation.append(decimalMixedNumber(value, !example), document.createTextNode(' = '), fractionBox(example ? value : '', '10', example ? '' : String(value), ''), document.createTextNode(' = '), example ? document.createTextNode(decimal) : lineWithSolution(decimal, 'short'));
    card.append(title, scale, equation);
    return card;
  }

  function makeDecimalMixedEquivalentCard(){
    const groups = [
      { value: 12, items: ['12 tienden', '12/10', '1,2'] },
      { value: 14, items: ['1 4/10', '1,4', '14/10'] },
      { value: 17, items: ['17 tienden', '1,7', '1 7/10'] },
      { value: 21, items: ['2 gehelen en 1 tiende', '2,1', '21/10'] },
      { value: 24, items: ['24/10', '2,4', '2 4/10'] },
    ];
    const cells = groups.sort(() => Math.random() - .5).slice(0, 4)
      .flatMap(group => group.items.map(text => ({ text, value: group.value })))
      .sort(() => Math.random() - .5);
    const card = document.createElement('div');
    card.className = 'gi4-decimal-mixed-equivalent-card row-delete-wrap';
    card.appendChild(rowDel(card));
    const table = document.createElement('table');
    table.className = 'gi4-decimal-mixed-equivalent-table';
    for (let r = 0; r < 2; r++) {
      const tr = document.createElement('tr');
      for (let c = 0; c < 6; c++) {
        const item = cells[r * 6 + c];
        const td = document.createElement('td');
        td.dataset.value = String(item.value);
        td.innerHTML = item.text.replace(/(\d+)\/10/g, '<span class="gi4-inline-frac">$1<small></small>10</span>');
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }
    card.appendChild(table);
    return card;
  }

  function decimalPlaceValueWorkSvg(places, values){
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('gi4-decimal-place-work-svg');
    svg.setAttribute('viewBox', '0 0 360 165');
    svg.setAttribute('aria-hidden', 'true');

    const miniY = 8;
    const miniH = 34;
    const commaW = 14;
    const cellW = places.length === 2 ? 58 : 50;
    const miniX = 185;
    const commaIndex = places.indexOf('t');
    const centers = {};

    places.forEach((place, idx) => {
      const x = miniX + idx * cellW + (idx < commaIndex ? 0 : commaW);
      centers[place] = x + cellW / 2;
      const fill = place === 'T' ? '#48bf4f' : place === 'E' ? '#ffd51c' : '#ffe69a';
      svg.appendChild(svgRect(x, miniY, cellW, miniH, fill, '#7a7f86'));
    });
    const commaX = miniX + commaIndex * cellW;
    svg.appendChild(svgRect(commaX, miniY, commaW, miniH, '#c8c8c8', '#7a7f86'));
    svg.appendChild(svgText(',', commaX + commaW / 2, miniY + 22, { anchor: 'middle', size: 18, weight: 900 }));

    const rowYs = places.length === 2 ? { E: 82, t: 122 } : { T: 68, E: 105, t: 142 };
    const labelX = 64;
    const leftLineX1 = 0;
    const leftLineX2 = 48;
    const rightLineX1 = 98;
    const rightLineX2 = 154;

    places.forEach(place => {
      const y = rowYs[place];
      const bendY = y - 12;
      const xArrowEnd = rightLineX2 + 10;
      svg.appendChild(svgPath(`M${centers[place]} ${miniY + miniH} V${bendY} H${xArrowEnd}`, 'none', '#555', 1.4));
      svg.appendChild(svgPath(`M${xArrowEnd} ${bendY} l8 -4 v8 z`, '#555', '#555', 1));
      svg.appendChild(svgLine(leftLineX1, y, leftLineX2, y, '#cbd5e1', 1.3));
      svg.appendChild(svgText(`${place} =`, labelX, y + 5, { size: 18, weight: 700 }));
      svg.appendChild(svgLine(rightLineX1, y, rightLineX2, y, '#cbd5e1', 1.3));

      const leftSolution = svgText(String(values[place].count), (leftLineX1 + leftLineX2) / 2, y - 4, { size: 13, anchor: 'middle', fill: '#0284c7' });
      leftSolution.classList.add('solution-only');
      const rightSolution = svgText(values[place].value, (rightLineX1 + rightLineX2) / 2, y - 4, { size: 13, anchor: 'middle', fill: '#0284c7' });
      rightSolution.classList.add('solution-only');
      svg.append(leftSolution, rightSolution);
    });
    return svg;
  }

  function decimalPlaceValueCard(value, places = ['E', 't']){
    const card = document.createElement('div');
    card.className = 'gi4-decimal-place-card row-delete-wrap';
    card.appendChild(rowDel(card));
    const whole = Math.floor(value / 10);
    const rest = value % 10;
    const tens = Math.floor(whole / 10);
    const ones = whole % 10;
    const board = document.createElement('div');
    board.className = `gi4-decimal-place-board cols-${places.length}`;
    places.forEach(place => {
      const col = document.createElement('div');
      col.className = `place ${place === 'T' ? 'tens' : place === 'E' ? 'ones' : 'tenths'}`;
      col.innerHTML = `<strong>${place}</strong>`;
      const count = place === 'T' ? tens : place === 'E' ? ones : rest;
      for (let i = 0; i < count; i++) {
        const token = document.createElement('span');
        token.className = 'gi4-decimal-place-token';
        token.textContent = place === 'T' ? '10' : place === 'E' ? '1' : '0,1';
        col.appendChild(token);
      }
      board.appendChild(col);
    });
    const values = {
      T: { count: tens, value: String(tens * 10) },
      E: { count: ones, value: String(ones) },
      t: { count: rest, value: decimalComma(rest / 10) },
    };
    const decimal = document.createElement('div');
    decimal.className = 'gi4-decimal-place-decimal';
    decimal.append('Dit is ', lineWithSolution(decimalComma(value / 10), 'short'));
    const work = document.createElement('div');
    work.className = 'gi4-decimal-place-work';
    work.appendChild(decimalPlaceValueWorkSvg(places, values));
    card.append(board, work, decimal);
    return card;
  }

  function makeDecimalPlaceValueGrid(){
    const grid = document.createElement('div');
    grid.className = 'gi4-decimal-place-grid';
    [31, 46, 42, 153].forEach((value, idx) => grid.appendChild(decimalPlaceValueCard(value, idx < 2 ? ['E', 't'] : ['T', 'E', 't'])));
    return grid;
  }

  function decimalWritePromptPool(){
    return [
      ['3 tienden', '0,3'],
      ['16 tienden', '1,6'],
      ['1 geheel 7 tienden', '1,7'],
      ['2 E 3 t', '2,3'],
      ['1 T 5 E 2 t', '15,2'],
      ['4 t', '0,4'],
      ['8,6', ['8 E', '6 t']],
      ['0,9', ['0 E', '9 t']],
      ['38,1', ['3 T', '8 E', '1 t']],
      ['203,4', ['2 H', '0 T', '3 E', '4 t']],
      ['7,2', ['7 E', '2 t']],
      ['41,5', ['4 T', '1 E', '5 t']],
    ];
  }

  function makeDecimalWriteRow(item){
    const row = document.createElement('div');
    row.className = 'gi4-decimal-write-row row-delete-wrap';
    row.appendChild(rowDel(row));
    if (Array.isArray(item[1])) {
      const [num, parts] = item;
      row.classList.add('values');
      row.append(`${num} = `);
      parts.forEach(part => {
        const [count, place] = part.split(' ');
        row.append(lineWithSolution(count, 'tiny'), ` ${place} `);
      });
    } else {
      const [q, a] = item;
      row.append(Object.assign(document.createElement('span'), { textContent: `${q} =` }), lineWithSolution(a, 'short'));
    }
    return row;
  }

  function appendDecimalWriteRows(container, amount){
    const existing = Array.from(container.querySelectorAll('.gi4-decimal-write-row'))
      .map(row => row.dataset.promptKey)
      .filter(Boolean);
    const pool = decimalWritePromptPool().map(item => ({ item, key: signaturePart(item[0]) }));
    for (let i = 0; i < amount; i++) {
      const next = pool.find(entry => !existing.includes(entry.key)) || pick(pool);
      const row = makeDecimalWriteRow(next.item);
      row.dataset.promptKey = next.key;
      container.appendChild(row);
      existing.push(next.key);
    }
  }

  function makeDecimalWriteValueCard(count = 10){
    const card = document.createElement('div');
    card.className = 'gi4-decimal-write-card row-delete-wrap';
    card.appendChild(rowDel(card));
    const list = document.createElement('div');
    list.className = 'gi4-decimal-write-list';
    appendDecimalWriteRows(list, count);
    card.appendChild(list);
    return card;
  }

  function decimalMixedOrderFraction(num, den, mixedWhole = null){
    const wrap = document.createElement('span');
    wrap.className = 'gi4-decimal-mixed-order-fraction';
    if (mixedWhole !== null) wrap.appendChild(Object.assign(document.createElement('b'), { textContent: `${mixedWhole} ` }));
    wrap.appendChild(fractionBox(num, den));
    return wrap;
  }

  function decimalMixedOrderValue(tenths, variant = 'decimal'){
    const wrap = document.createElement('span');
    wrap.className = 'gi4-decimal-mixed-order-value';
    if (variant === 'fraction') {
      wrap.appendChild(decimalMixedOrderFraction(tenths, 10));
    } else if (variant === 'mixed') {
      const { whole, rest } = decimalMixedLabel(tenths);
      wrap.appendChild(whole > 0 ? decimalMixedOrderFraction(rest, 10, whole) : decimalMixedOrderFraction(tenths, 10));
    } else {
      wrap.textContent = decimalComma(tenths / 10);
    }
    return wrap;
  }

  function makeDecimalMixedOrderIntro(){
    const b = block('gi4_decimal_mixed_order_intro', 'Kommagetallen groter dan 1 ordenen: onthouden.', null);
    const card = document.createElement('div');
    card.className = 'gi4-decimal-mixed-order-intro keep-together';
    card.innerHTML = '<div class="gi4-decimal-intro-title">Onthoud</div><p>Je kan kommagetallen, breuken en gemengde getallen op dezelfde getallenas plaatsen.</p>';
    const axis = document.createElement('div');
    axis.className = 'gi4-decimal-mixed-order-axis';
    axis.appendChild(Object.assign(document.createElement('div'), { className: 'axis-line' }));
    const axisPos = i => `calc(34px + (100% - 78px) * ${i / 20})`;
    for (let i = 0; i <= 20; i++) {
      const tick = document.createElement('span');
      tick.className = `tick${i % 10 === 0 ? ' major' : ''}`;
      tick.style.left = axisPos(i);
      axis.appendChild(tick);
      if (i % 10 === 0) {
        const whole = document.createElement('span');
        whole.className = 'whole-chip';
        whole.style.left = axisPos(i);
        whole.textContent = String(i / 10);
        axis.appendChild(whole);
      } else {
        const dec = document.createElement('span');
        dec.className = `decimal-chip ${i % 2 ? 'bottom' : 'top'}`;
        dec.style.left = axisPos(i);
        dec.textContent = decimalComma(i / 10);
        axis.appendChild(dec);
        const frac = document.createElement('span');
        frac.className = `fraction-chip ${i % 2 ? 'bottom' : 'top'}`;
        frac.style.left = axisPos(i);
        if (i < 10) frac.appendChild(fractionBox(i, 10));
        else frac.appendChild(decimalMixedOrderFraction(i - 10, 10, 1));
        axis.appendChild(frac);
      }
    }
    card.appendChild(axis);
    b.appendChild(card);
  }

  function decimalMixedMissingVariant(){
    const variants = [
      { points: [1, 4, 7, 10, 13, 16, 19], shown: [1, 16] },
      { points: [2, 5, 8, 11, 14, 17], shown: [5, 14] },
      { points: [3, 6, 9, 12, 15, 18], shown: [3, 18] },
      { points: [2, 6, 10, 13, 17], shown: [6] },
    ];
    return pickUnused('gi4_decimal_mixed_order_missing', variants, v => [v.points, v.shown]);
  }

  function makeDecimalMixedOrderMissingCard(){
    const variant = decimalMixedMissingVariant();
    if (!variant) return null;
    const card = document.createElement('div');
    card.className = 'gi4-decimal-mixed-order-missing-card row-delete-wrap';
    card.appendChild(rowDel(card));
    const axis = document.createElement('div');
    axis.className = 'gi4-decimal-missing-axis mixed';
    const track = document.createElement('div');
    track.className = 'gi4-decimal-missing-track';
    track.appendChild(Object.assign(document.createElement('div'), { className: 'gi4-decimal-missing-line' }));
    for (let i = 0; i <= 20; i++) {
      const tick = document.createElement('span');
      tick.className = `gi4-decimal-missing-tick${i % 10 === 0 ? ' major' : ''}`;
      tick.style.left = `${i * 5}%`;
      track.appendChild(tick);
      if (i % 10 === 0) {
        const end = document.createElement('span');
        end.className = 'gi4-decimal-missing-end';
        end.style.left = `${i * 5}%`;
        end.textContent = String(i / 10);
        track.appendChild(end);
      }
    }
    axis.appendChild(track);
    const grid = document.createElement('div');
    grid.className = 'gi4-decimal-missing-grid mixed';
    variant.points.forEach(i => {
      const col = document.createElement('div');
      col.className = 'gi4-decimal-missing-col';
      col.style.left = `${i * 5}%`;
      const chip = document.createElement('span');
      chip.className = 'gi4-decimal-missing-chip';
      if (variant.shown.includes(i)) chip.textContent = decimalComma(i / 10);
      else chip.appendChild(markSolution(sol(decimalComma(i / 10))));
      col.appendChild(chip);

      const showNumerator = i % 4 === 0;
      col.appendChild(decimalOrderFraction(showNumerator ? String(i) : '', '10', showNumerator ? '' : String(i)));

      if (i > 10) {
        const rest = i - 10;
        const showRest = i % 4 !== 0;
        const frac = decimalOrderFraction(showRest ? String(rest) : '', '10', showRest ? '' : String(rest), '', 'simple');
        const mixed = document.createElement('span');
        mixed.className = 'gi4-decimal-mixed-missing-mixed';
        mixed.append('1 ', frac);
        col.appendChild(mixed);
      }
      grid.appendChild(col);
    });
    axis.appendChild(grid);
    card.appendChild(axis);
    return card;
  }

  function decimalMixedJumpVariant(){
    const variants = [
      { step: 1, start: 30, length: 11, show: [2, 3, 4, 8] },
      { step: 1, start: 14, length: 11, show: [0, 4, 5, 9] },
      { step: 2, start: 10, length: 6, show: [0, 1, 5] },
      { step: 2, start: 24, length: 6, show: [0, 2, 5] },
      { step: -2, start: 46, length: 6, show: [0, 1, 5] },
      { step: -2, start: 58, length: 6, show: [0, 3, 5] },
      { step: 5, start: 30, length: 11, show: [2, 3, 4, 8, 9] },
      { step: 5, start: 15, length: 8, show: [0, 1, 4, 7] },
      { step: -5, start: 75, length: 8, show: [0, 2, 5, 7] },
    ];
    return pickUnused('gi4_decimal_mixed_order_jump_row', variants, v => [v.step, v.start, v.length]);
  }

  function makeDecimalMixedOrderJumpsCard(){
    const rowData = decimalMixedJumpVariant();
    if (!rowData) return null;
    const card = document.createElement('div');
    card.className = 'gi4-decimal-mixed-order-jumps-card row-delete-wrap';
    card.appendChild(rowDel(card));
    const tag = document.createElement('div');
    tag.className = 'gi4-decimal-jump-tag';
    tag.textContent = `Maak sprongen van ${decimalComma(Math.abs(rowData.step) / 10)}.`;
    const row = document.createElement('div');
    row.className = 'gi4-decimal-jump-row mixed';
    row.style.gridTemplateColumns = `repeat(${rowData.length}, 1fr)`;
    for (let i = 0; i < rowData.length; i++) {
      const value = rowData.start + i * rowData.step;
      const cell = document.createElement('span');
      if (rowData.show.includes(i)) cell.textContent = decimalComma(value / 10);
      else cell.appendChild(markSolution(sol(decimalComma(value / 10))));
      row.appendChild(cell);
    }
    card.append(tag, row);
    return card;
  }

  function decimalMixedGreatestSet(){
    const sets = [
      [12, 13, 16],
      [2, 15, 5],
      [14, 19, 17],
      [51, 52, 53],
      [68, 63, 62],
      [34, 35, 30],
      [21, 17, 12],
      [24, 23, 28],
    ];
    return pickUnused('gi4_decimal_mixed_order_greatest', sets, set => set.join('-'));
  }

  function makeDecimalMixedOrderGreatestCard(){
    const set = decimalMixedGreatestSet();
    if (!set) return null;
    const variants = ['mixed', 'decimal', 'fraction'].sort(() => Math.random() - .5);
    const card = document.createElement('div');
    card.className = 'gi4-decimal-mixed-order-greatest-card row-delete-wrap';
    card.appendChild(rowDel(card));
    set.forEach((value, idx) => {
      const choice = document.createElement('span');
      choice.className = 'gi4-decimal-greatest-choice';
      choice.appendChild(decimalMixedOrderValue(value, variants[idx]));
      if (value === Math.max(...set)) choice.classList.add('solution-highlight');
      card.appendChild(choice);
    });
    return card;
  }

  function decimalMixedComparePair(){
    const pairs = [
      [34, 64], [49, 45], [38, 308], [8, 13], [50, 5], [82, 90],
      [12, 16], [19, 17], [24, 21], [35, 34], [68, 63], [51, 53],
    ];
    return pickUnused('gi4_decimal_mixed_order_compare_pair', pairs, pair => pair.join('-'));
  }

  function makeDecimalMixedOrderCompareCard(){
    const pair = decimalMixedComparePair();
    if (!pair) return null;
    const card = document.createElement('div');
    card.className = 'gi4-decimal-mixed-order-compare-card row-delete-wrap';
    card.appendChild(rowDel(card));
    const row = document.createElement('div');
    row.className = 'gi4-decimal-mixed-compare-row';
    const sign = document.createElement('span');
    sign.className = 'gi4-compare-box';
    sign.appendChild(sol(compareSymbol(pair[0], pair[1])));
    row.append(decimalMixedOrderValue(pair[0], 'decimal'), sign, decimalMixedOrderValue(pair[1], 'decimal'));
    card.appendChild(row);
    return card;
  }

  function makeDecimalMixedModeCard(mode){
    if (mode === 'connect') return makeDecimalMixedConnectCard();
    if (mode === 'stripAxis') return makeDecimalMixedStripAxisCard(false);
    if (mode === 'orderMissing') return makeDecimalMixedOrderMissingCard();
    if (mode === 'orderJumps') return makeDecimalMixedOrderJumpsCard();
    if (mode === 'orderGreatest') return makeDecimalMixedOrderGreatestCard();
    if (mode === 'orderCompare') return makeDecimalMixedOrderCompareCard();
    return makeDecimalMixedFillCard();
  }

  function makeDecimalMixedConnectCard(){
    const values = pickUnused('gi4_decimal_mixed_connect', [
      [12, 16, 24, 28],
      [11, 15, 22, 27],
      [13, 18, 21, 25],
      [14, 17, 23, 29],
    ], set => set.join('-'));
    if (!values) return null;
    const card = document.createElement('div');
    card.className = 'gi4-decimal-mixed-connect-card row-delete-wrap';
    card.appendChild(rowDel(card));
    const visualRow = document.createElement('div');
    visualRow.className = 'gi4-decimal-mixed-connect-row visuals';
    values.forEach(value => {
      const tile = document.createElement('div');
      tile.className = 'gi4-decimal-mixed-connect-tile';
      tile.dataset.value = String(value);
      tile.append(decimalMixedModel(value, { compact: true }), Object.assign(document.createElement('span'), { className: 'gi4-connect-dot bottom' }));
      visualRow.appendChild(tile);
    });
    const fractionRow = document.createElement('div');
    fractionRow.className = 'gi4-decimal-mixed-connect-row fractions';
    [...values].sort(() => Math.random() - .5).forEach(value => {
      const tile = document.createElement('div');
      tile.className = 'gi4-decimal-mixed-connect-tile';
      tile.dataset.value = String(value);
      tile.append(Object.assign(document.createElement('span'), { className: 'gi4-connect-dot top' }), fractionBox(value, 10), document.createTextNode(' = '), decimalMixedNumber(value, true), Object.assign(document.createElement('span'), { className: 'gi4-connect-dot bottom' }));
      fractionRow.appendChild(tile);
    });
    const decimalRow = document.createElement('div');
    decimalRow.className = 'gi4-decimal-mixed-connect-row decimals';
    [...values].sort(() => Math.random() - .5).forEach(value => {
      const tile = document.createElement('div');
      tile.className = 'gi4-decimal-mixed-connect-tile';
      tile.dataset.value = String(value);
      tile.append(Object.assign(document.createElement('span'), { className: 'gi4-connect-dot top' }), document.createTextNode(decimalComma(value / 10)));
      decimalRow.appendChild(tile);
    });
    card.append(visualRow, fractionRow, decimalRow);
    return card;
  }

  function decimalMixedRepresentation(value, kind){
    if (kind === 'axis') return decimalMixedStripAxis(value, Math.max(2, Math.ceil(value / 10)));
    if (kind === 'strips') return decimalMixedModel(value, { strips: true });
    return decimalMixedModel(value);
  }

  function makeDecimalMixedTable(){
    const values = [12, 15, 17, 24].sort(() => Math.random() - .5);
    const kinds = ['blocks', 'strips', 'axis', 'blocks'];
    const card = document.createElement('div');
    card.className = 'gi4-decimal-mixed-table-card row-delete-wrap';
    card.appendChild(rowDel(card));
    const table = document.createElement('table');
    table.className = 'gi4-decimal-mixed-table';
    table.innerHTML = '<thead><tr><th>voorstelling</th><th>gemengd getal</th><th>onechte breuk</th><th>kommagetal</th></tr></thead>';
    const body = document.createElement('tbody');
    values.forEach((value, idx) => {
      const tr = document.createElement('tr');
      const visual = document.createElement('td');
      visual.appendChild(decimalMixedRepresentation(value, kinds[idx]));
      const mixed = document.createElement('td');
      mixed.appendChild(decimalMixedNumber(value, true));
      const improper = document.createElement('td');
      improper.appendChild(fractionBox('', '10', String(value), ''));
      const comma = document.createElement('td');
      comma.appendChild(lineWithSolution(decimalComma(value / 10), 'short'));
      tr.append(visual, mixed, improper, comma);
      body.appendChild(tr);
    });
    table.appendChild(body);
    card.appendChild(table);
    return card;
  }

  function addDecimalMixed(extraCount, forcedMode){
    const mode = forcedMode || $('#decimalMixedMode')?.value || 'intro';
    if (mode === 'intro') {
      addDecimalMixedIntro();
      return;
    }
    if (mode === 'orderIntro') {
      makeDecimalMixedOrderIntro();
      return;
    }
    const key = `gi4_decimal_mixed_${mode}`;
    const requested = Math.max(1, Math.min(6, parseInt($('#decimalMixedCount')?.value, 10) || 3));
    const count = extraCount || requested;
    if (extraCount) {
      const existing = containerInLastBlock(key, '.gi4-decimal-mixed-grid', `gi4-decimal-mixed-grid ${mode}`);
      if (mode === 'writeValue') {
        const list = containerInLastBlock(key, '.gi4-decimal-write-list', 'gi4-decimal-write-list');
        if (list) {
          appendDecimalWriteRows(list, count);
          return;
        }
      }
      if (existing) {
        for (let i = 0; i < count; i++) appendNewExercise(existing, () => makeDecimalMixedModeCard(mode));
        return;
      }
    }
    const titles = {
      fill: 'Kommagetallen groter dan 1: vul aan.',
      stripAxis: 'Kommagetallen groter dan 1: strook en getallenas.',
      connect: 'Kommagetallen groter dan 1: verbind.',
      table: 'Kommagetallen groter dan 1: tabel.',
      equivalent: 'Kommagetallen groter dan 1: geef dezelfde waarde dezelfde kleur.',
      placeValue: 'Kommagetallen groter dan 1: plaatswaarde.',
      writeValue: 'Kommagetallen groter dan 1: schrijf en bepaal de waarde.',
      orderMissing: 'Kommagetallen groter dan 1 ordenen: vul de getallenas aan.',
      orderJumps: 'Kommagetallen groter dan 1 ordenen: tel verder of terug.',
      orderGreatest: 'Kommagetallen groter dan 1 ordenen: kleur de grootste waarde.',
      orderCompare: 'Kommagetallen groter dan 1 ordenen: vergelijk.',
    };
    const b = block(key, titles[mode] || 'Kommagetallen groter dan 1.', addCount => addDecimalMixed(addCount || 1, mode));
    const instructions = {
      fill: ['Vul de ontbrekende gegevens in.', 'Schrijf als onechte breuk, gemengd getal en kommagetal.'],
      stripAxis: ['Stel de hoeveelheid voor op de stroken. Kleur in.', 'Schrijf het gemengd getal en de onechte breuk.', 'Schrijf het kommagetal.'],
      connect: ['Verbind elke voorstelling met de juiste onechte breuk.', 'Schrijf de onechte breuk als gemengd getal.', 'Verbind met het juiste kommagetal.'],
      table: ['Vul de tabel aan.'],
      equivalent: ['Geef wat evenveel is dezelfde kleur.'],
      placeValue: ['Hoeveel gehelen? Schrijf de eenheden (E).', 'Hoeveel tienden? Schrijf de tienden (t).', 'Schrijf het kommagetal.'],
      writeValue: ['Schrijf de kommagetallen.', 'Schrijf de waarde van elk cijfer.'],
      orderMissing: ['Vul de ontbrekende kommagetallen aan.', 'Vul de ontbrekende breuken aan.', 'Vul de ontbrekende breukdelen bij de gemengde getallen aan.'],
      orderJumps: ['Tel verder of tel terug.'],
      orderGreatest: ['Kleur de grootste waarde in elke reeks van 3.', '<strong>Tip!</strong> Je kan alles als breuk met noemer 10 schrijven.'],
      orderCompare: ['Vergelijk eerst de gehelen. Vergelijk daarna de tienden.', 'Schrijf: &lt; of &gt;.'],
    };
    addFractionInstructions(b, instructions[mode] || ['Vul aan.']);
    if (mode === 'stripAxis') {
      const grid = document.createElement('div');
      grid.className = 'gi4-decimal-mixed-grid stripAxis';
      for (let i = 0; i < count; i++) appendNewExercise(grid, () => makeDecimalMixedStripAxisCard(i === 0));
      b.appendChild(grid);
      addLocalExerciseButton(b, '+ oefening bij deze keuze', () => addDecimalMixed(1, mode));
    } else if (mode === 'table') {
      b.appendChild(makeDecimalMixedTable());
    } else if (mode === 'equivalent') {
      b.appendChild(makeDecimalMixedEquivalentCard());
    } else if (mode === 'placeValue') {
      b.appendChild(makeDecimalPlaceValueGrid());
    } else if (mode === 'writeValue') {
      b.appendChild(makeDecimalWriteValueCard(count));
      addLocalExerciseButton(b, '+ oefening bij deze keuze', () => addDecimalMixed(1, mode));
    } else {
      const grid = document.createElement('div');
      grid.className = `gi4-decimal-mixed-grid ${mode}`;
      for (let i = 0; i < count; i++) appendNewExercise(grid, () => makeDecimalMixedModeCard(mode));
      b.appendChild(grid);
      addLocalExerciseButton(b, '+ oefening bij deze keuze', () => addDecimalMixed(1, mode));
    }
  }

  function makeDecimalColorCard(){
    const t = rnd(1, 9);
    const type = pick(['strip', 'circle', 'grid', 'eggs']);
    if (!rememberExercise('gi4_decimal_color', { t, type })) return null;
    const card = document.createElement('div');
    card.className = 'gi4-decimal-card row-delete-wrap';
    card.appendChild(rowDel(card));
    const label = document.createElement('strong');
    label.textContent = decimalWord(t);
    const text = document.createElement('div');
    text.className = 'gi4-decimal-card-title';
    text.append(label, document.createTextNode(' van het geheel'));
    card.append(text, decimalVisual(t, type, false), decimalAnswerBox(t, false));
    return card;
  }

  function addDecimalColor(extraCount){
    const key = 'gi4_decimal_color';
    const requested = Math.max(1, Math.min(8, parseInt($('#decimalColorCount').value, 10) || 3));
    const count = extraCount || requested;
    if (extraCount) {
      const existing = containerInLastBlock(key, '.gi4-decimal-grid.cards', 'gi4-decimal-grid cards');
      if (existing) {
        for (let i = 0; i < count; i++) appendNewExercise(existing, makeDecimalColorCard);
        return;
      }
    }
    const b = block(key, 'Kommagetallen: kleur tienden en schrijf de breuk.', addCount => addDecimalColor(addCount || 1));
    addFractionInstructions(b, ['Kleur het gevraagde deel.', 'Schrijf de passende breuk erbij.']);
    const grid = document.createElement('div');
    grid.className = 'gi4-decimal-grid cards';
    for (let i = 0; i < count; i++) appendNewExercise(grid, makeDecimalColorCard);
    b.appendChild(grid);
    addLocalExerciseButton(b, '+ oefening bij deze keuze', () => addDecimalColor(1));
  }

  function makeDecimalTableRow(){
    const t = rnd(1, 9);
    const type = pick(['eggs', 'circle', 'grid', 'axis', 'strip']);
    if (!rememberExercise('gi4_decimal_table', { t, type })) return null;
    const tr = document.createElement('tr');
    tr.className = 'row-delete-wrap';
    const visual = document.createElement('td');
    visual.appendChild(decimalVisual(t, type, true));
    const words = document.createElement('td');
    words.append(lineWithSolution(String(t), 'tiny'), document.createTextNode(' tienden'));
    const frac = document.createElement('td');
    frac.appendChild(fractionBox('', '', String(t), '10'));
    const comma = document.createElement('td');
    comma.appendChild(lineWithSolution(decimalComma(t / 10), 'short'));
    const actions = document.createElement('td');
    actions.className = 'gi4-table-row-actions';
    actions.appendChild(rowDel(tr));
    tr.append(visual, words, frac, comma, actions);
    return tr;
  }

  function addDecimalTable(extraCount){
    const key = 'gi4_decimal_table';
    const requested = Math.max(2, Math.min(8, parseInt($('#decimalTableCount').value, 10) || 5));
    const count = extraCount || requested;
    if (extraCount) {
      const table = containerInLastBlock(key, '.gi4-decimal-table tbody', '', 'tbody');
      if (table) {
        for (let i = 0; i < count; i++) appendNewExercise(table, makeDecimalTableRow);
        return;
      }
    }
    const b = block(key, 'Kommagetallen: welk deel van het geheel zie je?', addCount => addDecimalTable(addCount || 1));
    addFractionInstructions(b, ['Vul in.', 'Schrijf de tiendelige breuk.', 'Schrijf het kommagetal.']);
    const table = document.createElement('table');
    table.className = 'gi4-decimal-table';
    table.innerHTML = '<thead><tr><th>welk deel?</th><th>dit zijn ...</th><th>breuk</th><th>kommagetal</th><th class="gi4-table-row-actions"></th></tr></thead>';
    const body = document.createElement('tbody');
    for (let i = 0; i < count; i++) appendNewExercise(body, makeDecimalTableRow);
    table.appendChild(body);
    b.appendChild(table);
    addLocalExerciseButton(b, '+ rij bij deze keuze', () => addDecimalTable(1));
  }

  function makeDecimalLineCard(){
    const t = rnd(1, 9);
    if (!rememberExercise('gi4_decimal_line', t)) return null;
    const card = document.createElement('div');
    card.className = 'gi4-decimal-line-card row-delete-wrap';
    card.appendChild(rowDel(card));
    const title = document.createElement('div');
    title.className = 'gi4-decimal-card-title';
    title.textContent = `${decimalWord(t)} van het geheel`;
    card.append(title, decimalStrip(t, { show: false }), decimalAxis(t), decimalAnswerBox(t));
    return card;
  }

  function addDecimalLine(extraCount){
    const key = 'gi4_decimal_line';
    const requested = Math.max(1, Math.min(6, parseInt($('#decimalLineCount').value, 10) || 4));
    const count = extraCount || requested;
    if (extraCount) {
      const existing = containerInLastBlock(key, '.gi4-decimal-grid.two', 'gi4-decimal-grid two');
      if (existing) {
        for (let i = 0; i < count; i++) appendNewExercise(existing, makeDecimalLineCard);
        return;
      }
    }
    const b = block(key, 'Kommagetallen: strook, getallenas en kommagetal.', addCount => addDecimalLine(addCount || 1));
    addFractionInstructions(b, ['Kleur het deel van het geheel.', 'Schrijf de tiendelige breuk.', 'Schrijf het kommagetal.']);
    const grid = document.createElement('div');
    grid.className = 'gi4-decimal-grid two';
    for (let i = 0; i < count; i++) appendNewExercise(grid, makeDecimalLineCard);
    b.appendChild(grid);
    addLocalExerciseButton(b, '+ oefening bij deze keuze', () => addDecimalLine(1));
  }

  function randomDecimalComparePair(mode){
    let a = rnd(1, 9);
    let b = rnd(1, 9);
    if (a === b && Math.random() > .25) b = a === 9 ? 8 : a + 1;
    let leftIsFraction = mode !== 'plain' && Math.random() > .5;
    let rightIsFraction = mode !== 'plain' && Math.random() > .5;
    if (mode === 'reference') {
      leftIsFraction = Math.random() > .5;
      rightIsFraction = !leftIsFraction;
    }
    const referenceKind = mode === 'reference' ? pick(['near', 'half']) : null;
    return { a, b, leftIsFraction, rightIsFraction, mode, referenceKind };
  }

  function compareSymbol(a, b){ return a === b ? '=' : (a < b ? '<' : '>'); }

  function decimalCompareItem(value, isFraction){
    const wrap = document.createElement('span');
    wrap.className = 'gi4-decimal-compare-value';
    if (isFraction) wrap.appendChild(fractionBox(value, '10'));
    else wrap.textContent = decimalComma(value / 10);
    return wrap;
  }

  function decimalReferenceBoxText(value, kind){
    if (kind === 'half') return value === 5 ? 'minder dan / juist / meer dan de helft' : 'minder / meer dan de helft';
    return value === 5 ? 'dicht bij 0 / 1/2 / 1' : 'dicht bij 0 / 1';
  }

  function decimalReferenceSolution(value, kind){
    if (kind === 'half') return value === 5 ? 'juist de helft' : (value < 5 ? 'minder dan de helft' : 'meer dan de helft');
    return value === 5 ? 'dicht bij 1/2' : (value < 5 ? 'dicht bij 0' : 'dicht bij 1');
  }

  function makeDecimalCompareCard(mode){
    const data = makeUnique(`gi4_decimal_compare_${mode}`, () => randomDecimalComparePair(mode));
    if (!data) return null;
    const card = document.createElement('div');
    card.className = `gi4-decimal-compare-card ${mode} row-delete-wrap`;
    card.appendChild(rowDel(card));
    if (mode === 'reference') card.appendChild(decimalAxis(null, { labels: true, axisEnd: 92 }));
    if (mode === 'reference') {
      const grid = document.createElement('div');
      grid.className = 'gi4-decimal-reference-grid';
      const sign = document.createElement('span');
      sign.className = 'gi4-compare-box';
      sign.appendChild(sol(compareSymbol(data.a, data.b)));
      const makeReferenceStack = (value, isFraction) => {
        const stack = document.createElement('span');
        stack.className = 'gi4-decimal-reference-stack';
        const arrow = document.createElement('span');
        arrow.className = 'gi4-decimal-reference-arrow';
        const answer = document.createElement('span');
        answer.className = 'gi4-decimal-reference-answer';
        answer.textContent = decimalReferenceBoxText(value, data.referenceKind);
        const solution = sol(decimalReferenceSolution(value, data.referenceKind));
        solution.classList.add('gi4-reference-solution-note');
        answer.append(document.createTextNode(' '), solution);
        stack.append(decimalCompareItem(value, isFraction), arrow, answer);
        return stack;
      };
      grid.append(makeReferenceStack(data.a, data.leftIsFraction), sign, makeReferenceStack(data.b, data.rightIsFraction));
      card.appendChild(grid);
      return card;
    }
    const top = document.createElement('div');
    top.className = 'gi4-decimal-compare-row';
    if (mode === 'reference') top.classList.add('reference');
    const sign = document.createElement('span');
    sign.className = 'gi4-compare-box';
    sign.appendChild(sol(compareSymbol(data.a, data.b)));
    top.append(decimalCompareItem(data.a, data.leftIsFraction), sign, decimalCompareItem(data.b, data.rightIsFraction));
    card.appendChild(top);
    if (mode === 'convert') {
      const work = document.createElement('div');
      work.className = 'gi4-decimal-convert-work';
      work.append(decimalAnswerBox(data.a, false), document.createTextNode(' en '), decimalAnswerBox(data.b, false));
      card.appendChild(work);
    } else if (mode === 'visual') {
      const visuals = document.createElement('div');
      visuals.className = 'gi4-decimal-visual-compare';
      visuals.append(decimalCircle(data.a, true), decimalCircle(data.b, true));
      card.insertBefore(visuals, top);
    }
    return card;
  }

  function addDecimalCompare(extraCount, forcedMode){
    const mode = forcedMode || $('#decimalCompareMode')?.value || 'convert';
    const key = `gi4_decimal_compare_${mode}`;
    const requested = Math.max(1, Math.min(8, parseInt($('#decimalCompareCount').value, 10) || 3));
    const count = extraCount || requested;
    if (extraCount) {
      const existing = containerInLastBlock(key, '.gi4-decimal-grid.compare', 'gi4-decimal-grid compare');
      if (existing) {
        for (let i = 0; i < count; i++) appendNewExercise(existing, () => makeDecimalCompareCard(mode));
        return;
      }
    }
    const title = mode === 'plain' ? 'Kommagetallen: vergelijk kort.' : mode === 'reference' ? 'Kommagetallen: vergelijk met referentiepunten.' : 'Kommagetallen en breuken vergelijken.';
    const b = block(key, title, addCount => addDecimalCompare(addCount || 1, mode));
    addFractionInstructions(b, mode === 'reference'
      ? ['Vergelijk de hoeveelheden met de referentiepunten.', 'Markeer wat past.', 'Schrijf &lt;, &gt; of =.', '<strong>Tip!</strong> Verbind de hoeveelheden met hun plaats.']
      : ['Vergelijk de hoeveelheden.', 'Schrijf &lt;, &gt; of =.']);
    const grid = document.createElement('div');
    grid.className = 'gi4-decimal-grid compare';
    for (let i = 0; i < count; i++) appendNewExercise(grid, () => makeDecimalCompareCard(mode));
    b.appendChild(grid);
    addLocalExerciseButton(b, '+ oefening bij deze keuze', () => addDecimalCompare(1, mode));
  }

  function addDecimalOrderIntro(){
    const b = block('gi4_decimal_order_intro', 'Kommagetallen ordenen: onthouden.', null);
    const card = document.createElement('div');
    card.className = 'gi4-decimal-intro order';
    card.innerHTML = '<div class="gi4-decimal-intro-title">Onthoud</div><p>Van 0 tot 1 kan je de lijn verdelen in tienden. Elk stapje is 0,1.</p>';
    const axis = decimalAxis(null, { decimals: false });
    card.appendChild(axis);
    const strip = document.createElement('div');
    strip.className = 'gi4-decimal-order-list';
    const simplified = {
      2: ['1', '5'],
      4: ['2', '5'],
      5: ['1', '2'],
      6: ['3', '5'],
      8: ['4', '5'],
    };
    const makeFraction = (topText, bottomText, extraClass = '') => {
      const frac = document.createElement('span');
      frac.className = `gi4-decimal-order-fraction${extraClass ? ` ${extraClass}` : ''}`;
      const top = document.createElement('span');
      top.textContent = topText;
      const bar = document.createElement('i');
      const bottom = document.createElement('span');
      bottom.textContent = bottomText;
      frac.append(top, bar, bottom);
      return frac;
    };
    ['0', '0,1', '0,2', '0,3', '0,4', '0,5', '0,6', '0,7', '0,8', '0,9', '1'].forEach((txt, i) => {
      const col = document.createElement('div');
      col.className = 'gi4-decimal-order-col';
      const chip = document.createElement('span');
      chip.className = `gi4-decimal-order-decimal${i === 0 || i === 10 ? ' whole' : ''}`;
      chip.textContent = txt;
      col.appendChild(chip);
      if (i > 0 && i < 10) {
        col.appendChild(makeFraction(String(i), '10'));
        if (simplified[i]) col.appendChild(makeFraction(simplified[i][0], simplified[i][1], 'simple'));
      }
      strip.appendChild(col);
    });
    card.appendChild(strip);
    b.appendChild(card);
  }

  function decimalOrderFraction(num, den, solutionNum = '', solutionDen = '', extraClass = ''){
    const frac = document.createElement('span');
    frac.className = `gi4-decimal-missing-fraction${extraClass ? ` ${extraClass}` : ''}`;
    const top = document.createElement('span');
    top.textContent = num ?? '';
    if ((num ?? '') === '' && solutionNum !== '') top.appendChild(sol(String(solutionNum)));
    const bar = document.createElement('i');
    const bottom = document.createElement('span');
    bottom.textContent = den ?? '';
    if ((den ?? '') === '' && solutionDen !== '') bottom.appendChild(sol(String(solutionDen)));
    frac.append(top, bar, bottom);
    return frac;
  }

  function decimalAxisTickLabel(tenths){
    return tenths % 10 === 0 ? String(tenths / 10) : decimalComma(tenths / 10);
  }

  function reduceTenths(tenths){
    let a = Math.abs(tenths), b = 10;
    while (b) {
      const rest = a % b;
      a = b;
      b = rest;
    }
    return { num: tenths / a, den: 10 / a };
  }

  function decimalMissingVariant(){
    const starts = [0, 5, 10, 15, 20];
    const visiblePatterns = [
      [2, 4, 5, 8],
      [1, 3, 6, 9],
      [2, 5, 7],
      [1, 4, 6, 8],
      [3, 5, 7, 9],
    ];
    const fractionPatterns = [
      [2, 4, 5, 6, 8],
      [1, 3, 5, 7, 9],
      [2, 3, 6, 8],
      [1, 4, 5, 7],
      [3, 5, 6, 9],
    ];
    const simplePatterns = [
      [2, 4, 5, 6, 8],
      [1, 3, 5, 9],
      [2, 5, 7],
      [4, 5, 6, 8],
      [1, 5, 7, 9],
    ];
    const variants = [];
    starts.forEach((start, startIndex) => {
      visiblePatterns.forEach((visible, patternIndex) => {
        variants.push({
          start,
          visible,
          tenths: fractionPatterns[(patternIndex + startIndex) % fractionPatterns.length],
          simple: simplePatterns[(patternIndex + startIndex * 2) % simplePatterns.length],
        });
      });
    });
    return pickUnused('gi4_decimal_missing_axis', variants, v => [v.start, v.visible, v.tenths, v.simple]);
  }

  function makeDecimalMissingCard(){
    const variant = decimalMissingVariant();
    if (!variant) return null;
    const { start, visible, tenths, simple } = variant;
    const card = document.createElement('div');
    card.className = 'gi4-decimal-missing-card row-delete-wrap';
    card.appendChild(rowDel(card));
    const axis = document.createElement('div');
    axis.className = 'gi4-decimal-missing-axis';
    const track = document.createElement('div');
    track.className = 'gi4-decimal-missing-track';
    track.appendChild(Object.assign(document.createElement('div'), { className: 'gi4-decimal-missing-line' }));
    for (let i = 0; i <= 10; i++) {
      const tick = document.createElement('span');
      tick.className = `gi4-decimal-missing-tick${i === 0 || i === 10 ? ' major' : ''}`;
      tick.style.left = `${i * 10}%`;
      track.appendChild(tick);
      if (i === 0 || i === 10) {
        const end = document.createElement('span');
        end.className = 'gi4-decimal-missing-end';
        end.style.left = `${i * 10}%`;
        end.textContent = decimalAxisTickLabel(start + i);
        track.appendChild(end);
      }
    }
    axis.appendChild(track);

    const grid = document.createElement('div');
    grid.className = 'gi4-decimal-missing-grid';
    for (let i = 1; i <= 9; i++) {
      const value = start + i;
      const col = document.createElement('div');
      col.className = 'gi4-decimal-missing-col';
      col.style.left = `${i * 10}%`;
      const chip = document.createElement('span');
      chip.className = 'gi4-decimal-missing-chip';
      if (visible.includes(i)) chip.textContent = decimalComma(value / 10);
      else chip.appendChild(markSolution(sol(decimalComma(value / 10))));
      col.appendChild(chip);
      if (tenths.includes(i)) {
        const showNumerator = i % 3 === 0;
        col.appendChild(decimalOrderFraction(showNumerator ? String(value) : '', '10', showNumerator ? '' : String(value)));
      }
      if (simple.includes(i)) {
        const reduced = reduceTenths(value);
        if (reduced.den !== 10) {
          const showDenominator = i % 2 === 0;
          col.appendChild(decimalOrderFraction(showDenominator ? '' : String(reduced.num), showDenominator ? String(reduced.den) : '', showDenominator ? String(reduced.num) : '', showDenominator ? '' : String(reduced.den), 'simple'));
        }
      }
      grid.appendChild(col);
    }
    axis.appendChild(grid);
    card.appendChild(axis);
    return card;
  }

  function makeDecimalJumpsCard(){
    const step = pick([1, 2, 5]);
    const start = step === 5 ? pick([0, 5, 10]) : rnd(0, 10 - step * 4);
    const values = Array.from({ length: 6 }, (_, i) => start + i * step).filter(v => v <= 10);
    const card = document.createElement('div');
    card.className = 'gi4-decimal-jump-card row-delete-wrap';
    card.appendChild(rowDel(card));
    const tag = document.createElement('div');
    tag.className = 'gi4-decimal-jump-tag';
    tag.textContent = `Maak sprongen van ${decimalComma(step / 10)}.`;
    card.appendChild(tag);
    const row = document.createElement('div');
    row.className = 'gi4-decimal-jump-row';
    values.forEach((v, i) => {
      const cell = document.createElement('span');
      if (i === 0 || i === 2 || i === values.length - 1) cell.textContent = decimalComma(v / 10);
      else cell.appendChild(markSolution(sol(decimalComma(v / 10))));
      row.appendChild(cell);
    });
    card.appendChild(row);
    return card;
  }

  function makeDecimalGreatestCard(){
    const values = [];
    while (values.length < 3) {
      const t = rnd(1, 9);
      const asFraction = Math.random() > .5;
      const key = `${asFraction ? 'f' : 'd'}${t}`;
      if (!values.some(v => v.key === key)) values.push({ t, asFraction, key });
    }
    if (!rememberExercise('gi4_decimal_greatest', values.map(v => v.key))) return null;
    const card = document.createElement('div');
    card.className = 'gi4-decimal-greatest-card row-delete-wrap';
    card.appendChild(rowDel(card));
    values.forEach(v => {
      const choice = document.createElement('span');
      choice.className = 'gi4-decimal-greatest-choice';
      choice.appendChild(decimalCompareItem(v.t, v.asFraction));
      card.appendChild(choice);
    });
    const max = Math.max(...values.map(v => v.t));
    values.forEach((v, idx) => {
      if (v.t === max) card.children[idx + 1]?.classList.add('solution-highlight');
    });
    return card;
  }

  function makeDecimalContentsCard(){
    const pool = [
      { name: 'blik', label: '0,3 l', value: 3 },
      { name: 'melk', label: '1/2 l', value: 5 },
      { name: 'water', label: '0,5 l', value: 5 },
      { name: 'beker', label: '0,2 l', value: 2 },
      { name: 'fles', label: '0,8 l', value: 8 },
      { name: 'sap', label: '0,7 l', value: 7 },
      { name: 'kan', label: '1 l', value: 10 },
      { name: 'grotefles', label: '1,5 l', value: 15 },
    ];
    const big = pick(pool.filter(item => item.value >= 10));
    const items = [big, ...pool.filter(item => item.name !== big.name).sort(() => Math.random() - .5).slice(0, 5)];
    const order = [...items].sort(() => Math.random() - .5);
    if (!rememberExercise('gi4_decimal_contents', order.map(i => i.name))) return null;
    const card = document.createElement('div');
    card.className = 'gi4-decimal-contents-card row-delete-wrap';
    card.appendChild(rowDel(card));
    const row = document.createElement('div');
    row.className = 'gi4-decimal-contents-row';
    order.forEach((item, idx) => {
      const fig = document.createElement('div');
      fig.className = `gi4-decimal-container-icon ${item.name}`;
      fig.innerHTML = `<span>${item.label}</span><small>${idx + 1}</small>`;
      row.appendChild(fig);
    });
    const descending = Math.random() > .5;
    const sortedItems = [...order].sort((a, b) => descending ? b.value - a.value : a.value - b.value);
    const sorted = sortedItems.map(item => String(order.indexOf(item) + 1)).join(descending ? ' > ' : ' < ');
    const prompt = document.createElement('div');
    prompt.className = 'gi4-decimal-contents-prompt';
    prompt.textContent = descending ? 'Rangschik van groot naar klein.' : 'Rangschik van klein naar groot.';
    const answer = document.createElement('div');
    answer.className = 'gi4-decimal-contents-answer';
    const blanks = document.createElement('div');
    blanks.className = 'gi4-decimal-contents-order-line';
    order.forEach((_, idx) => {
      blanks.appendChild(Object.assign(document.createElement('span'), { className: 'gi4-decimal-contents-blank' }));
      if (idx < order.length - 1) blanks.appendChild(document.createTextNode(descending ? '>' : '<'));
    });
    answer.appendChild(blanks);
    answer.append(lineWithSolution(sorted, 'long'));
    card.append(prompt, row, answer);
    return card;
  }

  function makeDecimalOrderCard(mode){
    if (mode === 'missing') return makeDecimalMissingCard();
    if (mode === 'jumps') return makeDecimalJumpsCard();
    if (mode === 'greatest') return makeDecimalGreatestCard();
    if (mode === 'contents') return makeDecimalContentsCard();
    return makeDecimalCompareCard('plain');
  }

  function addDecimalOrder(extraCount, forcedMode){
    const mode = forcedMode || $('#decimalOrderMode')?.value || 'intro';
    if (mode === 'intro') {
      addDecimalOrderIntro();
      return;
    }
    const key = `gi4_decimal_order_${mode}`;
    const requested = Math.max(1, Math.min(8, parseInt($('#decimalOrderCount').value, 10) || 3));
    const count = extraCount || requested;
    if (extraCount) {
      const existing = containerInLastBlock(key, '.gi4-decimal-grid.order', 'gi4-decimal-grid order');
      if (existing) {
        for (let i = 0; i < count; i++) appendNewExercise(existing, () => makeDecimalOrderCard(mode));
        return;
      }
    }
    const titlesByMode = {
      missing: 'Kommagetallen: vul de getallenas aan.',
      jumps: 'Kommagetallen: tel verder of tel terug.',
      greatest: 'Kommagetallen: kleur de grootste waarde.',
      compare: 'Kommagetallen: vergelijk en orden.',
      contents: 'Kommagetallen: rangschik de inhouden.'
    };
    const b = block(key, titlesByMode[mode] || 'Kommagetallen ordenen.', addCount => addDecimalOrder(addCount || 1, mode));
    const instructionsByMode = {
      missing: ['Vul de ontbrekende kommagetallen aan.', 'Vul de ontbrekende breukdelen aan.'],
      jumps: ['Tel verder of tel terug.'],
      greatest: ['Kleur de grootste waarde in elke reeks van 3.'],
      compare: ['Vergelijk. Schrijf &lt;, &gt; of =.'],
      contents: ['Rangschik de inhouden.']
    };
    addFractionInstructions(b, instructionsByMode[mode] || ['Vul aan.']);
    const grid = document.createElement('div');
    grid.className = `gi4-decimal-grid order ${mode}`;
    for (let i = 0; i < count; i++) appendNewExercise(grid, () => makeDecimalOrderCard(mode));
    b.appendChild(grid);
    addLocalExerciseButton(b, '+ oefening bij deze keuze', () => addDecimalOrder(1, mode));
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

  function drawG5AxisConnectSolutionLines(){
    sheet.querySelectorAll('.gi4-g5-axis-order-row').forEach(row => {
      const axisLine = row.querySelector('.gi4-g5-axis-line');
      const cards = Array.from(row.querySelectorAll('.gi4-g5-axis-card[data-value]'));
      const start = parseInt(row.dataset.axisStart, 10);
      const range = parseInt(row.dataset.axisRange, 10);
      if (!axisLine || !cards.length || !Number.isFinite(start) || !Number.isFinite(range) || range <= 0) return;
      const svg = makeOverlay(row, 'gi4-axis-connect-solution-svg');
      const rowRect = row.getBoundingClientRect();
      const lineRect = axisLine.getBoundingClientRect();
      cards.forEach(card => {
        const value = parseInt(card.dataset.value, 10);
        if (!Number.isFinite(value)) return;
        const cardRect = card.getBoundingClientRect();
        const x1 = cardRect.left - rowRect.left + cardRect.width / 2;
        const y1 = cardRect.top - rowRect.top - 12;
        const x2 = lineRect.left - rowRect.left + ((value - start) / range) * lineRect.width;
        const y2 = lineRect.top - rowRect.top + 10;
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

  function drawDecimalHundredthsAxisConnectSolutionLines(){
    sheet.querySelectorAll('.gi4-decimal-hundred-axis-connect').forEach(row => {
      const axisLine = row.querySelector('.gi4-decimal-axis-connect-axis');
      const cards = Array.from(row.querySelectorAll('.gi4-decimal-axis-connect-card[data-value]'));
      if (!axisLine || !cards.length) return;
      const svg = makeOverlay(row, 'gi4-axis-connect-solution-svg');
      const rowRect = row.getBoundingClientRect();
      const lineRect = axisLine.getBoundingClientRect();
      cards.forEach(card => {
        const value = parseInt(card.dataset.value, 10);
        if (!Number.isFinite(value)) return;
        const dot = card.querySelector('.gi4-connect-dot.top') || card;
        const p1 = centerRelative(dot, row);
        const x2 = lineRect.left - rowRect.left + (value / 100) * lineRect.width;
        const y2 = lineRect.top - rowRect.top;
        svg.appendChild(svgSolutionLine(p1.x, p1.y, x2, y2));
        svg.appendChild(svgSolutionDot(x2, y2, 3.2));
      });
      row.appendChild(svg);
    });
  }

  function drawDecimalMixedAxisApproxSolutionLines(){
    sheet.querySelectorAll('.gi4-decimal-mixed-axis-approx').forEach(row => {
      const axisLine = row.querySelector('.gi4-decimal-mixed-axis-approx-axis');
      const cards = Array.from(row.querySelectorAll('.gi4-decimal-axis-connect-card[data-value]'));
      if (!axisLine || !cards.length) return;
      const svg = makeOverlay(row, 'gi4-axis-connect-solution-svg');
      const rowRect = row.getBoundingClientRect();
      const lineRect = axisLine.getBoundingClientRect();
      const start = parseInt(row.dataset.axisStart || '0', 10);
      const range = parseInt(row.dataset.axisRange || '100', 10);
      cards.forEach(card => {
        const value = parseInt(card.dataset.value, 10);
        if (!Number.isFinite(value)) return;
        const dot = card.querySelector('.gi4-connect-dot.top') || card;
        const p1 = centerRelative(dot, row);
        const ratio = Math.max(0, Math.min(1, (value - start) / range));
        const x2 = lineRect.left - rowRect.left + ratio * lineRect.width;
        const y2 = lineRect.top - rowRect.top + lineRect.height;
        svg.appendChild(svgSolutionLine(p1.x, p1.y, x2, y2));
        svg.appendChild(svgSolutionDot(x2, y2, 3.2));
      });
      row.appendChild(svg);
    });
  }

  function drawG5OperatorMatchSolutionLines(){
    sheet.querySelectorAll('.gi4-g5-operator-match-card').forEach(card => {
      const exercises = Array.from(card.querySelectorAll('.gi4-g5-operator-match-exercise[data-answer]'));
      const results = Array.from(card.querySelectorAll('.gi4-g5-operator-match-result[data-answer]'));
      if (!exercises.length || !results.length) return;
      const svg = makeOverlay(card, 'gi4-g5-operator-match-solution-svg');
      exercises.forEach(exercise => {
        const result = results.find(item => item.dataset.answer === exercise.dataset.answer);
        if (!result) return;
        const from = exercise.classList.contains('left')
          ? exercise.querySelector('.gi4-connect-dot.right')
          : exercise.querySelector('.gi4-connect-dot.left');
        const to = exercise.classList.contains('left')
          ? result.querySelector('.gi4-connect-dot.left')
          : result.querySelector('.gi4-connect-dot.right');
        if (!from || !to) return;
        const p1 = centerRelative(from, card);
        const p2 = centerRelative(to, card);
        svg.appendChild(svgSolutionLine(p1.x, p1.y, p2.x, p2.y));
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
    drawG5AxisConnectSolutionLines();
    drawMixedAxisConnectSolutionLines();
    drawDecimalHundredthsAxisConnectSolutionLines();
    drawDecimalMixedAxisApproxSolutionLines();
    drawG5OperatorMatchSolutionLines();
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

  function levelLabel(){
    if (levelState.level === 'grade5') return '5de leerjaar';
    if (levelState.level === 'grade6') return '6de leerjaar';
    if (levelState.level === 'custom') return 'Eigen keuze';
    return '4de leerjaar';
  }

  function updateLevelUi(){
    const range = activeRange();
    document.body.classList.toggle('gi4-range-100000', range === 100000);
    const badge = document.querySelector('.graad-badge');
    if (badge) badge.textContent = range === 100000 ? 'tot 100 000' : 'tot 10 000';

    const note = $('#gi4LevelNote');
    if (note) {
      const extra = levelState.level === 'grade6'
        ? 'De uitbreidingen met kommagetallen, breuken en procenten kunnen later verder groeien.'
        : levelState.level === 'custom'
          ? 'Eigen keuze: je kiest zelf of deze tool tot 10 000 of tot 100 000 werkt.'
          : '';
      note.textContent = `${levelLabel()}: getallen ${range === 100000 ? 'tot 100 000 met TD / D / H / T / E' : 'tot 10 000 met D / H / T / E'}.${extra ? ` ${extra}` : ''}`;
    }

    const splitNote = $('#splitRangeNote');
    if (splitNote) {
      splitNote.textContent = range === 100000
        ? 'Voorbeeld: 41 970 = 4 TD + 1 D + 9 H + 7 T + 0 E.'
        : 'Voorbeeld: 1 970 = 1 D + 9 H + 7 T + 0 E.';
    }

    const title = sheet?.querySelector('.sheetHeader h2');
    if (title && !title.dataset.userEdited) {
      title.textContent = range === 100000
        ? 'Extra oefenen op getalinzicht tot 100 000'
        : 'Extra oefenen op getalinzicht tot 10 000';
    }
    applyLevelVisibility();
  }

  function applyLevelVisibility(){
    const showAll = $('#gi4ShowAllLevels')?.checked;
    document.querySelectorAll('[data-levels]').forEach(el => {
      const levels = (el.dataset.levels || '').split(/\s+/).filter(Boolean);
      el.hidden = !showAll && !levels.includes(levelState.level);
    });
    const activeTab = document.querySelector('.sidebar-tab.active');
    if (activeTab?.hidden) {
      const firstVisible = document.querySelector('.sidebar-tab:not([hidden])');
      firstVisible?.click?.();
    }
  }

  function initLevelControls(){
    const level = $('#gi4Level');
    const range = $('#gi4Range');
    if (!level || !range) return;
    level.addEventListener('change', () => {
      levelState.level = level.value;
      updateLevelUi();
    });
    range.addEventListener('change', () => {
      levelState.range = range.value;
      updateLevelUi();
    });
    $('#gi4ShowAllLevels')?.addEventListener('change', updateLevelUi);
    const title = sheet?.querySelector('.sheetHeader h2');
    title?.addEventListener('input', () => { title.dataset.userEdited = '1'; });
    updateLevelUi();
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderSheetHeader();
    initLevelControls();
    attachSidebarButtons();
    bind('#btnAddSplit', addSplit);
    bind('#btnAddG5Material', addG5Material);
    bind('#btnAddG5ValueCards', addG5ValueCards);
    bind('#btnAddG5BuildNumbers', addG5BuildNumbers);
    bind('#btnAddG5NextThousand', addG5NextThousand);
    bind('#btnAddG5AxisOrder', addG5AxisOrder);
    bind('#btnAddG5Compare', addG5Compare);
    bind('#btnAddG5Order', addG5Order);
    bind('#btnAddG5Neighbors', addG5Neighbors);
    bind('#btnAddG5Jumps', addG5Jumps);
    bind('#btnAddG5Riddles', addG5Riddles);
    bind('#btnAddG5Equiv', addG5Equiv);
    bind('#btnAddG5FractionSimplify', addG5FractionSimplify);
    bind('#btnAddG5FractionEquivalent', addG5FractionEquivalent);
    bind('#btnAddG5FractionCommonCompare', addG5FractionCommonCompare);
    bind('#btnAddG5FractionCommonShort', addG5FractionCommonShort);
    bind('#btnAddG5FractionArrows', addG5FractionArrows);
    bind('#btnAddG5FractionShort', addG5FractionShort);
    bind('#btnAddG5FractionSeries', addG5FractionSeries);
    bind('#btnAddG5FractionColorTable', addG5FractionColorTable);
    bind('#btnAddG5FractionOperationColor', addG5FractionOperationColor);
    bind('#btnAddG5FractionOperator', addG5FractionOperator);
    bind('#btnAddG5GcdLcmInfo', addG5GcdLcmInfo);
    bind('#btnAddG5Divisibility', addG5Divisibility);
    bind('#btnAddG5Divisors', addG5Divisors);
    bind('#btnAddG5Gcd', addG5Gcd);
    bind('#btnAddG5Multiples', addG5Multiples);
    bind('#btnAddG5Lcm', addG5Lcm);
    bind('#btnAddG5GcdLcmMatch', addG5GcdLcmMatch);
    bind('#btnAddBuildNumbers', addBuildNumbers);
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
    bind('#btnAddShortValues', addShortValues);
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
    bind('#btnAddFractionQuantity', addFractionQuantity);
    bind('#btnAddFractionMixed', addFractionMixed);
    bind('#btnAddDecimalIntro', addDecimalIntro);
    bind('#btnAddDecimalTenthsIntro', addDecimalTenthsIntro);
    bind('#btnAddDecimalHundredths', addDecimalHundredths);
    bind('#btnAddDecimalHundredthsTable', addDecimalHundredthsTable);
    bind('#btnAddDecimalHundredthsConvert', addDecimalHundredthsConvert);
    bind('#btnAddDecimalHundredthsCompare', addDecimalHundredthsCompare);
    bind('#btnAddDecimalHundredthsAxisConnect', addDecimalHundredthsAxisConnect);
    bind('#btnAddDecimalHundredthsJumps', addDecimalHundredthsJumps);
    bind('#btnAddDecimalMixedHundredths', addDecimalMixedHundredths);
    bind('#btnAddDecimalMixed', addDecimalMixed);
    bind('#btnAddDecimalColor', addDecimalColor);
    bind('#btnAddDecimalTable', addDecimalTable);
    bind('#btnAddDecimalLine', addDecimalLine);
    bind('#btnAddDecimalCompare', addDecimalCompare);
    bind('#btnAddDecimalOrder', addDecimalOrder);
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
