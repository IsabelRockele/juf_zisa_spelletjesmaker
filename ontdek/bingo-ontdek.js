import { getApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js';
import { startOntdekAuth } from './ontdek-auth.js';

let currentUser = null;
let currentTrial = null;
let currentPro = false;
const status = document.getElementById('ontdek-bingo-status');
const accountButton = document.getElementById('ontdek-bingo-account');

function remainingText() {
  if (currentPro) return 'PRO actief · onbeperkt + persoonlijke bibliotheek';
  if (!currentUser || !currentTrial) return 'Gratis account nodig om PDF of spelbestand te bewaren';
  const used = Number(currentTrial.byTool?.bingo || 0);
  const remaining = Math.max(0, Number(currentTrial.toolLimit || 3) - used);
  return `${remaining} van 3 bingospellen over · ${currentTrial.totalRemaining} van ${currentTrial.totalLimit} Ontdek-downloads over`;
}

function updateStatus() {
  if (status) status.textContent = remainingText();
  if (accountButton) {
    accountButton.textContent = currentUser ? 'Account actief' : 'Gratis account / aanmelden';
    accountButton.classList.toggle('is-signed-in', Boolean(currentUser));
  }
}

startOntdekAuth({ onState: ({ user, pro, trial }) => {
  currentUser = user;
  currentPro = Boolean(pro);
  currentTrial = trial;
  updateStatus();
} });

accountButton?.addEventListener('click', () => {
  if (!currentUser) window.openOntdekAuth?.('registreren');
});

function errorMessage(error) {
  const raw = String(error?.message || error?.details || '');
  if (raw.includes('TOOL_LIMIT')) return 'Je drie gratis bingospellen zijn opgebruikt. Je kunt Bingo wel blijven samenstellen en spelen, maar niet meer downloaden of als spelbestand bewaren.';
  if (raw.includes('TOTAL_LIMIT')) return 'Je vijftien gratis Ontdek-downloads zijn opgebruikt. Je kunt Bingo wel blijven samenstellen en spelen.';
  return 'De gratis Bingo-download kon niet worden gecontroleerd. Probeer het straks opnieuw.';
}

async function authorize() {
  if (!currentUser) {
    window.openOntdekAuth?.('registreren');
    return false;
  }
  let gameData;
  try { gameData = JSON.parse(localStorage.getItem('bingoGameState') || 'null'); }
  catch { gameData = null; }
  if (!gameData?.ontdekGebruikId) {
    alert('Activeer het bingospel opnieuw voordat je het bewaart.');
    return false;
  }
  try {
    const reserve = httpsCallable(getFunctions(getApps().length ? getApp() : undefined, 'europe-west1'), 'reserveDiscoverDownload');
    const result = (await reserve({ toolId: 'bingo', pages: 1, reservationKey: gameData.ontdekGebruikId })).data;
    currentTrial = result;
    currentPro = Boolean(result.pro);
    updateStatus();
    return true;
  } catch (error) {
    alert(errorMessage(error));
    return false;
  }
}

window.BingoDownloadPolicy = { authorize };
updateStatus();
