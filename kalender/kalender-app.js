'use strict';

// ── CONSTANTEN ────────────────────────────────────────────────
const DAGEN_NL   = ['maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag','zondag'];
const DAGEN_KORT = ['ma','di','wo','do','vr','za','zo'];
const MAANDEN_NL = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
const MAANDEN_NL_HOOFD = ['Januari','Februari','Maart','April','Mei','Juni','Juli','Augustus','September','Oktober','November','December'];

function dagIndex(date) { return (date.getDay() + 6) % 7; }
function isSchrikkeljaar(jaar) { return (jaar%4===0 && jaar%100!==0) || jaar%400===0; }
function aantalDagenInMaand(jaar, maand) { return new Date(jaar, maand+1, 0).getDate(); }
function dagNaam(date) { return DAGEN_NL[dagIndex(date)]; }
function shuffleArr(arr) {
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}
function datumSleutel(jaar, maand, dag) { return `${jaar}-${maand}-${dag}`; }

// ── SCHOOLVAKANTIES ───────────────────────────────────────────
const VAKANTIES = {
  vlaanderen: [
    {naam:'Herfstvakantie', van:new Date(2024,9,28),  tot:new Date(2024,10,1)},
    {naam:'Kerstvakantie',  van:new Date(2024,11,23), tot:new Date(2025,0,3)},
    {naam:'Krokusvakantie', van:new Date(2025,2,3),   tot:new Date(2025,2,7)},
    {naam:'Paasvakantie',   van:new Date(2025,3,7),   tot:new Date(2025,3,18)},
    {naam:'Zomervakantie',  van:new Date(2025,6,1),   tot:new Date(2025,7,31)},
    {naam:'Herfstvakantie', van:new Date(2025,9,27),  tot:new Date(2025,9,31)},
    {naam:'Kerstvakantie',  van:new Date(2025,11,22), tot:new Date(2026,0,2)},
    {naam:'Krokusvakantie', van:new Date(2026,1,16),  tot:new Date(2026,1,20)},
    {naam:'Paasvakantie',   van:new Date(2026,2,30),  tot:new Date(2026,3,10)},
    {naam:'Zomervakantie',  van:new Date(2026,6,1),   tot:new Date(2026,7,31)},
  ],
  nederland: [
    {naam:'Herfstvakantie',     van:new Date(2024,9,19),  tot:new Date(2024,9,27)},
    {naam:'Kerstvakantie',      van:new Date(2024,11,21), tot:new Date(2025,0,5)},
    {naam:'Voorjaarsvakantie',  van:new Date(2025,1,22),  tot:new Date(2025,2,2)},
    {naam:'Meivakantie',        van:new Date(2025,3,19),  tot:new Date(2025,3,27)},
    {naam:'Zomervakantie',      van:new Date(2025,6,19),  tot:new Date(2025,7,31)},
    {naam:'Herfstvakantie',     van:new Date(2025,9,18),  tot:new Date(2025,9,26)},
    {naam:'Kerstvakantie',      van:new Date(2025,11,20), tot:new Date(2026,0,4)},
    {naam:'Voorjaarsvakantie',  van:new Date(2026,1,14),  tot:new Date(2026,1,22)},
    {naam:'Meivakantie',        van:new Date(2026,3,25),  tot:new Date(2026,4,3)},
    {naam:'Zomervakantie',      van:new Date(2026,6,18),  tot:new Date(2026,7,30)},
  ],
};

function getVakantie(date, regio) {
  if (regio === 'geen') return null;
  const d = date.getTime();
  for (const v of (VAKANTIES[regio] || [])) {
    if (d >= v.van.getTime() && d <= v.tot.getTime()) return v.naam;
  }
  return null;
}

// ── GLOBALE KALENDER STATE (sidebar) ─────────────────────────
// Gedeelde events-map: sleutel = "jaar-maand-dag", waarde = {naam, kleur}
// Alle kalender-blokken in de bundel verwijzen naar dezelfde events-map.
// Zo zijn events live bewerkbaar vanuit elke kalender in de preview.
let kalEvents = {};
// Eigen opdrachten die de leerkracht onder de kalender toevoegt
let kalOpdrachten = [];
let huidigJaar, huidigMaand, huidigRegio = 'geen';

// ── POPUP STATE ───────────────────────────────────────────────
let popupDag = null, popupJaar = null, popupMaand = null, gekozenKleur = '';

// ── LOCALSTORAGE ──────────────────────────────────────────────
const LS_KEY = 'jufzisa_kalenders';

function laadOpgeslagen() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}
function slaOp(naam, data) {
  const alle = laadOpgeslagen(); alle[naam] = data;
  localStorage.setItem(LS_KEY, JSON.stringify(alle));
}
function verwijderOpgeslagen(naam) {
  const alle = laadOpgeslagen(); delete alle[naam];
  localStorage.setItem(LS_KEY, JSON.stringify(alle));
}
function updateOpgeslagenLijst() {
  const lijst = document.getElementById('kalGeslagenLijst');
  if (!lijst) return;
  const alle = laadOpgeslagen();
  lijst.innerHTML = '<option value="">— Kies opgeslagen kalender —</option>';
  Object.keys(alle).sort().forEach(naam => {
    const opt = document.createElement('option');
    opt.value = naam; opt.textContent = naam;
    lijst.appendChild(opt);
  });
}

// ── KALENDER TEKENEN (herbruikbaar) ──────────────────────────
// Tekent een interactieve kalender-grid in 'container'.
// jaar/maand/regio bepalen de inhoud.
// events = gedeelde referentie naar kalEvents.
// onDagKlik(dag, jaar, maand, celEl) = callback bij klik op dag.
function tekenKalenderGrid(container, jaar, maand, regio, events, onDagKlik) {
  container.innerHTML = '';
  const vandaag = new Date();
  const eerstedag = new Date(jaar, maand, 1);
  const startIdx = dagIndex(eerstedag);
  const aantalDagen = aantalDagenInMaand(jaar, maand);

  const titel = document.createElement('div');
  titel.className = 'kal-maand-naam';
  titel.textContent = `${MAANDEN_NL_HOOFD[maand]} ${jaar}`;
  container.appendChild(titel);

  const grid = document.createElement('div');
  grid.className = 'kal-grid';

  DAGEN_KORT.forEach((d, i) => {
    const h = document.createElement('div');
    h.className = 'kal-dag-header' + (i >= 5 ? ' weekend' : '');
    h.textContent = d.toUpperCase();
    grid.appendChild(h);
  });

  for (let i = 0; i < startIdx; i++) {
    const leeg = document.createElement('div');
    leeg.className = 'kal-dag leeg';
    grid.appendChild(leeg);
  }

  for (let dag = 1; dag <= aantalDagen; dag++) {
    const d = new Date(jaar, maand, dag);
    const isWE = dagIndex(d) >= 5;
    const vakantie = getVakantie(d, regio);
    const isVandaag = d.toDateString() === vandaag.toDateString();
    const sleutel = datumSleutel(jaar, maand, dag);
    const event = events[sleutel];

    const cel = document.createElement('div');
    cel.className = 'kal-dag';
    if (isWE) cel.classList.add('weekend');
    if (vakantie) cel.classList.add('vakantie');
    if (isVandaag) cel.classList.add('vandaag');
    if (event?.kleur) cel.style.background = event.kleur;

    const nr = document.createElement('div');
    nr.className = 'kal-dag-nr';
    nr.textContent = dag;
    cel.appendChild(nr);

    if (vakantie) {
      const vak = document.createElement('div');
      vak.className = 'kal-dag-vakantie';
      vak.textContent = vakantie;
      cel.appendChild(vak);
    }
    if (event?.naam) {
      const chip = document.createElement('div');
      chip.className = 'kal-event-chip';
      chip.style.background = event.kleur || '#e8f0fe';
      chip.textContent = event.naam;
      cel.appendChild(chip);
    }

    cel.addEventListener('click', (e) => onDagKlik(dag, jaar, maand, e.currentTarget));
    grid.appendChild(cel);
  }
  container.appendChild(grid);
}

