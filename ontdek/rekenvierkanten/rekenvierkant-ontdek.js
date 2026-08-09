import { getApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js';
import { startOntdekAuth } from '../ontdek-auth.js';

let currentUser = null;
let currentTrial = null;

function statusTekst(pro = false) {
  if (pro) return 'PRO actief · onbeperkt downloaden';
  if (currentUser && currentTrial) {
    const gebruikt = Number(currentTrial.byTool?.rekenvierkant || 0);
    const over = Math.max(0, Number(currentTrial.toolLimit || 3) - gebruikt);
    return `${currentTrial.totalRemaining} van ${currentTrial.totalLimit} downloads over · ${over} voor Rekenvierkant`;
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
  if (raw.includes('TOOL_LIMIT')) return 'Je 3 gratis PDF-downloads voor Rekenvierkant zijn opgebruikt. Je kunt blijven maken en bekijken.';
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
    const result = (await reserve({ toolId:'rekenvierkant', pages })).data;
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

function blokkeer(id, tekst) {
  const knop = document.getElementById(id);
  if (!knop) return;
  knop.classList.add('ontdek-pro-slot');
  knop.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    alert(tekst);
  }, true);
}

function start() {
  const uitleg = document.createElement('div');
  uitleg.className = 'ontdek-uitleg';
  uitleg.innerHTML = '<strong>Ontdek-versie.</strong> Maak en bewerk rekenvierkanten vrij in de preview. Je kunt 3 werkblad-PDF’s zonder watermerk downloaden. Oplossingen, PDF-sleutel en PNG zijn PRO. <a href="https://demo.jufzisa.be/#zg-prijzen" target="_blank" rel="noopener">Bekijk en koop PRO</a>';
  document.body.insertAdjacentElement('afterbegin', uitleg);

  const toolbar = document.createElement('div');
  toolbar.className = 'ontdek-werkbalk';
  const paginaStatus = document.createElement('span');
  paginaStatus.className = 'ontdek-pagina-status';
  const downloadStatus = document.createElement('span');
  downloadStatus.className = 'ontdek-download-status';
  downloadStatus.textContent = statusTekst(false);
  toolbar.append(paginaStatus, downloadStatus);
  ['toonOplossing', 'downloadPngBtn', 'downloadPdfOplBtn', 'downloadPdfBtn'].forEach(id => {
    const knop = document.getElementById(id);
    if (knop) toolbar.appendChild(knop);
  });
  document.querySelector('.app-header')?.insertAdjacentElement('afterend', toolbar);

  function verversPaginaStatus() {
    const aantal = Math.max(1, Number(document.getElementById('roosterCount')?.textContent || 1));
    const paginas = Math.ceil(aantal / 4);
    paginaStatus.textContent = `${paginas} van maximaal 3 pagina${paginas === 1 ? '' : '’s'} · download mogelijk · PRO onbeperkt`;
  }
  const teller = document.getElementById('roosterCount');
  if (teller) new MutationObserver(verversPaginaStatus).observe(teller, { childList:true,subtree:true,characterData:true });
  verversPaginaStatus();

  blokkeer('toonOplossing', 'Oplossingen bekijken is beschikbaar in PRO. In Ontdek kun je het werkblad volledig samenstellen en bekijken.');
  blokkeer('downloadPdfOplBtn', 'De PDF-sleutel met oplossingen is beschikbaar in PRO.');
  blokkeer('downloadPngBtn', 'Exporteren als PNG is beschikbaar in PRO. In Ontdek kun je 3 werkblad-PDF’s downloaden.');
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true }); else start();
