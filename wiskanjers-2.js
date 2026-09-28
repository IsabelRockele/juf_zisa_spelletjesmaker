(() => {
  'use strict';
  // Gratis omgeving, 2de leerjaar. Voeg nieuwe bordlessen hier aan hun blok toe.
  // De URL wijst naar de eigen lespagina; bestaande lessen blijven behouden.
  const lessons = [
    { block: 1, number: 19, title: 'Even opfrissen – Eigenschappen van bewerkingen: de omgekeerde bewerking bij optellen en aftrekken', description: 'Handel met schriften en noteer de bewerkingen op het bord.', parts: ['Schriften verplaatsen', 'Strookvoorstelling', 'Drie getallen'], url: 'schriften-bord.html' },
    { block: 1, number: 20, title: 'Het uur aflezen en schrijven', description: 'Verzet de wijzer, schrijf het hele uur en koppel de digitale klok aan de wijzerklok.', parts: ['Wijzerklok', 'Zelf noteren', 'Welke klok?'], url: 'wiskanjers-b1-les20.html' },
    { block: 1, number: 21, title: 'Tijdsduur in dagen', description: 'Ervaar tijd met groepstimers en tel samen de nachten tussen twee dagen.', parts: ['Tijd ervaren', 'Dagen springen', 'Samen oefenen'], url: 'wiskanjers-b1-les21.html' }
  ];
  const $ = id => document.getElementById(id);
  for (let block = 1; block <= 8; block++) {
    const button = document.createElement('button');
    button.type = 'button'; button.dataset.block = block;
    const title = document.createElement('strong'); title.textContent = `Blok ${block}`;
    const count = lessons.filter(lesson => lesson.block === block).length;
    const subtitle = document.createElement('span'); subtitle.textContent = count ? `${count} ${count === 1 ? 'bordles' : 'bordlessen'}` : 'Nog geen bordlessen';
    button.append(title, subtitle); button.addEventListener('click', () => { location.hash = `blok-${block}`; });
    $('blocks').appendChild(button);
  }
  function render() {
    const match = location.hash.match(/^#blok-([1-8])$/);
    const block = match ? Number(match[1]) : 1;
    document.querySelectorAll('[data-block]').forEach(button => {
      const selected = Number(button.dataset.block) === block;
      button.setAttribute('aria-pressed', String(selected));
      if (selected) button.setAttribute('aria-current', 'true'); else button.removeAttribute('aria-current');
    });
    const available = lessons.filter(lesson => lesson.block === block).sort((a,b) => a.number-b.number);
    $('block-title').textContent = `Blok ${block}`;
    $('lesson-count').textContent = `${available.length} ${available.length === 1 ? 'bordles' : 'bordlessen'}`;
    $('empty').hidden = available.length > 0;
    $('lesson-list').replaceChildren();
    for (const lesson of available) {
      const card = document.createElement('a'); card.className = 'lesson-card'; card.href = lesson.url;
      const badge = document.createElement('span'); badge.className = 'lesson-number'; badge.textContent = `Les ${lesson.number}`;
      const content = document.createElement('div');
      const title = document.createElement('h3'); title.textContent = lesson.title;
      const description = document.createElement('p'); description.textContent = lesson.description;
      const parts = document.createElement('ul');
      lesson.parts.forEach(part => { const tag = document.createElement('li'); tag.textContent = part; parts.appendChild(tag); });
      content.append(title, description, parts);
      const open = document.createElement('span'); open.className = 'open-lesson'; open.textContent = 'Open bordles →';
      card.append(badge, content, open); $('lesson-list').appendChild(card);
    }
  }
  window.addEventListener('hashchange', render); render();
})();
