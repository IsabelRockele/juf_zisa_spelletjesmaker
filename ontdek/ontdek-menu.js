import { startOntdekAuth } from './ontdek-auth.js';

const BESCHIKBAAR = new Map([
  ['Bundel bewerkingen', './rekenbundel/index.html'],
  ['Tempotoetsen', './tempotoetsen/index.html'],
  ['Bundel getalinzicht', './bundel_getallen/getalkeuze.html'],
  ['Werkblad cijferen', './cijferen.html'],
  ['Bundel geld', './geldrekenen/index.html'],
  ['Bundel meetkunde', './meetkundebundelmaker/index.html'],
  ['Reken en kleur', './reken_en_kleur.html'],
  ['Rekenweg', './rekenweg/rekenweg.html'],
  ['Rekenvierkant', './rekenvierkanten/index.html'],
  ['Rekenpiramide', './rekenpiramide/index.html'],
  ['Rekendriehoek', './rekendriehoek/index.html'],
  ['Rekencirkel', './rekencirkels/rekencirkel.html'],
  ['Rekenrooster', './rekenrooster.html'],
  ['Rekenspellen', './reken-doolhof-generator.html'],
  ['Loopspel', './loopspel.html'],
  ['Verliefde harten', './harten.html'],
  ['MAB en schema', './keuze-hulpschema.html'],
  ['Bundel spelling', './spelling/index.html'],
  ['Leesbooster', './leesbooster/index.html'],
  ['Leeskaartjes per AVI', './Leeskaartjes/leeskaartjes.html'],
  ['Leesspel – eigen woorden', './lees.html'],
  ['Handschrift', './schrijfgenerator.html'],
  ['Woordzoeker', './woordzoeker.html'],
  ['Kruiswoordpuzzel', './kruiswoordpuzzel.html'],
  ['Geheime boodschap', './geheimeboodschap.html'],
  ['Lettercode', './lettercode.html'],
  ['Lettertetris', './lettertetris.html'],
  ['Galgje', './galgje.html'],
  ['Sudoku', './sudoku.html'],
  ['Zoek de verschillen', './zoekverschillen.html'],
  ['Doolhof', './doolhof.html'],
  ['Slangendoolhof', './slangendoolhof.html'],
  ['Hexagonaal raster', './hexagon.html'],
  ['Schaduw', './schaduw.html'],
  ['Punttekening', './punttekening.html'],
  ['Pixelart', './pixelart.html'],
  ['Bouwplaten', './bouwplaat.html'],
  ['Coderen', './coderen.html'],
  ['Blokkenbouwsels', './blokkenbouwsels/index.html'],
  ['Pentomino Studio', '../pentomino_studio_volledige_tool.html?ontdek=1&teacher=1'],
  ['Plattegrond', './plattegrond.html'],
  ['Bundel kloklezen', './kloklezen/kloklezen.html'],
  ['Bundel kalenders', './kalender/kalender.html'],
  ['Timer', './timer.html'],
  ['Opvolging huistaken', './opvolging_huistaken/opvolging_huistaken.html'],
  ['Takenbord', './Takenbord_v2/klasbord.html'],
  ['Planbord', './planbord/index.html'],
  ['Bingo', './bingo.html'],
  ['Vier op een rij', './vieropeenrij.html'],
  ['Rad', './rad.html'],
  ['QR-generator', './QR.html'],
  ['Zisa Spelen', './zisa-spelen.html'],
]);

const toolDescriptions = {
  'Rekenvierkant': 'Vul het rooster aan met de juiste bewerkingen.',
  'Rekenweg': 'Maak een rekenpad met opdrachten op maat.',
  'Rekenpiramide': 'Oefen verbanden tussen getallen in een piramide.',
  'Rekenrooster': 'Combineer getallen en bewerkingen in een rooster.',
  'Rekendriehoek': 'Oefen splitsingen en getalfamilies.',
  'Rekencirkel': 'Reken vanuit het midden naar buiten.',
  'MAB en schema': 'Visualiseer getallen met MAB-materiaal en schema’s.',
  'Zisa Spelen': 'Ontdek speelse oefeningen voor leerlingen en het smartboard.',
  'Pentomino Studio': 'Probeer drie bouwkaarten en drie schermvullende puzzelfiguren.',
};

