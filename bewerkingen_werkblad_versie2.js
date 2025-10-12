document.addEventListener("DOMContentLoaded", () => {
  // Uniek ID per selectie (zorgt dat elk blok z'n eigen titel krijgt)

  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  const opnieuwBtn = document.getElementById('opnieuwBtn');
  const werkbladContainer = document.getElementById('werkblad-container');

  // ==== PDF marges ====
  const LEFT_PUNCH_MARGIN = 16; // mm – perforatiemarge links
  const INNER_PAD = 12;
  const PDF_BOTTOM_SAFE = 2;
  const SEGMENT_GAP = 6; // verticale ruimte tussen 2 opdrachten/segmenten

  // vaste breedte voor de kaders van 'rekenen zonder hulp' (mm)
  const BOXED_REKEN_W = 50;

  // ==== specifieke inspringingen per oefeningstype (mm) ====
  const PAD_HUISJE     = 14;
  const PAD_BENEN      = 10;
  const PAD_PUNTOEF    = 10;   // mag wat kleiner zodat ze beter in kolomkaders vallen
  const PAD_BEWERKING4 = 6;    // iets naar rechts, maar niet zo ver als huisjes

  // Voor de preview-paginering (scherm)
  // mm → px (96 dpi ~ 3.78 px/mm)
  const MM2PX = 3.78;
  const PAGE_W_PX = 210 * MM2PX;   // 794 px
  const PAGE_H_PX = 297 * MM2PX;   // 1122 px

  // Zet marges op de pagina in px (houd in de buurt van je PDF marges) – globaal nodig voor paginatePreview()
window.PREVIEW_TOP_PX    = (typeof window.PREVIEW_TOP_PX    === 'number') ? window.PREVIEW_TOP_PX    : 90; // ~24 mm
window.PREVIEW_BOTTOM_PX = (typeof window.PREVIEW_BOTTOM_PX === 'number') ? window.PREVIEW_BOTTOM_PX : 90; // ~24 mm

// standaard ruimte tussen segmenten (mag lokaal blijven)
let PREVIEW_SEG_GAP_PX = 24;

  opnieuwBtn?.addEventListener('click', () => {
    window.location.href = 'bewerkingen_keuze_versie2.html';
  });


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
  return op === '+'
    ? ((g1 % 10) + (g2 % 10) > 10)   // ← was > 9, nu strikt OVER het tiental
    : ((g1 % 10) < (g2 % 10));
}

  function checkBrug(g1, g2, op, brugType) {
    if (brugType === 'beide') return true;
    const heeftBrug = somHeeftBrug(g1, g2, op);
    return (brugType === 'met' && heeftBrug) || (brugType === 'zonder' && !heeftBrug);
  }
  function titelVoor(cfg) {
  // Handmatige opdrachtzin heeft altijd voorrang
  if (cfg.opdracht && cfg.opdracht.trim()) return cfg.opdracht.trim();

  if (cfg.hoofdBewerking === 'splitsen') {
    if (cfg.splitsStijl === 'puntoefening') return 'Vul de splitsing aan.';
    if (cfg.splitsStijl === 'bewerkingen4') return 'Splits en maak de 4 bewerkingen.';
    if (cfg.splitsStijl === 'huisje') return 'Vul het splitshuis correct in.';
    return 'Vul de splitsbenen correct in.';
  }

  if (cfg.hoofdBewerking === 'tafels') return 'Los de tafel-oefeningen op.';

  if (cfg.hoofdBewerking === 'rekenen') {
    const type = cfg.rekenType || 'beide';     // 'optellen' | 'aftrekken' | 'beide'
    const brug = cfg.rekenBrug || 'beide';     // 'met' | 'zonder' | 'beide'
    const brugTxt = brug === 'met' ? ' met brug' : (brug === 'zonder' ? ' zonder brug' : '');
    if (type === 'optellen')  return 'Los de optelsommen op'  + brugTxt + '.';
    if (type === 'aftrekken') return 'Los de aftreksommen op' + brugTxt + '.';
    return 'Los de sommen (optellen en aftrekken) op' + brugTxt + '.';
  }

  return 'Oefeningen';
}

  // ========= GENERATOREN =========
  function genereerSplitsing(settings) {
    const fijn = settings.splitsFijn || {};
    const totalen = new Set();

    // Vinkjes vertalen naar toegestane totalen
    if (fijn.tot5) [1,2,3,4,5].forEach(n => totalen.add(n));
    if (fijn.van6)  totalen.add(6);
    if (fijn.van7)  totalen.add(7);
    if (fijn.van8)  totalen.add(8);
    if (fijn.van9)  totalen.add(9);
    if (fijn.van10) totalen.add(10);
    if (fijn.van10tot20) for (let n = 10; n <= 20; n++) totalen.add(n);

    // Fallback als er niets aangevinkt is: gebruik je oude instelling
    if (totalen.size === 0) {
      const arr = settings.splitsGetallenArray?.length ? settings.splitsGetallenArray : [10];
      const g = arr[Math.floor(Math.random() * arr.length)];
      totalen.add(Math.max(1, Math.floor(Math.random() * g) + 1));
    }

    // Kies totaal
    const lijst = Array.from(totalen);
    const totaal = lijst[Math.floor(Math.random() * lijst.length)];

    // Kies een splitsing (deel1 + deel2 = totaal)
    let d1 = Math.floor(Math.random() * (totaal + 1));
    let d2 = totaal - d1;

    // Brug-filter enkel voor 10..20 wanneer gekozen
    const brugKeuze =
      (fijn.van10tot20 && totaal >= 10 && totaal <= 20) ? (fijn.brug10tot20 || 'beide') : 'beide';
    const metBrug = (x, y) => ((x % 10) + (y % 10)) > 9;

    if ((brugKeuze === 'met' || brugKeuze === 'zonder') && totaal >= 10 && totaal <= 20) {
      const wilMet = brugKeuze === 'met';
      let tries = 0;
      while (tries++ < 60 && (metBrug(d1, d2) !== wilMet)) {
        d1 = Math.floor(Math.random() * (totaal + 1));
        d2 = totaal - d1;
      }
    }

    // 1 been vooraf invullen (de andere blijft ___)
    const prefill = Math.random() < 0.5 ? 'links' : 'rechts';

    // optioneel: som-opgave (als je optie aanstaat)
    const isSom = !!settings.splitsSom && Math.random() < 0.3;

    return { type: 'splitsen', isSom, totaal, deel1: d1, deel2: d2, prefill };
  }

  function genereerRekensom(cfg) {
    const types = cfg.somTypes?.length ? cfg.somTypes : ['E+E'];
    const gekozenType = types[Math.floor(Math.random() * types.length)];
    const maxGetal = cfg.rekenMaxGetal || 100;
    let g1, g2, op, pogingen = 0;

    do {
      pogingen++;
      if (pogingen > 120) {
        throw new Error(`Kon geen som genereren voor type ${gekozenType} met operator ${op} en brug-keuze "${cfg.rekenBrug}".`);
      }
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

    // EXTRA FILTER: voor compenseren enkel wanneer eenheden van de 2e term 7/8/9 zijn (en tot 100)
    if (cfg.rekenHulp && cfg.rekenHulp.inschakelen && cfg.rekenHulp.stijl === 'compenseren' && (cfg.rekenBrug || 'beide') !== 'zonder') {
      const eenheden2 = g2 % 10;
      const ok = (eenheden2 === 7 || eenheden2 === 8 || eenheden2 === 9);
      if (!ok || g1 > 100 || g2 > 100 || (op === '+' && (g1 + g2) > 100)) {
        // probeer opnieuw met dezelfde cfg
        return genereerRekensom(cfg);
      }
    }

    return { type: 'rekenen', getal1: g1, getal2: g2, operator: op };
  }

// Helper: maak enkel sommen geschikt voor compenseren (eenheden 7/8/9 in 2e term)
function genereerRekensomMetCompenseren(cfg){
  let tries = 0;
  while (tries++ < 500){
    const oef = genereerRekensom(cfg);
    const e2 = Math.abs(oef.getal2) % 10;
    if (e2===7 || e2===8 || e2===9) return oef;
  }
  return genereerRekensom(cfg);
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

 // grid = container in preview
// oefDiv = het DOM-blokje
// cfg    = settings van dit segment
// oef    = het oefening-object (kan null zijn bij "grote splitshuizen")
function appendWithDelete(grid, oefDiv, cfg, oef) {
  const del = document.createElement('div');
  del.className = 'del';
  del.textContent = '×';
  del.title = 'Verwijder oefening';

  del.addEventListener('click', (ev) => {
    ev.stopPropagation();

    // 1) uit de dataset (voor PDF)
    if (oef && Array.isArray(cfg._oefeningen)) {
      const i = cfg._oefeningen.indexOf(oef);
      if (i > -1) cfg._oefeningen.splice(i, 1);
    }

    // 2) uit de preview
    oefDiv.remove();

    // 3) paginering bijwerken
    if (typeof paginatePreview === 'function') paginatePreview();
  });

  oefDiv.appendChild(del);
  grid.appendChild(oefDiv);
}

  // ========= SCHERM-RENDER =========
  function renderBlokOpScherm(cfg) {
    // 1) Unieke sleutel per segmentsoort (gelijk aan PDF-logica)
    function segmentKey(c){
  return [
    // Uniek per keuze (als het meegegeven wordt vanuit het keuzescherm)
    c.segmentId || '',
    // Hoofdtype
    c.hoofdBewerking || '',
    // Rekenen: type én brug-keuze expliciet onderscheiden
    // - rekenType: 'optellen' | 'aftrekken' | 'beide'
    // - rekenBrug: 'met' | 'zonder' | 'beide'
    (c.isGemengd ? 'MIX' : (c.rekenType || c.operator || '')),
    c.rekenBrug || '',
    c.rekenStijl || '',     // bv. 'eerst10', 'compenseren' (voor later)
    // Splits/Tafels varianten
    c.splitsStijl || '',
    c.tafelType || '',
    // Groot/klein
    (c.groteSplitshuizen ? 'GROOT' : 'NORMAAL')
  ].join('|');
}
const segKey = segmentKey(cfg);

function renderOefeningInGrid(grid, cfg, oef) {
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
      div.style.display='grid'; div.style.gridTemplateColumns='max-content 1fr'; div.style.columnGap='24px'; div.style.alignItems='start';
      const links = document.createElement('div'); links.style.whiteSpace = 'nowrap';     // alles op 1 regel houden
links.style.wordBreak  = 'normal';     // geen hard breken binnen woorden/cijfers
links.style.width      = 'max-content';
links.style.position='relative'; links.style.display='inline-block'; links.style.overflow='visible';
      links.innerHTML = `
        <span class="term1">${oef.getal1}</span>
        <span class="op"> ${oef.operator} </span>
        <span class="term2">${oef.getal2}</span>
        <span> = </span>
        <span class="ansbox" style="display:inline-block;width:46px;height:30px;border:2px solid #333;border-radius:8px;vertical-align:middle;margin-left:6px;"></span>
      `;
      const rechts = document.createElement('div'); rechts.className='lijnenrechts'; rechts.style.overflow='visible';
      rechts.innerHTML = `
        <div style="border-bottom:2px solid #333;height:18px;margin:8px 0;width:160px;max-width:100%"></div>
        <div style="border-bottom:2px solid #333;height:18px;margin:8px 0;width:160px;max-width:100%"></div>
      `;
      div.append(links, rechts);
      appendWithDelete(grid, div, cfg, oef);
      requestAnimationFrame(() => { const stijl = (cfg.rekenHulp&&cfg.rekenHulp.stijl)||'splitsbenen'; if (stijl==='compenseren'){tekenCompenseerOnderTerm(links,oef,rechts,cfg);} else {tekenInlineSplitsOnderTerm(links,oef,rechts,cfg);} });
    } else {
      div.textContent = `${oef.getal1} ${oef.operator} ${oef.getal2} = ___`;
      appendWithDelete(grid, div, cfg, oef);
    }
    return;
  }

  if (oef.type === 'splitsen') {
    const isSom = !!oef.isSom;

    if (cfg.splitsStijl === 'puntoefening') {
      div.style.fontFamily = "'Courier New', Courier, monospace";
      div.style.fontSize = '1.2em';
      div.style.textAlign = 'center';
      let pText;
      if (oef.prefill === 'links')      pText = `${oef.totaal} = ${oef.deel1} + ___`;
      else if (oef.prefill === 'rechts')pText = `${oef.totaal} = ___ + ${oef.deel2}`;
      else                               pText = `${oef.totaal} = ___ + ___`;
      div.textContent = pText;
      appendWithDelete(grid, div, cfg, oef);
      return;
    }

    if (cfg.splitsStijl === 'bewerkingen4') {
      const wrap = document.createElement('div');
      wrap.style.display = 'grid';
      wrap.style.gridTemplateColumns = '1fr';
      wrap.style.rowGap = '14px';
      wrap.style.overflow = 'visible';

      const mini = document.createElement('div');
      mini.style.position = 'relative';
      mini.style.width = '160px';
      mini.style.height = '60px';
      mini.style.margin = '0 auto';
      mini.style.overflow = 'visible';

      const top = document.createElement('div');
      top.style.position = 'absolute';
      top.style.left = '50%';
      top.style.transform = 'translateX(-50%)';
      top.style.top = '0';
      top.style.width = '60px';
      top.style.height = '24px';
      top.style.border = '2px solid #333';
      top.style.borderRadius = '8px';
      top.style.background = '#e0f2f7';
      top.style.display = 'flex';
      top.style.alignItems = 'center';
      top.style.justifyContent = 'center';
      top.style.fontWeight = '700';
      top.textContent = (oef.isSom ? '___' : String(oef.totaal));
      mini.appendChild(top);

      const legLeft  = document.createElement('div');
      const legRight = document.createElement('div');
      [legLeft, legRight].forEach(l => { l.style.position='absolute'; l.style.width='2px'; l.style.background='#333'; l.style.height='28px'; l.style.top='24px'; });
      legLeft.style.left = 'calc(50% - 18px)'; legLeft.style.transform = 'skewX(-18deg)';
      legRight.style.left = 'calc(50% + 16px)';legRight.style.transform = 'skewX(18deg)';
      mini.appendChild(legLeft); mini.appendChild(legRight);

      const boxL = document.createElement('div'); const boxR = document.createElement('div');
      [boxL, boxR].forEach(b => { b.style.position='absolute'; b.style.width='44px'; b.style.height='24px'; b.style.border='2px solid #bbb'; b.style.borderRadius='8px'; b.style.bottom='0';
        b.style.display='flex'; b.style.alignItems='center'; b.style.justifyContent='center'; b.style.fontFamily="'Courier New', Courier, monospace"; b.style.fontSize='1.05em'; b.style.background='#fff';});
      boxL.style.left = 'calc(50% - 58px)'; boxR.style.left = 'calc(50% + 14px)';
      const L = oef.isSom ? String(oef.deel1) : (oef.prefill==='links' ? String(oef.deel1) : '___');
      const R = oef.isSom ? String(oef.deel2) : (oef.prefill==='rechts'? String(oef.deel2) : '___');
      boxL.textContent = L; boxR.textContent = R;
      mini.appendChild(boxL); mini.appendChild(boxR);

      wrap.appendChild(mini);

      const eq = document.createElement('div');
      eq.style.fontFamily = "'Courier New', Courier, monospace";
      eq.style.fontSize = '1.08em';
      eq.style.lineHeight = '2.8';
      eq.style.textAlign = 'center';
      eq.innerHTML = `___ + ___ = ___<br>___ + ___ = ___<br>___ - ___ = ___<br>___ - ___ = ___`;
      wrap.appendChild(eq);

      div.appendChild(wrap);
      appendWithDelete(grid, div, cfg, oef);
      return;
    }

    if (cfg.splitsStijl === 'huisje') {
      const huis = document.createElement('div');
      huis.className = 'splitshuis';
      huis.style.display = 'inline-grid';
      huis.style.gridTemplateColumns = '1fr 1fr';
      huis.style.border = '2px solid #333';
      huis.style.borderRadius = '6px';
      huis.style.overflow = 'hidden';
      huis.style.background = '#e0f2f7';
      huis.style.width = '72px';
      huis.style.textAlign = 'center';
      huis.style.fontWeight = '700';
      huis.style.fontSize = '15px';
      const top = document.createElement('div');
      top.style.gridColumn = '1 / span 2';
      top.style.borderBottom = '1px solid #999';
      top.style.padding = '2px 0';
      top.textContent = oef.isSom ? '___' : oef.totaal;
      huis.appendChild(top);
      const left = document.createElement('div');
      const right = document.createElement('div');
      left.textContent  = oef.isSom ? oef.deel1 : (oef.prefill==='links'?oef.deel1:'___');
      right.textContent = oef.isSom ? oef.deel2 : (oef.prefill==='rechts'?oef.deel2:'___');
      [left,right].forEach(c=>{ c.style.padding='4px 0'; c.style.borderTop='1px solid #ccc'; c.style.background='#fff';});
      huis.append(left,right);
      div.style.display='flex'; div.style.justifyContent='center';
      div.appendChild(huis);
      appendWithDelete(grid, div, cfg, oef);
      return;
    }

    // --- standaard: SPLITSBENEN ---
{
  const wrap = document.createElement('div');
  wrap.className = 'splitsbenen';
  wrap.style.overflow = 'visible';
  wrap.innerHTML = `
    <div class="top">${isSom ? '___' : String(oef.totaal)}</div>
    <div class="benen-container"><div class="been links"></div><div class="been rechts"></div></div>
    <div class="bottom">
      <div class="bottom-deel">${isSom ? String(oef.deel1) : (oef.prefill==='links' ? String(oef.deel1) : '___')}</div>
      <div class="bottom-deel">${isSom ? String(oef.deel2) : (oef.prefill==='rechts'? String(oef.deel2) : '___')}</div>
    </div>
  `;
  const div = document.createElement('div');
div.className = 'oefening';                     // ← belangrijk voor ronde X-knop
div.style.display = 'flex';
div.style.justifyContent = 'center';
div.style.overflow = 'visible';
div.appendChild(wrap);
appendWithDelete(grid, div, cfg, oef);
return;
}
  }

  // tafels
  div.textContent = `${oef.getal1} ${oef.operator} ${oef.getal2} = ___`;
  appendWithDelete(grid, div, cfg, oef);
}

    // 2) Bestaat dit segment al? -> append aan bestaand grid
    let card = werkbladContainer.querySelector(`section.preview-segment[data-segment-key="${segKey}"]`);
    let grid;

    if (!card) {
      // NIEUW segment
      card = document.createElement('section');
      card.className = 'preview-segment';
      card.dataset.segmentKey = segKey;
      card.style.border = '1px solid #b3e0ff';
      card.style.borderRadius = '12px';
      card.style.background = '#f8fcff';
      card.style.padding = '14px';
      card.style.margin = '12px 0';

      // Titel + tools
      // ── Header + tools altijd zichtbaar ─────────────────────────────
const header = document.createElement('div');
header.className = 'seg-header';
Object.assign(header.style, {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 8px 2px 8px',
  position: 'relative',
  zIndex: '10',
});

const title = document.createElement('h3');
title.textContent = titelVoor(cfg);
Object.assign(title.style, {
  margin: '0',
  fontSize: '18px',
  fontWeight: '700',
  color: '#0b4d7a',
});

// tools rechts van de titel
let tools = card.querySelector('.tools');
if (!tools) {
  tools = document.createElement('div');
  tools.className = 'tools';
  Object.assign(tools.style, {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    marginLeft: 'auto',
    position: 'relative',
    zIndex: '2000',
  });
  tools.innerHTML = `
    <button data-act="gap-dec">− ruimte</button>
    <button data-act="gap-inc">+ ruimte</button>
    <button data-act="edit">Titel</button>
    <button data-act="add">Voeg toe</button>
    <button data-act="del">Verwijder</button>
  `;
  // basisstijl zodat ze niet “verdwijnen”
  tools.querySelectorAll('button').forEach(b=>{
    Object.assign(b.style, {
      background:'#e0f2f7', border:'1px solid #ccd4da',
      borderRadius:'6px', padding:'4px 8px', fontSize:'13px', cursor:'pointer'
    });
    b.addEventListener('mouseenter',()=> b.style.background='#cfe8f2');
    b.addEventListener('mouseleave',()=> b.style.background='#e0f2f7');
  });
}

// acties
tools.addEventListener('click', (e) => {
  const btn = e.target.closest('button'); if (!btn) return;
  const act = btn.dataset.act;

  if (act === 'edit') {
    const nieuw = prompt('Opdrachtzin aanpassen:', title.textContent || '');
    if (nieuw !== null) { title.textContent = nieuw.trim(); cfg.opdracht = title.textContent; }
    paginatePreview();

  } else if (act === 'add') {
    if (cfg.hoofdBewerking === 'splitsen' && cfg.groteSplitshuizen) {
      alert('Bij grote splitshuizen wordt het aantal kolommen bepaald door je gekozen getallenlijst.');
      return;
    }
    const invoer = prompt('Hoeveel oefeningen wil je toevoegen?', '4');
    const extra = Math.max(1, parseInt(invoer, 10) || 0);
    if (!Array.isArray(cfg._oefeningen)) cfg._oefeningen = [];
    for (let i = 0; i < extra; i++) {
      let oef;
      if (cfg.hoofdBewerking === 'rekenen') oef = genereerRekensom(cfg);
      else if (cfg.hoofdBewerking === 'splitsen') { oef = genereerSplitsing(cfg);
        if (cfg.splitsStijl === 'puntoefening')  oef._p = true;
        if (cfg.splitsStijl === 'bewerkingen4')  oef._b4 = true;
      } else if (cfg.hoofdBewerking === 'tafels') oef = genereerTafelsom(cfg);
      if (oef) { cfg._oefeningen.push(oef); renderOefeningInGrid(grid, cfg, oef); }
    }
    paginatePreview();

  } else if (act === 'del') {
    card.remove(); paginatePreview();

  } else if (act === 'gap-inc') {
    PREVIEW_SEG_GAP_PX = Math.min(PREVIEW_SEG_GAP_PX + 4, 64);
    card.style.marginBottom = PREVIEW_SEG_GAP_PX + 'px'; paginatePreview();

  } else if (act === 'gap-dec') {
    PREVIEW_SEG_GAP_PX = Math.max(PREVIEW_SEG_GAP_PX - 4, 0);
    card.style.marginBottom = PREVIEW_SEG_GAP_PX + 'px'; paginatePreview();
  }
});

card.style.overflow = 'visible';
header.append(title, tools);
card.prepend(header);

      // Grid binnen segment
      grid = document.createElement('div');
grid.className = 'preview-grid';
grid.style.alignItems = 'start';
grid.style.justifyItems = 'center';

const hulpGlobaal = !!(cfg.rekenHulp && cfg.rekenHulp.inschakelen);
let kolommen = 4, colGap = '24px', rowGap = '24px';

// Rekenen met hulp = 2 brede kolommen (ongewijzigd)
if (cfg.hoofdBewerking === 'rekenen' && hulpGlobaal) {
  kolommen = 2; colGap = '48px'; rowGap = '36px';
// Rekenen zonder hulp = 3 per rij (zoals PDF)
} else if (cfg.hoofdBewerking === 'rekenen' && !hulpGlobaal) {
  kolommen = 3; colGap = '32px'; rowGap = '20px';
}

// Splitsen varianten (ongewijzigd)
if (cfg.hoofdBewerking === 'splitsen' && cfg.splitsStijl === 'bewerkingen4') { kolommen = 3; colGap = '40px'; rowGap = '56px'; }
if (cfg.hoofdBewerking === 'splitsen' && cfg.splitsStijl === 'puntoefening') { kolommen = 3; colGap = '30px'; rowGap = '22px'; }

grid.style.gridTemplateColumns = `repeat(${kolommen}, minmax(0, 1fr))`;
grid.style.columnGap = colGap;
grid.style.rowGap = rowGap;
card.appendChild(grid);

      // marge onder segment in UI (komt overeen met SEGMENT_GAP in PDF)
      card.style.marginBottom = PREVIEW_SEG_GAP_PX + 'px';

      werkbladContainer.appendChild(card);
    } else {
      // BESTAAND segment: pak het bestaande grid
      grid = card.querySelector('.preview-grid');
      if (!grid) {
        grid = document.createElement('div');
        grid.className = 'preview-grid';
        card.appendChild(grid);
      }
    }

    // ---- Oefeningen tekenen ----
    if (cfg.hoofdBewerking === 'splitsen' && cfg.groteSplitshuizen) {
  const lijst = cfg.splitsGetallenArray?.length ? cfg.splitsGetallenArray : [10];
  cfg._oefeningen = lijst.map(max => ({ type: 'GROOT', max }));
  grid.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';

  lijst.forEach((maxGetal, i) => {
    const oef = cfg._oefeningen[i];   // gebruik het bijbehorende object uit de dataset
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

    // --- Nieuw: afwisselend links/rechts vooraf invullen ---
    let fillLeft = true; // start links, volgende rij rechts, enz.
    for (let r = 0; r <= maxGetal; r++) {
      const row = document.createElement('div');
      row.style.display = 'grid';
      row.style.gridTemplateColumns = '1fr 1fr';
      row.style.columnGap = '8px';
      row.style.padding = '0 10px';

      const left  = document.createElement('div');
      const right = document.createElement('div');
      [left, right].forEach(cell => {
        cell.style.height='28px';
        cell.style.display='flex';
        cell.style.alignItems='flex-end';
        cell.style.justifyContent='center';
        cell.style.paddingBottom='4px';
        cell.style.borderBottom='2px solid #333';
        cell.style.fontSize='16px';
        cell.style.lineHeight='1';
      });

      if (fillLeft) {
        left.textContent = r;
        right.textContent = '';
      } else {
        left.textContent = '';
        right.textContent = r;
      }

      row.appendChild(left);
      row.appendChild(right);
      kaart.appendChild(row);

      fillLeft = !fillLeft; // wissel links/rechts voor volgende rij
    }

    const cell = document.createElement('div');
    cell.className = 'oefening';
    cell.style.overflow = 'visible';
    cell.appendChild(kaart);
    appendWithDelete(grid, cell, cfg, oef);  // geef dezelfde referentie door
  });

  return;
}

    const N = cfg.numOefeningen ?? 20;
    const oefeningen = [];
    for (let i = 0; i < N; i++) {
      if (cfg.hoofdBewerking === 'rekenen') { const comp = !!(cfg.rekenHulp && cfg.rekenHulp.stijl === 'compenseren'); oefeningen.push(comp ? genereerRekensomMetCompenseren(cfg) : genereerRekensom(cfg)); }
      else if (cfg.hoofdBewerking === 'splitsen') {
        if (cfg.splitsStijl === 'puntoefening') { const s = genereerSplitsing(cfg); s._p = true; oefeningen.push(s); }
        else if (cfg.splitsStijl === 'bewerkingen4') { const s = genereerSplitsing(cfg); s._b4 = true; oefeningen.push(s); }
        else oefeningen.push(genereerSplitsing(cfg));
      } else if (cfg.hoofdBewerking === 'tafels') oefeningen.push(genereerTafelsom(cfg));
    }

    // ✅ voeg deze regel exact hier toe:
cfg._oefeningen = oefeningen;
  if (cfg.rekenHulp && cfg.rekenHulp.voorbeeld && Array.isArray(cfg._oefeningen) && cfg._oefeningen.length) { cfg._oefeningen[0]._voorbeeld = true; }

  // Nieuwe, korte versie
oefeningen.forEach(oef => renderOefeningInGrid(grid, cfg, oef));

  }

 // ===== PREVIEW: BENEN tekenen onder juiste term (optellen/aftrekken) =====
// - Optellen: altijd onder term2
// - Aftrekken: onder aftrektal (term1), behalve als cfg.rekenHulp.splitsPlaatsAftrekken expliciet 'onderAftrekker' is
// - Antwoordvak blijft naast '=' (we positioneren absoluut, dus niet in de inline flow)
// - Werkt ook netjes bij ééncijferige termen (niet meer onder het '='-gedeelte)
// - Blauwe kaartkader pakt de benen mee door minHeight-reservering
// ===== PREVIEW: BENEN onder juiste term met offsetLeft/offsetTop =====
// ===== PREVIEW: BENEN onder juiste term, correct bij 1-cijferige termen =====
// ===== PREVIEW: BENEN onder juiste term (robuust, ook bij 1-cijferige termen) =====
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

 // === PDF: Groot splitshuis (dak + tabel) — SMALLER + afwisselend links/rechts per rij ===
function drawGrootSplitshuisKolomPDF(doc, xLeft, yTop, maxGetal, startLinks = true) {
  // SMALLER dimensies (alles in mm)
  const bodyW   = 38;         // was 52 → smaller
  const cellH   = 10.5;        // iets compacter per rij
  const rows    = maxGetal + 1;
  const bodyH   = rows * cellH;
  const roofH   = 15;         // iets lager dak
  const midX    = xLeft + bodyW / 2;
  const bodyTop = yTop + roofH;

  // --- Dak + topgetal ---
  doc.setDrawColor(200, 0, 0);
  doc.setLineWidth(0.6);
  doc.line(xLeft, bodyTop, midX, yTop);
  doc.line(midX, yTop, xLeft + bodyW, bodyTop);
  doc.line(xLeft, bodyTop, xLeft + bodyW, bodyTop);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(String(maxGetal), midX, bodyTop - 3.2, { align: 'center' });

  // --- Huis (rechthoek + middenlijn) ---
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.4);
  doc.rect(xLeft, bodyTop, bodyW, bodyH, 'D');
  doc.line(midX, bodyTop, midX, bodyTop + bodyH);

  // --- Raster + afwisseling per rij ---
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10.5);

  let fillLeft = !!startLinks; // eerste rij start links of rechts
  for (let r = 0; r < rows; r++) {
    const yRowTop = bodyTop + r * cellH;
    const yBaseline = yRowTop + cellH - 1.8; // tekst/lijn-baseline

    // binnen-horizontale rasterlijn (niet bovenrand)
    if (r > 0) doc.line(xLeft, yRowTop, xLeft + bodyW, yRowTop);

    if (fillLeft) {
      // getal links, invullijn rechts
      doc.text(String(r), xLeft + 2.8, yBaseline);
      doc.line(midX + 2.2, yBaseline - 0.2, xLeft + bodyW - 2.8, yBaseline - 0.2);
    } else {
      // invullijn links, getal rechts
      doc.line(xLeft + 2.8, yBaseline - 0.2, midX - 2.2, yBaseline - 0.2);
      doc.text(String(r), midX + 2.8, yBaseline);
    }

    fillLeft = !fillLeft; // wissel voor volgende rij
  }

  return roofH + bodyH + 2; // totale hoogte die we gebruikt hebben
}

  function drawSplitsHuisPDF(doc, centerX, y, oef) {
    // compacter huisje
    const r = 1, breedte = 32, hoogteDak = 10, hoogteKamer = 12;
    const left = centerX - breedte / 2;
    const topText = oef.isSom ? '___' : String(oef.totaal);
    const L = oef.isSom ? String(oef.deel1) : (oef.prefill === 'links'  ? String(oef.deel1) : '___');
    const R = oef.isSom ? String(oef.deel2) : (oef.prefill === 'rechts' ? String(oef.deel2) : '___');

    const dakBaseline   = y + hoogteDak - 2;
    const kamerBaseline = (yy) => yy + hoogteKamer - 2;

    doc.setLineWidth(0.5);
    doc.setDrawColor(51, 51, 51);
    doc.setFillColor(224, 242, 247);
    doc.roundedRect(left, y, breedte, hoogteDak, r, r, 'FD');

    const yKamers = y + hoogteDak;
    doc.setDrawColor(204, 204, 204);
    doc.roundedRect(left, yKamers, breedte, hoogteKamer, r, r, 'D');
    doc.line(centerX, yKamers, centerX, yKamers + hoogteKamer);

    doc.setFont('Helvetica', 'bold'); doc.setFontSize(13);
    doc.text(topText, centerX, dakBaseline, { align: 'center' });

    doc.setFont('Helvetica', 'normal'); doc.setFontSize(13);
    doc.text(L, centerX - breedte / 4, kamerBaseline(yKamers), { align: 'center' });
    doc.text(R, centerX + breedte / 4, kamerBaseline(yKamers), { align: 'center' });
  }

  function drawSplitsBenenPDF(doc, centerX, y, oef) {
    // compacter benen
    const r = 1.2, topW = 12, topH = 9, horiz = 6, boxW = 11, boxH = 10;
    const topText = oef.isSom ? '___' : String(oef.totaal);
    const L = oef.isSom ? String(oef.deel1) : (oef.prefill === 'links'  ? String(oef.deel1) : '___');
    const R = oef.isSom ? String(oef.deel2) : (oef.prefill === 'rechts' ? String(oef.deel2) : '___');

    doc.setFillColor(224, 242, 247);
    doc.setDrawColor(51, 51, 51);
    doc.roundedRect(centerX - topW / 2, y, topW, topH, r, r, 'FD');

    doc.setFont('Helvetica', 'bold'); doc.setFontSize(13);
    doc.text(topText, centerX, y + topH - 2, { align: 'center' });

    const bottomTopY = y + topH + 7;
    doc.line(centerX, y + topH, centerX - horiz, bottomTopY);
    doc.line(centerX, y + topH, centerX + horiz, bottomTopY);

    doc.setDrawColor(204, 204, 204);
    doc.roundedRect(centerX - horiz - boxW / 2, bottomTopY, boxW, boxH, r, r, 'D');
    doc.roundedRect(centerX + horiz - boxW / 2, bottomTopY, boxW, boxH, r, r, 'D');

    doc.setFont('Helvetica', 'normal'); doc.setFontSize(13);
    doc.text(L, centerX - horiz, bottomTopY + boxH - 2, { align: 'center' });
    doc.text(R, centerX + horiz, bottomTopY + boxH - 2, { align: 'center' });
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
      const RIGHT_SAFETY_GAP = 16;   // meer marge rechts
      const MAX_LEN          = 46;   // max. lijnlengte
      const startX = ansX + ansW/2 + 6;
      const maxRight = x + (colWidth || 92) - RIGHT_SAFETY_GAP;
      const lengte = Math.max(22, Math.min(MAX_LEN, maxRight - startX));
      doc.setDrawColor(51,51,51);
      doc.line(startX, y+10, startX+lengte, y+10);
      doc.line(startX, y+22, startX+lengte, y+22);
    }
    // Subtiel kader rond de volledige brug-oefening (links uitgelijnd)
    {
      const left   = x - 12;                 // iets minder naar links
      const top    = y - 12;                 // iets hoger geplaatst
      const width  = (colWidth || 92) + 0;   // vaste breedte
      const height = 38;                     // iets ruimer in de hoogte
      doc.setDrawColor(179, 224, 255);
      doc.roundedRect(left, top, width, height, 2, 2, 'D');
    }
  }

  // bewerkingen4 – minisplitsing + 4 BLANCO bewerkingen (ruim)
  function drawB4ItemPDF(doc, centerX, y, oef) {
    // 1) teken eerst de minisplitsing bovenaan
    drawSplitsBenenPDF(doc, centerX, y, { ...oef, isSom: false });

    // 2) lijnen duidelijk lager + extra tussenruimte
    const startY = y + 42;   // lager starten onder de minisplitsing
    const lh = 13;           // meer verticale ruimte tussen de regels

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(12);
    doc.text('___ + ___ = ___', centerX, startY + 0*lh, { align: 'center' });
    doc.text('___ + ___ = ___', centerX, startY + 1*lh, { align: 'center' });
    doc.text('___ - ___ = ___', centerX, startY + 2*lh, { align: 'center' });
    doc.text('___ - ___ = ___', centerX, startY + 3*lh, { align: 'center' });
  }

  function drawPuntKolomPDF(doc, xCenter, y, tekst) {
    const boxW = 45, boxH = 12, r = 3;
    const left = xCenter - boxW/2;
    doc.setDrawColor(200, 225, 245);
    doc.roundedRect(left, y - 9, boxW, boxH, r, r, 'D');
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(14);
    doc.text(tekst, xCenter, y, { align: 'center' });
  }

  // Tekent één som in een compact kader met vaste breedte
  function drawRekenItemBoxed(doc, xCenter, y, oef) {
    const text = `${oef.getal1} ${oef.operator} ${oef.getal2} = ___`;
    const boxW  = BOXED_REKEN_W; // vaste breedte
    const boxH  = 12;
    const r     = 2;
    const left  = xCenter - boxW / 2;

    doc.setDrawColor(200, 225, 245);
    doc.roundedRect(left, y - 9, boxW, boxH, r, r, 'D');

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(14);
    doc.text(text, xCenter, y, { align: 'center' });
  }

  // Kleiner kadertje specifiek voor maal- en deeltafels
  function drawTafelItemBoxed(doc, xCenter, y, oef) {
    const text = `${oef.getal1} ${oef.operator} ${oef.getal2} = ___`;
    const boxW = 46;    // kleiner dan zonder-brug (bijv. 52 mm)
    const boxH = 12;
    const r    = 2;
    const left = xCenter - boxW / 2;

    doc.setDrawColor(200, 225, 245);
    doc.roundedRect(left, y - 9, boxW, boxH, r, r, 'D');

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(14);
    doc.text(text, xCenter, y, { align: 'center' });
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
      // iets dichter bij de papierkant maar perforatieveilig
      const insetX = LEFT_PUNCH_MARGIN + 8;   // was vaak 16 → 8 (meer bruikbare breedte)

      // Default (huisje/benen) – compacter
      let xCols   = [insetX, insetX + 48, insetX + 96, insetX + 144];
      let yInc    = 34;   // was 36
      let itemH   = 30;   // was 32
      let colWidth = 44;

      // Rekenen met hulp (ongewijzigd)
      if (cfg.hoofdBewerking === 'rekenen' && cfg.rekenHulp?.inschakelen) {
        xCols   = [insetX, insetX + 100];
        yInc    = 45;
        itemH   = 54;
        colWidth = 92;
      }
      // Rekenen zonder hulp: 3 per rij, iets weg van de linkerrand
      else if (cfg.hoofdBewerking === 'rekenen' && !cfg.rekenHulp?.inschakelen) {
        const pad = 20; // mm
        xCols   = [insetX + pad, insetX + pad + 64, insetX + pad + 128]; // 3 kolommen
        yInc    = 24;   // dichter op elkaar
        itemH   = 20;   // compacter
        colWidth = 60;  // referentiebreedte
      }
      else if (cfg.hoofdBewerking === 'tafels') {
        const pad = 20; // was bv. 6 → schuift alles iets naar rechts
        xCols   = [insetX + pad, insetX + pad + 64, insetX + pad + 128]; // 3 per rij
        yInc    = 20;  // was 24 → minder verticale witruimte
        itemH   = 18;  // compacter item-height
        colWidth = 56; // interne kolombreedte; klein genoeg voor boxW=52
      }

      if (cfg.hoofdBewerking === 'splitsen') {
        if (cfg.splitsStijl === 'puntoefening') {
          // 3 per rij, met kolomkader per item
          xCols   = [insetX + 8, insetX + 76, insetX + 144];
          yInc    = 18;  // dichter
          itemH   = 16;
          colWidth = 60;
        } else if (cfg.splitsStijl === 'bewerkingen4') {
          // ruimer i.v.m. 4 bewerkingslijnen
          xCols   = [insetX + 14, insetX + 80, insetX + 146];
          yInc    = 92;  // iets ruimer
          itemH   = 96;
        }
      }

      return { xCols, yInc, itemH, colWidth, insetX };
    }

    // Kader per segment – ruimere padding
    function tekenSegmentKader(topY, bottomY) {
      const x = LEFT_PUNCH_MARGIN + 2;                 // was +6/+4 → nu +2
      const w = 210 - (LEFT_PUNCH_MARGIN + 2) - 6;     // iets breder
      const h = Math.max(10, bottomY - topY + 6);      // iets meer bodem
      doc.setDrawColor(179, 224, 255);
      doc.roundedRect(x, topY, w, h, 3, 3, 'D');
    }
    // Verschuif het segmentkader zonder de afmetingen te veranderen
    function tekenSegmentKaderMetOffset(cfg, topY, bottomY) {
      if (cfg.hoofdBewerking === 'splitsen' && (cfg.splitsStijl === 'puntoefening' || cfg.splitsStijl === 'huisje')) return;
      if (cfg.hoofdBewerking === 'rekenen') return;
      if (cfg.hoofdBewerking === 'tafels') return;   // geen groot kader voor tafels

      let offY = 0;
      if (cfg.hoofdBewerking === 'splitsen' && cfg.splitsStijl === 'benen') {
        offY = -3; // 3 mm hoger
      }

      tekenSegmentKader(topY + offY, bottomY + offY);
    }

    let yCursor = 35;
    // Titel: slechts 1x per segmentsoort, niet opnieuw op volgende pagina's
    let lastSegmentKey = null;
    let titlePrintedForCurrentSegment = false;
    let brugTitelGeprintOpPagina = false;

    // Per blok
    for (let i = 0; i < bundel.length; i++) {
      const cfg = bundel[i].settings || bundel[i];

      const { xCols, yInc, itemH, colWidth } = layoutVoor(cfg);

// --- SPECIALE TAK: GROTE SPLITSHUIZEN IN PDF ---
if (cfg.hoofdBewerking === 'splitsen' && cfg.groteSplitshuizen) {
 // Dataset voor PDF: volg de preview als die bestaat
const lijst = Array.isArray(cfg._oefeningen) && cfg._oefeningen.length
  ? cfg._oefeningen.map(o => o.max)   // preview-aanpassingen volgen
  : ((cfg.splitsGetallenArray && cfg.splitsGetallenArray.length)
      ? cfg.splitsGetallenArray
      : [10]);

// 1) bereken hoogte van de EERSTE RIJ (max van de eerste 3 kolommen)
const hKolom = (maxGetal) => 15 + (maxGetal + 1) * 10.5 + 2; // zelfde als drawGrootSplitshuisKolomPDF
const firstRowHeights = lijst.slice(0, 3).map(hKolom);
const firstRowH = firstRowHeights.length ? Math.max(...firstRowHeights) : hKolom(10);
const TITLE_H = 14;
const needed = TITLE_H + firstRowH + 6; // 6mm lucht

// 2) past titel + 1e rij niet meer? → eerst nieuwe pagina
if (yCursor + needed > pageHeight - PDF_BOTTOM_SAFE) {
  nieuwePagina();
}

// 3) T I T E L
doc.setFont('Helvetica','bold');
doc.setFontSize(14);
doc.text(titelVoor(cfg), LEFT_PUNCH_MARGIN + 8, yCursor + 6);
yCursor += 14;

  // SMALLER kolomraster: max 3 kolommen, stap 56 mm (past mooi bij bodyW = 40)
  const insetX = LEFT_PUNCH_MARGIN + 8;
  const xCols3 = [insetX, insetX + 56, insetX + 112]; // 3 kolommen zonder overlap

  let colIdx     = 0;            // 0..2
  let rijTopY    = yCursor + 6;  // top-Y van de huidige rij
  let maxKolomH  = 0;            // hoogte van hoogste kolom in de rij
  let startLinks = true;         // kolom 1 start links; kolom 2 rechts; kolom 3 links; ...

  for (let idx = 0; idx < lijst.length; idx++) {
    const maxGetal = lijst[idx];

    // BEREKEN verwachte hoogte op basis van dezelfde dimensies in de helper:
const expectedH = 15 + (maxGetal + 1) * 10.5 + 2;  // roofH + rows*cellH + marge
if (colIdx === 0 && rijTopY + expectedH > pageHeight - PDF_BOTTOM_SAFE) {
  nieuwePagina();
  rijTopY = yCursor + 6;
}

    // Kolom tekenen
    const x = xCols3[colIdx];
    const kolomH = drawGrootSplitshuisKolomPDF(doc, x, rijTopY, maxGetal, startLinks);
    maxKolomH = Math.max(maxKolomH, kolomH);

    colIdx++;
    startLinks = !startLinks; // volgende kolom gespiegeld starten

    const isLaatste = (idx === lijst.length - 1);
    const rijVol    = (colIdx >= xCols3.length);

    if (rijVol || isLaatste) {
      // rij afsluiten → naar volgende rij met 8 mm witruimte
      rijTopY += maxKolomH + 8;
      colIdx = 0;
      maxKolomH = 0;
      // eerste kolom van de volgende rij laten we weer starten zoals de vorige rij begon (optie):
      // startLinks = !startLinks;  // laat uit als u per rij niet opnieuw wil togglen

      // OPNIEUW de verwachte hoogte gebruiken voor de eerstvolgende kolom:
const nextMax = !isLaatste ? lijst[idx + 1] : maxGetal;
const expectedNextH = 15 + (nextMax + 1) * 10.5 + 2;
if (!isLaatste && rijTopY + expectedNextH > pageHeight - PDF_BOTTOM_SAFE) {
  nieuwePagina();
  rijTopY = yCursor + 6;
}
    }
  }

  // Cursor onder het blok + standaard segmentafstand
  yCursor = rijTopY + SEGMENT_GAP;

  // Gewone oefen-rendering overslaan voor dit item
  continue;
}

      // Oefeningen genereren
      // ✅ Gebruik dezelfde oefeningen als in de preview als ze bestaan
let oefeningen;
if (Array.isArray(cfg._oefeningen)) {
  oefeningen = cfg._oefeningen;
} else {
  const N = cfg.numOefeningen ?? 20;
  oefeningen = [];
  for (let k = 0; k < N; k++) {
    if (cfg.hoofdBewerking === 'rekenen') { const comp = !!(cfg.rekenHulp && cfg.rekenHulp.stijl === 'compenseren'); oefeningen.push(comp ? genereerRekensomMetCompenseren(cfg) : genereerRekensom(cfg)); }
    else if (cfg.hoofdBewerking === 'splitsen') {
      const s = genereerSplitsing(cfg);
      s._p = cfg.splitsStijl === 'puntoefening';
      s._b4 = cfg.splitsStijl === 'bewerkingen4';
      oefeningen.push(s);
    } else if (cfg.hoofdBewerking === 'tafels') oefeningen.push(genereerTafelsom(cfg));
  }
}

      // Nieuwe pagina helper
      function nieuwePagina() {
        doc.addPage();
        pdfHeader('Werkblad Bewerkingen (vervolg)');
        yCursor = 35; // reset cursor, maar GEEN titel hier
      }

      // Titel alleen printen wanneer segmentsoort wijzigt
      function ensureTitelVoorSegment(cfg) {
        // Bepaal 'soort' segment
        const segmentKey = [
  cfg.segmentId || '',
  cfg.hoofdBewerking || '',
  (cfg.isGemengd ? 'MIX' : (cfg.rekenType || cfg.operator || '')),
  (cfg.rekenBrug || ''),
  (cfg.rekenStijl || ''),
  (cfg.splitsStijl || ''),
  (cfg.tafelType || ''),
  (cfg.groteSplitshuizen ? 'GROOT' : 'NORMAAL')
].join('|');

        if (segmentKey !== lastSegmentKey) {
          // --- Zorg dat titel + MINSTENS 1e rij samen passen ---
          // Hoogte van 1 item/rij (exact afgestemd op layoutVoor):
          let firstRowHeight = 20; // default
          if (cfg.hoofdBewerking === 'rekenen') {
            firstRowHeight = (cfg.rekenHulp?.inschakelen) ? 54 : 20;
          } else if (cfg.hoofdBewerking === 'tafels') {
            firstRowHeight = 18;
          } else if (cfg.hoofdBewerking === 'splitsen') {
            if (cfg.splitsStijl === 'puntoefening')      firstRowHeight = 16;
            else if (cfg.splitsStijl === 'bewerkingen4') firstRowHeight = 96;
            else                                         firstRowHeight = 30; // huisje/benen
          }

          const TITLE_H = 14; // jij doet yCursor += 14 na titel
          const MIN_AFTER_TITLE = firstRowHeight + SEGMENT_GAP;

          // Te weinig plaats voor titel + 1e rij? -> eerst nieuwe pagina
          if (yCursor + TITLE_H + MIN_AFTER_TITLE > pageHeight - PDF_BOTTOM_SAFE) {
            nieuwePagina();
          }
          // Titel tekenen
          doc.setFont('Helvetica','bold'); 
          doc.setFontSize(14);
          doc.text(titelVoor(cfg), LEFT_PUNCH_MARGIN + 8, yCursor + 6);
          yCursor += 14;

          lastSegmentKey = segmentKey;
        }
      }

      // — aanroep vlak voordat de oefeningen geplaatst worden:
      ensureTitelVoorSegment(cfg);

      let topSegment = yCursor + 2;        // extra bovenmarge binnen het kader
      let row = 0, col = 0;

      // Eén vaste baseline voor alle rijen in dit blok
      let yStart = yCursor + ((cfg.hoofdBewerking === 'rekenen' && cfg.rekenHulp?.inschakelen) ? 12 : 6);
      let y = yStart;

      let lastYPlaced = y;                 // voor correcte onderrand

      const plaatsItem = (oef) => {
        let pad = 0;
        if (cfg.hoofdBewerking === 'splitsen') {
          switch (cfg.splitsStijl) {
            case 'huisje':      pad = PAD_HUISJE; break;
            case 'benen':       pad = PAD_BENEN; break;
            case 'puntoefening':pad = PAD_PUNTOEF; break;
            case 'bewerkingen4':pad = PAD_BEWERKING4; break;
          }
        }
        const x = xCols[col] + pad;

        if (cfg.hoofdBewerking === 'rekenen') {
          const hulp = !!(cfg.rekenHulp && cfg.rekenHulp.inschakelen);
          const isBrugSom = somHeeftBrug(oef.getal1, oef.getal2, oef.operator);

          if (hulp && isBrugSom) {
            // brug-hulp blijft zoals was
            if (cfg.rekenHulp && cfg.rekenHulp.stijl === 'compenseren') { drawCompenseerInPDF(doc, x, y, oef, cfg, colWidth); } else { drawBrugHulpInPDF(doc, x, y, oef, cfg, colWidth); }
          } else {
            // NORMALE som: nu met eigen kadertje
            drawRekenItemBoxed(doc, x, y, oef);
          }
        } else if (cfg.hoofdBewerking === 'splitsen') {
          if (cfg.splitsStijl === 'puntoefening') {
            // teken de puntoefening in een kolomkader
            let pText;
            if (oef.prefill === 'links') {
              pText = `${oef.totaal} = ${oef.deel1} + ___`;
            } else if (oef.prefill === 'rechts') {
              pText = `${oef.totaal} = ___ + ${oef.deel2}`;
            } else {
              pText = `${oef.totaal} = ___ + ___`;
            }
            drawPuntKolomPDF(doc, x, y, pText);
          } else if (cfg.splitsStijl === 'bewerkingen4') {
            drawB4ItemPDF(doc, x, y, oef);
          } else if (cfg.splitsStijl === 'huisje') {
            drawSplitsHuisPDF(doc, x, y, oef);
          } else {
            drawSplitsBenenPDF(doc, x, y, oef);
          }
        } else if (oef.type === 'tafels') {
          // Tafels in een klein kader, net zoals 'zonder brug'
          drawTafelItemBoxed(doc, x, y, { getal1: oef.getal1, operator: oef.operator, getal2: oef.getal2 });
        }

        lastYPlaced = y; // onthoud laatst geplaatste y
      };

      // teller voor strakke rasterplaatsing (alleen gebruikt bij 'rekenen' zonder hulp en 'tafels')
      let placedCount = 0;

      let itemsOnCurrentPage = 0;   // << nieuw

      for (let idx = 0; idx < oefeningen.length; idx++) {
        // paginawissel?
        if (y + itemH > pageHeight - PDF_BOTTOM_SAFE) {
          // sluit huidig segment alléén als er iets stond
if (itemsOnCurrentPage > 0) {
  tekenSegmentKaderMetOffset(cfg, topSegment, lastYPlaced + itemH - 2);
}
nieuwePagina();
topSegment = yCursor + 2;
itemsOnCurrentPage = 0;  // reset voor nieuwe pagina


          // baseline opnieuw bepalen (12mm na titel bij rekenen + hulp; anders 6mm)
          row = 0; 
          col = 0; 
          yStart = yCursor + ((cfg.hoofdBewerking === 'rekenen' && cfg.rekenHulp?.inschakelen) ? 12 : 6);
          y      = yStart; 
          lastYPlaced = y;

          // rasterteller resetten voor 'zonder brug' en 'tafels'
          if ((cfg.hoofdBewerking === 'rekenen' && !cfg.rekenHulp?.inschakelen) || cfg.hoofdBewerking === 'tafels') {
            placedCount = 0;
          }
        }

        // teken de oefening
        plaatsItem(oefeningen[idx]);
        itemsOnCurrentPage++;    // << nieuw


        // rasterlogica
        if ((cfg.hoofdBewerking === 'rekenen' && !cfg.rekenHulp?.inschakelen) || cfg.hoofdBewerking === 'tafels') {
          // Strakke 3-per-rij rasterplaatsing
          placedCount = (placedCount || 0) + 1;
          row = Math.floor(placedCount / xCols.length);
          col = placedCount % xCols.length;
          y   = yStart + row * yInc;
        } else {
          // Bestaand gedrag voor andere segmenten
          col++;
          if (col >= xCols.length) { 
            col = 0; 
            row++; 
            y = yStart + row * yInc; 
          }
        }
      }

      // sluit laatste segment van dit blok
     if (itemsOnCurrentPage > 0) {
  tekenSegmentKaderMetOffset(cfg, topSegment, lastYPlaced + itemH - 2);
}

      // ruimte vóór volgende opdracht (segment)
      yCursor = lastYPlaced + itemH + SEGMENT_GAP;
      if (yCursor > pageHeight - PDF_BOTTOM_SAFE) nieuwePagina(false);
    }

    doc.save('bewerkingen_werkblad.pdf');
  }

  // ========= START =========
  try {
    werkbladContainer.innerHTML = '';
    bundel.forEach(item => renderBlokOpScherm(item.settings || item));

    paginatePreview(); // preview in pagina’s

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

// ====== Preview-paginering ======
function paginatePreview(){
  const cont = document.getElementById('werkblad-container');
  if (!cont) return;

  // verzamel alle segmenten die er al staan
  const segments = Array.from(cont.querySelectorAll('section.preview-segment'));
  if (!segments.length) return;

  // maak één lange preview-pagina die niets afknipt
  cont.innerHTML = '';
  const page = document.createElement('div');
  page.className = 'preview-page';
  page.style.setProperty('--top-pad', PREVIEW_TOP_PX + 'px');
  page.style.setProperty('--bottom-pad', PREVIEW_BOTTOM_PX + 'px');
  page.style.height = 'auto';
  page.style.minHeight = '0';
  page.style.overflow = 'visible';

  cont.appendChild(page);
  segments.forEach(seg => page.appendChild(seg));
}

// ===== PREVIEW: compenseren netjes als in PDF =====
function tekenCompenseerOnderTerm(exprWrap, oef, rechtsKolom, cfg) {
  try {
    const span1  = exprWrap.querySelector('.term1');
    const opEl   = exprWrap.querySelector('.op');
    const span2  = exprWrap.querySelector('.term2');
    const ansBox = exprWrap.querySelector('.ansbox');
    if (!span1 || !span2 || !ansBox) return;

    // Zorg dat de som in één regel blijft
    exprWrap.style.whiteSpace = 'nowrap';
    exprWrap.style.position   = 'relative';
    exprWrap.style.overflow   = 'visible';

    // Afmetingen
    const wr  = exprWrap.getBoundingClientRect();
    const r2  = span2.getBoundingClientRect();
    const a   = Number(oef.getal1), b = Number(oef.getal2);
    const isMin = (oef.operator === '-');

    // --- OVAAL rond het 2e getal (transparant) ---
    const NS  = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.classList.add('comp-overlay');
    svg.setAttribute('width',  Math.ceil(wr.width));
    svg.setAttribute('height', Math.ceil(wr.height));
    Object.assign(svg.style, {position:'absolute', left:'0', top:'0', pointerEvents:'none', overflow:'visible'});

    const cx = r2.left - wr.left + r2.width/2;      // midden term2
    const cy = r2.top  - wr.top  + r2.height*0.55;  // optisch midden op baseline
    const rx = r2.width/2 + 6;                      // beetje marge
    const ry = r2.height*0.65;

    const ellipse = document.createElementNS(NS,'ellipse');
    ellipse.setAttribute('cx', cx); ellipse.setAttribute('cy', cy);
    ellipse.setAttribute('rx', rx); ellipse.setAttribute('ry', ry);
    ellipse.setAttribute('fill', 'none');
    ellipse.setAttribute('stroke', '#333'); ellipse.setAttribute('stroke-width', '2');
    svg.appendChild(ellipse);

    // --- Pijl vanaf de rand van de ovaal ---
    const tailY = cy + ry + 3;
    const tipY  = tailY + 16;
    const shaft = document.createElementNS(NS,'line');
    shaft.setAttribute('x1', cx); shaft.setAttribute('y1', tailY);
    shaft.setAttribute('x2', cx); shaft.setAttribute('y2', tipY);
    shaft.setAttribute('stroke', '#333'); shaft.setAttribute('stroke-width', '2');
    svg.appendChild(shaft);
    const a1 = document.createElementNS(NS,'line');
    a1.setAttribute('x1', cx); a1.setAttribute('y1', tipY);
    a1.setAttribute('x2', cx-8); a1.setAttribute('y2', tipY-6);
    a1.setAttribute('stroke', '#333'); a1.setAttribute('stroke-width', '2');
    const a2 = document.createElementNS(NS,'line');
    a2.setAttribute('x1', cx); a2.setAttribute('y1', tipY);
    a2.setAttribute('x2', cx+8); a2.setAttribute('y2', tipY-6);
    a2.setAttribute('stroke', '#333'); a2.setAttribute('stroke-width', '2');
    svg.appendChild(a1); svg.appendChild(a2);

    exprWrap.appendChild(svg); // overlay beïnvloedt de layout niet

    // --- Compenseerbox (absoluut gepositioneerd onder de pijl) ---
    const box = document.createElement('div');
    box.className = 'comp-box';
    Object.assign(box.style, {
      position: 'absolute',
      left: (cx - 70/2) + 'px',        // box midden onder de pijl
      top:  (tipY + 6) + 'px',
      width: '70px', height: '32px',
      border: '2px solid #888', borderRadius: '10px',
      background: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'space-evenly',
      fontFamily: 'Arial,Helvetica,sans-serif'
    });

    const L = document.createElement('span');
    const R = document.createElement('span');
    L.style.fontSize = R.style.fontSize = '16px';
    const plus  = (t) => { const s=document.createElement('span'); s.style.color='#c00000'; s.textContent='+'; return s; };
    const minus = (t) => { const s=document.createElement('span'); s.style.color='#0058c0'; s.textContent='-'; return s; };
    const fill  = (txt)=>{ const s=document.createElement('span'); s.textContent=txt; s.style.color='#000'; return s; };

    if (isMin) {  // aftrekken: -___ +___
      L.appendChild(minus()); L.appendChild(fill(' ___'));
      R.appendChild(plus());  R.appendChild(fill(' ___'));
    } else {      // optellen: +___ -___
      L.appendChild(plus());  L.appendChild(fill(' ___'));
      R.appendChild(minus()); R.appendChild(fill(' ___'));
    }
    box.append(L,R);

  // — Hoogte reserveren zodat de blauwe kader (op .oefening::after) de box meeneemt —
const BOX_H = 32;                 // hoogte van de compenseerbox (zoals ingesteld)
const MARGIN_BELOW = 8;           // extra lucht onder de box
const neededInside = (tipY + 6) + BOX_H + MARGIN_BELOW;   // totale benodigde hoogte binnen exprWrap

// a) exprWrap: maak ruimte onderaan
const extra = Math.max(0, neededInside - exprWrap.clientHeight);
exprWrap.style.paddingBottom = extra ? `${extra}px` : exprWrap.style.paddingBottom;

// b) container .oefening: zorg dat de hele kaart meegroeit
const oefDiv = exprWrap.closest('.oefening');
if (oefDiv) {
  // hoogte van linkerkolom t.o.v. container
  const topInParent = exprWrap.offsetTop;
  const neededForParent = topInParent + neededInside + 4; // kleine speling
  const curMin = parseFloat(getComputedStyle(oefDiv).minHeight || '0');
  if (neededForParent > curMin) {
    oefDiv.style.minHeight = `${neededForParent}px`;
  }
}


    exprWrap.appendChild(box);

    // --- Lijnen rechts blijven staan: we verschuiven niets meer dynamisch ---
    // (de oude paddingLeft-aanpassing veroorzaakte sprongen; laten we weg)

  } catch (e) {
    console.warn('tekenCompenseerOnderTerm (preview) error:', e);
  }
}




// === PDF: COMPENSEREN — definitieve versie ===
function drawCompenseerInPDF(doc, x, y, oef, cfg, colWidth) {
  const a  = Number(oef.getal1);
  const b  = Number(oef.getal2);
  const op = (oef.operator === '-') ? '-' : '+';

  // --- is dit de voorbeeldsom? ---
  const isVoorbeeld = !!(cfg && cfg.rekenHulp && cfg.rekenHulp.voorbeeld && oef._voorbeeld);

  // --- eerst het ORANJE KADER tekenen (anders bedekt het tekst) ---
  if (isVoorbeeld) {
  // Iets compacter dan voorheen en met duidelijkere rand
  const left   = x - 10;
  const width  = (colWidth || 92) + 4;
  const top    = y - 10;
  const height = 38;

  // vulling: licht oranje, rand: iets donkerder oranje
  doc.setFillColor(255, 228, 181);    // #FFE4B5
  doc.setDrawColor(224, 152, 66);     // #E09842 (donkerder rand)
  doc.roundedRect(left, top, width, height, 3, 3, 'FD'); // Fill + Stroke
}


  // --- som bovenaan + antwoordvak ---
  doc.setFont('Helvetica','normal'); doc.setFontSize(14); doc.setTextColor(0,0,0);
  const somTxt = `${a} ${op} ${b} =`;
  doc.text(somTxt, x, y);

  const ansX = x + doc.getTextWidth(somTxt) + 2;
  const ansW = 16, ansH = 12;
  doc.setDrawColor(51,51,51);
  doc.roundedRect(ansX, y - (ansH - 2), ansW, ansH, 1.5, 1.5, 'D');

  // --- kring rond het 2e getal (transparant), pijl vanaf rand ---
  const bStr = String(b);
  const term2Left = x + doc.getTextWidth(`${a} ${op} `); // links van term2
  const term2CenterX = term2Left + doc.getTextWidth(bStr) / 2;
  const rX = doc.getTextWidth(bStr) / 2 + 1.2;           // klein beetje marge
  const rY = 5;
  const cy = y - 3;
  doc.setDrawColor(51,51,51); doc.setLineWidth(0.4);
  doc.ellipse(term2CenterX, cy, rX, rY, 'D');            // alleen contour (geen vulling)
  const tailY = cy + rY + 0.8, tipY = tailY + 7;
  doc.line(term2CenterX, tailY, term2CenterX, tipY);
  doc.line(term2CenterX, tipY, term2CenterX - 2, tipY - 1.5);
  doc.line(term2CenterX, tipY, term2CenterX + 2, tipY - 1.5);

  // --- compenseerbox ---
  const boxW = 28, boxH = 9, rad = 1.5, boxY = tipY + 2;
  const boxLeft = term2CenterX - boxW / 2;
  doc.setDrawColor(51,51,51);
  doc.roundedRect(boxLeft, boxY, boxW, boxH, rad, rad, 'D');
  const leftX  = boxLeft + 7;
  const rightX = boxLeft + boxW - 7;
  const baseY  = boxY + boxH - 3;

  // --- hulplijnen rechts ---
  const RIGHT_SAFETY_GAP = 16, MAX_LEN = 46;
  const startX = ansX + ansW/2 + 6;
  const maxRight = x + (colWidth || 92) - RIGHT_SAFETY_GAP;
  const lijnLen = Math.max(22, Math.min(MAX_LEN, maxRight - startX));
  doc.setDrawColor(51,51,51);
  doc.line(startX, y + 10, startX + lijnLen, y + 10);
  doc.line(startX, y + 22, startX + lijnLen, y + 22);

  // --- delta berekenen (alleen voor box & stappen) ---
  const e2 = b % 10;
  const delta = (10 - e2) % 10;
  const b10 = b + delta; // naar volgend tiental

  // helper voor gekleurde tekens
  function teken(sign, num, cx, by){
    if (sign === '+') doc.setTextColor(200,0,0); else doc.setTextColor(0,90,200);
    doc.text(sign, cx - 5, by);
    doc.setTextColor(0,0,0);
    doc.text(String(num), cx - 1, by);
  }

  // --- voorbeeld volledig invullen ---
  if (isVoorbeeld) {
    doc.setFont('Helvetica','normal'); doc.setFontSize(12);
    if (op === '+') {
      // box: + (b+Δ)   - Δ
      teken('+', b10,  leftX,  baseY);
      teken('-', delta, rightX, baseY);

      // Lijn 1: a + (b+Δ) = tussen
      const tussen   = a + b10;
      const uitkomst = tussen - delta;
      doc.text(`${a} + ${b10} = ${tussen}`,          startX, y + 9.2);
      // Lijn 2: tussen − Δ = uitkomst
      doc.text(`${tussen} - ${delta} = ${uitkomst}`,  startX, y + 21.2);

      // Antwoord in het vak – hoger en groter, exact gecentreerd
const boxTop = y - (ansH - 2);          // bovenrand van het vak
const midY   = boxTop + ansH / 2 + 1.8;  // kleine optische correctie
doc.setFont('Helvetica', 'bold');
doc.setFontSize(16);                     // groter dan standaard 14
doc.text(String(uitkomst), ansX + ansW / 2, midY, { align: 'center' });
doc.setFontSize(14);                     // (optioneel) terug naar standaard


    } else {
      // box: - (b+Δ)   + Δ
      teken('-', b10,  leftX,  baseY);
      teken('+', delta, rightX, baseY);

      // Lijn 1: a − (b+Δ) = stap1
      const stap1    = a - b10;
      const uitkomst = stap1 + delta;
      doc.text(`${a} - ${b10} = ${stap1}`,            startX, y + 9.2);
      // Lijn 2: stap1 + Δ = uitkomst
      doc.text(`${stap1} + ${delta} = ${uitkomst}`,   startX, y + 21.2);

      // Antwoord in het vak – hoger en groter, exact gecentreerd
const boxTop = y - (ansH - 2);          // bovenrand van het vak
const midY   = boxTop + ansH / 2 + 1.8;  // kleine optische correctie
doc.setFont('Helvetica', 'bold');
doc.setFontSize(16);                     // groter dan standaard 14
doc.text(String(uitkomst), ansX + ansW / 2, midY, { align: 'center' });
doc.setFontSize(14);                     // (optioneel) terug naar standaard
    }
  } else {
    // niet-voorbeeld: alleen lege streepjes met juiste volgorde en kleuren
    if (op === '+') {
      doc.setTextColor(200,0,0); doc.text('+', leftX - 5, baseY);
      doc.setTextColor(0,0,0);   doc.line(boxLeft + 8, baseY, boxLeft + 14, baseY);
      doc.setTextColor(0,90,200);doc.text('-', rightX - 5, baseY);
      doc.setTextColor(0,0,0);   doc.line(boxLeft + 18.5, baseY, boxLeft + 26, baseY);
    } else {
      doc.setTextColor(0,90,200);doc.text('-', leftX - 5, baseY);
      doc.setTextColor(0,0,0);   doc.line(boxLeft + 8, baseY, boxLeft + 14, baseY);
      doc.setTextColor(200,0,0); doc.text('+', rightX - 5, baseY);
      doc.setTextColor(0,0,0);   doc.line(boxLeft + 18.5, baseY, boxLeft + 26, baseY);
    }
  }
/// --- Blauwe kader rond de oefening (niet bij voorbeeld) ---
const W = (colWidth || 92);

const FRAME_H     = 36;  // hoogte (2 hulplijnen)
const FRAME_TOP   = 11;  // bovenmarge
const LEFT_PAD    = 6;   // extra ruimte links (kader buiten de inhoud)
const RIGHT_MARGIN = 12;  // afstand tot de RECHTER kolomrand (→ korter rechts)

if (!isVoorbeeld) {
  doc.setDrawColor(191,219,254);
  doc.setLineWidth(0.6);

  // links en rechts expliciet bepalen
  const left  = x - LEFT_PAD;
  const right = x + W - RIGHT_MARGIN;
  const width = Math.max(10, right - left); // veiligheid

  doc.roundedRect(left, y - FRAME_TOP, width, FRAME_H, 3, 3, 'D');
}
  // reset kleur
  doc.setTextColor(0,0,0);
}


