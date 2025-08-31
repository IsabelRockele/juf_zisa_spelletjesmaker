// pro/js/guard.js
// Centrale PRO-guard voor alle spelpagina's in /pro.
// - Controleert login
// - Registreert stabiele deviceId via Cloud Function registerDevice
// - Checkt licentie (entitlement + vervaldatum) via getAccessStatus
// - Stuurt bij apparaatlimiet meteen naar apparaten.html

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";

// Fallback: als device-id.js niet geladen werd, zorg toch voor een stabiele ID.
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
  storageBucket: "zisa-spelletjesmaker-pro.firebasestorage.app",
  messagingSenderId: "828063957776",
  appId: "1:828063957776:web:8d8686b478846fe980db95",
  measurementId: "G-9LHNLFHSXX"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const fns  = getFunctions(app, "europe-west1");

function goLogin(){ window.location.href = "./index.html"; }
function goApp(reason){
  const q = reason ? ("?reason=" + encodeURIComponent(reason)) : "";
  window.location.href = "./app.html" + q;
}
function goDevices(){ window.location.href = "./apparaten.html"; }
function goKoop(reason){
  const q = reason ? ("?reason=" + encodeURIComponent(reason)) : "";
  window.location.href = "./koop.html" + q;
}

onAuthStateChanged(auth, async (user) => {
  if (!user) { goLogin(); return; }

  try {
    // 1) Apparaat registreren (idempotent)
    const deviceId = window.ZisaDevice.getOrCreateDeviceId();
    const registerDevice = httpsCallable(fns, "registerDevice");
    try {
      const reg = await registerDevice({ deviceId });
      // oudere versies konden {ok:false, reason} teruggeven; hou dit aan boord:
      if (reg?.data && reg.data.ok === false && reg.data.reason === "DEVICE_LIMIT") {
        goDevices(); return;
      }
    } catch (e) {
      // Nieuwere backend gooit HttpsError('resource-exhausted') bij limiet
      if (e && e.code === "resource-exhausted") { goDevices(); return; }
      // andere fouten → naar app met reden
      console.error("registerDevice error:", e);
      goApp("guard_register_error");
      return;
    }

    // 2) Licentie en vervaldatum controleren (callable)
    try {
      const getAccessStatus = httpsCallable(fns, "getAccessStatus");
      const { data: access } = await getAccessStatus({});
      if (!access || access.allowed !== true) {
        // redenen: 'expired', 'no_license', ...
        const reason = access?.reason || "no_access";
        // bij verlopen of geen licentie → naar koop
        goKoop(reason);
        return;
      }

      // 3) Toegang verlenen
      if (typeof window.onProReady === "function") {
        // geef expiresAt (ISO) door indien beschikbaar
        window.onProReady({ user, expiresAt: access.expiresAt || null, max: access.deviceLimit || 2 });
      }
    } catch (e) {
      // Als callable nog niet bestaat (not-found) → backward compatible: laat voorlopig door
      if (e && (e.code === "not-found" || e.message?.includes("function not found"))) {
        console.warn("getAccessStatus niet gevonden; laat voorlopig door");
        if (typeof window.onProReady === "function") window.onProReady({ user, expiresAt: null, max: 2 });
      } else {
        console.error("getAccessStatus error:", e);
        goApp("license_check_error");
      }
    }

  } catch (err) {
    console.error("Guard error:", err);
    goApp("guard_error");
  }
});


