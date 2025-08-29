// /pro/guard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";

const firebaseConfig = {
  apiKey: "AIzaSyA1svbzlhdjiiDMyRIgqQq1jSu_F8li3Bw",
  authDomain: "zisa-spelletjesmaker-pro.firebaseapp.com",
  projectId: "zisa-spelletjesmaker-pro",
  storageBucket: "zisa-spelletjesmaker-pro.firebasestorage.app",
  messagingSenderId: "828063957776",
  appId: "1:828063957776:web:8d8686b478846fe980db95",
  measurementId: "G-9LHNLFHSXX"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const fns  = getFunctions(app, "europe-west1");

const deviceId =
  localStorage.getItem("zisa_device_id") ||
  (localStorage.setItem("zisa_device_id", crypto.randomUUID()), localStorage.getItem("zisa_device_id"));

// Robuust pad naar /pro/ (werkt in alle submappen en met/zonder <base>)
function getProRoot(){
  const i = location.pathname.indexOf("/pro/");
  return i >= 0 ? location.pathname.slice(0, i + 5) : "/pro/";
}

// ===== Toegangsbewaking =====
export function guardProPage() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (u) => {
      if (!u) { location.href = getProRoot(); return; }
      try {
        const registerDevice = httpsCallable(fns, "registerDevice");
        const { data } = await registerDevice({ deviceId });
        if (data?.ok) { resolve(true); }
        else { location.href = getProRoot(); }
      } catch {
        location.href = getProRoot();
      }
    });
  });
}

// ===== Uniform uitloggen =====
export function attachLogout(selector = "#btnLogout") {
  const nodes = document.querySelectorAll(selector);
  nodes.forEach((el) => {
    el.addEventListener("click", async () => {
      try { await signOut(auth); } catch {}
      finally { location.replace(getProRoot() + "index.html"); }
    });
  });
}
