/* ==========================================================
   spelling/afbeeldingen-helper.js
   
   Bepaalt het pad naar een afbeelding voor een woord.
   Map-structuur: /afbeeldingen/graad{N}/stukjes/{woord}.png
   
   Bevat fallback: als een woord afbeelding=false heeft of het
   bestand niet bestaat, valt het terug op een emoji uit
   afbeeldingen.js (de bestaande emoji-helper).
   ========================================================== */

(function () {
  "use strict";

  const AfbHelper = {
    /* Geeft het URL-pad naar de afbeelding van een woord.
       Returns null als woord geen afbeelding-flag heeft. */
    pad: function (woord, graad) {
      if (!woord || !woord.tekst) return null;
      if (!woord.afbeelding) return null;
      graad = graad || woord.leerjaar || 1;
      return `afbeeldingen/graad${graad}/stukjes/${woord.tekst}.png`;
    },

    /* Geeft HTML voor de afbeelding van een woord, met fallback.
       - Als woord.afbeelding === true: <img src="..."> met onerror naar emoji
       - Anders: emoji direct in <span>
       
       Parameters:
       - woord: {tekst, afbeelding, ...}
       - opties: {grootte (default 80), graad (default 1), klas, toonTekst (default true)}
    */
    html: function (woord, opties) {
      opties = opties || {};
      const grootte = opties.grootte || 80;
      const graad = opties.graad || woord.leerjaar || 1;
      const klas = opties.klas || "ov-afbeelding";

      const emoji = (window.SpellingAfbeeldingen && window.SpellingAfbeeldingen.emojiVoor)
        ? window.SpellingAfbeeldingen.emojiVoor(woord.tekst)
        : "🖼️";

      const emojiStyle = `font-size:${Math.round(grootte * 0.7)}px;line-height:${grootte}px;display:inline-flex;align-items:center;justify-content:center;width:${grootte}px;height:${grootte}px;text-align:center;`;

      if (!woord.afbeelding) {
        return `<span class="${klas} ${klas}-emoji" style="${emojiStyle}">${emoji}</span>`;
      }

      const src = this.pad(woord, graad);
      // <img> met onerror naar emoji-fallback — gebruik data-attribuut zodat
      // de string-escape niet door HTML-quotes gebroken wordt.
      return `<img src="${src}" class="${klas} ${klas}-img" 
              data-fallback-emoji="${emoji}"
              data-fallback-style="${emojiStyle.replace(/"/g, "&quot;")}"
              data-fallback-klas="${klas}"
              style="width:${grootte}px;height:${grootte}px;object-fit:contain;"
              onerror="(function(img){var s=document.createElement('span');s.className=img.dataset.fallbackKlas+' '+img.dataset.fallbackKlas+'-emoji';s.style.cssText=img.dataset.fallbackStyle;s.textContent=img.dataset.fallbackEmoji;img.replaceWith(s);})(this)"
              alt="${woord.tekst}">`;
    },

    /* Filter een woordenlijst: alleen woorden met afbeelding=true. */
    metAfbeelding: function (woorden) {
      if (!Array.isArray(woorden)) return [];
      return woorden.filter(w => w && w.afbeelding === true);
    },

    /* Statistiek: hoeveel woorden hebben een afbeelding per categorie? */
    statistiekPerCategorie: function (graad) {
      graad = graad || 1;
      const wb = window.SpellingWoordenbibliotheek;
      if (!wb || !wb[`graad${graad}`]) return {};
      const stats = {};
      const graadData = wb[`graad${graad}`];
      for (const catId in graadData) {
        const cat = graadData[catId];
        if (!cat.woorden) continue;
        const totaal = cat.woorden.length;
        const met = cat.woorden.filter(w => w.afbeelding).length;
        stats[catId] = { totaal, metAfb: met, percentage: Math.round(met * 100 / totaal) };
      }
      return stats;
    }
  };

  window.SpellingAfbHelper = AfbHelper;
})();