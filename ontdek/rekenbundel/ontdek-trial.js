import { getApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js';
import { startOntdekAuth } from '../ontdek-auth.js';

let currentUser = null;
let currentTrial = null;
const discoverToolId = new URLSearchParams(location.search).get('discoverTool') === 'cijferen' ? 'cijferen' : 'rekenbundel';
const discoverToolNaam = discoverToolId === 'cijferen' ? 'Cijferen' : 'Bundel bewerkingen';

function updateQuota(pro = false, trial = currentTrial) {
  const tool = document.getElementById('ontdek-quota-tool');
  const total = document.getElementById('ontdek-quota-total');
  if (!tool || !total) return;
  if (pro) {
    tool.textContent = `${discoverToolNaam}: PRO · onbeperkt`;
    total.textContent = 'Totaal: PRO · onbeperkt';
    return;
  }
  if (!currentUser || !trial) {
    tool.textContent = `${discoverToolNaam}: aanmelden om je teller te zien`;
    total.textContent = 'Totaal: aanmelden om je teller te zien';
    return;
  }
  const gebruikt = Number(trial.byTool?.[discoverToolId] || 0);
  const toolOver = Math.max(0, Number(trial.toolLimit || 3) - gebruikt);
  tool.textContent = `${discoverToolNaam}: ${toolOver} van ${trial.toolLimit || 3} PDF-downloads over`;
  total.textContent = `Totaal: ${trial.totalRemaining} van ${trial.totalLimit} Ontdek-downloads over`;
}

function toonDownloadMelding(trial) {
  document.querySelector('.ontdek-download-toast')?.remove();
  const gebruikt = Number(trial.byTool?.[discoverToolId] || 0);
  const toolOver = Math.max(0, Number(trial.toolLimit || 3) - gebruikt);
  const toast = document.createElement('div');
  toast.className = 'ontdek-download-toast';
  toast.textContent = `PDF-download toegestaan · nog ${toolOver} van ${trial.toolLimit || 3} voor ${discoverToolNaam} · nog ${trial.totalRemaining} van ${trial.totalLimit} in totaal`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 6500);
}

startOntdekAuth({
  onState: ({ user, pro, trial }) => {
    currentUser = user;
    currentTrial = trial;
    updateQuota(pro, trial);
    const info = document.querySelector('.ontdek-download-uitleg');
    if (!info) return;
    if (pro) info.textContent = 'PRO actief · onbeperkt downloaden';
    else if (user && trial) info.textContent = `PDF zonder watermerk · ${trial.totalRemaining} van ${trial.totalLimit} downloads over`;
    else info.textContent = 'PDF zonder watermerk · gratis account nodig';
  },
});

function meldingUitFout(error) {
  const raw = String(error?.message || error?.details || '');
  if (raw.includes('PAGE_LIMIT')) return 'Je bundel telt meer dan 3 pagina’s. Verwijder enkele oefeningen en probeer opnieuw.';
  if (raw.includes('TOOL_LIMIT')) return `Je hebt je 3 gratis downloads voor ${discoverToolNaam} gebruikt.`;
  if (raw.includes('TOTAL_LIMIT')) return 'Je hebt je 15 gratis Ontdek-downloads gebruikt.';
  return 'De gratis download kon niet worden gecontroleerd. Probeer het straks opnieuw.';
}

async function authorizeDownload(pages) {
  if (!currentUser) {
    window.openOntdekAuth?.('registreren');
    const error = new Error('Maak eerst je gratis account. Daarna kun je de PDF zonder watermerk downloaden.');
    error.code = 'ONTDEK_LOGIN';
    throw error;
  }

  const app = getApps().length ? getApp() : null;
  if (!app) throw new Error('De accountverbinding is nog niet klaar.');
  const reserve = httpsCallable(getFunctions(app, 'europe-west1'), 'reserveDiscoverDownload');
  try {
    const result = (await reserve({ toolId: discoverToolId, pages })).data;
    currentTrial = result;
    updateQuota(Boolean(result.pro), result);
    const info = document.querySelector('.ontdek-download-uitleg');
    if (info && !result.pro) info.textContent = `PDF zonder watermerk · ${result.totalRemaining} van ${result.totalLimit} downloads over`;
    if (!result.pro) toonDownloadMelding(result);
    return result;
  } catch (error) {
    const wrapped = new Error(meldingUitFout(error));
    wrapped.code = 'ONTDEK_LIMIT';
    throw wrapped;
  }
}

window.OntdekTrial = { authorizeDownload, get status() { return currentTrial; } };
