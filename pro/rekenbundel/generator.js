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
    if (bewerking === 'aanvullen') return niveau >= 1000 ? AanvullenTot1000 : AanvullenTot100;
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
    if (bewerking === 'splitsingen') return Splitsingen;
    if (bewerking === 'tafels')      return Tafels;
    return null;
  }

  /* ── Vertaal brugwaarde voor modules die enkel met/zonder kennen ── */
  function _brugVoor100(brug) {
    if (brug === 'zonder' || brug === 'gemengd') return brug;
    return 'met'; // naar-tiental, naar-honderdtal, beide → 'met'
  }

  /* ── Maak een nieuw blok ─────────────────────────────────── */
  function maakBlok({ bewerking, niveau, oefeningstypes, brug, aantalOefeningen, opdrachtzin, hulpmiddelen = [], splitspositie = 'aftrekker', aanvullenVariant = 'zonder-schema', compenserenVariant = 'met-tekens', schrijflijnenAantal = 2, metVoorbeeld = false, splitsVariant = 'afwisselend', splitsGetallen = null, splitsModus = 'tot', tafels = null, tafelPositie = 'vooraan', tafelMax = 10 }) {
    const isHerken      = bewerking === 'herken-brug';
    const isSplitsingen = bewerking === 'splitsingen';
    const isTafels      = bewerking === 'tafels';
    const isAanvullen   = hulpmiddelen.includes('aanvullen');
    const isCompenseren = hulpmiddelen.includes('compenseren');

    // Kies module
    const compModule = isCompenseren
      ? (bewerking === 'aftrekken'
          ? (niveau >= 1000 ? CompenserenAftrekkenTot1000 : CompenserenAftrekken)
          : (niveau >= 1000 ? CompenserenOptellenTot1000  : CompenserenOptellen))
      : null;
    const aanvulModule = niveau >= 1000 ? AanvullenTot1000 : AanvullenTot100;
    const module = isAanvullen   ? aanvulModule :
                   isCompenseren ? compModule :
                   isTafels      ? Tafels :
                   _getModule(bewerking, niveau);
    if (!module) {
      console.warn(`Geen module voor ${bewerking} tot ${niveau}`);
      return null;
    }

    // Brugwaarde aanpassen voor modules die enkel met/zonder kennen
    const brugVoorModule = niveau <= 100 ? _brugVoor100(brug) : brug;

    // Genereer oefeningen
    let oefeningen;
    if (isTafels)           oefeningen = Tafels.genereer({ tafels, oefeningstypes, aantalOefeningen, tafelPositie, tafelMax });
    else if (isSplitsingen) oefeningen = Splitsingen.genereer({ oefeningstypes, aantalOefeningen, niveau, splitsVariant, splitsGetallen, splitsModus, brug });
    else if (isHerken)      oefeningen = module.genereer({ oefeningstypes, aantalOefeningen });
    else if (isAanvullen)   oefeningen = aanvulModule.genereer({ aantalOefeningen, oefeningstypes });
    else if (isCompenseren) oefeningen = compModule.genereer({ aantalOefeningen, oefeningstypes });
    else                    oefeningen = module.genereer({ niveau, oefeningstypes, brug: brugVoorModule, aantalOefeningen });
    const wilGroot = oefeningstypes?.some(t => t.includes('Groot'));
    if (oefeningen.length < 2 && !wilGroot) return null;

    const isMaakEerst10 = oefeningstypes?.includes('Maak eerst 10') && oefeningstypes.length === 1;
    const defaultZin = isCompenseren ? 'Compenseer.' :
                       isSplitsingen ? 'Splits het getal.' :
                       isTafels      ? 'Reken de tafels.' :
                       isHerken      ? 'Kleur Zisa groen bij elke brugoefening.' :
                       isMaakEerst10 ? 'Onderstreep eerst wat samen 10 is en reken dan uit.' :
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
      splitsVariant,
      tafels,
      tafelPositie,
      tafelMax,
      config: { bewerking, oefeningstypes, brug, aantalOefeningen, hulpmiddelen, splitspositie, aanvullenVariant, compenserenVariant, schrijflijnenAantal, metVoorbeeld, splitsVariant, tafels, tafelPositie, tafelMax },
      oefeningen,
    };
  }

  /* ── Voeg één extra oefening toe aan een bestaand blok ───── */
  function voegOefeningToe(blok) {
    // Cijferen: gebruik de Cijferen module
    if (blok.bewerking === 'cijferen') {
      const nieuweOef = Cijferen.genereer({ ...blok.config, aantalOefeningen: 5 });
      const bestaand  = new Set(blok.oefeningen.map(o => o.sleutel));
      for (const oef of nieuweOef) {
        if (!bestaand.has(oef.sleutel)) { blok.oefeningen.push(oef); return true; }
      }
      return false;
    }

    // Speciale afhandeling voor inzicht en getallenlijn
    if (blok.bewerking === 'tafels-inzicht') {
      const nieuweOef = TafelsInzicht.genereer({ ...blok.config, aantalOefeningen: 5, inzichtType: blok.config?.inzichtType || 'groepjes' });
      const bestaand  = new Set(blok.oefeningen.map(o => o.sleutel));
      for (const oef of nieuweOef) {
        if (!bestaand.has(oef.sleutel)) { blok.oefeningen.push(oef); return true; }
      }
      return false;
    }
    if (blok.bewerking === 'tafels-getallenlijn') {
      const nieuweOef = TafelsGetallenlijn.genereer({
        modus: blok.config?.modus || 'per-tafel',
        tafels: blok.config?.tafels || [2],
        maxUitkomst: blok.config?.maxUitkomst || 30,
        tafelMax: blok.config?.tafelMax || 5,
        aantalOefeningen: 5,
        variant: blok.subtype || 'getekend',
      });
      const bestaand = new Set(blok.oefeningen.map(o => o.sleutel));
      for (const oef of nieuweOef) {
        if (!bestaand.has(oef.sleutel)) { blok.oefeningen.push(oef); return true; }
      }
      return false;
    }

    const isAanvullen   = blok.hulpmiddelen?.includes('aanvullen');
    const isCompenseren = blok.hulpmiddelen?.includes('compenseren');
    const compModule = isCompenseren
      ? (blok.bewerking === 'aftrekken'
          ? (blok.niveau >= 1000 ? CompenserenAftrekkenTot1000 : CompenserenAftrekken)
          : (blok.niveau >= 1000 ? CompenserenOptellenTot1000  : CompenserenOptellen))
      : null;
    const aanvulModule2 = blok.niveau >= 1000 ? AanvullenTot1000 : AanvullenTot100;
    const module = isAanvullen   ? aanvulModule2 :
                   isCompenseren ? compModule :
                   _getModule(blok.bewerking, blok.niveau);
    if (!module) return false;

    const brugVoorModule = blok.niveau <= 100 ? _brugVoor100(blok.config.brug) : blok.config.brug;
    const nieuweOef = isAanvullen    ? aanvulModule2.genereer({ aantalOefeningen: 5, oefeningstypes: blok.config.oefeningstypes }) :
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
  function getTypes(bewerking, niveau, brug = 'zonder', hulpmiddelen = [], splitsModus = 'tot') {
    if (bewerking === 'herken-brug')  return _getModule(bewerking, niveau)?.getTypes() || [];
    if (bewerking === 'splitsingen')  return Splitsingen.getTypes(null, splitsModus, niveau);
    if (bewerking === 'tafels')       return Tafels.getTypes();

    const isCompenseren = hulpmiddelen.includes('compenseren');
    const isAanvullen   = hulpmiddelen.includes('aanvullen');

    let module;
    if (isCompenseren) {
      module = bewerking === 'aftrekken'
        ? (niveau >= 1000 ? CompenserenAftrekkenTot1000 : CompenserenAftrekken)
        : (niveau >= 1000 ? CompenserenOptellenTot1000  : CompenserenOptellen);
    } else if (isAanvullen) {
      module = niveau >= 1000 ? AanvullenTot1000 : AanvullenTot100;
    } else {
      module = _getModule(bewerking, niveau);
    }
    if (!module) return [];
    const brugVoorModule = niveau <= 100 ? _brugVoor100(brug) : brug;
    return module.getTypes(niveau, brugVoorModule);
  }

  return { maakBlok, voegOefeningToe, getTypes };
})();