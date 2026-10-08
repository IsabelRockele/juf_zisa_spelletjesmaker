import { getApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js';
import { startOntdekAuth } from '../ontdek-auth.js';

let currentUser = null, currentTrial = null, pro = false;
const bar = document.createElement('aside');
bar.className = 'ontdek-trial-bar no-print';
bar.innerHTML = '<span>Ontdek · Voorbeeld met watermerk. Maximaal 3 PDF-downloads zonder watermerk voor deze bundel.</span><span class="ontdek-download-status" role="status"></span>';
document.body.prepend(bar);
const status = bar.querySelector('.ontdek-download-status');
function updateStatus() {
  status.textContent = pro ? 'PRO actief · onbeperkt downloaden' : currentUser && currentTrial
    ? `${Math.max(0, 3 - Number(currentTrial.byTool?.taalsystematiek || 0))} downloads over voor deze bundel · ${currentTrial.totalRemaining} binnen je Ontdek-tegoed`
    : 'Log in met je gratis account om te downloaden.';
}
updateStatus();
startOntdekAuth({ onState: state => {
  currentUser = state.user; currentTrial = state.trial; pro = Boolean(state.pro); updateStatus();
} });
function requireAccount() {
  if (!currentUser) {
    window.openOntdekAuth?.('registreren');
    throw new Error('Log eerst in of maak je gratis account. Je bundel blijft hier bewaard.');
  }
}
async function authorizeDownload(pages) {
  requireAccount();
  if (!getApps().length) throw new Error('De accountverbinding is nog niet klaar.');
  try {
    const reserve = httpsCallable(getFunctions(getApp(), 'europe-west1'), 'reserveDiscoverDownload');
    // One transaction per completed PDF, shared by worksheets and solutions.
    const result = (await reserve({ toolId: 'taalsystematiek', pages, reservationKey: crypto.randomUUID() })).data;
    currentTrial = result; pro = Boolean(result.pro); updateStatus();
    return result;
  } catch (error) {
    const message = String(error?.message || '');
    if (message.includes('TOOL_LIMIT')) throw new Error('Je 3 gratis downloads voor deze bundel zijn opgebruikt. Je kunt het voorbeeld blijven gebruiken.');
    if (message.includes('TOTAL_LIMIT')) throw new Error('Je totale Ontdek-tegoed is opgebruikt. Je kunt het voorbeeld blijven gebruiken.');
    throw new Error('De download kon niet worden gecontroleerd. Probeer het straks opnieuw.');
  }
}
window.OntdekTrial = { requireAccount, authorizeDownload };
