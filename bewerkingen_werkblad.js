document.addEventListener("DOMContentLoaded", () => {
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  const opnieuwBtn = document.getElementById('opnieuwBtn');
  const werkbladContainer = document.getElementById('werkblad-container');

  // ==== PDF marges (TWEAK) ====
  const LEFT_PUNCH_MARGIN = 22; // mm – perforatiemarge links

  // Navigatie terug naar keuzes
  opnieuwBtn?.addEventListener('click', () => {
    window.location.href = 'bewerkingen_keuze.html';
  });

  // PDF-knop initieel uit tot we succesvol gerenderd hebben
  if (downloadPdfBtn) {
    downloadPdfBtn.disabled = true;
    downloadPdfBtn.style.backgroundColor = '#aaa';
    downloadPdfBtn.style.cursor = 'not-allowed';
  }

  try {
    let laatsteOefeningen = [];

    // ===== Instellingen ophalen (met Fallback) =====
    let settings = {};
    try {
      settings = JSON.parse(localStorage.getItem('werkbladSettings') || '{}');
    } catch (_) {
      settings = {};
    }
    if (!settings || !settings.hoofdBewerking) {
      // Fallback zodat er altijd oefeningen verschijnen
      settings = {
        hoofdBewerking: 'splitsen',      // 'splitsen' | 'rekenen' | 'tafels'
        splitsStijl: 'benen',            // 'benen' | 'huisje'
        splitsGetallenArray: [10],
        splitsSom: false,                // som-variant af en toe tonen? (bovenaan ___)
        numOefeningen: 12,

        rekenMaxGetal: 100,
        somTypes: ['E+E','T+E','T+T','TE+E','TE+TE'],
        rekenType: 'optellen',           // '+', '-', 'beide'
        rekenHulp: { inschakelen: false },

        gekozenTafels: [1,2,3,4,5,6,7,8,9,10],
        tafelType: 'maal',               // 'maal' | 'delen' | 'beide'
        tafelsVolgorde: 'links',         // 'links' | 'rechts' | 'mix'
        tafelsMetNul: false
      };
    }

    // --------------------------------
    // Hulpfuncties (scherm & logica)
    // --------------------------------
    function somHeeftBrug(g1, g2, op) {
      return op === '+' ? ((g1 % 10) + (g2 % 10) >= 11): ((g1 % 10) < (g2 % 10));
    }

    // SVG-benen en ondervakjes tekenen onder de juiste term (schermvoorbeeld)
    function tekenInlineSplitsOnderTerm(exprWrap, oef, rechtsKolom) {
      const span1 = exprWrap.querySelector('.term1');
      const span2 = exprWrap.querySelector('.term2');
      const ansBox = exprWrap.querySelector('.ansbox');

      let target = span2; // optellen: onder tweede term
      if (oef.operator === '-') {
        const plaats = (settings.rekenHulp?.splitsPlaatsAftrekken || 'onderAftrektal');
        target = (plaats === 'onderAftrekker') ? span2 : span1;
      }

      // Containers mogen niets afkappen
      const oefDiv = exprWrap.closest('.oefening');
      if (oefDiv) { oefDiv.style.overflow = 'visible'; oefDiv.style.position = 'relative'; }
      if (exprWrap) { exprWrap.style.overflow = 'visible'; exprWrap.style.position = 'relative'; }
      if (werkbladContainer) { werkbladContainer.style.overflow = 'visible'; }

      const wrapRect = exprWrap.getBoundingClientRect();
      const tRect = target.getBoundingClientRect();
      const aRect = ansBox.getBoundingClientRect();

      const anchorX = tRect.left + tRect.width / 2 - wrapRect.left;
      const apexY = tRect.bottom - wrapRect.top + 3;

      // Maten
      const horiz = 14;
      const boxW = 26, boxH = 22, r = 6;
      const bottomTopY = apexY + 12;
      const svgH = Math.ceil(bottomTopY + boxH + 6);
      const baseW = Math.max(exprWrap.clientWidth, exprWrap.scrollWidth);
      const svgW = Math.max(baseW, anchorX + horiz + boxW / 2 + 4);

      // Hoogte reserveren
      const huidige = parseFloat(getComputedStyle(exprWrap).minHeight || '0');
      if (huidige < svgH) exprWrap.style.minHeight = `${svgH}px`;
      exprWrap.style.paddingBottom = '2px';

      const NS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('width', svgW);
      svg.setAttribute('height', svgH);
      svg.style.position = 'absolute';
      svg.style.left = '0';
      svg.style.top = '0';
      svg.style.pointerEvents = 'none';
      svg.style.overflow = 'visible';

      const el = (n, a) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };

      // Benen
      svg.appendChild(el('line', { x1: anchorX, y1: apexY, x2: anchorX - horiz, y2: bottomTopY, stroke: '#333', 'stroke-width': 2 }));
      svg.appendChild(el('line', { x1: anchorX, y1: apexY, x2: anchorX + horiz, y2: bottomTopY, stroke: '#333', 'stroke-width': 2 }));

      // Onderste vakjes
      svg.appendChild(el('rect', { x: anchorX - horiz - boxW / 2, y: bottomTopY, width: boxW, height: boxH, rx: r, ry: r, fill: '#fff', stroke: '#ddd', 'stroke-width': 2 }));
      svg.appendChild(el('rect', { x: anchorX + horiz - boxW / 2, y: bottomTopY, width: boxW, height: boxH, rx: r, ry: r, fill: '#fff', stroke: '#ddd', 'stroke-width': 2 }));

      const t1 = el('text', { x: anchorX - horiz, y: bottomTopY + boxH - 6, 'text-anchor': 'middle', 'font-family': 'Arial,Helvetica,sans-serif', 'font-size': '14' });
      const t2 = el('text', { x: anchorX + horiz, y: bottomTopY + boxH - 6, 'text-anchor': 'middle', 'font-family': 'Arial,Helvetica,sans-serif', 'font-size': '14' });

      // inline splits-hulp gebruikt altijd lege vakjes
      t1.textContent = '___';
      t2.textContent = '___';
      svg.appendChild(t1); svg.appendChild(t2);

      exprWrap.appendChild(svg);

      // Schrijflijnen rechts: niet laten overlappen
      if (rechtsKolom) {
        const rechtsRect = rechtsKolom.getBoundingClientRect();
        const ansCenterX = aRect.left + aRect.width / 2;
        const offset = Math.max(0, ansCenterX - rechtsRect.left + 6);
        rechtsKolom.style.paddingLeft = `${offset}px`;
      }
    }

    // ---------------------------
    // Genereren & tonen werkblad (SCHERM)
    // ---------------------------
    function genereerWerkblad() {
      laatsteOefeningen = [];

      // Kolommen op SCHERM:
      const hulpGlobaal = !!(settings.rekenHulp && settings.rekenHulp.inschakelen);
      let kolommen = 4;
      if (settings.hoofdBewerking === 'rekenen' && hulpGlobaal) kolommen = 2;

      werkbladContainer.innerHTML = '';
      werkbladContainer.style.display = 'grid';
      werkbladContainer.style.gridTemplateColumns = `repeat(${kolommen}, minmax(0, 1fr))`;
      werkbladContainer.style.columnGap = (settings.hoofdBewerking === 'rekenen' && hulpGlobaal) ? '48px' : '24px';
      werkbladContainer.style.rowGap = (settings.hoofdBewerking === 'rekenen' && hulpGlobaal) ? '36px' : '24px';
      werkbladContainer.style.paddingLeft = '0';
      werkbladContainer.style.overflow = 'visible';
      werkbladContainer.style.alignItems = 'start';
      werkbladContainer.style.justifyItems = 'center';

      // ======= GROTE SPLITSHUIZEN (SCHERM) =======
      if (settings.hoofdBewerking === 'splitsen' && settings.groteSplitshuizen) {
        const lijst = settings.splitsGetallenArray || [10];

        lijst.forEach(maxGetal => {
          const kaart = document.createElement('div');
          kaart.style.fontFamily = 'Arial,Helvetica,sans-serif';
          kaart.style.border = '1px solid #e5e5e5';
          kaart.style.borderRadius = '12px';
          kaart.style.overflow = 'hidden';
          kaart.style.width = '140px';
          kaart.style.background = '#fff';
          kaart.style.boxShadow = '0 1px 2px rgba(0,0,0,.06)';

          // Dak
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

          // Rijen
          for (let r = 0; r <= maxGetal; r++) {
            const row = document.createElement('div');
            row.style.display = 'grid';
            row.style.gridTemplateColumns = '1fr 1fr';
            row.style.columnGap = '8px';
            row.style.padding = '0 10px';

            const left = document.createElement('div');
            const right = document.createElement('div');

            [left, right].forEach(cell => {
              cell.style.height = '28px';
              cell.style.display = 'flex';
              cell.style.alignItems = 'flex-end';
              cell.style.justifyContent = 'center';
              cell.style.paddingBottom = '4px';
              cell.style.borderBottom = '2px solid #333';
              cell.style.fontSize = '16px';
              cell.style.lineHeight = '1';
            });

            if (!settings.splitsWissel) {
              left.textContent = r;
              right.textContent = '';
            } else {
              if (r % 2 === 0) { left.textContent = r; right.textContent = ''; }
              else { left.textContent = ''; right.textContent = (maxGetal - r); }
            }

            row.appendChild(left);
            row.appendChild(right);
            kaart.appendChild(row);
          }

          const cell = document.createElement('div');
          cell.className = 'oefening';
          cell.style.overflow = 'visible';
          cell.appendChild(kaart);
          werkbladContainer.appendChild(cell);
        });
        return;
      }
      // ======= EINDE GROTE SPLITSHUIZEN =======

      // Standard lijsten genereren
      const N = settings.numOefeningen ?? 20;
      for (let i = 0; i < N; i++) {
        if (settings.hoofdBewerking === 'rekenen') laatsteOefeningen.push(genereerRekensom());
        else if (settings.hoofdBewerking === 'splitsen') laatsteOefeningen.push(genereerSplitsing());
        else if (settings.hoofdBewerking === 'tafels') laatsteOefeningen.push(genereerTafelsom());
      }

      // Render per oefening
      laatsteOefeningen.forEach(oef => {
        const oefDiv = document.createElement('div');
        oefDiv.className = 'oefening';
        oefDiv.style.width = '100%';
        oefDiv.style.fontFamily = 'Arial,Helvetica,sans-serif';
        oefDiv.style.fontSize = '14px';
        oefDiv.style.overflow = 'visible';

        if (oef.type === 'rekenen') {
          const hulpActief = !!(settings.rekenHulp && settings.rekenHulp.inschakelen);
          const isBrugSom = somHeeftBrug(oef.getal1, oef.getal2, oef.operator);

          if (hulpActief && isBrugSom) {
            // 2-koloms layout: links som + benen; rechts schrijflijnen
            oefDiv.style.display = 'grid';
            oefDiv.style.gridTemplateColumns = 'auto 1fr';
            oefDiv.style.columnGap = '24px';
            oefDiv.style.alignItems = 'start';

            const links = document.createElement('div');
            links.style.position = 'relative';
            links.style.display = 'inline-block';
            links.style.overflow = 'visible';

            links.innerHTML = `
              <span class="term1">${oef.getal1}</span>
              <span class="op"> ${oef.operator} </span>
              <span class="term2">${oef.getal2}</span>
              <span> = </span>
              <span class="ansbox" style="display:inline-block;width:46px;height:30px;border:2px solid #333;border-radius:8px;vertical-align:middle;margin-left:6px;"></span>
            `;

            const rechts = document.createElement('div');
            rechts.className = 'lijnenrechts';
            rechts.style.overflow = 'visible';
            rechts.innerHTML = `
              <div style="border-bottom:2px solid #333;height:18px;margin:8px 0;width:260px;max-width:100%"></div>
              <div style="border-bottom:2px solid #333;height:18px;margin:8px 0;width:260px;max-width:100%"></div>
            `;

            oefDiv.appendChild(links);
            oefDiv.appendChild(rechts);
            werkbladContainer.appendChild(oefDiv);

            // na layout: benen tekenen
            requestAnimationFrame(() => tekenInlineSplitsOnderTerm(links, oef, rechts));
          } else {
            oefDiv.textContent = `${oef.getal1} ${oef.operator} ${oef.getal2} = ___`;
            werkbladContainer.appendChild(oefDiv);
          }

        } else if (oef.type === 'splitsen') {
          const isSom = !!oef.isSom;

          if (settings.splitsStijl === 'huisje') {
            const huis = document.createElement('div');
            huis.className = 'splitshuis';
            huis.style.margin = '6px';
            huis.style.overflow = 'visible';

            const dak = document.createElement('div');
            dak.className = 'dak';
            dak.textContent = isSom ? '___' : String(oef.totaal);
            huis.appendChild(dak);

            const kamers1 = document.createElement('div');
            kamers1.className = 'kamers';
            const k1a = document.createElement('div');
            k1a.className = 'kamer';
            const k1b = document.createElement('div');
            k1b.className = 'kamer';

            if (isSom) {
              k1a.textContent = String(oef.deel1);
              k1b.textContent = String(oef.deel2);
            } else {
              k1a.textContent = (oef.prefill === 'links')  ? String(oef.deel1) : '___';
              k1b.textContent = (oef.prefill === 'rechts') ? String(oef.deel2) : '___';
            }

            kamers1.appendChild(k1a); kamers1.appendChild(k1b);
            huis.appendChild(kamers1);

            oefDiv.style.display = 'flex';
            oefDiv.style.justifyContent = 'center';
            oefDiv.appendChild(huis);
            werkbladContainer.appendChild(oefDiv);

          } else {
            // Splits-benen
            const wrap = document.createElement('div');
            wrap.className = 'splitsbenen';
            wrap.style.overflow = 'visible';

            const top = document.createElement('div');
            top.className = 'top';
            top.textContent = isSom ? '___' : String(oef.totaal);

            const benenC = document.createElement('div');
            benenC.className = 'benen-container';

            const beenL = document.createElement('div');
            beenL.className = 'been links';
            const beenR = document.createElement('div');
            beenR.className = 'been rechts';

            benenC.appendChild(beenL);
            benenC.appendChild(beenR);

            const bottom = document.createElement('div');
            bottom.className = 'bottom';
            const b1 = document.createElement('div');
            b1.className = 'bottom-deel';
            const b2 = document.createElement('div');
            b2.className = 'bottom-deel';

            if (isSom) {
              b1.textContent = String(oef.deel1);
              b2.textContent = String(oef.deel2);
            } else {
              b1.textContent = (oef.prefill === 'links')  ? String(oef.deel1) : '___';
              b2.textContent = (oef.prefill === 'rechts') ? String(oef.deel2) : '___';
            }
            bottom.appendChild(b1); bottom.appendChild(b2);

            wrap.appendChild(top);
            wrap.appendChild(benenC);
            wrap.appendChild(bottom);

            oefDiv.style.display = 'flex';
            oefDiv.style.justifyContent = 'center';
            oefDiv.appendChild(wrap);
            werkbladContainer.appendChild(oefDiv);
          }

        } else {
          // Tafels
          oefDiv.textContent = `${oef.getal1} ${oef.operator} ${oef.getal2} = ___`;
          werkbladContainer.appendChild(oefDiv);
        }
      });
    }

    // ---------------------------
    // Generatoren (inhoud)
    // ---------------------------
    function genereerSplitsing() {
      const arr = settings.splitsGetallenArray || [10];
      const gekozenGetal = arr[Math.floor(Math.random() * arr.length)];
      if (settings.splitsSom && Math.random() < 0.3) {
        const d1 = Math.floor(Math.random() * Math.max(1, Math.floor(gekozenGetal / 2))) + 1;
        const d2 = Math.floor(Math.random() * Math.max(1, Math.floor(gekozenGetal / 2))) + 1;
        return { type: 'splitsen', isSom: true, deel1: d1, deel2: d2, totaal: d1 + d2 };
      } else {
        const totaal = Math.floor(Math.random() * gekozenGetal) + 1;
        const deel1 = Math.floor(Math.random() * (totaal + 1));
        const deel2 = totaal - deel1;
        const prefill = Math.random() < 0.5 ? 'links' : 'rechts'; // <<< één been vooraf ingevuld
        return { type: 'splitsen', isSom: false, totaal, deel1, deel2, prefill };
      }
    }

// TELT HOE VAAK 10 + 10 AL GEBRUIKT WERD
let TT_10_10_count = 0;

// TELT HOE VAAK 10 - 10 of 20 - 20 AL GEBRUIKT WERD
let TT_same_minus_count = 0;


function genereerRekensom() {

    const rnd = (min, max) =>
        Math.floor(Math.random() * (max - min + 1)) + min;

    const maxGetal = settings.rekenMaxGetal || 100;
    // Operator eerst kiezen — blijft dezelfde tijdens het zoeken
// Operator VERPLICHT 50/50 verdelen
let op;

if (settings.rekenType === 'beide') {

    // Tel hoeveel we al hebben
    if (!window._countPlus) window._countPlus = 0;
    if (!window._countMin) window._countMin = 0;

    // Halvering van totaal aantal oefeningen
    const half = Math.floor((settings.numOefeningen || 20) / 2);

    if (window._countPlus < half) {
        op = '+';
        window._countPlus++;
    } else {
        op = '-';
        window._countMin++;
    }

} else {
    op = (settings.rekenType === 'optellen' ? '+' : '-');
}

let somTypes = [...settings.somTypes];

const brug = settings.rekenBrug || 'beide';

if (settings.rekenMaxGetal === 20) {
    const geldigeBinnen20 = ['E+E','E-E','TE+E','TE-E'];
    somTypes = somTypes.filter(t => geldigeBinnen20.includes(t));
}

// ----------------------------------------
// SOMTYPES FILTEREN OP BASIS VAN OPERATOR
// ----------------------------------------
let typesVoorOp = somTypes.filter(t => {
    if (op === '+') return t.includes('+');
    if (op === '-') return t.includes('-');
    return false;
});

// Indien niets gevonden → fallback op alle types
if (typesVoorOp.length === 0) typesVoorOp = somTypes;

// Gebruik voortaan typesVoorOp i.p.v. somTypes
somTypes = typesVoorOp;

    // -------------------------------
    // Brugcontrole op eenheden
    // -------------------------------
 function heeftBrug(g1, g2, op) {

    const e1 = g1 % 10;
    const e2 = g2 % 10;

    /* ============================
       SPECIALE REGEL: TOT 20
       ============================ */
    if (settings.rekenMaxGetal === 20) {

        if (op === '+') {
            // Brug pas als som van eenheden > 10
            return (e1 + e2 > 10);
        }

        if (op === '-') {
            // NOOIT brug wanneer je van een zuiver tiental vertrekt
            if (g1 === 10 || g1 === 20) return false;

            // Brug wanneer lenen nodig is
            return (e1 < e2);
        }
    }

    /* ============================
       NORMAAL (tot 100 en tot 1000)
       ONGEWIJZIGD LATEN
       ============================ */

    if (op === '+') {
        return (e1 + e2 > 10);
    }

    // aftrekken
    if (g1 % 10 === 0 && g1 < 100) return false;
    if (g1 % 100 === 0 && g1 < 1000) return false;
    if (g1 % 1000 === 0) return false;

    return (e1 < e2);
}
// EXTRA correcties specifiek voor max 20
function isBrugBinnen20(g1, g2, op) {

    if (op === '+') {
        // Som van éénheden moet > 10 zijn
        const e1 = g1 % 10;
        const e2 = g2 % 10;
        return (e1 + e2 > 10);
    }

    if (op === '-') {
        // Nooit brug wanneer startgetal zuiver tiental is
        if (g1 === 10 || g1 === 20) return false;

        // Brug bij lenen
        return ((g1 % 10) < (g2 % 10));
    }

    return false;
}


    function brugOK(g1, g2, op) {
        const b = heeftBrug(g1, g2, op);
        if (brug === 'met') return b;
        if (brug === 'zonder') return !b;
        return true; // 'beide'
    }

    let pogingen = 0;

    while (true) {
        pogingen++;
        if (pogingen > 500) {
            throw new Error("Kon geen som genereren binnen de voorwaarden.");
        }

        // KIES SOMTYPE UIT DE OPERATOR-SPECIFIEKE LIJST
const type = typesVoorOp[Math.floor(Math.random() * typesVoorOp.length)];
        let g1 = 0, g2 = 0;
        

        /* -----------------------------------------------------------------
           TE + E SPECIFIEK BINNEN 20
        ----------------------------------------------------------------- */
        if ((type === 'TE+E' || type === 'TE-E') && maxGetal === 20) {

            const lijst = [];

            for (let t = 11; t <= 19; t++) {
                for (let e = 1; e <= 9; e++) {

                    const uit = (op === '+') ? t + e : t - e;
                    if (uit < 0 || uit > 20) continue;

                    const b = heeftBrug(t, e, op);
                    if (brug === 'met' && !b) continue;
                    if (brug === 'zonder' && b) continue;

                    lijst.push([t, e]);
                }
            }

            if (lijst.length === 0) continue;

            const paar = lijst[rnd(0, lijst.length - 1)];
            g1 = paar[0];
            g2 = paar[1];

        } else {

            /* -----------------------------------------------------------------
               NORMALE SOMTYPES + TE+TE / TE-TE + H/HT/HTE
            ----------------------------------------------------------------- */
            switch (type) {

                // ----------------- E + E / E - E -----------------
                case 'E+E':
                case 'E-E':
                    g1 = rnd(1, 9);
                    g2 = rnd(1, 9);
                    break;

                // ----------------- T + E / T - E -----------------
                case 'T+E':
                case 'T-E': {
                    const ts = [];
                    for (let t = 10; t <= maxGetal; t += 10) ts.push(t);
                    const idx = rnd(0, ts.length - 1);
                    g1 = ts[idx];
                    g2 = rnd(1, 9);
                    break;
                }

                // ----------------- T + T / T - T -----------------
                case 'T+T':
                case 'T-T': {
                    const ts = [];
                    for (let t = 10; t <= maxGetal; t += 10) ts.push(t);
                    const i1 = rnd(0, ts.length - 1);
                    const i2 = rnd(0, ts.length - 1);
                    g1 = ts[i1];
                    g2 = ts[i2];
                    break;
                }

                // ----------------- TE + E / TE - E (algemeen) ----
                case 'TE+E':
case 'TE-E':

    if (maxGetal === 20) {
        // Binnen 20: alleen TE (11–19), nooit 10 of 20
        g1 = rnd(11, 19);
        g2 = rnd(1, 9);
    } else {
        // Normaal gedrag voor 100 en 1000
        g1 = rnd(10, Math.min(99, maxGetal));
        g2 = rnd(1, 9);
    }
    break;


                // ----------------- TE + TE / TE - TE --------------
                case 'TE+TE':
                case 'TE-TE': {

                    if (maxGetal === 20) {
                        // speciale lijst binnen 20
                        const lijst = [];

                        for (let a = 10; a <= 19; a++) {
                            for (let b = 10; b <= 19; b++) {

                                let uit = (op === '+') ? a + b : a - b;
                                if (uit < 0 || uit > 20) continue;

                                const isBrug = heeftBrug(a, b, op);


                                if (brug === 'met' && !isBrug) continue;
                                if (brug === 'zonder' && isBrug) continue;

                                if (op === '-' && a < b) continue;

                                lijst.push([a, b]);
                            }
                        }

                        if (lijst.length === 0) continue;

                        const paar = lijst[rnd(0, lijst.length - 1)];
                        g1 = paar[0];
                        g2 = paar[1];

                    } else {
                        // algemeen: tot 100 of 1000
                        g1 = rnd(10, Math.min(99, maxGetal));
                        g2 = rnd(10, Math.min(99, maxGetal));
                    }

                    break;
                }

                // ----------------- H + H / H - H ------------------
                case 'H+H':
                case 'H-H': {
                    const maxH = Math.min(9, Math.floor(maxGetal / 100));
                    g1 = rnd(1, maxH) * 100;
                    g2 = rnd(1, maxH) * 100;
                    break;
                }

                // ----------------- HT + HT / HT - HT --------------
                case 'HT+HT':
                case 'HT-HT': {
                    const minT = 10;
                    const maxT = Math.min(99, Math.floor(maxGetal / 10));
                    const t1 = rnd(minT, maxT);
                    const t2 = rnd(minT, maxT);
                    g1 = t1 * 10;
                    g2 = t2 * 10;
                    break;
                }

                // ----------------- HTE + HTE / HTE - HTE ----------
                case 'HTE+HTE':
                case 'HTE-HTE':
                    g1 = rnd(100, Math.min(999, maxGetal));
                    g2 = rnd(100, Math.min(999, maxGetal));
                    break;
            }
        }

        // ---------------- BASISREGELS ----------------

        // binnen bereik blijven
        if (g1 > maxGetal || g2 > maxGetal) continue;

        // geen negatieve uitkomst
        if (op === '-' && g1 < g2) continue;
        // TOT 20: nooit aftrekken vanaf een zuiver tiental (10 of 20)
if (maxGetal === 20 && op === '-' && (g1 === 10 || g1 === 20)) continue;

// EXTRA STRIKTE REGEL: bij max 20 mag startgetal nooit boven 20 zijn
if (maxGetal === 20 && op === '-' && g1 > 20) continue;



        // optellen: uitkomst binnen bereik
        if (op === '+' && g1 + g2 > maxGetal) continue;

        // brugfilter toepassen
        if (!brugOK(g1, g2, op)) continue;

        // 10 + 10 binnen 20 maximaal 1 keer
        if (maxGetal === 20 && op === '+' && g1 === 10 && g2 === 10) {

            if (typeof window._tienTienCount === 'undefined') {
                window._tienTienCount = 0;
            }

            if (window._tienTienCount >= 1) {
                continue;
            }

            window._tienTienCount++;
        }

        // geldige som gevonden
        return {
            type: 'rekenen',
            getal1: g1,
            getal2: g2,
            operator: op
        };
    }
}


/* ============================================
   JUISTE BRUGFUNCTIE
============================================ */
function checkBrug(g1, g2, op, brugType) {

    if (!brugType || brugType === 'beide') return true;

    const e1 = g1 % 10;
    const e2 = g2 % 10;

    let heeftBrug = false;

    if (op === '+') {
        heeftBrug = (e1 + e2 > 9);
    } else { // aftrekken
        heeftBrug = (e1 < e2);
    }

    if (brugType === 'met') return heeftBrug;
    if (brugType === 'zonder') return !heeftBrug;

    return true;
}



    function genereerTafelsom() {
      const tafel = settings.gekozenTafels?.[Math.floor(Math.random() * (settings.gekozenTafels?.length || 1))] ?? 1;

      // Operator-keuze (maal / deel / beide)
      let op = settings.tafelType === 'maal' ? 'x' : ':';
      if (settings.tafelType === 'beide') op = Math.random() < 0.5 ? 'x' : ':';

      // Volgorde en 0-toelating voor MAAL
      const volgorde = settings.tafelsVolgorde || 'links';  // 'links' | 'rechts' | 'mix'
      const metNul   = !!settings.tafelsMetNul;             // true => 0..10, false => 1..10
      const randFactor = () => metNul
        ? Math.floor(Math.random() * 11)        // 0..10
        : (Math.floor(Math.random() * 10) + 1); // 1..10

      if (op === 'x') {
        let orient = volgorde;
        if (volgorde === 'mix') orient = (Math.random() < 0.5 ? 'links' : 'rechts');

        if (orient === 'links') {
          return { type: 'tafels', getal1: tafel, getal2: randFactor(), operator: 'x' };
        } else {
          return { type: 'tafels', getal1: randFactor(), getal2: tafel, operator: 'x' };
        }
      }

      // Deeltafels (geen delen door 0)
      const g2 = tafel;
      const factor = Math.max(1, randFactor());  // 1..10
      const g1 = g2 * factor;
      return { type: 'tafels', getal1: g1, getal2: g2, operator: ':' };
    }

    // --------------------------------
    // PDF-helpers
    // --------------------------------
    function drawRekensomInPDF(doc, x, y, oef) {
      const text = `${oef.getal1} ${oef.operator} ${oef.getal2} = ___`;
      doc.setFont('Helvetica', 'normal'); doc.setFontSize(14);
      doc.text(text, x, y, { align: 'left' });
    }

    // KLEIN SPLITSHUISJE — hoogtes & baselines
    function drawSplitsHuisPDF(doc, centerX, y, oef) {
      const r = 1,
            breedte = 36,
            hoogteDak = 12,
            hoogteKamer = 14;
      const left = centerX - breedte/2;

      const topText = oef.isSom ? '___' : String(oef.totaal);
      let leftText, rightText;
      if (oef.isSom) { leftText = String(oef.deel1); rightText = String(oef.deel2); }
      else { leftText = (oef.prefill === 'links') ? String(oef.deel1) : '___';
             rightText = (oef.prefill === 'rechts') ? String(oef.deel2) : '___'; }

      // Baselines (lager in vakje)
      const dakBaseline = y + hoogteDak - 3;
      const kamerBaseline = (yy) => yy + hoogteKamer - 2;

      doc.setLineWidth(0.5);
      doc.setDrawColor(51,51,51);
      doc.setFillColor(224,242,247);
      doc.roundedRect(left, y, breedte, hoogteDak, r, r, 'FD');

      const yKamers = y + hoogteDak;
      doc.setDrawColor(204,204,204);
      doc.roundedRect(left, yKamers, breedte, hoogteKamer, r, r, 'D');
      doc.line(centerX, yKamers, centerX, yKamers + hoogteKamer);

      doc.setFont('Helvetica','bold'); doc.setFontSize(14);
      doc.text(topText, centerX, dakBaseline, { align: 'center' });
      doc.setFont('Helvetica','normal'); doc.setFontSize(14);
      doc.text(leftText,  centerX - breedte/4, kamerBaseline(yKamers), { align: 'center' });
      doc.text(rightText, centerX + breedte/4, kamerBaseline(yKamers), { align: 'center' });
    }

    // BENEN-variant — onderboxen baseline laag
    function drawSplitsBenenPDF(doc, centerX, y, oef) {
      const r = 1.2, topW = 14, topH = 10, horiz = 7, boxW = 12, boxH = 11;
      const topText = oef.isSom ? '___' : String(oef.totaal);
      let leftText, rightText;
      if (oef.isSom) { leftText = String(oef.deel1); rightText = String(oef.deel2); }
      else { leftText = (oef.prefill === 'links') ? String(oef.deel1) : '___';
             rightText = (oef.prefill === 'rechts') ? String(oef.deel2) : '___'; }

      doc.setFillColor(224,242,247);
      doc.setDrawColor(51,51,51);
      doc.roundedRect(centerX - topW/2, y, topW, topH, r, r, 'FD');
      doc.setFont('Helvetica','bold'); doc.setFontSize(14);
      doc.text(topText, centerX, y + topH - 3, { align: 'center' });

      const bottomTopY = y + topH + 8;
      doc.line(centerX, y + topH, centerX - horiz, bottomTopY);
      doc.line(centerX, y + topH, centerX + horiz, bottomTopY);

      doc.setDrawColor(204,204,204);
      doc.roundedRect(centerX - horiz - boxW/2, bottomTopY, boxW, boxH, r, r, 'D');
      doc.roundedRect(centerX + horiz - boxW/2, bottomTopY, boxW, boxH, r, r, 'D');
      doc.setFont('Helvetica','normal'); doc.setFontSize(14);
      doc.text(leftText,  centerX - horiz, bottomTopY + boxH - 2, { align: 'center' });
      doc.text(rightText, centerX + horiz, bottomTopY + boxH - 2, { align: 'center' });
    }

    // GROOT SPLITSHUIS — hoogtes & baselines (PDF)
    function drawGrootSplitshuisInPDF(doc, x, y, maxGetal) {
      const breedte = 36,
            hoogteDak = 12,
            hoogteKamer = 9,
            r = 1;

      const dakBaseline = y + hoogteDak - 3;
      const kamerBaseline = (yy) => yy + hoogteKamer - 2;

      doc.setLineWidth(0.5);
      doc.setDrawColor(51, 51, 51);
      doc.setFillColor(224, 242, 247);
      doc.roundedRect(x, y, breedte, hoogteDak, r, r, 'FD');
      doc.setTextColor(0);
      doc.setFont('Helvetica', 'bold'); doc.setFontSize(14);
      doc.text(String(maxGetal), x + breedte / 2, dakBaseline, { align: 'center' });

      let showLeft = true;
      doc.setFont('Helvetica', 'normal'); doc.setFontSize(14);
      for (let i = 0; i <= maxGetal; i++) {
        const yRow = y + hoogteDak + i * hoogteKamer;
        const d1 = i, d2 = maxGetal - i;
        doc.setDrawColor(204, 204, 204);
        doc.rect(x, yRow, breedte, hoogteKamer, 'D');
        doc.line(x + breedte / 2, yRow, x + breedte / 2, yRow + hoogteKamer);
        let left = '___', right = '___';
        if (!settings.splitsWissel) left = d1;
        else { if (showLeft) left = d1; else right = d2; showLeft = !showLeft; }
        doc.text(String(left),  x + breedte / 4,  kamerBaseline(yRow), { align: 'center' });
        doc.text(String(right), x + breedte * 0.75, kamerBaseline(yRow), { align: 'center' });
      }
    }

    function getGrootSplitshuisHeight(maxGetal) {
      const hoogteDak = 12, hoogteKamer = 9;
      return hoogteDak + (maxGetal + 1) * hoogteKamer + 6; // +6 marge onderaan
    }

    // Brug-hulplijnen (PDF)
    function drawBrugHulpInPDF(doc, x, y, oef, settings, colWidth) {
      doc.setFont('Helvetica', 'normal'); doc.setFontSize(14);

      const sNum1 = String(oef.getal1);
      const sNum2 = String(oef.getal2);
      const wNum1 = doc.getTextWidth(sNum1);
      const wNum1Space = doc.getTextWidth(`${sNum1} `);
      const wOpSpace = doc.getTextWidth(`${oef.operator} `);
      const wNum2 = doc.getTextWidth(sNum2);

      const somTekst = `${sNum1} ${oef.operator} ${sNum2} =`;
      doc.text(somTekst, x, y, { align: 'left' });

      const ansX = x + doc.getTextWidth(somTekst) + 2;
      const ansW = 16, ansH = 12;
      doc.setDrawColor(51, 51, 51);
      doc.roundedRect(ansX, y - (ansH - 2), ansW, ansH, 1.5, 1.5, 'D');

      let centerX;
      if (oef.operator === '+') {
        centerX = x + wNum1Space + wOpSpace + (wNum2 / 2);
      } else {
        const plaats = (settings.rekenHulp?.splitsPlaatsAftrekken || 'onderAftrektal');
        centerX = (plaats === 'onderAftrekker')
          ? x + wNum1Space + wOpSpace + (wNum2 / 2)
          : x + (wNum1 / 2);
      }

      const yLegStart = y + 3;
      const bottomTopY = y + 12;
      const horiz = 7;

      doc.setDrawColor(51, 51, 51);
      doc.line(centerX, yLegStart, centerX - horiz, bottomTopY);
      doc.line(centerX, yLegStart, centerX + horiz, bottomTopY);

      const boxW = 12, boxH = 11, r = 1.2;
      doc.setDrawColor(204,204,204);
      doc.roundedRect(centerX - horiz - boxW/2, bottomTopY, boxW, boxH, r, r, 'D');
      doc.roundedRect(centerX + horiz - boxW/2, bottomTopY, boxW, boxH, r, r, 'D');
      doc.setFont('Helvetica','normal'); doc.setFontSize(14);
      doc.text('___', centerX - horiz, bottomTopY + boxH - 2, { align: 'center' });
      doc.text('___', centerX + horiz, bottomTopY + boxH - 2, { align: 'center' });

      // Rechtermarge voor schrijflijnen
      const RIGHT_SAFETY_GAP = 10; // mm extra ruimte tot rechter kolom
      if (settings.rekenHulp?.schrijflijnen) {
        const startX = ansX + ansW / 2 + 6;
        const maxRight = x + (colWidth || 85) - RIGHT_SAFETY_GAP;
        let lengte = Math.max(22, maxRight - startX);
        if (lengte < 22) lengte = 22;
        doc.setDrawColor(51, 51, 51);
        doc.line(startX, y + 10, startX + lengte, y + 10);
        doc.line(startX, y + 22, startX + lengte, y + 22);
      }
    }

    // --------------------------------
    // PDF-generator
    // --------------------------------
    function downloadPDF() {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageHeight = doc.internal.pageSize.getHeight();
      const BOTTOM_SAFE = 26;

      function pdfHeader(titleText) {
        const xName = LEFT_PUNCH_MARGIN;
        const yName = 15;
        doc.setFont('Helvetica', 'normal'); doc.setFontSize(12);
        doc.text('Naam:', xName, yName, { align: 'left' });
        const wNaam = doc.getTextWidth('Naam:');
        const gap = 3;
        const lineStart = xName + wNaam + gap;
        const lineEnd = Math.min(200, lineStart + 80);
        doc.setDrawColor(51,51,51);
        doc.line(lineStart, yName, lineEnd, yName);

        doc.setFont('Helvetica', 'bold'); doc.setFontSize(16);
        doc.text(titleText, 105, 25, { align: 'center' });
      }

      pdfHeader('Werkblad Bewerkingen');

      if (settings.hoofdBewerking === 'splitsen' && settings.groteSplitshuizen) {
        const xCols = [LEFT_PUNCH_MARGIN + 5, LEFT_PUNCH_MARGIN + 75, LEFT_PUNCH_MARGIN + 145];
        const startY = 40;
        const vGap = 8;
        const yCols = [startY, startY, startY];
        const lijst = settings.splitsGetallenArray || [10];

        for (let i = 0; i < lijst.length; i++) {
          const h = getGrootSplitshuisHeight(lijst[i]);

          const kolomMetPlaats = yCols.findIndex(y => y + h <= pageHeight - BOTTOM_SAFE);
          if (kolomMetPlaats === -1) {
            doc.addPage();
            pdfHeader('Werkblad Bewerkingen (vervolg)');
            yCols.fill(startY);
          }

          let col = 0;
          for (let c = 1; c < xCols.length; c++) if (yCols[c] < yCols[col]) col = c;

          drawGrootSplitshuisInPDF(doc, xCols[col], yCols[col], lijst[i]);
          yCols[col] += h + vGap;
        }

      } else if (settings.hoofdBewerking === 'splitsen') {
        const xPosities = [
          LEFT_PUNCH_MARGIN + 15,
          LEFT_PUNCH_MARGIN + 65,
          LEFT_PUNCH_MARGIN + 115,
          LEFT_PUNCH_MARGIN + 165
        ];
        const yStart = 40;
        const yIncrement = 36;
        const itemHeight = 32;
        const kolommen = xPosities.length;

        let row = 0, col = 0, y = yStart;
        laatsteOefeningen.forEach((oef) => {
          if (y + itemHeight > pageHeight - BOTTOM_SAFE) {
            doc.addPage();
            pdfHeader('Werkblad Bewerkingen (vervolg)');
            row = 0; col = 0; y = yStart;
          }
          const x = xPosities[col];

          if (settings.splitsStijl === 'huisje') drawSplitsHuisPDF(doc, x, y, oef);
          else drawSplitsBenenPDF(doc, x, y, oef);

          col++;
          if (col >= kolommen) { col = 0; row++; y = yStart + row * yIncrement; }
        });

      } else {
        const hulpGlobaal = !!(settings.rekenHulp && settings.rekenHulp.inschakelen);
        const xPosities = hulpGlobaal
          ? [LEFT_PUNCH_MARGIN + 5, LEFT_PUNCH_MARGIN + 100]
          : [LEFT_PUNCH_MARGIN + 5, LEFT_PUNCH_MARGIN + 50, LEFT_PUNCH_MARGIN + 95, LEFT_PUNCH_MARGIN + 140];

        const colWidth  = hulpGlobaal ? 85 : 40;
        const yStart = 45;
        const yIncrement = hulpGlobaal ? 58 : 30;
        const itemHeight = (hulpGlobaal ? 52 : 26);
        const kolommen = xPosities.length;

        let row = 0, col = 0, y = yStart;

        laatsteOefeningen.forEach((oef) => {
          if (y + itemHeight > pageHeight - BOTTOM_SAFE) {
            doc.addPage();
            pdfHeader('Werkblad Bewerkingen (vervolg)');
            row = 0; col = 0; y = yStart;
          }
          const x = xPosities[col];

          if (oef.type === 'rekenen') {
            const isBrugSom = checkBrug(oef.getal1, oef.getal2, oef.operator, 'met');
            if (hulpGlobaal && isBrugSom) drawBrugHulpInPDF(doc, x, y, oef, settings, colWidth);
            else drawRekensomInPDF(doc, x, y, oef);
          } else if (oef.type === 'splitsen') {
            if (settings.splitsStijl === 'huisje') drawSplitsHuisPDF(doc, x, y, oef);
            else drawSplitsBenenPDF(doc, x, y, oef);
          } else if (oef.type === 'tafels') {
            drawRekensomInPDF(doc, x, y, { getal1: oef.getal1, operator: oef.operator, getal2: oef.getal2 });
          }

          col++;
          if (col >= kolommen) { col = 0; row++; y = yStart + row * yIncrement; }
        });
      }

      doc.save('bewerkingen_werkblad.pdf');
    }

    // ---------------------------
    // Start
    // ---------------------------
    genereerWerkblad();
    downloadPdfBtn?.addEventListener('click', downloadPDF);
    if (downloadPdfBtn) {
      downloadPdfBtn.disabled = false;
      downloadPdfBtn.style.backgroundColor = '';
      downloadPdfBtn.style.cursor = 'pointer';
    }

  } catch (error) {
    if (werkbladContainer) {
      werkbladContainer.innerHTML = `<p style="color: red; font-weight: bold;">Fout: Kon werkblad niet maken.</p><p>${error.message}</p>`;
    }
  }
});