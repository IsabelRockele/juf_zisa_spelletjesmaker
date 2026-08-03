/* OV35–OV38 — VVT en werkwoordstijden gemengd (graad 2). */
(function () {
  "use strict";
  const VVT_CAT = "werkwoorden-vvt-g2";

  function bron() {
    const bib = window.SpellingWoordenbibliotheek?.graad2?.[VVT_CAT]?.woorden || [];
    const gekozen = (window._weekdictee_gekozenWoorden || []).filter(w => w.categorie === VVT_CAT);
    const gezien = new Set();
    return [...(gekozen.length ? gekozen : bib), ...bib]
      .map(w => ({ ...w, ...(bib.find(b => b.tekst === w.tekst) || {}) }))
      .filter(w => w.deelwoord && !gezien.has(w.tekst) && gezien.add(w.tekst));
  }
  function lijn(cfg) {
    const c = window.SpellingSchrijflijnen?.htmlCanvas(cfg.lijntype, cfg.lijnhoogte, 650) || '<div class="ov07-fallback-lijn"></div>';
    return `<div class="ov29-lijn">${c}</div>`;
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
  function pagina(titel, stappen, inhoud, cfg, opl, sterren = "") {
    return `<div class="werkblad ov35-blad lijnhoogte-${cfg.lijnhoogte}"><div class="ov01-header"><div class="ov01-naam-rij"><span>Naam:</span><span class="ov01-lijn-naam"></span><span>Datum:</span><span class="ov01-lijn-datum"></span></div><h2 class="ov01-titel">${titel}${sterren ? ` <span class="ov01-niveau-badge">${sterren}</span>` : ""}${opl ? '<span class="oplossingen-badge">OPLOSSINGEN</span>' : ""}</h2></div><div class="ov01-stappen"><div class="ov01-stappen-label">Opdracht:</div>${stappen.map(s => `<div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>${s}</span></div>`).join("")}</div>${inhoud}<div class="ov01-voettekst">www.jufzisa.be — Juf Zisa's spellinggenerator</div></div>`;
  }
  function markeer(zin, deelwoord) {
    return zin.replace(/\b(had|hadden|was|waren)\b/, '<span class="ov35-hulp">$1</span>').replace(deelwoord, `<span class="ov35-deelwoord">${deelwoord}</span>`);
  }

  const VVT_ZINNEN = [
    ["werken", "Noor had voordien hard gewerkt."],
    ["wandelen", "Opa had die ochtend al gewandeld."],
    ["luisteren", "De klas had vooraf goed geluisterd."],
    ["spelen", "De kinderen hadden daarvoor lang gespeeld."],
    ["fietsen", "Amir was die ochtend al naar school gefietst."],
    ["maken", "Liam had zijn taak al gemaakt."],
    ["lopen", "Noor was eerder naar huis gelopen."],
    ["eten", "Wij hadden vooraf al gegeten."],
    ["lezen", "Mila had het verhaal al gelezen."],
    ["komen", "Oma was eerder op bezoek gekomen."],
    ["fluisteren", "Lina had het antwoord zacht gefluisterd."],
    ["praten", "Wij hadden daar eerder over gepraat."],
    ["wonen", "Oma had vroeger in Gent gewoond."],
    ["dansen", "Mila had daarvoor op het podium gedanst."],
    ["leren", "Ik had de woorden thuis geleerd."],
    ["branden", "De lamp had de hele nacht gebrand."],
    ["horen", "De buren hadden het geluid al gehoord."],
    ["stoppen", "De bus was eerder bij de halte gestopt."],
    ["drinken", "Noor had vooraf genoeg water gedronken."],
    ["zien", "Wij hadden die vogel al gezien."]
  ];
  function vvtWoorden() {
    const alle = bron();
    return VVT_ZINNEN.map(([t, zin]) => ({ ...alle.find(w => w.tekst === t), zin })).filter(w => w.tekst);
  }
  function herken(cfg, opl) {
    const ws = varieer(vvtWoorden(), "ov35", 10, opl);
    const uitleg = `<div class="ov35-uitleg"><b>Een VVT-zin heeft twee werkwoorddelen</b><span><i class="ov35-blauw"></i> Kleur <b>had / hadden / was / waren</b> blauw.</span><span><i class="ov35-groen"></i> Kleur het voltooid deelwoord groen.</span><span>Voorbeeld: Noor <span class="ov35-hulp">had</span> hard <span class="ov35-deelwoord">gewerkt</span>.</span></div>`;
    const zinnen = `<div class="ov27-zinnen">${ws.map((w, i) => `<div class="ov27-zin"><b>${i + 1}.</b><span>${opl ? markeer(w.zin, w.deelwoord) : w.zin}</span></div>`).join("")}</div>`;
    return pagina("VVT: herken de twee werkwoorddelen", ["Lees elke volledige zin.", "Kleur het hulpwerkwoord blauw en het voltooid deelwoord groen."], uitleg + zinnen, cfg, opl);
  }
  function kiesHulp(cfg, opl) {
    const ws = varieer(vvtWoorden(), "ov36", 10, opl);
    const kaarten = (deel, start) => `<div class="ov35-kaarten">${deel.map((w, j) => {
      const juist = w.zin.match(/\b(had|hadden|was|waren)\b/)[0];
      const mv = /hadden|waren/.test(juist), keuzes = mv ? ["hadden", "waren"] : ["had", "was"];
      const leeg = w.zin.replace(juist, "___");
      return `<div class="ov35-kaart"><b>${start + j + 1}. ${w.tekst}</b><span>${leeg}</span><div class="ov35-keuzes">${keuzes.map(k => `<i class="${opl && k === juist ? "juist" : ""}">${k}</i>`).join("")}</div>${opl ? `<div class="ov35-oplossing">${markeer(w.zin, w.deelwoord)}</div>` : `${lijn(cfg)}${lijn(cfg)}`}</div>`;
    }).join("")}</div>`;
    const uitleg = `<div class="ov35-uitleg"><b>Had of was?</b><span>Gebruik <b>had/hadden</b> bij de meeste werkwoorden.</span><span>Gebruik vaak <b>was/waren</b> bij een verplaatsing naar een andere plaats: <b>was gekomen</b>.</span><span>Lees altijd de hele zin.</span></div>`;
    return pagina("VVT: kies had of was — deel 1", ["Kleur het juiste hulpwerkwoord.", "Schrijf de volledige VVT-zin over."], uitleg + kaarten(ws.slice(0, 5), 0), cfg, opl)
      + pagina("VVT: kies had of was — deel 2", ["Lees de betekenis van de volledige zin.", "Schrijf de volledige VVT-zin over."], kaarten(ws.slice(5), 5), cfg, opl);
  }
  function omzetten(cfg, opl) {
    const opdrachten = [
      ["Noor werkt hard aan haar taak.", "Voordien", "had Noor hard aan haar taak gewerkt."],
      ["Opa wandelt door het park.", "Die ochtend", "had opa door het park gewandeld."],
      ["De kinderen spelen buiten.", "Daarvoor", "hadden de kinderen buiten gespeeld."],
      ["Amir fietst naar school.", "Die ochtend", "was Amir al naar school gefietst."],
      ["Wij eten samen soep.", "Vooraf", "hadden wij samen soep gegeten."],
      ["Mila leest het verhaal.", "Eerder", "had Mila het verhaal al gelezen."],
      ["Oma komt op bezoek.", "Voordien", "was oma op bezoek gekomen."],
      ["Noor loopt naar huis.", "Daarvoor", "was Noor naar huis gelopen."],
      ["Lina fluistert het antwoord.", "Eerder", "had Lina het antwoord zacht gefluisterd."],
      ["De buren horen een geluid.", "Daarvoor", "hadden de buren het geluid al gehoord."],
      ["De bus stopt bij de halte.", "Eerder", "was de bus bij de halte gestopt."],
      ["Wij zien een grote vogel.", "Voordien", "hadden wij die grote vogel al gezien."]
    ];
    const gekozen = varieer(opdrachten, "ov37", 8, opl);
    const lijst = (deel, start) => `<div class="ov31-zinnen">${deel.map((z, j) => `<div class="ov31-zin"><b>${start + j + 1}.</b><span class="ov31-nu"><small>Nu:</small> ${z[0]}</span>${opl ? `<div class="ov35-oplossing"><strong>${z[1]}</strong> ${z[2]}</div>` : `<div class="ov31-schrijfblok"><div class="ov31-eerste-regel"><strong>${z[1]}</strong>${lijn(cfg)}</div>${lijn(cfg)}</div>`}</div>`).join("")}</div>`;
    const uitleg = `<div class="ov35-uitleg"><b>De VVT vertelt wat daarvoor al gebeurd was</b><span>Nu: Noor werkt hard.</span><span>Daarvoor <b>had Noor al hard gewerkt.</b></span><span>Het eerste tijdwoord staat telkens al klaar.</span><span>Gebruik <b>had/was + voltooid deelwoord</b>.</span></div>`;
    return pagina("VVT: zet zinnen om — deel 1", ["Lees de zin in de tegenwoordige tijd.", "Schrijf de volledige zin in de VVT."], uitleg + lijst(gekozen.slice(0, 4), 0), cfg, opl)
      + pagina("VVT: zet zinnen om — deel 2", ["Gebruik had, hadden, was of waren.", "Schrijf ook het voltooid deelwoord correct."], lijst(gekozen.slice(4), 4), cfg, opl);
  }

  const MIX_INVUL = [
    ["OTT", "werken", "Noor ___ elke dag hard.", "werkt"],
    ["OVT", "lopen", "Gisteren ___ Noor naar school.", "liep"],
    ["VTT", "lezen", "Liam ___ het boek ___.", "heeft · gelezen"],
    ["VVT", "maken", "Noor ___ haar taak voordien al ___.", "had · gemaakt"],
    ["OTT", "zijn", "Wij ___ vandaag op school.", "zijn"],
    ["OVT", "spelen", "Vorige week ___ de kinderen buiten.", "speelden"],
    ["VTT", "komen", "Oma ___ op bezoek ___.", "is · gekomen"],
    ["VVT", "eten", "Wij ___ vooraf al ___.", "hadden · gegeten"]
  ];
  const MIX_OMZET = [
    ["OVT", "Noor werkt aan haar taak.", "Gisteren werkte Noor aan haar taak."],
    ["OTT", "Vorige week wandelde opa naar het park.", "Vandaag wandelt opa naar het park."],
    ["VTT", "Liam leest een boek.", "Liam heeft een boek gelezen."],
    ["VVT", "Noor maakt haar taak.", "Noor had haar taak voordien al gemaakt."],
    ["OVT", "De klas zingt een lied.", "Gisteren zong de klas een lied."],
    ["OTT", "Gisteren speelde Mila buiten.", "Vandaag speelt Mila buiten."],
    ["VTT", "Wij fietsen door het park.", "Wij hebben door het park gefietst."],
    ["VVT", "Oma komt op bezoek.", "Oma was eerder op bezoek gekomen."]
  ];
  const MIX_HERKEN = [
    ["OTT", "Noor werkt vandaag aan haar taak."],
    ["OVT", "Gisteren wandelde opa door het park."],
    ["VTT", "Liam heeft een spannend boek gelezen."],
    ["VVT", "Mila had het verhaal voordien al gelezen."],
    ["OVT", "De klas zong vorige week een vrolijk lied."],
    ["OTT", "Mijn buurvrouw fietst elke dag naar haar werk."],
    ["VVT", "De bus was eerder bij de halte gestopt."],
    ["VTT", "De kinderen hebben buiten gespeeld."],
    ["OTT", "Oma komt vanmiddag op bezoek."],
    ["OVT", "Wij aten gisteren samen soep."],
    ["VTT", "Noor is naar huis gelopen."],
    ["VVT", "Amir was die ochtend al naar school gefietst."],
    ["OVT", "De hond dronk veel water."],
    ["OTT", "De leerlingen luisteren naar de uitleg."],
    ["VTT", "Wij hebben een regenboog gezien."],
    ["VVT", "Opa had daarvoor een uur gewandeld."]
  ];
  function herkenTijd(cfg, opl) {
    const zinnen = varieer(MIX_HERKEN, "ov39", 10, opl);
    const tijden = ["OTT", "OVT", "VTT", "VVT"];
    const uitleg = `<div class="ov35-uitleg"><b>Welke werkwoordstijd herken je?</b><span><b>OTT</b> = nu</span><span><b>OVT</b> = vroeger</span><span><b>VTT</b> = heeft/is + voltooid deelwoord</span><span><b>VVT</b> = had/was + voltooid deelwoord</span></div>`;
    const inhoud = `<div class="ov39-zinnen">${zinnen.map((z, i) => `<div class="ov39-zin"><b>${i + 1}.</b><span>${z[1]}</span><div class="ov39-keuzes">${tijden.map(t => `<i class="${opl && t === z[0] ? "juist" : ""}">${t}</i>`).join("")}</div></div>`).join("")}</div>`;
    return pagina("Welke werkwoordstijd is het?", ["Lees de volledige zin.", "Kleur OTT, OVT, VTT of VVT."], uitleg + inhoud, cfg, opl);
  }
  function mix(cfg, opl, niveau) {
    if (niveau === "basis") {
      const inhoud = `<div class="ov38-lijst">${MIX_INVUL.map((z, i) => `<div class="ov38-rij"><b>${i + 1}. <span>${z[0]}</span></b><small>hele werkwoord: ${z[1]}</small><p>${z[2]}</p>${opl ? `<div class="ov35-oplossing">${z[3]}</div>` : lijn(cfg)}</div>`).join("")}</div>`;
      return pagina("Werkwoordstijden door elkaar", ["Lees welke tijd gevraagd wordt.", "Vul de juiste werkwoordsvorm in."], inhoud, cfg, opl, "⭐");
    }
    if (niveau === "kern") {
      const lijst = (deel, start) => `<div class="ov38-omzet">${deel.map((z, j) => `<div class="ov38-rij"><b>${start + j + 1}. Zet in de ${z[0]}</b><p>${z[1]}</p>${opl ? `<div class="ov35-oplossing">${z[2]}</div>` : `${lijn(cfg)}${lijn(cfg)}`}</div>`).join("")}</div>`;
      return pagina("Werkwoordstijden door elkaar — deel 1", ["Lees de gegeven zin.", "Schrijf de volledige zin in de gevraagde tijd."], lijst(MIX_OMZET.slice(0, 4), 0), cfg, opl, "⭐⭐")
        + pagina("Werkwoordstijden door elkaar — deel 2", ["Let ook op de tijdsaanduiding en woordvolgorde.", "Schrijf de volledige nieuwe zin."], lijst(MIX_OMZET.slice(4), 4), cfg, opl, "⭐⭐");
    }
    const verhalen = [
      { titel: "De verdwenen sleutel", tijd: "OVT", bron: "Noor zoekt haar fietssleutel. Ze kijkt onder de tafel. Haar broer helpt mee. Uiteindelijk vindt Noor de sleutel in haar jaszak.", oplossing: "Noor zocht haar fietssleutel. Ze keek onder de tafel. Haar broer hielp mee. Uiteindelijk vond Noor de sleutel in haar jaszak." },
      { titel: "Klaar voor de uitstap", tijd: "VTT", bron: "De klas maakt de rugzakken klaar. De kinderen smeren hun boterhammen. Amir vult zijn drinkfles. Daarna vertrekt de bus.", oplossing: "De klas heeft de rugzakken klaargemaakt. De kinderen hebben hun boterhammen gesmeerd. Amir heeft zijn drinkfles gevuld. Daarna is de bus vertrokken." }
    ];
    return verhalen.map((v, i) => pagina(`${v.titel} — zet het verhaal in de ${v.tijd}`, ["Lees het volledige korte verhaal.", `Schrijf het verhaal opnieuw in de ${v.tijd}.`], `<div class="ov38-verhaal"><b>Oorspronkelijke tekst</b><p>${v.bron}</p></div>${opl ? `<div class="ov35-oplossing ov38-verhaal-oplossing">${v.oplossing}</div>` : `<div class="ov38-verhaallijnen">${Array.from({length: 9}, () => lijn(cfg)).join("")}</div>`}`, cfg, opl, "⭐⭐⭐")).join("");
  }

  function simpel(id, naam, fn, max) {
    return { naam, graad: 2, oefenvormenPerNiveau: ["basis"], _maxPerNiveau: { basis: max }, renderInstellingen(){return "";}, genereerBlad(opties, opl){ const o=opties?.[id]||opties||{}; return fn({lijntype:o.lijntype||"type3",lijnhoogte:o.lijnhoogte||"middel"},opl); } };
  }
  window.SpellingModules = window.SpellingModules || {};
  window.SpellingModules.ov35 = simpel("ov35", "VVT: herken de twee werkwoorddelen", herken, 10);
  window.SpellingModules.ov36 = simpel("ov36", "VVT: kies had of was", kiesHulp, 10);
  window.SpellingModules.ov37 = simpel("ov37", "VVT: zet zinnen om", omzetten, 8);
  window.SpellingModules.ov38 = { naam:"Werkwoordstijden door elkaar", graad:2, oefenvormenPerNiveau:["basis","kern","verdieping"], _maxPerNiveau:{basis:8,kern:8,verdieping:2}, renderInstellingen(){return "";}, genereerBlad(opties,opl){const o=opties?.ov38||opties||{}, niveau=o.niveaus?.[0]||o.niveau||"basis"; return mix({lijntype:o.lijntype||"type3",lijnhoogte:o.lijnhoogte||"middel"},opl,niveau);} };
  window.SpellingModules.ov39 = simpel("ov39", "Werkwoordstijden herkennen", herkenTijd, 10);
})();