// ── SIDEBAR PREVIEW KALENDER ──────────────────────────────────
// De kleine interactieve kalender in de sidebar (tab Kalender),
// zodat de leerkracht events kan toevoegen vóór "Voeg toe aan bundel".
function tekenSidebarKalender() {
  const container = document.getElementById('sidebarKalenderPreview');
  if (!container) return;
  tekenKalenderGrid(container, huidigJaar, huidigMaand, huidigRegio, kalEvents,
    (dag, jaar, maand, celEl) => openPopup(dag, jaar, maand, celEl)
  );
}

// ── ALLE KALENDER-BLOKKEN IN BUNDEL HERTEKENEN ───────────────
// Wordt aangeroepen na elke event-wijziging zodat alle live previews updaten.
function tekenAlleKalenderBlokken() {
  document.querySelectorAll('[data-kalender-blok]').forEach(container => {
    const blokId = parseInt(container.dataset.kalenderBlok);
    const oef = Bundel.getOefeningen().find(o => o.groepId === blokId);
    if (!oef) return;
    tekenKalenderBlokInhoud(container, oef.inst);
  });
}

// Tekent de inhoud van één kalender-blok in de bundel-preview.
function tekenKalenderBlokInhoud(container, inst) {
  container.innerHTML = '';
  const { jaar, maand, regio, heeft2de, maand2, jaar2, opdrachten } = inst;

  // Kalender(s) met kader
  if (heeft2de) {
    const wrapper = document.createElement('div');
    wrapper.className = 'kal-twee-naast-elkaar';

    const k1wrap = document.createElement('div');
    k1wrap.className = 'kal-blok-kader';
    tekenKalenderGrid(k1wrap, jaar, maand, regio, kalEvents,
      (dag, j, m, celEl) => openPopup(dag, j, m, celEl));

    const k2wrap = document.createElement('div');
    k2wrap.className = 'kal-blok-kader';
    tekenKalenderGrid(k2wrap, jaar2, maand2, regio, kalEvents,
      (dag, j, m, celEl) => openPopup(dag, j, m, celEl));

    wrapper.appendChild(k1wrap);
    wrapper.appendChild(k2wrap);
    container.appendChild(wrapper);
  } else {
    const kwrap = document.createElement('div');
    kwrap.className = 'kal-blok-kader';
    tekenKalenderGrid(kwrap, jaar, maand, regio, kalEvents,
      (dag, j, m, celEl) => openPopup(dag, j, m, celEl));
    container.appendChild(kwrap);
  }

  // Eigen opdrachten (vraag + invullijn op dezelfde rij)
  if (opdrachten && opdrachten.length) {
    const opdrDiv = document.createElement('div');
    opdrDiv.style.cssText = 'margin-top:10px;';
    opdrachten.forEach((vraag, i) => {
      if (!vraag.trim()) return;
      const rij = document.createElement('div');
      rij.style.cssText = 'display:flex;align-items:baseline;gap:8px;margin-bottom:10px;font-size:13px;color:#1a3a5c;';
      rij.innerHTML = `<span style="white-space:nowrap;font-weight:600;">${i+1}.&nbsp;&nbsp;${vraag}</span>
        <span style="flex:1;border-bottom:1.5px solid #333;min-width:60px;"></span>`;
      opdrDiv.appendChild(rij);
    });
    container.appendChild(opdrDiv);
  }
}

// ── EVENT POPUP ───────────────────────────────────────────────
function openPopup(dag, jaar, maand, celEl) {
  popupDag = dag; popupJaar = jaar; popupMaand = maand;
  const sleutel = datumSleutel(jaar, maand, dag);
  const event = kalEvents[sleutel] || {};
  gekozenKleur = event.kleur || '';

  const popup = document.getElementById('eventPopup');
  document.getElementById('popupTitel').textContent =
    `${dag} ${MAANDEN_NL[maand]} ${jaar}`;
  document.getElementById('popupNaam').value = event.naam || '';

  document.querySelectorAll('.kleur-keuze').forEach(el => {
    el.classList.toggle('geselecteerd', el.dataset.kleur === gekozenKleur);
  });

  const rect = celEl.getBoundingClientRect();
  popup.style.display = 'block';
  let top = rect.bottom + 8;
  let left = rect.left;
  if (top + 220 > window.innerHeight) top = rect.top - 230;
  if (left + 280 > window.innerWidth) left = window.innerWidth - 290;
  if (left < 4) left = 4;
  popup.style.top = `${top}px`;
  popup.style.left = `${left}px`;
  document.getElementById('popupNaam').focus();
}

function sluitPopup() {
  document.getElementById('eventPopup').style.display = 'none';
  popupDag = null; popupJaar = null; popupMaand = null;
}

