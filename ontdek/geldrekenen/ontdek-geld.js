import { getApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js';
import { startOntdekAuth } from '../ontdek-auth.js';

let currentUser = null;
let currentTrial = null;
function statusTekst(pro = false) {
  if (pro) return 'PRO actief · onbeperkt downloaden en rechtstreeks afdrukken';
  if (currentUser && currentTrial) {
    const gebruikt = Number(currentTrial.byTool?.geldbundel || 0);
    const over = Math.max(0, Number(currentTrial.toolLimit || 3) - gebruikt);
    return `${currentTrial.totalRemaining} van ${currentTrial.totalLimit} downloads over · ${over} voor Bundel geld`;
  }
  return 'Gratis account nodig voor een PDF zonder watermerk';
}
startOntdekAuth({ onState: ({ user, pro, trial }) => {
  currentUser = user; currentTrial = trial;
  document.querySelectorAll('.ontdek-download-status').forEach(el => { el.textContent = statusTekst(pro); });
} });

function foutmelding(error) {
  const raw = String(error?.message || error?.details || '');
  if (raw.includes('PAGE_LIMIT')) return "Deze geldbundel telt meer dan 3 pagina's. Verwijder enkele oefeningen of kies PRO zonder paginalimiet.";
  if (raw.includes('TOOL_LIMIT')) return 'Je 3 gratis downloads voor Bundel geld zijn opgebruikt. Je kunt blijven samenstellen en bekijken.';
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
    const result = (await reserve({ toolId:'geldbundel', pages })).data;
    currentTrial = result;
    document.querySelectorAll('.ontdek-download-status').forEach(el => { el.textContent = statusTekst(Boolean(result.pro)); });
    return result;
  } catch (error) {
    const wrapped = new Error(foutmelding(error)); wrapped.code = 'ONTDEK_LIMIT'; throw wrapped;
  }
}
window.OntdekTrial = { authorizeDownload, get status() { return currentTrial; } };

function start() {
  const uitleg = document.createElement('div'); uitleg.className = 'ontdek-uitleg';
  uitleg.innerHTML = '<strong>Ontdek-versie.</strong> Stel je geldbundel volledig samen. Gratis PDF’s bevatten maximaal 3 pagina’s; PRO heeft geen paginalimiet en kan rechtstreeks afdrukken. <a href="https://demo.jufzisa.be/#zg-prijzen" target="_blank" rel="noopener">Bekijk en koop PRO</a>';
  const preview = document.getElementById('preview');
  preview?.insertAdjacentElement('afterbegin', uitleg);
  const download = document.querySelector('.download-btn');
  const print = document.querySelector('.print-btn');
  const toolbar = document.createElement('div'); toolbar.className = 'ontdek-werkbalk';
  const paginaStatus = document.createElement('span'); paginaStatus.className = 'ontdek-pagina-status'; paginaStatus.textContent = "Ontdek: maximaal 3 pagina's · PRO: geen paginalimiet · voeg een sectie toe";
  const downloadStatus = document.createElement('span'); downloadStatus.className = 'ontdek-download-status'; downloadStatus.textContent = statusTekst(false);
  uitleg.insertAdjacentElement('afterend', toolbar);
  [paginaStatus, downloadStatus, print, download].forEach(el => { if (el) toolbar.appendChild(el); });
  if (download) download.disabled = true;

  if (print) {
    print.classList.add('ontdek-pro-slot');
    print.removeAttribute('onclick');
    print.addEventListener('click', event => {
      event.preventDefault(); event.stopImmediatePropagation();
      alert('Rechtstreeks afdrukken is beschikbaar in PRO. In Ontdek kun je 3 PDF’s zonder watermerk downloaden.');
    }, true);
  }

  let timer = null, volgnummer = 0;
  async function telPaginas() {
    const secties = document.querySelectorAll('#secties-container .oefening-sectie').length;
    const mijnNummer = ++volgnummer;
    if (!secties) {
      paginaStatus.dataset.status = '';
      paginaStatus.textContent = "Ontdek: maximaal 3 pagina's · PRO: geen paginalimiet · voeg een sectie toe";
      if (download) download.disabled = true; return;
    }
    paginaStatus.dataset.status = '';
    paginaStatus.textContent = "PDF-pagina's automatisch berekenen… · Ontdek max. 3 · PRO onbeperkt";
    if (download) download.disabled = true;
    try {
      const result = await window.GeldPdfEngine?.generate({ countOnly:true });
      if (mijnNummer !== volgnummer) return;
      const pages = Number(result?.pages || 0), toegestaan = pages > 0 && pages <= 3;
      paginaStatus.dataset.status = toegestaan ? 'goed' : 'teveel';
      paginaStatus.textContent = toegestaan
        ? `${pages} van maximaal 3 pagina${pages === 1 ? '' : "'s"} · download mogelijk · PRO heeft geen paginalimiet`
        : `${pages} pagina's · download niet mogelijk in Ontdek (max. 3) · PRO heeft geen paginalimiet`;
      if (download) download.disabled = !toegestaan;
    } catch {
      paginaStatus.dataset.status = 'teveel'; paginaStatus.textContent = 'Paginatelling mislukt · wijzig iets om opnieuw te proberen';
    }
  }
  const container = document.getElementById('secties-container');
  if (container) new MutationObserver(() => {
    clearTimeout(timer); if (download) download.disabled = true;
    timer = setTimeout(telPaginas, 900);
  }).observe(container, { childList:true, subtree:true, characterData:true });
  telPaginas();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true }); else start();
