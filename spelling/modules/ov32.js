/* OV32–OV34 — sterke werkwoorden in de OVT (graad 2). */
(function () {
  "use strict";

  const CAT = "werkwoorden-ovt-sterk-g2";
  const DEF = {
    ov32: { naam: "OVT sterk: onthoud de veranderde vorm", max: 10 },
    ov33: { naam: "OVT sterk: enkelvoud en meervoud", max: 8 },
    ov34: { naam: "OVT sterk: zet zinnen in de verleden tijd", max: 8 }
  };

  function woorden() {
    const bib = window.SpellingWoordenbibliotheek?.graad2?.[CAT]?.woorden || [];
    const gekozen = (window._weekdictee_gekozenWoorden || []).filter(w => w.categorie === CAT);
    const basis = gekozen.length ? gekozen : bib;
    const gezien = new Set();
    return [...basis, ...bib]
      .map(w => ({ ...w, ...(bib.find(b => b.tekst === w.tekst) || {}) }))
      .filter(w => w.type === "sterk" && w.ovt && !gezien.has(w.tekst) && gezien.add(w.tekst));
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
    return `<div class="werkblad ov32-blad lijnhoogte-${cfg.lijnhoogte}">
      <div class="ov01-header"><div class="ov01-naam-rij"><span>Naam:</span><span class="ov01-lijn-naam"></span><span>Datum:</span><span class="ov01-lijn-datum"></span></div>
      <h2 class="ov01-titel">${titel}${opl ? '<span class="oplossingen-badge">OPLOSSINGEN</span>' : ""}</h2></div>
      <div class="ov01-stappen"><div class="ov01-stappen-label">Zo werkt het:</div>${stappen.map(s => `<div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>${s}</span></div>`).join("")}</div>
      ${inhoud}<div class="ov01-voettekst">www.jufzisa.be — Juf Zisa's spellinggenerator</div></div>`;
  }

  const ZINNEN = {
    lopen: ["Noor loopt naar school.", "Gisteren", "liep Noor naar school."],
    eten: ["Wij eten samen pasta.", "Gisteren", "aten wij samen pasta."],
    drinken: ["Mila drinkt koud water.", "Na de sportles", "dronk Mila koud water."],
    zien: ["Ik zie een regenboog.", "Vorige week", "zag ik een regenboog."],
    lezen: ["Liam leest een spannend boek.", "Gisteravond", "las Liam een spannend boek."],
    zingen: ["De klas zingt een vrolijk lied.", "Vorige vrijdag", "zong de klas een vrolijk lied."],
    vliegen: ["De vogels vliegen over de tuin.", "Gisteren", "vlogen de vogels over de tuin."],
    komen: ["Oma komt op bezoek.", "Vorige week", "kwam oma op bezoek."],
    geven: ["De juf geeft een nieuwe opdracht.", "Gisteren", "gaf de juf een nieuwe opdracht."],
    gaan: ["Wij gaan naar het museum.", "Vorige maand", "gingen wij naar het museum."],
    worden: ["De lucht wordt plots donker.", "Gisteren", "werd de lucht plots donker."],
    zwemmen: ["De kinderen zwemmen in het meer.", "Vorige zomer", "zwommen de kinderen in het meer."],
    rijden: ["Papa rijdt naar Antwerpen.", "Eergisteren", "reed papa naar Antwerpen."]
  };

  function onthouden(cfg, opl) {
    const ws = varieer(woorden(), "ov32", 10, opl);
    const bank = ws.map(w => w.ovt.ik).sort((a, b) => a.localeCompare(b, "nl"));
    const uitleg = `<div class="ov32-uitleg"><b>Een sterk werkwoord verandert van klank</b><span>Je kunt geen vaste uitgang kiezen. Je moet de vorm onthouden.</span><span><b>lopen → ik liep</b></span><span><b>drinken → ik dronk</b></span></div><div class="ov32-woordbank">${bank.join(" · ")}</div>`;
    const kaarten = (deel, start) => `<div class="ov32-kaarten">${deel.map((w, j) => `<div class="ov32-kaart"><b>${start + j + 1}. ${w.tekst}</b><span>ik</span>${opl ? `<div class="ov32-oplossing">${w.ovt.ik}</div>` : lijn(cfg)}</div>`).join("")}</div>`;
    return pagina("OVT: sterke werkwoorden onthouden — deel 1", ["Zoek de verleden tijd in de woordbank.", "Schrijf de ik-vorm op de lijn."], uitleg + kaarten(ws.slice(0, 5), 0), cfg, opl)
      + pagina("OVT: sterke werkwoorden onthouden — deel 2", ["Denk aan de veranderde klank.", "Schrijf de ik-vorm in de verleden tijd."], `<div class="ov32-woordbank">${bank.join(" · ")}</div>` + kaarten(ws.slice(5), 5), cfg, opl);
  }

  function enkelMeervoud(cfg, opl) {
    const ws = varieer(woorden(), "ov33", 8, opl);
    const uitleg = `<div class="ov32-uitleg"><b>Let op het verschil</b><span><b>ik liep</b> — <b>wij liepen</b></span><span><b>ik at</b> — <b>wij aten</b></span><span>Bij het meervoud komt meestal <b>-en</b>, maar kijk ook goed naar de veranderde klank.</span></div>`;
    const kaarten = (deel, start) => `<div class="ov30-kaarten">${deel.map((w, j) => `<div class="ov30-kaart"><b>${start + j + 1}. ${w.tekst}</b><div class="ov30-vormen"><span>ik</span>${opl ? `<strong>${w.ovt.ik}</strong>` : lijn(cfg)}<span>wij</span>${opl ? `<strong>${w.ovt.wij}</strong>` : lijn(cfg)}</div></div>`).join("")}</div>`;
    return pagina("OVT sterk: enkelvoud en meervoud — deel 1", ["Schrijf de vorm bij ik.", "Schrijf daarna de vorm bij wij."], uitleg + kaarten(ws.slice(0, 4), 0), cfg, opl)
      + pagina("OVT sterk: enkelvoud en meervoud — deel 2", ["Let goed op de veranderde klank.", "Lees beide vormen nog eens na."], kaarten(ws.slice(4), 4), cfg, opl);
  }

  function zinnen(cfg, opl) {
    const ws = varieer(woorden().filter(w => ZINNEN[w.tekst]), "ov34", 8, opl);
    const uitleg = `<div class="ov32-uitleg"><b>Voorbeeld</b><span>Nu: Noor loopt naar school.</span><span>Gisteren <b>liep Noor naar school.</b></span><span>Na het tijdwoord komt eerst de persoonsvorm en daarna het onderwerp.</span></div>`;
    const lijst = (deel, start) => `<div class="ov31-zinnen">${deel.map((w, j) => {
      const z = ZINNEN[w.tekst];
      return `<div class="ov31-zin"><b>${start + j + 1}.</b><span class="ov31-nu"><small>Nu:</small> ${z[0]}</span>${opl ? `<div class="ov32-oplossing"><strong>${z[1]}</strong> ${z[2]}</div>` : `<div class="ov31-schrijfblok"><div class="ov31-eerste-regel"><strong>${z[1]}</strong>${lijn(cfg)}</div>${lijn(cfg)}</div>`}</div>`;
    }).join("")}</div>`;
    return pagina("OVT sterk: zet zinnen om — deel 1", ["Lees de zin in de tegenwoordige tijd.", "Schrijf de rest na het gegeven tijdwoord in de OVT."], uitleg + lijst(ws.slice(0, 4), 0), cfg, opl)
      + pagina("OVT sterk: zet zinnen om — deel 2", ["Begin met het gegeven tijdwoord.", "Gebruik de juiste sterke vorm in de verleden tijd."], lijst(ws.slice(4), 4), cfg, opl);
  }

  function moduleVoor(id) {
    return {
      naam: DEF[id].naam, graad: 2, oefenvormenPerNiveau: ["basis"],
      _maxPerNiveau: { basis: DEF[id].max }, renderInstellingen() { return ""; },
      genereerBlad(opties, opl) {
        const o = opties?.[id] || opties || {};
        const cfg = { lijntype: o.lijntype || "type3", lijnhoogte: o.lijnhoogte || "middel" };
        if (id === "ov32") return onthouden(cfg, opl);
        if (id === "ov33") return enkelMeervoud(cfg, opl);
        return zinnen(cfg, opl);
      }
    };
  }

  window.SpellingModules = window.SpellingModules || {};
  Object.keys(DEF).forEach(id => { window.SpellingModules[id] = moduleVoor(id); });
})();
