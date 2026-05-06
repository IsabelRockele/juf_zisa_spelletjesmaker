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
     Probeert eerst /afbeeldingen/{woord}.png te laden.
     Bij fout valt het terug op de emoji of "📷". */
  htmlVoorWoord: function(woord) {
    const emoji = this.emojiFallback[woord] || "📷";
    const padNaarAfbeelding = `afbeeldingen/${woord}.png`;
    // We tonen <img>; als die faalt, vervangt onerror hem door de emoji-span
    return `<img class="woord-afbeelding"
      src="${padNaarAfbeelding}"
      alt="${woord}"
      onerror="this.outerHTML='<span class=&quot;woord-emoji&quot;>${emoji}</span>'">`;
  },

  /* Geef alleen de emoji voor een woord (geen img-tag) — gebruikt door OV01 */
  emojiVoor: function(woord) {
    return this.emojiFallback[woord] || "📷";
  }
};
