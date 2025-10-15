// @ts-nocheck
(function(){
  if (window.__WG_V101_BOUND__) return;
  window.__WG_V101_BOUND__ = true;

  const $  = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const sheet = $('#sheet');
  const previewSvg = $('#previewSvg');
  const NS = 'http://www.w3.org/2000/svg';
  function bindThrottled(el, fn, delay=350){
  if (!el) return;
  let lock = false;
  el.addEventListener('click', () => {
    if (lock) return;
    lock = true;
    try { fn(); } finally { setTimeout(()=>lock=false, delay); }
  });
}

  /* =====================  HULPJES  ===================== */
  function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }
// ===== 100-veld met pictogrammen (keuze 10) =====

// === 11. 100-veld – Puzzelstukken =========================================

// sjablonen (x = vakje van het puzzelstuk)
const HVP_TEMPLATES = {
  small: [
    ["xxx","..x","..x"],            // 5
    ["xxxx","x..."],                // 5
    ["xxx",".x.",".x."]            // 5
  ],
  medium: [
    ["xxxx","xx.."],                // 6
    ["xxx.",".xx.","..x."],         // 6
    ["xxxx",".xx."]                 // 6
  ],
  large: [
    ["xxxx","xxx."],                // 7
    ["xxx.","xxx.",".x.."],         // 7
    ["xxxxx",".xxx."]               // 8
  ]
};

// helpers
const hvpRand   = n   => Math.floor(Math.random() * n);
const hvpChoice = arr => arr[hvpRand(arr.length)];

// roteer/spiegel sjabloon
function hvpTransform(shape){
  let m = shape.map(r => r.split(''));
  const k = hvpRand(4);                         // 0–3 rotaties
  for (let r = 0; r < k; r++){
    const R = m[0].length, C = m.length;
    const rot = Array.from({length:R}, () => Array(C).fill('.'));
    for (let i=0;i<C;i++) for (let j=0;j<R;j++) rot[j][C-1-i] = m[i][j];
    m = rot;
  }
  if (Math.random() < .5) m = m.map(row => row.slice().reverse()); // 50% flip
  return m.map(r => r.join(''));
}

// cellenlijst opbouwen
function hvpBuildPieceRowsCols(transformed){
  const rows = transformed.length;
  const cols = transformed[0].length;
  const cells = [];
  for (let r=0;r<rows;r++){
    for (let c=0;c<cols;c++){
      if (transformed[r][c] === 'x') cells.push([r,c]);
    }
  }
  return {rows, cols, cells};
}

// één puzzelkaart maken
// één puzzelkaart maken — respecteert exact het gekozen # gegeven getallen
// Toon exact 'revealExact' gegeven cijfers; de rest blanco
function createHvPuzzleCard(revealExact, sizeKey){
  const shape = hvpChoice(HVP_TEMPLATES[sizeKey]);
  const sh = hvpTransform(shape);
  const {rows, cols, cells} = hvpBuildPieceRowsCols(sh);

  // anker binnen 10x10
  const r0 = hvpRand(10 - rows + 1);
  const c0 = hvpRand(10 - cols + 1);

  // getallen van het 100-veld
  const numbers = cells.map(([dr,dc]) => r0*10 + c0 + 1 + dr*10 + dc);

  // exact aantal zichtbare vakjes (= gegeven cijfers)
const total  = numbers.length;
const reveal = Math.max(1, Math.min(Number.isFinite(revealExact) ? revealExact : 3, total - 1));

// Kies exact 'reveal' indices via shuffle (robuust tegen “dubbele picks”)
const allIdx = Array.from({length: total}, (_, i) => i);
for (let i = allIdx.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [allIdx[i], allIdx[j]] = [allIdx[j], allIdx[i]];
}
const revealIdx = new Set(allIdx.slice(0, reveal));

// DOM
const card = document.createElement('div');
card.className = 'hvp-card row-delete-wrap';
card.appendChild(createRowDeleteButton(card));
card.dataset.reveal = String(reveal);
card.dataset.total  = String(total);

const piece = document.createElement('div');
piece.className = 'hvp-piece';
piece.style.gridTemplateColumns = `repeat(${cols}, 34px)`;
piece.style.gridAutoRows = '34px';

// (vul de cellen zoals u al deed…)

  for (let r=0;r<rows;r++){
    for (let c=0;c<cols;c++){
      if (sh[r][c] !== 'x'){
        const hole = document.createElement('div');
        hole.style.width = '34px'; hole.style.height = '34px';
        piece.appendChild(hole);
        continue;
      }
      const idx = cells.findIndex(([rr,cc]) => rr===r && cc===c);
      const n   = numbers[idx];

      const cell = document.createElement('div');
      const isGiven = revealIdx.has(idx);
      cell.className   = 'hvp-cell ' + (isGiven ? 'given' : 'blank');
      cell.textContent = isGiven ? n : '';
      piece.appendChild(cell);
    }
  }

  card.appendChild(piece);
  return card;
}

// max #vakjes voor gekozen grootte
function hvpMaxCellsForSize(sizeKey){
  const shapes = HVP_TEMPLATES[sizeKey] || [];
  return Math.max(1, ...shapes.map(s => s.join('').split('').filter(ch => ch === 'x').length));
}

// generator
function addHvPuzzleExercises(){
  const nCards  = parseInt(document.getElementById('hvpCount').value, 10) || 4;
  const sizeKey = (document.getElementById('hvpSize').value || 'medium');

  // Zorg dat #hvpGiven altijd een geldig getal is binnen 1..(max - 1)
const field = document.getElementById('hvpGiven');
const maxAllowed = Math.max(1, hvpMaxCellsForSize(sizeKey) - 1);
if (field) {
  field.setAttribute('type','number');
  field.setAttribute('min','1');
  field.setAttribute('max', String(maxAllowed));
}

  // UI-waarde begrenzen: min 1, max (vakjes-1)
  const rawGiven = parseInt(document.getElementById('hvpGiven').value, 10);
  const maxGiven = Math.max(1, hvpMaxCellsForSize(sizeKey) - 1);
  const given    = Math.max(1, Math.min(Number.isFinite(rawGiven) ? rawGiven : 3, maxGiven));
  document.getElementById('hvpGiven').value = String(given);  // toon effectieve waarde

  const key = 'hvpuzzle';
  ensureTitleOnce(sheet, key, 'Vul de ontbrekende getallen in.');

  const block = document.createElement('div');
  block.className = 'hvp-block';
  block.dataset.titleKey = key;
  block.appendChild(createDeleteButton(block));

  const grid = document.createElement('div');
  grid.className = 'hvp-grid';

  for (let i=0; i<nCards; i++){
    grid.appendChild(createHvPuzzleCard(given, sizeKey));
  }

  // eerste rij (3 kaarten) aan de titel vast
  const head = document.createElement('div');
  head.className = 'hvp-first keep-with-title';
  head.style.display = 'grid';
  head.style.gridTemplateColumns = 'repeat(3, minmax(0,1fr))';
  head.style.gap = getComputedStyle(grid).gap || '18px';
  for (let i=0; i<3 && grid.firstChild; i++) head.appendChild(grid.firstChild);

  block.appendChild(head);
  block.appendChild(grid);
  placeAfterLastOfKey(block, key);
}

// knop
(function(){
  const btn = document.getElementById('btnAddHvPuzzle');
  if (btn) btn.addEventListener('click', addHvPuzzleExercises);
})();

function buildHundredGrid(){
  // maakt een DOM-100-veld (10x10) met nummers 1..100 en returnt {wrap, grid}
  const wrap = document.createElement('div');
  wrap.className = 'hvicons-board';

  const grid = document.createElement('div');
  grid.className = 'honderdveld-grid';    // gebruikt uw bestaande cell-stijl

  for (let n = 1; n <= 100; n++){
    const cell = document.createElement('div');
    cell.className = 'honderdveld-cell';
    cell.textContent = n;
    cell.dataset.n = n;
    grid.appendChild(cell);
  }
  wrap.appendChild(grid);
  return { wrap, grid };
}

function iconPool(theme){
  if (theme === 'letters'){
    return ['A','B','C','D','E','F','G','H'];
  }

  if (theme === 'vrij'){
    // vrije pictogrammen
    return ['😊','❤️','☁️','⭐','🌈','🌻','🎈','🎵'];
  }

  // default: herfst-emoji’s (veilig, geen assets nodig)
  return ['🍁','🍄','🐿️','🦔','🌰','🎃','🍂','👨‍🌾'];
}


// Zet pictogrammen ín de juiste cellen (geen absolute positie meer)
function placeIcons(boardEl, count, theme, showNumbers){
  const icons = iconPool(theme).slice(0, Math.max(2, Math.min(count, 8)));
  const grid  = boardEl.querySelector('.honderdveld-grid');
  const chosen = new Set();
  const used = [];

  // Eerst: vul (of wis) de nummers in alle cellen
  Array.from(grid.children).forEach((cell, idx) => {
    cell.classList.remove('no-number');
    cell.textContent = showNumbers ? (idx+1) : '';  // overige getallen tonen of niet
  });

  // Daarna: zet pictogrammen in enkele cellen
  while (used.length < icons.length){
    const pos = 1 + Math.floor(Math.random() * 100);   // 1..100
    if (chosen.has(pos)) continue;
    chosen.add(pos);

    const cell = grid.children[pos-1];
    if (!cell) continue;

    // In pictogram-cellen verbergen we het getal
    cell.classList.add('no-number');
    cell.textContent = '';

    const span = document.createElement('span');
    span.className = 'hv-icon-in-cell';
    span.textContent = icons[used.length];
    cell.appendChild(span);

    used.push({ icon: icons[used.length], n: pos });
  }
  return used; // voor de legenda
}

function buildLegend(items){
  const legend = document.createElement('div');
  legend.className = 'hvicons-legend';

  items.forEach(({icon}) => {
    const row = document.createElement('div');
    row.className = 'hvicons-legend-item';

    const ico = document.createElement('div');
    ico.className = 'hvicons-legend-icon';
    ico.textContent = icon;

    const input = document.createElement('input'); // leerling schrijft getal
    row.append(ico, input);
    legend.appendChild(row);
  });
  return legend;
}

function addHvIconsExercises(){
  const nCards   = parseInt(document.getElementById('hvIconsCount').value, 10) || 2;
  const perCard  = parseInt(document.getElementById('hvIconsPerCard').value, 10) || 6;
  const theme    = document.getElementById('hvIconsTheme').value || 'herfst';
  const showNumbers = !!document.getElementById('hvIconsShowNumbers')?.checked;   // ← NIEUW

  const key = 'hvicons';
  ensureTitleOnce(sheet, key, 'Schrijf de getallen op bij elk pictogram.');

 const block = document.createElement('div');
block.className = 'hvicons-block';                 // niet alles samen vastzetten

block.dataset.titleKey = key;
block.appendChild(createDeleteButton(block));

  const grid = document.createElement('div');
  grid.className = 'hvicons-grid';

  for (let i = 0; i < nCards; i++){
    const card = document.createElement('div');
    card.className = 'hvicons-card row-delete-wrap';
    card.appendChild(createRowDeleteButton(card));

    // 100-veld
    const { wrap } = buildHundredGrid();
    card.appendChild(wrap);

    // pictogrammen plaatsen (na append zodat posities kloppen)
    const items = placeIcons(wrap, perCard, theme, showNumbers);  

    // legenda met invulvakjes
    card.appendChild(buildLegend(items));

    grid.appendChild(card);
  }

  // eerste rij (1 kaart) bij de titel houden
const head = document.createElement('div');
head.className = 'hvicons-first keep-with-title';
head.style.display = 'grid';
head.style.gridTemplateColumns = '1fr';            // 1 kaart per rij
head.style.gap = getComputedStyle(grid).gap || '20px';
for (let i=0; i<1 && grid.firstChild; i++) head.appendChild(grid.firstChild);


  block.appendChild(head);
  block.appendChild(grid);
  placeAfterLastOfKey(block, key);
}

// knop
(function(){
  const btn = document.getElementById('btnAddHvIcons');
  if (btn) btn.addEventListener('click', addHvIconsExercises);
})();

// --- Getalbeelden tot 1000 ---
// Bouw het visuele H/T/E-beeld in één vlak (zoals in de voorbeelden)
// vervanging: compacte honderdvelden-weergave
function createGetalbeeld1000Visual(num){
  const h = Math.floor(num / 100);       // volle honderden
  const rest = num % 100;                // remainder 0..99
  const tens = Math.floor(rest / 10);
  const ones = rest % 10;

  const wrap = document.createElement('div');
  wrap.className = 'gb1000-visual';      // gebruikt het NIEUWE CSS-blok

  // 1) Volle honderdvakken, volledig blauw
  for (let i = 0; i < h; i++) {
    wrap.appendChild(createHundredSquareSVG(false));
  }

  // 2) Eén resterend honderdveld met groene tientallen + gele eenheden
  if (rest > 0) {
    const hv = document.createElement('div');
    hv.className = 'gb1000-hvwrap';

    const grid = document.createElement('div');
    grid.className = 'honderdveld-grid';

    for (let j = 1; j <= 100; j++) {
      const cell = document.createElement('div');
      cell.className = 'honderdveld-cell';
      if (j <= tens * 10) cell.classList.add('filled-ten');
      else if (j <= rest) cell.classList.add('filled-unit');
      grid.appendChild(cell);
    }
    hv.appendChild(grid);
    wrap.appendChild(hv);
  }

  return wrap;
}

function addGetalbeelden1000(){
  const count = parseInt(document.getElementById('gb1000Count').value, 10) || 4;
  const key   = 'gb1000';
  ensureTitleOnce(sheet, key, 'Hoeveel tel je? Vul in.');

  const block = document.createElement('div');
  block.className = 'gb1000-exercise-block';
  block.dataset.titleKey = key;
  block.appendChild(createDeleteButton(block));

  const grid = document.createElement('div');
  grid.className = 'gb1000-grid';

  for(let i=0;i<count;i++){
    const num  = Math.floor(Math.random()*999) + 1; // 1..999 (visueel netjes)
    const card = document.createElement('div');
    card.className = 'gb1000-card row-delete-wrap';
    card.appendChild(createRowDeleteButton(card));

    card.appendChild(createGetalbeeld1000Visual(num));

// invulschema zoals honderdveld, met H/T/E + totaal
const task = document.createElement('div');
task.className = 'honderdveld-task';

const table = document.createElement('table');
table.className = 'honderdveld-te-table';
table.innerHTML = `
  <tr>
    <td class="te-label t">T</td>
    <td class="te-label e">E</td>
  </tr>
  <tr>
    <td><input type="text"></td>
    <td><input type="text"></td>
  </tr>`;


const numBox = document.createElement('input');
numBox.type = 'text';
numBox.className = 'honderdveld-num-box';

task.append(table, numBox);
card.appendChild(task);

    grid.appendChild(card);
  }

  // Eerste rij (2 kaarten) bij de titel houden
  const head = document.createElement('div');
  head.className = 'gb1000-first keep-with-title';
  head.style.display = 'grid';
  head.style.gridTemplateColumns = 'repeat(2, minmax(0,1fr))';
  head.style.gap = getComputedStyle(grid).gap || '16px';
  for(let i=0;i<2 && grid.firstChild;i++){ head.appendChild(grid.firstChild); }

  block.appendChild(head);
  block.appendChild(grid);
  placeAfterLastOfKey(block, key);
}

// knop activeren
(function(){
  const btn = document.getElementById('btnAddGB1000');
  if(!btn) return;
  btn.addEventListener('click', addGetalbeelden1000);
})();


  function _mkArrowMarker(defs, color='#333'){
    const m=document.createElementNS(NS,'marker');
    m.setAttribute('id','pvArrowDyn');
    m.setAttribute('viewBox','0 0 8 8');
    m.setAttribute('refX','7'); m.setAttribute('refY','4');
    m.setAttribute('markerWidth','6'); m.setAttribute('markerHeight','6');
    m.setAttribute('orient','auto-start-reverse');
    const tip=document.createElementNS(NS,'path');
    tip.setAttribute('d','M0 0 L8 4 L0 8 Z');
    tip.setAttribute('fill',color);
    m.appendChild(tip); defs.appendChild(m);
  }
  function _drawElbow(svg, x0, y0, yMid, xEnd){
    const p=document.createElementNS(NS,'path');
    p.setAttribute('d',`M ${x0} ${y0} V ${yMid} H ${xEnd}`);
    p.setAttribute('fill','none'); p.setAttribute('stroke','#333'); p.setAttribute('stroke-width','1.6');
    p.setAttribute('marker-end','url(#pvArrowDyn)');
    svg.appendChild(p);
    return p;
  }

  const PAD_L = 40, PAD_R = 30;
  let addedTitles = new Set();

  function ensureTitleOnce(container, key, text){
    if (!addedTitles.has(key)) {
      const row = document.createElement('div');
      row.className = 'title-row';
      const h = document.createElement('h4');
      h.className = 'exercise-title';
      h.dataset.titleKey = key;
      h.textContent = text;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'title-delete-btn';
      btn.innerHTML = '&times;';
      btn.addEventListener('click', () => {
        document.querySelectorAll(`[data-title-key="${key}"]:not(.exercise-title)`).forEach(el => el.remove());
        document.querySelectorAll('.honderdveld-row').forEach(r => { if (!r.children.length) r.remove(); });
        row.remove();
        addedTitles.delete(key);
      });

      row.appendChild(h);
      row.appendChild(btn);
      container.appendChild(row);
      addedTitles.add(key);
    }
  }

  // Bevries de renderbreedte van een blok en bijbehorend SVG
function freezeBlockWidth(block, svg){
  const w = Math.round(svg.getBoundingClientRect().width || block.getBoundingClientRect().width);
  block.style.width = w + 'px';
  svg.style.width = w + 'px';
  svg.style.maxWidth = 'none';
}

  // Zet een nieuw blok direct na de laatste oefening met dezelfde titleKey.
// Bestaat er nog geen? Plaats het blok dan direct na de titelrij (of anders onderaan).
function placeAfterLastOfKey(el, key){
  const list = sheet.querySelectorAll(`[data-title-key="${key}"]:not(.exercise-title)`);
  if (list.length) { list[list.length - 1].after(el); return; }

  const titleRow = document.querySelector(`.title-row .exercise-title[data-title-key="${key}"]`)?.parentElement;
  if (titleRow) { titleRow.after(el); return; }

  sheet.appendChild(el);
}

  const createDeleteButton = (target) => {
    const btn = document.createElement('button');
    btn.className = 'delete-btn'; btn.innerHTML = '&times;'; btn.type='button';
    btn.addEventListener('click', () => {
      const titleKey = target.dataset.titleKey;
      const parent = target.parentElement;
      target.remove();
      const remainingBlock = document.querySelector(`[data-title-key="${titleKey}"]:not(.exercise-title)`);
      if (!remainingBlock) {
        const titleRow = document.querySelector(`.title-row .exercise-title[data-title-key="${titleKey}"]`)?.parentElement;
        if (titleRow) titleRow.remove();
        addedTitles.delete(titleKey);
      }
      if (parent?.classList?.contains('honderdveld-row') && parent.children.length === 0) parent.remove();
    }, {once:true});
    return btn;
  };
  const group = p => { const g=document.createElementNS(NS,'g'); p.appendChild(g); return g; };
  const line  = (p,x1,y1,x2,y2,str,w) => { const l=document.createElementNS(NS,'line'); l.setAttribute('x1',x1); l.setAttribute('y1',y1); l.setAttribute('x2',x2); l.setAttribute('y2',y2); l.setAttribute('stroke',str||'#6b879a'); l.setAttribute('stroke-width',w||'2'); p.appendChild(l); return l; };
  const label = (p,x,y,txt) => { const g=group(p); const r=document.createElementNS(NS,'rect'); r.setAttribute('x',x-16); r.setAttribute('y',y-24); r.setAttribute('width',32); r.setAttribute('height',22); r.setAttribute('fill','#fff'); r.setAttribute('stroke','#6b879a'); r.setAttribute('stroke-width','2'); r.setAttribute('rx',6); g.appendChild(r); const t=document.createElementNS(NS,'text'); t.setAttribute('x',x); t.setAttribute('y',y-8); t.setAttribute('text-anchor','middle'); t.setAttribute('font-size','13'); t.setAttribute('font-weight','700'); t.textContent=String(txt); g.appendChild(t); };
// Per-rij delete
// Per-rij delete (robuust)
function createRowDeleteButton(target){
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'row-delete-btn';
  btn.textContent = '×';

  btn.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();

    // Verwijder de rij/kaart zelf
    const parentBefore = target.parentElement;
    const titleKey = target.dataset.titleKey; // meestal niet gezet op rij, wel op blok

    target.remove();

    // Als de container leeg is, ruim ze op (werkt voor zowel head als grid)
    const p = parentBefore;
    if (p && p.children && p.children.length === 0) {
      p.remove();
    }

    // Als er helemaal geen blokken meer zijn met dit titleKey, verwijder de titel
    if (titleKey){
      const remaining = document.querySelector(`[data-title-key="${titleKey}"]:not(.exercise-title)`);
      if (!remaining){
        const titleRow = document.querySelector(`.title-row .exercise-title[data-title-key="${titleKey}"]`)?.parentElement;
        if (titleRow) titleRow.remove();
      }
    }
  });

  return btn;
}

  /* =====================  GETALLENLIJN  ===================== */
  function getRulerOpts() {
    return {
      start: parseInt($('#start').value,10), end: parseInt($('#end').value,10), unit: Math.max(1, parseInt($('#unit').value,10)),
      showZero: $('#showZero').checked, showEnds: $('#showEnds').checked, showTens: $('#showTens').checked,
      showFives: $('#showFives').checked, showOnes: $('#showOnes').checked, majorStep: parseInt($('#majorStep').value,10),
      mode: $$('input[name=mode]:checked')[0].value,
      dragValues: $('#dragList').value.split(/[ ,;]+/).map(s=>s.trim()).filter(Boolean).map(s=>parseInt(s,10)).filter(Number.isFinite),
      blankCount: parseInt($('#blankCount').value,10)
    };
  }
  const wantLabel = (val, o) => o.showOnes || (o.showTens&&val%10===0) || (o.showFives&&val%5===0) || (o.showZero&&val===0) || (o.showEnds&&(val===o.start||val===o.end));

  function drawRuler(svgEl, o) {
    const width = svgEl.clientWidth || 1400;
    const height = 220;
    svgEl.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svgEl.innerHTML = '';
    const baseY = Math.round(height * 0.44);
    const padL = PAD_L, padR = PAD_R;
    const units=o.end-o.start; if(units<=0) return {ticks:[],baseY,g:null,width,height};
    const rawTicksCount = Math.floor(units / o.unit) + 1;
    let sampleStep = 1;
    const MAX_TICKS = 400;
    if (rawTicksCount > MAX_TICKS) sampleStep = Math.ceil(rawTicksCount / MAX_TICKS);
    const pxPerUnit=(width-padL-padR)/units;
    const g=group(svgEl);
    const defs = document.createElementNS(NS,'defs');
    const marker = document.createElementNS(NS,'marker');
    marker.setAttribute('id','arrowhead'); marker.setAttribute('markerWidth','8'); marker.setAttribute('markerHeight','8'); marker.setAttribute('refX','4'); marker.setAttribute('refY','4'); marker.setAttribute('orient','auto');
    const tip = document.createElementNS(NS,'path'); tip.setAttribute('d','M0,0 L8,4 L0,8 Z'); tip.setAttribute('fill','#1e88e5'); marker.appendChild(tip); defs.appendChild(marker); g.appendChild(defs);
    line(g,padL,baseY,width-padR+5,baseY);
    const ticks=[];
    for(let stepIndex=0, v=o.start; v<=o.end; stepIndex++, v = o.start + stepIndex * (o.unit * sampleStep)){
      if (v > o.end) break;
      const x = padL + (v - o.start) * pxPerUnit;
      const isMajor = (v % o.majorStep === 0);
      const h = isMajor ? 18 : ( (v % 5 === 0) ? 12 : 9 );
      line(g, x, baseY, x, baseY - h);
      ticks.push({v,x,isMajor});
    }
    ticks.forEach(t=>{
      if (sampleStep > 1) {
        if (t.v === o.start || t.v === o.end || t.isMajor || wantLabel(t.v,o)) label(g,t.x,baseY-(t.isMajor?24:18),t.v);
      } else {
        if (wantLabel(t.v,o)) label(g,t.x,baseY-(t.isMajor?24:18),t.v);
      }
    });
    return {ticks, baseY, g, width, height};
  }

  function renderPreview(){ const o=getRulerOpts(); if(o.end<=o.start) return; drawRuler(previewSvg, o); }

  function addExerciseToSheet(){
    const o=getRulerOpts(); if(o.end<=o.start){alert('Tot en met moet groter zijn dan Van.');return;}
    let titleKey=null, titleText=null;
    if (o.mode==='drag'){ titleKey='ruler_drag'; titleText='Verbind de getallen met de getallenlijn.'; }
    if (o.mode==='blanks'){ titleKey='ruler_blanks'; titleText='Vul de ontbrekende getallen in.'; }
    if (titleKey) ensureTitleOnce(sheet, titleKey, titleText);

    const ex=document.createElement('div'); ex.className='exercise';
    if(titleKey) ex.dataset.titleKey = titleKey;
    ex.appendChild(createDeleteButton(ex));
    if(o.mode==='drag') ex.classList.add('drag'); if(o.mode==='blanks') ex.classList.add('blanks');
    const svg=document.createElementNS(NS,'svg'); ex.appendChild(svg); if (titleKey) placeAfterLastOfKey(ex, titleKey); else sheet.appendChild(ex);
    const {ticks, baseY, g}=drawRuler(svg, o);

    // Bevries eerst de breedte, dán pas overlays plaatsen
requestAnimationFrame(() => {
  freezeBlockWidth(ex, svg);

  if (o.mode==='drag') {
    let values = (o.dragValues && o.dragValues.length)
      ? o.dragValues.filter(Number.isFinite)
      : [];
    if (!values.length) values = ticks.filter(t=>t.isMajor).map(t=>t.v).slice(0,6);

    const cardWidth=52, gap=14, n=values.length;
    const totalWidth = n*cardWidth+(n-1)*gap;
    const svgRect = svg.getBoundingClientRect(), exRect  = ex.getBoundingClientRect();
    const rulerLeft  = (svgRect.left - exRect.left) + PAD_L;
    const innerWidth = svgRect.width - PAD_L - PAD_R;
    const startX = Math.round(rulerLeft + (innerWidth - totalWidth)/2);
    const DRAW_GAP = 80;
    const topPos = Math.round((svgRect.top - exRect.top) + baseY + DRAW_GAP);

    values.forEach((val,i)=>{
      const c=document.createElement('div'); c.className='card'; c.textContent=val;
      c.style.position='absolute';
      c.style.left = (startX + i*(cardWidth+gap)) + 'px';
      c.style.top  = topPos + 'px';
      ex.appendChild(c);
    });
  }

  if (o.mode==='blanks'){
    const all = ticks.filter(t=>!wantLabel(t.v,o)).sort(()=>Math.random()-0.5);
    const minGap = 36, picked = [];
    for(const t of all){ if(picked.length>=o.blankCount) break; if(picked.every(p=>Math.abs(p.x-t.x)>=minGap)) picked.push(t); }
    picked.sort((a,b)=>a.x-b.x);

    let above=true; const bw=46,bh=34, offA=40, offB=32, margin=10;
    const svgRect=svg.getBoundingClientRect(), exRect=ex.getBoundingClientRect();

    picked.forEach(t=>{
      const xC=t.x, x=(svgRect.left - exRect.left) + (xC-bw/2); let y;
      const conn=line(g,xC,baseY,xC,0,'#1e88e5','1.6');

      if(above){ y=baseY-(offA+12)-bh; if(y<margin) y=margin; conn.setAttribute('y2',Math.min(y+bh+2,svg.height.baseVal.value-margin)); }
      else     { y=baseY+(offB+14);    if(y+bh>svg.height.baseVal.value-margin) y=svg.height.baseVal.value-margin-bh; conn.setAttribute('y2',Math.max(y-2,margin)); }
      conn.setAttribute('marker-end','url(#arrowhead)');

      const rect=document.createElementNS(NS,'rect');
      rect.setAttribute('x',xC-bw/2); rect.setAttribute('y',y);
      rect.setAttribute('width',bw); rect.setAttribute('height',bh);
      rect.setAttribute('rx',9); rect.setAttribute('fill','#fff');
      rect.setAttribute('stroke','#c9d6ea'); rect.setAttribute('stroke-width','2');
      g.appendChild(rect);

      const htmlBox=document.createElement('input');
      htmlBox.type='text'; htmlBox.className='print-overlay-input';
      htmlBox.style.left= (x) +'px';
      htmlBox.style.top = ((svgRect.top - exRect.top) + y) + 'px';
      htmlBox.style.width=bw+'px'; htmlBox.style.height=bh+'px';
      htmlBox.style.textAlign='center'; htmlBox.style.fontWeight='700'; htmlBox.style.font='inherit';
      ex.appendChild(htmlBox);

      above=!above;
    });
  }
});

}  // ← NIEUW: sluit function addExerciseToSheet()

  /* =====================  SPRONGEN  ===================== */
  function drawJumpArcsInline(row, labels){
  // Tekent kleine bogen tussen opeenvolgende hokjes met het label (+…)
  // Vereist: row bevat de hokjes (divs) voor de sprongen.

  if (!row) return;

 // Neem expliciet het startvak én de invulvakjes
let items = Array.from(row.querySelectorAll('.jump-start, .jump-given, .jump-box'));
if (items.length < 2) return;

  // 2) Maak ruimte en verwijder oude overlay
  row.style.position = row.style.position || 'relative';
  const old = row.querySelector('.jump-arcs-svg');
  if (old) old.remove();

  // 3) Bepaal de X-centers van elk hokje
  const rowRect = row.getBoundingClientRect();
  const centers = items.map(el => {
    const r = el.getBoundingClientRect();
    return (r.left - rowRect.left) + r.width / 2;
  });

  // 4) Bouw de SVG-overlay (kleine bogen + labels)
  const NS = 'http://www.w3.org/2000/svg';
  const svgH = 44; // hoogte voor de bogen + labels
  const svg  = document.createElementNS(NS, 'svg');
  svg.setAttribute('class','jump-arcs-svg');
  svg.setAttribute('width', Math.ceil(row.clientWidth));
  svg.setAttribute('height', svgH);
  svg.style.position = 'absolute';
  svg.style.left = '0';
  svg.style.top  =  '0px';   // boven de hokjes
  svg.style.overflow = 'visible';
  svg.style.pointerEvents = 'none';

  const makePath = (x1, x2) => {
    // Kleine, lage boog tussen x1 en x2
    const h = svgH - 6;         // onderlijn van de boog
    const yCtrl = 12;       // hoogte van de boog (klein!)
    const p = document.createElementNS(NS,'path');
    p.setAttribute('d', `M ${x1},${h} C ${x1},${yCtrl} ${x2},${yCtrl} ${x2},${h}`);
    p.setAttribute('class','jump-path');
    return p;
  };

  const makeLabel = (xMid, txt) => {
    const t = document.createElementNS(NS,'text');
    t.setAttribute('x', xMid);
t.setAttribute('y', -2);                 // POSITIEF (binnen de viewbox)
t.removeAttribute('dy');                // GEEN negatieve dy
t.setAttribute('text-anchor','middle');
t.setAttribute('dominant-baseline','text-before-edge'); // stabieler in PDF
    t.setAttribute('class','jump-label');
    t.textContent = txt;
    return t;
  };

  // 5) Teken per sprong een boog + label (labels.length = aantal sprongen)
  const n = Math.min(labels.length, centers.length - 1);
  for (let i = 0; i < n; i++){
    const x1 = centers[i];
    const x2 = centers[i+1];
    const xMid = (x1 + x2) / 2;

    svg.appendChild(makePath(x1, x2));
    svg.appendChild(makeLabel(xMid, labels[i])); // bv. "+10"
  }

  row.appendChild(svg);
}

  function addJumpExercise() {
    const start=parseInt($('#jumpStart').value,10);
    const step=parseInt($('#jumpStep').value,10);
    const count=Math.max(1, parseInt($('#jumpCount').value,10));
    const discover=$('#jumpDiscover').checked;
    const key = discover ? 'jump_discover' : 'jump_fixed';
    ensureTitleOnce(sheet, key, discover?'Welke sprong wordt er gemaakt? Vul de rij verder aan.':'Tel met sprongen.');
    const block=document.createElement('div'); block.className='jump-exercise-block'; block.appendChild(createDeleteButton(block)); block.dataset.titleKey = key;
    if (discover) {
      const p=document.createElement('div'); p.className='discover-jump-prompt';
      p.innerHTML='De sprong is + <input type="text" class="jump-box" style="width:46px;height:34px;display:inline-block;vertical-align:middle;">';
      block.appendChild(p);
    }
    const ex=document.createElement('div'); ex.className='jump-exercise';
    const row = document.createElement('div');
row.className = 'jump-row row-delete-wrap';
row.appendChild(createRowDeleteButton(row));
    const seq=Array.from({length:count},(_,i)=>start+i*step);
    if (discover) {
      const givenPosText=($('#jumpGivenPositions').value||'').trim();
      const includeStart=$('#jumpIncludeStart').checked;
      const includeEnd=$('#jumpIncludeEnd').checked;
      const wantCount=Math.max(0, parseInt($('#jumpGivenCount').value,10)||0);
      let indices=new Set();
      if (givenPosText.length){
        givenPosText.split(/[ ,;]+/).forEach(s=>{ const k=parseInt(s,10); if(Number.isFinite(k)&&k>=1&&k<=count) indices.add(k-1); });
      } else {
        while(indices.size<Math.min(wantCount,count)){ indices.add(Math.floor(Math.random()*count)); }
      }
      if (includeStart) indices.add(0);
      if (includeEnd)   indices.add(count-1);
      const startEl=document.createElement('div'); startEl.className='jump-start'; startEl.textContent=seq[0]; row.appendChild(startEl);
      for(let i=1;i<count;i++){
        if (indices.has(i)){ const g=document.createElement('div'); g.className='jump-given'; g.textContent=seq[i]; row.appendChild(g); }
        else { const b=document.createElement('input'); b.className='jump-box'; row.appendChild(b); }
      }
      ex.appendChild(row); block.appendChild(ex);
    } else {
      const startEl=document.createElement('div'); startEl.className='jump-start'; startEl.textContent=start; row.appendChild(startEl);
      for(let i=0;i<count-1;i++){ const box=document.createElement('input'); box.className='jump-box'; row.appendChild(box); }
      ex.appendChild(row); block.appendChild(ex);
    }
    placeAfterLastOfKey(block, key);
    requestAnimationFrame(()=>drawJumpArcsInline(row, Array(count-1).fill(discover? '?': ('+'+step))));
  }

  /* =====================  GEMENGDE / HTE  ===================== */
  function rnd(max){return Math.floor(Math.random()*(max+1))}
  function uniqueRandoms(count, max, min=0){
  const set = new Set();
  while (set.size < count){
    const v = min + Math.floor(Math.random()*(max - min + 1));
    set.add(v);
  }
  return Array.from(set);
}

