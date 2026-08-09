import { getApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js';
import { startOntdekAuth } from '../ontdek-auth.js';

let currentUser = null;
let currentTrial = null;

function statusTekst(pro = false) {
  if (pro) return 'PRO actief · onbeperkt downloaden';
  if (currentUser && currentTrial) {
    const gebruikt = Number(currentTrial.byTool?.rekenweg || 0);
    const over = Math.max(0, Number(currentTrial.toolLimit || 3) - gebruikt);
    return `${currentTrial.totalRemaining} van ${currentTrial.totalLimit} downloads over · ${over} voor Rekenweg`;
  }
  return 'Gratis account nodig voor een PDF zonder watermerk';
}

startOntdekAuth({ onState: ({ user, pro, trial }) => {
  currentUser = user;
  currentTrial = trial;
  document.querySelectorAll('.ontdek-download-status').forEach(el => { el.textContent = statusTekst(pro); });
} });

function foutmelding(error) {
  const raw = String(error?.message || error?.details || '');
  if (raw.includes('TOOL_LIMIT')) return 'Je 3 gratis PDF-downloads voor Rekenweg zijn opgebruikt. Je kunt blijven maken en bekijken.';
  if (raw.includes('TOTAL_LIMIT')) return 'Je 15 gratis Ontdek-downloads zijn opgebruikt. Je kunt blijven maken en bekijken.';
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
  try {
    const reserve = httpsCallable(getFunctions(app, 'europe-west1'), 'reserveDiscoverDownload');
    const result = (await reserve({ toolId:'rekenweg', pages })).data;
    currentTrial = result;
    document.querySelectorAll('.ontdek-download-status').forEach(el => { el.textContent = statusTekst(Boolean(result.pro)); });
    return result;
  } catch (error) {
    const wrapped = new Error(foutmelding(error));
    wrapped.code = 'ONTDEK_LIMIT';
    throw wrapped;
  }
}

window.OntdekTrial = { authorizeDownload, get status() { return currentTrial; } };

function start() {
  const uitleg = document.createElement('div');
  uitleg.className = 'ontdek-uitleg';
  uitleg.innerHTML = '<strong>Ontdek-versie.</strong> Maak en bewerk onbeperkt rekenwegen in de preview. Je kunt 3 PDF’s zonder watermerk downloaden. PNG is PRO. <a href="https://demo.jufzisa.be/#zg-prijzen" target="_blank" rel="noopener">Bekijk en koop PRO</a>';
  document.body.insertAdjacentElement('afterbegin', uitleg);

  const toolbar = document.createElement('div');
  toolbar.className = 'ontdek-werkbalk';
  toolbar.innerHTML = '<span class="ontdek-pagina-status">1 A4-pagina · download mogelijk · PRO onbeperkt</span><span class="ontdek-download-status">Gratis account nodig voor een PDF zonder watermerk</span>';
  document.querySelector('.app-header')?.insertAdjacentElement('afterend', toolbar);

  const png = document.getElementById('downloadPngBtn');
  png?.classList.add('ontdek-pro-slot');
  png?.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    alert('Exporteren als PNG is beschikbaar in PRO. In Ontdek kun je 3 PDF’s zonder watermerk downloaden.');
  }, true);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true }); else start();
