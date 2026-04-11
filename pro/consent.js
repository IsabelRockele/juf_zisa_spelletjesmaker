// ============================================================
//  consent.js  –  AVG Toestemmingsbeheer
//  Juf Zisa's Spelgenerator PRO
//  Versie: 1.0
// ============================================================

import { getApps, getApp }   from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp }
                             from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const CONSENT_VERSION = "1.0";
const PRIVACY_URL     = "./privacy.html";

let _consentNodig = false;
let _consentUser  = null;
let _consentRef   = null;

async function getFirebaseApp() {
  let pogingen = 0;
  while (getApps().length === 0 && pogingen < 50) {
    await new Promise(r => setTimeout(r, 100));
    pogingen++;
  }
  return getApp();
}

// ── Blokkeer-overlay helpers ──────────────────────────────────
function toonBlokkeer() {
  const el = document.getElementById("klas-blokkeer");
  if (el) el.classList.add("actief");
}

function verbergBlokkeer() {
  const el = document.getElementById("klas-blokkeer");
  if (el) el.classList.remove("actief");
}

// ── Hoofdfunctie ─────────────────────────────────────────────
export async function checkAndShowConsent(user) {
  const app = await getFirebaseApp();
  const db  = getFirestore(app);
  const consentRef = doc(db, "users", user.uid, "consent", "avg");

  try {
    const snap = await getDoc(consentRef);
    if (snap.exists() && snap.data().version === CONSENT_VERSION) {
      // Consent al gegeven — blokkeer verbergen
      _consentNodig = false;
      _consentUser  = null;
      _consentRef   = null;
      verbergBlokkeer();
      return;
    }
  } catch (err) {
    console.warn("[consent.js] Kan consent niet lezen, pop-up tonen als fallback.", err);
  }

  // Consent nog niet gegeven — blokkeer tonen en popup
  _consentNodig = true;
  _consentUser  = user;
  _consentRef   = consentRef;
  toonBlokkeer();
  toonConsentPopup(user, consentRef);
}

// ── Heropen popup bij terugkeer van ander tabblad ─────────────
document.addEventListener("visibilitychange", function () {
  if (document.visibilityState === "visible" && _consentNodig) {
    if (!document.getElementById("zisa-consent-overlay")) {
      toonConsentPopup(_consentUser, _consentRef);
    }
  }
});