function exprForValue(v, range){
  const h = Math.floor(v/100), t = Math.floor((v%100)/10), e = v%10;
  if (Math.random() < 0.35) return String(v); // soms als getal

  if (range === '20'){
    const t2 = Math.floor(v/10), e2 = v%10;
    const parts = [];
    if (t2) parts.push(`${t2} T`);
    if (e2) parts.push(`${e2} E`);
    if (parts.length >= 2 && Math.random()<0.6) return parts.join(' ');
    return parts.length ? parts[0] : String(v);
  }
  if (range === '100'){
    if (v === 100 && Math.random()<0.5) return (Math.random()<0.5 ? '1 H' : '10 T');
    const forms = [];
    const H = Math.floor(v/100), T = Math.floor((v%100)/10), E = v%10;
    if (H) forms.push(`${H} H`);
    if (T) forms.push(`${T} T`);
    if (E) forms.push(`${E} E`);
    if (forms.length >= 2 && Math.random()<0.6) return forms.sort(()=>Math.random()-0.5).slice(0,2).join(' ');
    return forms.length ? forms.join(' ') : String(v);
  }
  // range === '1000'
  const forms = [];
  if (h) forms.push(`${h} H`);
  if (t) forms.push(`${t} T`);
  if (e) forms.push(`${e} E`);
  if (forms.length >= 2 && Math.random()<0.7){
    return forms.sort(()=>Math.random()-0.5).slice(0, Math.random()<0.6?2:3).join(' ');
  }
  return forms.length ? forms.join(' ') : String(v);
}

  // Unieke waarden
