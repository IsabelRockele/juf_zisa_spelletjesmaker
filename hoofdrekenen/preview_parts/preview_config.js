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

  // 🔒 Aanvullen = enkel TE-TE
  cfg.somTypes = ['TE-TE'];

  // 🔒 Aanvullen = klein verschil
  cfg._aanvullenMaxVerschil = 9;
}


  return cfg;
}
