import { genereerTot20_V2 } from './hoofdrekenen_tot20.generator.js';
import { genereerTot5_V2 } from './hoofdrekenen_tot5.generator.js';
import { genereerTot10_V2 } from './hoofdrekenen_tot10.generator.js';
import { genereerTot100_V2 } from './hoofdrekenen_tot100.generator.js';

// =====================================================
// HOOFDREKENEN – GENERATOR VERSIE 2
// Structuur eerst, logica per bereik apart
// =====================================================

export function genereerHoofdrekenenV2(cfg) {
  if (!cfg || !cfg.rekenMaxGetal) {
    console.error('Versie 2: geen rekenMaxGetal opgegeven');
    return [];
  }

  switch (cfg.rekenMaxGetal) {
    case 5:
      return genereerTot5_V2(cfg);

    case 10:
      return genereerTot10_V2(cfg);

    case 20:
      return genereerTot20_V2(cfg);

    case 100:
      return genereerTot100_V2(cfg);

    default:
      console.error('Versie 2: bereik niet ondersteund', cfg.rekenMaxGetal);
      return [];
  }
}


