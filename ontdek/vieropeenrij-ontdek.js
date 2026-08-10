import { getApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js';
import { startOntdekAuth } from './ontdek-auth.js';

let user = null;
let trial = null;
let pro = false;
let boardId = crypto.randomUUID ? crypto.randomUUID() : `vier-${Date.now()}`;
const status = document.getElementById('vier-status');
const account = document.getElementById('vier-account');

function updateStatus() {
  if (pro) status.textContent = 'PRO actief · onbeperkt';
  else if (!user || !trial) status.textContent = '3 spelborden met gratis account';
  else {
    const used = Number(trial.byTool?.['vier-op-een-rij'] || 0);
    status.textContent = `${Math.max(0, Number(trial.toolLimit || 3) - used)} van 3 spelborden over`;
  }
  account.textContent = user ? 'Account actief' : 'Gratis account / aanmelden';
  account.classList.toggle('is-signed-in', Boolean(user));
}

startOntdekAuth({ onState: state => { user = state.user; trial = state.trial; pro = Boolean(state.pro); updateStatus(); } });
account.addEventListener('click', () => { if (!user) window.openOntdekAuth?.('registreren'); });

async function authorize() {
  if (!user) { window.openOntdekAuth?.('registreren'); return false; }
  try {
    const reserve = httpsCallable(getFunctions(getApps().length ? getApp() : undefined, 'europe-west1'), 'reserveDiscoverDownload');
    const response = (await reserve({ toolId: 'vier-op-een-rij', pages: 1, reservationKey: boardId })).data;
    trial = response;
    pro = Boolean(response.pro);
    updateStatus();
    return true;
  } catch (error) {
    const raw = String(error?.message || error?.details || '');
    if (raw.includes('TOOL_LIMIT')) alert('Je drie gratis spelborden zijn opgebruikt. Je kunt wel nieuwe borden blijven samenstellen en bekijken.');
    else if (raw.includes('TOTAL_LIMIT')) alert('Je vijftien gratis Ontdek-downloads zijn opgebruikt. Je kunt de tool wel blijven verkennen.');
    else alert('De gratis download kon niet worden gecontroleerd. Probeer het straks opnieuw.');
    return false;
  }
}

window.VierOpRijDownloadPolicy = {
  authorize,
  newBoard() { boardId = crypto.randomUUID ? crypto.randomUUID() : `vier-${Date.now()}-${Math.random().toString(36).slice(2)}`; },
};
updateStatus();