const DOWNLOAD_TOOL_IDS = new Map([
  ['Bundel bewerkingen', 'rekenbundel'], ['Tempotoetsen', 'tempotoetsen'],
  ['Bundel getalinzicht', 'getalinzicht'], ['Werkblad cijferen', 'cijferen'],
  ['Bundel geld', 'geldbundel'], ['Bundel meetkunde', 'meetkundebundel'],
  ['Reken en kleur', 'reken-en-kleur'], ['Rekenweg', 'rekenweg'],
  ['Rekenvierkant', 'rekenvierkant'], ['Rekenpiramide', 'rekenpiramide'],
  ['Rekendriehoek', 'rekendriehoek'], ['Rekencirkel', 'rekencirkel'],
  ['Rekenrooster', 'rekenrooster'], ['Rekenspellen', 'rekenspellen'],
  ['Verliefde harten', 'verliefde-harten'], ['Bundel spelling', 'spellingbundel'],
  ['Leesbooster', 'leesbooster'], ['Leeskaartjes per AVI', 'leeskaartjes'],
  ['Handschrift', 'handschrift'], ['Woordzoeker', 'woordzoeker'],
  ['Kruiswoordpuzzel', 'kruiswoordpuzzel'], ['Geheime boodschap', 'geheime-boodschap'],
  ['Lettercode', 'lettercode'], ['Lettertetris', 'lettertetris'],
  ['Sudoku', 'sudoku'], ['Zoek de verschillen', 'zoek-verschillen'],
  ['Doolhof', 'doolhof'], ['Slangendoolhof', 'slangendoolhof'],
  ['Hexagonaal raster', 'hexagonaal-raster'], ['Schaduw', 'schaduw'],
  ['Punttekening', 'punttekening'], ['Pixelart', 'pixelart'],
  ['Bouwplaten', 'bouwplaten'], ['Coderen', 'coderen'],
  ['Blokkenbouwsels', 'blokkenbouwsels'], ['Plattegrond', 'plattegrond'],
  ['Bundel kloklezen', 'kloklezenbundel'], ['Bundel kalenders', 'kalenderbundel'],
]);

function updateDownloadBadges({ user = null, pro = false, trial = null } = {}) {
  document.querySelectorAll('a.img-link').forEach((link) => {
    const label = link.querySelector('.img-label')?.textContent.trim() || link.querySelector('img')?.alt || '';
    const toolId = DOWNLOAD_TOOL_IDS.get(label);
    let badge = link.querySelector('.ontdek-card-downloads');
    if (!toolId) { badge?.remove(); return; }
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'ontdek-card-downloads';
      link.appendChild(badge);
    }
    if (pro) {
      badge.textContent = 'PRO · onbeperkt downloaden';
      badge.dataset.status = 'pro';
      return;
    }
    if (!user || !trial) {
      badge.textContent = 'PDF · 3/3 na gratis login';
      badge.dataset.status = 'login';
      return;
    }
    const limiet = Number(trial.toolLimit || 3);
    const gebruikt = Math.max(0, Number(trial.byTool?.[toolId] || 0));
    const over = Math.max(0, limiet - gebruikt);
    badge.textContent = `PDF · ${over}/${limiet} over`;
    badge.dataset.status = over > 0 ? 'goed' : 'op';
  });
}

const main = document.querySelector('.main');
const search = document.getElementById('proToolSearch');
const resultCount = document.getElementById('proSearchCount');
const welcome = document.getElementById('proStartWelcome');
const back = document.getElementById('categoryBack');
const noResults = document.getElementById('proNoResults');
const CATEGORY_KEY = 'zisa-ontdek-laatste-categorie';
const VALID_CATEGORIES = new Set(['reken', 'taal', 'puzzels', 'creatief', 'spel', 'tijd', 'klasmanagement']);
let lastCategory = VALID_CATEGORIES.has(sessionStorage.getItem(CATEGORY_KEY)) ? sessionStorage.getItem(CATEGORY_KEY) : 'overview';

