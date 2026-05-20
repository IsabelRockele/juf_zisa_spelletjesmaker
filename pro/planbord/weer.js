// === WEER ===
// Weer-vak met actuele temperatuur via Open-Meteo API (gratis, geen key nodig)
// Locatie is instelbaar per vak via een ⚙ knop.

// Standaard locatie: Bornem (Belgium)
const WEER_STANDAARD_LOCATIE = {
  naam: 'Bornem',
  latitude: 51.10,
  longitude: 4.24,
};

// Cache per locatie zodat we niet bij elke render opnieuw fetchen
// Sleutel = "lat,lon" (afgerond op 2 decimalen), waarde = { temperatuur, weercode, opgehaald }
const _weerCachePerLocatie = new Map();
const CACHE_GELDIGHEID_MS = 10 * 60 * 1000; // 10 minuten

// === HTML VAN EEN WEER-VAK ===
function _maakWeerVakHTML() {
  return `
    <div class="vak-titel" contenteditable="true" data-placeholder="Titel...">${_escape('')}</div>
    <div class="weer-inhoud">
      <div class="weer-rij">
        <div class="weer-icoon-groot">⏳</div>
        <div class="weer-temperatuur">--°</div>
      </div>
      <div class="weer-omschrijving">aan het laden...</div>
      <div class="weer-locatie-label"></div>
    </div>
    <button class="weer-instellen" type="button" title="Locatie aanpassen">⚙</button>
  `;
}

// === INIT WEER-VAK ===
function _initWeer(vak) {
  // Initiële locatie: opgeslagen op vak, anders standaard
  if (!vak.dataset.weerLat) {
    vak.dataset.weerLat = WEER_STANDAARD_LOCATIE.latitude;
    vak.dataset.weerLon = WEER_STANDAARD_LOCATIE.longitude;
    vak.dataset.weerNaam = WEER_STANDAARD_LOCATIE.naam;
  }

  // Klik op weer-inhoud → vernieuwen
  const weerInhoud = vak.querySelector('.weer-inhoud');
  if (weerInhoud) {
    weerInhoud.title = 'Klik om te vernieuwen';
    weerInhoud.style.cursor = 'pointer';
    weerInhoud.addEventListener('click', (e) => {
      e.stopPropagation();
      _haalWeerOp(vak, true);
    });
    weerInhoud.addEventListener('mousedown', (e) => e.stopPropagation());
  }

  // Klik op ⚙ → locatie aanpassen
  const instelKnop = vak.querySelector('.weer-instellen');
  if (instelKnop) {
    instelKnop.addEventListener('mousedown', (e) => e.stopPropagation());
    instelKnop.addEventListener('click', (e) => {
      e.stopPropagation();
      _vraagWeerLocatie(vak);
    });
  }

  _toonLocatieLabel(vak);
  _haalWeerOp(vak, false);
}

// === LOCATIE-LABEL TONEN ===
function _toonLocatieLabel(vak) {
  const label = vak.querySelector('.weer-locatie-label');
  if (label) {
    label.textContent = vak.dataset.weerNaam || '';
  }
}

// === LOCATIE WIJZIGEN VIA PROMPT ===
async function _vraagWeerLocatie(vak) {
  const huidigeNaam = vak.dataset.weerNaam || '';
  const ingave = prompt(
    'Geef een stad of dorp in (België, Nederland of elders):',
    huidigeNaam
  );
  if (ingave === null) return; // geannuleerd
  const opgeschoond = ingave.trim();
  if (!opgeschoond) return;

  // Toon laad-status
  const icoon = vak.querySelector('.weer-icoon-groot');
  const temp = vak.querySelector('.weer-temperatuur');
  const omschr = vak.querySelector('.weer-omschrijving');
  if (icoon) icoon.textContent = '⏳';
  if (temp) temp.textContent = '--°';
  if (omschr) omschr.textContent = 'zoeken naar locatie...';

  try {
    const locatie = await _zoekLocatie(opgeschoond);
    if (!locatie) {
      alert(`Geen locatie gevonden voor "${opgeschoond}".\nProbeer een ander dorp of stad.`);
      _haalWeerOp(vak, false); // herstel vorige weergave
      return;
    }
    vak.dataset.weerLat = locatie.latitude;
    vak.dataset.weerLon = locatie.longitude;
    vak.dataset.weerNaam = locatie.naam;
    _toonLocatieLabel(vak);
    _haalWeerOp(vak, true);
  } catch (err) {
    console.warn('Kon locatie niet opzoeken:', err);
    alert('Kon de locatie niet opzoeken. Controleer je internetverbinding.');
    _haalWeerOp(vak, false);
  }
}

