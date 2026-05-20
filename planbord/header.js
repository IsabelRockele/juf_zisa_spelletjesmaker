// === HEADER ===
// Live datum + bewerkbare welkomtekst, kleur, tekstkleur

// Header-thema's: presets voor achtergrond
const HEADER_THEMAS = {
  zon:    { bg: 'linear-gradient(90deg, #FFE4B5 0%, #FFDAB5 100%)', border: '#f5c989', datum: '#854F0B' },
  paars:  { bg: 'linear-gradient(90deg, #EEEDFE 0%, #DCD8FA 100%)', border: '#CECBF6', datum: '#534AB7' },
  roze:   { bg: 'linear-gradient(90deg, #FBEAF0 0%, #F7D8E3 100%)', border: '#F4C0D1', datum: '#993556' },
  groen:  { bg: 'linear-gradient(90deg, #EAF3DE 0%, #D5E8BD 100%)', border: '#C0DD97', datum: '#3B6D11' },
  teal:   { bg: 'linear-gradient(90deg, #E1F5EE 0%, #BFE9D8 100%)', border: '#9FE1CB', datum: '#0F6E56' },
  blauw:  { bg: 'linear-gradient(90deg, #E6F1FB 0%, #C8DDF3 100%)', border: '#B5D4F4', datum: '#185FA5' },
  geel:   { bg: 'linear-gradient(90deg, #FAEEDA 0%, #F5D8AA 100%)', border: '#FAC775', datum: '#854F0B' },
  oranje: { bg: 'linear-gradient(90deg, #FAECE7 0%, #F2D2C7 100%)', border: '#F5C4B3', datum: '#993C1D' },
};

// Huidige instellingen — kunnen via modal aangepast worden
let _headerInstellingen = {
  tekst: 'Goedemorgen klas!',
  thema: 'zon',
  tekstkleur: '#633806',
};

function _updateDatum() {
  const dagen = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
  const maanden = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];

  const nu = new Date();
  const dag = dagen[nu.getDay()];
  const datum = nu.getDate();
  const maand = maanden[nu.getMonth()];
  const jaar = nu.getFullYear();

  const tekst = `${dag} ${datum} ${maand} ${jaar}`;
  const el = document.getElementById('bord-datum');
  if (el) el.textContent = tekst;
}

function _pasHeaderStijlToe() {
  const header = document.getElementById('bord-header');
  const tekstEl = document.getElementById('bord-welkom-tekst');
  const datumEl = document.getElementById('bord-datum');
  if (!header) return;

  const thema = HEADER_THEMAS[_headerInstellingen.thema] || HEADER_THEMAS.zon;
  header.style.background = thema.bg;
  header.style.borderBottomColor = thema.border;

  if (datumEl) datumEl.style.color = thema.datum;
  if (tekstEl) {
    tekstEl.textContent = _headerInstellingen.tekst;
    const welkom = document.getElementById('bord-welkom');
    if (welkom) welkom.style.color = _headerInstellingen.tekstkleur;
  }
}

function _initHeaderBewerker() {
  const header = document.getElementById('bord-header');
  const modal = document.getElementById('header-modal');
  if (!header || !modal) return;

  // Klik op header opent modal
  header.addEventListener('click', () => {
    // Vul huidige waarden in
    document.getElementById('header-tekst').value = _headerInstellingen.tekst;
    document.getElementById('header-tekstkleur').value = _headerInstellingen.tekstkleur;

    // Markeer huidige thema-knop
    document.querySelectorAll('#header-kleur-grid .kleur-knop').forEach((k) => {
      k.classList.toggle('actief', k.dataset.thema === _headerInstellingen.thema);
    });

    modal.classList.remove('verborgen');
  });

  // Annuleren
  document.getElementById('header-annuleer').addEventListener('click', () => {
    modal.classList.add('verborgen');
  });

  // Klik buiten modal sluit ook
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('verborgen');
  });

  // Thema-knoppen
  let gekozenThema = _headerInstellingen.thema;
  document.querySelectorAll('#header-kleur-grid .kleur-knop').forEach((knop) => {
    knop.addEventListener('click', () => {
      gekozenThema = knop.dataset.thema;
      document.querySelectorAll('#header-kleur-grid .kleur-knop').forEach((k) => {
        k.classList.toggle('actief', k === knop);
      });
    });
  });

  // OK / Toepassen
  document.getElementById('header-ok').addEventListener('click', () => {
    _headerInstellingen.tekst = document.getElementById('header-tekst').value.trim() || 'Goedemorgen klas!';
    _headerInstellingen.tekstkleur = document.getElementById('header-tekstkleur').value;
    _headerInstellingen.thema = gekozenThema;
    _pasHeaderStijlToe();
    modal.classList.add('verborgen');
  });
}

// Voor opslag/import
function getHeaderInstellingen() {
  return { ..._headerInstellingen };
}

function zetHeaderInstellingen(instellingen) {
  if (instellingen) {
    _headerInstellingen = { ..._headerInstellingen, ...instellingen };
    _pasHeaderStijlToe();
  }
}

function _initHeader() {
  _updateDatum();
  _pasHeaderStijlToe();
  _initHeaderBewerker();
  // Update om middernacht (eenvoudige timer: elk uur opnieuw controleren)
  setInterval(_updateDatum, 60 * 60 * 1000);
}