function uniqueRandoms(count, max, min=0){
  const set = new Set();
  while (set.size < count){
    const v = min + Math.floor(Math.random()*(max - min + 1));
    set.add(v);
  }
  return Array.from(set);
}

// Maak een expressie die dezelfde waarde voorstelt (voor 20/100/1000)
function exprForValue(v, range){
  const h = Math.floor(v/100), t = Math.floor((v%100)/10), e = v%10;
  const pieces = [];
  // kans op “als getal”
  if (Math.random() < 0.35) return String(v);

  // H/T/E-onderdelen maken (niet-lege componenten)
  if (range === '20'){
    // 0..20 → T/E varianten
    const t2 = Math.floor(v/10), e2 = v%10;
    const forms = [];
    if (t2) forms.push(`${t2} T`);
    if (e2) forms.push(`${e2} E`);
    // soms twee stukjes, soms één
    if (forms.length >= 2 && Math.random()<0.6) return `${forms[0]} ${forms[1]}`;
    return forms.length ? forms[0] : String(v);
  }

  if (range === '100'){
    // “1 H” of “10 T” ook toestaan als v==100
    const forms = [];
    if (h) forms.push(`${h} H`);
    if (t) forms.push(`${t} T`);
    if (e) forms.push(`${e} E`);
    if (v===100 && Math.random()<0.5) return Math.random()<0.5 ? '1 H' : '10 T';
    if (forms.length >= 2 && Math.random()<0.6){
      // willekeurige volgorde van 2 delen
      return forms.sort(()=>Math.random()-0.5).slice(0,2).join(' ');
    }
    return forms.length ? forms.join(' ') : String(v);
  }

  // range === '1000' → H/T/E
  const forms = [];
  if (h) forms.push(`${h} H`);
  if (t) forms.push(`${t} T`);
  if (e) forms.push(`${e} E`);
  if (forms.length >= 2 && Math.random()<0.7){
    return forms.sort(()=>Math.random()-0.5).slice(0, Math.random()<0.6?2:3).join(' ');
  }
  return forms.length ? forms.join(' ') : String(v);
}

  function uniqueRandoms(count, max, min=0){
  const set = new Set();
  while(set.size < count){
    const v = min + Math.floor(Math.random()*(max - min + 1));
    set.add(v);
  }
  return Array.from(set);
}
function neighborHundredsFor(x){
  // [lager honderd, getal, hoger honderd]
  const base = Math.floor(x/100)*100;
  const lower = base;
  const upper = Math.min(1000, base+100);
  return [lower, x, upper];
}
function nextTen(n){ return Math.floor(n/10)*10 + 10; }
function nextHundred(n){ return Math.floor(n/100)*100 + 100; }
function isCleanTen(n){ return n % 10 === 0; }

  function makeTE(max){
  // Meer variatie: T, E, TE, ET + grotere E-waarden mogelijk (zoals 12E of 51E)
  const patterns = ['T', 'E', 'TE', 'ET', 'TE', 'ET']; // evenveel kans op TE als ET
  const p = patterns[Math.floor(Math.random() * patterns.length)];
  let t = 0, e = 0, text = '';

  if (p === 'T') {
    t = 1 + Math.floor(Math.random() * 9);
    text = `${t}T`;
    return { text, value: t * 10 };
  }

  if (p === 'E') {
    // ook eens waarden boven 9E, bv. 12E of 18E
    e = 1 + Math.floor(Math.random() * Math.min(20, max));
    text = `${e}E`;
    return { text, value: e };
  }

  // gecombineerde vormen (TE of ET)
  t = 1 + Math.floor(Math.random() * 9);
  e = Math.floor(Math.random() * 10);
  const value = t * 10 + e;

  if (p === 'TE') {
    // klassieke volgorde
    text = Math.random() < 0.5
      ? `${t}T en ${e}E`
      : `${t}T ${e}E`;
    return { text, value };
  }

  if (p === 'ET') {
    // omgekeerde volgorde om te verwarren (E voor T)
    text = Math.random() < 0.5
      ? `${e}E en ${t}T`
      : `${e}E ${t}T`;
    return { text, value };
  }

  // fallback
  return { text: String(value), value };
}
  
  function makeSideTEorNumber(max){
    if (Math.random() < 0.5) {
      const te = makeTE(max);
      return { isTE: true, text: te.text, value: te.value };
    } else {
      const v = rnd(max);
      return { isTE: false, text: String(v), value: v };
    }
  }

  function addMixedExercises(){
    const type=$('#mixedType').value;
    const max=parseInt($('#mixedMax').value,10)||100;
    const n=parseInt($('#mixedCount').value,10)||9;
    const titles = {
  neighbors: 'Vul de buurgetallen in.',
  neighborTens: 'Vul de buurtientallen in.',
  neighborHundreds: 'Vul de buurhonderdtallen in.',
  orderAsc: 'Rangschik van klein naar groot.',
  orderDesc: 'Rangschik van groot naar klein.',
  composeTE: 'Vul het getal in.',
  compare: 'Vergelijk de getallen (vul <, = of > in).',
  compareTE: 'Vergelijk de getallen (vul <, = of > in).',
  composeHTE: 'Vul het getal in.',
  compareHTE: 'Vergelijk de getallen (vul <, = of > in).',
  nextTen: 'Vul aan tot het eerstvolgende tiental.',
  nextHundred: 'Vul aan tot het eerstvolgende honderdtal.'
};

    const keyMap = {
  neighbors: 'mixed_neighbors',
  neighborTens: 'mixed_neighborTens',
  neighborHundreds: 'mixed_neighborHundreds',
  orderAsc: 'mixed_order_asc',
  orderDesc: 'mixed_order_desc',
  composeTE: 'mixed_compose_te',
  compare: 'mixed_compare_any',
  compareTE: 'mixed_compare_any',
  composeHTE: 'mixed_compose_hte',
  compareHTE: 'mixed_compare_hte',
  nextTen: 'mixed_next_ten',
  nextHundred: 'mixed_next_hundred'
};

    const key=keyMap[type]; ensureTitleOnce(sheet, key, titles[type]);
    const block=document.createElement('div'); block.className='mixed-exercise-block'; block.appendChild(createDeleteButton(block)); block.dataset.titleKey=key;
    let grid = document.createElement('div');
if (type==='nextTen' || type==='nextHundred') {
  grid.className = 'fillnext-grid';
} else {
  grid.className = 'mixed-grid';
  if (type==='composeHTE' || type==='compareHTE') grid.classList.add('hte-2col');
  if (type==='orderAsc' || type==='orderDesc') grid.classList.add('one-col');
}
// neighborHundreds blijft standaard 3 per rij
    function box(cls=''){const i=document.createElement('input');i.type='text';i.className='mix-box'+(cls?(' '+cls):'');return i}
    function makeNum(n){const d=document.createElement('div');d.className='mix-num';d.textContent=n;return d}
    function makeLabel(txt){const s=document.createElement('span');s.className='mix-label';s.textContent=txt;return s}

    // Alleen voor 'nextHundred': hoogstens één startgetal onder 100
const limitUnder100 = (type === 'nextHundred');
let under100Used = false;

    for(let i=0;i<n;i++){
        const item = document.createElement('div');
  item.className = 'mix-item row-delete-wrap';
  item.appendChild(createRowDeleteButton(item));
      if(type==='neighborHundreds'){
  const x = Math.max(1, Math.min(999, rnd(Math.min(1000, max))));
  const [low, num, high] = neighborHundredsFor(x);
  // We tonen het middengetal en laten de leerling de buurhonderdtallen invullen:
  // [  __ ]  num  [  __ ]
  item.append(box(), makeNum(num), box());
}
else if(type==='orderAsc' || type==='orderDesc'){
  // Eén oefening per rij:
  // bovenaan 5 getallen, onderaan 5 invulvakjes met vaste symbolen ertussen
  const values = uniqueRandoms(5, Math.min(1000, max));
  const wrap = document.createElement('div'); wrap.className = 'mix-order-wrap';
  const top = document.createElement('div'); top.className = 'mix-order-top';
  values.forEach(v => { const d = document.createElement('div'); d.textContent = v; top.appendChild(d); });
  const bottom = document.createElement('div'); bottom.className = 'mix-order-bottom';
  for(let k=0;k<5;k++){
    bottom.appendChild(box());
    if(k<4){
      const s = document.createElement('span'); s.className='mix-order-symbol';
      s.textContent = (type==='orderAsc') ? '<' : '>';
      bottom.appendChild(s);
    }
  }
  wrap.appendChild(top);
  wrap.appendChild(bottom);
  item.appendChild(wrap);
}
else if (type==='nextTen'){
  const showExample = document.getElementById('fillNextExample')?.checked;
  const x = Math.max(0, rnd(Math.min(999, max)));
  const target = nextTen(x);
  const diff = target - x;

  const card = document.createElement('div');
  card.className = 'fillnext-card' + ((showExample && i===0) ? ' example' : '');
  card.innerHTML = `
    <div class="fillnext-top"><div class="fillnext-num">${x}</div></div>
    <div class="fillnext-line">Het volgende <strong>T</strong> is
      ${(showExample && i===0) ? `<span style="font-weight:700;">${target}</span>` : `<input type="text" class="fillnext-box">`}.
    </div>
    <div class="fillnext-line">Dat is
      ${(showExample && i===0) ? `<span style="font-weight:700;">${diff}</span>` : `<input type="text" class="fillnext-box">`} erbij.
    </div>`;
  item.appendChild(card);
  grid.appendChild(item);            // ← NIEUW
}
else if (type==='nextHundred'){
  const showExample = document.getElementById('fillNextExample')?.checked;

  // Kies vooral tientallen boven 100; hoogstens één onder 100
  const cap = Math.min(990, max);
  let x, tries = 0;

  // Bepaal of we deze oefening <100 mogen/ willen nemen
  const canUseUnder100 = (cap >= 10) && (!limitUnder100 || !under100Used);
  const wantUnder100   = (cap < 110) ? true                   // als >100 niet kan
                                     : (canUseUnder100 && Math.random() < 0.20); // 20% kans

  if (!wantUnder100 && cap >= 110) {
    // Kies boven 100 → 110..cap per 10 (geen zuiver honderdtal)
    do {
      const tensCount = Math.floor((cap - 110) / 10) + 1;     // 110,120,...,cap
      x = 110 + 10 * Math.floor(Math.random() * tensCount);
      tries++;
      if (tries > 200) break;
    } while (x % 100 === 0);
  } else {
    // Kies onder 100 → 10..90 (geen 100)
    do {
      x = 10 + 10 * Math.floor(Math.random() * 9);            // 10,20,...,90
      tries++;
      if (tries > 200) break;
    } while (x % 100 === 0);
    if (limitUnder100) under100Used = true;                   // markeer dat we <100 al gebruikt hebben
  }

  const target = nextHundred(x);
  const diff = target - x;

  const card = document.createElement('div');
  card.className = 'fillnext-card' + ((showExample && i===0) ? ' example' : '');
  card.innerHTML = `
    <div class="fillnext-top"><div class="fillnext-num">${x}</div></div>
    <div class="fillnext-line">Het volgende <strong>H</strong> is
      ${(showExample && i===0) ? `<span style="font-weight:700;">${target}</span>` : `<input type="text" class="fillnext-box">`} .
    </div>
    <div class="fillnext-line">Dat is
      ${(showExample && i===0) ? `<span style="font-weight:700;">${diff}</span>` : `<input type="text" class="fillnext-box">`} erbij.
    </div>`;
  item.appendChild(card);
  grid.appendChild(item);
}

else

      if(type==='neighbors'){const x=rnd(max);item.append(box(),makeNum(x),box());}
      else if(type==='neighborTens'){const x=rnd(max);item.append(box(),makeNum(x),box());}
      else if(type==='composeTE'){const te=makeTE(max);const eq=document.createElement('span');eq.className='mix-eq';eq.textContent='=';item.append(makeLabel(te.text),eq,box());}
      else if(type==='compare'){const a=rnd(max),b=rnd(max);const mid=box('small');item.append(makeNum(a),mid,makeNum(b));}
      else if(type==='compareTE'){const left=makeSideTEorNumber(max);const right=makeSideTEorNumber(max);const mid=box('small');const leftEl=left.isTE?makeLabel(left.text):makeNum(left.value);const rightEl=right.isTE?makeLabel(right.text):makeNum(right.value);item.append(leftEl,mid,rightEl);}
      else if(type==='composeHTE'){const hte=makeHTE(max);const eq=document.createElement('span');eq.className='mix-eq';eq.textContent='=';item.append(makeLabel(hte.text),eq,box());}
      else if(type==='compareHTE'){const left=makeSideHTEorNumber(max);const right=makeSideHTEorNumber(max);const mid=box('small');const leftEl=left.isHTE?makeLabel(left.text):makeNum(left.value);const rightEl=right.isHTE?makeLabel(right.text):makeNum(right.value);item.append(leftEl,mid,rightEl);}
      grid.appendChild(item);
      grid.appendChild(item); 
    }

// --- Eerste rij bij de titel houden ---
// --- Eerste rij bij de titel houden ---
const isHTE    = grid.classList.contains('hte-2col');
const isOneCol = grid.classList.contains('one-col');
const isFill   = grid.classList.contains('fillnext-grid');
const cols     = isOneCol ? 1 : (isHTE ? 2 : (isFill ? 2 : 3));

const head = document.createElement('div');
head.className = (isFill ? 'fillnext-first' : 'mixed-first') + ' keep-with-title';
head.style.display = 'grid';
head.style.gridTemplateColumns = isOneCol
  ? 'repeat(1, minmax(0,1fr))'
  : (isHTE ? 'repeat(2, minmax(0,1fr))'
           : (isFill ? 'repeat(2, minmax(0,1fr))' : 'repeat(3, minmax(0,1fr))'));
head.style.gap = getComputedStyle(grid).gap || '8px 10px';

for (let i = 0; i < cols && grid.firstChild; i++) {
  head.appendChild(grid.firstChild);
}

/* ▼▼ NIEUW: bij 'Vul aan' de overige kaarten per 2 in .fillnext-row steken ▼▼ */
if (isFill && grid.children.length){
  const cards = Array.from(grid.children);
  grid.innerHTML = '';
  for (let i = 0; i < cards.length; i += 2){
    const row = document.createElement('div');
    row.className = 'fillnext-row';
    row.appendChild(cards[i]);
    if (cards[i+1]) row.appendChild(cards[i+1]);
    grid.appendChild(row);
  }
}
/* ▲▲ EINDE NIEUW ▲▲ */

block.appendChild(head);
block.appendChild(grid);
placeAfterLastOfKey(block, key);
  }

  (function(){
  const btn = document.getElementById('btnAddFillNext');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const range = document.getElementById('fillNextRange').value;
    const count = parseInt(document.getElementById('fillNextCount').value,10) || 1;
    const type  = document.getElementById('fillNextType').value;
    const showExample = document.getElementById('fillNextExample').checked;

    const max = range === '100' ? 100 : 1000;
    $('#mixedMax').value = max;
    $('#mixedCount').value = count;
    // ▼▼ NIEUW: zorg dat de optie in #mixedType bestaat, anders blijft .value leeg ▼▼
    const mixedSel = document.querySelector('#mixedType');
    if (mixedSel && !mixedSel.querySelector(`option[value="${type}"]`)) {
      const opt = document.createElement('option');
      opt.value = type;
      opt.textContent = '(intern: Vul aan)';
      opt.hidden = true;                // niet zichtbaar voor de gebruiker
      mixedSel.appendChild(opt);
    }
    $('#mixedType').value = type;
    $('#fillNextExample').checked = showExample;

    // hergebruik de bestaande gemengde generator
    addMixedExercises();
  });
})();

  /* =====================  GETALLENRIJ  ===================== */
  function addSequenceExercise(){
    const start=parseInt($('#seqStart').value,10);
    const end=parseInt($('#seqEnd').value,10);
    if(!Number.isFinite(start)||!Number.isFinite(end)||start===end){ alert('Start en eind moeten verschillend zijn.'); return; }
    const lockEnds=$('#seqLockEnds').checked;
    const blanksWanted=Math.max(0, parseInt($('#seqBlankCount').value,10)||0);
    const step=start<end?1:-1;
    const seq=[]; for(let v=start; (step>0? v<=end : v>=end); v+=step) seq.push(v);
    const length=seq.length;
    const maxBlanks=lockEnds?Math.max(0,length-2):length;
    const blanks=Math.min(blanksWanted, maxBlanks);
    const allIdx=[...seq.keys()]; if(lockEnds){ allIdx.shift(); allIdx.pop(); }
    const blankSet=new Set(); while(blankSet.size<blanks && allIdx.length){ const k=Math.floor(Math.random()*allIdx.length); blankSet.add(allIdx.splice(k,1)[0]); }
    const key='seq_fill'; ensureTitleOnce(sheet,key,'Vul de getallenrij verder aan.');
    const block=document.createElement('div'); block.className='sequence-exercise-block'; block.appendChild(createDeleteButton(block)); block.dataset.titleKey=key;
    const row = document.createElement('div');
row.className = 'seq-row row-delete-wrap';
row.appendChild(createRowDeleteButton(row));
    seq.forEach((n,i)=>{ if(blankSet.has(i)){ const inp=document.createElement('input'); inp.type='text'; inp.className='seq-box'; row.appendChild(inp);} else { const d=document.createElement('div'); d.className='seq-num'; d.textContent=n; row.appendChild(d);} });
    block.appendChild(row); placeAfterLastOfKey(block, key);
  }

  /* =====================  Honderdveld / MAB  ===================== */
  function createHundredSquareSVG(isWhite){
    const svg=document.createElementNS(NS,'svg');
    svg.setAttribute('viewBox','0 0 100 100');
    svg.classList.add('hundred');
    const rect=document.createElementNS(NS,'rect');
    rect.setAttribute('width','100'); rect.setAttribute('height','100');
    rect.setAttribute('fill',isWhite?'#fff':'#42a5f5'); rect.setAttribute('stroke',isWhite?'#888':'#1e88e5'); rect.setAttribute('stroke-width','1.2');
    svg.appendChild(rect);
    for(let i=1;i<10;i++){
      const h=document.createElementNS(NS,'line'); h.setAttribute('x1','0'); h.setAttribute('y1',i*10); h.setAttribute('x2','100'); h.setAttribute('y2',i*10); h.setAttribute('stroke',isWhite?'#ddd':'#1976d2'); h.setAttribute('stroke-width','0.5'); svg.appendChild(h);
      const v=document.createElementNS(NS,'line'); v.setAttribute('x1',i*10); v.setAttribute('y1','0'); v.setAttribute('x2',i*10); v.setAttribute('y2','100'); v.setAttribute('stroke',isWhite?'#ddd':'#1976d2'); v.setAttribute('stroke-width','0.5'); svg.appendChild(v);
    }
    return svg;
  }
  function createTenRodSVG(isWhite){
    const svg=document.createElementNS(NS,'svg'); svg.setAttribute('viewBox','0 0 20 100');
    const rect=document.createElementNS(NS,'rect');
    rect.setAttribute('width','20'); rect.setAttribute('height','100'); rect.setAttribute('fill',isWhite?'#fff':'#4caf50'); rect.setAttribute('stroke',isWhite?'#888':'#2e7d32'); rect.setAttribute('stroke-width','1'); svg.appendChild(rect);
    for(let i=1;i<10;i++){const line=document.createElementNS(NS,'line'); line.setAttribute('x1','0'); line.setAttribute('y1',i*10); line.setAttribute('x2','20'); line.setAttribute('y2',i*10); line.setAttribute('stroke',isWhite?'#ccc':'#2e7d32'); line.setAttribute('stroke-width','0.5'); svg.appendChild(line);}
    return svg;
  }
  function createUnitCubeSVG(isWhite){
    const svg=document.createElementNS(NS,'svg'); svg.setAttribute('viewBox','0 0 20 20'); svg.classList.add('unit');
    const rect=document.createElementNS(NS,'rect');
    rect.setAttribute('width','20'); rect.setAttribute('height','20'); rect.setAttribute('fill',isWhite?'#fff':'#ffeb3b'); rect.setAttribute('stroke',isWhite?'#888':'#fbc404'); rect.setAttribute('stroke-width','1'); svg.appendChild(rect);
    return svg;
  }
  function createMabRepresentationHTE(h,t,u,isWhite,includeHundreds){
    const c=document.createElement('div'); c.className='mab-labeled-container';
    if (includeHundreds){
      const colH=document.createElement('div'); colH.className='mab-column mab-column-hundreds'; colH.style.borderRight='1.5px solid #334';
      colH.innerHTML=`<div class="mab-header">H</div>`;
      const wrapH=document.createElement('div'); wrapH.className='mab-blocks-wrapper mab-hundreds-wrapper';
      const countH = isWhite ? 9 : h;
      for(let i=0;i<countH;i++) wrapH.appendChild(createHundredSquareSVG(isWhite));
      colH.appendChild(wrapH); c.appendChild(colH);
    }
    const colT=document.createElement('div'); colT.className='mab-column mab-column-tens'; colT.innerHTML=`<div class="mab-header">T</div>`;
    const wrapT=document.createElement('div'); wrapT.className='mab-blocks-wrapper mab-tens-wrapper';
    const countT = isWhite ? 9 : t; for(let i=0;i<countT;i++) wrapT.appendChild(createTenRodSVG(isWhite));
    colT.appendChild(wrapT); c.appendChild(colT);
    const colE=document.createElement('div'); colE.className='mab-column'; colE.innerHTML=`<div class="mab-header">E</div>`;
    const wrapE=document.createElement('div'); wrapE.className='mab-blocks-wrapper mab-units-wrapper';
    const countE = isWhite ? 9 : u; for(let i=0;i<countE;i++) wrapE.appendChild(createUnitCubeSVG(isWhite));
    colE.appendChild(wrapE); c.appendChild(colE);
    return c;
  }

