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

  const uitleg = document.createElement('span');
  uitleg.className = 'ontdek-download-uitleg';
  uitleg.textContent = `PDF zonder watermerk · Ontdek: max. ${ONTDEK_CONFIG.maxPaginasGroteBundel} pagina's · PRO: geen paginalimiet`;
  knop.insertAdjacentElement('afterend', uitleg);
}

function start() {
  blokkeerVraagstukken();
  blokkeerKnop(document.getElementById('btn-sleutel'), 'Oplossingssleutels zijn uitsluitend beschikbaar in PRO.');
  blokkeerKnop(document.getElementById('btn-toggle-oplossingen'), 'Oplossingen bekijken is uitsluitend beschikbaar in PRO.');
  voorbereidDownloaden();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