// ── KALENDER MODULE (voor bundel + PDF) ──────────────────────
const KalenderModule = {
  leesInstellingen() {
    const heeft2de = document.getElementById('tweedeKalender')?.checked || false;
    return {
      type: 'kalender',
      maand: huidigMaand,
      jaar: huidigJaar,
      regio: huidigRegio,
      heeft2de,
      maand2: heeft2de ? parseInt(document.getElementById('kalMaand2').value) : null,
      jaar2:  heeft2de ? (parseInt(document.getElementById('kalJaar2').value) || huidigJaar) : null,
      opdrachten: kalOpdrachten.filter(v => v.trim()),
      // events is geen snapshot maar een referentie — live!
      get events() { return kalEvents; },
    };
  },

  tekenInPdfKlein(doc, inst, x, y, breedte, pageH) {
    const { jaar, maand, regio } = inst;
    const events = kalEvents; // altijd live
    const eerstedag = new Date(jaar, maand, 1);
    const startIdx = dagIndex(eerstedag);
    const aantalDagen = aantalDagenInMaand(jaar, maand);
    const colW = breedte / 7;
    const rijH = 11;
    const pad = 3;

    // Teken kalender-inhoud met pad offset
    doc.setFontSize(10); doc.setFont(undefined, 'bold'); doc.setTextColor(26,58,92);
    doc.text(`${MAANDEN_NL_HOOFD[maand]} ${jaar}`, x + breedte/2, y+pad+5, {align:'center'});
    let yy = y + pad + 8;

    DAGEN_KORT.forEach((d,i) => {
      const isWE = i>=5;
      doc.setFillColor(isWE?127:74, isWE?140:144, isWE?154:217);
      doc.rect(x+i*colW, yy, colW-0.5, 6, 'F');
      doc.setFontSize(6.5); doc.setFont(undefined,'bold'); doc.setTextColor(255,255,255);
      doc.text(d, x+i*colW+colW/2, yy+4.5, {align:'center'});
    });
    yy += 7;

    let kol = startIdx, rij = 0;
    for (let dag=1; dag<=aantalDagen; dag++) {
      const d = new Date(jaar, maand, dag);
      const cx = x + kol*colW;
      const cy = yy + rij*rijH;
      const isWE = dagIndex(d)>=5;
      const vakantie = getVakantie(d, regio);
      const sleutel = datumSleutel(jaar, maand, dag);
      const event = events?.[sleutel];

      if (event?.kleur) {
        const hex=event.kleur;
        doc.setFillColor(parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16));
        doc.rect(cx, cy, colW-0.5, rijH-0.5, 'F');
      } else if (vakantie) {
        doc.setFillColor(255,240,240); doc.rect(cx, cy, colW-0.5, rijH-0.5, 'F');
      } else if (isWE) {
        doc.setFillColor(242,244,246); doc.rect(cx, cy, colW-0.5, rijH-0.5, 'F');
      }
      doc.setDrawColor(210,220,235); doc.setLineWidth(0.15);
      doc.rect(cx, cy, colW-0.5, rijH-0.5, 'S');
      doc.setFontSize(7.5); doc.setFont(undefined,'bold');
      doc.setTextColor(vakantie?192:isWE?127:26, vakantie?57:isWE?140:58, vakantie?43:isWE?154:92);
      doc.text(dag.toString(), cx+2, cy+7.5);
      if (event?.naam) {
        doc.setFontSize(5); doc.setFont(undefined,'normal'); doc.setTextColor(50,50,50);
        doc.text(event.naam.substring(0,8), cx+colW/2, cy+rijH-1.5, {align:'center'});
      }
      kol++; if(kol===7){kol=0;rij++;}
    }
    const aantalRijen = Math.ceil((startIdx+aantalDagen)/7);
    const yEinde = yy + aantalRijen*rijH + pad;

    // Kader rond de kleine kalender
    doc.setDrawColor(74, 144, 217); doc.setLineWidth(0.5);
    doc.roundedRect(x - pad, y, breedte + 2*pad, yEinde - y, 2, 2, 'S');

    return yEinde;
  },

  tekenInPdf(doc, inst, yStart, margin, pageW) {
    const { jaar, maand, regio } = inst;
    const events = kalEvents;
    const eerstedag = new Date(jaar, maand, 1);
    const startIdx = dagIndex(eerstedag);
    const aantalDagen = aantalDagenInMaand(jaar, maand);
    const breedte = pageW - 2 * margin;
    const pad = 4; // padding binnen kader
    let y = yStart + pad;

    doc.setFontSize(16); doc.setFont(undefined, 'bold');
    doc.setTextColor(26, 58, 92);
    doc.text(`${MAANDEN_NL_HOOFD[maand]} ${jaar}`, pageW/2, y+8, {align:'center'});
    y += 14;

    const colW = breedte / 7;
    const rijH = 16;

    DAGEN_KORT.forEach((d, i) => {
      const x = margin + i * colW;
      const isWE = i >= 5;
      doc.setFillColor(isWE ? 127 : 74, isWE ? 140 : 144, isWE ? 154 : 217);
      doc.rect(x, y, colW-1, 8, 'F');
      doc.setFontSize(8); doc.setFont(undefined, 'bold');
      doc.setTextColor(255,255,255);
      doc.text(d.toUpperCase(), x+colW/2, y+5.8, {align:'center'});
    });
    y += 9;

    let kolom = startIdx, rij = 0;
    for (let dag = 1; dag <= aantalDagen; dag++) {
      const d = new Date(jaar, maand, dag);
      const x = margin + kolom * colW;
      const wy = y + rij * rijH;
      const isWE = dagIndex(d) >= 5;
      const vakantie = getVakantie(d, regio);
      const sleutel = datumSleutel(jaar, maand, dag);
      const event = events?.[sleutel];

      if (event?.kleur) {
        const hex = event.kleur;
        const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
        doc.setFillColor(r,g,b);
        doc.rect(x, wy, colW-1, rijH-1, 'F');
      } else if (vakantie) {
        doc.setFillColor(255, 240, 240);
        doc.rect(x, wy, colW-1, rijH-1, 'F');
      } else if (isWE) {
        doc.setFillColor(242, 244, 246);
        doc.rect(x, wy, colW-1, rijH-1, 'F');
      }

      doc.setDrawColor(200, 215, 230); doc.setLineWidth(0.2);
      doc.rect(x, wy, colW-1, rijH-1, 'S');

      doc.setFontSize(10); doc.setFont(undefined, 'bold');
      doc.setTextColor(vakantie ? 192 : isWE ? 127 : 26, vakantie ? 57 : isWE ? 140 : 58, vakantie ? 43 : isWE ? 154 : 92);
      doc.text(dag.toString(), x+2, wy+7);

      if (vakantie) {
        doc.setFontSize(5.5); doc.setFont(undefined, 'italic');
        doc.setTextColor(180, 60, 60);
        doc.text(vakantie.substring(0,12), x+colW/2, wy+12.5, {align:'center'});
      }
      if (event?.naam) {
        doc.setFontSize(6); doc.setFont(undefined, 'bold');
        doc.setTextColor(50,50,50);
        doc.text(event.naam.substring(0,10), x+colW/2, wy+13.5, {align:'center'});
      }

      kolom++;
      if (kolom === 7) { kolom = 0; rij++; }
    }
    const aantalRijen = Math.ceil((startIdx + aantalDagen) / 7);
    const yEinde = y + aantalRijen * rijH + pad;

    // Kader rond de hele kalender
    doc.setDrawColor(74, 144, 217); doc.setLineWidth(0.5);
    doc.roundedRect(margin - pad, yStart, breedte + 2*pad, yEinde - yStart + pad, 2, 2, 'S');

    return yEinde + pad + 2;
  }
};