function addHonderdveldExercise() {
  // UI-waarden (pas de ID's aan als uw HTML anders heet)
  const type  = $('#honderdveldType')?.value || 'veld-naar-getal';   // 'veld-naar-getal' | 'getal-naar-veld' | 'aanvullen-tiental'
  let   max   = parseInt($('#honderdveldMax')?.value, 10) || 100;     // honderveld blijft 1..100
  if (max > 100) max = 100;
  const count = parseInt($('#honderdveldCount')?.value, 10) || 2;
  const twoColumns = !!$('#honderdveldTwoColumns')?.checked;

  const titles = {
    'veld-naar-getal': 'Hoeveel is het? Vul in.',
    'getal-naar-veld': 'Kleur het juiste aantal vakjes.',
    'aanvullen-tiental': 'Vul aan tot het volgend tiental.'
  };
  const key = `honderdveld_${type}`;
  ensureTitleOnce(sheet, key, titles[type] || 'Honderdveld');

  let rowContainer = null;

  for (let i = 0; i < count; i++) {
    // Blok + verwijderknop
    const block = document.createElement('div');
    block.className = 'honderdveld-exercise-block';
    block.dataset.titleKey = key;
    block.appendChild(createDeleteButton(block));

    // Container
    const container = document.createElement('div');
    container.className = 'honderdveld-container';

    // Kies een getal
    let num;
    if (type === 'aanvullen-tiental') {
      // geen veelvoud van 10
      do { num = Math.floor(Math.random() * (max - 1)) + 1; } while (num % 10 === 0);
    } else {
      num = Math.floor(Math.random() * max) + 1;
    }
    const tens = Math.floor(num / 10);

    // 10×10 raster
    const grid = document.createElement('div');
    grid.className = 'honderdveld-grid';
    // vul kleur voor voorbeeld/controle (leerling kleurt bij "getal-naar-veld")
    for (let j = 1; j <= 100; j++) {
      const cell = document.createElement('div');
      cell.className = 'honderdveld-cell';
      if (type === 'veld-naar-getal' || type === 'aanvullen-tiental') {
        if (j <= tens * 10) cell.classList.add('filled-ten');   // hele tientallen
        else if (j <= num)  cell.classList.add('filled-unit');  // losse eenheden
      }
      grid.appendChild(cell);
    }

    if (type === 'veld-naar-getal') {
      // Leerling leest het raster en vult T/E én het getal in
      const task = document.createElement('div');
      task.className = 'honderdveld-task';
      const table = document.createElement('table');
      table.className = 'honderdveld-te-table';
table.innerHTML = `
  <tr>
    <td class="te-label t">T</td>
    <td class="te-label e">E</td>
  </tr>
  <tr>
    <td><input type="text"></td>
    <td><input type="text"></td>
  </tr>`;

      const numBox = document.createElement('input');
      numBox.type = 'text';
      numBox.className = 'honderdveld-num-box';
      task.append(table, numBox);
      container.append(grid, task);

    } else if (type === 'getal-naar-veld') {
      // Leerling kleurt zelf: geef het getal rechts bij het raster
      const givenNum = document.createElement('div');
      givenNum.className = 'honderdveld-given-num';
      givenNum.textContent = num;
      container.append(givenNum, grid);

    } else if (type === 'aanvullen-tiental') {
      // Opgaven om tot volgend tiental aan te vullen
      const task = document.createElement('div');
      task.className = 'aanvul-vragen';
      task.innerHTML =
        `<div class="aanvul-rij">
           Dit is <input type="text" class="aanvul-input"> T en
           <input type="text" class="aanvul-input"> E =
           <input type="text" class="aanvul-input">
         </div>
         <div class="aanvul-rij">
           Ik vul aan tot <input type="text" class="aanvul-input"> T =
           <input type="text" class="aanvul-input">
         </div>
         <div class="aanvul-rij">
           Dat zijn <input type="text" class="aanvul-input"> E erbij.
         </div>`;
      container.append(grid, task);
    }

    block.appendChild(container);
    
if (twoColumns) {
  // alle bestaande rijen die al Honderdveld-blokken van deze sectie bevatten
  const rows = Array.from(sheet.querySelectorAll('.honderdveld-row'))
    .filter(r => r.querySelector(`.honderdveld-exercise-block[data-title-key="${key}"]`));
  let lastRow = rows[rows.length - 1];

  // helper: tel alléén Honderdveld-blokken (geen andere kinderen)
  const countIn = row =>
    row ? row.querySelectorAll(`.honderdveld-exercise-block[data-title-key="${key}"]`).length : 0;

  // is er nog geen rij, of laatste is vol (2)? → nieuwe rij buiten/na de vorige rij zetten
  if (!lastRow || countIn(lastRow) >= 2) {
  const newRow = document.createElement('div');
newRow.className = 'honderdveld-row row-delete-wrap';
newRow.appendChild(createRowDeleteButton(newRow));

// Als dit de allereerste rij voor deze titel is → aan titel vasthechten
if (!lastRow) {
  const titleRow = document.querySelector(`.title-row .exercise-title[data-title-key="${key}"]`)?.parentElement;
  if (titleRow) {
    // markeer dat deze eerste rij bij de titel hoort
    newRow.classList.add('keep-with-title');
    titleRow.after(newRow);
  } else {
    newRow.classList.add('keep-with-title');
    sheet.appendChild(newRow);
  }
} else {
  lastRow.after(newRow);
}
lastRow = newRow;
  }

  lastRow.appendChild(block);
} else {
  placeAfterLastOfKey(block, key);
}
  }
}

  function addMabExercise(){
    const type=$('#mabType').value;
    const max=parseInt($('#mabMax').value,10)||99;
    const count=parseInt($('#mabCount').value,10)||3;  // 3 zoals gevraagd
    const key=`mab_${type}`;
    const titles={'tellen':'Hoeveel tel je? Vul in.','verbinden':'Wat is evenveel? Verbind.','kleuren':'Kleur de hoeveelheid.'};
    ensureTitleOnce(sheet,key,titles[type]);

    const block=document.createElement('div'); block.className='mab-exercise-block'; block.dataset.titleKey=key; block.appendChild(createDeleteButton(block));
    const includeHundreds = max > 100;

    if (type==='tellen' || type==='kleuren'){
      const grid=document.createElement('div'); grid.className='mab-grid-layout';
      grid.style.rowGap='24px';
      for (let i=0;i<count;i++){
        const num=Math.floor(Math.random()*max)+1;
        const h=Math.floor(num/100), t=Math.floor((num%100)/10), u=num%10;
        const isWhite=(type==='kleuren');

        const container = document.createElement('div');
container.className = 'mab-tellen-container row-delete-wrap';
container.appendChild(createRowDeleteButton(container));

        const visual=createMabRepresentationHTE(isWhite?(includeHundreds?9:0):h, isWhite?9:t, isWhite?9:u, isWhite, includeHundreds);

        if(isWhite){
          const numDiv=document.createElement('div'); numDiv.className='mab-connect-num'; numDiv.textContent=num;
          container.append(numDiv, visual);
        }else{
          const table=document.createElement('table'); table.className='mab-te-table';
          if (includeHundreds){
            table.innerHTML=`<tr><td class="te-label h">H</td><td class="te-label">T</td><td class="te-label e">E</td></tr><tr><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td></tr>`;
          } else {
            table.innerHTML=`<tr><td class="te-label">T</td><td class="te-label e">E</td></tr><tr><td><input type="text"></td><td><input type="text"></td></tr>`;
          }
          container.append(visual, table);
        }
        grid.appendChild(container);
      }
      // --- Eerste rij MAB bij de titel houden (2 per rij) ---
const mabHead = document.createElement('div');
mabHead.className = 'mab-first keep-with-title';
mabHead.style.display = 'grid';
mabHead.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
mabHead.style.gap = getComputedStyle(grid).gap || '16px';

// verplaats de eerste 2 kinderen naar de head
for (let i = 0; i < 2 && grid.firstChild; i++) {
  mabHead.appendChild(grid.firstChild);
}

// head vóór de body-grid plaatsen
block.appendChild(mabHead);

// Body (overige rijen)
block.appendChild(grid);
placeAfterLastOfKey(block, key);
return;
    }

    if (type==='verbinden'){
      // TOT 100: 3 op 1 rij + daaronder 3 getallen op 1 rij
      if (max <= 100){
        let numbers=new Set(); while(numbers.size<count) numbers.add(Math.floor(Math.random()*max)+1);
        const arr=Array.from(numbers);

        const wrap=document.createElement('div'); 
        wrap.classList.add('keep-together');
wrap.style.display='grid';
        wrap.style.gridTemplateRows='auto 80px auto';
        wrap.style.rowGap='16px';

        // bovenste rij: schema's met bolletjes ONDERAAN (midden)
        const topRow=document.createElement('div'); topRow.style.display='grid';
        topRow.style.gridTemplateColumns='repeat(4, 1fr)'; topRow.style.columnGap='18px';

        arr.forEach(n=>{
          const h=Math.floor(n/100), t=Math.floor((n%100)/10), u=n%10;
          const card=document.createElement('div'); card.style.position='relative';
          const vis=createMabRepresentationHTE(0,t,u,false,false); // geen H bij tot 100
          const dot=document.createElement('div');
          dot.style.position='absolute'; dot.style.left='50%'; dot.style.transform='translate(-50%, 0)'; dot.style.bottom='-14px';
          dot.style.width='10px'; dot.style.height='10px'; dot.style.background='#000'; dot.style.borderRadius='50%';
          card.append(vis,dot); topRow.appendChild(card);
        });

        // onder: getallen met bolletje BOVENAAN (midden) — in willekeurige volgorde
        const botRow=document.createElement('div'); botRow.style.display='grid';
        botRow.style.gridTemplateColumns='repeat(4, 1fr)'; botRow.style.columnGap='20px';

        const shuffled=[...arr].sort(()=>Math.random()-0.5);
        shuffled.forEach(n=>{
          const card=document.createElement('div'); card.style.position='relative'; card.style.textAlign='center';
          const dot=document.createElement('div'); dot.style.position='absolute'; dot.style.left='50%'; dot.style.transform='translate(-50%, 0)'; dot.style.top='-14px';
          dot.style.width='10px'; dot.style.height='10px'; dot.style.background='#000'; dot.style.borderRadius='50%';
          const num=document.createElement('div'); num.className='mab-connect-num'; num.textContent=n;
          num.style.display='inline-block'; num.style.minWidth='72px';
          card.append(dot, num); botRow.appendChild(card);
        });

        wrap.append(topRow, document.createElement('div'), botRow);
        block.appendChild(wrap); placeAfterLastOfKey(block, key);
        return;
      }

      // TOT 1000: links 3 onder elkaar, rechts 3 onder elkaar — RUIME witruimte
      {
        let numbers=new Set(); while(numbers.size<count) numbers.add(Math.floor(Math.random()*max)+1);
        const arr=Array.from(numbers);

        const wrap = document.createElement('div');
        wrap.classList.add('keep-together');
        wrap.style.position='relative';
        wrap.style.display='grid';
        wrap.style.gridTemplateColumns='1fr 100px 1fr'; // extra ruimte
        wrap.style.alignItems='start';
        wrap.style.columnGap='40px';
        wrap.style.rowGap='28px';

        const leftCol  = document.createElement('div'); leftCol.style.display='flex'; leftCol.style.flexDirection='column'; leftCol.style.gap='28px';
        const rightCol = document.createElement('div'); rightCol.style.display='flex'; rightCol.style.flexDirection='column'; rightCol.style.marginTop='150px'; rightCol.style.gap='150px';

        // Lege middenkolom — geen lijnen (leerlingen verbinden zelf)
        wrap.append(leftCol, document.createElement('div'), rightCol);

        // Links: schema's, verbindingsbolletje BUITEN (rechts)
        arr.forEach(n=>{
          const h=Math.floor(n/100), t=Math.floor((n%100)/10), u=n%10;
          const card=document.createElement('div'); card.className='mab-connect-card'; card.style.position='relative';
          // includeHundreds=true; toon echte H/T/E
          const vis=createMabRepresentationHTE(h,t,u,false,true);
          const dot=document.createElement('div');
          dot.style.position='absolute';
          dot.style.right='-26px';            // duidelijk buiten het schema
          dot.style.top='50%';
          dot.style.transform='translateY(-50%)';
          dot.style.width='10px'; dot.style.height='10px'; dot.style.background='#000'; dot.style.borderRadius='50%';
          card.append(vis, dot); leftCol.appendChild(card);
        });

        // Rechts: getallen met bolletje links (buiten), in willekeurige volgorde
        const shuffled=[...arr].sort(()=>Math.random()-0.5);
        shuffled.forEach(n=>{
          const card=document.createElement('div'); card.style.position='relative'; card.style.display='flex'; card.style.alignItems='center';
          const dot=document.createElement('div');
          dot.style.position='absolute';
          dot.style.left='-26px';            // duidelijk buiten
          dot.style.top='50%';
          dot.style.transform='translateY(-50%)';
          dot.style.width='10px'; dot.style.height='10px'; dot.style.background='#000'; dot.style.borderRadius='50%';
          const num=document.createElement('div'); num.className='mab-connect-num'; num.textContent = n;
          num.style.minWidth='80px'; num.style.textAlign='center';
          card.append(dot, num); rightCol.appendChild(card);
        });

        block.appendChild(wrap); placeAfterLastOfKey(block, key);
        return;
      }
    }

    // fallback
    placeAfterLastOfKey(block, key);
  }

  /* =====================  WAARDE PER CIJFER  ===================== */
  function alignPlaceValueTE(item){
  const svg=item.querySelector('svg.pv-arrows'); if(!svg) return;
  while(svg.firstChild) svg.removeChild(svg.firstChild);
  const defs=document.createElementNS(NS,'defs'); svg.appendChild(defs);
  _mkArrowMarker(defs);

  const host=item.getBoundingClientRect();
  const dT=item.querySelector('.pv-digit.tens').getBoundingClientRect();
  const dU=item.querySelector('.pv-digit.units').getBoundingClientRect();
  const rowE=item.querySelector('.pv-answers .pv-row:nth-child(1)').getBoundingClientRect();
  const rowT=item.querySelector('.pv-answers .pv-row:nth-child(2)').getBoundingClientRect();

  // pijlen stoppen vóór de antwoordkolom
  const answersRect = item.querySelector('.pv-answers').getBoundingClientRect();
  const STOP_GAP = 8;
  const xEnd = Math.max(0, answersRect.left - host.left - STOP_GAP);

  const xE=dU.left-host.left + dU.width/2, yE=dU.bottom-host.top;
  const xT=dT.left-host.left + dT.width/2, yT=dT.bottom-host.top;

  // verschillende maxima → pijlen overlappen niet
  const MAX_E = 50, MAX_T = 70;
  const yME = Math.min(rowE.top-host.top + rowE.height/2, yE + MAX_E);
  const yMT = Math.min(rowT.top-host.top + rowT.height/2, yT + MAX_T);

  const w=item.clientWidth||300, h=Math.max(item.clientHeight,150);
  svg.setAttribute('viewBox',`0 0 ${w} ${h}`);

  _drawElbow(svg, xE, yE, Math.max(yE+8, yME), xEnd);
  _drawElbow(svg, xT, yT, Math.max(yT+8, yMT), xEnd);
}

