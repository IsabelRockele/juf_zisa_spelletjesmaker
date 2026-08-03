/* OV22–OV25 — gerichte oefenvormen voor de VTT (graad 2). */
(function () {
  "use strict";
  const CAT = "werkwoorden-vtt-g2";
  const DEF = {
    ov22: { naam: "VTT: zwakke werkwoorden", max: 10 },
    ov23: { naam: "VTT: sterke werkwoorden", max: 10 },
    ov24: { naam: "VTT: hebben of zijn als hulpwerkwoord", max: 10 },
    ov25: { naam: "VTT: zwak en sterk gemengd", max: 10 },
    ov26: { naam: "VTT: gehad en geweest", max: 8 },
    ov27: { naam: "VTT: herken de twee werkwoorddelen", max: 10 },
    ov28: { naam: "VTT: let op bij v/f en z/s", max: 8 }
  };
  function bron() {
    const bib = window.SpellingWoordenbibliotheek?.graad2?.[CAT]?.woorden || [];
    const gekozen = (window._weekdictee_gekozenWoorden || []).filter(w => w.categorie === CAT);
    const lijst = gekozen.length ? gekozen : bib;
    return lijst.map(w => ({ ...w, ...(bib.find(b => b.tekst === w.tekst) || {}) })).filter(w => w.deelwoord);
  }
  function vanType(type) {
    const gekozen = bron().filter(w => w.type === type);
    const volledig = (window.SpellingWoordenbibliotheek?.graad2?.[CAT]?.woorden || []).filter(w => w.type === type);
    const gezien = new Set();
    return [...gekozen, ...volledig].filter(w => !gezien.has(w.tekst) && gezien.add(w.tekst));
  }
  function evenwichtig(type) {
    const alle = vanType(type);
    const metZijn = alle.filter(w => (w.hulpww || []).includes("zijn"));
    const metHebben = alle.filter(w => (w.hulpww || ["hebben"]).includes("hebben"));
    const gemengd = [];
    const voegUniekToe = w => { if (w && !gemengd.some(x => x.tekst === w.tekst)) gemengd.push(w); };
    const max = Math.max(metZijn.length, metHebben.length);
    for (let i = 0; i < max; i++) {
      voegUniekToe(metHebben[i]);
      voegUniekToe(metZijn[i]);
    }
    alle.forEach(voegUniekToe);
    return gemengd;
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
    const c = window.SpellingSchrijflijnen?.htmlCanvas(cfg.lijntype, cfg.lijnhoogte, 650) || '<div class="ov07-fallback-lijn"></div>';
    return `<div class="ov22-lijn">${c}</div>`;
  }
  function markeerHulp(zin) {
    return zin.replace(/\b(heb|hebt|heeft|hebben|ben|bent|is|zijn)\b/i, '<span class="ov22-hulp-oplossing">$1</span>');
  }
  function markeerDelen(zin, deelwoord) {
    return markeerHulp(zin).replace(deelwoord, `<span class="ov22-deelwoord-oplossing">${deelwoord}</span>`);
  }
  function pagina(titel, uitleg, inhoud, cfg, opl) {
    return `<div class="werkblad ov22-blad lijnhoogte-${cfg.lijnhoogte}"><div class="ov01-header"><div class="ov01-naam-rij"><span>Naam:</span><span class="ov01-lijn-naam"></span><span>Datum:</span><span class="ov01-lijn-datum"></span></div><h2 class="ov01-titel">${titel}${opl ? '<span class="oplossingen-badge">OPLOSSINGEN</span>' : ""}</h2></div><div class="ov01-stappen"><div class="ov01-stappen-label">Zo werkt het:</div>${uitleg.map(x => `<div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>${x}</span></div>`).join("")}</div>${inhoud}<div class="ov01-voettekst">www.jufzisa.be — Juf Zisa's spellinggenerator</div></div>`;
  }
  function controle(w) {
    const zonderEn = w.tekst.endsWith("en") ? w.tekst.slice(0, -2) : w.tekst;
    return zonderEn.endsWith("ch") ? "ch" : zonderEn.slice(-1);
  }
  function ikHulp(w, index) {
    const hulp = w.hulpww || ["hebben"];
    if (hulp.length === 1) return hulp[0] === "zijn" ? "ben" : "heb";
    return "ben";
  }
  function context(w) {
    const d = {
      werken: "Noor heeft hard ___.", wandelen: "Opa heeft een uur ___.", luisteren: "De klas heeft aandachtig ___.",
      fluisteren: "Lina heeft zacht ___.", spelen: "De kinderen hebben buiten ___.", praten: "Wij hebben lang ___.",
      wonen: "Oma heeft daar vroeger ___.", dansen: "Mila heeft op het podium ___.", leren: "Ik heb goed ___.",
      fietsen: "We hebben door het park ___.", maken: "Liam heeft een boot ___.", branden: "De lamp heeft de hele nacht ___.",
      horen: "Ik heb een vreemd geluid ___.", kloppen: "Iemand heeft op de deur ___.", stoppen: "De chauffeur heeft op tijd ___.",
      antwoorden: "Noor heeft juist ___.", leven: "De schildpad heeft lang ___.", reizen: "Wij hebben door België ___.",
      lopen: "Wij hebben in het park ___.", eten: "Ik heb een appel ___.", drinken: "Noor heeft water ___.",
      zien: "Wij hebben een regenboog ___.", lezen: "Liam heeft het boek ___.", zingen: "De klas heeft een lied ___.",
      vliegen: "De piloot heeft boven zee ___.", komen: "Oma is op bezoek ___.", geven: "Ik heb een cadeau ___.",
      gaan: "Noor is naar school ___.", worden: "Mijn broer is tien jaar ___.", zwemmen: "Wij hebben een uur ___.",
      rijden: "Papa heeft voorzichtig ___.", ruiken: "De hond heeft aan de bloem ___.", schrijven: "Ik heb een brief ___."
    };
    return d[w.tekst] || `Ik heb het voltooid deelwoord van ${w.tekst} correct ___.`;
  }
  function zinpaar(w, variant = 0) {
    const d = {
      werken: ["Noor werkt hard.", "Noor heeft hard gewerkt."], wandelen: ["Opa wandelt naar huis.", "Opa is naar huis gewandeld."],
      luisteren: ["De klas luistert aandachtig.", "De klas heeft aandachtig geluisterd."], fluisteren: ["Lina fluistert heel zacht.", "Lina heeft heel zacht gefluisterd."],
      spelen: ["De kinderen spelen buiten.", "De kinderen hebben buiten gespeeld."], praten: ["Wij praten met de buurman.", "Wij hebben met de buurman gepraat."],
      wonen: ["Oma woont in Brussel.", "Oma heeft in Brussel gewoond."], dansen: ["Mila danst op het podium.", "Mila heeft op het podium gedanst."],
      leren: ["Ik leer voor de toets.", "Ik heb voor de toets geleerd."], fietsen: ["Noor fietst naar school.", "Noor is naar school gefietst."],
      maken: ["Liam maakt een boot.", "Liam heeft een boot gemaakt."], antwoorden: ["Noor antwoordt juist.", "Noor heeft juist geantwoord."],
      lopen: ["Noor loopt naar huis.", "Noor is naar huis gelopen."], eten: ["Ik eet een boterham.", "Ik heb een boterham gegeten."],
      drinken: ["Noor drinkt water.", "Noor heeft water gedronken."], zien: ["Wij zien een regenboog.", "Wij hebben een regenboog gezien."],
      lezen: ["Liam leest een boek.", "Liam heeft een boek gelezen."], zingen: ["De klas zingt een lied.", "De klas heeft een lied gezongen."],
      vliegen: ["Het vliegtuig vliegt naar Spanje.", "Het vliegtuig is naar Spanje gevlogen."], komen: ["Oma komt op bezoek.", "Oma is op bezoek gekomen."],
      geven: ["Ik geef oma een cadeau.", "Ik heb oma een cadeau gegeven."], gaan: ["Noor gaat naar school.", "Noor is naar school gegaan."],
      worden: ["Mijn broer wordt tien jaar.", "Mijn broer is tien jaar geworden."], zwemmen: ["Wij zwemmen een uur.", "Wij hebben een uur gezwommen."],
      rijden: ["Papa rijdt voorzichtig.", "Papa heeft voorzichtig gereden."], ruiken: ["De hond ruikt aan de bloem.", "De hond heeft aan de bloem geroken."],
      schrijven: ["Ik schrijf een brief.", "Ik heb een brief geschreven."],
      leven: ["De schildpad leeft heel lang.", "De schildpad heeft heel lang geleefd."],
      reizen: ["Noor reist door België.", "Noor heeft door België gereisd."],
      durven: ["Lina durft dat.", "Lina heeft dat gedurfd."],
      proeven: ["De kok proeft de soep.", "De kok heeft de soep geproefd."],
      zweven: ["De ballon zweeft boven de tuin.", "De ballon heeft boven de tuin gezweefd."],
      wuiven: ["Oma wuift naar de trein.", "Oma heeft naar de trein gewuifd."],
      blozen: ["Noor bloost van de verrassing.", "Noor heeft van de verrassing gebloosd."],
      razen: ["De storm raast over het dak.", "De storm heeft over het dak geraasd."]
    };
    const anders = {
      werken: ["Liam werkt aan zijn taak.", "Liam heeft aan zijn taak gewerkt."],
      wandelen: ["De kinderen wandelen langs de rivier.", "De kinderen hebben langs de rivier gewandeld."],
      luisteren: ["Noor luistert naar de radio.", "Noor heeft naar de radio geluisterd."],
      fluisteren: ["De juf fluistert het antwoord.", "De juf heeft het antwoord gefluisterd."],
      spelen: ["Mila speelt met haar buurmeisje.", "Mila heeft met haar buurmeisje gespeeld."],
      praten: ["Opa praat over vroeger.", "Opa heeft over vroeger gepraat."],
      fietsen: ["Amir fietst naar de sporthal.", "Amir is naar de sporthal gefietst."],
      stoppen: ["De trein stopt aan het perron.", "De trein is aan het perron gestopt."],
      maken: ["Sofie maakt een vlieger.", "Sofie heeft een vlieger gemaakt."],
      antwoorden: ["Liam antwoordt op de laatste vraag.", "Liam heeft op de laatste vraag geantwoord."],
      lopen: ["De hond loopt naar zijn mand.", "De hond is naar zijn mand gelopen."],
      eten: ["Oma eet een kom soep.", "Oma heeft een kom soep gegeten."],
      drinken: ["De spelers drinken koud water.", "De spelers hebben koud water gedronken."],
      zien: ["Noor ziet een vallende ster.", "Noor heeft een vallende ster gezien."],
      lezen: ["De juf leest een gedicht.", "De juf heeft een gedicht gelezen."],
      zingen: ["Mila zingt voor haar oma.", "Mila heeft voor haar oma gezongen."],
      vliegen: ["De vogels vliegen naar het zuiden.", "De vogels zijn naar het zuiden gevlogen."],
      komen: ["De dokter komt snel naar binnen.", "De dokter is snel naar binnen gekomen."],
      gaan: ["De klas gaat naar het museum.", "De klas is naar het museum gegaan."],
      worden: ["De lucht wordt donker.", "De lucht is donker geworden."],
      ruiken: ["Noor ruikt aan het parfum.", "Noor heeft aan het parfum geroken."],
      schrijven: ["Liam schrijft een kaartje.", "Liam heeft een kaartje geschreven."]
    };
    const nogAnders = {
      werken: ["Papa werkt in de tuin.", "Papa heeft in de tuin gewerkt."],
      wandelen: ["Wij wandelen naar het kasteel.", "Wij zijn naar het kasteel gewandeld."],
      luisteren: ["De leerlingen luisteren naar de uitleg.", "De leerlingen hebben naar de uitleg geluisterd."],
      spelen: ["De ploeg speelt een spannende wedstrijd.", "De ploeg heeft een spannende wedstrijd gespeeld."],
      fietsen: ["Wij fietsen een uur door het bos.", "Wij hebben een uur door het bos gefietst."],
      stoppen: ["Noor stopt bij het zebrapad.", "Noor is bij het zebrapad gestopt."],
      lopen: ["De atleten lopen drie rondjes.", "De atleten hebben drie rondjes gelopen."],
      eten: ["De kinderen eten verse aardbeien.", "De kinderen hebben verse aardbeien gegeten."],
      drinken: ["Opa drinkt een kop koffie.", "Opa heeft een kop koffie gedronken."],
      lezen: ["Wij lezen de brief samen.", "Wij hebben de brief samen gelezen."],
      vliegen: ["De piloot vliegt boven de kust.", "De piloot heeft boven de kust gevlogen."],
      komen: ["De bus komt naar het station.", "De bus is naar het station gekomen."],
      gaan: ["Mijn zus gaat vroeg naar bed.", "Mijn zus is vroeg naar bed gegaan."],
      ruiken: ["De hond ruikt aan het spoor.", "De hond heeft aan het spoor geroken."],
      schrijven: ["De kinderen schrijven een verhaal.", "De kinderen hebben een verhaal geschreven."]
    };
    if (variant === 1 && anders[w.tekst]) return anders[w.tekst];
    if (variant >= 2 && nogAnders[w.tekst]) return nogAnders[w.tekst];
    return d[w.tekst] || [context(w).replace("heeft", "").replace("hebben", "").replace("___", w.tekst), context(w).replace("___", w.deelwoord)];
  }
  function zwak(cfg, opl) {
    const ws = varieer(evenwichtig("zwak").filter(w => controle(w) === w.stam.slice(-1)), "ov22", 10, opl);
    const uitleg = `<div class="ov22-uitleg"><b>Nu oefen je zwakke werkwoorden</b><span>Lees de hele zin. Zo weet je welk hulpwerkwoord past.</span><b>Voorbeeld</b><span>werken → stam: wer<span class="ov22-focus">k</span> → kies t</span><span class="ov22-voorbeeld">Noor heeft hard gewerkt.</span><span>1. Kleur de laatste letter van de stam.</span><span>2. Kies d of t.</span><span>3. Schrijf de volledige VTT-zin.</span></div>`;
    const maakKaarten = (deel, start) => `<div class="ov22-kaarten ov22-kaarten-breed">${deel.map((w, j) => {
      const i = start + j;
      const letter = controle(w), uitgang = w.deelwoord.slice(-1);
      const stam = opl ? `${w.stam.slice(0, -1)}<span class="ov22-focus">${w.stam.slice(-1)}</span>` : w.stam;
      const paar = zinpaar(w);
      return `<div class="ov22-kaart"><div><b>${i + 1}. ${w.tekst}</b><span>stam: <strong>${stam}</strong></span></div><div class="ov22-dt"><span class="${opl && uitgang === "d" ? "juist" : ""}">d</span><span class="${opl && uitgang === "t" ? "juist" : ""}">t</span></div><div class="ov22-schrijfopdracht">Tegenwoordige tijd: <b>${paar[0]}</b><br>Schrijf de volledige zin in de VTT:</div>${opl ? `<div class="ov22-oplossing">${markeerHulp(paar[1])}</div>` : `${lijn(cfg)}${lijn(cfg)}`}</div>`;
    }).join("")}</div>`;
    const zinnen = `<div class="ov22-uitleg"><b>Voorbeeld</b><span>Ik eet een boterham.</span><span class="ov22-voorbeeld">Ik heb een boterham gegeten.</span></div><div class="ov22-zinnen">${ws.slice(0, 7).map((w, i) => { const paar = zinpaar(w, 1); return `<div class="ov22-zin"><b>${i + 1}.</b> <span class="ov22-tt">${paar[0]}</span>${opl ? `<div class="ov22-oplossing">${paar[1]}</div>` : `${lijn(cfg)}${lijn(cfg)}`}</div>`; }).join("")}</div>`;
    return pagina("VTT: zwakke werkwoorden — d of t (deel 1)", ["Kleur de laatste letter van de stam.", "Kies d of t en schrijf de volledige VTT-zin."], uitleg + maakKaarten(ws.slice(0, 5), 0), cfg, opl)
      + pagina("VTT: zwakke werkwoorden — d of t (deel 2)", ["Lees telkens de volledige zin.", "Kies d of t en schrijf de volledige VTT-zin."], maakKaarten(ws.slice(5), 5), cfg, opl)
      + pagina("VTT: zwakke werkwoorden — maak de zin in de VTT", ["Lees de zin in de tegenwoordige tijd.", "Schrijf de volledige zin in de VTT."], zinnen, cfg, opl);
  }
  function sterk(cfg, opl) {
    const ws = varieer(evenwichtig("sterk"), "ov23", 10, opl);
    const woordbank = `<div class="ov22-uitleg"><b>Nu oefen je sterke werkwoorden</b><span>Je gebruikt opnieuw <b>hebben</b> of <b>zijn</b>, maar het voltooid deelwoord moet je onthouden.</span><span>Het volgt niet de gewone regel van d of t. Vaak verandert de klank.</span><span>Onthoud beide vormen samen: <b>ruiken → geroken</b>.</span></div><div class="ov22-woordbank">${ws.map(w => w.deelwoord).sort().join(" · ")}</div>`;
    const maakKoppelingen = (deel, start) => `<div class="ov22-koppelen ov22-koppelen-breed">${deel.map((w, j) => { const i = start + j, paar = zinpaar(w), invulzin = paar[1].replace(w.deelwoord, "________________"); return `<div><b>${i + 1}. ${w.tekst}</b><span>${invulzin}</span>${opl ? `<div class="ov22-oplossing">${markeerHulp(paar[1])}</div>` : lijn(cfg)}</div>`; }).join("")}</div>`;
    const zinnen = `<div class="ov22-uitleg"><b>Voorbeeld</b><span>Ik ruik aan een bloem.</span><span class="ov22-voorbeeld">Ik heb aan een bloem geroken.</span></div><div class="ov22-zinnen">${ws.slice(0, 7).map((w, i) => { const paar = zinpaar(w, 1); return `<div class="ov22-zin"><b>${i + 1}.</b> <span class="ov22-tt">${paar[0]}</span>${opl ? `<div class="ov22-oplossing">${paar[1]}</div>` : `${lijn(cfg)}${lijn(cfg)}`}</div>`; }).join("")}</div>`;
    return pagina("VTT: sterke werkwoorden — onthouden (deel 1)", ["Kleur het gegeven hulpwerkwoord.", "Zoek het passende woord uit de woordbank en schrijf het op de lijn."], woordbank + maakKoppelingen(ws.slice(0, 5), 0), cfg, opl)
      + pagina("VTT: sterke werkwoorden — onthouden (deel 2)", ["Kleur het gegeven hulpwerkwoord.", "Vul daarna het sterke voltooid deelwoord in."], maakKoppelingen(ws.slice(5), 5), cfg, opl)
      + pagina("VTT: sterke werkwoorden — maak de zin in de VTT", ["Lees de zin in de tegenwoordige tijd.", "Schrijf de volledige zin in de VTT."], zinnen, cfg, opl);
  }
  const HULPZINNEN = [
    ["Noor ___ hard gewerkt.", "heeft"], ["Wij ___ een spannend boek gelezen.", "hebben"],
    ["Liam ___ naar school gegaan.", "is"], ["Oma ___ op bezoek gekomen.", "is"],
    ["De kinderen ___ een uur in het park gelopen.", "hebben"], ["De kinderen ___ naar huis gelopen.", "zijn"],
    ["Noor ___ door het park gefietst.", "heeft"], ["Noor ___ naar school gefietst.", "is"],
    ["De bus ___ bij de halte gestopt.", "is"], ["Wij ___ een lied gezongen.", "hebben"],
    ["Opa ___ een uur gewandeld.", "heeft"], ["Opa ___ naar huis gewandeld.", "is"],
    ["De piloot ___ boven de kust gevlogen.", "heeft"], ["De vogels ___ naar het zuiden gevlogen.", "zijn"],
    ["Mila ___ een kaart geschreven.", "heeft"], ["De spelers ___ genoeg water gedronken.", "hebben"]
  ];
  function hulp(cfg, opl) {
    const zinnen = varieer(HULPZINNEN, "ov24", 10, opl);
    const uitleg = `<div class="ov22-uitleg"><b>Hier start je</b><span>Een VTT-zin heeft een vorm van <b>hebben</b> of <b>zijn</b> én een voltooid deelwoord.</span><span>Je oefent eerst alleen welk hulpwerkwoord in de zin past.</span><span>Lees de hele zin: hetzelfde werkwoord kan soms met hebben of zijn voorkomen.</span></div>`;
    const eerste = `<div class="ov22-zinnen">${zinnen.slice(0, 5).map((z, i) => hulpRij(z, i, cfg, opl)).join("")}</div>`;
    const tweede = `<div class="ov22-zinnen">${zinnen.slice(5).map((z, i) => hulpRij(z, i + 5, cfg, opl)).join("")}</div>`;
    return pagina("VTT: hebben of zijn als hulpwerkwoord — deel 1", ["Lees de volledige zin.", "Kleur de juiste vorm van hebben of zijn en schrijf de zin over."], uitleg + eerste, cfg, opl)
      + pagina("VTT: hebben of zijn als hulpwerkwoord — deel 2", ["Let goed op de betekenis van de zin.", "Kleur het hulpwerkwoord en schrijf de volledige zin correct over."], tweede, cfg, opl);
  }
  function hulpRij(z, i, cfg, opl) {
    const mv = /^(Wij|De kinderen)/.test(z[0]);
    const keuzes = mv ? ["hebben", "zijn"] : ["heeft", "is"];
    return `<div class="ov22-zin"><b>${i + 1}.</b> ${z[0]} <span class="ov22-keuzes">${keuzes.map(k => `<span class="${opl && k === z[1] ? "juist" : ""}">${k}</span>`).join(" / ")}</span>${opl ? `<div class="ov22-oplossing">${z[0].replace("___", z[1])}</div>` : `${lijn(cfg)}${lijn(cfg)}`}</div>`;
  }
  function mix(cfg, opl) {
    const zw = varieer(evenwichtig("zwak"), "ov25-zwak", 5, opl), st = varieer(evenwichtig("sterk"), "ov25-sterk", 5, opl);
    const ws = zw.flatMap((w, i) => st[i] ? [w, st[i]] : [w]).slice(0, 10);
    const uitleg = `<div class="ov22-uitleg"><b>Nu komt alles door elkaar</b><span>Je hebt het hulpwerkwoord, de zwakke vormen en de sterke vormen apart geoefend.</span><span>Zwak: gebruik de regel van d of t.</span><span>Sterk: gebruik de vorm die je hebt onthouden.</span></div>`;
    const maakMix = (deel, start) => `<div class="ov22-mixlijst ov22-mixlijst-breed">${deel.map((w, j) => {
      const i = start + j, paar = zinpaar(w, 2), onvolledig = paar[1].replace(w.deelwoord, "…");
      return `<div><div class="ov22-mixkop"><b>${i + 1}. ${w.tekst}</b><span>zwak / sterk</span></div><span class="ov22-tt">Tegenwoordige tijd: ${paar[0]}</span><span>VTT: ${onvolledig}</span>${opl ? `<div class="ov22-oplossing"><b>${w.type}</b> — ${markeerHulp(paar[1])}</div>` : `<div class="ov22-mix-schrijf">Kleur het hulpwerkwoord en schrijf het ontbrekende woord:</div>${lijn(cfg)}`}</div>`;
    }).join("")}</div>`;
    const toepassen = `<div class="ov22-zinnen">${ws.slice(0, 7).map((w, i) => `<div class="ov22-zin"><b>${i + 1}.</b> ${opl ? context(w).replace("___", `<span class="ov22-oplossing-inline">${w.deelwoord}</span>`) : context(w)} <small>(${w.tekst})</small>${opl ? "" : `${lijn(cfg)}${lijn(cfg)}`}</div>`).join("")}</div>`;
    return pagina("VTT: zwak of sterk? — deel 1", ["Bepaal eerst of het werkwoord zwak of sterk is.", "Kleur het hulpwerkwoord en schrijf het ontbrekende woord op de lijn."], uitleg + maakMix(ws.slice(0, 5), 0), cfg, opl)
      + pagina("VTT: zwak of sterk? — deel 2", ["Het onderwerp en het hulpwerkwoord staan al klaar.", "Kleur het hulpwerkwoord en schrijf het ontbrekende woord ruim op de lijn."], maakMix(ws.slice(5), 5), cfg, opl)
      + pagina("VTT: gemengd toepassen", ["Vul het juiste voltooid deelwoord in.", "Schrijf iedere volledige VTT-zin correct over."], toepassen, cfg, opl);
  }
  function gehadGeweest(cfg, opl) {
    const aanvullen = [
      ["Ik heb veel geluk ___.", "gehad"], ["Jij hebt een fijne dag ___.", "gehad"],
      ["Mijn zus heeft koorts ___.", "gehad"], ["Wij hebben weinig tijd ___.", "gehad"],
      ["Ik ben in Gent ___.", "geweest"], ["Jij bent erg dapper ___.", "geweest"],
      ["Oma is op bezoek ___.", "geweest"], ["Wij zijn lang buiten ___.", "geweest"]
    ];
    const deel1 = `<div class="ov22-uitleg"><b>Hier zijn hebben en zijn zelf het werkwoord</b><span>Ze zijn in deze oefening dus niet alleen het hulpwerkwoord.</span><span><b>hebben → gehad:</b> Ik heb het gehad.</span><span><b>zijn → geweest:</b> Ik ben er geweest.</span></div><div class="ov22-zinnen">${aanvullen.map((z, i) => `<div class="ov22-zin"><b>${i + 1}.</b> ${opl ? z[0].replace("___", `<span class="ov22-oplossing-inline">${z[1]}</span>`) : z[0]}${opl ? "" : lijn(cfg)}</div>`).join("")}</div>`;
    const paren = [
      ["Ik heb hoofdpijn.", "Ik heb hoofdpijn gehad."],
      ["Jij hebt veel geluk.", "Jij hebt veel geluk gehad."],
      ["Mijn broer heeft koorts.", "Mijn broer heeft koorts gehad."],
      ["Wij hebben voldoende tijd.", "Wij hebben voldoende tijd gehad."],
      ["Ik ben in Antwerpen.", "Ik ben in Antwerpen geweest."],
      ["Jij bent vandaag stil.", "Jij bent vandaag stil geweest."],
      ["Oma is op bezoek.", "Oma is op bezoek geweest."],
      ["Wij zijn de hele dag buiten.", "Wij zijn de hele dag buiten geweest."]
    ];
    const deel2 = `<div class="ov22-uitleg"><b>Voorbeeld</b><span>Ik ben thuis.</span><span class="ov22-voorbeeld">Ik ben thuis geweest.</span></div><div class="ov22-zinnen">${paren.map((p, i) => `<div class="ov22-zin"><b>${i + 1}.</b> <span class="ov22-tt">${p[0]}</span>${opl ? `<div class="ov22-oplossing">${p[1]}</div>` : `${lijn(cfg)}${lijn(cfg)}`}</div>`).join("")}</div>`;
    return pagina("VTT: gehad en geweest — aanvullen", ["Kies gehad of geweest.", "Lees daarna de volledige VTT-zin."], deel1, cfg, opl)
      + pagina("VTT: gehad en geweest — zinnen omzetten", ["Lees de zin in de tegenwoordige tijd.", "Schrijf de volledige zin in de VTT."], deel2, cfg, opl);
  }
  function herkenDelen(cfg, opl) {
    const woorden = [
      ...varieer(evenwichtig("zwak").filter(w => controle(w) === w.stam.slice(-1)), "ov27-zwak", 5, opl),
      ...varieer(evenwichtig("sterk"), "ov27-sterk", 5, opl)
    ];
    const voorbeeld = `<div class="ov22-uitleg ov27-legende"><b>Een VTT-zin heeft twee werkwoorddelen</b><span><i class="ov27-blauw"></i> Kleur het hulpwerkwoord blauw.</span><span><i class="ov27-groen"></i> Kleur het voltooid deelwoord groen.</span><span class="ov22-voorbeeld">Noor <span class="ov22-hulp-oplossing">heeft</span> hard <span class="ov22-deelwoord-oplossing">gewerkt</span>.</span></div>`;
    const rijen = (deel, start) => `<div class="ov27-zinnen">${deel.map((w, j) => {
      const zin = zinpaar(w, (start + j) % 3)[1];
      return `<div class="ov27-zin"><b>${start + j + 1}.</b><span>${opl ? markeerDelen(zin, w.deelwoord) : zin}</span></div>`;
    }).join("")}</div>`;
    return pagina("VTT: herken de twee werkwoorddelen", ["Lees de volledige zin.", "Kleur het hulpwerkwoord blauw en het voltooid deelwoord groen."], voorbeeld + rijen(woorden, 0), cfg, opl);
  }
  function vfzs(cfg, opl) {
    const doelwoorden = ["leven", "reizen", "durven", "proeven", "zweven", "wuiven", "blozen", "razen"];
    const alle = vanType("zwak");
    const ws = doelwoorden.map(t => alle.find(w => w.tekst === t)).filter(Boolean);
    const uitleg = `<div class="ov22-uitleg"><b>Let op bij f en s aan het einde van de stam</b><span>Soms stond er in het hele werkwoord eerst een <b>v</b> of <b>z</b>.</span><span><b>leven → leef → kijk terug naar leven → geleefd</b></span><span><b>reizen → reis → kijk terug naar reizen → gereisd</b></span><span>Zie je in het hele werkwoord een v of z? Dan eindigt het voltooid deelwoord hier op <b>d</b>.</span></div>`;
    const kaarten = (deel, start) => `<div class="ov28-kaarten">${deel.map((w, j) => {
      const paar = zinpaar(w, (start + j) % 3);
      const oorspronkelijkeLetter = w.tekst.includes("v") ? "v" : "z";
      const stamletter = w.stam.endsWith("f") ? "f" : "s";
      return `<div class="ov28-kaart"><div class="ov28-woordstappen"><b>${start + j + 1}. ${w.tekst}</b><span>stam: ${w.stam}</span><span class="ov28-terug">${oorspronkelijkeLetter} → ${stamletter}</span></div><div class="ov22-schrijfopdracht">Tegenwoordige tijd: <b>${paar[0]}</b><br>Schrijf de volledige zin in de VTT:</div>${opl ? `<div class="ov22-oplossing">${markeerDelen(paar[1], w.deelwoord)}</div>` : `${lijn(cfg)}${lijn(cfg)}`}</div>`;
    }).join("")}</div>`;
    return pagina("VTT: let op bij v/f en z/s — deel 1", ["Kijk terug naar het hele werkwoord.", "Schrijf daarna de volledige VTT-zin."], uitleg + kaarten(ws.slice(0, 4), 0), cfg, opl)
      + pagina("VTT: let op bij v/f en z/s — deel 2", ["Denk aan de v of z uit het hele werkwoord.", "Schrijf de volledige VTT-zin."], kaarten(ws.slice(4), 4), cfg, opl);
  }
  function moduleVoor(id) {
    return { naam: DEF[id].naam, graad: 2, oefenvormenPerNiveau: ["basis"], _maxPerNiveau: { basis: DEF[id].max }, renderInstellingen() { return ""; }, genereerBlad(opties, opl) {
      const o = opties?.[id] || opties || {}, cfg = { lijntype: o.lijntype || "type3", lijnhoogte: o.lijnhoogte || "middel" };
      if (id === "ov22") return zwak(cfg, opl);
      if (id === "ov23") return sterk(cfg, opl);
      if (id === "ov24") return hulp(cfg, opl);
      if (id === "ov25") return mix(cfg, opl);
      if (id === "ov26") return gehadGeweest(cfg, opl);
      if (id === "ov27") return herkenDelen(cfg, opl);
      return vfzs(cfg, opl);
    } };
  }
  window.SpellingModules = window.SpellingModules || {};
  Object.keys(DEF).forEach(id => { window.SpellingModules[id] = moduleVoor(id); });
})();
