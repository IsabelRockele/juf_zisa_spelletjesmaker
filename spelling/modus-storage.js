/* ==========================================================
   modus-storage.js
   
   Wrapper rond localStorage die alle keys namespacet per modus
   (werkblad vs herhaling). Zo zijn werkblad-modus en herhalings-
   modus volledig gescheiden werelden.
   
   Gebruik: window.SpellingModusStorage.getItem("spelling-foo")
   → leest "spelling-foo-werkblad" of "spelling-foo-herhaling"
     afhankelijk van actieve modus.
   
   Voor backwards-compatibility: bij eerste gebruik checken we of
   er een oude (niet-genamespacede) key bestaat — die migreren we
   naar werkblad-namespace (de "oude" mode).
   ========================================================== */

window.SpellingModusStorage = (function() {

  const MODUS_KEYS = ["werkblad", "herhaling"];
  const MIGRATIE_VLAG = "spelling-modus-storage-migrated-v1";
  
  /* Lees actieve modus uit DOM (modus.js zet body-class).
     Fallback: werkblad. */
  function getActieveModus() {
    const body = document.body;
    if (body?.classList.contains("modus-actief-herhaling")) return "herhaling";
    // Default: werkblad
    return "werkblad";
  }
  
  function _namespacedKey(key, modus) {
    return `${key}::${modus || getActieveModus()}`;
  }
  
  /* Migreer oude (niet-genamespacede) keys naar werkblad-namespace.
     Wordt 1x uitgevoerd. */
  function _migreerOudeKeys() {
    try {
      if (localStorage.getItem(MIGRATIE_VLAG) === "done") return;
      
      // Lijst van keys die gemigreerd moeten worden naar werkblad-namespace
      const teMigreren = [
        "spelling-gekozen-woorden-v3",
        "spelling-zijbalk-cats-v1",
        "spelling-zijbalk-oefenvormen-v1",
        "spelling-zijbalk-actieve-graad-v1",
        "spelling-globaal-lijntype-v1",
        "spelling-globaal-lijnhoogte-v1",
        "spelling-ov04-kleuren-v1"
      ];
      
      for (const key of teMigreren) {
        const oud = localStorage.getItem(key);
        if (oud !== null) {
          // Verplaats naar werkblad-namespace
          const nieuweKey = _namespacedKey(key, "werkblad");
          if (localStorage.getItem(nieuweKey) === null) {
            // Alleen migreren als nieuwe key nog niet bestaat (anders overschrijven we)
            localStorage.setItem(nieuweKey, oud);
          }
          // Oude key laten staan voor andere modules die het misschien nog lezen
          // (zal wel verouderd raken — kan later weg)
        }
      }
      
      localStorage.setItem(MIGRATIE_VLAG, "done");
    } catch (e) {
      console.warn("Kon oude keys niet migreren:", e);
    }
  }
  
  // Migreer eenmalig
  _migreerOudeKeys();
  
  function getItem(key, modus) {
    return localStorage.getItem(_namespacedKey(key, modus));
  }
  
  function setItem(key, value, modus) {
    try {
      localStorage.setItem(_namespacedKey(key, modus), value);
    } catch (e) {
      console.warn("Kon item niet opslaan:", e);
    }
  }
  
  function removeItem(key, modus) {
    try {
      localStorage.removeItem(_namespacedKey(key, modus));
    } catch (e) {}
  }
  
  /* Wis ALLE keys voor één modus.
     Handig voor "Nieuwe bundel starten". */
  function wisModus(modus) {
    if (!MODUS_KEYS.includes(modus)) return;
    try {
      const teVerwijderen = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.endsWith("::" + modus)) {
          teVerwijderen.push(k);
        }
      }
      teVerwijderen.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.warn("Kon modus niet wissen:", e);
    }
  }
  
  /* Check of er voor een modus al data is opgeslagen.
     Handig voor "Vorige sessie hervatten?"-vraag. */
  function heeftData(modus) {
    if (!MODUS_KEYS.includes(modus)) return false;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.endsWith("::" + modus)) return true;
      }
    } catch (e) {}
    return false;
  }
  
  return {
    getActieveModus,
    getItem,
    setItem,
    removeItem,
    wisModus,
    heeftData
  };

})();
