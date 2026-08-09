import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js';
import { initializeAppCheck, ReCaptchaV3Provider } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check.js';

function laadAccountOpmaak() {
  if (document.querySelector('link[data-ontdek-auth-styles]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('./ontdek-auth.css', import.meta.url).href;
  link.dataset.ontdekAuthStyles = 'true';
  document.head.appendChild(link);
}

laadAccountOpmaak();

const firebaseConfig = {
  apiKey: 'AIzaSyA1svbzlhdjiiDMyRIgqQq1jSu_F8li3Bw',
  authDomain: 'zisa-spelletjesmaker-pro.firebaseapp.com',
  projectId: 'zisa-spelletjesmaker-pro',
  storageBucket: 'zisa-spelletjesmaker-pro.appspot.com',
  messagingSenderId: '828063957776',
  appId: '1:828063957776:web:8d8686b478846fe980db95',
  measurementId: 'G-9LHNLFHSXX',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app, 'europe-west1');

if (!['localhost', '127.0.0.1'].includes(location.hostname)) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider('6Lf5e7krAAAAAA1xV5_tz_Xickk-m6BRIMd_BzTO'),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (error) {
    if (!String(error?.message || '').includes('already been initialized')) console.warn('App-controle kon niet starten.', error);
  }
}

const getAccessStatus = httpsCallable(functions, 'getAccessStatus');
const getDiscoverStatus = httpsCallable(functions, 'getDiscoverStatus');
const googleProvider = new GoogleAuthProvider();

function fouttekst(error) {
  const code = String(error?.code || '');
  if (code.includes('email-already-in-use')) return 'Er bestaat al een account met dit e-mailadres. Kies Aanmelden.';
  if (code.includes('invalid-credential') || code.includes('wrong-password')) return 'E-mailadres of wachtwoord klopt niet.';
  if (code.includes('weak-password')) return 'Kies een wachtwoord van minstens 6 tekens.';
  if (code.includes('invalid-email')) return 'Vul een geldig e-mailadres in.';
  if (code.includes('popup-closed')) return 'Het Google-venster werd gesloten.';
  return 'Dat lukte niet. Probeer het opnieuw.';
}

function bouwDialoog() {
  const dialoog = document.createElement('dialog');
  dialoog.id = 'ontdekAuthDialog';
  dialoog.className = 'ontdek-auth-dialog';
  dialoog.innerHTML = `
    <form method="dialog" class="ontdek-auth-card">
      <button type="button" class="ontdek-auth-close" aria-label="Sluiten">×</button>
      <span class="ontdek-auth-kicker">ÉÉN ACCOUNT VOOR ONTDEK EN PRO</span>
      <h2 id="ontdekAuthTitle">Gratis account maken</h2>
      <p class="ontdek-auth-intro">Ditzelfde account wordt automatisch PRO wanneer jij of je school een abonnement activeert.</p>
      <button type="button" class="ontdek-google" id="ontdekGoogle">Doorgaan met Google</button>
      <div class="ontdek-auth-of"><span>of met e-mail</span></div>
      <label>E-mailadres<input id="ontdekEmail" type="email" autocomplete="email" required></label>
      <label>Wachtwoord<input id="ontdekPassword" type="password" autocomplete="current-password" minlength="6" required></label>
      <button type="button" class="ontdek-auth-primary" id="ontdekSubmit">Gratis account maken</button>
      <button type="button" class="ontdek-auth-switch" id="ontdekSwitch">Ik heb al een account · Aanmelden</button>
      <button type="button" class="ontdek-auth-reset" id="ontdekReset" hidden>Wachtwoord vergeten?</button>
      <p class="ontdek-auth-feedback" id="ontdekAuthFeedback" role="status"></p>
    </form>`;
  document.body.appendChild(dialoog);
  return dialoog;
}

export function startOntdekAuth({ onState } = {}) {
  const dialoog = bouwDialoog();
  const email = dialoog.querySelector('#ontdekEmail');
  const password = dialoog.querySelector('#ontdekPassword');
  const title = dialoog.querySelector('#ontdekAuthTitle');
  const submit = dialoog.querySelector('#ontdekSubmit');
  const wissel = dialoog.querySelector('#ontdekSwitch');
  const reset = dialoog.querySelector('#ontdekReset');
  const feedback = dialoog.querySelector('#ontdekAuthFeedback');
  const sluiten = dialoog.querySelector('.ontdek-auth-close');
  let modus = 'registreren';

  sluiten.addEventListener('click', () => dialoog.close());

  function toonModus() {
    const registreren = modus === 'registreren';
    title.textContent = registreren ? 'Gratis account maken' : 'Aanmelden';
    submit.textContent = registreren ? 'Gratis account maken' : 'Aanmelden';
    wissel.textContent = registreren ? 'Ik heb al een account · Aanmelden' : 'Nog geen account · Gratis registreren';
    reset.hidden = registreren;
    password.autocomplete = registreren ? 'new-password' : 'current-password';
    feedback.textContent = '';
  }

  wissel.addEventListener('click', () => { modus = modus === 'registreren' ? 'aanmelden' : 'registreren'; toonModus(); });
  submit.addEventListener('click', async () => {
    if (!email.reportValidity() || !password.reportValidity()) return;
    submit.disabled = true;
    feedback.textContent = 'Even controleren…';
    try {
      if (modus === 'registreren') await createUserWithEmailAndPassword(auth, email.value.trim(), password.value);
      else await signInWithEmailAndPassword(auth, email.value.trim(), password.value);
      dialoog.close();
    } catch (error) {
      feedback.textContent = fouttekst(error);
    } finally { submit.disabled = false; }
  });
  dialoog.querySelector('#ontdekGoogle').addEventListener('click', async () => {
    try { await signInWithPopup(auth, googleProvider); dialoog.close(); }
    catch (error) { feedback.textContent = fouttekst(error); }
  });
  reset.addEventListener('click', async () => {
    if (!email.reportValidity()) return;
    try { await sendPasswordResetEmail(auth, email.value.trim()); feedback.textContent = 'De herstelmail is verstuurd.'; }
    catch (error) { feedback.textContent = fouttekst(error); }
  });

  window.openOntdekAuth = (startmodus = 'registreren') => { modus = startmodus; toonModus(); dialoog.showModal(); };
  window.ontdekSignOut = () => signOut(auth);
  window.getOntdekUser = () => auth.currentUser;

  onAuthStateChanged(auth, async user => {
    let pro = false;
    let trial = null;
    if (user) {
      try {
        const result = (await getDiscoverStatus({})).data;
        pro = Boolean(result?.pro);
        trial = result || null;
      } catch {
        try { pro = Boolean((await getAccessStatus({})).data?.allowed); }
        catch { pro = false; }
      }
    }
    onState?.({ user, pro, trial });
  });

  toonModus();
  return { auth, open: window.openOntdekAuth };
}
