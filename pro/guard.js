// pro/js/guard.js — stabiele PRO-guard
// - eerst licentie controleren, dan pas registreren
// - GEEN registratie op apparaten.html
// - herkent DEVICE_LIMIT (429/resource-exhausted) en stuurt naar apparaten.html
// - safeGo voorkomt self-redirects
// - lokale ontwikkelmodus kan de guard tijdelijk uitschakelen; online nooit

const IS_LOCAL_PREVIEW = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
const GUARD_OFF = (() => {
  try {
    const p = new URLSearchParams(location.search);
    const gevraagd = p.get("guard") === "off" || localStorage.getItem("zisa_guard_off") === "1";
    return IS_LOCAL_PREVIEW && gevraagd;
  } catch { return false; }
})();
if (GUARD_OFF) {
  console.warn("[GUARD] UIT: ?guard=off of localStorage");
}

const PRO_PATH_INFO = (() => {
  const pad = location.pathname.replace(/\/{2,}/g, "/");
  const marker = "/pro/";
  const index = pad.toLowerCase().indexOf(marker);
  const basis = index >= 0 ? pad.slice(0, index + marker.length) : "/pro/";
  const relatief = index >= 0 ? pad.slice(index + marker.length) : pad.split("/").pop();
  return {
    basis,
    relatief: (relatief || "index.html").replace(/^\/+/, "").toLowerCase()
  };
})();
const CURRENT_PAGE = PRO_PATH_INFO.relatief.split("/").pop() || "index.html";
const PUBLIC_PATHS = new Set(["index.html", "koop.html", "bedankt.html", "maand.html", "verlopen.html"]);
const IS_PUBLIC_PAGE = PUBLIC_PATHS.has(PRO_PATH_INFO.relatief);

function proUrl(bestand) {
  return new URL(PRO_PATH_INFO.basis + bestand.replace(/^\.\//, ""), location.origin).href;
}

function safeGo(to, reason) {
  try {
    const target = new URL(to, location.origin);
    if (target.pathname === location.pathname) {
      console.warn("[GUARD] Self-redirect voorkomen:", to, reason);
      return;
    }
    if (reason) target.searchParams.set("reason", reason);
    location.href = target.href;
    return;
  } catch {}
  location.href = to;
}
function safeGoWithUntil(to, reason, untilIso) {
  try {
    const target = new URL(to, location.origin);
    if (target.pathname === location.pathname) {
      console.warn("[GUARD] Self-redirect voorkomen:", to, reason);
      return;
    }
    if (reason) target.searchParams.set("reason", reason);
    if (untilIso) target.searchParams.set("until", untilIso);
    location.href = target.href;
    return;
  } catch {}
  location.href = to;
}
const goLogin    = () => safeGo(proUrl("index.html"));
const goApp      = (r) => safeGo(proUrl("app.html"), r);
const goDevices  = () => safeGo(proUrl("apparaten.html"));
const goKoop     = (r) => safeGo(proUrl("koop.html"), r);
const goVerlopen = (r, until) => safeGoWithUntil(proUrl("verlopen.html"), r, until);

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, onIdTokenChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";
import { initializeAppCheck, ReCaptchaV3Provider, getToken as getAppCheckToken } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check.js";

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

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider("6Lf5e7krAAAAAA1xV5_tz_Xickk-m6BRIMd_BzTO"),
  isTokenAutoRefreshEnabled: true,
});

if (!GUARD_OFF) {
  onAuthStateChanged(auth, async (user) => {
    if (IS_PUBLIC_PAGE) return;

    if (!user) { goLogin(); return; }

    // ✅ Nieuw: ingelogde user maar URL staat op resetPassword → meteen naar app
    const mode = new URLSearchParams(location.search).get("mode");
    if (mode === "resetPassword") {
      console.warn("[GUARD] User ingelogd maar op resetPassword, stuur door naar app.");
      goApp();
      return;
    }

    const IS_DEVICES_PAGE = PRO_PATH_INFO.relatief === "apparaten.html";

    try {
      await Promise.all([
        getAppCheckToken(appCheck, /*forceRefresh*/ false),
        user.getIdToken(true)
      ]);

      const getAccessStatus = httpsCallable(fns, "getAccessStatus");
      let status;
      try {
        const res = await getAccessStatus({});
        status = res?.data || {};
      } catch (e) {
        console.error("getAccessStatus error:", e);
        goLogin(); return;
      }
      if (!status.allowed) { goVerlopen(status?.reason || "no_access", status?.expiresAt); return; }

      if (!IS_DEVICES_PAGE) {
        const deviceId = window.ZisaDevice.getOrCreateDeviceId();
        const registerDevice = httpsCallable(fns, "registerDevice");
        try {
          await registerDevice({ deviceId });
        } catch (e) {
          console.error("registerDevice error:", e);
          const msg = (e && (e.details || e.code || e.message || "")).toString();
          const limitHit =
            msg.includes("DEVICE_LIMIT") ||
            msg.includes("resource-exhausted") ||
            msg.includes("429");
          if (limitHit) { goDevices(); return; }
          goLogin(); return;
        }
      } else {
        console.info("[GUARD] apparaten.html: registratie overgeslagen (bewust).");
      }

      if (typeof window.onProReady === "function") {
        window.onProReady({
          user,
          expiresAt: status.expiresAt,
          limit: status.deviceLimit ?? 2
        });
      }
    } catch (err) {
      console.error("Guard error:", err);
      goLogin();
    }
  });

  // ✅ Nieuw: extra vangnet – als token vervalt, stuur naar login
  onIdTokenChanged(auth, (user) => {
    if (!user && !IS_PUBLIC_PAGE) {
      console.warn("[GUARD] Sessie verlopen → terug naar login");
      goLogin();
    }
  });
}