// ── DAGEN MODULE ──────────────────────────────────────────────
const DagenModule = {
  genereerOefeningen(inst) {
    const { typen, metDatum, refDatum, aantal } = inst;
    const oefeningen = [];
    if (!typen.length) return [];
    for (let i = 0; i < aantal; i++) {
      const type = typen[i % typen.length];
      const basis = new Date(refDatum);
      basis.setDate(basis.getDate() + Math.floor(Math.random()*10));
      let vraag, antwoord;
      if (type === 'omgekeerd') {
        const v = [1,2,-1,-2][Math.floor(Math.random()*4)];
        const doel = new Date(basis); doel.setDate(doel.getDate()+v);
        const rel = v===1?'morgen':v===-1?'gisteren':v===2?'overmorgen':'eergisteren';
        vraag = metDatum
          ? `${rel[0].toUpperCase()+rel.slice(1)} is het ${dagNaam(doel)} ${doel.getDate()} ${MAANDEN_NL[doel.getMonth()]}. Welke dag is het vandaag?`
          : `${rel[0].toUpperCase()+rel.slice(1)} is het ${dagNaam(doel)}. Welke dag is het vandaag?`;
        antwoord = metDatum ? `${dagNaam(basis)} ${basis.getDate()} ${MAANDEN_NL[basis.getMonth()]}` : dagNaam(basis);
      } else {
        const v = type==='gisteren'?-1:type==='eergisteren'?-2:type==='morgen'?1:2;
        const doel = new Date(basis); doel.setDate(doel.getDate()+v);
        vraag = metDatum
          ? `Vandaag is het ${dagNaam(basis)} ${basis.getDate()} ${MAANDEN_NL[basis.getMonth()]}. Welke dag was/is ${type}?`
          : `Vandaag is het ${dagNaam(basis)}. Welke dag was/is ${type}?`;
        antwoord = metDatum ? `${dagNaam(doel)} ${doel.getDate()} ${MAANDEN_NL[doel.getMonth()]}` : dagNaam(doel);
      }
      oefeningen.push({ vraag, antwoord });
    }
    return oefeningen;
  },

  leesInstellingen() {
    const typen = Array.from(document.querySelectorAll('input[name="dagenType"]:checked')).map(c=>c.value);
    if (!typen.length) { document.getElementById('meldingDagen').textContent='Kies minstens één type!'; return null; }
    document.getElementById('meldingDagen').textContent='';
    const metDatum = document.querySelector('input[name="dagenMetDatum"]:checked')?.value==='ja';
    const refType  = document.querySelector('input[name="dagenRef"]:checked')?.value||'vandaag';
    const refDatum = refType==='vandaag' ? new Date() : new Date(document.getElementById('dagenDatum').value||Date.now());
    const aantal   = Math.max(1, parseInt(document.getElementById('dagenAantal').value)||4);
    const metWeekstrip = document.getElementById('dagenWeekstrip')?.checked||false;
    const oefeningen = this.genereerOefeningen({typen,metDatum,refDatum,aantal});
    return {type:'dagen',typen,metDatum,refDatum,aantal,metWeekstrip,oefeningen};
  },

  tekenPreviewHtml(container, inst) {
    container.innerHTML='';
    if (inst.metWeekstrip) {
      const strip = document.createElement('div');
      strip.style.cssText='display:flex;gap:3px;margin-bottom:8px;';
      DAGEN_KORT.forEach((d,i)=>{
        const cel=document.createElement('div');
        cel.style.cssText=`flex:1;text-align:center;padding:5px 2px;border-radius:5px;font-size:11px;font-weight:700;background:${i>=5?'#f2f4f6':'#e8f4ff'};color:${i>=5?'#7f8c9a':'#1a3a5c'};border:1px solid ${i>=5?'#dde2e8':'#c0d8ee'};`;
        cel.textContent=d.toUpperCase();
        strip.appendChild(cel);
      });
      container.appendChild(strip);
    }
    inst.oefeningen.forEach((oef,i)=>{
      const rij=document.createElement('div');
      rij.style.cssText='display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #eee;font-size:13px;';
      rij.innerHTML=`<span style="color:#888;min-width:20px;">${i+1}.</span><span style="flex:1;color:#1a3a5c;">${oef.vraag}</span><span style="border-bottom:1.5px solid #333;display:inline-block;min-width:80px;"></span>`;
      container.appendChild(rij);
    });
  },

  tekenInPdf(doc, inst, y, margin, pageW, pageH) {
    const breedte = pageW-2*margin;
    if (inst.metWeekstrip) {
      const colW=breedte/7;
      DAGEN_KORT.forEach((d,i)=>{
        const x=margin+i*colW; const isWE=i>=5;
        doc.setFillColor(isWE?242:232,isWE?244:244,isWE?246:255);
        doc.setDrawColor(180,200,230); doc.setLineWidth(0.3);
        doc.rect(x,y,colW-1,10,'FD');
        doc.setFontSize(9); doc.setFont(undefined,'bold');
        doc.setTextColor(isWE?127:26,isWE?140:58,isWE?154:92);
        doc.text(d.toUpperCase(),x+colW/2,y+7,{align:'center'});
      });
      y+=14;
    }
    inst.oefeningen.forEach((oef,i)=>{
      if(y+14+margin>pageH){doc.addPage();y=margin;}
      doc.setFontSize(12); doc.setFont(undefined,'normal'); doc.setTextColor(80,80,80);
      doc.text(`${i+1}.`,margin,y+9);
      doc.setTextColor(26,58,92);
      doc.text(oef.vraag,margin+8,y+9,{maxWidth:breedte*0.7});
      doc.setDrawColor(80,80,80); doc.setLineWidth(0.5);
      doc.line(margin+breedte*0.72,y+10,margin+breedte,y+10);
      y+=14;
    });
    return y+4;
  }
};

// ── MAANDEN MODULE ────────────────────────────────────────────
const MaandenModule = {
  genereer(typen, aantal) {
    const jaar=new Date().getFullYear();
    const pool=[];
    if(typen.includes('volgorde')) {
      for(let m=0;m<12;m++){
        pool.push({vraag:`Welke maand komt na ${MAANDEN_NL[m]}?`, antwoord:MAANDEN_NL[(m+1)%12]});
        pool.push({vraag:`Welke maand komt voor ${MAANDEN_NL[m]}?`, antwoord:MAANDEN_NL[(m+11)%12]});
        pool.push({vraag:`${MAANDEN_NL[m]} is de ___de maand van het jaar.`, antwoord:`${m+1}`});
      }
    }
    if(typen.includes('hoeveel_dagen')) {
      for(let m=0;m<12;m++){
        const d=new Date(jaar,m+1,0).getDate();
        pool.push({vraag:`Hoeveel dagen heeft ${MAANDEN_NL[m]}?`, antwoord:`${d}`});
      }
    }
    if(typen.includes('schrikkeljaar')) {
      pool.push({vraag:`Is ${jaar} een schrikkeljaar?`, antwoord:isSchrikkeljaar(jaar)?'Ja':'Nee'});
      pool.push({vraag:`Hoeveel dagen heeft februari in een schrikkeljaar?`, antwoord:'29'});
      pool.push({vraag:`Hoeveel dagen heeft februari in een gewoon jaar?`, antwoord:'28'});
    }
    if(typen.includes('weken')) {
      pool.push({vraag:'Een maand heeft ongeveer ___ weken.', antwoord:'4'});
      pool.push({vraag:'4 weken = ___ dagen.', antwoord:'28'});
      pool.push({vraag:'2 weken = ___ dagen.', antwoord:'14'});
      pool.push({vraag:'1 week = ___ dagen.', antwoord:'7'});
      pool.push({vraag:'Een jaar heeft ongeveer ___ weken.', antwoord:'52'});
    }
    if(typen.includes('seizoenen')) {
      const seizoenen={lente:['maart','april','mei'],zomer:['juni','juli','augustus'],herfst:['september','oktober','november'],winter:['december','januari','februari']};
      Object.entries(seizoenen).forEach(([s,ms])=>{
        pool.push({vraag:`Welke maanden horen bij de ${s}?`, antwoord:ms.join(', ')});
        ms.forEach(m=>pool.push({vraag:`In welk seizoen valt ${m}?`, antwoord:s}));
      });
    }
    return shuffleArr(pool).slice(0,aantal);
  },

  leesInstellingen() {
    const typen=Array.from(document.querySelectorAll('input[name="maandenType"]:checked')).map(c=>c.value);
    if(!typen.length){document.getElementById('meldingMaanden').textContent='Kies minstens één type!';return null;}
    document.getElementById('meldingMaanden').textContent='';
    const aantal=Math.max(1,parseInt(document.getElementById('maandenAantal').value)||6);
    const oefeningen=this.genereer(typen,aantal);
    return {type:'maanden',typen,aantal,oefeningen};
  },

  tekenPreviewHtml(container,inst) {
    container.innerHTML='';
    inst.oefeningen.forEach((oef,i)=>{
      const rij=document.createElement('div');
      rij.style.cssText='display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #eee;font-size:13px;';
      rij.innerHTML=`<span style="color:#888;min-width:20px;">${i+1}.</span><span style="flex:1;color:#1a3a5c;">${oef.vraag}</span><span style="border-bottom:1.5px solid #333;display:inline-block;min-width:60px;"></span>`;
      container.appendChild(rij);
    });
  },

  tekenInPdf(doc,inst,y,margin,pageW,pageH) {
    const breedte=pageW-2*margin; const kolW=(breedte-6)/2;
    inst.oefeningen.forEach((oef,i)=>{
      const col=i%2; const x=margin+col*(kolW+6);
      if(col===0&&i>0&&y+13+margin>pageH){doc.addPage();y=margin;}
      const wy=col===0?y:y; // simplified
      doc.setFontSize(11); doc.setFont(undefined,'normal'); doc.setTextColor(80,80,80);
      doc.text(`${i+1}.`,x,wy+8);
      doc.setTextColor(26,58,92);
      doc.text(oef.vraag,x+8,wy+8,{maxWidth:kolW*0.62});
      doc.setDrawColor(80,80,80); doc.setLineWidth(0.5);
      doc.line(x+kolW*0.68,wy+9,x+kolW-2,wy+9);
      if(col===1) y+=13;
    });
    return y+13+6;
  }
};

