/* Gedeelde configuratie voor Bundel Bewerkingen en Dagelijkse Kost. */
window.RekenbundelConfig = (() => {
  const bereiken = [5, 10, 20, 100, 1000, 10000];
  const brugHoofdOpties = [
    { value: 'zonder', label: 'Zonder brug' },
    { value: 'met', label: 'Met brug' },
    { value: 'beide', label: 'Beide' }
  ];
  const brugSubOpties = [
    { value: 'naar-tiental', label: 'Naar het tiental' },
    { value: 'naar-honderdtal', label: 'Naar het honderdtal' },
    { value: 'beide', label: 'Beide soorten' }
  ];
  const splitsPosities = [
    { value: 'aftrekker', label: 'Onder de aftrekker', voorbeeld: '12 − 6: onder 6' },
    { value: 'aftrektal', label: 'Onder het aftrektal', voorbeeld: '12 − 6: onder 12' }
  ];
  const strategieen10000 = [
    { value: 'aftrekker', label: 'Via de aftrekker' },
    { value: 'aftrektal', label: 'Via het aftrektal' },
    { value: 'rekenfeiten', label: 'Via rekenfeiten' }
  ];
  const hulpOpties = [
    { value: 'splitsbeen', label: 'Splitsbenen' },
    { value: 'schrijflijnen', label: 'Schrijflijnen' },
    { value: 'aanvullen', label: 'Aanvullen' },
    { value: 'compenseren', label: 'Compenseren' },
    { value: 'transformeren', label: 'Transformeren' }
  ];

  function beschikbareHulp(config) {
    const niveau = Number(config.niveau);
    const brug = effectieveBrug(config);
    if (niveau < 20) return [];
    if (brug === 'zonder') return niveau === 1000 ? hulpOpties.slice(0, 2) : [];
    const opties = hulpOpties.slice(0, 2);
    if (niveau === 100 || niveau >= 1000) opties.push(...hulpOpties.slice(2));
    return opties;
  }

  function effectieveBrug(config) {
    const niveau = Number(config.niveau);
    const hoofd = config.brugHoofd || 'zonder';
    if (niveau <= 10) return 'zonder';
    if (hoofd === 'zonder') return 'zonder';
    if (hoofd === 'beide') return 'gemengd';
    if (niveau <= 100) return 'met';
    if (niveau < 10000) return config.brugSub || 'naar-tiental';
    return 'met';
  }

  function beschikbareTypes(config) {
    if (!window.DKRekenGenerator) return [];
    return window.DKRekenGenerator.getTypes(
      config.bewerking || 'optellen',
      Number(config.niveau || 20),
      effectieveBrug(config),
      config.hulpmiddelen || []
    );
  }

  function normaliseer(input = {}) {
    const config = {
      bewerking: input.bewerking === 'aftrekken' ? 'aftrekken' : 'optellen',
      niveau: bereiken.includes(Number(input.niveau)) ? Number(input.niveau) : 20,
      brugHoofd: ['zonder','met','beide'].includes(input.brugHoofd) ? input.brugHoofd : 'zonder',
      brugSub: ['naar-tiental','naar-honderdtal','beide'].includes(input.brugSub) ? input.brugSub : 'naar-tiental',
      strategie: ['aftrekker','aftrektal','rekenfeiten'].includes(input.strategie) ? input.strategie : 'aftrekker',
      oefeningstypes: Array.isArray(input.oefeningstypes) ? [...input.oefeningstypes] : [],
      hulpmiddelen: Array.isArray(input.hulpmiddelen) ? [...input.hulpmiddelen] : [],
      splitspositie: input.splitspositie === 'aftrektal' ? 'aftrektal' : 'aftrekker',
      schrijflijnenAantal: input.schrijflijnenAantal === 3 ? 3 : 2,
      metVoorbeeld: input.metVoorbeeld === true,
      aanvullenVariant: input.aanvullenVariant || 'zonder-schema',
      compenserenVariant: input.compenserenVariant || 'met-tekens',
      transformerenVariant: input.transformerenVariant || 'schema'
    };
    const toegestaneHulp = beschikbareHulp(config).map(o => o.value);
    config.hulpmiddelen = config.hulpmiddelen.filter(h => toegestaneHulp.includes(h));
    const rekenwijzen = ['aanvullen','compenseren','transformeren'];
    const gekozenRekenwijze = rekenwijzen.find(h => config.hulpmiddelen.includes(h));
    if (gekozenRekenwijze) config.hulpmiddelen = config.hulpmiddelen.filter(h => !rekenwijzen.includes(h) || h === gekozenRekenwijze);
    const beschikbaar = beschikbareTypes(config);
    config.oefeningstypes = config.oefeningstypes.filter(t => beschikbaar.includes(t));
    if (!config.oefeningstypes.length && beschikbaar.length) config.oefeningstypes = [beschikbaar.includes('Gemengd') ? 'Gemengd' : beschikbaar[0]];
    return config;
  }

  return { bereiken, brugHoofdOpties, brugSubOpties, splitsPosities, strategieen10000, hulpOpties, beschikbareHulp, effectieveBrug, beschikbareTypes, normaliseer };
})();
