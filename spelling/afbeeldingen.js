window.SpellingPrentPad = function(pad) {
  if (typeof pad !== "string") return pad;
  const lokaal = pad.replace(/^https:\/\/zisa-spellingprenten\.pages\.dev\//, "").replace(/\.webp(?=\?|$)/i, ".png");
  if (!lokaal.startsWith("afbeeldingen/")) return pad;
  return "https://zisa-spellingprenten.pages.dev/" + lokaal.replace(/\.png(?=\?|$)/i, ".webp");
};

/* ==========================================================
   afbeeldingen.js
   Centrale helper voor woord → afbeelding mapping.

   Hoe gebruik:
   - Plaats PNG-bestanden in afbeeldingen/ met de naam van het woord
     (bv. bal.png, kat.png, vis.png)
   - De tool zoekt automatisch naar afbeeldingen/{woord}.png
   - Als het bestand bestaat: toont afbeelding
   - Als het bestand niet bestaat: toont een emoji-fallback

   We laten de browser zelf de "bestaat het bestand?" check doen
   via een onerror-handler op het <img>-element.
   ========================================================== */

window.SpellingAfbeeldingen = {

  /* Emoji fallback per woord (uitbreidbaar)
     Gebruikt wanneer er nog geen eigen plaatje is. */
  emojiFallback: {
    // Korte klanken
    bal: "⚽", kat: "🐱", tas: "👜", man: "👨", pan: "🍳", dak: "🏠",
    bel: "🔔", pet: "🧢", hek: "🚪", pen: "✏️", mes: "🔪",
    kip: "🐔", vis: "🐟", lip: "👄",
    pop: "🪆", rok: "👗", vos: "🦊", kom: "🥣", pot: "🪴", zon: "☀️",
    bus: "🚌", hut: "🛖", mus: "🐦", pup: "🐶",
    // Tweeklanken
    riet: "🌾", biet: "🥬", wiel: "☸️", fiets: "🚲", knie: "🦵",
    neus: "👃", deur: "🚪", reus: "🧑‍🦱",
    huis: "🏡", muis: "🐭", tuin: "🌳", duin: "🏖️",
    boek: "📖", koek: "🍪", voet: "🦶", bloem: "🌸", stoel: "🪑",
    haai: "🦈", kraai: "🐦‍⬛",
    mooi: "✨", kooi: "🦜",
    leeuw: "🦁", sneeuw: "❄️", spreeuw: "🐦", meeuw: "🪿", eeuw: "💯",
    nieuw: "🆕", opnieuw: "🔁", kieuw: "🐟",
    // Lange klanken
    haan: "🐓", maan: "🌙", paard: "🐴", taart: "🍰", kaas: "🧀",
    boom: "🌳", doos: "📦", boot: "⛵", school: "🏫", bloem: "🌸",
    been: "🦵", zee: "🌊", beek: "💧", veer: "🪶", eend: "🦆",
    muur: "🧱", vuur: "🔥",
    // ng/nk
    ring: "💍", slang: "🐍", long: "🫁", tong: "👅", wang: "😊",
    bank: "🏦", tank: "🛢️", vink: "🐦", plank: "🪵", pink: "🤙"
  },

  /* Geef HTML voor de afbeelding bij een woord.
     Accepteert OFWEL een woord-object {tekst, categorie, leerjaar/graad}
     OFWEL een tekst-string (backwards-compat — dan alleen emoji-span).
     
     Bij woord-object:
     - Bouwt pad: afbeeldingen/graad{N}/{categorie}/{tekst}.png
     - Toont <img>; bij 404 vervangt onerror door emoji-span
     
     Bij string (geen categorie bekend):
     - Toont alleen emoji-span (kan geen pad opbouwen) */
  htmlVoorWoord: function(woord) {
    // Bepaal tekst (voor emoji-lookup) en pad
    let tekst, pad;
    if (typeof woord === "string") {
      tekst = woord;
      pad = null;  // geen categorie → geen pad mogelijk
    } else if (woord && typeof woord === "object") {
      tekst = woord.tekst || "";
      if (woord.categorie && tekst) {
        const graadNr = woord.afbeelding_graad || woord.graad || woord.leerjaar || 1;
        const afbeeldingCategorie = woord.afbeelding_categorie || woord.categorie;
        // Optioneel afbeelding_bestand veld voor Windows-gereserveerde namen
        // (nul, con, aux, prn, ...) of andere uitzonderingen.
        // Valt terug op {tekst}.png als afbeelding_bestand niet gezet is.
        const bestandsnaam = woord.afbeelding_bestand || `${tekst}.png`;
        pad = `afbeeldingen/graad${graadNr}/${afbeeldingCategorie}/${bestandsnaam}`;
      }
    } else {
      return `<span class="woord-emoji">📷</span>`;
    }
    
    const emoji = this.emojiFallback[tekst] || "📷";
    
    if (!pad) {
      // Geen pad → alleen emoji-span
      return `<span class="woord-emoji">${emoji}</span>`;
    }
    
    // <img> met onerror fallback naar emoji-span
    const prent = `<img class="woord-afbeelding"
      src="${this.prentbron(pad)}"
      alt="${tekst}"
      onerror="this.outerHTML='<span class=&quot;woord-emoji&quot;>${emoji}</span>'">`;
    return this.metPrentbijschrift(pad, prent);
  },

  prentbijschrift: function(pad) {
    const lokaal = pad.replace(/^https:\/\/zisa-spellingprenten\.pages\.dev\//, "").replace(/\.webp(?=\?|$)/i, ".png").split("?")[0];
    return spellingPrentbijschriften.get(lokaal);
  },

  prentbron: function(pad) {
    const bijschrift = this.prentbijschrift(pad);
    const bron = bijschrift && !bijschrift.beeldverhouding ? `${bijschrift.bron || pad}?v=20261110f` : pad;
    return window.SpellingPrentPad(bron);
  },

  metPrentbijschrift: function(pad, prent) {
    const bijschrift = this.prentbijschrift(pad);
    if (!bijschrift) return prent;

    const { beeldverhouding, zin } = bijschrift;
    const uitsnede = beeldverhouding ? " woord-prent-uitsnede" : "";
    const verhouding = beeldverhouding ? ` style="--prent-verhouding:1 / ${beeldverhouding}"` : "";
    return `<div class="woord-prent-met-tekst">
      <div class="woord-prent-beeld${uitsnede}"${verhouding}>${prent}</div>
      <div class="woord-prent-bijschrift">${zin}</div>
    </div>`;
  },

  /* Geef alleen de emoji voor een woord (geen img-tag) — gebruikt door OV01 */
  emojiVoor: function(woord) {
    return this.emojiFallback[woord] || "📷";
  }
};

// De oude prenten met een invulzin hebben een vierkant beeld met daaronder tekst.
// Gebruik dezelfde zin als leesbare tekst naast het vierkante beeld.
const spellingPrentbijschriften = new Map();
for (const [map, woorden, zin, beeldverhouding = 1, gedeeldBestand] of [
  ["cht-woorden", ["dicht"], "De deur is _____."],
  ["cht-woorden", ["nicht"], "neef en _____", 1045 / 1254],
  ["cht-woorden", ["hij vecht", "hij wacht", "hij zucht"], "hij _____"],
  ["df-en", ["drinken", "eten", "fluiten", "geven", "kijken", "lezen", "lopen", "praten", "slapen", "spelen", "vragen", "wonen"], "wij _____."],
  ["df-voorvoegsel", ["vergeet"], "ik _____"],
  ["gt-woorden", ["hij buigt", "hij jaagt", "hij klaagt", "hij legt", "hij ligt", "hij veegt", "hij vliegt", "hij vraagt", "hij zegt"], "hij _____"],
  ["lk-ee", ["leeg"], "het glas is _____."],
  ["lk-uu", ["uur"], "Het is 4 _____.", 950 / 1254],
  ["meervoud-verenkel", ["uur"], "Een dag telt 24 _____.", 800 / 1402],
  ["ng-woorden", ["hang"], "ik _____ de jas aan de kapstok."],
  ["ng-woorden", ["hangt"], "De rugzak _____ aan de kapstok."],
  ["ng-woorden", ["spring", "zing"], "ik _____"],
  ["ng-woorden", ["springt", "zingt"], "hij _____"],
  ["nk-woorden", ["denk", "drink", "schenk"], "ik _____"],
  ["nk-woorden", ["drinkt", "schenkt"], "hij _____"],
  ["nk-woorden", ["stinkt"], "Het afval _____."],
  ["sch-woorden", ["scheef"], "het kader hangt _____."],
  ["stukjes-verdubbelen", ["bakken", "rennen", "stoppen", "tikken", "vallen", "zitten", "zwemmen"], "Ik wil _____."],
  ["stukjes-verenkelen", ["eten", "lopen", "slapen"], "Ik wil _____."],
  ["stukjes-verenkelen", ["uur"], "Een dag telt 24 _____.", 800 / 1402],
  ["tw-aai", ["maait"], "hij _____ het gras."],
  ["tw-aai", ["naait"], "zij _____"],
  ["tw-aai", ["zaai"], "ik _____ zaadjes.", 0],
  ["tw-aai", ["zaait"], "hij _____ zaadjes."],
  ["tw-eu", ["kreun"], "ik _____"],
  ["tw-eu", ["kreunt"], "hij _____"],
  ["tw-ij", ["kijk", "schrijf"], "ik _____"],
  ["tw-oei", ["knoei", "stoei"], "ik _____"],
  ["tw-oei", ["knoeit", "roeit", "stoeit"], "hij _____"],
  ["tw-oei", ["loeit"], "De koe _____."],
  ["tw-ooi", ["gooi"], "ik _____"],
  ["tw-ooi", ["mooi"], "De vlinder is niet lelijk. Hij is _____.", 0],
  ["tw-ooi", ["strooi"], "Ik ____________ zout op mijn ei.", 0],
  ["tw-ooi", ["gooit"], "hij _____"],
  ["tw-ooi", ["strooit"], "Hij __________ zout op zijn ei.", 0, "strooi.png"],
]) {
  for (const woord of woorden) {
    const mapPad = `afbeeldingen/graad1/${map}`;
    const bron = gedeeldBestand ? `${mapPad}/${gedeeldBestand}` : null;
    spellingPrentbijschriften.set(`${mapPad}/${woord}.png`, { zin, beeldverhouding, bron });
  }
}
