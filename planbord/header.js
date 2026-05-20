// === HEADER ===
// Live datum (en straks: weer ophalen via API)

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

function _initHeader() {
  _updateDatum();
  // Update om middernacht (eenvoudige timer: elk uur opnieuw controleren)
  setInterval(_updateDatum, 60 * 60 * 1000);
}
