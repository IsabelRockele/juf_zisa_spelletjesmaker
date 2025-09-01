// pro/guard.js — versterkte versie (self-redirect fix + apparaten.html skip + guard=off)

// ====== Noodschakelaar om flitsen te stoppen (debug) =========================
const GUARD_OFF = (() => {
  try {
    const p = new URLSearchParams(location.search);
    return p.get('guard') === 'off' || localStorage.getItem('zisa_guard_off') === '1';
  } catch { return false; }
})();
if (GUARD_OFF) {
  console.warn('[GUARD] Uitgeschakeld via ?guard=off of localStorage');
  // Niets doen: hiermee kunt u rustig Network/Console inspecteren.
}

// ====== Huidige paginanaam & helpers =========================================
const CURRENT_PAGE = (() => {
  const f = (location.pathname.split('/').pop() || '').toLowerCase();
  return f || 'index.html';
})();

// Pagina’s waar de guard NIET hoeft te forceren (login/koop/bedankt kunnen publiek zijn)
const SKIP_PAGES = new Set(['index.html','koop.html','bedankt.html']);

// Veilige redirect: voorkom ‘naar jezelf’ sturen (self-redirect).
function safeGo(to, reason) {
  try {
    const dest = (to.split('/').pop() || '').toLowerCase();
    if (dest === CURRENT_PAGE) {
      console.warn('[GUARD] Self-redirect voorkomen:', to, reason);
      return;
    }
  } catch {}
  const q = reason ? (`?reason=${encodeURIComponent(reason)}`) : '';
  location.href = to + q;
}

// Navigatie
const goLogin   = () => safeGo('./index.html');
const goApp     = (r) => safeGo('./app.html', r);
const goDevices = () => safeGo('./apparaten.html');
const goKoop    = (r) => safeGo('./koop.html', r);

// ====== Uw bestaande Firebase imports/config =================================
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";
import { initializeAppCheck, ReCaptchaV3Provider, getToken as getAppCheckToken } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check.js";

// Stabiele deviceId (ongewijzigd)
(function ensureDeviceId(){
  if (window.ZisaDevice && typeof window.ZisaDevice.getOrCreateDeviceId === "function") return;
  window.ZisaDevice = {
    getOrCreateDeviceId(){
      try {
        let id = localStorage.getItem("zisa_device_id");
        if (!id) {
          const gen = (crypto?.randomUUID?.() || (Math.random().toString(36).slice(2) + Date.now()));
          id = String(gen);
          localStorage.setItem("zisa_device_id", id);
          document.cookie = "zisa_device_id=" + encodeURIComponent(id) + "; Path=/; Max-Age=31536000; SameSite=Lax; Secure";
        }
        return id;
      } catch {
        return "fallback-" + Date.now() + "-" + Math.random().toString(36).slice(2);
      }
    }
  };
})();

const firebaseConfig = {
  apiKey: "AIzaSyA1svbzlhdjiiDMyRIgqQq1jSu_F8li3Bw",
  authDomain: "zisa-spelletjesmaker-pro.firebaseapp.com",
  projectId: "zisa-spelletjesmaker-pro",
  storageBucket: "zisa-spelletjesmaker-pro.appspot.com",
  messagingSenderId: "828063957776",
  appId: "1:828063957776:web:8d8686b478846fe980db95",
  measurementId: "G-9LHNLFHSXX"
};

const app  = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const fns  = getFunctions(app, "europe-west1");

// App Check (uw bestaande site key)
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider("6Lf5e7krAAAAAA1xV5_tz_Xickk-m6BRIMd_BzTO"),
  isTokenAutoRefreshEnabled: true,
});

// ====== Hoofd-guard ===========================================================
if (!GUARD_OFF) {
  onAuthStateChanged(auth, async (user) => {
    // Publieke pagina’s: guard niet forceren
    if (SKIP_PAGES.has(CURRENT_PAGE)) return;

    if (!user) { goLogin(); return; }

    // NB: apparaten.html mag geladen worden om slots te beheren → we doen daar géén registerDevice
    const IS_DEVICES_PAGE = CURRENT_PAGE === 'apparaten.html';

    try {
      // ★ Wacht op App Check + vers ID-token (voorkomt 401/403 op eerste callable)
      await Promise.all([
        getAppCheckToken(appCheck, /* forceRefresh */ false),
        user.getIdToken(true)
      ]);

      // 1) Licentiecontrole eerst
      const getAccessStatus = httpsCallable(fns, "getAccessStatus");
      let status;
      try {
        const res = await getAccessStatus({});
        status = res?.data || {};
      } catch (e) {
        console.error("getAccessStatus error:", e);
        goApp("license_check_error"); return;
      }
      if (!status.allowed) { goKoop(status?.reason || "no_access"); return; }

      // 2) Alleen registreren op NIET-apparatenpagina's
      if (!IS_DEVICES_PAGE) {
        const deviceId = window.ZisaDevice.getOrCreateDeviceId();
        const registerDevice = httpsCallable(fns, "registerDevice");
        try {
          await registerDevice({ deviceId });
        } catch (e) {
          if (e?.code === "resource-exhausted") { goDevices(); return; }
          console.error("registerDevice error:", e);
          goApp("device_register_error"); return;
        }
      } else {
        console.info('[GUARD] apparaten.html: registratie overgeslagen (bewust).');
      }

      // 3) Klaar voor PRO
      if (typeof window.onProReady === "function") {
        window.onProReady({
          user,
          expiresAt: status.expiresAt,
          limit: status.deviceLimit ?? 2
        });
      }
    } catch (err) {
      console.error("Guard error:", err);
      goApp("guard_error");
    }
  });
}

