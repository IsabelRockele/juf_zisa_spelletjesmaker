import { getApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js';
import { startOntdekAuth } from '../ontdek-auth.js';

let currentUser = null;
let currentTrial = null;

function statusTekst(pro = false) {
  if (pro) return 'PRO actief · onbeperkt downloaden';
  if (currentUser && currentTrial) {
    const gebruikt = Number(currentTrial.byTool?.getalinzicht || 0);
    const over = Math.max(0, Number(currentTrial.toolLimit || 3) - gebruikt);
    return `${currentTrial.totalRemaining} van ${currentTrial.totalLimit} downloads over · ${over} voor Getalinzicht`;
  }
  return 'Gratis account nodig voor een PDF zonder watermerk';
}

startOntdekAuth({ onState: ({ user, pro, trial }) => {
  currentUser = user; currentTrial = trial;
  document.querySelectorAll('.ontdek-download-status').forEach(el => { el.textContent = statusTekst(pro); });
} });

function foutmelding(error) {
  const raw = String(error?.message || error?.details || '');
  if (raw.includes('PAGE_LIMIT')) return "Deze bundel telt meer dan 3 pagina's. Verwijder enkele oefeningen.";
  if (raw.includes('TOOL_LIMIT')) return 'Je 3 gratis downloads voor Getalinzicht zijn opgebruikt. Je kunt de preview blijven gebruiken.';
  if (raw.includes('TOTAL_LIMIT')) return 'Je 15 gratis Ontdek-downloads zijn opgebruikt. Je kunt de preview blijven gebruiken.';
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
    const result = (await reserve({ toolId: 'getalinzicht', pages })).data;
    currentTrial = result;
    document.querySelectorAll('.ontdek-download-status').forEach(el => { el.textContent = statusTekst(Boolean(result.pro)); });
    return result;
  } catch (error) {
    const wrapped = new Error(foutmelding(error)); wrapped.code = 'ONTDEK_LIMIT'; throw wrapped;
  }
}
window.OntdekTrial = { authorizeDownload, get status() { return currentTrial; } };

function blokkeerOplossingen() {
  ['btnToggleSolutions', 'btnDownloadSolutions'].forEach(id => {
    const button = document.getElementById(id); if (!button) return;
    button.classList.add('ontdek-pro-slot');
    button.addEventListener('click', event => {
      event.preventDefault(); event.stopImmediatePropagation();
      alert('Oplossingen bekijken en downloaden is uitsluitend beschikbaar in PRO.');
    }, true);
  });
}

function voegOntdekUiToe() {
  const uitleg = document.createElement('div');
  uitleg.className = 'ontdek-uitleg';
  uitleg.innerHTML = '<strong>Ontdek-versie.</strong> Het watermerk beschermt de voorbeeldweergave. Toegestane gratis PDF’s zijn zonder watermerk; in PRO zijn preview en PDF’s altijd zonder watermerk. <a href="getalkeuze.html">Wissel onderbouw/bovenbouw</a> · <a href="https://demo.jufzisa.be/#zg-prijzen" target="_blank" rel="noopener">Bekijk en koop PRO</a>';
  document.body.insertAdjacentElement('afterbegin', uitleg);
  const download = document.getElementById('btnDownloadPdf'); if (!download) return;
  const zone = document.querySelector('.werkblad-zone');
  const toolbar = document.createElement('div');
  toolbar.className = 'ontdek-werkbalk';
  toolbar.setAttribute('aria-label', 'Ontdek PDF-werkbalk');
  zone?.insertAdjacentElement('afterbegin', toolbar);
  ['btnDownloadPdf', 'btnToggleSolutions', 'btnDownloadSolutions', 'btnClearSheet'].forEach(id => {
    const button = document.getElementById(id);
    if (button) toolbar.appendChild(button);
  });
  const status = document.createElement('span'); status.className = 'ontdek-download-status'; status.textContent = statusTekst(false);
  download.insertAdjacentElement('afterend', status);
  const controle = document.createElement('span'); controle.className = 'ontdek-pagina-controle'; controle.textContent = "Ontdek: maximaal 3 pagina's · PRO: geen paginalimiet";
  status.insertAdjacentElement('beforebegin', controle);
  toolbar.insertBefore(controle, toolbar.firstChild);
  toolbar.insertBefore(status, download);
  let telTimer = null;
  let telVolgnummer = 0;
  async function telAutomatisch() {
    const sheet = document.getElementById('sheet');
    const volgnummer = ++telVolgnummer;
    if (!sheet || sheet.children.length <= 1) {
      controle.dataset.status = '';
      controle.textContent = "Ontdek: maximaal 3 pagina's · PRO: geen paginalimiet · voeg oefeningen toe";
      download.disabled = true;
      return;
    }
    controle.dataset.status = '';
    controle.textContent = "PDF-pagina's automatisch berekenen… · Ontdek max. 3 · PRO onbeperkt";
    download.disabled = true;
    try {
      const result = await window.GI_Pdf?.maakPdf?.('controle.pdf', { solutions:false, countOnly:true });
      if (volgnummer !== telVolgnummer) return;
      const pages = Number(result?.pages || 0);
      const toegestaan = pages > 0 && pages <= 3;
      controle.dataset.status = toegestaan ? 'goed' : 'teveel';
      controle.textContent = toegestaan
        ? `${pages} van maximaal 3 pagina${pages === 1 ? '' : "'s"} · download mogelijk · PRO heeft geen paginalimiet`
        : `${pages} pagina's · download niet mogelijk in Ontdek (max. 3) · PRO heeft geen paginalimiet`;
      download.disabled = !toegestaan;
    } catch {
      if (volgnummer !== telVolgnummer) return;
      controle.dataset.status = 'teveel';
      controle.textContent = 'Paginatelling mislukt · wijzig iets om opnieuw te proberen';
      download.disabled = true;
    }
  }
  const sheet = document.getElementById('sheet');
  if (sheet) {
    new MutationObserver(() => {
      clearTimeout(telTimer);
      controle.dataset.status = '';
      controle.textContent = "PDF-pagina's automatisch berekenen… · Ontdek max. 3 · PRO onbeperkt";
      download.disabled = true;
      telTimer = setTimeout(telAutomatisch, 900);
    }).observe(sheet, { childList:true, subtree:true, characterData:true });
  }
  telAutomatisch();
}

function start() { voegOntdekUiToe(); blokkeerOplossingen(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
else start();
