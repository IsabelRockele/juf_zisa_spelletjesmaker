/* ==========================================================
   dedup.js
   Centrale helper om duplicaten uit woordenlijsten te halen.

   Twee woorden tellen als "hetzelfde" als ze:
     - dezelfde synoniemGroep hebben (expliciet gezet in graadX.js,
       bv. kip en hen krijgen allebei synoniemGroep: "kip" want
       voor het kind is dat dezelfde afbeelding)
     - OF dezelfde tekst (case-insensitive, getrimd)

   Wordt gebruikt door:
     - generator.js, bundel.js, herhalingsbundel.js
       → snapshot ontdubbelen vóór modules hem zien (eerste laag)
     - elke OV-module → vangnet binnen genereerBlad
     - OV06 → extra check: afleiders mogen geen synoniem zijn van doelwoorden

   Pop-up bij te kleine pool: toonTekortMelding() toont één alert
   wanneer een blad om méér woorden vraagt dan er uniek beschikbaar zijn.
   ========================================================== */

window.SpellingDedup = (function() {

  /* Geef ALLE sleutels van een woord. Twee woorden tellen als duplicaat
     zodra ze een gemeenschappelijke sleutel hebben.
     
     - "t:" + lowercase tekst (altijd, als er tekst is)
     - "sg:" + lowercase synoniemGroep (als veld aanwezig)
     
     Voorbeeld:
       {tekst:"kip", synoniemGroep:"kip"}  → ["t:kip", "sg:kip"]
       {tekst:"hen", synoniemGroep:"kip"}  → ["t:hen", "sg:kip"]
       {tekst:"kip"}                       → ["t:kip"]
     
     "kip-met-groep" en "hen-met-groep" matchen via "sg:kip".
     "kip-met-groep" en "kip-zonder-groep" matchen via "t:kip".
     Dus zelfs als de leerkracht synoniemGroep op één van beide is vergeten,
     wordt de tekst-match nog steeds opgevangen. */
  function sleutels(w) {
    if (!w) return [];
    const set = [];
    const t = (w.tekst || "").toLowerCase().trim();
    if (t) set.push("t:" + t);
    if (w.synoniemGroep) set.push("sg:" + String(w.synoniemGroep).toLowerCase().trim());
    return set;
  }

  /* Backwards-compat: één primaire sleutel (de eerste). Gebruikt door
     externe code die slechts één identifier wil. */
  function sleutel(w) {
    const s = sleutels(w);
    return s[0] || "";
  }

  /* Ontdubbel een lijst woorden. Een woord valt weg zodra een van zijn
     sleutels al "gezien" is. Eerste exemplaar blijft staan; volgorde
     blijft behouden. Geeft een NIEUWE array; muteert input niet. */
  function ontdubbel(woorden) {
    if (!Array.isArray(woorden)) return [];
    const gezien = new Set();
    const uit = [];
    for (const w of woorden) {
      const ks = sleutels(w);
      if (ks.length === 0) continue;
      // Duplicaat zodra een sleutel al voorkomt
      if (ks.some(k => gezien.has(k))) continue;
      // Anders: voeg alle sleutels toe en houd woord
      for (const k of ks) gezien.add(k);
      uit.push(w);
    }
    return uit;
  }

  /* Hoeveel UNIEKE woorden zitten er in deze lijst? */
  function telUniek(woorden) {
    return ontdubbel(woorden).length;
  }

  /* Filter doellijst zo dat geen enkel woord een gedeelde sleutel heeft
     met een woord in 'tegen'. Gebruikt door OV06 om afleiders die
     synoniem (of letterlijk dezelfde tekst) zijn van doelwoorden weg
     te halen. */
  function verschilt(doellijst, tegen) {
    if (!Array.isArray(doellijst)) return [];
    if (!Array.isArray(tegen) || tegen.length === 0) return [...doellijst];
    const verboden = new Set();
    for (const w of tegen) {
      for (const k of sleutels(w)) verboden.add(k);
    }
    return doellijst.filter(w => {
      const ks = sleutels(w);
      if (ks.length === 0) return false;
      return !ks.some(k => verboden.has(k));
    });
  }

  /* Toon één alert wanneer een werkblad om meer woorden vraagt dan
     er uniek beschikbaar zijn. Eén alert per oefenvorm-toevoeging —
     we deduplicaten meldingen binnen dezelfde event-tick zodat een
     leerkracht die "voeg toe" klikt met 4 niveaus aangevinkt geen
     4 popups achter elkaar krijgt voor hetzelfde tekort. */
  let _getoondInTick = new Set();
  function toonTekortMelding(gevraagd, beschikbaar, label) {
    const key = `${label}|${gevraagd}|${beschikbaar}`;
    if (_getoondInTick.has(key)) return;
    _getoondInTick.add(key);
    // Reset bij volgende microtask zodat een latere klik wél opnieuw kan tonen
    Promise.resolve().then(() => { _getoondInTick.clear(); });

    const naam = label || "werkblad";
    alert(
      `Niet genoeg unieke woorden voor "${naam}".\n\n` +
      `Je vroeg om ${gevraagd} woord${gevraagd === 1 ? "" : "en"}, ` +
      `maar er zijn maar ${beschikbaar} uniek${beschikbaar === 1 ? " woord" : "e woorden"} beschikbaar.\n\n` +
      `Het werkblad krijgt nu ${beschikbaar} woord${beschikbaar === 1 ? "" : "en"}. ` +
      `Vink meer categorieën aan of kies meer woorden in de woordenkiezer als je er meer wil.`
    );
  }

  return {
    sleutel,
    sleutels,
    ontdubbel,
    telUniek,
    verschilt,
    toonTekortMelding
  };

})();