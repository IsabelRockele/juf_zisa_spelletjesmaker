/* ─── PREVIEW.JS ─────────────────────────────────────────────────────────────
   Rendert rekendriehoeken als inline SVG.

   STRUCTUUR (zoals in echte rekendriehoeken):
     - Driehoek opgedeeld in 3 binnenvakken door 3 lijnen die LOPEN
       VAN HET ZWAARTEPUNT NAAR DE MIDDENS VAN ELKE ZIJDE (Y-vorm).
     - 3 binnenvakken: a (top), b (links onder), c (rechts onder)
     - 3 sommen op de zijden, BUITEN de driehoek
─────────────────────────────────────────────────────────────────────────── */

const Preview = (() => {

  const SVG_W = 240;
  const SVG_H = 240;
  const PAD_X = 30;
  const PAD_TOP = 25;
  const PAD_BOTTOM = 50;

  // Driehoek hoekpunten
  const TOP   = { x: SVG_W / 2,        y: PAD_TOP };
  const LEFT  = { x: PAD_X,            y: SVG_H - PAD_BOTTOM };
  const RIGHT = { x: SVG_W - PAD_X,    y: SVG_H - PAD_BOTTOM };

  // Zwaartepunt
  const CENTROID = {
    x: (TOP.x + LEFT.x + RIGHT.x) / 3,
    y: (TOP.y + LEFT.y + RIGHT.y) / 3
  };

  // Middens van de 3 zijden — Y-vorm: vanuit CENTROID naar deze 3 punten
  function midPoint(p1, p2) { return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }; }
  const MID_LEFT_SIDE   = midPoint(TOP, LEFT);
  const MID_RIGHT_SIDE  = midPoint(TOP, RIGHT);
  const MID_BOTTOM_SIDE = midPoint(LEFT, RIGHT);

  // Centra van de 3 binnenvakken
  const VAK_CENTRA = {
    a: {
      x: TOP.x,
      y: TOP.y + (CENTROID.y - TOP.y) * 0.55
    },
    b: {
      x: LEFT.x + (CENTROID.x - LEFT.x) * 0.55,
      y: LEFT.y - (LEFT.y - CENTROID.y) * 0.45
    },
    c: {
      x: RIGHT.x + (CENTROID.x - RIGHT.x) * 0.55,
      y: RIGHT.y - (RIGHT.y - CENTROID.y) * 0.45
    }
  };

  // Posities sommen — buiten de driehoek
  function offsetOutward(mid, center, offset) {
    const dx = mid.x - center.x, dy = mid.y - center.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    return { x: mid.x + (dx / len) * offset, y: mid.y + (dy / len) * offset };
  }

  const SOM_POSITIES = {
    sumAB: offsetOutward(MID_LEFT_SIDE,   CENTROID, 26),
    sumAC: offsetOutward(MID_RIGHT_SIDE,  CENTROID, 26),
    sumBC: offsetOutward(MID_BOTTOM_SIDE, CENTROID, 28)
  };

  function renderKlassiek(driehoek, nr, toonOplossing) {
    const w = driehoek.waarden;
    const g = driehoek.gegeven;

    // Buitendriehoek
    const triangleD = `M ${TOP.x} ${TOP.y} L ${LEFT.x} ${LEFT.y} L ${RIGHT.x} ${RIGHT.y} Z`;

    // Y-vorm binnenlijnen: vanuit zwaartepunt naar middens van zijden
    const internLijnen = `
      <line x1="${CENTROID.x}" y1="${CENTROID.y}" x2="${MID_LEFT_SIDE.x}"   y2="${MID_LEFT_SIDE.y}"   stroke="#2b4a65" stroke-width="1.4"/>
      <line x1="${CENTROID.x}" y1="${CENTROID.y}" x2="${MID_RIGHT_SIDE.x}"  y2="${MID_RIGHT_SIDE.y}"  stroke="#2b4a65" stroke-width="1.4"/>
      <line x1="${CENTROID.x}" y1="${CENTROID.y}" x2="${MID_BOTTOM_SIDE.x}" y2="${MID_BOTTOM_SIDE.y}" stroke="#2b4a65" stroke-width="1.4"/>
    `;

    // Render binnenvak (a, b, of c)
    function renderBinnenvak(key) {
      const p = VAK_CENTRA[key];
      const isGegeven = !!g[key];
      const waarde = w[key];

      if (isGegeven) {
        return `<text x="${p.x}" y="${p.y}" text-anchor="middle" dominant-baseline="middle"
                  font-family="Segoe UI, Arial, sans-serif" font-size="17" font-weight="700" fill="#0b4f99">${waarde}</text>`;
      }
      if (toonOplossing) {
        return `<g>
          <rect x="${p.x - 18}" y="${p.y - 11}" width="36" height="22" rx="4" fill="#edfaf3" stroke="#9bcdb3" stroke-width="1.2"/>
          <text x="${p.x}" y="${p.y}" text-anchor="middle" dominant-baseline="middle"
                font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="700" fill="#177a4e">${waarde}</text>
        </g>`;
      }
      // Leeg invulkader (binnen driehoek)
      return `<rect x="${p.x - 18}" y="${p.y - 11}" width="36" height="22" rx="4"
                fill="#ffffff" stroke="#9aaeb8" stroke-width="1.3" stroke-dasharray="2.5 2"/>`;
    }

    // Render som-vak (op zijde, buiten driehoek)
    function renderSomVak(key) {
      const p = SOM_POSITIES[key];
      const isGegeven = !!g[key];
      const waarde = w[key];

      if (isGegeven) {
        return `<text x="${p.x}" y="${p.y}" text-anchor="middle" dominant-baseline="middle"
                  font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="700" fill="#0b4f99">${waarde}</text>`;
      }
      if (toonOplossing) {
        return `<g>
          <rect x="${p.x - 18}" y="${p.y - 11}" width="36" height="22" rx="4" fill="#edfaf3" stroke="#9bcdb3" stroke-width="1.2"/>
          <text x="${p.x}" y="${p.y}" text-anchor="middle" dominant-baseline="middle"
                font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="700" fill="#177a4e">${waarde}</text>
        </g>`;
      }
      // Leeg invulkader (geen ?)
      return `<rect x="${p.x - 18}" y="${p.y - 11}" width="36" height="22" rx="4"
                fill="#ffffff" stroke="#9aaeb8" stroke-width="1.3" stroke-dasharray="2.5 2"/>`;
    }

    const wrap = document.createElement('div');
    wrap.className = 'driehoek-wrap';

    const nrLabel = document.createElement('div');
    nrLabel.className = 'driehoek-nr';
    nrLabel.textContent = `Driehoek ${nr}`;
    wrap.appendChild(nrLabel);

    wrap.innerHTML += `
      <svg class="driehoek-svg" viewBox="0 0 ${SVG_W} ${SVG_H}" xmlns="http://www.w3.org/2000/svg">
        <path d="${triangleD}" fill="#fafdff" stroke="#2b4a65" stroke-width="2" stroke-linejoin="round"/>
        ${internLijnen}
        ${renderBinnenvak('a')}
        ${renderBinnenvak('b')}
        ${renderBinnenvak('c')}
        ${renderSomVak('sumAB')}
        ${renderSomVak('sumAC')}
        ${renderSomVak('sumBC')}
      </svg>
    `;

    return wrap;
  }

  // ── MAGISCHE DRIEHOEK (cirkels, gelijke zijden) ────────────────────────
  // 6 cirkels: 3 op hoekpunten + 3 op middens van zijden
  const CIRKEL_R = 14;

  // Posities cirkels (op de driehoek-vorm zelf)
  const MAGISCH_POS = {
    H1:  { x: TOP.x,             y: TOP.y },
    H2:  { x: LEFT.x,            y: LEFT.y },
    H3:  { x: RIGHT.x,           y: RIGHT.y },
    M12: { x: MID_LEFT_SIDE.x,   y: MID_LEFT_SIDE.y },
    M13: { x: MID_RIGHT_SIDE.x,  y: MID_RIGHT_SIDE.y },
    M23: { x: MID_BOTTOM_SIDE.x, y: MID_BOTTOM_SIDE.y }
  };

  function renderMagisch(driehoek, nr, toonOplossing) {
    const opl = driehoek.oplossing;

    // Bepaal cirkelgrootte op basis van grootste cijfer
    const grootste = Math.max(...driehoek.cijferreeks);
    const aantalDigits = String(grootste).length;
    const cirkelR = aantalDigits === 1 ? 14
                  : aantalDigits === 2 ? 18
                  : aantalDigits === 3 ? 22
                  : 26;
    const fontSize = aantalDigits === 1 ? 15
                   : aantalDigits === 2 ? 14
                   : aantalDigits === 3 ? 13
                   : 11;

    // Buitendriehoek (lijnen lopen door de cirkels)
    const triangleD = `M ${TOP.x} ${TOP.y} L ${LEFT.x} ${LEFT.y} L ${RIGHT.x} ${RIGHT.y} Z`;

    function renderCirkel(key) {
      const p = MAGISCH_POS[key];
      const waarde = opl ? opl[key] : null;

      let inhoud = '';
      if (toonOplossing && waarde !== null) {
        inhoud = `<text x="${p.x}" y="${p.y}" text-anchor="middle" dominant-baseline="middle"
                    font-family="Segoe UI, Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="#177a4e">${waarde}</text>`;
      }

      return `
        <circle cx="${p.x}" cy="${p.y}" r="${cirkelR}"
                fill="${toonOplossing ? '#edfaf3' : '#ffffff'}"
                stroke="${toonOplossing ? '#9bcdb3' : '#2b4a65'}"
                stroke-width="1.6"/>
        ${inhoud}
      `;
    }

    const wrap = document.createElement('div');
    wrap.className = 'driehoek-wrap';

    const nrLabel = document.createElement('div');
    nrLabel.className = 'driehoek-nr';
    nrLabel.textContent = `Driehoek ${nr} • magisch`;
    wrap.appendChild(nrLabel);

    const cijfersTekst = driehoek.cijferreeks.join(', ');

    wrap.innerHTML += `
      <svg class="driehoek-svg" viewBox="0 0 ${SVG_W} ${SVG_H}" xmlns="http://www.w3.org/2000/svg">
        <path d="${triangleD}" fill="none" stroke="#2b4a65" stroke-width="2" stroke-linejoin="round"/>
        ${renderCirkel('H1')}
        ${renderCirkel('H2')}
        ${renderCirkel('H3')}
        ${renderCirkel('M12')}
        ${renderCirkel('M13')}
        ${renderCirkel('M23')}
      </svg>
      <div class="driehoek-cijfers">Vul in: <strong>${cijfersTekst}</strong></div>
    `;

    return wrap;
  }

  // ── DISPATCHER ──────────────────────────────────────────────────────────
  function renderDriehoek(driehoek, nr, toonOplossing) {
    if (driehoek.type === 'magisch') {
      return renderMagisch(driehoek, nr, toonOplossing);
    }
    return renderKlassiek(driehoek, nr, toonOplossing);
  }

  function render(driehoeken, toonOplossing) {
    const container = document.getElementById('previewContainer');
    container.innerHTML = '';
    driehoeken.forEach((d, idx) => {
      container.appendChild(renderDriehoek(d, idx + 1, toonOplossing));
    });
  }

  return { render };

})();
