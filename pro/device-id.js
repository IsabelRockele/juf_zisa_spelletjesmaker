// /pro/js/device-id.js
//
// Robuuste versie: bewaart device-id in zowel localStorage als cookie.
// Als één van beide gewist wordt (bv. door browser cleanup, privacy-tools,
// "cookies wissen bij afsluiten"), kunnen we de id herstellen vanuit de
// andere bron. Dit voorkomt dat dezelfde computer als "nieuw toestel"
// herkend wordt en daardoor de toestel-limiet bereikt.

(function () {
  window.ZisaDevice = window.ZisaDevice || {};
  if (typeof window.ZisaDevice.getOrCreateDeviceId === 'function') return;

  const STORAGE_KEY = 'zisa_device_id';
  const COOKIE_NAME = 'zisa_device_id';
  const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2; // 2 jaar

  function readCookie(name) {
    try {
      const match = document.cookie.match(
        new RegExp('(?:^|; )' + name.replace(/[.$?*|{}()[\]\\\/+^]/g, '\\$&') + '=([^;]*)')
      );
      return match ? decodeURIComponent(match[1]) : null;
    } catch (e) {
      return null;
    }
  }

  function writeCookie(name, value) {
    try {
      document.cookie = name + '=' + encodeURIComponent(value)
        + '; Path=/; Max-Age=' + COOKIE_MAX_AGE
        + '; SameSite=Lax; Secure';
    } catch (e) {
      // stilletjes negeren — we hebben localStorage nog
    }
  }

  function readLocalStorage(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function writeLocalStorage(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // stilletjes negeren — we hebben de cookie nog
    }
  }

  function generateId() {
    try {
      if (crypto && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
    } catch (e) { /* fall through */ }
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  window.ZisaDevice.getOrCreateDeviceId = function () {
    try {
      // Stap 1: probeer localStorage
      let id = readLocalStorage(STORAGE_KEY);
      const fromLS = !!id;

      // Stap 2: als niet in localStorage, probeer cookie
      if (!id) {
        id = readCookie(COOKIE_NAME);
      }

      // Stap 3: als nergens gevonden, genereer nieuwe
      if (!id) {
        id = String(generateId());
      }

      // Stap 4: synchroniseer beide bronnen (self-healing)
      // Zo herstelt elke gemiste opslag bij de volgende paginalaad.
      if (!fromLS) {
        writeLocalStorage(STORAGE_KEY, id);
      }
      writeCookie(COOKIE_NAME, id);

      return id;
    } catch (e) {
      // Absolute laatste redmiddel
      return 'fallback-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    }
  };
})();