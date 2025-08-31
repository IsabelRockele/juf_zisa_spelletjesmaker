// pro/js/guard.js
// Centrale PRO-guard voor alle spelpagina's in /pro.
// - Controleert login
// - Registreert stabiele deviceId via Cloud Function registerDevice
// - Verleent toegang of stuurt door (bij apparaatlimiet meteen naar apparaten.html)

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

onAuthStateChanged(auth, async (user) => {
  if (!user) { goLogin(); return; }

  try {
    const deviceId = window.ZisaDevice.getOrCreateDeviceId();
    const registerDevice = httpsCallable(fns, "registerDevice");
    const { data } = await registerDevice({ deviceId });

    if (!data?.ok) {
      // ✅ Nieuw: bij apparaatlimiet meteen naar beheerpagina leiden
      if (data.reason === "DEVICE_LIMIT") {
        window.location.href = "./apparaten.html";
        return;
      }
      // Voor alle andere redenen naar app.html met reden
      goApp(data?.reason || "unknown");
      return;
    }

    // ✅ Toegang verlenen: pagina mag starten.
    if (typeof window.onProReady === "function") {
      window.onProReady({ user, expiresAt: data.expiresAt, max: data.max ?? 2 });
    }

  } catch (err) {
    console.error("Guard error:", err);
    goApp("guard_error");
  }
});

