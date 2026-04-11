// ============================================================
//  consent.js  –  AVG Toestemmingsbeheer
//  Juf Zisa's Spelgenerator PRO
//  Versie: 1.0
//
//  Wordt geladen als <script type="module"> in app.html
//  Firebase Modular SDK v10 — zelfde versie als guard.js
// ============================================================

import { getApps, getApp }   from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp }
                             from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ── Instellingen ─────────────────────────────────────────────
const CONSENT_VERSION = "1.0";
// Verhoog dit bij een nieuwe versie van de privacyverklaring.
// Alle gebruikers krijgen de pop-up dan automatisch opnieuw.

const PRIVACY_URL = "./privacy.html";
// Pad naar de volledige AVG-verklaring in de app.
// ─────────────────────────────────────────────────────────────

// Interne state — onthoudt of consent nog nodig is
// ook als gebruiker even naar een ander tabblad gaat.
let _consentNodig = false;
let _consentUser  = null;
let _consentRef   = null;

// Hergebruik de Firebase-app die guard.js al heeft gestart.
async function getFirebaseApp() {
  let pogingen = 0;
  while (getApps().length === 0 && pogingen < 50) {
    await new Promise(r => setTimeout(r, 100));
    pogingen++;
  }
  return getApp();
}

// ── Hoofdfunctie — exporteer deze en roep ze aan vanuit app.html ──
export async function checkAndShowConsent(user) {
  const app = await getFirebaseApp();
  const db  = getFirestore(app);
  const consentRef = doc(db, "users", user.uid, "consent", "avg");

  try {
    const snap = await getDoc(consentRef);
    if (snap.exists() && snap.data().version === CONSENT_VERSION) {
      return; // Akkoord al gegeven — niets doen.
    }
  } catch (err) {
    console.warn("[consent.js] Kan consent niet lezen, pop-up tonen als fallback.", err);
  }

  // Sla state op zodat visibilitychange de pop-up kan heropenen
  // wanneer de gebruiker terugkomt van de privacypagina.
  _consentNodig = true;
  _consentUser  = user;
  _consentRef   = consentRef;

  toonConsentPopup(user, consentRef);
}

// ── Heropen pop-up als gebruiker terugkomt van ander tabblad ──
// De leerkracht opent de privacyverklaring in een nieuw tabblad,
// leest die, en keert terug. De pop-up verschijnt dan automatisch
// opnieuw zodat ze het vinkje nog kunnen aanvinken.
document.addEventListener("visibilitychange", function () {
  if (document.visibilityState === "visible" && _consentNodig) {
    if (!document.getElementById("zisa-consent-overlay")) {
      toonConsentPopup(_consentUser, _consentRef);
    }
  }
});

// ── Pop-up opbouwen ─────────────────────────────────────────
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

        <a href="${PRIVACY_URL}" target="_blank" id="zisa-consent-link">
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
        <button id="zisa-consent-knop" type="button">Doorgaan →</button>
      </div>

    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

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

// ── Akkoord opslaan in Firestore ───────────────────────────
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

    // Consent opgeslagen — state resetten zodat pop-up niet meer terugkomt
    _consentNodig = false;
    _consentUser  = null;
    _consentRef   = null;

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