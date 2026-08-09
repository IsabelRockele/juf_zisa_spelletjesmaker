// === WERKSTIJL ===
// Vak met visuele aanduiding hoe leerlingen moeten werken: stilte of fluisterstem.
// Leerkracht klikt op een knop onderaan om te wisselen.

const WERKSTIJL_NIVEAUS = [
  {
    id: 'stilte',
    label: 'in stilte',
    afbeelding: 'stilte.png',
    emoji: '🤫', // fallback als PNG ontbreekt
  },
  {
    id: 'fluister',
    label: 'met fluisterstem',
    afbeelding: 'fluisterstem.png',
    emoji: '🗣',
  },
];

function _maakWerkstijlVakHTML(opties = {}) {
  const huidigId = opties.werkstijl || 'stilte';
  const huidig = WERKSTIJL_NIVEAUS.find((n) => n.id === huidigId) || WERKSTIJL_NIVEAUS[0];

  const knoppenHTML = WERKSTIJL_NIVEAUS.map((n) => `
    <button class="werkstijl-knop ${n.id === huidigId ? 'actief' : ''}"
            type="button"
            data-werkstijl="${n.id}">
      ${n.label}
    </button>
  `).join('');

  return `
    <div class="vak-titel" contenteditable="true" data-placeholder="Titel...">${_escape(opties.titel || '')}</div>
    <div class="werkstijl-inhoud">
      <div class="werkstijl-visueel" data-werkstijl="${huidigId}">
        <img class="werkstijl-afbeelding"
             src="afbeeldingen/${huidig.afbeelding}"
             alt="${huidig.label}"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';" />
        <span class="werkstijl-emoji" style="display:none;">${huidig.emoji}</span>
      </div>
      <div class="werkstijl-label">${huidig.label}</div>
    </div>
    <div class="werkstijl-knoppen">
      ${knoppenHTML}
    </div>
  `;
}

function _initWerkstijl(vak) {
  // Standaard op stilte als nog niets ingesteld
  if (!vak.dataset.werkstijl) {
    vak.dataset.werkstijl = 'stilte';
  }

  // Koppel knoppen
  vak.querySelectorAll('.werkstijl-knop').forEach((knop) => {
    knop.addEventListener('mousedown', (e) => e.stopPropagation());
    knop.addEventListener('click', (e) => {
      e.stopPropagation();
      const nieuwe = knop.dataset.werkstijl;
      zetWerkstijl(vak, nieuwe);
    });
  });
}

function zetWerkstijl(vak, niveauId) {
  const niveau = WERKSTIJL_NIVEAUS.find((n) => n.id === niveauId);
  if (!niveau) return;

  vak.dataset.werkstijl = niveauId;

  // Update visueel
  const visueel = vak.querySelector('.werkstijl-visueel');
  const img = vak.querySelector('.werkstijl-afbeelding');
  const emoji = vak.querySelector('.werkstijl-emoji');
  const label = vak.querySelector('.werkstijl-label');

  if (visueel) visueel.dataset.werkstijl = niveauId;
  if (img) {
    img.src = `afbeeldingen/${niveau.afbeelding}`;
    img.style.display = ''; // reset; onerror zal hem opnieuw verbergen indien nodig
    img.alt = niveau.label;
  }
  if (emoji) {
    emoji.style.display = 'none';
    emoji.textContent = niveau.emoji;
  }
  if (label) label.textContent = niveau.label;

  // Update knop-actief-staat
  vak.querySelectorAll('.werkstijl-knop').forEach((k) => {
    k.classList.toggle('actief', k.dataset.werkstijl === niveauId);
  });
}
