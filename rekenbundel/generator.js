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
      config: { bewerking, oefeningstypes, brug, aantalOefeningen, hulpmiddelen, splitspositie, aanvullenVariant, compenserenVariant, schrijflijnenAantal, metVoorbeeld, splitsVariant, splitsGetallen, splitsModus, tafels, tafelPositie, tafelMax },
      oefeningen,
    };
  }

  /* ── Voeg één extra oefening toe aan een bestaand blok ───── */
  function voegOefeningToe(blok) {
    // Rekentaal: gebruik RekentaalGenerator
    if (blok.bewerking === 'rekentaal') {
      if (!window.RekentaalGenerator) return false;
      const cfg = blok.config || {};
      const nieuweOef = RekentaalGenerator.genereer({
        categorieën:      cfg.categorieën || {},
        niveau:           cfg.niveau || 20,
        brug:             cfg.brug || 'zonder',
        tafels:           cfg.tafels || [2],
        dhkMax:           cfg.dhkMax || 20,
        tafelPositie:     cfg.tafelPositie || 'vooraan',
        aantalOefeningen: 1,
      });
      if (nieuweOef && nieuweOef.length > 0) {
        blok.oefeningen.push(nieuweOef[0]);
        return true;
      }
      return false;
    }

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

  /* ── Maak een gemengd optellen+aftrekken blok ───────────── */
  function maakGemengdBlok({ niveau, brug, typesOpt, typesAft, aantalOefeningen, opdrachtzin, verhouding = '50-50', hulpmiddelen = [], schrijflijnenAantal = 2, splitspositie = 'aftrekker' }) {
    const brugVoorModule = niveau <= 100 ? _brugVoor100(brug) : brug;

    const modOpt = niveau <= 20  ? OptellenTot20  :
                   niveau <= 100 ? OptellenTot100 : OptellenTot1000;
    const modAft = niveau <= 20  ? AftrekkenTot20  :
                   niveau <= 100 ? AftrekkenTot100 : AftrekkenTot1000;

    if (!modOpt || !modAft) return null;

    // Bereken aantal opt/aft op basis van verhouding
    let aantalOpt, aantalAft;
    if (verhouding === 'meer-opt') {
      aantalOpt = Math.ceil(aantalOefeningen * 0.67);
      aantalAft = aantalOefeningen - aantalOpt;
    } else if (verhouding === 'meer-aft') {
      aantalAft = Math.ceil(aantalOefeningen * 0.67);
      aantalOpt = aantalOefeningen - aantalAft;
    } else {
      aantalOpt = Math.ceil(aantalOefeningen / 2);
      aantalAft = aantalOefeningen - aantalOpt;
    }

    // Genereer met extra buffer zodat shuffle genoeg unieke oefeningen heeft
    const bufferOpt = modOpt.genereer({ niveau, oefeningstypes: typesOpt, brug: brugVoorModule, aantalOefeningen: aantalOpt * 2 });
    const bufferAft = modAft.genereer({ niveau, oefeningstypes: typesAft, brug: brugVoorModule, aantalOefeningen: aantalAft * 2 });

    if (!bufferOpt?.length || !bufferAft?.length) return null;

    // Pak het gewenste aantal uit elke pool
    const oefOpt = bufferOpt.slice(0, aantalOpt);
    const oefAft = bufferAft.slice(0, aantalAft);

    // Shuffle samen
    const alle = [...oefOpt, ...oefAft];
    for (let i = alle.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [alle[i], alle[j]] = [alle[j], alle[i]];
    }

    if (alle.length < 2) return null;

    _teller++;
    return {
      id:          `blok-gemengd-${Date.now()}-${_teller}`,
      bewerking:   'gemengd',
      subtype:     `gemengd-tot${niveau}`,
      niveau,
      brug,
      opdrachtzin: opdrachtzin || 'Kijk goed naar het teken. Reken uit.',
      hulpmiddelen,
      schrijflijnenAantal,
      splitspositie,
      config: { niveau, brug, typesOpt, typesAft, aantalOefeningen, verhouding, hulpmiddelen, schrijflijnenAantal, splitspositie },
      oefeningen:  alle,
    };
  }

  return { maakBlok, maakGemengdBlok, voegOefeningToe, getTypes };
})();