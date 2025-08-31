// pro/js/guard.js
// Centrale PRO-guard voor /pro/* pagina’s.
// - Controleert login
// - Initieert App Check (v3)
// - Registreert stabiele deviceId via callable registerDevice
// - Checkt licentie via getAccessStatus
// - Stuurt bij limiet naar apparaten.html, zonder licentie naar koop.html

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check.js";

// --- Stabiele deviceId (fallback als device-id.js ontbreekt) -----------------
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

// --- Firebase config ----------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyA1svbzlhdjiiDMyRIgqQq1jSu_F8li3Bw",
  authDomain: "zisa-spelletjesmaker-pro.firebaseapp.com",
  projectId: "zisa-spelletjesmaker-pro",
  storageBucket: "zisa-spelletjesmaker-pro.firebasestorage.app",
  messagingSenderId: "828063957776",
  appId: "1:828063957776:web:8d8686b478846fe980db95",
  measurementId: "G-9LHNLFHSXX"
};

const app  = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const fns  = getFunctions(app, "europe-west1");

// --- App Check (verplicht voor callables met enforceAppCheck: true) -----------
// VERVANG HIERONDER door jouw reCAPTCHA v3 site key uit Firebase App Check.
initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider("6Lf5e7krAAAAANpJ4drwF380rsbSr4WlsuOtYMnT"),
  isTokenAutoRefreshEnabled: true,
});

// --- Navigatie helpers --------------------------------------------------------
function go(path, reason){
  const q = reason ? ("?reason=" + encodeURIComponent(reason)) : "";
  window.location.href = path + q;
}
const goLogin    = () => go("./index.html");
const goApp      = (r) => go("./app.html", r);
const goDevices  = () => go("./apparaten.html");
const goKoop     = (r) => go("./koop.html", r);

// --- Guard -------------------------------------------------------------------
onAuthStateChanged(auth, async (user) => {
  if (!user) { goLogin(); return; }

  try {
    // 1) Apparaat registreren (idempotent in backend)
    const deviceId = window.ZisaDevice.getOrCreateDeviceId();
    const registerDevice = httpsCallable(fns, "registerDevice");
    try {
      await registerDevice({ deviceId });
    } catch (e) {
      // Bij limiet gooit backend 'resource-exhausted'
      if (e?.code === "resource-exhausted") { goDevices(); return; }
      console.error("registerDevice error:", e);
      goApp("device_register_error"); return;
    }

    // 2) PRO-status ophalen
    const getAccessStatus = httpsCallable(fns, "getAccessStatus");
    try {
      const res  = await getAccessStatus({});
      const data = res?.data || {};
      if (data.allowed) {
        // Laat de pagina weten dat alles ok is
        if (typeof window.onProReady === "function") {
          window.onProReady({ user, expiresAt: data.expiresAt, limit: data.deviceLimit ?? 2 });
        }
        return;
      }
      // Niet toegestaan → naar koop
      goKoop(data?.reason || "no_access");
      return;
    } catch (e) {
      console.error("getAccessStatus error:", e);
      goApp("license_check_error"); return;
    }
  } catch (err) {
    console.error("Guard error:", err);
    goApp("guard_error");
  }
});



