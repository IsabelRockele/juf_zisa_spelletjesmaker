/* =========================================================
   TAFELS INZICHTELIJK – GENERATOR (adapter)
   Gebruikt bestaande TI-engine
   ========================================================= */

export function genereerTafelsInzicht(cfg, aantal = 1) {
  if (window.TI && typeof window.TI.genereer === 'function') {
    const lijst = window.TI.genereer({ ...cfg, numOefeningen: aantal });
    return Array.isArray(lijst) ? lijst : [];
  }
  return [];
}