function alignPlaceValueHTE(item){
  const svg = item.querySelector('svg.pv-arrows');
  if (!svg) return;
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  // marker
  const defs = document.createElementNS(NS,'defs');
  const m = document.createElementNS(NS,'marker');
  m.setAttribute('id','pvArrowDyn');
  m.setAttribute('viewBox','0 0 8 8');
  m.setAttribute('refX','4.5'); m.setAttribute('refY','4');
  m.setAttribute('markerWidth','6'); m.setAttribute('markerHeight','6');
  m.setAttribute('orient','auto');
  const tip = document.createElementNS(NS,'path');
  tip.setAttribute('d','M0 0 L8 4 L0 8 Z');
  tip.setAttribute('fill','#333');
  m.appendChild(tip); defs.appendChild(m); svg.appendChild(defs);

  const host = item.getBoundingClientRect();
  const answersRect = item.querySelector('.pv3-answers').getBoundingClientRect();
  const contX = answersRect.left - host.left;
  const contY = answersRect.top  - host.top;

  const dH = item.querySelector('.pv3-digit.hundreds')?.getBoundingClientRect();
  const dT = item.querySelector('.pv3-digit.tens')?.getBoundingClientRect();
  const dE = item.querySelector('.pv3-digit.units')?.getBoundingClientRect();
  const rows = item.querySelectorAll('.pv3-answers .pv3-row');
  if (!dH || !dT || !dE || rows.length < 3) return;

  const rowE = rows[0], rowT = rows[1], rowH = rows[2];

  const xH = dH.left - host.left + dH.width/2;
  const xT = dT.left - host.left + dT.width/2;
  const xE = dE.left - host.left + dE.width/2;

  const yStartH = dH.bottom - host.top;
  const yStartT = dT.bottom - host.top;
  const yStartE = dE.bottom - host.top;

  // ★ KORTE pijlen
  const LAND_E = yStartE + 35;   // zeer kort
  const LAND_T = yStartT + 85;   // kort
  const LAND_H = yStartH + 135;   // medium

  function placeRowByFirstBox(row, xArrow, yLand){
    const firstBox = row.querySelector('.pv3-small, .pv3-box');
    const rowRect  = row.getBoundingClientRect();
    const boxRect  = firstBox?.getBoundingClientRect() || rowRect;
    const boxCenterOffset = (boxRect.left - rowRect.left) + boxRect.width/2;

    let left = xArrow - contX - boxCenterOffset;           // mag negatief → niet uitlijnen in kolom
    const rowW = rowRect.width, contW = answersRect.width; // alleen rechts begrenzen
    if (left > contW - rowW) left = contW - rowW;

    row.style.left = left + 'px';
    row.style.top  = (yLand - contY - rowRect.height/2) + 'px';
  }

  placeRowByFirstBox(rowE, xE, LAND_E);
  placeRowByFirstBox(rowT, xT, LAND_T);
  placeRowByFirstBox(rowH, xH, LAND_H);

  function vline(x, y1, y2){
    const p = document.createElementNS(NS,'path');
    p.setAttribute('d', `M ${x} ${y1} V ${y2}`);
    p.setAttribute('stroke','#333');
    p.setAttribute('stroke-width','1.8');
    p.setAttribute('fill','none');
    p.setAttribute('marker-end','url(#pvArrowDyn)');
    svg.appendChild(p);
  }
  // --- pijlen tekenen: stop exact tegen de bovenrand van het eerste vakje
function endYForRow(row){
  const firstBox = row.querySelector('.pv3-small, .pv3-box');
  if (!firstBox) return null;
  const br  = firstBox.getBoundingClientRect();
  const GAP = 2; // raak de rand, niet erin
  return br.top - host.top - GAP;
}

const yEndE = endYForRow(rowE);
const yEndT = endYForRow(rowT);
const yEndH = endYForRow(rowH);

function vline(x, y1, y2){
  if (y2 == null) return;
  const p = document.createElementNS(NS,'path');
  p.setAttribute('d', `M ${x} ${y1} V ${y2}`);
  p.setAttribute('stroke','#333');
  p.setAttribute('stroke-width','1.8');
  p.setAttribute('fill','none');
  p.setAttribute('marker-end','url(#pvArrowDyn)');
  svg.appendChild(p);
}

vline(xE, yStartE, yEndE);
vline(xT, yStartT, yEndT);
vline(xH, yStartH, yEndH);

const w = item.clientWidth || 360;
const h = Math.max(item.clientHeight, Math.max(yEndE,yEndT,yEndH) + 20);
svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
svg.style.width  = w + 'px';
svg.style.height = h + 'px';
}


 function addPlaceValueExercise() {
    const range = $('#pvRange').value; // '20' | '100' | '1000'
    const count = parseInt($('#pvCount').value, 10) || 6;
    const mode  = ($('#pvMode')?.value || 'standard');

    // NIEUW: alternatieve soorten
    if (mode === 'connect' || mode === 'color') {
      const key   = (mode === 'connect') ? 'pv_match_connect' : 'pv_match_color';
      const title = (mode === 'connect')
        ? 'Verbind wat evenveel is.'
        : 'Geef de vakjes met dezelfde waarde dezelfde kleur.';

      ensureTitleOnce(sheet, key, title);

      const block = document.createElement('div');
      block.className = 'placevalue-exercise-block';
      block.dataset.titleKey = key;
      block.appendChild(createDeleteButton(block));

      const grid = document.createElement('div');
      grid.className = 'pv-match-grid';

      // voor elke rij: 5 paren genereren
      for (let r = 0; r < count; r++){
        // kies 5 basiswaarden binnen bereik
        const maxV = (range==='20') ? 20 : (range==='100' ? 100 : 999);
        const baseVals = uniqueRandoms(5, maxV, 2).map(v => Math.max(2, Math.min(maxV, v)));

      if (mode === 'connect'){
  // 3-banden oefening: boven → midden → onder
    const row = document.createElement('div');
  row.className = 'pv-connect3-row row-delete-wrap';
  row.appendChild(createRowDeleteButton(row));

  const wrap = document.createElement('div');
  wrap.className = 'pv-connect3';

  const bandTop = document.createElement('div'); bandTop.className = 'pv-band';
  const bandMid = document.createElement('div'); bandMid.className = 'pv-band';
  const bandBot = document.createElement('div'); bandBot.className = 'pv-band';

  // 5 basiswaarden binnen bereik
  const maxV = (range==='20') ? 20 : (range==='100' ? 100 : 999);
  const baseVals = uniqueRandoms(5, maxV, 2).map(v => Math.max(2, Math.min(maxV, v)));

  // Maak voor elke waarde twee verschillende representaties (A en B) + het getal als midden
  const topCards = [];
  const midCards = [];
  const botCards = [];

  baseVals.forEach(v => {
    let a = exprForValue(v, range), b;
    do { b = exprForValue(v, range); } while (b === a);
    topCards.push({v, txt:a});
    midCards.push({v, txt:String(v)});     // midden altijd het getal zelf
    botCards.push({v, txt:b});
  });

  // Schud boven- en onderband onafhankelijk voor verbind-werk
  topCards.sort(()=>Math.random()-0.5);
  botCards.sort(()=>Math.random()-0.5);
  // Middenband ook schudden voor meer variatie
  midCards.sort(()=>Math.random()-0.5);

  function addCells(list, band, pos){  // pos: 'top' | 'mid' | 'bot'
  list.forEach(it => {
    const cell = document.createElement('div'); cell.className = 'pv-cell';

    if (pos === 'mid' || pos === 'bot') {
      const dotTop = document.createElement('div'); dotTop.className = 'pv-dot top';
      cell.appendChild(dotTop);
    }

    const card = document.createElement('div'); card.className = 'pv-card'; card.textContent = it.txt;
    cell.appendChild(card);

    if (pos === 'top' || pos === 'mid') {
      const dotBottom = document.createElement('div'); dotBottom.className = 'pv-dot bottom';
      cell.appendChild(dotBottom);
    }

    band.appendChild(cell);
  });
}


  addCells(topCards, bandTop, 'top');   // punt onderaan
addCells(midCards, bandMid, 'mid');   // punt boven én onder
addCells(botCards, bandBot, 'bot');   // punt bovenaan


  wrap.append(bandTop, bandMid, bandBot);
  row.appendChild(wrap);
  grid.appendChild(row);
} else {
  // === KLEUR (zelfde waarde): één rij met 2×5 vakjes ===
  const row = document.createElement('div');
  row.className = 'pv-color-row row-delete-wrap';
  row.appendChild(createRowDeleteButton(row));

  const tbl = document.createElement('div');
  tbl.className = 'pv-color-grid';

  // Voor elke van de 5 basiswaarden: 2 verschillende representaties maken
  const items = [];
  baseVals.forEach(v => {
    let a = exprForValue(v, range), b, guard = 0;
    do { b = exprForValue(v, range); guard++; } while (b === a && guard < 10);
    items.push(a, b);
  });

  // Schudden zodat paren niet vanzelf naast elkaar staan
  items.sort(() => Math.random() - 0.5);

  // 10 cellen toevoegen
  items.forEach(txt => {
    const cell = document.createElement('div');
    cell.className = 'pv-color-cell';
    cell.textContent = String(txt);
    tbl.appendChild(cell);
  });

  row.appendChild(tbl);
  grid.appendChild(row);
}
      }

      // titel aan 1e rij vastmaken; overige rijen mogen pagineren
      const head = document.createElement('div');
      head.className = 'pv-first keep-with-title';
      if (grid.firstChild) head.appendChild(grid.firstChild);
      block.appendChild(head);
      block.appendChild(grid);

      placeAfterLastOfKey(block, key);
      return; // klaar voor “connect/color”; niet doorlopen naar standaard
    }


    if (range === '1000') {
      const key = 'place_value_hte';
      ensureTitleOnce(sheet, key, 'Schrijf de waarde van elk cijfer (H/T/E).');

      const block = document.createElement('div');
      block.className = 'placevalue-exercise-block';
      block.dataset.titleKey = key;
      block.appendChild(createDeleteButton(block));

      const grid = document.createElement('div');
      grid.className = 'pv3-grid';

      for (let i = 0; i < count; i++) {
        const h = 1 + Math.floor(Math.random() * 9);
        const t = Math.floor(Math.random() * 10);
        const u = Math.floor(Math.random() * 10);

        const item = document.createElement('div');
item.className = 'pv3-item row-delete-wrap';
item.style.position = 'relative';
item.appendChild(createRowDeleteButton(item));

        const num = document.createElement('div'); num.className = 'pv3-number';
        const dh = document.createElement('div'); dh.className = 'pv3-digit hundreds'; dh.textContent = h;
        const dt = document.createElement('div'); dt.className = 'pv3-digit tens'; dt.textContent = t;
        const du = document.createElement('div'); du.className = 'pv3-digit units'; du.textContent = u;
        num.append(dh, dt, du);

        // NIEUW – laat positie over aan CSS, container beslaat het hele item
const ans = document.createElement('div'); ans.className = 'pv3-answers';
ans.style.position = 'absolute';
ans.style.left = '0';
ans.style.right = '0';
ans.style.top = '0';
ans.style.height = '180px';


        const rowE = document.createElement('div'); rowE.className = 'pv3-row';
rowE.innerHTML = `<input type="text" class="pv3-small"> <span class="pv3-label">E =</span> <input type="text" class="pv3-box">`;

const rowT = document.createElement('div'); rowT.className = 'pv3-row';
// E weggelaten om compacter te zijn
rowT.innerHTML = `<input type="text" class="pv3-small"> <span class="pv3-label">T =</span> <input type="text" class="pv3-box">`;

const rowH = document.createElement('div'); rowH.className = 'pv3-row';
// E weggelaten om compacter te zijn
rowH.innerHTML = `<input type="text" class="pv3-small"> <span class="pv3-label">H =</span> <input type="text" class="pv3-box"> <span class="pv3-label">T =</span> <input type="text" class="pv3-box">`;
        ans.append(rowE,rowT,rowH);

        const svg = document.createElementNS(NS, 'svg'); svg.classList.add('pv-arrows');
        svg.style.position='absolute'; svg.style.inset='0'; svg.style.zIndex='0';

        item.append(num, ans, svg);
        grid.appendChild(item);
        requestAnimationFrame(()=>alignPlaceValueHTE(item));
      }
// --- Eerste rij bij de titel houden (2 per rij) ---
const head = document.createElement('div');
head.className = 'pv-first keep-with-title';
head.style.display = 'grid';
head.style.gridTemplateColumns = 'repeat(2, minmax(0,1fr))';
head.style.gap = getComputedStyle(grid).gap || '24px';
head.style.marginBottom = getComputedStyle(grid).rowGap || '24px';

for (let i = 0; i < 2 && grid.firstChild; i++) {
  head.appendChild(grid.firstChild);
}
block.appendChild(head);

      block.appendChild(grid);
      placeAfterLastOfKey(block, key);
      return;
    }

    // TE-versie (tot 100) – vaste coördinaten zoals in uw oude werkende versie
const key = 'place_value';
ensureTitleOnce(sheet, key, 'Schrijf de waarde van elk cijfer.');
const block = document.createElement('div');
block.className = 'placevalue-exercise-block';
block.dataset.titleKey = key;
block.appendChild(createDeleteButton(block));

const grid = document.createElement('div');
grid.className = 'pv-grid';

for (let i = 0; i < count; i++) {
  let t, u;
if (range === '20') {
  const n = Math.floor(Math.random() * 21); // 0..20
  t = Math.floor(n / 10);                   // 0,1,2
  u = n % 10;                               // 0..9
} else { // '100'
  t = 1 + Math.floor(Math.random() * 9);    // 1..9  (→ 10..90)
  u = Math.floor(Math.random() * 10);       // 0..9
}

  const item = document.createElement('div');
  item.className = 'pv-item';

  const num = document.createElement('div');
  num.className = 'pv-number';
  const dt = document.createElement('div'); dt.className = 'pv-digit tens';  dt.textContent = t;
  const du = document.createElement('div'); du.className = 'pv-digit units'; du.textContent = u;
  num.append(dt, du);

  const ans = document.createElement('div');
ans.className = 'pv-answers';
const SHIFT_TE_LEFT = -44;                 // probeer -12 of -16 voor finetuning
ans.style.transform = `translateX(${SHIFT_TE_LEFT}px)`;


  const rowE = document.createElement('div'); rowE.className = 'pv-row';
  const eSmall = document.createElement('input'); eSmall.type = 'text'; eSmall.className = 'pv-small';
  const eLab = document.createElement('span');  eLab.className = 'pv-label'; eLab.textContent = 'E =';
  const eBox = document.createElement('input'); eBox.type = 'text'; eBox.className = 'pv-box';
  rowE.append(eSmall, eLab, eBox);

  const rowT = document.createElement('div'); rowT.className = 'pv-row';
  const tSmall = document.createElement('input'); tSmall.type = 'text'; tSmall.className = 'pv-small';
  const tLab = document.createElement('span');  tLab.className = 'pv-label';  tLab.textContent = 'T =';
  const tBox = document.createElement('input'); tBox.type = 'text'; tBox.className = 'pv-box';
  const tLabE = document.createElement('span');  tLabE.className = 'pv-label'; tLabE.textContent = 'E =';
  const tBoxE = document.createElement('input'); tBoxE.type = 'text'; tBoxE.className = 'pv-box';
  rowT.append(tSmall, tLab, tBox, tLabE, tBoxE);

  ans.append(rowE, rowT);

  // pijlen (vaste coördinaten — altijd zichtbaar)
  const svg = document.createElementNS(NS, 'svg');
  svg.classList.add('pv-arrows');

  const defs = document.createElementNS(NS, 'defs');
  const marker = document.createElementNS(NS, 'marker');
  marker.setAttribute('id', 'pvArrowL');
  marker.setAttribute('viewBox', '0 0 8 8');
  marker.setAttribute('refX', '7');
  marker.setAttribute('refY', '4');
  marker.setAttribute('markerWidth', '6');
  marker.setAttribute('markerHeight', '6');
  marker.setAttribute('orient', 'auto-start-reverse');

  const tip = document.createElementNS(NS, 'path');
  tip.setAttribute('d', 'M 0 0 L 8 4 L 0 8 Z');
  tip.setAttribute('fill', '#333');
  marker.appendChild(tip);
  defs.appendChild(marker);
  svg.appendChild(defs);

  const T_START_X = 26, U_START_X = 62;
  const START_Y = 44;
  const ANS_X = 80;
  const E_ROW_Y = 70, T_ROW_Y = 120;

  const ePath = document.createElementNS(NS, 'path');
  ePath.setAttribute('d', `M ${U_START_X} ${START_Y} V ${E_ROW_Y} H ${ANS_X}`);
  ePath.setAttribute('fill', 'none');
  ePath.setAttribute('stroke', '#333');
  ePath.setAttribute('stroke-width', '1.5');
  ePath.setAttribute('marker-end', 'url(#pvArrowL)');

  const tPath = document.createElementNS(NS, 'path');
  tPath.setAttribute('d', `M ${T_START_X} ${START_Y} V ${T_ROW_Y} H ${ANS_X}`);
  tPath.setAttribute('fill', 'none');
  tPath.setAttribute('stroke', '#333');
  tPath.setAttribute('stroke-width', '1.5');
  tPath.setAttribute('marker-end', 'url(#pvArrowL)');

  svg.append(ePath, tPath);

  item.append(num, ans, svg);
  grid.appendChild(item);
}
// --- Eerste rij bij de titel houden (2 per rij) ---
const head = document.createElement('div');
head.className = 'pv-first keep-with-title';
head.style.display = 'grid';
head.style.gridTemplateColumns = 'repeat(2, minmax(0,1fr))';
head.style.gap = getComputedStyle(grid).gap || '24px';
head.style.marginBottom = getComputedStyle(grid).rowGap || '24px';

for (let i = 0; i < 2 && grid.firstChild; i++) {
  head.appendChild(grid.firstChild);
}
block.appendChild(head);

block.appendChild(grid);
placeAfterLastOfKey(block, key);
}

  /* =====================  HEADER / PDF / EVENTS  ===================== */
  function renderSheetHeader(){ if (sheet.querySelector('.sheetHeader')) return;
    const h=document.createElement('div'); h.className='sheetHeader';
    h.innerHTML=`<div style="margin-bottom:16px;"><strong>Naam:</strong> <span style="display:inline-block;border-bottom:1px solid #333;min-width:200px;">&nbsp;</span></div><h2 style="text-align:center;margin:0 0 10px 0;font-size:22px;font-weight:600;">Extra oefenen op getalinzicht</h2>`;
    sheet.insertBefore(h, sheet.firstChild);
  }
  function updateDragSuggestions(){ const start=parseInt($('#start').value,10), end=parseInt($('#end').value,10); if(end<=start) return; const set=new Set(); while(set.size<3){ set.add(Math.floor(Math.random()*(end-start+1))+start); } $('#dragList').value=Array.from(set).sort((a,b)=>a-b).join(', '); }

  function buildPageSlices(canvas, sheetRect, domBlocks, pxPerMm, pageW, pageH){
  const factor = canvas.width / sheetRect.width;
  const pageHeightPx = pageH * pxPerMm;

  // Bewaar ook het element zelf, zodat we per type een lokale safety kunnen toepassen
  const blocks = domBlocks.map(el => {
    const r = el.getBoundingClientRect();
    const top    = (r.top    - sheetRect.top) * factor;
    const bottom = (r.bottom - sheetRect.top) * factor;
    return { el, top, bottom, height: bottom - top };
  }).sort((a,b)=>a.top-b.top);

  // Oefeningen waarvoor de marge kleiner mag (zodat een tweede rij nog net past)
  const SOFT_SELECTOR = '.honderdveld-exercise-block, .fillnext-row, .fillnext-first';

  // basisveiligheid (±1 mm), en zachter (±0,2 mm) voor de twee probleemtypes
  const BASE_SAFETY = 1 * pxPerMm;
  const SOFT_SAFETY = 0.2 * pxPerMm;

  function safetyFor(block){
    return block.el.matches(SOFT_SELECTOR) ? SOFT_SAFETY : BASE_SAFETY;
  }

  const slices = [];
  let startY = 0;   // begin van de huidige pagina-slice in canvaspx
  let cursor = 0;   // onderkant van het laatst verwerkte block

  for (let i = 0; i < blocks.length; i++){
    const b = blocks[i];
    const localSafety = safetyFor(b);

    // Overschrijdt dit block de beschikbare hoogte?
    if ((b.bottom - startY) > (pageHeightPx - localSafety)) {

      if (cursor > startY) {
        // Extra check: past dit block toch nog in de resterende ruimte
        // als we tot nu toe "doorpakken" (zonder te knippen)?
        const usedOnPage = (cursor - startY);
        const remaining  = pageHeightPx - usedOnPage;
        if ((b.height + localSafety) <= remaining) {
          // Het past toch → neem dit block nog mee op deze pagina
          cursor = b.bottom;
          continue;
        }

        // Past écht niet → knip tot aan 'cursor' (nette rand)
        slices.push({ y: startY, h: cursor - startY });
        startY = cursor;
      } else {
        // Eerste block op de pagina is te hoog → harde knip op volle pagina
        slices.push({ y: startY, h: pageHeightPx });
        startY += pageHeightPx;
      }
    }

    // schuif cursor door tot onderkant van dit block
    cursor = b.bottom;
  }

  // laatste slice
  const totalHeight = canvas.height;
  if (totalHeight - startY > 1) {
    slices.push({ y: startY, h: totalHeight - startY });
  }

  return slices;
}


  // Re-align pijlen bij resize/layout-verandering
  function realignAllPlaceValues(){
    $$('.pv-item').forEach(alignPlaceValueTE);
    $$('.pv3-item').forEach(alignPlaceValueHTE);
  }
  window.addEventListener('resize', ()=>requestAnimationFrame(realignAllPlaceValues));

  /* Bindings */
  $$('#controls fieldset:first-of-type input, #controls fieldset:first-of-type select').forEach(el=>el.addEventListener('input',renderPreview));
  $$('input[name=preset], input#start, input#end').forEach(el=>el.addEventListener('change',updateDragSuggestions));
  $$('input[name=preset]').forEach(r=>r.addEventListener('change',e=>{ const ab=e.target.value.split('-').map(Number); $('#start').value=ab[0]; $('#end').value=ab[1]; renderPreview(); updateDragSuggestions(); }));
  $$('input[name=mode]').forEach(r=>r.addEventListener('change',()=>{ const v=$$('input[name=mode]:checked')[0].value; $('#mode-drag').style.display=(v==='drag')?'block':'none'; $('#mode-blanks').style.display=(v==='blanks')?'block':'none'; }));
  $('#jumpDiscover').addEventListener('change',e=>{ $('#jumpDiscoverOptions').style.display = e.target.checked ? 'block' : 'none'; });