function setActive(target) {
  document.querySelectorAll('.nav-btn').forEach(button => button.classList.toggle('active', button.dataset.target === target));
}

function overview(remember = true) {
  main.classList.remove('category-open', 'search-open');
  document.querySelectorAll('.section-panel').forEach(panel => { panel.classList.remove('active'); panel.style.display = ''; });
  document.querySelectorAll('a.img-link').forEach(link => link.classList.remove('tool-hidden'));
  welcome.classList.remove('hidden');
  back.classList.remove('visible');
  noResults.classList.remove('visible');
  resultCount.textContent = '';
  setActive('overview');
  if (remember) {
    lastCategory = 'overview';
    sessionStorage.setItem(CATEGORY_KEY, 'overview');
  }
}

function category(target, remember = true) {
  const panel = document.getElementById(`panel-${target}`);
  if (!panel) return;
  main.classList.add('category-open');
  main.classList.remove('search-open');
  document.querySelectorAll('.section-panel').forEach(item => { item.classList.remove('active'); item.style.display = ''; });
  panel.classList.add('active');
  welcome.classList.add('hidden');
  back.classList.add('visible');
  setActive(target);
  main.scrollTop = 0;
  if (remember) {
    lastCategory = target;
    sessionStorage.setItem(CATEGORY_KEY, target);
  }
}

const VERNIEUWDE_KNOPPEN = new Set(['sudoku','zoek_de_verschillen','doolhof','slangendoolhof','hexagon','schaduw','pixelart','coderen','punttekening','blokkenbouwsels','bouwplaat','plattegrond','bingo','vieropeenrij','rad','QR','werkblad_kloklezen','kalender','timer','planbord','takenbord','huistaken']);

document.querySelectorAll('a.img-link').forEach((link) => {
  const img = link.querySelector('.drukknop-afbeelding');
  if (img) {
    const filename = (img.getAttribute('src').split('/').pop() || '').replace(/\.webp$/i, '');
    if (VERNIEUWDE_KNOPPEN.has(filename)) img.src = `../drukknop_afbeeldingen_v3/${filename}.png`;
  }
  if (img && !img.parentElement.classList.contains('tool-image-stage')) {
    const stage = document.createElement('span');
    stage.className = 'tool-image-stage';
    img.parentNode.insertBefore(stage, img);
    stage.appendChild(img);
  }
  const category = link.closest('.section-panel')?.id.replace('panel-', '');
  if (category) link.querySelector('.tool-image-stage')?.classList.add(`stage-${category}`);
  const label = link.querySelector('.img-label')?.textContent.trim() || img?.alt || 'Tool';
  const description = toolDescriptions[label];
  if (description && !link.querySelector('.tool-description')) {
    const element = document.createElement('span');
    element.className = 'tool-description';
    element.textContent = description;
    link.appendChild(element);
  }
  if (BESCHIKBAAR.has(label)) {
    link.href = BESCHIKBAAR.get(label);
    link.removeAttribute('onclick');
    link.classList.add('ontdek-beschikbaar');
  } else {
    link.href = '#';
    link.removeAttribute('onclick');
    link.removeAttribute('target');
    link.classList.add('ontdek-nog-niet');
    link.addEventListener('click', (event) => {
      event.preventDefault();
      alert(`${label} wordt nog voorbereid voor de Ontdek-versie. In PRO is deze tool al volledig beschikbaar.`);
    });
  }
});

document.querySelectorAll('.nav-btn').forEach(button => button.addEventListener('click', () => {
  search.value = '';
  button.dataset.target === 'overview' ? overview() : category(button.dataset.target);
}));