// ── Pop-up opbouwen ───────────────────────────────────────────
function toonConsentPopup(user, consentRef) {
  document.getElementById("zisa-consent-overlay")?.remove();

  const overlay = document.createElement("div");
  overlay.id = "zisa-consent-overlay";

  overlay.innerHTML = `
    <div id="zisa-consent-modal" role="dialog" aria-modal="true" aria-labelledby="zisa-consent-titel">

      <div id="zisa-consent-header">
        <span id="zisa-consent-slotje">🔒</span>
        <h2 id="zisa-consent-titel">Even een momentje</h2>
        <p id="zisa-consent-subtitel">
          Klasmanagement slaat gegevens op in de cloud.<br>
          Lees even hoe we daarmee omgaan.
        </p>
      </div>

      <div id="zisa-consent-body">

        <div class="zisa-consent-blokken">
          <div class="zisa-consent-blok">
            <span class="zisa-consent-blok-icon">👤</span>
            <div>
              <strong>Jij beheert jouw data</strong>
              <p>Enkel jij hebt toegang tot de gegevens die jij invoert. Andere gebruikers kunnen die nooit zien.</p>
            </div>
          </div>
          <div class="zisa-consent-blok">
            <span class="zisa-consent-blok-icon">🇪🇺</span>
            <div>
              <strong>Veilig opgeslagen in Europa</strong>
              <p>Gegevens worden versleuteld bewaard via Google Firebase (EU-regio België).</p>
            </div>
          </div>
          <div class="zisa-consent-blok">
            <span class="zisa-consent-blok-icon">🗑️</span>
            <div>
              <strong>Jij blijft in controle</strong>
              <p>Je kan je gegevens altijd laten verwijderen via <a href="mailto:info@jufzisa.be">info@jufzisa.be</a>.</p>
            </div>
          </div>
        </div>

        <a href="${PRIVACY_URL}" id="zisa-consent-link">
          📄 Lees de volledige privacyverklaring (opent in nieuw venster)
        </a>

        <label id="zisa-consent-vinkje-rij" for="zisa-consent-vinkje">
          <input type="checkbox" id="zisa-consent-vinkje" />
          <span>Ik heb dit gelezen en ga akkoord.</span>
        </label>

        <p id="zisa-consent-fout" style="display:none;">
          ⚠️ Vink het vakje aan om verder te gaan.
        </p>

      </div>

      <div id="zisa-consent-footer">
        <span id="zisa-consent-versie">Privacyverklaring v${CONSENT_VERSION} · jufzisa.be</span>
        <div style="display:flex;gap:10px;">
          <button id="zisa-consent-niet-nu" type="button">Niet nu</button>
          <button id="zisa-consent-knop" type="button">Doorgaan →</button>
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  document.getElementById("zisa-consent-link").addEventListener("click", function (e) {
    e.preventDefault();
    window.open(PRIVACY_URL, "zisa-privacy",
      "width=900,height=700,scrollbars=yes,resizable=yes");
  });

  // "Niet nu" — sluit popup en ga terug naar vorige categorie
  document.getElementById("zisa-consent-niet-nu").addEventListener("click", () => {
    // Popup sluiten
    overlay.remove();
    document.body.style.overflow = "";
    // Blokkeer verbergen
    verbergBlokkeer();
    // State resetten zodat popup opnieuw verschijnt bij volgende klik
    _consentNodig = false;
    _consentUser  = null;
    _consentRef   = null;
    // Terug naar vorige categorie (of reken als er geen vorige was)
    const vorige = window._vorigCategorie || "reken";
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    const btn = document.querySelector(`.nav-btn[data-target="${vorige}"]`);
    if (btn) btn.classList.add("active");
    document.querySelectorAll(".section-panel").forEach(p => p.classList.remove("active"));
    const panel = document.getElementById("panel-" + vorige);
    if (panel) panel.classList.add("active");
    // Sla vorige categorie terug op in localStorage
    localStorage.setItem("laatsteCategorie", vorige);
  });

  document.getElementById("zisa-consent-knop").addEventListener("click", () => {
    const vinkje  = document.getElementById("zisa-consent-vinkje");
    const foutMsg = document.getElementById("zisa-consent-fout");
    if (!vinkje.checked) {
      foutMsg.style.display = "block";
      vinkje.focus();
      return;
    }
    foutMsg.style.display = "none";
    slaConsentOp(user, consentRef, overlay);
  });
}

// ── Akkoord opslaan ───────────────────────────────────────────
async function slaConsentOp(user, consentRef, overlay) {
  const knop = document.getElementById("zisa-consent-knop");
  knop.disabled = true;
  knop.textContent = "Opslaan…";

  try {
    await setDoc(consentRef, {
      accepted:  true,
      version:   CONSENT_VERSION,
      timestamp: serverTimestamp(),
      email:     user.email || "",
      uid:       user.uid
    });

    _consentNodig = false;
    _consentUser  = null;
    _consentRef   = null;

    verbergBlokkeer();
    overlay.remove();
    document.body.style.overflow = "";

  } catch (err) {
    console.error("[consent.js] Fout bij opslaan:", err);
    knop.disabled = false;
    knop.textContent = "Doorgaan →";
    const foutMsg = document.getElementById("zisa-consent-fout");
    foutMsg.textContent = "⚠️ Er ging iets mis. Controleer je verbinding en probeer opnieuw.";
    foutMsg.style.display = "block";
  }
}