bindThrottled($('#btnAddToSheet'),      addExerciseToSheet);
bindThrottled($('#btnAddJumpExercise'), addJumpExercise);
bindThrottled($('#btnAddMixed'),        addMixedExercises);
bindThrottled($('#btnAddSequence'),     addSequenceExercise);
bindThrottled($('#btnAddHonderdveld'),  addHonderdveldExercise);
bindThrottled($('#btnAddMab'),          addMabExercise);
bindThrottled($('#btnAddPlaceValue'),   addPlaceValueExercise);

  $('#btnClearSheet').addEventListener('click',()=>{ sheet.innerHTML=''; addedTitles.clear(); renderSheetHeader(); });

  
  // PDF
  $('#btnDownloadPdf').addEventListener('click',()=>{
    document.documentElement.classList.add('exporting');   // verberg delete-knoppen tijdens export
      // --- Toon melding dat PDF wordt aangemaakt ---
  let overlay = document.getElementById('pdfOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'pdfOverlay';
    overlay.style.cssText = `
      position:fixed; inset:0; background:rgba(255,255,255,0.85);
      display:flex; align-items:center; justify-content:center;
      font-family:Arial,sans-serif; font-size:20px; font-weight:bold;
      color:#000; z-index:9999;
    `;
    overlay.textContent = 'PDF wordt aangemaakt… even geduld a.u.b.';
    document.body.appendChild(overlay);
  }

    const jsPDF = window.jspdf.jsPDF;
    const el = $('#sheet');

    const delBlocks  = $$('.delete-btn, .title-delete-btn');
    const overlays   = $$('.print-overlay-input');
    [...delBlocks].forEach(b => b.style.visibility = 'hidden');
    overlays.forEach(i => i.style.visibility = 'hidden');

    // --- SPRONGEN: labels alleen tijdens export hoger plaatsen ---
const __jumpLabels = Array.from(document.querySelectorAll('.jump-arcs-svg .jump-label'));

// bewaar oude waarden om nadien terug te zetten
const __oldY   = __jumpLabels.map(n => n.getAttribute('y'));
const __oldDy  = __jumpLabels.map(n => n.getAttribute('dy'));
const __oldDB  = __jumpLabels.map(n => n.getAttribute('dominant-baseline'));
const __oldTf  = __jumpLabels.map(n => n.getAttribute('transform')); // voor de zekerheid

// zet labels ZEKER binnen het SVG-viewport en top-uitgelijnd
__jumpLabels.forEach(n => {
  if (n.hasAttribute('transform')) n.removeAttribute('transform'); // geen translate meer
  n.setAttribute('dominant-baseline','text-before-edge');          // top van tekst op y
  n.setAttribute('y','2');                                         // tegen bovenrand svg
  n.setAttribute('dy','-2');
});

    // --- PDF-fix voor SPRONGEN: labels binnen het SVG-viewport houden ---
const _jumpSvgs   = Array.from(document.querySelectorAll('.jump-arcs-svg'));
const _jumpLabels = Array.from(document.querySelectorAll('.jump-arcs-svg .jump-label'));

// originele waarden bewaren om nadien terug te zetten
const _oldSvgH = _jumpSvgs.map(s => s.getAttribute('height'));
const _oldY    = _jumpLabels.map(n => n.getAttribute('y'));
const _oldDy   = _jumpLabels.map(n => n.getAttribute('dy'));

// vergroot tijdelijk het SVG-viewport en zet labels net binnen het viewport
_jumpSvgs.forEach(s => s.setAttribute('height','44'));  // was 28
_jumpLabels.forEach(n => { n.setAttribute('y','2'); n.setAttribute('dy','0'); });

// --- (optioneel) PDF consistentie: bevries bladbreedte ---
const _oldSheetW = el.style.width;
const _sheetWpx  = el.getBoundingClientRect().width;
el.style.width   = _sheetWpx + 'px';

// hoogte inclusief marges (voor correcte fit)
function outerHeightPx(el){
  const r  = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  return r.height + (parseFloat(cs.marginTop)||0) + (parseFloat(cs.marginBottom)||0);
}

// splits een grid (.mixed-grid, .mab-grid-layout, .pv-grid, .pv3-grid) in echte "rij-blokken"
function rowsFromGrid(grid){
  const kids = Array.from(grid.children);
  if (!kids.length) return [];
  const rows = [];
  let curTop = null, row = null;

  kids.forEach(ch => {
    const t = ch.offsetTop;
    if (curTop === null || Math.abs(t - curTop) > 1) {
      curTop = t;
      row = document.createElement('div');
      row.className = 'row-block';
      grid.parentNode.insertBefore(row, grid);
      rows.push(row);
    }
    row.appendChild(ch);
  });

  grid.remove();                 // grid vervangen door de rijblokken
  return rows;
}

   const blocks = Array.from(el.querySelectorAll([
  // GEEN '.title-row' meer → titel kan niet los breken; hij schuift mee met eerste rij

  // kleine blokken die al 1 rij zijn
  '.exercise',          // getallenlijn
  '.jump-row',          // sprongen
  '.seq-row',           // getallenrij

  // gemengd: eerste rij als geheel + het EINDE van elke volgende rij
  '.mixed-first',
  '.mixed-grid.hte-2col .mix-item:nth-child(2n)',         // HTE-varianten (2 kolommen)
  '.mixed-grid:not(.hte-2col) .mix-item:nth-child(3n)',   // overige (3 kolommen)

  // honderveld: per rij (al goed)
  '.honderdveld-row',
  '.honderdveld-exercise-block',  

    // 'Vul aan tot' → eerste rij als geheel + elke volgende rij als geheel (2 per rij)
  '.fillnext-first',
  '.fillnext-row',

  // 10. Honderdveld met pictogrammen – per kaart (1 per rij)
  '.hvicons-first',
  '.hvicons-grid .hvicons-card',

// 11. 100-veld – Puzzelstukken
'.hvp-first',
'.hvp-grid .hvp-card:nth-child(2n)',

  // MAB tellen/kleuren: eerste rij + het EINDE van elke volgende rij (2 per rij)
  '.mab-first',
  '.mab-grid-layout .mab-tellen-container:nth-child(2n)',

  // plaatswaarde TE/HTE: eerste rij + het EINDE van elke rij
  '.pv-first',
  '.pv-grid .pv-item:nth-child(2n)',   // TE: 2 per rij
  '.pv3-grid .pv3-item',               // HTE: 1 per rij

  // volledige blokken die nooit gesplitst mogen worden (bv. verbinden)
  '.keep-together',

    // Getalbeelden tot 1000: eerste rij + het EINDE van elke volgende rij (2 per rij)
  '.gb1000-first',
  '.gb1000-grid .gb1000-card:nth-child(2n)',


].join(', ')));


    const rect = el.getBoundingClientRect();

    html2canvas(el, {
  scale: 2,
  backgroundColor: '#ffffff',
  ignoreElements: (node) => node && (node.id === 'pdfOverlay')
}).then(canvas=>{

      [...delBlocks, ...overlays].forEach(b => b.style.visibility = 'visible');

      const pdf=new jsPDF({orientation:'p',unit:'mm',format:'a4'});
      const pageW=pdf.internal.pageSize.getWidth();
      const pageH=pdf.internal.pageSize.getHeight();
      const pxPerMm=canvas.width/pageW;

      const slices = buildPageSlices(canvas, rect, blocks, pxPerMm, pageW, pageH);

      const leftMargin=15, rightMargin=10, topMargin=6;
      const usableW = pageW - leftMargin - rightMargin;

      slices.forEach((sl,i)=>{
        const c=document.createElement('canvas');
        c.width=canvas.width; c.height=sl.h;
        const ctx=c.getContext('2d');
        ctx.drawImage(canvas,0,sl.y,canvas.width,sl.h,0,0,canvas.width,sl.h);
        const img=c.toDataURL('image/jpeg',0.9);
        if(i>0) pdf.addPage();
        const imgH=(sl.h*usableW)/canvas.width;
        pdf.addImage(img,'JPEG',leftMargin,topMargin,usableW,imgH);
      });
      pdf.save('werkblad.pdf');
        // --- Verberg overlay zodra PDF klaar is ---
  if (overlay) overlay.remove();
    })
    .finally(()=>{
      // --- herstel label-positie na export ---
try{
  __jumpLabels.forEach((n,i)=>{
    if (__oldY[i]  != null) n.setAttribute('y',  __oldY[i]);  else n.removeAttribute('y');
    if (__oldDy[i] != null) n.setAttribute('dy', __oldDy[i]); else n.removeAttribute('dy');
    if (__oldDB[i] != null) n.setAttribute('dominant-baseline', __oldDB[i]);
    else n.removeAttribute('dominant-baseline');
    if (__oldTf[i] != null) n.setAttribute('transform', __oldTf[i]); else n.removeAttribute('transform');
  });
}catch(_){}

      // SPRONGEN: tijdelijk aangepaste SVG-hoogte en label-positie terugzetten
try {
  if (typeof _jumpSvgs !== 'undefined' && typeof _oldSvgH !== 'undefined') {
    _jumpSvgs.forEach((s, i) => {
      if (_oldSvgH[i] != null) s.setAttribute('height', _oldSvgH[i]);
      else s.removeAttribute('height');
    });
  }
  if (typeof _jumpLabels !== 'undefined' && typeof _oldY !== 'undefined') {
    _jumpLabels.forEach((n, i) => {
      if (_oldY[i]  != null) n.setAttribute('y',  _oldY[i]);
      if (_oldDy[i] != null) n.setAttribute('dy', _oldDy[i]);
    });
  }
} catch(_) {/* niets */}

      // --- herstel PDF-fix ---
_jumpSvgs.forEach((s,i) => {
  if (_oldSvgH[i] != null) s.setAttribute('height', _oldSvgH[i]); else s.removeAttribute('height');
});
_jumpLabels.forEach((n,i) => {
  if (_oldY[i]  != null) n.setAttribute('y',  _oldY[i]);  else n.removeAttribute('y');
  if (_oldDy[i] != null) n.setAttribute('dy', _oldDy[i]); else n.removeAttribute('dy');
});
// bladbreedte terug
el.style.width = _oldSheetW || '';

  // toon alles terug
  document.documentElement.classList.remove('exporting');
  // (optioneel) zet ook visibility terug, voor de zekerheid:
  delBlocks.forEach(b => b.style.visibility = 'visible');
  overlays.forEach(i => i.style.visibility = 'visible');
  });
   });
  renderSheetHeader(); renderPreview(); updateDragSuggestions(); $$('input[name=mode]')[0].dispatchEvent(new Event('change'));

  // === PDF-export: rij-bewust, geen snijpunten meer ===
