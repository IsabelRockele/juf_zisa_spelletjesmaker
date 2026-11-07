(() => {
  'use strict';
  // Gratis omgeving, 2de leerjaar. Voeg nieuwe bordlessen hier aan hun blok toe.
  // De URL wijst naar de eigen lespagina; bestaande lessen blijven behouden.
  const lessons = [
    {"block": 3, "number": 3, "title": "Optellen tot 100: tientallen erbij", "description": "Instructie en samen oefenen voor werkboek p. 11–13.", "parts": ["Weet je nog?", "Instructie", "Samen oefenen", "Zelf proberen"], "url": "wiskanjers-b3-les3.html"},
    {"block": 3, "number": 4, "title": "Aftrekken tot 100: tientallen eraf", "description": "Instructie en samen oefenen voor werkboek p. 14–16.", "parts": ["Weet je nog?", "Instructie", "Samen oefenen", "Zelf proberen"], "url": "wiskanjers-b3-les4.html"},
    {"block": 3, "number": 5, "title": "Optellen en aftrekken met eenheden", "description": "Instructie en samen oefenen voor werkboek p. 17–19.", "parts": ["Weet je nog?", "Instructie", "Samen oefenen", "Zelf proberen"], "url": "wiskanjers-b3-les5.html"},
    {"block": 3, "number": 12, "title": "Optellen zonder brug: TE + TE", "description": "Instructie en samen oefenen voor werkboek p. 50–52.", "parts": ["Weet je nog?", "Instructie", "Samen oefenen", "Zelf proberen"], "url": "wiskanjers-b3-les12.html"},
    {"block": 3, "number": 13, "title": "Aftrekken zonder brug: TE − TE", "description": "Instructie en samen oefenen voor werkboek p. 53–55.", "parts": ["Weet je nog?", "Instructie", "Samen oefenen", "Zelf proberen"], "url": "wiskanjers-b3-les13.html"},
    {"block": 3, "number": 14, "title": "Optellen, aftrekken en omgekeerde bewerkingen", "description": "Instructie en samen oefenen voor werkboek p. 56–59.", "parts": ["Weet je nog?", "Instructie", "Samen oefenen", "Zelf proberen"], "url": "wiskanjers-b3-les14.html"},
    {"block": 3, "number": 6, "title": "De maaltafel van 10 en de wisseleigenschap", "description": "Instructie en samen oefenen voor werkboek p. 26–30.", "parts": ["Weet je nog?", "Instructie", "Samen oefenen", "Zelf proberen"], "url": "wiskanjers-b3-les6.html"},
    {"block": 3, "number": 7, "title": "De deeltafel van 10", "description": "Instructie en samen oefenen voor werkboek p. 31–34.", "parts": ["Weet je nog?", "Instructie", "Samen oefenen", "Zelf proberen"], "url": "wiskanjers-b3-les7.html"},
    {"block": 3, "number": 8, "title": "De maal- en deeltafel van 10", "description": "Instructie en samen oefenen voor werkboek p. 35–37.", "parts": ["Weet je nog?", "Instructie", "Samen oefenen", "Zelf proberen"], "url": "wiskanjers-b3-les8.html"},
    {"block": 3, "number": 11, "title": "Materiaal gebruiken om problemen op te lossen", "description": "Instructie en samen oefenen voor werkboek p. 43.", "parts": ["Weet je nog?", "Instructie", "Samen oefenen", "Zelf proberen"], "url": "wiskanjers-b3-les11.html"},
    {"block": 3, "number": 15, "title": "Een antwoordzin schrijven", "description": "Instructie en samen oefenen voor werkboek p. 60–63.", "parts": ["Weet je nog?", "Instructie", "Samen oefenen", "Zelf proberen"], "url": "wiskanjers-b3-les15.html"},
    {"block": 3, "number": 16, "title": "Controleren of een antwoord mogelijk is", "description": "Instructie en samen oefenen voor werkboek p. 64–67.", "parts": ["Weet je nog?", "Instructie", "Samen oefenen", "Zelf proberen"], "url": "wiskanjers-b3-les16.html"},
    {"block": 3, "number": 17, "title": "De getallen tot 100", "description": "Instructie en samen oefenen voor werkboek p. 74–76.", "parts": ["Weet je nog?", "Instructie", "Samen oefenen", "Zelf proberen"], "url": "wiskanjers-b3-les17.html"},
    { block: 2, number: 16, title: 'De getallen tot 100 ordenen', description: 'Toon voor, na en tussen met sprongen op een hulpgetallenlijn. Plaats getallen en tel met sprongen van 1, 2, 5 en 10.', parts: ['Voor, na en tussen', 'Sprongen', 'Samen oefenen', 'Onthouden'], url: 'wiskanjers-b2-les16.html' },
    { block: 2, number: 15, title: 'De getallen tot 100 lezen en schrijven', description: 'Lees getallen met tientallen en eenheden, oefen een getallendictee en verbind getalwoorden met cijfers.', parts: ['Lezen en schrijven', 'Getallendictee', 'Samen oefenen', 'Onthouden'], url: 'wiskanjers-b2-les15.html' },
    { block: 2, number: 14, title: 'De getallen tot 100: de plaatswaarde', description: 'Leg getallen met MAB-materiaal, ontdek H, T en E en voeg getalwaarde­kaarten samen.', parts: ['Getallen leggen', 'Getalwaarde­kaarten', 'Samen oefenen', 'Onthouden'], url: 'wiskanjers-b2-les14.html' },
    { block: 2, number: 13, title: 'De getallen tot 100: groepen van 10 maken', description: 'Bundel voorwerpen per tien, tel vooruit en terug en plaats tientallen op de getallenas.', parts: ['Groepen van 10', 'Tellen met tientallen', 'Samen oefenen', 'Onthouden'], url: 'wiskanjers-b2-les13.html' },
    { block: 2, number: 10, title: 'De deling', description: 'Maak groepen van een gegeven grootte en schrijf de herhaalde aftrekking als een deling.', parts: ['Groepen maken', 'Samen oefenen', 'Onthouden'], url: 'wiskanjers-b2-les10.html' },
    { block: 2, number: 9, title: 'De maaltafel van 2', description: 'Bouw de tafel van 2 op met groepjes, sprongen en eigen notities. Oefen zoals in het werkboek.', parts: ['Groepjes van 2', 'Onze maaltafel', 'Samen oefenen'], url: 'wiskanjers-b2-les9.html' },
    { block: 2, number: 8, title: 'De vermenigvuldiging', description: 'Maak gelijke groepen, schrijf een herhaalde optelling en ontdek het maalteken.', parts: ['Tellen met sprongen', 'Groepjes maken', 'Samen oefenen'], url: 'wiskanjers-b2-les8.html' },
    { block: 1, number: 19, title: 'Even opfrissen – Eigenschappen van bewerkingen: de omgekeerde bewerking bij optellen en aftrekken', description: 'Handel met schriften en noteer de bewerkingen op het bord.', parts: ['Schriften verplaatsen', 'Strookvoorstelling', 'Drie getallen'], url: 'schriften-bord.html' },
    { block: 1, number: 20, title: 'Het uur aflezen en schrijven', description: 'Verzet de wijzer, schrijf het hele uur en koppel de digitale klok aan de wijzerklok.', parts: ['Wijzerklok', 'Zelf noteren', 'Welke klok?'], url: 'wiskanjers-b1-les20.html' },
    { block: 1, number: 21, title: 'Tijdsduur in dagen', description: 'Ervaar tijd met groepstimers en tel samen de nachten tussen twee dagen.', parts: ['Tijd ervaren', 'Dagen springen', 'Samen oefenen'], url: 'wiskanjers-b1-les21.html' },
    { block: 1, number: 24, title: 'Optellen en aftrekken tot 20 zonder en met brug', description: 'Oefen bewerkingen, ontbrekende getallen en verhaaltjes. Toon splitsbenen en reken via 10.', parts: ['Bewerkingen', 'Stappenplan', 'Verhaaltjes'], url: 'wiskanjers-b1-les24.html' },
    { block: 2, number: 1, title: 'Even en oneven getallen tot 20', description: 'Flits getalbeelden, verdeel voorwerpen en ontdek even en oneven getallen.', parts: ['Getalbeelden flitsen', 'Samen verdelen', 'Even of oneven?'], url: 'wiskanjers-b2-les1.html' },
    { block: 2, number: 2, title: 'Een geheel verdelen in gelijke delen', description: 'Vouw papier, verdeel blokjes en oefen met het geheel en gelijke delen.', parts: ['Papier vouwen', 'Blokjes verdelen', 'Figuren oefenen'], url: 'wiskanjers-b2-les2.html' },
    { block: 2, number: 3, title: 'De helft en het dubbel', description: 'Ontdek helften en het dubbel met stroken en blokjes. Oefen samen tekenen, kleuren en verwoorden.', parts: ['Stroken', 'Blokjes', 'Samen oefenen'], url: 'wiskanjers-b2-les3.html' },
    { block: 2, number: 4, title: 'Een kwart', description: 'Van een helft naar vier gelijke delen. Verdeel blokjes, kleur een kwart en oefen samen voor het werkboek.', parts: ['Van helft naar kwart', 'Vier kaarten', 'Samen oefenen'], url: 'wiskanjers-b2-les4.html' }
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
