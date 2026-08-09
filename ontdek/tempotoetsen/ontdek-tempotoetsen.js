import { getApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js';
import { startOntdekAuth } from '../ontdek-auth.js';

let currentUser = null;
let currentTrial = null;

function statusTekst(pro = false) {
  if (pro) return 'PRO actief · onbeperkt downloaden';
  if (currentUser && currentTrial) {
    const gebruikt = Number(currentTrial.byTool?.tempotoetsen || 0);
    const over = Math.max(0, Number(currentTrial.toolLimit || 3) - gebruikt);
    return `${currentTrial.totalRemaining} van ${currentTrial.totalLimit} downloads over · ${over} voor Tempotoetsen`;
  }
  return 'Gratis account nodig voor een PDF zonder watermerk';
}

startOntdekAuth({ onState: ({ user, pro, trial }) => {
  currentUser = user; currentTrial = trial;
  document.querySelectorAll('.ontdek-download-status').forEach(el => { el.textContent = statusTekst(pro); });
} });

function foutmelding(error) {
  const raw = String(error?.message || error?.details || '');
  if (raw.includes('TOOL_LIMIT')) return 'Je 3 gratis downloads voor Tempotoetsen zijn opgebruikt. Je kunt blijven samenstellen en bekijken.';
  if (raw.includes('TOTAL_LIMIT')) return 'Je 15 gratis Ontdek-downloads zijn opgebruikt. Je kunt blijven samenstellen en bekijken.';
  return 'De gratis download kon niet worden gecontroleerd. Probeer het straks opnieuw.';
}

async function authorizeDownload(pages) {
  if (!currentUser) {
    window.openOntdekAuth?.('registreren');
    const error = new Error('Maak eerst je gratis account. Daarna kun je de PDF zonder watermerk downloaden.');
    error.code = 'ONTDEK_LOGIN'; throw error;
  }
  const app = getApps().length ? getApp() : null;
  if (!app) throw new Error('De accountverbinding is nog niet klaar.');
  try {
    const reserve = httpsCallable(getFunctions(app, 'europe-west1'), 'reserveDiscoverDownload');
    const result = (await reserve({ toolId:'tempotoetsen', pages })).data;
    currentTrial = result;
    document.querySelectorAll('.ontdek-download-status').forEach(el => { el.textContent = statusTekst(Boolean(result.pro)); });
    return result;
  } catch (error) {
    const wrapped = new Error(foutmelding(error)); wrapped.code = 'ONTDEK_LIMIT'; throw wrapped;
  }
}
window.OntdekTrial = { authorizeDownload, get status() { return currentTrial; } };

function blokkeerProKaart(id, melding) {
  const kaart = document.getElementById(id); if (!kaart) return;
  kaart.classList.add('ontdek-pro-slot');
  kaart.addEventListener('click', event => {
    event.preventDefault(); event.stopImmediatePropagation(); alert(melding);
  }, true);
}

function start() {
  const uitleg = document.createElement('div');
  uitleg.className = 'ontdek-uitleg';
  uitleg.innerHTML = '<strong>Ontdek-versie.</strong> Stel alle tempotoetsen samen en bekijk de vragen in de voorbeeldweergave. Antwoorden en flitsen op het smartboard zijn PRO. Gratis PDF’s zijn zonder watermerk. <a href="https://demo.jufzisa.be/#zg-prijzen" target="_blank" rel="noopener">Bekijk en koop PRO</a>';
  document.body.insertAdjacentElement('afterbegin', uitleg);

  const preview = document.getElementById('preview');
  const toolbar = document.createElement('div'); toolbar.className = 'ontdek-werkbalk';
  toolbar.innerHTML = '<span class="ontdek-pagina-status">Ontdek: deze PDF’s tellen 1–2 pagina’s · download mogelijk · PRO heeft geen paginalimiet</span><span class="ontdek-download-status">Gratis account nodig voor een PDF zonder watermerk</span>';
  preview?.insertAdjacentElement('beforebegin', toolbar);

  blokkeerProKaart('modus-flits', 'De volledige flits- en smartboardmodus is beschikbaar in PRO. In Ontdek kun je de oefeningen samenstellen en de voorbeeldweergave bekijken.');
  const observer = new MutationObserver(() => {
    blokkeerProKaart('modus-flits', 'De volledige flits- en smartboardmodus is beschikbaar in PRO. In Ontdek kun je de oefeningen samenstellen en de voorbeeldweergave bekijken.');
  });
  const modi = document.getElementById('modi'); if (modi) observer.observe(modi, { childList:true });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
else start();