// === LOCATIE ZOEKEN VIA OPEN-METEO GEOCODING ===
async function _zoekLocatie(zoekterm) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(zoekterm)}&count=1&language=nl&format=json`;
  const respons = await fetch(url);
  if (!respons.ok) throw new Error('Geocoding netwerkfout');
  const data = await respons.json();
  if (!data.results || data.results.length === 0) return null;
  const r = data.results[0];
  // Maak een mooie naam: "Lier" of "Lier, België"
  let naam = r.name;
  if (r.country && r.country !== 'België' && r.country !== 'Belgium') {
    naam += `, ${r.country}`;
  }
  return { latitude: r.latitude, longitude: r.longitude, naam };
}

// === WEER OPHALEN ===
async function _haalWeerOp(vak, forceer) {
  const lat = parseFloat(vak.dataset.weerLat);
  const lon = parseFloat(vak.dataset.weerLon);
  if (isNaN(lat) || isNaN(lon)) return;

  // Cache-sleutel per locatie
  const cacheSleutel = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const nu = Date.now();
  const gecachet = _weerCachePerLocatie.get(cacheSleutel);

  if (!forceer && gecachet && (nu - gecachet.opgehaald < CACHE_GELDIGHEID_MS)) {
    _renderWeer(vak, gecachet);
    return;
  }

  // Toon laad-status
  const icoon = vak.querySelector('.weer-icoon-groot');
  const omschr = vak.querySelector('.weer-omschrijving');
  if (icoon) icoon.textContent = '⏳';
  if (omschr) omschr.textContent = 'aan het laden...';

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
    const respons = await fetch(url);
    if (!respons.ok) throw new Error('Netwerkfout: ' + respons.status);
    const data = await respons.json();
    if (!data.current) throw new Error('Onverwachte respons');

    const weergegevens = {
      temperatuur: Math.round(data.current.temperature_2m),
      weercode: data.current.weather_code,
      opgehaald: nu,
    };
    _weerCachePerLocatie.set(cacheSleutel, weergegevens);
    _renderWeer(vak, weergegevens);

    // Update andere weer-vakken die DEZELFDE locatie tonen
    document.querySelectorAll('.vak[data-vaktype="weer"]').forEach((ander) => {
      if (ander === vak) return;
      const aLat = parseFloat(ander.dataset.weerLat);
      const aLon = parseFloat(ander.dataset.weerLon);
      if (!isNaN(aLat) && !isNaN(aLon)) {
        const aSleutel = `${aLat.toFixed(2)},${aLon.toFixed(2)}`;
        if (aSleutel === cacheSleutel) _renderWeer(ander, weergegevens);
      }
    });
  } catch (err) {
    console.warn('Kon weer niet ophalen:', err);
    if (icoon) icoon.textContent = '❓';
    if (omschr) omschr.textContent = 'weer niet bekend';
    const temp = vak.querySelector('.weer-temperatuur');
    if (temp) temp.textContent = '--°';
  }
}

// === RENDER WEER ===
function _renderWeer(vak, data) {
  const icoon = vak.querySelector('.weer-icoon-groot');
  const temp = vak.querySelector('.weer-temperatuur');
  const omschr = vak.querySelector('.weer-omschrijving');

  const beschrijving = _weercodeNaarTekst(data.weercode);
  const emoji = _weercodeNaarEmoji(data.weercode);

  if (icoon) icoon.textContent = emoji;
  if (temp) temp.textContent = data.temperatuur + '°';
  if (omschr) omschr.textContent = beschrijving;
}

// === WEERCODE MAPPING (WMO codes van Open-Meteo) ===
function _weercodeNaarEmoji(code) {
  if (code === 0) return '☀️';
  if (code === 1) return '🌤️';
  if (code === 2) return '⛅';
  if (code === 3) return '☁️';
  if (code >= 45 && code <= 48) return '🌫️';
  if (code >= 51 && code <= 57) return '🌦️';
  if (code >= 61 && code <= 67) return '🌧️';
  if (code >= 71 && code <= 77) return '❄️';
  if (code >= 80 && code <= 82) return '🌧️';
  if (code >= 85 && code <= 86) return '🌨️';
  if (code >= 95) return '⛈️';
  return '🌤️';
}

function _weercodeNaarTekst(code) {
  if (code === 0) return 'helder';
  if (code === 1) return 'overwegend zonnig';
  if (code === 2) return 'half bewolkt';
  if (code === 3) return 'bewolkt';
  if (code >= 45 && code <= 48) return 'mistig';
  if (code === 51) return 'lichte motregen';
  if (code === 53) return 'motregen';
  if (code === 55) return 'dichte motregen';
  if (code === 56 || code === 57) return 'ijzel';
  if (code === 61) return 'lichte regen';
  if (code === 63) return 'regen';
  if (code === 65) return 'zware regen';
  if (code === 66 || code === 67) return 'ijzelregen';
  if (code === 71) return 'lichte sneeuw';
  if (code === 73) return 'sneeuw';
  if (code === 75) return 'zware sneeuw';
  if (code === 77) return 'sneeuwkorrels';
  if (code === 80) return 'lichte regenbuien';
  if (code === 81) return 'regenbuien';
  if (code === 82) return 'zware regenbuien';
  if (code === 85) return 'lichte sneeuwbuien';
  if (code === 86) return 'sneeuwbuien';
  if (code === 95) return 'onweer';
  if (code === 96 || code === 99) return 'onweer met hagel';
  return 'onbekend';
}