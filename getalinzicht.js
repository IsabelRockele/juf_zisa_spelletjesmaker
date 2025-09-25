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
    const ex = row.parentElement;
    const old = ex.querySelector('.jump-arc-wrapper'); if (old) old.remove();
    const items = Array.from(row.children); if (items.length < 2) return;
    const rowRect = row.getBoundingClientRect();
    const SHIFT_ALL_PX = -18, SHIFT_START_PX = -3;
    const centers = items.map(el => (el.getBoundingClientRect().left - rowRect.left) + el.offsetWidth/2);
    const pts = centers.map((c,i)=>c + SHIFT_ALL_PX + (i===0?SHIFT_START_PX:0));
    const width = Math.round(rowRect.width);
    const wrap = document.createElement('div'); wrap.className='jump-arc-wrapper'; wrap.style.width = width + 'px'; wrap.style.marginLeft = row.offsetLeft + 'px';
    ex.insertBefore(wrap, row);
    const h = 18;
    const svg = document.createElementNS(NS,'svg'); svg.classList.add('jump-arcs-inline'); svg.setAttribute('viewBox', `0 0 ${width} ${h+12}`); svg.style.width=width+'px'; svg.style.height=(h+12)+'px'; wrap.appendChild(svg);
    const labelsLayer = document.createElement('div'); labelsLayer.className='arc-labels'; wrap.appendChild(labelsLayer);
    for (let i=0;i<pts.length-1;i++){
      const x1=pts[i], x2=pts[i+1];
      const path = document.createElementNS(NS,'path'); path.setAttribute('d', `M ${x1},${h} C ${x1},6 ${x2},6 ${x2},${h}`); svg.appendChild(path);
      const span = document.createElement('span'); span.className='arc-label'; span.style.left = ((x1+x2)/2)+'px'; span.textContent = labels[i] || ''; labelsLayer.appendChild(span);
    }
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
    const row=document.createElement('div'); row.className='jump-row';
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
  function makeTE(max){
    const maxT = Math.min(9, Math.floor(max/10));
    const patterns = ['T','E','TE'];
    const p = patterns[Math.floor(Math.random()*patterns.length)];
    let t = 0, e = 0, text = '';

    if (p === 'T') {
      t = Math.max(1, rnd(maxT));
      text = `${t}T`;
    } else if (p === 'E') {
      e = Math.max(1, Math.min(9, rnd(max)));
      text = `${e}E`;
    } else {
      t = Math.max(1, rnd(maxT));
      const maxE = Math.min(9, Math.max(0, max - t*10));
      e = rnd(maxE);
      const order = Math.random() < 0.5 ? 'TE' : 'ET';
      text = order === 'TE' ? `${t}T en ${e}E` : `${e}E en ${t}T`;
    }
    return { text, value: t*10 + e };
  }
  function makeHTE(max){
    const h = 1 + Math.floor(Math.random()*9);
    const t = Math.floor(Math.random()*10);
    const e = Math.floor(Math.random()*10);
    const orderPick = [['H','T','E'],['T','E','H'],['E','T','H'],['H','E','T']];
    const order = orderPick[Math.floor(Math.random()*orderPick.length)];
    const parts = order.map(k => k==='H'?`${h}H`:k==='T'?`${t}T`:`${e}E`);
    return { text: parts.join(' en '), value: h*100 + t*10 + e, h,t,e };
  }
  function makeSideHTEorNumber(max){
    if (Math.random() < 0.5) {
      const hte = makeHTE(max);
      return { isHTE: true, text: hte.text, value: hte.value };
    } else {
      const v = Math.max(100, rnd(Math.min(1000, max)));
      return { isHTE: false, text: String(v), value: v };
    }
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
    const titles={
      'neighbors':'Vul de buurgetallen in.',
      'neighborTens':'Vul de buurtientallen in.',
      'composeTE':'Vul het getal in.',
      'compare':'Vergelijk de getallen (vul <, = of > in).',
      'compareTE':'Vergelijk de getallen (vul <, = of > in).',
      'composeHTE':'Vul het getal in.',
      'compareHTE':'Vergelijk de getallen (vul <, = of > in).'
    };
    const keyMap={
      'neighbors':'mixed_neighbors','neighborTens':'mixed_neighborTens','composeTE':'mixed_compose_te',
      'compare':'mixed_compare_any','compareTE':'mixed_compare_any','composeHTE':'mixed_compose_hte','compareHTE':'mixed_compare_hte'
    };
    const key=keyMap[type]; ensureTitleOnce(sheet, key, titles[type]);
    const block=document.createElement('div'); block.className='mixed-exercise-block'; block.appendChild(createDeleteButton(block)); block.dataset.titleKey=key;
    const grid=document.createElement('div'); grid.className='mixed-grid';
    if (type==='composeHTE' || type==='compareHTE') grid.classList.add('hte-2col');
    function box(cls=''){const i=document.createElement('input');i.type='text';i.className='mix-box'+(cls?(' '+cls):'');return i}
    function makeNum(n){const d=document.createElement('div');d.className='mix-num';d.textContent=n;return d}
    function makeLabel(txt){const s=document.createElement('span');s.className='mix-label';s.textContent=txt;return s}

    for(let i=0;i<n;i++){
      const item=document.createElement('div'); item.className='mix-item';
      if(type==='neighbors'){const x=rnd(max);item.append(box(),makeNum(x),box());}
      else if(type==='neighborTens'){const x=rnd(max);item.append(box(),makeNum(x),box());}
      else if(type==='composeTE'){const te=makeTE(max);const eq=document.createElement('span');eq.className='mix-eq';eq.textContent='=';item.append(makeLabel(te.text),eq,box());}
      else if(type==='compare'){const a=rnd(max),b=rnd(max);const mid=box('small');item.append(makeNum(a),mid,makeNum(b));}
      else if(type==='compareTE'){const left=makeSideTEorNumber(max);const right=makeSideTEorNumber(max);const mid=box('small');const leftEl=left.isTE?makeLabel(left.text):makeNum(left.value);const rightEl=right.isTE?makeLabel(right.text):makeNum(right.value);item.append(leftEl,mid,rightEl);}
      else if(type==='composeHTE'){const hte=makeHTE(max);const eq=document.createElement('span');eq.className='mix-eq';eq.textContent='=';item.append(makeLabel(hte.text),eq,box());}
      else if(type==='compareHTE'){const left=makeSideHTEorNumber(max);const right=makeSideHTEorNumber(max);const mid=box('small');const leftEl=left.isHTE?makeLabel(left.text):makeNum(left.value);const rightEl=right.isHTE?makeLabel(right.text):makeNum(right.value);item.append(leftEl,mid,rightEl);}
      grid.appendChild(item);
    }
    block.appendChild(grid); placeAfterLastOfKey(block, key);
  }

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
    const row=document.createElement('div'); row.className='seq-row';
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
      table.innerHTML =
        `<tr>
           <td class="te-label" style="background:#4caf50;color:#fff">T</td>
           <td class="te-label" style="background:#ffeb3b">E</td>
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
    newRow.className = 'honderdveld-row';

    if (lastRow) {
      // **belangrijk**: ná de hele rij plaatsen (niet na het laatste blok)
      lastRow.after(newRow);
    } else {
      // eerste rij: direct na de titel zetten
      const titleRow = document.querySelector(`.title-row .exercise-title[data-title-key="${key}"]`)?.parentElement;
      if (titleRow) titleRow.after(newRow); else sheet.appendChild(newRow);
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

        const container=document.createElement('div'); container.className='mab-tellen-container';
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
      block.appendChild(grid);
      placeAfterLastOfKey(block, key);
      return;
    }

    if (type==='verbinden'){
      // TOT 100: 3 op 1 rij + daaronder 3 getallen op 1 rij
      if (max <= 100){
        let numbers=new Set(); while(numbers.size<count) numbers.add(Math.floor(Math.random()*max)+1);
        const arr=Array.from(numbers);

        const wrap=document.createElement('div'); wrap.style.display='grid';
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
  const svg=item.querySelector('svg.pv-arrows'); if(!svg) return;
  while(svg.firstChild) svg.removeChild(svg.firstChild);
  const defs=document.createElementNS(NS,'defs'); svg.appendChild(defs);
  _mkArrowMarker(defs);

  const host=item.getBoundingClientRect();
  const dH=item.querySelector('.pv3-digit.hundreds').getBoundingClientRect();
  const dT=item.querySelector('.pv3-digit.tens').getBoundingClientRect();
  const dU=item.querySelector('.pv3-digit.units').getBoundingClientRect();
  const rowE=item.querySelector('.pv3-answers .pv3-row:nth-child(1)').getBoundingClientRect();
  const rowT=item.querySelector('.pv3-answers .pv3-row:nth-child(2)').getBoundingClientRect();
  const rowH=item.querySelector('.pv3-answers .pv3-row:nth-child(3)').getBoundingClientRect();

  // pijlen stoppen vóór de antwoordkolom
  const answersRect = item.querySelector('.pv3-answers').getBoundingClientRect();
  const STOP_GAP = 8;
  const xEnd = Math.max(0, answersRect.left - host.left - STOP_GAP);

  const xH=dH.left-host.left + dH.width/2, yH=dH.bottom-host.top;
  const xT=dT.left-host.left + dT.width/2, yT=dT.bottom-host.top;
  const xE=dU.left-host.left + dU.width/2, yE=dU.bottom-host.top;

  // verschillende maxima; H iets lager (grotere bocht)
  const MAX_E = 40, MAX_T = 60, MAX_H = 140; // ↑ H lager
  const yME = Math.min(rowE.top-host.top + rowE.height/2, yE + MAX_E);
  const yMT = Math.min(rowT.top-host.top + rowT.height/2, yT + MAX_T);
  const yMH = Math.min(rowH.top-host.top + rowH.height/2, yH + MAX_H);

  const w=item.clientWidth||380, h=Math.max(item.clientHeight,160);
  svg.setAttribute('viewBox',`0 0 ${w} ${h}`);

  _drawElbow(svg, xE, yE, Math.max(yE+8, yME), xEnd);
  _drawElbow(svg, xT, yT, Math.max(yT+8, yMT), xEnd);
  _drawElbow(svg, xH, yH, Math.max(yH+24, yMH), xEnd); // +12 extra marge
}

  function addPlaceValueExercise() {
    const range = $('#pvRange').value; // '20' | '100' | '1000'
    const count = parseInt($('#pvCount').value, 10) || 6;

    if (range === '1000') {
      const key = 'place_value_hte';
      ensureTitleOnce(sheet, key, 'Schrijf de waarde van elk cijfer (H/T/E).');

      const block = document.createElement('div');
      block.className = 'placevalue-exercise-block';
      block.dataset.titleKey = key;
      block.appendChild(createDeleteButton(block));

      const grid = document.createElement('div');
      grid.className = 'pv3-grid';
      grid.classList.add('one-col');

      for (let i = 0; i < count; i++) {
        const h = 1 + Math.floor(Math.random() * 9);
        const t = Math.floor(Math.random() * 10);
        const u = Math.floor(Math.random() * 10);

        const item = document.createElement('div'); item.className = 'pv3-item'; item.style.position='relative';

        const num = document.createElement('div'); num.className = 'pv3-number';
        const dh = document.createElement('div'); dh.className = 'pv3-digit hundreds'; dh.textContent = h;
        const dt = document.createElement('div'); dt.className = 'pv3-digit tens'; dt.textContent = t;
        const du = document.createElement('div'); du.className = 'pv3-digit units'; du.textContent = u;
        num.append(dh, dt, du);

        const ans = document.createElement('div'); ans.className = 'pv3-answers';
        ans.style.position='absolute'; ans.style.left='128px'; ans.style.top='36px';   // hoger → kortere pijlen

        const rowE = document.createElement('div'); rowE.className = 'pv3-row';
        rowE.innerHTML = `<input type="text" class="pv3-small"> <span class="pv3-label">E =</span> <input type="text" class="pv3-box">`;
        const rowT = document.createElement('div'); rowT.className = 'pv3-row';
        rowT.innerHTML = `<input type="text" class="pv3-small"> <span class="pv3-label">T =</span> <input type="text" class="pv3-box"> <span class="pv3-label">E =</span> <input type="text" class="pv3-box">`;
        const rowH = document.createElement('div'); rowH.className = 'pv3-row';
        rowH.innerHTML = `<input type="text" class="pv3-small"> <span class="pv3-label">H =</span> <input type="text" class="pv3-box"> <span class="pv3-label">T =</span> <input type="text" class="pv3-box"> <span class="pv3-label">E =</span> <input type="text" class="pv3-box">`;
        ans.append(rowE,rowT,rowH);

        const svg = document.createElementNS(NS, 'svg'); svg.classList.add('pv-arrows');
        svg.style.position='absolute'; svg.style.inset='0'; svg.style.zIndex='0';

        item.append(num, ans, svg);
        grid.appendChild(item);
        requestAnimationFrame(()=>alignPlaceValueHTE(item));
      }

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
  const t = 1 + Math.floor(Math.random() * 9);
  const u = 1 + Math.floor(Math.random() * 9);

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
    const safety = 10 * pxPerMm;
    const blocks = domBlocks.map(el => {
      const r = el.getBoundingClientRect();
      const top  = (r.top  - sheetRect.top) * factor;
      const bottom = (r.bottom - sheetRect.top) * factor;
      return { top, bottom, height: bottom-top };
    }).sort((a,b)=>a.top-b.top);
    const slices = [];
    let startY = 0;
    let cursor = 0;
    for (let i=0;i<blocks.length;i++){
      const b = blocks[i];
      if ((b.bottom - startY) > (pageHeightPx - safety)) {
        if (cursor > startY) { slices.push({ y: startY, h: cursor - startY }); startY = cursor; }
        else { slices.push({ y: startY, h: pageHeightPx }); startY = startY + pageHeightPx; }
      }
      cursor = b.bottom;
    }
    const totalHeight = canvas.height;
    if (totalHeight - startY > 1) slices.push({ y: startY, h: totalHeight - startY });
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
    const jsPDF = window.jspdf.jsPDF;
    const el = $('#sheet');

    const delBlocks  = $$('.delete-btn, .title-delete-btn');
    const overlays   = $$('.print-overlay-input');
    [...delBlocks].forEach(b => b.style.visibility = 'hidden');
    overlays.forEach(i => i.style.visibility = 'hidden');

    const blocks = Array.from(el.querySelectorAll(
      '.exercise, .jump-exercise-block, .mixed-exercise-block, .sequence-exercise-block, ' +
      '.honderdveld-row, .honderdveld-exercise-block:not(.honderdveld-row .honderdveld-exercise-block), .mab-exercise-block, .placevalue-exercise-block'
    ));
    const rect = el.getBoundingClientRect();

    html2canvas(el,{scale:2,backgroundColor:'#ffffff'}).then(canvas=>{
      [...delBlocks, ...overlays].forEach(b => b.style.visibility = 'visible');

      const pdf=new jsPDF({orientation:'p',unit:'mm',format:'a4'});
      const pageW=pdf.internal.pageSize.getWidth();
      const pageH=pdf.internal.pageSize.getHeight();
      const pxPerMm=canvas.width/pageW;

      const slices = buildPageSlices(canvas, rect, blocks, pxPerMm, pageW, pageH);

      const leftMargin=15, rightMargin=10, topMargin=8;
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
    });
  });

  renderSheetHeader(); renderPreview(); updateDragSuggestions(); $$('input[name=mode]')[0].dispatchEvent(new Event('change'));
})();