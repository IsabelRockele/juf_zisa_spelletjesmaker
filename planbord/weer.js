// === WEER ===
// Weer-vak met actuele temperatuur via Open-Meteo API (gratis, geen key nodig)

// Standaard locatie: Bornem (Belgium)
const WEER_LOCATIE = {
  naam: 'Bornem',
  latitude: 51.10,
  longitude: 4.24,
};

// Cache zodat we niet bij elke render opnieuw fetchen
let _weerCache = null; // { temperatuur, weercode, opgehaald: timestamp }
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
    </div>
  `;
}

// === INIT WEER-VAK ===
function _initWeer(vak) {
  // Klik op weer-vak (niet op titel) herlaadt de gegevens
  const weerInhoud = vak.querySelector('.weer-inhoud');
  if (weerInhoud) {
    weerInhoud.title = 'Klik om te vernieuwen';
    weerInhoud.style.cursor = 'pointer';
    weerInhoud.addEventListener('click', (e) => {
      e.stopPropagation();
      _haalWeerOp(vak, true); // forceer verse data
    });
    weerInhoud.addEventListener('mousedown', (e) => e.stopPropagation());
  }
  _haalWeerOp(vak, false);
}

// === WEER OPHALEN ===
async function _haalWeerOp(vak, forceer) {
  // Gebruik cache indien recent en niet geforceerd
  const nu = Date.now();
  if (!forceer && _weerCache && (nu - _weerCache.opgehaald < CACHE_GELDIGHEID_MS)) {
    _renderWeer(vak, _weerCache);
    return;
  }

  // Toon laad-status
  const icoon = vak.querySelector('.weer-icoon-groot');
  const omschr = vak.querySelector('.weer-omschrijving');
  if (icoon) icoon.textContent = '⏳';
  if (omschr) omschr.textContent = 'aan het laden...';

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${WEER_LOCATIE.latitude}&longitude=${WEER_LOCATIE.longitude}&current=temperature_2m,weather_code&timezone=Europe%2FBrussels`;
    const respons = await fetch(url);
    if (!respons.ok) throw new Error('Netwerkfout: ' + respons.status);
    const data = await respons.json();
    if (!data.current) throw new Error('Onverwachte respons');

    _weerCache = {
      temperatuur: Math.round(data.current.temperature_2m),
      weercode: data.current.weather_code,
      opgehaald: nu,
    };
    _renderWeer(vak, _weerCache);
    // Update ook alle andere weer-vakken op het bord
    document.querySelectorAll('.vak[data-vaktype="weer"]').forEach((ander) => {
      if (ander !== vak) _renderWeer(ander, _weerCache);
    });
  } catch (err) {
    console.warn('Kon weer niet ophalen:', err);
    if (icoon) icoon.textContent = '❓';
    if (omschr) omschr.textContent = 'weer niet bekend';
    if (vak.querySelector('.weer-temperatuur')) {
      vak.querySelector('.weer-temperatuur').textContent = '--°';
    }
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
  if (code === 0) return '☀️';                    // helder
  if (code === 1) return '🌤️';                    // overwegend helder
  if (code === 2) return '⛅';                    // half bewolkt
  if (code === 3) return '☁️';                    // bewolkt
  if (code >= 45 && code <= 48) return '🌫️';      // mist
  if (code >= 51 && code <= 57) return '🌦️';      // motregen
  if (code >= 61 && code <= 67) return '🌧️';      // regen
  if (code >= 71 && code <= 77) return '❄️';      // sneeuw
  if (code >= 80 && code <= 82) return '🌧️';      // regenbuien
  if (code >= 85 && code <= 86) return '🌨️';      // sneeuwbuien
  if (code >= 95) return '⛈️';                    // onweer
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
