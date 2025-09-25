document.addEventListener("DOMContentLoaded", () => {
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  const opnieuwBtn = document.getElementById('opnieuwBtn');
  const werkbladContainer = document.getElementById('werkblad-container');

  // ==== PDF marges ====
  const LEFT_PUNCH_MARGIN = 22; // mm – perforatiemarge links
  const PDF_BOTTOM_SAFE = 26;

  opnieuwBtn?.addEventListener('click', () => {
    window.location.href = 'bewerkingen_keuze.html';
  });

  if (downloadPdfBtn) {
    downloadPdfBtn.disabled = true;
    downloadPdfBtn.style.backgroundColor = '#aaa';
    downloadPdfBtn.style.cursor = 'not-allowed';
  }

  // ====== Lees bundel of single set ======
  let bundel = [];
  try { bundel = JSON.parse(localStorage.getItem('werkbladBundel') || '[]') || []; } catch {}
  let single = {};
  try { single = JSON.parse(localStorage.getItem('werkbladSettings') || '{}') || {}; } catch {}

  if (!bundel.length) {
    if (!single || !single.hoofdBewerking) {
      toonFout("Geen instellingen gevonden. Ga terug en maak eerst je keuzes.");
      return;
    }
    bundel = [{ titel: 'Werkblad', settings: single }];
  }

  // ========= HULPFUNCTIES =========
  const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  function somHeeftBrug(g1, g2, op) {
    return op === '+' ? ((g1 % 10) + (g2 % 10) > 9) : ((g1 % 10) < (g2 % 10));
  }
  function checkBrug(g1, g2, op, brugType) {
    if (brugType === 'beide') return true;
    const heeftBrug = somHeeftBrug(g1, g2, op);
    return (brugType === 'met' && heeftBrug) || (brugType === 'zonder' && !heeftBrug);
  }
  function titelVoor(cfg) {
    if (cfg.opdracht && cfg.opdracht.trim()) return cfg.opdracht.trim();
    if (cfg.hoofdBewerking === 'splitsen') {
      if (cfg.splitsStijl === 'puntoefening') return 'Vul de splitsing aan.';
      if (cfg.splitsStijl === 'bewerkingen4') return 'Splits en maak de 4 bewerkingen.';
      if (cfg.splitsStijl === 'huisje') return 'Vul het splitshuis correct in.';
      return 'Vul de splitsbenen correct in.';
    }
    if (cfg.hoofdBewerking === 'tafels') return 'Los de tafel-oefeningen op.';
    if (cfg.hoofdBewerking === 'rekenen') {
      if (cfg.rekenBrug === 'met') return 'Los de sommen op met brug.';
      if (cfg.rekenBrug === 'zonder') return 'Los de sommen op zonder brug.';
      return 'Los de sommen op.';
    }
    return 'Oefeningen';
  }

  // ========= GENERATOREN =========
  function genereerSplitsing(cfg) {
    const arr = cfg.splitsGetallenArray?.length ? cfg.splitsGetallenArray : [10];
    const gekozenGetal = arr[Math.floor(Math.random() * arr.length)];
    if (cfg.splitsSom && Math.random() < 0.3) {
      const d1 = rnd(1, Math.max(1, Math.floor(gekozenGetal / 2)));
      const d2 = rnd(1, Math.max(1, Math.floor(gekozenGetal / 2)));
      return { type: 'splitsen', isSom: true, deel1: d1, deel2: d2, totaal: d1 + d2 };
    } else {
      const totaal = rnd(1, gekozenGetal);
      const deel1 = rnd(0, totaal);
      const deel2 = totaal - deel1;
      const prefill = Math.random() < 0.5 ? 'links' : 'rechts'; // één been vooraf ingevuld
      return { type: 'splitsen', isSom: false, totaal, deel1, deel2, prefill };
    }
  }

  function genereerRekensom(cfg) {
    const types = cfg.somTypes?.length ? cfg.somTypes : ['E+E'];
    const gekozenType = types[Math.floor(Math.random() * types.length)];
    const maxGetal = cfg.rekenMaxGetal || 100;
    let g1, g2, op, pogingen = 0;

    do {
      pogingen++;
      if (pogingen > 120) throw new Error(`Kon geen som genereren voor ${gekozenType} tot ${maxGetal}.`);
      switch (gekozenType) {
        case 'E+E': g1 = rnd(1, 9); g2 = rnd(1, 9); break;
        case 'T+E': g1 = rnd(1, 9) * 10; g2 = rnd(1, 9); break;
        case 'T+T': g1 = rnd(1, 9) * 10; g2 = rnd(1, 9) * 10; break;
        case 'TE+E': g1 = rnd(11, 99); g2 = rnd(1, 9); break;
        case 'TE+TE': g1 = rnd(11, 99); g2 = rnd(11, 99); break;
        case 'H+H': g1 = rnd(1, 9) * 100; g2 = rnd(1, 9) * 100; break;
        case 'HT+HT': g1 = rnd(10, 99) * 10; g2 = rnd(10, 99) * 10; break;
        case 'HTE+HTE': g1 = rnd(100, 999); g2 = rnd(100, 999); break;
      }
      op = cfg.rekenType === 'beide' ? (Math.random() < 0.5 ? '+' : '-') : (cfg.rekenType === 'optellen' ? '+' : '-');
      if (op === '+') {
        while (g1 + g2 > maxGetal) { if (g1 > g2) g1 = Math.floor(g1 / 2); else g2 = Math.floor(g2 / 2); }
      } else {
        if (g1 < g2) [g1, g2] = [g2, g1];
        while (g1 > maxGetal) { g1 = Math.floor(g1 / 2); if (g1 < g2) [g1, g2] = [g2, g1]; }
      }
    } while (!checkBrug(g1, g2, op, cfg.rekenBrug || 'beide'));

    return { type: 'rekenen', getal1: g1, getal2: g2, operator: op };
  }

  function genereerTafelsom(cfg) {
    const lijst = cfg.gekozenTafels?.length ? cfg.gekozenTafels : [1];
    const tafel = lijst[Math.floor(Math.random() * lijst.length)] || 1;
    let op = cfg.tafelType === 'maal' ? 'x' : ':';
    if (cfg.tafelType === 'beide') op = Math.random() < 0.5 ? 'x' : ':';
    const volgorde = cfg.tafelsVolgorde || 'links';
    const metNul = !!cfg.tafelsMetNul;
    const randFactor = () => metNul ? Math.floor(Math.random() * 11) : (Math.floor(Math.random() * 10) + 1);
    if (op === 'x') {
      let orient = (volgorde === 'mix') ? (Math.random() < 0.5 ? 'links' : 'rechts') : volgorde;
      return orient === 'links'
        ? { type: 'tafels', getal1: tafel, getal2: randFactor(), operator: 'x' }
        : { type: 'tafels', getal1: randFactor(), getal2: tafel, operator: 'x' };
    }
    const g2 = tafel;
    const factor = Math.max(1, randFactor());
    const g1 = g2 * factor;
    return { type: 'tafels', getal1: g1, getal2: g2, operator: ':' };
  }

  // ========= SCHERM-RENDER =========
  function renderBlokOpScherm(cfg) {
    const card = document.createElement('section');
    card.style.border = '1px solid #b3e0ff';
    card.style.borderRadius = '12px';
    card.style.background = '#f8fcff';
    card.style.padding = '14px';
    card.style.margin = '12px 0';

    const title = document.createElement('h3');
    title.textContent = titelVoor(cfg);
    title.style.margin = '0 0 10px';
    title.style.color = '#003e7e';
    title.style.fontFamily = 'Arial,Helvetica,sans-serif';
    title.style.fontSize = '16px';
    title.style.fontWeight = '700';
    card.appendChild(title);

    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.alignItems = 'start';
    grid.style.justifyItems = 'center';

    const hulpGlobaal = !!(cfg.rekenHulp && cfg.rekenHulp.inschakelen);
    let kolommen = 4, colGap = '24px', rowGap = '24px';
    if (cfg.hoofdBewerking === 'rekenen' && hulpGlobaal) { kolommen = 2; colGap = '48px'; rowGap = '36px'; }
    if (cfg.hoofdBewerking === 'splitsen' && cfg.splitsStijl === 'bewerkingen4') { kolommen = 3; colGap = '40px'; rowGap = '56px'; }
    if (cfg.hoofdBewerking === 'splitsen' && cfg.splitsStijl === 'puntoefening') { kolommen = 3; colGap = '30px'; rowGap = '22px'; }

    grid.style.gridTemplateColumns = `repeat(${kolommen}, minmax(0, 1fr))`;
    grid.style.columnGap = colGap; grid.style.rowGap = rowGap;
    card.appendChild(grid);
    werkbladContainer.appendChild(card);

    if (cfg.hoofdBewerking === 'splitsen' && cfg.groteSplitshuizen) {
      const lijst = cfg.splitsGetallenArray?.length ? cfg.splitsGetallenArray : [10];
      grid.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
      lijst.forEach(maxGetal => {
        const kaart = document.createElement('div');
        kaart.style.fontFamily = 'Arial,Helvetica,sans-serif';
        kaart.style.border = '1px solid #e5e5e5';
        kaart.style.borderRadius = '12px';
        kaart.style.overflow = 'hidden';
        kaart.style.width = '140px';
        kaart.style.background = '#fff';
        kaart.style.boxShadow = '0 1px 2px rgba(0,0,0,.06)';
        const header = document.createElement('div');
        header.textContent = maxGetal;
        header.style.background = '#e0f2f7';
        header.style.borderBottom = '1px solid #c7c7c7';
        header.style.textAlign = 'center';
        header.style.fontWeight = '700';
        header.style.height = '36px';
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.justifyContent = 'center';
        header.style.fontSize = '16px';
        kaart.appendChild(header);
        for (let r = 0; r <= maxGetal; r++) {
          const row = document.createElement('div');
          row.style.display = 'grid';
          row.style.gridTemplateColumns = '1fr 1fr';
          row.style.columnGap = '8px';
          row.style.padding = '0 10px';
          const left = document.createElement('div'); const right = document.createElement('div');
          [left,right].forEach(cell => { cell.style.height='28px'; cell.style.display='flex'; cell.style.alignItems='flex-end'; cell.style.justifyContent='center'; cell.style.paddingBottom='4px'; cell.style.borderBottom='2px solid #333'; cell.style.fontSize='16px'; cell.style.lineHeight='1';});
          left.textContent = r; right.textContent = '';
          row.appendChild(left); row.appendChild(right); kaart.appendChild(row);
        }
        const cell = document.createElement('div'); cell.className='oefening'; cell.style.overflow='visible'; cell.appendChild(kaart);
        grid.appendChild(cell);
      });
      return;
    }

    const N = cfg.numOefeningen ?? 20;
    const oefeningen = [];
    for (let i = 0; i < N; i++) {
      if (cfg.hoofdBewerking === 'rekenen') oefeningen.push(genereerRekensom(cfg));
      else if (cfg.hoofdBewerking === 'splitsen') {
        if (cfg.splitsStijl === 'puntoefening') { const s = genereerSplitsing(cfg); s._p = true; oefeningen.push(s); }
        else if (cfg.splitsStijl === 'bewerkingen4') { const s = genereerSplitsing(cfg); s._b4 = true; oefeningen.push(s); }
        else oefeningen.push(genereerSplitsing(cfg));
      } else if (cfg.hoofdBewerking === 'tafels') oefeningen.push(genereerTafelsom(cfg));
    }

    oefeningen.forEach(oef => {
      const div = document.createElement('div');
      div.className = 'oefening';
      div.style.width = '100%';
      div.style.fontFamily = 'Arial,Helvetica,sans-serif';
      div.style.fontSize = '14px';
      div.style.overflow = 'visible';

      if (oef.type === 'rekenen') {
        const hulpActief = !!(cfg.rekenHulp && cfg.rekenHulp.inschakelen);
        const isBrugSom = somHeeftBrug(oef.getal1, oef.getal2, oef.operator);
        if (hulpActief && isBrugSom) {
          div.style.display='grid'; div.style.gridTemplateColumns='auto 1fr'; div.style.columnGap='24px'; div.style.alignItems='start';
          const links = document.createElement('div'); links.style.position='relative'; links.style.display='inline-block'; links.style.overflow='visible';
          links.innerHTML = `
            <span class="term1">${oef.getal1}</span>
            <span class="op"> ${oef.operator} </span>
            <span class="term2">${oef.getal2}</span>
            <span> = </span>
            <span class="ansbox" style="display:inline-block;width:46px;height:30px;border:2px solid #333;border-radius:8px;vertical-align:middle;margin-left:6px;"></span>
          `;
          const rechts = document.createElement('div'); rechts.className='lijnenrechts'; rechts.style.overflow='visible';
          rechts.innerHTML = `
            <div style="border-bottom:2px solid #333;height:18px;margin:8px 0;width:260px;max-width:100%"></div>
            <div style="border-bottom:2px solid #333;height:18px;margin:8px 0;width:260px;max-width:100%"></div>
          `;
          div.append(links, rechts); grid.appendChild(div);
          requestAnimationFrame(() => tekenInlineSplitsOnderTerm(links, oef, rechts, cfg));
        } else {
          div.textContent = `${oef.getal1} ${oef.operator} ${oef.getal2} = ___`;
          grid.appendChild(div);
        }

      } else if (oef.type === 'splitsen') {
        const isSom = !!oef.isSom;

        if (cfg.splitsStijl === 'puntoefening') {
          div.style.fontFamily = "'Courier New', Courier, monospace";
          div.style.fontSize = '1.2em';
          div.style.textAlign = 'center';
          div.textContent = `${oef.totaal} = ___ + ___`;
          grid.appendChild(div);

        } else if (cfg.splitsStijl === 'bewerkingen4') {
          const wrap = document.createElement('div');
          wrap.style.display = 'grid';
          wrap.style.gridTemplateColumns = '1fr';
          wrap.style.rowGap = '14px'; // extra ruimte

          const top = document.createElement('div');
          const L = isSom ? oef.deel1 : (oef.prefill==='links'?oef.deel1:'___');
          const R = isSom ? oef.deel2 : (oef.prefill==='rechts'?oef.deel2:'___');
          const T = isSom ? '___' : oef.totaal;
          top.style.textAlign = 'center';
          top.innerHTML = `<span style="background:#e0f2f7;border:1px solid #9cc; padding:2px 8px; border-radius:8px; font-weight:700">${T}</span>
                           <span style="display:inline-block; width:28px"></span>
                           <span style="border:1px solid #ddd; padding:2px 8px; border-radius:6px">${L}</span>
                           <span style="display:inline-block; width:10px"></span>
                           <span style="border:1px solid #ddd; padding:2px 8px; border-radius:6px">${R}</span>`;
          wrap.appendChild(top);

          const eq = document.createElement('div');
          eq.style.fontFamily = "'Courier New', Courier, monospace";
          eq.style.fontSize = '1.08em';
          eq.style.lineHeight = '2.8'; // ruimer
          eq.style.textAlign = 'center';
          eq.innerHTML = `___ + ___ = ___<br>___ + ___ = ___<br>___ - ___ = ___<br>___ - ___ = ___`;
          wrap.appendChild(eq);

          div.appendChild(wrap);
          grid.appendChild(div);

        } else if (cfg.splitsStijl === 'huisje') {
          const huis = document.createElement('div'); huis.className='splitshuis'; huis.style.margin='6px'; huis.style.overflow='visible';
          huis.innerHTML = `
            <div class="dak">${isSom ? '___' : oef.totaal}</div>
            <div class="kamers"><div class="kamer">${isSom ? oef.deel1 : (oef.prefill==='links'?oef.deel1:'___')}</div>
            <div class="kamer">${isSom ? oef.deel2 : (oef.prefill==='rechts'?oef.deel2:'___')}</div></div>
          `;
          div.style.display='flex'; div.style.justifyContent='center'; div.appendChild(huis); grid.appendChild(div);

        } else { // benen
          const wrap = document.createElement('div'); wrap.className='splitsbenen'; wrap.style.overflow='visible';
          wrap.innerHTML = `
            <div class="top">${isSom ? '___' : oef.totaal}</div>
            <div class="benen-container"><div class="been links"></div><div class="been rechts"></div></div>
            <div class="bottom">
              <div class="bottom-deel">${isSom ? oef.deel1 : (oef.prefill==='links'?oef.deel1:'___')}</div>
              <div class="bottom-deel">${isSom ? oef.deel2 : (oef.prefill==='rechts'?oef.deel2:'___')}</div>
            </div>`;
          div.style.display='flex'; div.style.justifyContent='center'; div.appendChild(wrap); grid.appendChild(div);
        }

      } else { // tafels
        div.textContent = `${oef.getal1} ${oef.operator} ${oef.getal2} = ___`;
        grid.appendChild(div);
      }
    });
  }

  // ====== BENEN tekenen onder term (scherm) ======
  function tekenInlineSplitsOnderTerm(exprWrap, oef, rechtsKolom, cfg) {
    const span1 = exprWrap.querySelector('.term1');
    const span2 = exprWrap.querySelector('.term2');
    const ansBox = exprWrap.querySelector('.ansbox');
    let target = span2; // optellen: onder tweede term
    if (oef.operator === '-') {
      const plaats = (cfg.rekenHulp?.splitsPlaatsAftrekken || 'onderAftrektal');
      target = (plaats === 'onderAftrekker') ? span2 : span1;
    }
    const oefDiv = exprWrap.closest('.oefening');
    if (oefDiv) { oefDiv.style.overflow = 'visible'; oefDiv.style.position = 'relative'; }
    exprWrap.style.overflow = 'visible'; exprWrap.style.position = 'relative';
    werkbladContainer.style.overflow = 'visible';

    const wrapRect = exprWrap.getBoundingClientRect();
    const tRect = target.getBoundingClientRect();
    const aRect = ansBox.getBoundingClientRect();
    const anchorX = tRect.left + tRect.width / 2 - wrapRect.left;
    const apexY = tRect.bottom - wrapRect.top + 3;

    const horiz = 14, boxW = 26, boxH = 22, r = 6;
    const bottomTopY = apexY + 12;
    const svgH = Math.ceil(bottomTopY + boxH + 6);
    const baseW = Math.max(exprWrap.clientWidth, exprWrap.scrollWidth);
    const svgW = Math.max(baseW, anchorX + horiz + boxW / 2 + 4);

    if (parseFloat(getComputedStyle(exprWrap).minHeight || '0') < svgH) exprWrap.style.minHeight = `${svgH}px`;
    exprWrap.style.paddingBottom = '2px';

    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', svgW); svg.setAttribute('height', svgH);
    svg.style.position='absolute'; svg.style.left='0'; svg.style.top='0'; svg.style.pointerEvents='none'; svg.style.overflow='visible';

    const el = (n,a)=>{const e=document.createElementNS(NS,n);for(const k in a)e.setAttribute(k,a[k]);return e;};
    svg.appendChild(el('line',{x1:anchorX,y1:apexY,x2:anchorX-horiz,y2:bottomTopY,stroke:'#333','stroke-width':2}));
    svg.appendChild(el('line',{x1:anchorX,y1:apexY,x2:anchorX+horiz,y2:bottomTopY,stroke:'#333','stroke-width':2}));
    svg.appendChild(el('rect',{x:anchorX-horiz-boxW/2,y:bottomTopY,width:boxW,height:boxH,rx:r,ry:r,fill:'#fff',stroke:'#ddd','stroke-width':2}));
    svg.appendChild(el('rect',{x:anchorX+horiz-boxW/2,y:bottomTopY,width:boxW,height:boxH,rx:r,ry:r,fill:'#fff',stroke:'#ddd','stroke-width':2}));
    const t1=el('text',{x:anchorX-horiz,y:bottomTopY+boxH-6,'text-anchor':'middle','font-family':'Arial,Helvetica,sans-serif','font-size':'14'});t1.textContent='___';
    const t2=el('text',{x:anchorX+horiz,y:bottomTopY+boxH-6,'text-anchor':'middle','font-family':'Arial,Helvetica,sans-serif','font-size':'14'});t2.textContent='___';
    svg.appendChild(t1); svg.appendChild(t2);
    exprWrap.appendChild(svg);

    if (rechtsKolom) {
      const rechtsRect = rechtsKolom.getBoundingClientRect();
      const ansCenterX = aRect.left + aRect.width / 2;
      const offset = Math.max(0, ansCenterX - rechtsRect.left + 6);
      rechtsKolom.style.paddingLeft = `${offset}px`;
    }
  }

  // ========= PDF HELPERS =========
  function drawRekensomInPDF(doc, x, y, oef) {
    doc.setFont('Helvetica','normal'); doc.setFontSize(14);
    doc.text(`${oef.getal1} ${oef.operator} ${oef.getal2} = ___`, x, y);
  }
  function drawSplitsHuisPDF(doc, centerX, y, oef) {
    const r=1, breedte=36, hoogteDak=12, hoogteKamer=14;
    const left = centerX - breedte/2;
    const topText = oef.isSom ? '___' : String(oef.totaal);
    const L = oef.isSom ? String(oef.deel1) : (oef.prefill==='links' ? String(oef.deel1) : '___');
    const R = oef.isSom ? String(oef.deel2) : (oef.prefill==='rechts'? String(oef.deel2) : '___');
    const dakBaseline = y + hoogteDak - 3, kamerBaseline = yy => yy + hoogteKamer - 2;
    doc.setLineWidth(0.5); doc.setDrawColor(51,51,51); doc.setFillColor(224,242,247);
    doc.roundedRect(left, y, breedte, hoogteDak, r, r, 'FD');
    const yKamers = y + hoogteDak;
    doc.setDrawColor(204,204,204); doc.roundedRect(left, yKamers, breedte, hoogteKamer, r, r, 'D');
    doc.line(centerX, yKamers, centerX, yKamers + hoogteKamer);
    doc.setFont('Helvetica','bold'); doc.setFontSize(14); doc.text(topText, centerX, dakBaseline, {align:'center'});
    doc.setFont('Helvetica','normal'); doc.setFontSize(14);
    doc.text(L, centerX - breedte/4, kamerBaseline(yKamers), {align:'center'});
    doc.text(R, centerX + breedte/4, kamerBaseline(yKamers), {align:'center'});
  }
  function drawSplitsBenenPDF(doc, centerX, y, oef) {
    const r=1.2, topW=14, topH=10, horiz=7, boxW=12, boxH=11;
    const topText = oef.isSom ? '___' : String(oef.totaal);
    const L = oef.isSom ? String(oef.deel1) : (oef.prefill==='links' ? String(oef.deel1) : '___');
    const R = oef.isSom ? String(oef.deel2) : (oef.prefill==='rechts'? String(oef.deel2) : '___');
    doc.setFillColor(224,242,247); doc.setDrawColor(51,51,51);
    doc.roundedRect(centerX-topW/2, y, topW, topH, r, r, 'FD');
    doc.setFont('Helvetica','bold'); doc.setFontSize(14); doc.text(topText, centerX, y+topH-3, {align:'center'});
    const bottomTopY = y + topH + 8;
    doc.line(centerX, y+topH, centerX-horiz, bottomTopY);
    doc.line(centerX, y+topH, centerX+horiz, bottomTopY);
    doc.setDrawColor(204,204,204);
    doc.roundedRect(centerX-horiz-boxW/2, bottomTopY, boxW, boxH, r, r, 'D');
    doc.roundedRect(centerX+horiz-boxW/2, bottomTopY, boxW, boxH, r, r, 'D');
    doc.setFont('Helvetica','normal'); doc.setFontSize(14);
    doc.text(L, centerX-horiz, bottomTopY+boxH-2, {align:'center'});
    doc.text(R, centerX+horiz, bottomTopY+boxH-2, {align:'center'});
  }
  function drawBrugHulpInPDF(doc, x, y, oef, cfg, colWidth) {
    doc.setFont('Helvetica','normal'); doc.setFontSize(14);
    const s1=String(oef.getal1), s2=String(oef.getal2);
    const w1=doc.getTextWidth(s1), w1sp=doc.getTextWidth(`${s1} `), wop=doc.getTextWidth(`${oef.operator} `), w2=doc.getTextWidth(s2);
    const somTekst = `${s1} ${oef.operator} ${s2} =`; doc.text(somTekst, x, y);
    const ansX = x + doc.getTextWidth(somTekst) + 2, ansW = 16, ansH=12;
    doc.setDrawColor(51,51,51); doc.roundedRect(ansX, y-(ansH-2), ansW, ansH, 1.5, 1.5, 'D');
    let centerX = (oef.operator === '+') ? (x + w1sp + wop + (w2/2))
      : ((cfg.rekenHulp?.splitsPlaatsAftrekken || 'onderAftrektal') === 'onderAftrekker' ? (x + w1sp + wop + (w2/2)) : (x + (w1/2)));
    const yLegStart = y + 3, bottomTopY = y + 12, horiz = 7;
    doc.setDrawColor(51,51,51);
    doc.line(centerX, yLegStart, centerX-horiz, bottomTopY);
    doc.line(centerX, yLegStart, centerX+horiz, bottomTopY);
    const boxW=12, boxH=11, r=1.2;
    doc.setDrawColor(204,204,204);
    doc.roundedRect(centerX-horiz-boxW/2, bottomTopY, boxW, boxH, r, r, 'D');
    doc.roundedRect(centerX+horiz-boxW/2, bottomTopY, boxW, boxH, r, r, 'D');
    doc.text('___', centerX-horiz, bottomTopY+boxH-2, {align:'center'});
    doc.text('___', centerX+horiz, bottomTopY+boxH-2, {align:'center'});
    if (cfg.rekenHulp?.schrijflijnen) {
      const RIGHT_SAFETY_GAP = 10;
      const startX = ansX + ansW/2 + 6;
      const maxRight = x + (colWidth || 92) - RIGHT_SAFETY_GAP;
      const lengte = Math.max(22, maxRight - startX);
      doc.setDrawColor(51,51,51);
      doc.line(startX, y+10, startX+lengte, y+10);
      doc.line(startX, y+22, startX+lengte, y+22);
    }
  }

  // bewerkingen4 – minisplitsing + 4 BLANCO bewerkingen (ruim)
  function drawB4ItemPDF(doc, centerX, y, oef) {
    // mini-splitsing
    drawSplitsBenenPDF(doc, centerX, y, { ...oef, isSom: false });
    // bewerkingen – starten duidelijk lager
    const startY = y + 24, lh = 9; // ruimer dan voorheen
    doc.setFont('Courier','normal'); doc.setFontSize(12);
    doc.text(`___ + ___ = ___`, centerX, startY + 0*lh, {align:'center'});
    doc.text(`___ + ___ = ___`, centerX, startY + 1*lh, {align:'center'});
    doc.text(`___ - ___ = ___`, centerX, startY + 2*lh, {align:'center'});
    doc.text(`___ - ___ = ___`, centerX, startY + 3*lh, {align:'center'});
  }

  // ========= PDF-GENERATOR met nette segment-kaders =========
  function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageHeight = doc.internal.pageSize.getHeight();

    function pdfHeader(titleText) {
      const xName = LEFT_PUNCH_MARGIN, yName = 15;
      doc.setFont('Helvetica','normal'); doc.setFontSize(12);
      doc.text('Naam:', xName, yName);
      const wNaam = doc.getTextWidth('Naam:');
      doc.setDrawColor(51,51,51);
      doc.line(xName + wNaam + 3, yName, xName + wNaam + 83, yName);
      doc.setFont('Helvetica','bold'); doc.setFontSize(16);
      doc.text(titleText, 105, 25, { align: 'center' });
    }

    pdfHeader('Werkblad Bewerkingen');

    // lay-out per type
    function layoutVoor(cfg) {
      const insetX = LEFT_PUNCH_MARGIN + 16; // veilige binnenmarge t.o.v. kader
      // default (huisje/benen)
      let xCols = [insetX, insetX + 50, insetX + 100, insetX + 150];
      let yInc = 36, itemH = 32, colWidth = 44;

      if (cfg.hoofdBewerking === 'rekenen' && cfg.rekenHulp?.inschakelen) {
        xCols = [insetX, insetX + 100];
        yInc = 60; itemH = 54; colWidth = 92;
      }
      if (cfg.hoofdBewerking === 'splitsen') {
        if (cfg.splitsStijl === 'puntoefening') {
          // 3 per rij
          xCols = [insetX, insetX + 70, insetX + 140];
          yInc = 20; itemH = 16; colWidth = 60;
        } else if (cfg.splitsStijl === 'bewerkingen4') {
          xCols = [insetX + 15, insetX + 75, insetX + 135];
          yInc = 68; itemH = 64; // ruim – voorkomt overlap
        }
      }
      return { xCols, yInc, itemH, colWidth, insetX };
    }

    // Kader per segment – ruimere padding
    function tekenSegmentKader(topY, bottomY) {
      const x = LEFT_PUNCH_MARGIN + 6;               // linker binnenmarge
      const w = 210 - LEFT_PUNCH_MARGIN - 16;        // rechter binnenmarge
      doc.setDrawColor(179,224,255);
      doc.roundedRect(x, topY, w, Math.max(8, bottomY - topY), 3, 3, 'D');
    }

    let yCursor = 35;

    // Per blok
    for (let i = 0; i < bundel.length; i++) {
      const cfg = bundel[i].settings || bundel[i];

      const { xCols, yInc, itemH, colWidth } = layoutVoor(cfg);

      // Oefeningen genereren
      const N = cfg.numOefeningen ?? 20;
      const oefeningen = [];
      for (let k = 0; k < N; k++) {
        if (cfg.hoofdBewerking === 'rekenen') oefeningen.push(genereerRekensom(cfg));
        else if (cfg.hoofdBewerking === 'splitsen') {
          const s = genereerSplitsing(cfg);
          s._p = cfg.splitsStijl === 'puntoefening';
          s._b4 = cfg.splitsStijl === 'bewerkingen4';
          oefeningen.push(s);
        } else if (cfg.hoofdBewerking === 'tafels') oefeningen.push(genereerTafelsom(cfg));
      }

      // Titel + start segment
      function nieuwePagina(metTitel=true) {
        doc.addPage(); pdfHeader('Werkblad Bewerkingen (vervolg)');
        yCursor = 35;
        if (metTitel) {
          doc.setFont('Helvetica','bold'); doc.setFontSize(14);
          doc.text(titelVoor(cfg), LEFT_PUNCH_MARGIN + 8, yCursor + 6);
          yCursor += 14; // iets meer ruimte onder titel
        }
      }
      // plaats titel
      if (yCursor + 14 > pageHeight - PDF_BOTTOM_SAFE) nieuwePagina();
      doc.setFont('Helvetica','bold'); doc.setFontSize(14);
      doc.text(titelVoor(cfg), LEFT_PUNCH_MARGIN + 8, yCursor + 6);
      yCursor += 14;

      let topSegment = yCursor + 2;        // extra bovenmarge binnen het kader
      let row = 0, col = 0, y = yCursor + 6;
      let lastYPlaced = y;                 // voor correcte onderrand

      const plaatsItem = (oef) => {
        const x = xCols[col];
        if (cfg.hoofdBewerking === 'rekenen') {
          const hulp = !!(cfg.rekenHulp && cfg.rekenHulp.inschakelen);
          const isBrugSom = somHeeftBrug(oef.getal1, oef.getal2, oef.operator);
          if (hulp && isBrugSom) drawBrugHulpInPDF(doc, x, y, oef, cfg, colWidth);
          else drawRekensomInPDF(doc, x, y, oef);
        } else if (cfg.hoofdBewerking === 'splitsen') {
          if (cfg.splitsStijl === 'puntoefening') {
            doc.setFont('Courier','normal'); doc.setFontSize(14);
            doc.text(`${oef.totaal} = ___ + ___`, x - 4, y);
          } else if (cfg.splitsStijl === 'bewerkingen4') {
            drawB4ItemPDF(doc, x, y, oef);
          } else if (cfg.splitsStijl === 'huisje') {
            drawSplitsHuisPDF(doc, x, y, oef);
          } else {
            drawSplitsBenenPDF(doc, x, y, oef);
          }
        } else if (cfg.hoofdBewerking === 'tafels') {
          drawRekensomInPDF(doc, x, y, { getal1: oef.getal1, operator: oef.operator, getal2: oef.getal2 });
        }
        lastYPlaced = y; // onthoud laatst geplaatste y
      };

      for (let idx = 0; idx < oefeningen.length; idx++) {
        // paginawissel?
        if (y + itemH > pageHeight - PDF_BOTTOM_SAFE) {
          // sluit huidig segment
          tekenSegmentKader(topSegment, lastYPlaced + itemH - 2);
          // nieuwe pagina + titel + nieuw segment
          nieuwePagina();
          topSegment = yCursor + 2;
          row = 0; col = 0; y = yCursor + 6; lastYPlaced = y;
        }
        plaatsItem(oefeningen[idx]);
        col++;
        if (col >= xCols.length) { col = 0; row++; y = yCursor + 6 + row * yInc; }
      }

      // sluit laatste segment van dit blok
      tekenSegmentKader(topSegment, lastYPlaced + itemH - 2);

      // ruimte vóór volgend blok
      yCursor = lastYPlaced + itemH + 10;
      if (yCursor > pageHeight - PDF_BOTTOM_SAFE) nieuwePagina(false);
    }

    doc.save('bewerkingen_werkblad.pdf');
  }

  // ========= START =========
  try {
    werkbladContainer.innerHTML = '';
    bundel.forEach(item => renderBlokOpScherm(item.settings || item));
    downloadPdfBtn?.addEventListener('click', downloadPDF);
    if (downloadPdfBtn) {
      downloadPdfBtn.disabled = false;
      downloadPdfBtn.style.backgroundColor = '';
      downloadPdfBtn.style.cursor = 'pointer';
    }
  } catch (e) {
    toonFout("Fout: Kon werkblad niet maken.\n" + e.message);
  }

  function toonFout(msg) {
    if (werkbladContainer) {
      werkbladContainer.innerHTML = `<p style="color:#a33;font-weight:700">${msg}</p>`;
    }
  }
});