// ── TELLEN MODULE ─────────────────────────────────────────────
let tellenEvents = [];

const TellenModule = {
  leesInstellingen() {
    if(!tellenEvents.length){document.getElementById('meldingTellen').textContent='Voeg minstens één event toe!';return null;}
    document.getElementById('meldingTellen').textContent='';
    const startType=document.querySelector('input[name="tellenStart"]:checked')?.value||'vandaag';
    const startDatum=startType==='vandaag'?new Date():new Date(document.getElementById('tellenDatumStart').value||Date.now());
    const eenheid=document.querySelector('input[name="tellenEenheid"]:checked')?.value||'dagen';
    const metKalender=document.getElementById('tellenMetKalender')?.checked||false;
    const events=tellenEvents.map(e=>({naam:e.naam,datum:new Date(e.datumStr)})).filter(e=>e.naam&&!isNaN(e.datum));
    return {type:'tellen',startDatum,events,eenheid,metKalender};
  },

  tekenPreviewHtml(container,inst) {
    container.innerHTML='';
    const {startDatum,events,eenheid}=inst;
    events.forEach(ev=>{
      const dagen=Math.round((ev.datum-startDatum)/(86400000));
      const weken=Math.floor(dagen/7);
      let ant=eenheid==='dagen'?`${dagen} dag${dagen!==1?'en':''}`
        :eenheid==='weken'?`${weken} week${weken!==1?'en':''}`
        :`${weken} week${weken!==1?'en':''} en ${dagen%7} dag${dagen%7!==1?'en':''}`;
      const startStr=`${dagNaam(startDatum)} ${startDatum.getDate()} ${MAANDEN_NL[startDatum.getMonth()]}`;
      const evStr=`${dagNaam(ev.datum)} ${ev.datum.getDate()} ${MAANDEN_NL[ev.datum.getMonth()]}`;
      const div=document.createElement('div');
      div.style.cssText='border:1.5px solid #c0d8ee;border-radius:8px;padding:10px;margin-bottom:8px;background:#f8fbff;font-size:13px;';
      div.innerHTML=`<strong>Vandaag</strong> is ${startStr}.<br><strong>${ev.naam}</strong> is op ${evStr}.<br><span style="color:#555;">Nog hoeveel ${eenheid==='weken'?'weken':'dagen'}? <span style="border-bottom:1.5px solid #333;display:inline-block;width:50px;"></span></span>`;
      container.appendChild(div);
    });
  },

  tekenInPdf(doc,inst,y,margin,pageW,pageH) {
    const {startDatum,events,eenheid,metKalender}=inst;
    const breedte=pageW-2*margin;
    events.forEach(ev=>{
      const dagen=Math.round((ev.datum-startDatum)/86400000);
      const overMaand=startDatum.getMonth()!==ev.datum.getMonth()||startDatum.getFullYear()!==ev.datum.getFullYear();
      const kalH=metKalender?(overMaand?58:55):0;
      if(y+30+kalH+margin>pageH){doc.addPage();y=margin;}
      const startStr=`${dagNaam(startDatum)} ${startDatum.getDate()} ${MAANDEN_NL[startDatum.getMonth()]} ${startDatum.getFullYear()}`;
      const evStr=`${dagNaam(ev.datum)} ${ev.datum.getDate()} ${MAANDEN_NL[ev.datum.getMonth()]} ${ev.datum.getFullYear()}`;
      doc.setFontSize(12); doc.setFont(undefined,'normal'); doc.setTextColor(26,58,92);
      doc.text(`Vandaag is het ${startStr}.`,margin,y+8);
      doc.setFont(undefined,'bold'); doc.text(ev.naam,margin,y+16);
      doc.setFont(undefined,'normal'); doc.text(` is op ${evStr}.`,margin+doc.getTextWidth(ev.naam),y+16);
      doc.setFontSize(11); doc.setTextColor(60,60,60);
      const label=eenheid==='weken'?'weken':'dagen';
      doc.text(`Nog hoeveel ${label}?`,margin,y+24);
      doc.setDrawColor(80,80,80); doc.setLineWidth(0.5);
      doc.line(margin+48,y+25,margin+90,y+25);
      y+=28;
      if(metKalender){
        const kalW=overMaand?(breedte-8)/2:breedte*0.55;
        tekenKleinePdfKalender(doc,startDatum.getFullYear(),startDatum.getMonth(),margin,y,kalW,52,startDatum,ev.datum,'geen');
        if(overMaand) tekenKleinePdfKalender(doc,ev.datum.getFullYear(),ev.datum.getMonth(),margin+kalW+8,y,kalW,52,startDatum,ev.datum,'geen');
        y+=56;
      }
      y+=6;
    });
    return y;
  }
};

function tekenKleinePdfKalender(doc,jaar,maand,x,y,breedte,hoogte,van,tot,regio){
  const eerstedag=new Date(jaar,maand,1);
  const startIdx=dagIndex(eerstedag);
  const aantalDagen=aantalDagenInMaand(jaar,maand);
  const rijH=(hoogte-12)/6;
  const colW=breedte/7;
  doc.setFontSize(8); doc.setFont(undefined,'bold'); doc.setTextColor(26,58,92);
  doc.text(`${MAANDEN_NL_HOOFD[maand]} ${jaar}`,x+breedte/2,y+5,{align:'center'});
  DAGEN_KORT.forEach((d,i)=>{
    doc.setFontSize(6); doc.setFont(undefined,'bold'); doc.setTextColor(74,144,217);
    doc.text(d,x+i*colW+colW/2,y+10,{align:'center'});
  });
  let kol=startIdx,rij=1;
  for(let dag=1;dag<=aantalDagen;dag++){
    const d=new Date(jaar,maand,dag);
    const dx=x+kol*colW; const dy=y+rij*rijH+6;
    const isWE=dagIndex(d)>=5;
    const gemarkeerd=van&&tot&&d>=van&&d<=tot;
    if(gemarkeerd){doc.setFillColor(255,230,150);doc.rect(dx,dy-3,colW-0.3,rijH,'F');}
    doc.setFontSize(6.5); doc.setFont(undefined,gemarkeerd?'bold':'normal');
    doc.setTextColor(isWE?160:gemarkeerd?120:60,isWE?60:60,isWE?50:60);
    doc.text(dag.toString(),dx+colW/2,dy+2,{align:'center'});
    kol++; if(kol===7){kol=0;rij++;}
  }
  doc.setDrawColor(180,200,230); doc.setLineWidth(0.3);
  doc.rect(x,y,breedte,hoogte,'S');
}

