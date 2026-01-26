export function genereerBrugBeideTot1000(cfg) {

  const oefeningen = [];
  const aantal = cfg.numOefeningen || 6;
  const somTypes = cfg.somTypes || [];

  for (let i = 0; i < aantal; i++) {

    // kies een somtype
    const type = somTypes[Math.floor(Math.random() * somTypes.length)];

    let a = 0;
    let b = 0;

    if (type === 'HTE-HTE') {
      a = Math.floor(Math.random() * 900) + 100;
      b = Math.floor(Math.random() * a);
    }

    if (type === 'TE-TE') {
      a = Math.floor(Math.random() * 90 + 10) * 10;
      b = Math.floor(Math.random() * a / 10) * 10;
    }

    oefeningen.push({
  type: 'rekenen',
  getal1: a,
  getal2: b,
  operator: cfg.rekenType === 'aftrekken' ? '-' : '+'
});
  }

  return { oefeningen };
}






