export function normalizePreviewCfg(segment) {
  // veilig klonen, zonder bijwerkingen
  const cfg = JSON.parse(
    JSON.stringify(segment?.settings || segment || {})
  );

  // =====================================
  // AANVULLEN → ALLEEN AFTREKKEN
  // =====================================
if (cfg?.rekenHulp?.stijl === 'aanvullen') {
  cfg.rekenType = 'aftrekken';
  cfg.operator = '-';

  // 🔒 Alleen bij TOT 100 afdwingen naar TE-TE
  if (Number(cfg.rekenMaxGetal) === 100) {
    cfg.somTypes = ['TE-TE'];
    cfg._aanvullenMaxVerschil = 9;
  }

  // 🔓 Bij TOT 1000: somTypes UIT UI laten komen
  // (HT-HT of HTE-HTE → generator beslist)
}

  return cfg;
}