// ── BUNDEL ────────────────────────────────────────────────────
const Bundel = (() => {
  let oefeningen=[];
  let teller=0;
  return {
    voegToe(inst,opdrachtzin){
      teller++;
      oefeningen.push({id:Date.now()+Math.random(),groepId:teller,type:inst.type,opdrachtzin,inst});
      renderBundelPreview();
      document.getElementById('bundelMelding').textContent='✓ Toegevoegd!';
      setTimeout(()=>document.getElementById('bundelMelding').textContent='',2000);
    },
    verwijderGroep(id){oefeningen=oefeningen.filter(o=>o.groepId!==id);renderBundelPreview();},
    getOefeningen(){return oefeningen;},
    downloadPdf,
  };
})();

function renderBundelPreview(){
  const container=document.getElementById('bundelOefeningen');
  const oefs=Bundel.getOefeningen();
  if(!oefs.length){
    container.innerHTML='<div style="text-align:center;padding:32px 16px;color:#7f8c9a;font-size:13px;background:#f8fafc;border-radius:8px;border:1.5px dashed #c0d8ee;"><div style="font-size:28px;margin-bottom:6px;">📅</div><p>Voeg een kalender toe via het tabblad links.<br><span style="font-size:12px;color:#aaa;">Klik op een dag om events toe te voegen, dan op "Voeg toe aan bundel".</span></p></div>';
    return;
  }
  container.innerHTML='';
  const labels={kalender:'📅 Kalender',dagen:'📆 Dagen',maanden:'🗓️ Maanden',tellen:'⏳ Tellen'};
  const gezien=new Set();
  oefs.forEach((oef,gi)=>{
    if(gezien.has(oef.groepId))return;
    gezien.add(oef.groepId);
    const blok=document.createElement('div');
    blok.className='preview-blok';
    blok.style.marginBottom='12px';
    blok.innerHTML=`<div class="preview-blok-header">
      <span class="preview-blok-nr">Oefening ${gi+1}</span>
      <span class="preview-blok-type">${labels[oef.type]||oef.type}</span>
      <button class="preview-blok-verwijder" onclick="Bundel.verwijderGroep(${oef.groepId})">🗑 Verwijder</button>
    </div><div class="preview-opdracht">${oef.opdrachtzin}</div>`;
    const inhoud=document.createElement('div');
    inhoud.className='preview-inhoud';

    if(oef.type==='kalender'){
      // Live kalender-grid: data-attribuut zodat tekenAlleKalenderBlokken() hem kan vinden
      inhoud.dataset.kalenderBlok = oef.groepId;
      inhoud.setAttribute('data-kalender-blok', oef.groepId);
      tekenKalenderBlokInhoud(inhoud, oef.inst);
    } else if(oef.type==='dagen'){
      DagenModule.tekenPreviewHtml(inhoud,oef.inst);
    } else if(oef.type==='maanden'){
      MaandenModule.tekenPreviewHtml(inhoud,oef.inst);
    } else if(oef.type==='tellen'){
      TellenModule.tekenPreviewHtml(inhoud,oef.inst);
    }

    blok.appendChild(inhoud);
    container.appendChild(blok);
  });
}

// ── PDF ───────────────────────────────────────────────────────
function downloadPdf(){
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
  const pageW=doc.internal.pageSize.getWidth();
  const pageH=doc.internal.pageSize.getHeight();
  const margin=10;
  const titelElke=document.getElementById('titelElkePagina').checked;

  function header(eerste){
    if(eerste){
      doc.setFontSize(11); doc.setFont(undefined,'normal'); doc.setTextColor(80,80,80);
      doc.text('Naam:',margin,12);
      doc.setDrawColor(150,150,150); doc.setLineWidth(0.4);
      doc.line(margin+14,12.5,100,12.5);
      doc.text('Datum:',110,12); doc.line(124,12.5,pageW-margin,12.5);
      doc.setFontSize(16); doc.setFont(undefined,'bold'); doc.setTextColor(26,58,92);
      doc.text('Oefenen op de kalender',pageW/2,22,{align:'center'});
      doc.setDrawColor(74,144,217); doc.setLineWidth(0.5);
      doc.line(margin,25,pageW-margin,25);
      return 28;
    } else if(titelElke){
      doc.setFontSize(11); doc.setFont(undefined,'bold'); doc.setTextColor(26,58,92);
      doc.text('Oefenen op de kalender',pageW/2,10,{align:'center'});
      doc.setDrawColor(74,144,217); doc.setLineWidth(0.4);
      doc.line(margin,12,pageW-margin,12);
      return 15;
    }
    return margin;
  }

  function tekenOpdrachtzin(y, tekst){
    doc.setFillColor(245,248,255); doc.setDrawColor(180,200,230); doc.setLineWidth(0.4);
    doc.roundedRect(margin,y,pageW-2*margin,10,2,2,'FD');
    doc.setFontSize(14); doc.setFont(undefined,'italic'); doc.setTextColor(26,58,92);
    doc.text(tekst,margin+4,y+7);
    doc.setFont(undefined,'normal');
    return y+14;
  }

  let y=header(true);
  const oefs=Bundel.getOefeningen();

  if(!oefs.length){
    doc.setFontSize(12); doc.setTextColor(150,150,150);
    doc.text('Geen oefeningen toegevoegd.',pageW/2,y+20,{align:'center'});
  } else {
    const gezien=new Set();
    let eerste=true;
    oefs.forEach(oef=>{
      if(gezien.has(oef.groepId))return;
      gezien.add(oef.groepId);
      if(!eerste){ y+=8; }
      eerste=false;
      if(y+40+margin>pageH){doc.addPage();y=header(false);}
      y=tekenOpdrachtzin(y+2, oef.opdrachtzin);
      if(oef.type==='kalender'){
        const inst=oef.inst;
        if(inst.heeft2de){
          const kalW=(pageW-2*margin-8)/2;
          const y1=KalenderModule.tekenInPdfKlein(doc,inst,margin,y,kalW,pageH);
          const y2=KalenderModule.tekenInPdfKlein(doc,{...inst,maand:inst.maand2,jaar:inst.jaar2},margin+kalW+8,y,kalW,pageH);
          y=Math.max(y1,y2)+4;
        } else {
          y=KalenderModule.tekenInPdf(doc,inst,y,margin,pageW);
        }
        // Eigen opdrachten afdrukken onder de kalender (vraag + lijn op één rij)
        const breedte=pageW-2*margin;
        (inst.opdrachten||[]).forEach((vraag,i)=>{
          if(!vraag.trim())return;
          if(y+14+margin>pageH){doc.addPage();y=header(false);}
          doc.setFontSize(11); doc.setFont(undefined,'normal'); doc.setTextColor(26,58,92);
          const label=`${i+1}.  ${vraag}`;
          const tekstBreedte=doc.getTextWidth(label);
          doc.text(label,margin,y+8);
          const lijnStart=margin+tekstBreedte+4;
          const lijnEinde=margin+breedte;
          if(lijnStart<lijnEinde){
            doc.setDrawColor(80,80,80); doc.setLineWidth(0.4);
            doc.line(lijnStart,y+9,lijnEinde,y+9);
          }
          y+=14;
        });
      } else if(oef.type==='dagen'){
        y=DagenModule.tekenInPdf(doc,oef.inst,y,margin,pageW,pageH);
      } else if(oef.type==='maanden'){
        y=MaandenModule.tekenInPdf(doc,oef.inst,y,margin,pageW,pageH);
      } else if(oef.type==='tellen'){
        y=TellenModule.tekenInPdf(doc,oef.inst,y,margin,pageW,pageH);
      }
    });
  }

  const n=doc.internal.getNumberOfPages();
  for(let p=1;p<=n;p++){
    doc.setPage(p);
    doc.setFontSize(8); doc.setFont(undefined,'normal'); doc.setTextColor(160,160,160);
    doc.text("Juf Zisa's kalender generator  —  www.jufzisa.be",pageW/2,pageH-margin+3,{align:'center'});
  }
  doc.save('kalender_bundel.pdf');
}

