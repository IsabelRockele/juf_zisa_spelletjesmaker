// @ts-nocheck
(function(){
  const $ = sel => document.querySelector(sel);
  const sheet = $('#sheet');
  const titles = new Set();
  const addFns = {};
  const PLACE = [
    { key: 'd', label: 'D', color: 'gi4-d', value: 1000 },
    { key: 'h', label: 'H', color: 'gi4-h', value: 100 },
    { key: 't', label: 'T', color: 'gi4-t', value: 10 },
    { key: 'e', label: 'E', color: 'gi4-e', value: 1 },
  ];

  function rnd(min, max){ return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(arr){ return arr[rnd(0, arr.length - 1)]; }
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
    while (set.size < count) set.add(randomNumber());
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
    sheet.insertBefore(h, sheet.firstChild);
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
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'title-add-btn';
    add.textContent = '+ oefening';
    add.addEventListener('click', () => addFns[key]?.(1));
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'title-delete-btn';
    del.innerHTML = '&times;';
    del.addEventListener('click', () => {
      document.querySelectorAll(`[data-title-key="${key}"]:not(.exercise-title)`).forEach(el => el.remove());
      row.remove();
      titles.delete(key);
    });
    inner.append(h, add, del);
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

  function rowDel(target){
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'row-delete-btn';
    btn.innerHTML = '&times;';
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const parent = target.parentElement;
      target.remove();
      if (parent && !parent.querySelector(':scope > *:not(.row-delete-btn)')) parent.remove();
    });
    return btn;
  }

  function block(key, title, addFn, blockTitle){
    ensureTitle(key, title, addFn);
    const b = document.createElement('div');
    b.className = 'gi4-block';
    b.dataset.titleKey = key;
    b.appendChild(delButton(b, key));
    if (blockTitle) {
      const t = document.createElement('div');
      t.className = 'gi4-block-title';
      t.textContent = blockTitle;
      b.appendChild(t);
    }
    placeBlock(b, key);
    return b;
  }

  function makeSplitRow(n, example){
    const ds = digits(n);
    const row = document.createElement('div');
    row.className = 'gi4-row row-delete-wrap';
    row.appendChild(rowDel(row));
    if (example) {
      row.innerHTML += `<strong>${fmt(n)}</strong> = ${ds.d} D + ${ds.h} H + ${ds.t} T + ${ds.e} E`;
    } else {
      row.innerHTML += `<strong>${fmt(n)}</strong> = <span class="gi4-line"></span> D + <span class="gi4-line"></span> H + <span class="gi4-line"></span> T + <span class="gi4-line"></span> E`;
    }
    return row;
  }

  function addSplit(extraCount){
    const key = 'gi4_split';
    const count = extraCount || Math.max(1, parseInt($('#splitCount').value, 10) || 6);
    const withExample = $('#splitExample')?.checked;
    const b = block(key, 'Splits de getallen in duizendtallen, honderdtallen, tientallen en eenheden.', addSplit);
    const grid = document.createElement('div');
    grid.className = 'gi4-grid';
    uniqueNumbers(count).forEach((n, i) => grid.appendChild(makeSplitRow(n, withExample && i === 0)));
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
      span.textContent = filled ? ds[part.key] : '';
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
      card.innerHTML += '<div class="gi4-row"><span class="gi4-line"></span> D <span class="gi4-line"></span> H <span class="gi4-line"></span> T <span class="gi4-line"></span> E</div><div>Dit is:</div>';
      card.appendChild(pencil(n, false));
      grid.appendChild(card);
    });
    b.appendChild(grid);
  }

  function makeConnectRow(n, answerNumber){
    const row = document.createElement('div');
    row.className = 'gi4-connect-row row-delete-wrap';
    row.dataset.number = String(n);
    row.appendChild(rowDel(row));

    const card = document.createElement('div');
    card.className = 'gi4-connect-card';
    card.appendChild(placeTable(n, 'blocks', { compact: true, connect: true }));

    const lineSpace = document.createElement('div');
    lineSpace.className = 'gi4-connect-space';
    const leftDot = document.createElement('span');
    leftDot.className = 'gi4-connect-dot';
    const rightDot = document.createElement('span');
    rightDot.className = 'gi4-connect-dot';
    lineSpace.append(leftDot, rightDot);

    const answer = document.createElement('div');
    answer.className = 'gi4-connect-answer';
    answer.append(pencil(answerNumber, true));

    row.append(card, lineSpace, answer);
    return row;
  }

  function renderConnectRows(wrap, nums){
    clearNode(wrap);
    const answers = derangedAnswers(nums);
    nums.forEach((n, i) => wrap.appendChild(makeConnectRow(n, answers[i])));
  }

  function addConnect(extraCount){
    const key = 'gi4_connect';
    if (extraCount) {
      const existing = lastBlock(key);
      const wrap = existing?.querySelector('.gi4-connect-list');
      if (wrap) {
        const nums = Array.from(wrap.querySelectorAll('.gi4-connect-row'))
          .map(row => parseInt(row.dataset.number, 10))
          .filter(Number.isFinite);
        let n = randomNumber();
        while (nums.includes(n)) n = randomNumber();
        nums.push(n);
        renderConnectRows(wrap, nums);
        return;
      }
    }
    const count = extraCount || Math.min(4, Math.max(3, parseInt($('#connectCount').value, 10) || 4));
    const nums = uniqueNumbers(count);
    const b = block(key, 'Verbind wat samen hoort.', addConnect);
    const wrap = document.createElement('div');
    wrap.className = 'gi4-connect-list';
    renderConnectRows(wrap, nums);
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
      const start = Math.floor(rnd(1000, 9000) / step) * step;
      const row = document.createElement('div');
      row.className = 'gi4-axis-row row-delete-wrap';
      row.appendChild(rowDel(row));
      row.innerHTML += '<div class="gi4-axis-line"></div>';
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
          row.appendChild(box);
        }
      }
      wrap.appendChild(row);
    }
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
      const start = rnd(1000, Math.max(1000, 9999 - step * 5));
      const visible = mode === 'discover'
        ? pick([[0, 1, 4], [0, 2, 3], [1, 2, 5], [2, 3, 5], [3, 4, 5], [0, 4, 5]])
        : [0, 1, 5];
      const row = document.createElement('div');
      row.className = 'gi4-jump-row row-delete-wrap';
      row.appendChild(rowDel(row));
      for (let i = 0; i < 6; i++) {
        const cell = document.createElement('div');
        cell.className = 'gi4-jump-cell';
        if (visible.includes(i)) cell.textContent = fmt(start + step * i);
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
      const a = randomNumber();
      const equal = Math.random() < .22;
      const delta = pick([1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]);
      const sign = Math.random() < .5 ? -1 : 1;
      let bNum = equal ? a : a + sign * delta;
      if (bNum < 1000 || bNum > 9999) bNum = a - sign * delta;
      if (bNum < 1000 || bNum > 9999) bNum = randomNumber();
      const row = document.createElement('div');
      row.className = `gi4-compare-row ${mode === 'value' ? 'value-mode' : 'number-mode'} row-delete-wrap`;
      row.appendChild(rowDel(row));
      const left = document.createElement('span');
      const right = document.createElement('span');
      if (mode === 'value') {
        const numberFirst = Math.random() < .5;
        left.textContent = numberFirst ? fmt(a) : valueExpr(a);
        right.textContent = numberFirst ? valueExpr(bNum) : fmt(bNum);
      } else {
        left.textContent = fmt(a);
        right.textContent = fmt(bNum);
      }
      row.append(left, Object.assign(document.createElement('span'), { className: 'gi4-symbol-box' }), right);
      grid.appendChild(row);
    }
    b.appendChild(grid);
  }

  function addOrder(extraCount){
    const key = 'gi4_order';
    const dir = $('#orderDirection').value;
    const count = extraCount || Math.max(1, parseInt($('#orderCount').value, 10) || 2);
    const title = dir === 'asc' ? 'Rangschik de getallen van klein naar groot.' : 'Rangschik de getallen van groot naar klein.';
    const b = block(key, title, addOrder);
    const grid = document.createElement('div');
    grid.className = 'gi4-order-grid';
    for (let i = 0; i < count; i++) {
      const nums = uniqueNumbers(5);
      const row = document.createElement('div');
      row.className = 'gi4-order-row row-delete-wrap';
      row.appendChild(rowDel(row));
      const source = document.createElement('div');
      source.className = 'gi4-order-source';
      source.textContent = nums.map(fmt).join(' - ');
      const answer = document.createElement('div');
      answer.className = 'gi4-order-answer';
      for (let j = 0; j < nums.length; j++) {
        answer.appendChild(Object.assign(document.createElement('span'), { className: 'gi4-line long' }));
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
    const example = $('#valueCardExample')?.checked;
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
        svg.appendChild(svgText(`${p.label} =`, 70, y + 5, {
          size: '18',
          weight: '700',
        }));
        svg.appendChild(svgLine(112, y, 172, y, '#d8dee8', 1.4));
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
    const rows = extraCount || Math.max(2, parseInt($('#equivRows').value, 10) || 4);
    const b = block(key, 'Kleur wat evenveel is in dezelfde kleur.', addEquiv);
    const nums = uniqueNumbers(rows);
    const table = document.createElement('table');
    table.className = 'gi4-equivalent-table';
    nums.forEach(n => {
      const tr = document.createElement('tr');
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

  document.addEventListener('DOMContentLoaded', () => {
    renderSheetHeader();
    bind('#btnAddSplit', addSplit);
    bind('#btnAddMaterial', addMaterial);
    bind('#btnAddConnect', addConnect);
    bind('#btnAddAxis', addAxis);
    bind('#btnAddJumps', addJumps);
    bind('#btnAddCompare', addCompare);
    bind('#btnAddOrder', addOrder);
    bind('#btnAddValueCards', addValueCards);
    bind('#btnAddEquiv', addEquiv);
    $('#btnClearSheet')?.addEventListener('click', () => {
      sheet.innerHTML = '';
      titles.clear();
      renderSheetHeader();
    });
  });
})();