(function () {
  const btn = document.querySelector('#btnDownloadPdf');
  if (!btn) return;
  return; // UITGESCHAKELD: we gebruiken de originele // PDF-handler hierboven

  btn.addEventListener('click', async () => {
    const jsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!jsPDF || !window.html2canvas) {
      alert('PDF-module ontbreekt. Controleer of html2canvas en jsPDF geladen zijn.');
      return;
    }

    const pdf    = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW  = pdf.internal.pageSize.getWidth();
    const pageH  = pdf.internal.pageSize.getHeight();
    const margin = 10;
    let y        = margin;

    const SHEET = document.getElementById('sheet');

    // Elementen die nooit gesplitst mogen worden
    const CHUNKS = SHEET ? Array.from(SHEET.querySelectorAll(
      '.title-row, .hvp-card, .fillnext-row, .mixed-grid > .mix-item, .seq-row, .jump-row, .gb1000-card, .honderdveld-exercise-block'
    )) : [];

    async function snap(el){
      const canvas = await html2canvas(el, {
        scale: Math.min(2, window.devicePixelRatio || 1.5),
        backgroundColor: '#ffffff',
        useCORS: true,
        windowWidth: document.documentElement.scrollWidth
      });
      const imgData = canvas.toDataURL('image/png');
      const imgW = pageW - 2*margin;
      const imgH = canvas.height * (imgW / canvas.width);
      return { imgData, imgW, imgH };
    }

    for (const el of CHUNKS){
      const { imgData, imgW, imgH } = await snap(el);
      if (y + imgH > pageH - margin){ pdf.addPage(); y = margin; }
      pdf.addImage(imgData, 'PNG', margin, y, imgW, imgH);
      y += imgH + 4;
    }

    pdf.save('werkblad.pdf');
  });
})();

})();