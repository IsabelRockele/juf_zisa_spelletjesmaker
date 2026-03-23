/* ═══════════════════════════════════════════════════════════════════════════
   REKENVIERKANT GENERATOR  –  generator.js
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

/* ─── STATE ──────────────────────────────────────────────────────────────── */
const state = {
  roosters: [],
  grids: [],
  oplossingZichtbaar: false,
  nextId: 1,
};

/* ─── CANVAS ─────────────────────────────────────────────────────────────── */
const canvas = document.getElementById('mainCanvas');
const ctx    = canvas.getContext('2d');

/* ─── HELPERS ────────────────────────────────────────────────────────────── */
function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function heeftBrug(a, b, op) {
  if (op === '+') {
    // Brug bij optellen = ergens een kolom waar de cijfers samen >= 10 gaan
    // Eenheden: (a%10) + (b%10) >= 10
    if ((a % 10) + (b % 10) >= 10) return true;
    // Tientallen: tientallencijfer(a) + tientallencijfer(b) >= 10
    if (Math.floor((a % 100) / 10) + Math.floor((b % 100) / 10) >= 10) return true;
    // Honderdtallen: honderdtallencijfer(a) + honderdtallencijfer(b) >= 10
    if (Math.floor((a % 1000) / 100) + Math.floor((b % 1000) / 100) >= 10) return true;
    return false;
  }
  if (op === '-') {
    // Brug bij aftrekken = ergens een kolom waar het cijfer van b groter is dan dat van a
    // Eenheden
    if ((a % 10) < (b % 10)) return true;
    // Tientallen
    if (Math.floor((a % 100) / 10) < Math.floor((b % 100) / 10)) return true;
    // Honderdtallen
    if (Math.floor((a % 1000) / 100) < Math.floor((b % 1000) / 100)) return true;
    return false;
  }
  return false;
}

/* ═══════════════════════════════════════════════════════════════════════════
   OPTELLEN / AFTREKKEN
   ═══════════════════════════════════════════════════════════════════════════ */
