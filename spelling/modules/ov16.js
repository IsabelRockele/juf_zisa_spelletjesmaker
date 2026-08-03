/* OV16–OV20 — gerichte oefenvormen voor werkwoorden in de OTT (graad 2). */
(function () {
  "use strict";
  const CAT = "werkwoorden-ott-g2";
  const VORMEN = {
    ov16: { naam: "OTT: de basisregel", max: 10 },
    ov17: { naam: "OTT: kies de juiste vorm", max: 8 },
    ov18: { naam: "OTT: jij en je", max: 10 },
    ov19: { naam: "OTT: vul de persoonsvorm in", max: 8 },
    ov20: { naam: "OTT: verbeter de fouten", max: 8 },
    ov21: { naam: "OTT: hebben en zijn", max: 12 }
  };

  function woorden() {
    const bib = window.SpellingWoordenbibliotheek?.graad2?.[CAT]?.woorden || [];
    const gekozen = (window._weekdictee_gekozenWoorden || []).filter(w => w.categorie === CAT);
    const bron = gekozen.length ? gekozen : bib;
    return bron.map(w => ({ ...w, ...(bib.find(b => b.tekst === w.tekst) || {}) })).filter(w => w.ott && w.stam);
  }
  function regelmatig() { return woorden().filter(w => !["hebben", "zijn"].includes(w.tekst)); }
  function lijn(cfg) {
    const c = window.SpellingSchrijflijnen?.htmlCanvas(cfg.lijntype, cfg.lijnhoogte, 650) || '<div class="ov07-fallback-lijn"></div>';
    return `<div class="ov16-lijn">${c}</div>`;
  }
  function header(titel, opdrachten, inhoud, cfg, oplossingen) {
    return `<div class="werkblad ov16-blad lijnhoogte-${cfg.lijnhoogte}">
      <div class="ov01-header"><div class="ov01-naam-rij"><span>Naam:</span><span class="ov01-lijn-naam"></span><span>Datum:</span><span class="ov01-lijn-datum"></span></div>
      <h2 class="ov01-titel">${titel}${oplossingen ? '<span class="oplossingen-badge">OPLOSSINGEN</span>' : ""}</h2></div>
      <div class="ov01-stappen"><div class="ov01-stappen-label">Opdracht:</div>${opdrachten.map(x => `<div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>${x}</span></div>`).join("")}</div>
      ${inhoud}<div class="ov01-voettekst">www.jufzisa.be — Juf Zisa's spellinggenerator</div></div>`;
  }
  function onderwerpVorm(w, onderwerp) {
    if (onderwerp === "u") return w.ott.jij;
    if (onderwerp === "zij enkelvoud") return w.ott.hij;
    if (onderwerp === "zij meervoud") return w.ott.zij;
    return w.ott[onderwerp];
  }
  function foutVorm(w, onderwerp) {
    const juist = onderwerpVorm(w, onderwerp);
    const kandidaten = [w.stam, w.stam.endsWith("t") ? w.stam : w.stam + "t", w.tekst];
    return kandidaten.find(x => x !== juist) || w.stam;
  }
  function shuffle(a) { return [...a].sort(() => Math.random() - 0.5); }
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
  function frase(w) {
    const d = {
      werken: "aan de moeilijke taak", wandelen: "door het park", luisteren: "naar het verhaal", fluisteren: "heel zacht",
      spelen: "op de speelplaats", praten: "met de buurman", wonen: "in een rustige straat", dansen: "op de muziek",
      leren: "voor de toets", fietsen: "naar school", maken: "een mooie tekening", branden: "de hele avond",
      horen: "een vreemd geluid", kloppen: "op de deur", stoppen: "bij het rode licht", antwoorden: "op de vraag",
      lopen: "naar de sporthal", eten: "een rode appel", drinken: "een glas water", zien: "een vogel in de boom",
      lezen: "een spannend boek", zingen: "een vrolijk lied", vliegen: "boven de huizen", komen: "morgen op bezoek",
      geven: "een cadeau aan oma", gaan: "naar de bibliotheek", worden: "morgen tien jaar", zwemmen: "in het zwembad", rijden: "voorzichtig naar huis"
    };
    return d[w.tekst] || "vandaag in de klas";
  }

  function basis(ws, cfg, opl) {
    const onderwerpen = ["ik", "jij", "hij", "zij enkelvoud", "u", "wij", "jullie", "zij meervoud"];
    const rijen = ws.slice(0, 10).map((w, i) => {
      const ond = onderwerpen[i % onderwerpen.length];
      const juist = onderwerpVorm(w, ond);
      const regel = ["ik"].includes(ond) ? "stam" : ["wij", "jullie", "zij meervoud"].includes(ond) ? "heel werkwoord" : "stam + t";
      return `<div class="ov16-basisrij"><span class="ov16-ww">${w.tekst}</span><span class="ov16-onderwerp">${ond.replace(" enkelvoud", " (één)").replace(" meervoud", " (meer)")}</span><span class="ov16-regel">${regel}</span><span class="ov16-antwoord">${opl ? juist : "________________"}</span></div>`;
    }).join("");
    return `<div class="ov16-regelkaart"><b>Onthoud:</b><span>ik = stam</span><span>jij, je, hij, zij, het en u = stam + t</span><span>wij, jullie en zij (meer) = heel werkwoord</span></div><div class="ov16-basistabel"><div class="ov16-kop"><b>werkwoord</b><b>onderwerp</b><b>regel</b><b>persoonsvorm</b></div>${rijen}</div>`;
  }
  function kiezen(ws, cfg, opl) {
    const onderwerpen = ["Ik", "Jij", "Hij", "Zij (één meisje)", "U", "Wij", "Jullie", "Mijn zus"];
    return `<div class="ov16-zinnen">${ws.slice(0, 8).map((w, i) => {
      const ond = onderwerpen[i % onderwerpen.length];
      const sleutel = ond === "Ik" ? "ik" : ["Wij", "Jullie"].includes(ond) ? ond.toLowerCase() : "hij";
      const juist = onderwerpVorm(w, sleutel);
      const keuzes = shuffle([juist, foutVorm(w, sleutel)]);
      return `<div class="ov16-zin"><b>${i + 1}.</b> ${ond} <span class="ov16-keuzes">${keuzes.map(k => `<span class="${opl && k === juist ? "juist" : ""}">${k}</span>`).join(" / ")}</span> ${frase(w)}.${opl ? `<div class="ov16-oplossing">${ond} ${juist} ${frase(w)}.</div>` : lijn(cfg)}</div>`;
    }).join("")}</div>`;
  }
  function jijJe(ws, cfg, opl) {
    const zonderStamOpT = ws.filter(w => !w.stam.endsWith("t"));
    const bruikbaar = zonderStamOpT.length ? zonderStamOpT : ws;
    const pak = i => bruikbaar[i % bruikbaar.length];
    const w0 = pak(0), w1 = pak(1), w2 = pak(2), w3 = pak(3), w4 = pak(4), w5 = pak(5), w6 = pak(6), w7 = pak(7), w8 = pak(8), w9 = pak(9);
    const regels = [
      { zin: `Jij ___ ${frase(w0)}.`, hulp: w0.tekst, juist: w0.ott.jij },
      { zin: `___ jij ${frase(w1)}?`, hulp: w1.tekst, juist: w1.stam },
      { zin: `Je ___ ${frase(w2)}.`, hulp: w2.tekst, juist: w2.ott.jij },
      { zin: `___ je ${frase(w3)}?`, hulp: w3.tekst, juist: w3.stam },
      { zin: `___ je broer ${frase(w4)}?`, hulp: w4.tekst, juist: w4.ott.hij },
      { zin: `___ je buurvrouw ${frase(w5)}?`, hulp: w5.tekst, juist: w5.ott.hij },
      { zin: `___ je vader ${frase(w6)}?`, hulp: w6.tekst, juist: w6.ott.hij },
      { zin: `___ je juf ${frase(w7)}?`, hulp: w7.tekst, juist: w7.ott.hij },
      { zin: `___ u ${frase(w8)}?`, hulp: w8.tekst, juist: w8.ott.jij },
      { zin: `U ___ ${frase(w9)}.`, hulp: w9.tekst, juist: w9.ott.jij }
    ];
    return `<div class="ov16-regelkaart"><b>Let op:</b><span>jij/je vóór de persoonsvorm → stam + t</span><span>persoonsvorm vóór jij/je → alleen stam</span><span>Hoort je bij een zelfstandig naamwoord, zoals je broer of je juf? Dan is dat hele woordgroepje het onderwerp en schrijf je stam + t.</span><span>Bij u schrijf je altijd stam + t.</span></div><div class="ov16-zinnen">${regels.map((r, i) => `<div class="ov16-zin"><b>${i + 1}.</b> ${r.zin} <small>(${r.hulp})</small>${opl ? `<div class="ov16-oplossing">${r.zin.replace("___", r.juist)}</div>` : lijn(cfg)}</div>`).join("")}</div>`;
  }
  function invullen(ws, cfg, opl) {
    const onderwerpen = ["Ik", "Mijn buurman", "Jij", "De kinderen", "U", "Mijn zus", "Wij", "De hond"];
    return `<div class="ov16-zinnen">${ws.slice(0, 8).map((w, i) => {
      const ond = onderwerpen[i % onderwerpen.length];
      const sleutel = ond === "Ik" ? "ik" : ["De kinderen", "Wij"].includes(ond) ? "wij" : ond === "Jij" ? "jij" : ond === "U" ? "u" : "hij";
      const juist = onderwerpVorm(w, sleutel);
      const zin = `${ond} ___ ${frase(w)}.`;
      return `<div class="ov16-zin"><b>${i + 1}.</b> ${opl ? zin.replace("___", `<span class="ov16-oplossing-inline">${juist}</span>`) : zin} <small>(${w.tekst})</small>${opl ? "" : lijn(cfg)}</div>`;
    }).join("")}</div>`;
  }
  function verbeteren(ws, cfg, opl) {
    const gekozen = ws.slice(0, 6);
    const onderwerpen = ["Ik", "Mijn broer", "Jij", "De kinderen", "Mijn mama", "Wij"];
    const correct = gekozen.map((w, i) => {
      const ond = onderwerpen[i];
      const sleutel = ond === "Ik" ? "ik" : ["De kinderen", "Wij"].includes(ond) ? "wij" : ond === "Jij" ? "jij" : "hij";
      return `${ond} ${onderwerpVorm(w, sleutel)} ${frase(w)}.`;
    });
    const fout = gekozen.map((w, i) => {
      const ond = onderwerpen[i];
      const sleutel = ond === "Ik" ? "ik" : ["De kinderen", "Wij"].includes(ond) ? "wij" : ond === "Jij" ? "jij" : "hij";
      return `${ond} ${foutVorm(w, sleutel)} ${frase(w)}.`;
    });
    return `<div class="ov16-tekst"><h3>Zoek en verbeter de werkwoordfouten</h3>${(opl ? correct : fout).map((z, i) => `<p><b>${i + 1}.</b> ${z}</p>`).join("")}</div><div class="ov16-herschrijf"><h3>Schrijf de zinnen correct over</h3>${opl ? `<div class="ov16-oplossing">${correct.join(" ")}</div>` : Array.from({ length: 12 }, () => lijn(cfg)).join("")}</div>`;
  }
  function hebbenZijn(cfg, opl) {
    const bib = window.SpellingWoordenbibliotheek?.graad2?.[CAT]?.woorden || [];
    const hebben = bib.find(w => w.tekst === "hebben");
    const zijn = bib.find(w => w.tekst === "zijn");
    if (!hebben || !zijn) return "";
    const personen = [["ik", "ik"], ["jij/je", "jij"], ["hij/zij/het", "hij"], ["u", "jij"], ["wij", "wij"], ["jullie", "jullie"], ["zij (meer)", "zij"]];
    const tabel = `<div class="ov16-onregelmatig"><div class="ov16-onr-kop"><b>onderwerp</b><b>hebben</b><b>zijn</b></div>${personen.map(([label, key]) => `<div class="ov16-onr-rij"><b>${label}</b><span>${opl ? `<span class="ov16-oplossing-inline">${hebben.ott[key]}</span>` : lijn(cfg)}</span><span>${opl ? `<span class="ov16-oplossing-inline">${zijn.ott[key]}</span>` : lijn(cfg)}</span></div>`).join("")}</div>`;
    const zinnen = [
      ["Ik ___ een nieuwe fiets.", "heb", "hebt"], ["Jij ___ vandaag jarig.", "bent", "ben"],
      ["Mijn zus ___ een blauwe jas.", "heeft", "heb"], ["Wij ___ klaar voor de wedstrijd.", "zijn", "is"],
      ["___ jij mijn schrift gezien?", "Heb", "Heeft"], ["___ u tevreden over het resultaat?", "Bent", "Is"],
      ["De kinderen ___ veel plezier.", "hebben", "heeft"], ["De hond ___ erg moe.", "is", "bent"]
    ];
    const toepassing = `<div class="ov16-zinnen ov16-onr-zinnen">${zinnen.map((z, i) => {
      const keuzes = shuffle([z[1], z[2]]);
      const juisteZin = z[0].replace("___", z[1]);
      return `<div class="ov16-zin"><b>${i + 1}.</b> ${z[0]} <span class="ov16-keuzes">${keuzes.map(k => `<span class="${opl && k === z[1] ? "juist" : ""}">${k}</span>`).join(" / ")}</span>${opl ? `<div class="ov16-oplossing">${juisteZin}</div>` : `${lijn(cfg)}${lijn(cfg)}`}</div>`;
    }).join("")}</div>`;
    return { tabel, toepassing };
  }

  function moduleVoor(id) {
    return {
      naam: VORMEN[id].naam, graad: 2, oefenvormenPerNiveau: ["basis"], _maxPerNiveau: { basis: VORMEN[id].max },
      renderInstellingen() { return ""; },
      genereerBlad(opties, oplossingen) {
        const o = opties?.[id] || opties || {};
        const cfg = { lijntype: o.lijntype || "type3", lijnhoogte: o.lijnhoogte || "middel" };
        const basiswoorden = id === "ov16" ? regelmatig() : woorden();
        const ws = varieer(basiswoorden, id, VORMEN[id].max, oplossingen);
        if (!ws.length) return `<div class="werkblad ov16-blad">Geen passende werkwoorden beschikbaar.</div>`;
        if (id === "ov16") return header(VORMEN[id].naam, ["Lees het hele werkwoord en het onderwerp.", "Gebruik de regel en schrijf de persoonsvorm."], basis(ws, cfg, oplossingen), cfg, oplossingen);
        if (id === "ov17") return header(VORMEN[id].naam, ["Zoek het onderwerp.", "Kleur de juiste persoonsvorm en schrijf de zin correct over."], kiezen(ws, cfg, oplossingen), cfg, oplossingen);
        if (id === "ov18") return header(VORMEN[id].naam, ["Kijk of jij of je vóór of achter de persoonsvorm staat.", "Vul de juiste persoonsvorm in."], jijJe(regelmatig(), cfg, oplossingen), cfg, oplossingen);
        if (id === "ov19") return header(VORMEN[id].naam, ["Onderstreep het onderwerp.", "Vervoeg het werkwoord tussen haakjes en vul de persoonsvorm in."], invullen(ws, cfg, oplossingen), cfg, oplossingen);
        if (id === "ov20") return header(VORMEN[id].naam, ["Onderstreep het onderwerp en omcirkel de foute persoonsvorm.", "Schrijf alle zinnen correct over."], verbeteren(regelmatig(), cfg, oplossingen), cfg, oplossingen);
        const delen = hebbenZijn(cfg, oplossingen);
        return header("OTT: hebben en zijn — vervoegen", ["Vul de tabel met de juiste vormen van hebben en zijn in.", "Schrijf elke vorm op de schrijflijn."], delen.tabel, cfg, oplossingen)
          + header("OTT: hebben en zijn — toepassen", ["Kleur in elke zin de juiste persoonsvorm.", "Schrijf daarna de volledige zin correct over."], delen.toepassing, cfg, oplossingen);
      }
    };
  }
  window.SpellingModules = window.SpellingModules || {};
  Object.keys(VORMEN).forEach(id => { window.SpellingModules[id] = moduleVoor(id); });
})();