back.addEventListener('click', () => { search.value = ''; overview(); });
search.addEventListener('input', () => {
  const query = search.value.trim().toLocaleLowerCase('nl');
  if (!query) {
    lastCategory === 'overview' ? overview(false) : category(lastCategory, false);
    return;
  }
  let visible = 0;
  main.classList.remove('category-open');
  main.classList.add('search-open');
  welcome.classList.add('hidden');
  back.classList.add('visible');
  setActive('');
  document.querySelectorAll('a.img-link').forEach(link => {
    const match = link.textContent.toLocaleLowerCase('nl').includes(query) || (link.querySelector('img')?.alt || '').toLocaleLowerCase('nl').includes(query);
    link.classList.toggle('tool-hidden', !match);
    if (match) visible += 1;
  });
  document.querySelectorAll('.section-panel').forEach(panel => {
    const hasResult = panel.querySelector('a.img-link:not(.tool-hidden)');
    panel.classList.remove('active');
    panel.style.display = hasResult ? 'flex' : 'none';
  });
  noResults.classList.toggle('visible', visible === 0);
  resultCount.textContent = `${visible} ${visible === 1 ? 'tool' : 'tools'} gevonden`;
});

const sidebarActions = document.createElement('div');
sidebarActions.className = 'ontdek-sidebar-actions';
sidebarActions.innerHTML = '<a class="ontdek-pro-cta" href="https://demo.jufzisa.be/#zg-prijzen" target="_blank" rel="noopener">⭐ PRO bekijken en kopen</a><a class="ontdek-terug" href="../pro/index.html">Ik heb al PRO</a><a class="ontdek-terug" href="https://demo.jufzisa.be/#zg-probeer">← Alle info en prijzen</a>';
document.querySelector('.sidebar').appendChild(sidebarActions);

const status = document.getElementById('status');
status.className = 'status ontdek-status';
status.innerHTML = '<span><strong>Ontdek-versie</strong> · dezelfde werkwijze als PRO</span><span class="ontdek-status-actions"><button type="button" class="ontdek-feedback-top">💡 Foutje of idee melden</button><span class="ontdek-account-zone"><button type="button" data-auth="registreren">Gratis account maken</button><button type="button" data-auth="aanmelden">Aanmelden</button></span></span>';
status.querySelectorAll('[data-auth]').forEach(button => button.addEventListener('click', () => window.openOntdekAuth?.(button.dataset.auth)));
status.querySelector('.ontdek-feedback-top').addEventListener('click', () => {
  document.getElementById('suggestOverlay').classList.add('open');
});
main.style.display = 'flex';
lastCategory === 'overview' ? overview(false) : category(lastCategory, false);

startOntdekAuth({
  onState: ({ user, pro, trial }) => {
    const zone = status.querySelector('.ontdek-account-zone');
    updateDownloadBadges({ user, pro, trial });
    if (!user) {
      zone.innerHTML = '<button type="button" data-auth="registreren">Gratis account maken</button><button type="button" data-auth="aanmelden">Aanmelden</button>';
      zone.querySelectorAll('[data-auth]').forEach(button => button.addEventListener('click', () => window.openOntdekAuth?.(button.dataset.auth)));
      return;
    }
    if (pro) {
      zone.innerHTML = `<span>${user.email || 'Aangemeld'} · <strong>PRO actief</strong></span><a href="../pro/app.html">Open PRO →</a>`;
      return;
    }
    const resterend = Number.isFinite(Number(trial?.totalRemaining)) ? Number(trial.totalRemaining) : 15;
    const totaal = Number.isFinite(Number(trial?.totalLimit)) ? Number(trial.totalLimit) : 15;
    zone.innerHTML = `<span>${user.email || 'Aangemeld'} · <strong>${resterend} van ${totaal} totale downloads over</strong></span><button type="button" id="ontdekLogout">Uitloggen</button>`;
    zone.querySelector('#ontdekLogout').addEventListener('click', () => window.ontdekSignOut?.());
  },
});