function genereerPlusMinGrid(cols, rows, niveau, typeOpgave, brugOptie) {
  const maxVal = parseInt(niveau);

  // Operator voor een cel kiezen
  const fixOp = typeOpgave === 'optellen' ? '+' : typeOpgave === 'aftrekken' ? '-' : null;
  function rndOp() { return fixOp !== null ? fixOp : (rnd(0,1) ? '+' : '-'); }

  // Berekening zonder maxVal-drempel (alleen negatief stoppen)
  function calc(a, b, op) {
    if (op === '+') return a + b;
    if (op === '-') return (a >= b) ? a - b : null;
    return null;
  }

  const MAX = 300000;

  /* ── 5×5 ── */
  if (cols === 5) {
    for (let att = 0; att < MAX; att++) {
      const g = Array.from({length:5}, () => Array(5).fill(''));
      [[0,1],[2,1],[4,1],[1,0],[1,2],[1,4]].forEach(([r,c]) => g[r][c] = rndOp());
      [[0,3],[2,3],[4,3],[3,0],[3,2],[3,4]].forEach(([r,c]) => g[r][c] = '=');

      const mb = typeOpgave === 'optellen' ? Math.floor(maxVal/2) : maxVal;
      g[0][0]=rnd(1,mb); g[0][2]=rnd(1,mb); g[2][0]=rnd(1,mb); g[2][2]=rnd(1,mb);

      g[0][4] = calc(g[0][0], g[0][2], g[0][1]); if (g[0][4]===null||g[0][4]>maxVal) continue;
      g[2][4] = calc(g[2][0], g[2][2], g[2][1]); if (g[2][4]===null||g[2][4]>maxVal) continue;
      g[4][0] = calc(g[0][0], g[2][0], g[1][0]); if (g[4][0]===null||g[4][0]>maxVal) continue;
      g[4][2] = calc(g[0][2], g[2][2], g[1][2]); if (g[4][2]===null||g[4][2]>maxVal) continue;

      const fH = calc(g[4][0], g[4][2], g[4][1]);
      const fV = calc(g[0][4], g[2][4], g[1][4]);
      if (fH===null||fV===null||fH!==fV||fH<0||fH>maxVal) continue;
      g[4][4] = fH;

      // Brug-filter
      if (brugOptie !== 'gemengd') {
        const sommen = [];
        for (let r=0;r<5;r+=2) for (let c=0;c<3;c+=2) sommen.push({a:g[r][c],b:g[r][c+2],op:g[r][c+1]});
        for (let c=0;c<5;c+=2) for (let r=0;r<3;r+=2) sommen.push({a:g[r][c],b:g[r+2][c],op:g[r+1][c]});
        const brug = sommen.some(s => typeof s.a==='number' && typeof s.b==='number' && heeftBrug(s.a,s.b,s.op));
        if (brugOptie==='zonder' && brug) continue;
        if (brugOptie==='met' && !brug) continue;
      }
      return g;
    }
    return null;
  }

  /* ── 7×7 ──
     Sleutelinzicht: bij pure optelling is g[6][6] = som van alle 9 basiscellen.
     Dat is altijd consistent — de hoek-check slaagt nooit door inconsistentie,
     maar door het maxVal-plafond. Oplossing: stel maxBase = maxVal/9, en bereken
     ZONDER tussendoor te begrenzen. Controleer alles achteraf.
     Vergeet ook niet de operator-cellen in kolom 6: g[1][6] en g[3][6]!
  */
  const maxBase7 = typeOpgave === 'optellen'  ? Math.max(1, Math.floor(maxVal / 9))
                 : typeOpgave === 'aftrekken' ? Math.max(1, Math.floor(maxVal / 2))
                 : Math.max(1, Math.floor(maxVal / 4));

  const calc7 = (a, b, op) => {
    if (op === '+') return a + b;
    if (op === '-') return (a >= b) ? a - b : null;
    return null;
  };

  for (let att = 0; att < MAX; att++) {
    const g = Array.from({length:7}, () => Array(7).fill(''));

    // Operatoren — inclusief kolom 6 (g[1][6] en g[3][6])!
    [[0,1],[0,3],[2,1],[2,3],[4,1],[4,3],[6,1],[6,3],
     [1,0],[1,2],[1,4],[3,0],[3,2],[3,4],[5,0],[5,2],[5,4],
     [1,6],[3,6]]
      .forEach(([r,c]) => g[r][c] = rndOp());
    [[0,5],[2,5],[4,5],[6,5],[5,0],[5,2],[5,4],[5,6]]
      .forEach(([r,c]) => g[r][c] = '=');

    // Basiscellen
    [[0,0],[0,2],[0,4],[2,0],[2,2],[2,4],[4,0],[4,2],[4,4]]
      .forEach(([r,c]) => g[r][c] = rnd(1, maxBase7));

    // Bereken kolom 6 (rij-uitkomsten)
    let ok = true;
    for (const r of [0,2,4]) {
      const s = calc7(g[r][0], g[r][2], g[r][1]); if (s===null||s<0){ok=false;break;}
      const v = calc7(s, g[r][4], g[r][3]);        if (v===null||v<0){ok=false;break;}
      g[r][6] = v;
    }
    if (!ok) continue;

    // Bereken rij 6 (kolom-uitkomsten)
    for (const c of [0,2,4]) {
      const s = calc7(g[0][c], g[2][c], g[1][c]); if (s===null||s<0){ok=false;break;}
      const v = calc7(s, g[4][c], g[3][c]);        if (v===null||v<0){ok=false;break;}
      g[6][c] = v;
    }
    if (!ok) continue;

    // Hoek g[6][6] — via horizontaal en verticaal
    const sh = calc7(g[6][0], g[6][2], g[6][1]); if (sh===null) continue;
    const g66h = calc7(sh, g[6][4], g[6][3]);
    const sv = calc7(g[0][6], g[2][6], g[1][6]);  if (sv===null) continue;
    const g66v = calc7(sv, g[4][6], g[3][6]);
    if (g66h===null||g66v===null||g66h!==g66v) continue;
    g[6][6] = g66h;

    // Alle 16 waarden valideren
    const alleW = [g[0][0],g[0][2],g[0][4],g[0][6],
                   g[2][0],g[2][2],g[2][4],g[2][6],
                   g[4][0],g[4][2],g[4][4],g[4][6],
                   g[6][0],g[6][2],g[6][4],g[6][6]];
    if (alleW.some(v => v===null||!Number.isInteger(v)||v<0||v>maxVal)) continue;

    // Brug-filter
    if (brugOptie !== 'gemengd') {
      const sommen = [];
      for (let r=0;r<7;r+=2) for (let c=0;c<5;c+=2) sommen.push({a:g[r][c],b:g[r][c+2],op:g[r][c+1]});
      for (let c=0;c<7;c+=2) for (let r=0;r<5;r+=2) sommen.push({a:g[r][c],b:g[r+2][c],op:g[r+1][c]});
      const brug = sommen.some(s => typeof s.a==='number'&&typeof s.b==='number'&&heeftBrug(s.a,s.b,s.op));
      if (brugOptie==='zonder' && brug) continue;
      if (brugOptie==='met' && !brug) continue;
    }
    return g;
  }
  return null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   VERMENIGVULDIGEN / GEMENGD (× en ÷)
   - Basiscellen altijd 1–10 (of 1–50 bij grote getallen)
   - maalOp: minstens één factor is een gekozen tafel, uitkomst ≤ maxVal
   - deelOp bij puur delen: deler exact een gekozen tafel, deeltal tafelproduct
   - deelOp bij gemengd: enkel deler exact een gekozen tafel (soepeler voor
     tussenresultaten die al berekend zijn via ×)
   - isTafelProduct: elke uitkomst deelbaar door een gekozen tafel × (1..10)
   ═══════════════════════════════════════════════════════════════════════════ */
function genereerMaalDeelGrid(cols, rows, bewerking, maalType, tafels) {
  const maxVal  = maalType === 'groot' ? 500 : 100;
  const maxBase = maalType === 'groot' ? 50  : 10;
  const MAX     = 500000;

  const inRange = v => Number.isInteger(v) && v >= 0 && v <= maxVal;

  const isTafelProduct = v => {
    if (!inRange(v)) return false;
    for (const t of tafels) {
      if (v % t === 0) { const k = v/t; if (k>=1 && k<=maxBase) return true; }
    }
    return false;
  };

  const maalOp = (a, b) => {
    const r = a * b;
    if (!inRange(r)) return null;
    if (!tafels.includes(a) && !tafels.includes(b)) return null;
    if (!isTafelProduct(r)) return null;
    return r;
  };

  // Bij puur vermenigvuldigen: strenge check op tafelproduct
  // Bij gemengd: soepelere check (tussenresultaten hoeven geen tafelproduct te zijn)
  // Deeltal moet een product zijn van de deler-tafel zelf (niet van een andere tafel)
  // bv. tafels=[2,5]: 50:5=10 ✓ (50=5×10), 50:2=25 ✗ (50 > 2×10)
  const isProductVanTafel = (a, t) => {
    if (a <= 0 || a % t !== 0) return false;
    const k = a / t;
    return k >= 1 && k <= 10;
  };

  const deelOpStreng = (a, b) => {
    if (b===0||a%b!==0) return null;
    const q = a/b;
    if (!inRange(q)) return null;
    if (!tafels.includes(b)) return null;
    if (!isProductVanTafel(a, b)) return null;  // deeltal moet product zijn van deler-tafel
    return q;
  };
  const deelOpSoepel = (a, b) => {
    if (b===0||a%b!==0) return null;
    const q = a/b;
    if (!inRange(q)) return null;
    if (!tafels.includes(b)) return null;
    if (!isProductVanTafel(a, b)) return null;  // zelfde regel bij gemengd
    return q;
  };

  const uitvoer = (a, b, sign, soepel=false) => {
    if (sign === 'x') return maalOp(a, b);
    return soepel ? deelOpSoepel(a, b) : deelOpStreng(a, b);
  };

  const fixSign = bewerking === 'maal' ? 'x' : null; // gemengd = null → random
  const rndSign = () => fixSign !== null ? fixSign : (rnd(0,1) ? 'x' : ':');
  const isGemengd = bewerking === 'gemengd';

  for (let att = 0; att < MAX; att++) {
    const grid = Array.from({length:rows}, () => Array(cols).fill(''));

    const opCells = cols === 5
      ? [[0,1],[2,1],[4,1],[1,0],[1,2],[1,4]]
      : [[0,1],[0,3],[2,1],[2,3],[4,1],[4,3],[6,1],[6,3],
         [1,0],[1,2],[1,4],[3,0],[3,2],[3,4],[5,0],[5,2],[5,4],[1,6],[3,6]];
    for (const [r,c] of opCells) grid[r][c] = rndSign();

    const eqCells = cols === 5
      ? [[0,3],[2,3],[4,3],[3,0],[3,2],[3,4]]
      : [[0,5],[2,5],[4,5],[6,5],[5,0],[5,2],[5,4],[5,6]];
    for (const [r,c] of eqCells) grid[r][c] = '=';

    const baseCells = cols === 5
      ? [[0,0],[0,2],[2,0],[2,2]]
      : [[0,0],[0,2],[0,4],[2,0],[2,2],[2,4],[4,0],[4,2],[4,4]];
    for (const [r,c] of baseCells) {
      grid[r][c] = rnd(1, maxBase);
      if (grid[r][c] === 0) grid[r][c] = 1;
    }

    const op = (a,b,sign) => uitvoer(a,b,sign,isGemengd);
    const triple = (a,b,c,s1,s2) => { const m=op(a,b,s1); return m===null?null:op(m,c,s2); };

    let d={}, ok=true;
    if (cols===5) {
      d.r0c4=op(grid[0][0],grid[0][2],grid[0][1]);
      d.r2c4=op(grid[2][0],grid[2][2],grid[2][1]);
      d.r4c0=op(grid[0][0],grid[2][0],grid[1][0]);
      d.r4c2=op(grid[0][2],grid[2][2],grid[1][2]);
      if(Object.values(d).some(v=>v===null))ok=false;
      else{d.r4c4_h=op(d.r4c0,d.r4c2,grid[4][1]); d.r4c4_v=op(d.r0c4,d.r2c4,grid[1][4]);}
    } else {
      d.r0c6=triple(grid[0][0],grid[0][2],grid[0][4],grid[0][1],grid[0][3]);
      d.r2c6=triple(grid[2][0],grid[2][2],grid[2][4],grid[2][1],grid[2][3]);
      d.r4c6=triple(grid[4][0],grid[4][2],grid[4][4],grid[4][1],grid[4][3]);
      d.r6c0=triple(grid[0][0],grid[2][0],grid[4][0],grid[1][0],grid[3][0]);
      d.r6c2=triple(grid[0][2],grid[2][2],grid[4][2],grid[1][2],grid[3][2]);
      d.r6c4=triple(grid[0][4],grid[2][4],grid[4][4],grid[1][4],grid[3][4]);
      if(Object.values(d).some(v=>v===null))ok=false;
      else{d.r6c6_h=triple(d.r6c0,d.r6c2,d.r6c4,grid[6][1],grid[6][3]); d.r6c6_v=triple(d.r0c6,d.r2c6,d.r4c6,grid[1][6],grid[3][6]);}
    }
    if(!ok) continue;

    const fH=cols===5?d.r4c4_h:d.r6c6_h, fV=cols===5?d.r4c4_v:d.r6c6_v;
    if(fH===null||fV===null||fH!==fV||!inRange(fH)) continue;

    const alleNrs=cols===5
      ?[grid[0][0],grid[0][2],d.r0c4,grid[2][0],grid[2][2],d.r2c4,d.r4c0,d.r4c2,fH]
      :[grid[0][0],grid[0][2],grid[0][4],d.r0c6,grid[2][0],grid[2][2],grid[2][4],d.r2c6,
        grid[4][0],grid[4][2],grid[4][4],d.r4c6,d.r6c0,d.r6c2,d.r6c4,fH];
    if(alleNrs.some(n=>!inRange(n))) continue;

    if(cols===5){
      grid[0][4]=d.r0c4;grid[2][4]=d.r2c4;grid[4][0]=d.r4c0;grid[4][2]=d.r4c2;grid[4][4]=fH;
    } else {
      grid[0][6]=d.r0c6;grid[2][6]=d.r2c6;grid[4][6]=d.r4c6;
      grid[6][0]=d.r6c0;grid[6][2]=d.r6c2;grid[6][4]=d.r6c4;grid[6][6]=fH;
    }
    return grid;
  }
  return null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   DISPLAY GRID — welke cellen worden leeg gelaten?

   Regels (streng):
   - 5×5: elke rij/kolom heeft 3 getalcellen → max 1 verbergen per rij/kolom
   - 7×7: elke rij/kolom heeft 4 getalcellen → max 2 verbergen per rij/kolom
           (zodat altijd minstens 2 getallen zichtbaar blijven)
   - Totaal te verbergen: 4–5 bij 5×5, 5–7 bij 7×7
   ═══════════════════════════════════════════════════════════════════════════ */
function maakDisplayGrid(full, cols, rows) {
  const getalCellen = [];
  for (let r=0; r<rows; r+=2) for (let c=0; c<cols; c+=2) getalCellen.push([r,c]);

  const perRij = {}, perKol = {};
  for (const [r,c] of getalCellen) {
    if (!perRij[r]) perRij[r] = [];
    if (!perKol[c]) perKol[c] = [];
    perRij[r].push([r,c]);
    perKol[c].push([r,c]);
  }

  // Bij 5×5: 3 per rij/kolom → max 1 verbergen (2 zichtbaar)
  // Bij 7×7: 4 per rij/kolom → max 2 verbergen (2 zichtbaar)
  const maxVerbergenPerGroep = cols === 5 ? 1 : 2;
  const doel = cols === 5 ? rnd(4,5) : rnd(5,7);

  const kandidaten = [...getalCellen].sort(() => Math.random()-0.5);
  const verborgen = new Set();

  for (const [r,c] of kandidaten) {
    if (verborgen.size >= doel) break;

    const rijVerborgen = perRij[r].filter(([rr,cc]) => verborgen.has(`${rr},${cc}`)).length;
    const kolVerborgen = perKol[c].filter(([rr,cc]) => verborgen.has(`${rr},${cc}`)).length;

    if (rijVerborgen >= maxVerbergenPerGroep) continue;
    if (kolVerborgen >= maxVerbergenPerGroep) continue;

    verborgen.add(`${r},${c}`);
  }

  const display = full.map(row => [...row]);
  for (const key of verborgen) {
    const [r,c] = key.split(',').map(Number);
    display[r][c] = '___';
  }
  return display;
}

/* ═══════════════════════════════════════════════════════════════════════════
   TEKENEN
   gridData = de data om te tonen (full bij oplossing, display bij werkblad)
   displayData = altijd g.display — om te weten welke cellen lege hokjes zijn
   ═══════════════════════════════════════════════════════════════════════════ */
function tekenGrid(tCtx, gridData, displayData, xOffset, yOffset, vakB, vakH, cols, rows, oplossingModus) {
  for (let r=0; r<rows; r++) {
    for (let c=0; c<cols; c++) {
      const x = xOffset + c*vakB, y = yOffset + r*vakH;
      const val = gridData[r][c];
      const wasLeeg = displayData && displayData[r][c] === '___'; // was dit een leeg hokje?
      let bg = '#ffffff';
      if (val==='')    bg = '#2a2a2a';
      else if (val==='=')  bg = '#e8f0f8';
      else if (['+','-','x',':'].includes(val)) bg = '#eef4f8';
      else if (wasLeeg) bg = oplossingModus ? '#d4edda' : '#ffffff'; // groen bij oplossing
      tCtx.fillStyle = bg;
      tCtx.fillRect(x, y, vakB, vakH);
    }
  }

  tCtx.strokeStyle='#bccfdf'; tCtx.lineWidth=1.5;
  for (let i=0;i<=cols;i++){tCtx.beginPath();tCtx.moveTo(xOffset+i*vakB,yOffset);tCtx.lineTo(xOffset+i*vakB,yOffset+rows*vakH);tCtx.stroke();}
  for (let j=0;j<=rows;j++){tCtx.beginPath();tCtx.moveTo(xOffset,yOffset+j*vakH);tCtx.lineTo(xOffset+cols*vakB,yOffset+j*vakH);tCtx.stroke();}
  tCtx.strokeStyle='#7aaee0'; tCtx.lineWidth=2.5;
  tCtx.strokeRect(xOffset,yOffset,cols*vakB,rows*vakH);

  const fs = Math.min(vakH*0.48, 30);
  tCtx.textAlign='center'; tCtx.textBaseline='middle';
  for (let r=0;r<rows;r++) {
    for (let c=0;c<cols;c++) {
      const x=xOffset+c*vakB+vakB/2, y=yOffset+r*vakH+vakH/2;
      const val=gridData[r][c];
      const wasLeeg = displayData && displayData[r][c] === '___';
      if (val==='') continue; // zwart vakje
      if (!oplossingModus && wasLeeg) continue; // leeg hokje — leerling vult in
      if (val==='=') { tCtx.fillStyle='#4a6fa5'; tCtx.font=`700 ${fs}px "Segoe UI",Arial,sans-serif`; tCtx.fillText('=',x,y); continue; }
      if (['+','-','x',':'].includes(val)) {
        tCtx.fillStyle='#4a6fa5'; tCtx.font=`700 ${fs}px "Segoe UI",Arial,sans-serif`;
        tCtx.fillText(val==='x'?'×':val===':'?'÷':val,x,y); continue;
      }
      // Getal — groen bij oplossing als het een antwoord was
      tCtx.fillStyle = (oplossingModus && wasLeeg) ? '#177a4e' : '#1a2d40';
      tCtx.font=`600 ${fs}px "Segoe UI",Arial,sans-serif`;
      tCtx.fillText(String(val),x,y);
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   LAYOUT
   ═══════════════════════════════════════════════════════════════════════════ */
function berekenLayout(numGrids, cols) {
  const enkB = cols===5 ? 260 : 280, enkH = enkB, pad = 24;
  const numKols = Math.min(numGrids, 2);
  const numRijen = Math.ceil(numGrids / 2);
  const cw = numKols * enkB + (numKols+1) * pad;
  const ch = numRijen * enkH + (numRijen+1) * pad;
  const offsets = [];
  for (let i=0; i<numGrids; i++) {
    const kolIdx = i % 2;
    const rijIdx = Math.floor(i / 2);
    offsets.push({ x: pad + kolIdx*(enkB+pad), y: pad + rijIdx*(enkH+pad) });
  }
  return {cw, ch, enkB, enkH, offsets};
}

// Teken een antwoordkader boven één 7×7 rooster
// Geeft de hoogte van het kader terug (zodat het rooster eronder geplaatst kan worden)
function tekenAntwoordKader(tCtx, ontbrekend, xOffset, yOffset, kadBreedte) {
  const getallen = [...ontbrekend].sort((a,b) => a-b); // gesorteerd
  const aantalPerRij = Math.ceil(getallen.length / 2);
  const vakB = Math.floor((kadBreedte - 20) / aantalPerRij);
  const vakH = 34;
  const kadH = vakH * 2 + 28;

  // Kader achtergrond
  tCtx.fillStyle = '#eaf3ff';
  tCtx.strokeStyle = '#7aaee0';
  tCtx.lineWidth = 2;
  tCtx.beginPath();
  tCtx.roundRect(xOffset, yOffset, kadBreedte, kadH, 8);
  tCtx.fill();
  tCtx.stroke();

  // Label
  tCtx.fillStyle = '#1a3352';
  tCtx.font = `600 13px "Segoe UI",Arial,sans-serif`;
  tCtx.textAlign = 'left';
  tCtx.textBaseline = 'top';
  tCtx.fillText('Getallen om in te vullen:', xOffset + 10, yOffset + 6);

  // Getallen in vakjes
  tCtx.textAlign = 'center';
  tCtx.textBaseline = 'middle';
  getallen.forEach((v, idx) => {
    const kolIdx = idx % aantalPerRij;
    const rijIdx = Math.floor(idx / aantalPerRij);
    const x = xOffset + 10 + kolIdx * vakB;
    const y = yOffset + 22 + rijIdx * (vakH + 2);

    tCtx.fillStyle = '#ffffff';
    tCtx.strokeStyle = '#a0c0e0';
    tCtx.lineWidth = 1;
    tCtx.beginPath();
    tCtx.roundRect(x, y, vakB - 4, vakH, 4);
    tCtx.fill();
    tCtx.stroke();

    tCtx.fillStyle = '#1a2d40';
    tCtx.font = `700 14px "Segoe UI",Arial,sans-serif`;
    tCtx.fillText(String(v), x + (vakB-4)/2, y + vakH/2);
  });

  return kadH + 10; // hoogte van het kader inclusief marge
}

function tekenAlles(oplossingModus) {
  const cols = document.getElementById('formaat').value==='5x5' ? 5 : 7;
  const rows = cols;
  const modus = weergaveModus(); // 'klassiek' of 'kader'
  const metKader = modus === 'kader' && cols === 7;

  const numGrids = state.grids.length;
  if (numGrids===0) { canvas.width=400; canvas.height=300; ctx.clearRect(0,0,400,300); return; }

  const {cw, ch, enkB, enkH, offsets} = berekenLayout(numGrids, cols);

  // Bij kader: extra hoogte per rooster voor het antwoordkader
  const kadHoogte = metKader ? 100 : 0; // schatting; echte hoogte berekend tijdens tekenen
  const extraCh = metKader ? Math.ceil(numGrids/2) * 110 : 0;

  canvas.width  = cw;
  canvas.height = ch + extraCh;
  ctx.fillStyle = '#f6fafd';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Bijhouden hoeveel extra offset per rij (door kaders van vorige roosters in die rij)
  const rijOffset = {}; // rijIdx -> extra y

  for (let i=0; i<state.grids.length; i++) {
    const g = state.grids[i]; if (!g) continue;
    const data = oplossingModus ? g.full : g.display;
    const kolIdx = i % 2;
    const rijIdx = Math.floor(i / 2);

    let extraY = 0;
    if (metKader) {
      // Tel alle kader-hoogtes van eerdere rijen
      for (let r=0; r<rijIdx; r++) extraY += (rijOffset[r] || 110);
    }

    const baseX = offsets[i].x;
    const baseY = offsets[i].y + extraY;

    if (metKader && !oplossingModus) {
      const ontbrekend = [];
      for (let r=0; r<rows; r+=2) for (let c=0; c<cols; c+=2) {
        if (g.display[r][c] === '___') ontbrekend.push(g.full[r][c]);
      }
      if (ontbrekend.length > 0) {
        const kH = tekenAntwoordKader(ctx, ontbrekend, baseX, baseY, enkB);
        if (kolIdx === 0) rijOffset[rijIdx] = kH;
        tekenGrid(ctx, data, g.display, baseX, baseY + kH, enkB/cols, enkH/rows, cols, rows, false);
      } else {
        tekenGrid(ctx, data, g.display, baseX, baseY, enkB/cols, enkH/rows, cols, rows, false);
      }
    } else {
      tekenGrid(ctx, data, g.display, baseX, baseY, enkB/cols, enkH/rows, cols, rows, oplossingModus);
    }
  }
}

function weergaveModus() {
  const formaat = document.getElementById('formaat').value;
  if (formaat !== '7x7') return 'klassiek';
  return document.querySelector('input[name="weergave"]:checked')?.value || 'klassiek';
}

function toonMelding(tekst) {
  const el=document.getElementById('meldingContainer');
  el.innerHTML=tekst; el.classList.toggle('visible',!!tekst);
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONFIG LEZEN — BUG FIX: soort is een <select>, gebruik .value, niet :checked
   ═══════════════════════════════════════════════════════════════════════════ */
function leesRoosterConfig(id) {
  const el = document.getElementById(`rooster-${id}`);
  if (!el) return null;

  const soortEl = el.querySelector(`[name="soort-${id}"]`);
  const soort = soortEl ? soortEl.value : 'optellen';   // .value op <select>, NIET :checked
  const config = { soort };

  if (soort==='optellen' || soort==='aftrekken') {
    config.typeOpgave = soort;
    config.niveau     = el.querySelector(`[name="niveau-${id}"]`)?.value || '20';
    config.brug       = el.querySelector(`[name="brug-${id}"]`)?.value   || 'zonder';
  } else if (soort==='gemengd-plus-min') {
    config.typeOpgave = 'gemengd';
    config.niveau     = el.querySelector(`[name="niveau-${id}"]`)?.value || '20';
    config.brug       = el.querySelector(`[name="brug-${id}"]`)?.value   || 'gemengd';
  } else if (soort==='maal' || soort==='maal-groot' || soort==='maaldeel-gemengd') {
    config.bewerking    = soort === 'maaldeel-gemengd' ? 'gemengd' : 'maal';
    config.maalType     = soort === 'maal-groot' ? 'groot' : 'tafels';
    config.tafelPositie = el.querySelector(`[name="tafelpos-${id}"]`)?.value || 'links';
    const tafelCbs = Array.from(el.querySelectorAll(`[name="tafel-${id}"]:checked`))
                         .map(cb => parseInt(cb.value)).filter(v => !isNaN(v));
    config.tafels = tafelCbs.length >= 2 ? tafelCbs : [1,2,3,4,5,6,7,8,9,10];
    config.teWeinigTafels = tafelCbs.length > 0 && tafelCbs.length < 2;
  }
  return config;
}

/* ═══════════════════════════════════════════════════════════════════════════
   GENEREREN
   ═══════════════════════════════════════════════════════════════════════════ */
function genereerGrid(cols, rows, cfg) {
  if (cfg.soort==='optellen'||cfg.soort==='aftrekken'||cfg.soort==='gemengd-plus-min') {
    const full = genereerPlusMinGrid(cols, rows, cfg.niveau, cfg.typeOpgave, cfg.brug);
    if (full) return { full, melding: null };

    if (cols === 7) {
      // 7×7 zonder brug: mogelijk maar met kleine getallen — probeer nogmaals
      if (cfg.brug === 'zonder') {
        const full2 = genereerPlusMinGrid(cols, rows, cfg.niveau, cfg.typeOpgave, 'zonder');
        if (full2) return { full: full2, melding: null };
        // Lukt echt niet → val terug op gemengd
        const full3 = genereerPlusMinGrid(cols, rows, cfg.niveau, cfg.typeOpgave, 'gemengd');
        if (full3) return { full: full3, melding: '⚠️ 7×7 zonder brug lukte niet — omgezet naar gemengd. Probeer niveau "tot 20".' };
      }
      // Andere fallback: gemengd type
      const full4 = genereerPlusMinGrid(cols, rows, cfg.niveau, 'gemengd', 'gemengd');
      if (full4) return { full: full4, melding: '⚠️ 7×7 met deze instellingen is erg moeilijk — omgezet naar gemengd.' };
    }
    return { full: null, melding: null };
  }
  if (cfg.soort==='maal' || cfg.soort==='maal-groot' || cfg.soort==='maaldeel-gemengd') {
    if (cols === 7) {
      // Vermenigvuldigen werkt niet goed bij 7×7 — gebruik 5×5 logica op een 5×5 grid
      // en toon een melding
      return { full: null, melding: '⚠️ Vermenigvuldigen werkt alleen bij 5×5. Kies 5×5 formaat voor dit rooster.' };
    }
    if (cfg.teWeinigTafels) {
      toonMelding('⚠️ Selecteer minstens 2 tafels. Alle tafels worden nu gebruikt.');
    }
    const full = genereerMaalDeelGrid(cols, rows, cfg.bewerking, cfg.maalType, cfg.tafels);
    if (full) return { full, melding: null };
    return { full: null, melding: null };
  }
  return { full: null, melding: null };
}

function genereerAlles() {
  state.oplossingZichtbaar = false;
  syncOplossingKnop();
  toonMelding('');
  const cols = document.getElementById('formaat').value==='5x5' ? 5 : 7;
  const rows = cols;
  state.grids = [];
  let fout = false;
  for (const rooster of state.roosters) {
    const cfg = leesRoosterConfig(rooster.id);
    if (!cfg) { state.grids.push(null); fout=true; continue; }
    const {full, melding} = genereerGrid(cols, rows, cfg);
    if (melding) toonMelding(melding);
    if (!full) { fout=true; state.grids.push(null); continue; }
    state.grids.push({ full, display: maakDisplayGrid(full, cols, rows) });
  }
  if (fout) toonMelding('⚠️ Eén of meer roosters konden niet worden gegenereerd. Klik opnieuw.');
  tekenAlles(false);
}

function genereerEnkel(id) {
  const idx = state.roosters.findIndex(r => r.id===id);
  if (idx===-1) return;
  const cols = document.getElementById('formaat').value==='5x5' ? 5 : 7;
  const rows = cols;
  const cfg = leesRoosterConfig(id);
  if (!cfg) return;
  const {full, melding} = genereerGrid(cols, rows, cfg);
  if (melding) toonMelding(melding);
  while (state.grids.length <= idx) state.grids.push(null);
  if (!full) {
    toonMelding('⚠️ Kon geen geldig rooster genereren. Probeer andere instellingen.');
    state.grids[idx] = null;
  } else {
    state.grids[idx] = { full, display: maakDisplayGrid(full, cols, rows) };
    if (!melding) toonMelding('');
  }
  tekenAlles(state.oplossingZichtbaar);
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROOSTER KAARTEN
   ═══════════════════════════════════════════════════════════════════════════ */
function maakRoosterKaart(id) {
  const div = document.createElement('div');
  div.className = 'setting-card';
  div.id = `rooster-${id}`;

  div.innerHTML = `
    <div class="setting-card-header">
      <h3>Rekenvierkant ${id}</h3>
      <div class="card-btns">
        <button type="button" class="regen-text-btn" title="Genereer opnieuw" onclick="genereerEnkel(${id})">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          Nieuw
        </button>
        <button type="button" class="icon-btn remove-btn" title="Verwijder" onclick="verwijderRooster(${id})">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </div>
    </div>
    <div class="setting-card-body">

      <!-- Type -->
      <div class="form-row">
        <span class="form-label">Type:</span>
        <select class="cfg-select" name="soort-${id}" onchange="onSoortChange(${id},this.value);genereerEnkel(${id})">
          <option value="optellen">Optellen</option>
          <option value="aftrekken">Aftrekken</option>
          <option value="gemengd-plus-min">+ en − gemengd</option>
          <option value="maal">Vermenigvuldigen (tafels ×1–10)</option>
          <option value="maal-groot">Vermenigvuldigen grote getallen</option>
          <option value="maaldeel-gemengd">× en ÷ gemengd (tafels)</option>
        </select>
      </div>

      <!-- Sectie optellen/aftrekken -->
      <div id="sec-plusmin-${id}">
        <div class="form-row">
          <span class="form-label">Niveau:</span>
          <select class="cfg-select" name="niveau-${id}" onchange="genereerEnkel(${id})">
            <option value="10">Tot 10</option>
            <option value="20" selected>Tot 20</option>
            <option value="100">Tot 100</option>
            <option value="1000">Tot 1000</option>
          </select>
        </div>
        <div class="form-row">
          <span class="form-label">Brug:</span>
          <select class="cfg-select" name="brug-${id}" onchange="genereerEnkel(${id})">
            <option value="zonder">Zonder brug</option>
            <option value="met">Met brug</option>
            <option value="gemengd">Gemengd</option>
          </select>
        </div>
      </div>

      <!-- Sectie maal/deel -->
      <div id="sec-maaldeel-${id}" style="display:none;">
        <!-- Positie alleen bij vermenigvuldigen (niet bij gemengd) -->
        <div id="sec-tafelpos-${id}">
          <div class="form-label" style="margin-bottom:6px;">Tafelgetal staat:</div>
          <div class="radio-group">
            <span class="radio-chip"><input type="radio" name="tafelpos-${id}" id="tp-l-${id}" value="links" checked onchange="genereerEnkel(${id})"><label for="tp-l-${id}">Links (5×3)</label></span>
            <span class="radio-chip"><input type="radio" name="tafelpos-${id}" id="tp-r-${id}" value="rechts" onchange="genereerEnkel(${id})"><label for="tp-r-${id}">Rechts (3×5)</label></span>
          </div>
        </div>
        <!-- Tafelkeuze -->
        <div id="sec-tafels-${id}">
          <div class="form-label" style="margin-bottom:6px;">Tafels:</div>
          <div class="radio-group tafel-chips" id="tafelchips-${id}">
            <span class="radio-chip"><input type="checkbox" name="tafel-all-${id}" id="ta-${id}" onchange="selecteerAlleTafels(${id},this.checked)"><label for="ta-${id}">Alles</label></span>
            ${[1,2,3,4,5,6,7,8,9,10].map(t=>`<span class="radio-chip"><input type="checkbox" name="tafel-${id}" value="${t}" id="t-${id}-${t}"${[2,5].includes(t)?' checked':''}><label for="t-${id}-${t}">${t}</label></span>`).join('')}
          </div>
          <div id="tafel-melding-${id}" style="margin-top:7px;padding:7px 10px;background:#fff9ee;border:1px solid #f5c97a;border-radius:8px;font-size:0.8rem;color:#7a4500;display:none;">
            ⚠️ Selecteer minimaal 2 tafels voor een geldig rooster.
          </div>
        </div>
      </div>

    </div>
  `;

  // Attach change listeners voor tafels
  div.querySelectorAll(`[name="tafel-${id}"]`).forEach(cb => {
    cb.addEventListener('change', () => {
      const alle = Array.from(div.querySelectorAll(`[name="tafel-${id}"]`));
      const taAllEl = div.querySelector(`[name="tafel-all-${id}"]`);
      if (taAllEl) taAllEl.checked = alle.every(c=>c.checked);
      const aantalGekozen = alle.filter(c=>c.checked).length;
      const meldEl = document.getElementById(`tafel-melding-${id}`);
      if (meldEl) meldEl.style.display = aantalGekozen < 2 ? '' : 'none';
      genereerEnkel(id);
    });
  });

  return div;
}

function onSoortChange(id, soort) {
  const isPlusMinus = ['optellen','aftrekken','gemengd-plus-min'].includes(soort);
  const isMaalDeel  = ['maal','maal-groot','maaldeel-gemengd'].includes(soort);
  const plusMinEl   = document.getElementById(`sec-plusmin-${id}`);
  const maalDeelEl  = document.getElementById(`sec-maaldeel-${id}`);
  const tafelposEl  = document.getElementById(`sec-tafelpos-${id}`);
  if (plusMinEl)  plusMinEl.style.display  = isPlusMinus ? '' : 'none';
  if (maalDeelEl) maalDeelEl.style.display = isMaalDeel  ? '' : 'none';
  // Tafelgetal-positie alleen bij vermenigvuldigen, niet bij gemengd
  if (tafelposEl) tafelposEl.style.display = soort === 'maaldeel-gemengd' ? 'none' : '';
}

function selecteerAlleTafels(id, checked) {
  document.querySelectorAll(`[name="tafel-${id}"]`).forEach(cb => cb.checked=checked);
  genereerEnkel(id);
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROOSTERS BEHEREN
   ═══════════════════════════════════════════════════════════════════════════ */
function voegRoosterToe() {
  if (state.roosters.length >= 8) return;
  const id = state.nextId++;
  state.roosters.push({id});
  state.grids.push(null);
  document.getElementById('roosterList').appendChild(maakRoosterKaart(id));
  document.getElementById('voegRoosterToe').disabled = state.roosters.length >= 8;
  updateRoosterCount();
  genereerEnkel(id);
}

function verwijderRooster(id) {
  if (state.roosters.length <= 1) return;
  const idx = state.roosters.findIndex(r=>r.id===id);
  if (idx===-1) return;
  state.roosters.splice(idx,1);
  state.grids.splice(idx,1);
  document.getElementById(`rooster-${id}`)?.remove();
  document.getElementById('voegRoosterToe').disabled = state.roosters.length >= 8;
  updateRoosterCount();
  tekenAlles(state.oplossingZichtbaar);
}

function updateRoosterCount() {
  document.getElementById('roosterCount').textContent = state.roosters.length;
}

/* ═══════════════════════════════════════════════════════════════════════════
   OPLOSSING TOGGLE
   ═══════════════════════════════════════════════════════════════════════════ */
function syncOplossingKnop() {
  const btn = document.getElementById('toonOplossing');
  if (state.oplossingZichtbaar) {
    btn.textContent = '🙈 Verberg oplossing';
    btn.classList.add('active');
  } else {
    btn.textContent = '👁 Toon oplossing';
    btn.classList.remove('active');
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  voegRoosterToe();

  document.getElementById('voegRoosterToe').addEventListener('click', voegRoosterToe);
  document.getElementById('formaat').addEventListener('change', () => {
    const is7x7 = document.getElementById('formaat').value === '7x7';
    const wv = document.getElementById('weergave-keuze');
    const info = document.getElementById('info-7x7');
    if (wv)   wv.style.display   = is7x7 ? '' : 'none';
    if (info) info.style.display = is7x7 ? '' : 'none';
    toonMelding('');
    genereerAlles();
  });
  document.getElementById('genereerAllesBtn').addEventListener('click', genereerAlles);

  document.getElementById('toonOplossing').addEventListener('click', () => {
    state.oplossingZichtbaar = !state.oplossingZichtbaar;
    syncOplossingKnop();
    tekenAlles(state.oplossingZichtbaar);
  });

  document.getElementById('downloadPngBtn').addEventListener('click', () => {
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href=url; a.download='rekenvierkant.png'; a.click();
  });

  document.getElementById('infoBtn').addEventListener('click', () => {
    document.getElementById('infoModal').style.display='flex';
  });
  ['infoModalClose','infoModalClose2'].forEach(id => {
    document.getElementById(id).addEventListener('click', () => {
      document.getElementById('infoModal').style.display='none';
    });
  });
  document.getElementById('infoModal').addEventListener('click', e => {
    if (e.target===e.currentTarget) e.currentTarget.style.display='none';
  });
});