// ── TABS ──────────────────────────────────────────────────────
function toonTab(naam, el) {
  document.querySelectorAll('.sidebar-content').forEach(c=>c.classList.remove('actief'));
  document.querySelectorAll('.sidebar-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('tab-'+naam)?.classList.add('actief');
  el?.classList.add('active');
}

function scrollTabsLeft(){document.getElementById('sidebarTabs').scrollBy({left:-80,behavior:'smooth'});}
function scrollTabsRight(){document.getElementById('sidebarTabs').scrollBy({left:80,behavior:'smooth'});}

// ── TELLEN EVENTS BUILDER ─────────────────────────────────────
function renderTellenEvents(){
  const container=document.getElementById('tellenEventsList');
  container.innerHTML='';
  tellenEvents.forEach((ev,i)=>{
    const rij=document.createElement('div');
    rij.style.cssText='display:flex;gap:4px;align-items:center;margin-bottom:4px;';
    rij.innerHTML=`<input type="text" placeholder="Naam event" value="${ev.naam}" style="flex:1;border:1.5px solid var(--border);border-radius:6px;padding:5px 8px;font-size:12px;font-family:inherit;outline:none;"/>
      <input type="date" value="${ev.datumStr}" style="border:1.5px solid var(--border);border-radius:6px;padding:5px 8px;font-size:12px;font-family:inherit;outline:none;"/>
      <button onclick="tellenVerwijder(${i})" style="background:none;border:1px solid #fcc;color:#c00;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:12px;padding:0;">×</button>`;
    rij.querySelectorAll('input')[0].addEventListener('input',e=>{tellenEvents[i].naam=e.target.value;});
    rij.querySelectorAll('input')[1].addEventListener('input',e=>{tellenEvents[i].datumStr=e.target.value;});
    container.appendChild(rij);
  });
}

window.tellenVerwijder=function(i){tellenEvents.splice(i,1);renderTellenEvents();};

// ── KAL OPDRACHTEN BUILDER ────────────────────────────────────
function renderKalOpdrachten() {
  const container = document.getElementById('kalOpdrachtenLijst');
  if (!container) return;
  container.innerHTML = '';
  kalOpdrachten.forEach((vraag, i) => {
    const rij = document.createElement('div');
    rij.style.cssText = 'display:flex;gap:4px;align-items:flex-start;margin-bottom:6px;';
    rij.innerHTML = `<span style="font-size:12px;font-weight:700;color:var(--muted);padding-top:7px;min-width:16px;">${i+1}.</span>
      <textarea placeholder="Typ hier de opdracht..." style="flex:1;border:1.5px solid var(--border);border-radius:6px;padding:5px 8px;font-size:12px;font-family:inherit;outline:none;resize:vertical;min-height:36px;">${vraag}</textarea>
      <button style="background:none;border:1px solid #fcc;color:#c00;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:12px;padding:0;flex-shrink:0;margin-top:4px;">×</button>`;
    rij.querySelector('textarea').addEventListener('input', e => { kalOpdrachten[i] = e.target.value; });
    rij.querySelector('button').addEventListener('click', () => { kalOpdrachten.splice(i, 1); renderKalOpdrachten(); });
    container.appendChild(rij);
  });
}

window.kalOpdracht_verwijder = function(i) { kalOpdrachten.splice(i,1); renderKalOpdrachten(); };

// ── DOM READY ─────────────────────────────────────────────────
// ── CHIP INTERACTIVITEIT ──────────────────────────────────────
function initChips() {
  document.querySelectorAll('.radio-chip').forEach(chip => {
    const nieuw = chip.cloneNode(true);
    chip.parentNode.replaceChild(nieuw, chip);
    nieuw.addEventListener('click', () => {
      const input = nieuw.querySelector('input[type="radio"]');
      if (!input) return;
      input.checked = true;
      document.querySelectorAll(`input[name="${input.name}"]`).forEach(r => {
        r.closest('.radio-chip')?.classList.remove('geselecteerd');
      });
      nieuw.classList.add('geselecteerd');
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });
  document.querySelectorAll('.checkbox-chip').forEach(chip => {
    const nieuw = chip.cloneNode(true);
    chip.parentNode.replaceChild(nieuw, chip);
    nieuw.addEventListener('click', () => {
      const input = nieuw.querySelector('input[type="checkbox"]');
      if (!input) return;
      input.checked = !input.checked;
      nieuw.classList.toggle('geselecteerd', input.checked);
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Chips klikbaar maken
  initChips();

  const nu = new Date();
  huidigMaand = nu.getMonth();
  huidigJaar  = nu.getFullYear();
  document.getElementById('kalMaand').value = huidigMaand;
  document.getElementById('kalJaar').value  = huidigJaar;

  // Sidebar kalender updaten bij maand/jaar/regio wijziging
  function updateKal(){
    huidigMaand = parseInt(document.getElementById('kalMaand').value);
    huidigJaar  = parseInt(document.getElementById('kalJaar').value) || nu.getFullYear();
    huidigRegio = document.querySelector('input[name="kalRegio"]:checked')?.value || 'geen';
    tekenSidebarKalender();
  }
  document.querySelectorAll('#kalMaand, #kalJaar').forEach(el => el.addEventListener('change', updateKal));
  document.querySelectorAll('input[name="kalRegio"]').forEach(el => el.addEventListener('change', updateKal));
  tekenSidebarKalender();

  // Popup kleur keuze
  document.querySelectorAll('.kleur-keuze').forEach(el => {
    el.addEventListener('click', () => {
      gekozenKleur = el.dataset.kleur;
      document.querySelectorAll('.kleur-keuze').forEach(k => k.classList.remove('geselecteerd'));
      el.classList.add('geselecteerd');
    });
  });

  // Popup opslaan — updatet events en hertekent sidebar + alle bundel-blokken
  document.getElementById('popupOpslaan').addEventListener('click', () => {
    if (popupDag === null) return;
    const naam = document.getElementById('popupNaam').value.trim();
    const sleutel = datumSleutel(popupJaar, popupMaand, popupDag);
    if (naam) kalEvents[sleutel] = { naam, kleur: gekozenKleur };
    else delete kalEvents[sleutel];
    sluitPopup();
    tekenSidebarKalender();
    tekenAlleKalenderBlokken();
  });

  document.getElementById('popupNaam').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('popupOpslaan').click();
  });

  document.getElementById('popupVerwijder').addEventListener('click', () => {
    if (popupDag === null) return;
    delete kalEvents[datumSleutel(popupJaar, popupMaand, popupDag)];
    sluitPopup();
    tekenSidebarKalender();
    tekenAlleKalenderBlokken();
  });

  document.getElementById('popupSluiten').addEventListener('click', sluitPopup);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') sluitPopup(); });
  document.addEventListener('click', e => {
    const popup = document.getElementById('eventPopup');
    if (popup.style.display !== 'none' && !popup.contains(e.target) && !e.target.closest('.kal-dag'))
      sluitPopup();
  });

  // Opslaan / laden
  updateOpgeslagenLijst();

  document.getElementById('kalOpslaanBtn').addEventListener('click', () => {
    const naam = document.getElementById('kalNaamOpslaan').value.trim();
    if (!naam) { document.getElementById('meldingKalender').textContent = 'Geef een naam op!'; return; }
    slaOp(naam, { maand: huidigMaand, jaar: huidigJaar, regio: huidigRegio, events: kalEvents });
    updateOpgeslagenLijst();
    document.getElementById('meldingKalender').textContent = `✓ "${naam}" opgeslagen!`;
    setTimeout(() => document.getElementById('meldingKalender').textContent = '', 2500);
  });

  document.getElementById('kalLaadBtn').addEventListener('click', () => {
    const naam = document.getElementById('kalGeslagenLijst').value;
    if (!naam) return;
    const alle = laadOpgeslagen();
    const data = alle[naam];
    if (!data) return;
    huidigMaand = data.maand; huidigJaar = data.jaar; huidigRegio = data.regio || 'geen';
    kalEvents = data.events || {};
    document.getElementById('kalMaand').value = huidigMaand;
    document.getElementById('kalJaar').value = huidigJaar;
    // Regio chip selecteren
    document.querySelectorAll('input[name="kalRegio"]').forEach(r => {
      r.checked = r.value === huidigRegio;
      r.closest('.radio-chip')?.classList.toggle('geselecteerd', r.value === huidigRegio);
    });
    tekenSidebarKalender();
    tekenAlleKalenderBlokken();
    document.getElementById('meldingKalender').textContent = `✓ "${naam}" geladen!`;
    setTimeout(() => document.getElementById('meldingKalender').textContent = '', 2500);
  });

  document.getElementById('kalVerwijderBtn').addEventListener('click', () => {
    const naam = document.getElementById('kalGeslagenLijst').value;
    if (!naam) return;
    if (confirm(`"${naam}" verwijderen?`)) { verwijderOpgeslagen(naam); updateOpgeslagenLijst(); }
  });

  // Voeg toe knoppen
  document.getElementById('voegKalToeBtn').addEventListener('click', () => {
    const inst = KalenderModule.leesInstellingen();
    Bundel.voegToe(inst, document.getElementById('opdrachtzinKalender').value.trim() || 'Bekijk de kalender goed.');
  });

  document.getElementById('voegDagenToeBtn').addEventListener('click', () => {
    const inst = DagenModule.leesInstellingen();
    if (!inst) return;
    Bundel.voegToe(inst, document.getElementById('opdrachtzinDagen').value.trim() || 'Vul de juiste dag in.');
    DagenModule.tekenPreviewHtml(document.getElementById('dagenPreview'), inst);
  });

  document.getElementById('voegMaandenToeBtn').addEventListener('click', () => {
    const inst = MaandenModule.leesInstellingen();
    if (!inst) return;
    Bundel.voegToe(inst, document.getElementById('opdrachtzinMaanden').value.trim() || 'Vul in.');
    MaandenModule.tekenPreviewHtml(document.getElementById('maandenPreview'), inst);
  });

  document.getElementById('voegTellenToeBtn').addEventListener('click', () => {
    const inst = TellenModule.leesInstellingen();
    if (!inst) return;
    Bundel.voegToe(inst, document.getElementById('opdrachtzinTellen').value.trim() || 'Hoeveel dagen zijn het er nog?');
    TellenModule.tekenPreviewHtml(document.getElementById('tellenPreview'), inst);
  });

  // 2de kalender toggle
  const tweedeKalCheckbox = document.getElementById('tweedeKalender');
  const tweedeKalOpties = document.getElementById('tweedeKalOpties');
  if (tweedeKalCheckbox) {
    tweedeKalCheckbox.addEventListener('change', () => {
      tweedeKalOpties.style.display = tweedeKalCheckbox.checked ? '' : 'none';
    });
    const nu2 = new Date(); nu2.setMonth(nu2.getMonth() + 1);
    const m2el = document.getElementById('kalMaand2');
    const j2el = document.getElementById('kalJaar2');
    if (m2el) m2el.value = nu2.getMonth();
    if (j2el) j2el.value = nu2.getFullYear();
  }

  // Tellen events
  document.getElementById('tellenAddEventBtn').addEventListener('click', () => {
    const d = new Date();
    tellenEvents.push({ naam: '', datumStr: `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}` });
    renderTellenEvents();
  });

  // Kalender eigen opdrachten
  document.getElementById('kalAddOpdracht')?.addEventListener('click', () => {
    kalOpdrachten.push('');
    renderKalOpdrachten();
  });
  renderKalOpdrachten();

  // Dagen toggles
  document.querySelectorAll('input[name="dagenMetDatum"]').forEach(r => r.addEventListener('change', () => {
    document.getElementById('kaart-dagenReferentie').style.display = r.value === 'ja' ? '' : 'none';
  }));
  document.querySelectorAll('input[name="dagenRef"]').forEach(r => r.addEventListener('change', () => {
    document.getElementById('dagenRefDatum').style.display = r.value === 'kies' ? '' : 'none';
  }));
  document.querySelectorAll('input[name="tellenStart"]').forEach(r => r.addEventListener('change', () => {
    document.getElementById('tellenStartDatum').style.display = r.value === 'kies' ? '' : 'none';
  }));

  // Maanden preview auto
  document.querySelectorAll('input[name="maandenType"],input[name="maandenLeerjaar"],#maandenAantal')
    .forEach(el => el.addEventListener('change', () => {
      const inst = MaandenModule.leesInstellingen();
      if (inst) MaandenModule.tekenPreviewHtml(document.getElementById('maandenPreview'), inst);
    }));

  // Dagen preview auto
  document.querySelectorAll('input[name="dagenType"],input[name="dagenLeerjaar"],input[name="dagenMetDatum"],#dagenAantal,#dagenWeekstrip')
    .forEach(el => el.addEventListener('change', () => {
      const inst = DagenModule.leesInstellingen();
      if (inst) DagenModule.tekenPreviewHtml(document.getElementById('dagenPreview'), inst);
    }));

  // Download
  document.getElementById('downloadPdfBtn').addEventListener('click', downloadPdf);

  // Info
  document.getElementById('infoBtn')?.addEventListener('click', () => document.getElementById('infoModaal').style.display = 'block');
  document.getElementById('infoModaal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('infoModaal')) document.getElementById('infoModaal').style.display = 'none';
  });

  // Initieel
  const instM = MaandenModule.leesInstellingen();
  if (instM) MaandenModule.tekenPreviewHtml(document.getElementById('maandenPreview'), instM);
  const instD = DagenModule.leesInstellingen();
  if (instD) DagenModule.tekenPreviewHtml(document.getElementById('dagenPreview'), instD);
});