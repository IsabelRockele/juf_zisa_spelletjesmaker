// pro/js/guard.js
// Centrale PRO-guard:
// - wacht op login
// - initialiseert App Check met reCAPTCHA v3 (SITE KEY)
// - WACHT op App Check token + VERS ID-TOKEN
// - checkt licentie (eerst) en registreert pas daarna het device
// - roept window.onProReady(...) met { user, expiresAt, limit }

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";
import { initializeAppCheck, ReCaptchaV3Provider, getToken as getAppCheckToken } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check.js";

// --- Stabiele deviceId -------------------------------------------------------
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
  storageBucket: "zisa-spelletjesmaker-pro.appspot.com",
  messagingSenderId: "828063957776",
  appId: "1:828063957776:web:8d8686b478846fe980db95",
  measurementId: "G-9LHNLFHSXX"
};

const app  = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const fns  = getFunctions(app, "europe-west1");

// --- App Check (plaats hier uw reCAPTCHA v3 SITE KEY) ------------------------
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider("6Lf5e7krAAAAAA1xV5_tz_Xickk-m6BRIMd_BzTO"),
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
    // ★★ CRUCIAAL: Wacht expliciet op App Check + VERS ID-TOKEN ★★
    await Promise.all([
      getAppCheckToken(appCheck, /* forceRefresh */ false),
      user.getIdToken(true) // forceer vers ID-token -> voorkomt 401 op eerste callable
    ]);

    // 1) EERST licentie/status controleren
    const getAccessStatus = httpsCallable(fns, "getAccessStatus");
    let status;
    try {
      const res  = await getAccessStatus({});
      status = res?.data || {};
    } catch (e) {
      console.error("getAccessStatus error:", e);
      goApp("license_check_error"); return;
    }

    if (!status.allowed) {
      // redenen: "no_license", "expired", ...
      goKoop(status?.reason || "no_access");
      return;
    }

    // 2) Pas DAN toestel registreren (idempotent in backend)
    const deviceId = window.ZisaDevice.getOrCreateDeviceId();
    const registerDevice = httpsCallable(fns, "registerDevice");
    try {
      await registerDevice({ deviceId });
    } catch (e) {
      if (e?.code === "resource-exhausted") { goDevices(); return; }
      console.error("registerDevice error:", e);
      goApp("device_register_error"); return;
    }

    // 3) Klaar voor PRO: pagina-specifieke init laten starten
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
