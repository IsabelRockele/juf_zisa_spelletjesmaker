/* ══════════════════════════════════════════════════════════════
   generator.js
   Verantwoordelijkheid: bundel-data array opbouwen
   - Weet welke module gebruikt moet worden per bewerking+niveau
   - Roept de juiste module aan met de juiste config
   - Geeft een volledig blok-object terug voor de bundel-data
   ══════════════════════════════════════════════════════════════ */

const Generator = (() => {

  let _teller = 0;

  /* ── Kies de juiste module op basis van bewerking + niveau ── */
  function _getModule(bewerking, niveau) {
    if (bewerking === 'aanvullen') return AanvullenTot100;
    if (bewerking === 'optellen') {
      if (niveau <= 20)   return OptellenTot20;
      if (niveau <= 100)  return OptellenTot100;
      if (niveau <= 1000) return OptellenTot1000;
    }
    if (bewerking === 'aftrekken') {
      if (niveau <= 20)   return AftrekkenTot20;
      if (niveau <= 100)  return AftrekkenTot100;
      if (niveau <= 1000) return AftrekkenTot1000;
    }
    if (bewerking === 'herken-brug') return HerkenBrugTot100;
    return null;
  }

  /* ── Vertaal brugwaarde voor modules die enkel met/zonder kennen ── */
  function _brugVoor100(brug) {
    if (brug === 'zonder' || brug === 'gemengd') return brug;
    return 'met'; // naar-tiental, naar-honderdtal, beide → 'met'
  }

  /* ── Maak een nieuw blok ─────────────────────────────────── */
  function maakBlok({ bewerking, niveau, oefeningstypes, brug, aantalOefeningen, opdrachtzin, hulpmiddelen = [], splitspositie = 'aftrekker', aanvullenVariant = 'zonder-schema', compenserenVariant = 'met-tekens', schrijflijnenAantal = 2, metVoorbeeld = false }) {
    const isHerken      = bewerking === 'herken-brug';
    const isAanvullen   = hulpmiddelen.includes('aanvullen');
    const isCompenseren = hulpmiddelen.includes('compenseren');

    // Kies module
    const compModule = isCompenseren
      ? (bewerking === 'aftrekken'
          ? (niveau >= 1000 ? CompenserenAftrekkenTot1000 : CompenserenAftrekken)
          : (niveau >= 1000 ? CompenserenOptellenTot1000  : CompenserenOptellen))
      : null;
    const module = isAanvullen   ? AanvullenTot100 :
                   isCompenseren ? compModule :
                   _getModule(bewerking, niveau);
    if (!module) {
      console.warn(`Geen module voor ${bewerking} tot ${niveau}`);
      return null;
    }

    // Brugwaarde aanpassen voor modules die enkel met/zonder kennen
    const brugVoorModule = niveau <= 100 ? _brugVoor100(brug) : brug;

    // Genereer oefeningen
    let oefeningen;
    if (isHerken)           oefeningen = module.genereer({ oefeningstypes, aantalOefeningen });
    else if (isAanvullen)   oefeningen = AanvullenTot100.genereer({ aantalOefeningen });
    else if (isCompenseren) oefeningen = compModule.genereer({ aantalOefeningen, oefeningstypes });
    else                    oefeningen = module.genereer({ niveau, oefeningstypes, brug: brugVoorModule, aantalOefeningen });
    if (oefeningen.length < 2) return null;

    const defaultZin = isCompenseren ? 'Compenseer.' :
                       isHerken      ? 'Kleur Zisa groen bij elke brugoefening.' :
                       bewerking === 'aftrekken' ? 'Trek af.' : 'Reken vlug uit.';

    _teller++;
    return {
      id:          `blok-${Date.now()}-${_teller}`,
      bewerking,
      subtype:     `${bewerking}-tot${niveau}`,
      niveau,
      brug,
      opdrachtzin: opdrachtzin || defaultZin,
      hulpmiddelen,
      splitspositie,
      aanvullenVariant,
      compenserenVariant,
      schrijflijnenAantal,
      metVoorbeeld,
      config: { bewerking, oefeningstypes, brug, aantalOefeningen, hulpmiddelen, splitspositie, aanvullenVariant, compenserenVariant, schrijflijnenAantal, metVoorbeeld },
      oefeningen,
    };
  }

  /* ── Voeg één extra oefening toe aan een bestaand blok ───── */
  function voegOefeningToe(blok) {
    const isAanvullen   = blok.hulpmiddelen?.includes('aanvullen');
    const isCompenseren = blok.hulpmiddelen?.includes('compenseren');
    const compModule = isCompenseren
      ? (blok.bewerking === 'aftrekken'
          ? (blok.niveau >= 1000 ? CompenserenAftrekkenTot1000 : CompenserenAftrekken)
          : (blok.niveau >= 1000 ? CompenserenOptellenTot1000  : CompenserenOptellen))
      : null;
    const module = isAanvullen   ? AanvullenTot100 :
                   isCompenseren ? compModule :
                   _getModule(blok.bewerking, blok.niveau);
    if (!module) return false;

    const brugVoorModule = blok.niveau <= 100 ? _brugVoor100(blok.config.brug) : blok.config.brug;
    const nieuweOef = isAanvullen    ? AanvullenTot100.genereer({ aantalOefeningen: 5 }) :
                      isCompenseren  ? compModule.genereer({ aantalOefeningen: 5 }) :
                      module.genereer({ ...blok.config, brug: brugVoorModule, niveau: blok.niveau, aantalOefeningen: 5 });
    const bestaandeSleutels = new Set(blok.oefeningen.map(o => o.sleutel));

    for (const oef of nieuweOef) {
      if (!bestaandeSleutels.has(oef.sleutel)) {
        blok.oefeningen.push(oef);
        return true;
      }
    }
    return false;
  }

  /* ── Geef beschikbare types terug ────────────────────────── */
  function getTypes(bewerking, niveau, brug = 'zonder', hulpmiddelen = []) {
    if (bewerking === 'herken-brug') return _getModule(bewerking, niveau)?.getTypes() || [];

    const isCompenseren = hulpmiddelen.includes('compenseren');
    const isAanvullen   = hulpmiddelen.includes('aanvullen');

    let module;
    if (isCompenseren) {
      module = bewerking === 'aftrekken'
        ? (niveau >= 1000 ? CompenserenAftrekkenTot1000 : CompenserenAftrekken)
        : (niveau >= 1000 ? CompenserenOptellenTot1000  : CompenserenOptellen);
    } else if (isAanvullen) {
      module = AanvullenTot100;
    } else {
      module = _getModule(bewerking, niveau);
    }
    if (!module) return [];
    const brugVoorModule = niveau <= 100 ? _brugVoor100(brug) : brug;
    return module.getTypes(niveau, brugVoorModule);
  }

  return { maakBlok, voegOefeningToe, getTypes };
})();
