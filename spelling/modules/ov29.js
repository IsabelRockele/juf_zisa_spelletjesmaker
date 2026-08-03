/* OV29–OV31 — zwakke werkwoorden in de OVT (graad 2). */
(function () {
  "use strict";

  const CAT = "werkwoorden-ovt-zwak-g2";
  const DEF = {
    ov29: { naam: "OVT zwak: kies -de of -te", max: 10 },
    ov30: { naam: "OVT zwak: enkelvoud en meervoud", max: 8 },
    ov31: { naam: "OVT zwak: zet zinnen in de verleden tijd", max: 8 }
  };

  function woorden() {
    const bib = window.SpellingWoordenbibliotheek?.graad2?.[CAT]?.woorden || [];
    const gekozen = (window._weekdictee_gekozenWoorden || []).filter(w => w.categorie === CAT);
    const basis = gekozen.length ? gekozen : bib;
    const gezien = new Set();
    return [...basis, ...bib]
      .map(w => ({ ...w, ...(bib.find(b => b.tekst === w.tekst) || {}) }))
      .filter(w => w.ovt && !gezien.has(w.tekst) && gezien.add(w.tekst));
  }
  function varieer(lijst, sleutel, aantal, oplossingen) {
    if (!lijst.length) return [];
    const staat = window.__zisaWerkwoordVariatie || (window.__zisaWerkwoordVariatie = { volgende: {}, laatste: {} });
    if (!oplossingen) {
      const start = staat.volgende[sleutel] || 0;
      staat.laatste[sleutel] = start;
      staat.volgende[sleutel] = (start + Math.max(3, Math.floor(aantal / 2))) % lijst.length;
    }
    const start = staat.laatste[sleutel] || 0;
    return Array.from({ length: Math.min(aantal, lijst.length) }, (_, i) => lijst[(start + i) % lijst.length]);
  }

  function lijn(cfg) {
    const c = window.SpellingSchrijflijnen?.htmlCanvas(cfg.lijntype, cfg.lijnhoogte, 650)
      || '<div class="ov07-fallback-lijn"></div>';
    return `<div class="ov29-lijn">${c}</div>`;
  }

  function pagina(titel, stappen, inhoud, cfg, opl) {
    return `<div class="werkblad ov29-blad lijnhoogte-${cfg.lijnhoogte}">
      <div class="ov01-header"><div class="ov01-naam-rij"><span>Naam:</span><span class="ov01-lijn-naam"></span><span>Datum:</span><span class="ov01-lijn-datum"></span></div>
      <h2 class="ov01-titel">${titel}${opl ? '<span class="oplossingen-badge">OPLOSSINGEN</span>' : ""}</h2></div>
      <div class="ov01-stappen"><div class="ov01-stappen-label">Zo werkt het:</div>${stappen.map(s => `<div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>${s}</span></div>`).join("")}</div>
      ${inhoud}<div class="ov01-voettekst">www.jufzisa.be — Juf Zisa's spellinggenerator</div></div>`;
  }

  const ZINNEN = {
    werken: ["Noor werkt aan haar taak.", "Noor werkte aan haar taak."],
    wandelen: ["Opa wandelt naar het park.", "Opa wandelde naar het park."],
    luisteren: ["De klas luistert naar de uitleg.", "De klas luisterde naar de uitleg."],
    fluisteren: ["Lina fluistert een geheim.", "Lina fluisterde een geheim."],
    spelen: ["De kinderen spelen op het plein.", "De kinderen speelden op het plein."],
    praten: ["Wij praten met de buurman.", "Wij praatten met de buurman."],
    wonen: ["Oma woont in Gent.", "Oma woonde in Gent."],
    dansen: ["Mila danst op het podium.", "Mila danste op het podium."],
    leren: ["Ik leer voor de toets.", "Ik leerde voor de toets."],
    fietsen: ["Amir fietst naar school.", "Amir fietste naar school."],
    maken: ["Liam maakt een vlieger.", "Liam maakte een vlieger."],
    branden: ["De lamp brandt de hele avond.", "De lamp brandde de hele avond."],
    horen: ["Wij horen een vreemd geluid.", "Wij hoorden een vreemd geluid."],
    kloppen: ["Iemand klopt op de deur.", "Iemand klopte op de deur."],
    stoppen: ["De bus stopt bij de halte.", "De bus stopte bij de halte."],
    antwoorden: ["Noor antwoordt op de vraag.", "Noor antwoordde op de vraag."]
  };

  const TIJDZINNEN = {
    werken: ["Gisteren", "werkte Noor aan haar taak."],
    wandelen: ["Vorige week", "wandelde opa naar het park."],
    luisteren: ["Twee dagen geleden", "luisterde de klas naar de uitleg."],
    fluisteren: ["Eergisteren", "fluisterde Lina een geheim."],
    spelen: ["Vorige woensdag", "speelden de kinderen op het plein."],
    praten: ["Gisteren", "praatten wij met de buurman."],
    wonen: ["Vorig jaar", "woonde oma in Gent."],
    dansen: ["Afgelopen weekend", "danste Mila op het podium."],
    leren: ["Vorige maand", "leerde ik voor de toets."],
    fietsen: ["Drie dagen geleden", "fietste Amir naar school."]
  };

  function regel(cfg, opl) {
    const ws = varieer(woorden(), "ov29", 10, opl);
    const uitleg = `<div class="ov29-uitleg"><b>Voorbeeld: werken</b><span>stam: wer<span class="ov29-controle">k</span></span><span>De <b>k</b> staat in <b>'t ex-kofschip</b>: werk + te = <b>werkte</b>.</span><span>Staat de laatste letter er niet in? Dan schrijf je <b>-de</b>.</span></div>`;
    const kaarten = (deel, start) => `<div class="ov29-kaarten">${deel.map((w, j) => {
      const i = start + j;
      const laatste = w.stam.slice(-1);
      const vorm = w.ovt.ik;
      const stam = opl ? `${w.stam.slice(0, -1)}<span class="ov29-controle">${laatste}</span>` : w.stam;
      return `<div class="ov29-kaart"><div class="ov29-kop"><b>${i + 1}. ${w.tekst}</b><span>stam: ${stam}</span><span class="ov29-keuzes"><i class="${opl && w.uitgang_ovt === "de" ? "juist" : ""}">-de</i><i class="${opl && w.uitgang_ovt === "te" ? "juist" : ""}">-te</i></span></div><div class="ov29-opdracht">Kleur de laatste letter van de stam. Schrijf daarna de ik-vorm in de OVT.</div>${opl ? `<div class="ov29-oplossing">ik ${vorm}</div>` : lijn(cfg)}</div>`;
    }).join("")}</div>`;
    return pagina("OVT: kies -de of -te — deel 1", ["Kleur de laatste letter van de stam.", "Kies -de of -te en schrijf de ik-vorm."], uitleg + kaarten(ws.slice(0, 5), 0), cfg, opl)
      + pagina("OVT: kies -de of -te — deel 2", ["Kijk naar de laatste letter van de stam.", "Schrijf de ik-vorm in de verleden tijd."], kaarten(ws.slice(5), 5), cfg, opl);
  }

  function enkelMeervoud(cfg, opl) {
    const ws = varieer(woorden(), "ov30", 8, opl);
    const voorbeeld = `<div class="ov29-uitleg"><b>Enkelvoud of meervoud?</b><span><b>ik werkte</b>: stam + te</span><span><b>wij werkten</b>: stam + ten</span><span>Bij -de wordt dat op dezelfde manier <b>-de</b> of <b>-den</b>.</span></div>`;
    const kaarten = (deel, start) => `<div class="ov30-kaarten">${deel.map((w, j) => {
      const i = start + j;
      return `<div class="ov30-kaart"><b>${i + 1}. ${w.tekst}</b><div class="ov30-vormen"><span>ik</span>${opl ? `<strong>${w.ovt.ik}</strong>` : lijn(cfg)}<span>wij</span>${opl ? `<strong>${w.ovt.wij}</strong>` : lijn(cfg)}</div></div>`;
    }).join("")}</div>`;
    return pagina("OVT: enkelvoud en meervoud — deel 1", ["Schrijf de vorm bij ik.", "Schrijf daarna de vorm bij wij."], voorbeeld + kaarten(ws.slice(0, 4), 0), cfg, opl)
      + pagina("OVT: enkelvoud en meervoud — deel 2", ["Let op: in het meervoud komt er een n bij.", "Lees beide vormen nog eens na."], kaarten(ws.slice(4), 4), cfg, opl);
  }

  function zinnen(cfg, opl) {
    const ws = varieer(woorden().filter(w => ZINNEN[w.tekst] && TIJDZINNEN[w.tekst]), "ov31", 8, opl);
    const voorbeeld = `<div class="ov29-uitleg"><b>Voorbeeld</b><span>Nu: Noor werkt aan haar taak.</span><span>Gisteren <b>werkte Noor aan haar taak.</b></span><span>Na het tijdwoord komt eerst de persoonsvorm en daarna het onderwerp.</span></div>`;
    const lijst = (deel, start) => `<div class="ov31-zinnen">${deel.map((w, j) => {
      const paar = ZINNEN[w.tekst];
      const tijdzin = TIJDZINNEN[w.tekst];
      return `<div class="ov31-zin"><b>${start + j + 1}.</b><span class="ov31-nu"><small>Nu:</small> ${paar[0]}</span>${opl ? `<div class="ov29-oplossing"><strong>${tijdzin[0]}</strong> ${tijdzin[1]}</div>` : `<div class="ov31-schrijfblok"><div class="ov31-eerste-regel"><strong>${tijdzin[0]}</strong>${lijn(cfg)}</div>${lijn(cfg)}</div>`}</div>`;
    }).join("")}</div>`;
    return pagina("OVT: zet zinnen in de verleden tijd — deel 1", ["Lees de zin in de tegenwoordige tijd.", "Schrijf de rest van de zin na het gegeven tijdwoord."], voorbeeld + lijst(ws.slice(0, 4), 0), cfg, opl)
      + pagina("OVT: zet zinnen in de verleden tijd — deel 2", ["Begin met het gegeven tijdwoord.", "Schrijf de rest van de zin in de verleden tijd."], lijst(ws.slice(4), 4), cfg, opl);
  }

  function moduleVoor(id) {
    return {
      naam: DEF[id].naam, graad: 2, oefenvormenPerNiveau: ["basis"],
      _maxPerNiveau: { basis: DEF[id].max }, renderInstellingen() { return ""; },
      genereerBlad(opties, opl) {
        const o = opties?.[id] || opties || {};
        const cfg = { lijntype: o.lijntype || "type3", lijnhoogte: o.lijnhoogte || "middel" };
        if (id === "ov29") return regel(cfg, opl);
        if (id === "ov30") return enkelMeervoud(cfg, opl);
        return zinnen(cfg, opl);
      }
    };
  }

  window.SpellingModules = window.SpellingModules || {};
  Object.keys(DEF).forEach(id => { window.SpellingModules[id] = moduleVoor(id); });
})();
