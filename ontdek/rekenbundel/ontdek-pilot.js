import { ONTDEK_CONFIG } from '../ontdek-config.js';

const PRO_MELDING = 'Deze functie hoort bij PRO. In Ontdek kun je de volledige gewone bundelworkflow uitproberen.';

function blokkeerKnop(knop, melding = PRO_MELDING) {
  if (!knop) return;
  knop.disabled = false;
  knop.classList.add('ontdek-pro-slot');
  knop.removeAttribute('onclick');
  knop.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    alert(melding);
  }, true);
}

function blokkeerVraagstukken() {
  const tab = document.querySelector('.tab-vraagstukken');
  if (!tab) return;
  tab.classList.add('ontdek-pro-slot');
  tab.removeAttribute('onclick');
  tab.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    alert('AI-vraagstukken zijn uitsluitend beschikbaar in PRO.');
  }, true);
}

function voorbereidDownloaden() {
  const knop = document.getElementById('btn-pdf');
  if (!knop) return;

  const quota = document.createElement('section');
  quota.className = 'ontdek-quota-panel';
  quota.setAttribute('aria-label', 'Gratis downloadtegoed');
  quota.innerHTML = `
    <strong>Jouw gratis downloadtegoed</strong>
    <span id="ontdek-quota-tool">Bundel bewerkingen: aanmelden om je teller te zien</span>
    <span id="ontdek-quota-total">Totaal: aanmelden om je teller te zien</span>
    <span id="ontdek-quota-pages">Deze PDF: voeg oefeningen toe · maximaal 3 pagina's</span>`;
  document.querySelector('.ontdek-pilot-notice')?.insertAdjacentElement('afterend', quota);

  const uitleg = document.createElement('span');
  uitleg.className = 'ontdek-download-uitleg';
  uitleg.textContent = `PDF zonder watermerk · Ontdek: max. ${ONTDEK_CONFIG.maxPaginasGroteBundel} pagina's · PRO: geen paginalimiet`;
  knop.insertAdjacentElement('afterend', uitleg);

  const paginaStatus = document.getElementById('ontdek-pagina-status');
  const quotaPages = document.getElementById('ontdek-quota-pages');
  const spiegelPaginaStatus = () => {
    const tekst = paginaStatus?.textContent?.trim();
    if (quotaPages && tekst) quotaPages.textContent = `Deze PDF: ${tekst}`;
  };
  if (paginaStatus) new MutationObserver(spiegelPaginaStatus).observe(paginaStatus, { childList: true, characterData: true, subtree: true, attributes: true });
  spiegelPaginaStatus();
}

function start() {
  blokkeerVraagstukken();
  blokkeerKnop(document.getElementById('btn-sleutel'), 'Oplossingssleutels zijn uitsluitend beschikbaar in PRO.');
  blokkeerKnop(document.getElementById('btn-toggle-oplossingen'), 'Oplossingen bekijken is uitsluitend beschikbaar in PRO.');
  voorbereidDownloaden();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
