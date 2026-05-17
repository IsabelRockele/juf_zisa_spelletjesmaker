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
        const graadNr = woord.graad || woord.leerjaar || 1;
        // Optioneel afbeelding_bestand veld voor Windows-gereserveerde namen
        // (nul, con, aux, prn, ...) of andere uitzonderingen.
        // Valt terug op {tekst}.png als afbeelding_bestand niet gezet is.
        const bestandsnaam = woord.afbeelding_bestand || `${tekst}.png`;
        pad = `afbeeldingen/graad${graadNr}/${woord.categorie}/${bestandsnaam}`;
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
    return `<img class="woord-afbeelding"
      src="${pad}"
      alt="${tekst}"
      onerror="this.outerHTML='<span class=&quot;woord-emoji&quot;>${emoji}</span>'">`;
  },

  /* Geef alleen de emoji voor een woord (geen img-tag) — gebruikt door OV01 */
  emojiVoor: function(woord) {
    return this.emojiFallback[woord] || "📷";
  }
};