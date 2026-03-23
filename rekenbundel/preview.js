/* ══════════════════════════════════════════════════════════════
   preview.js — preview renderen
   ══════════════════════════════════════════════════════════════ */

const Preview = (() => {

  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function render(bundelData) {
    const container   = document.getElementById('preview-inhoud');
    const btnGenereer = document.getElementById('btn-genereer');
    const btnPdf      = document.getElementById('btn-pdf');
    const teller      = document.getElementById('blok-teller');

    teller.textContent = `${bundelData.length} blok${bundelData.length !== 1 ? 'ken' : ''}`;

    if (bundelData.length === 0) {
      container.innerHTML = `
        <div class="leeg-state">
          <div class="leeg-icon">📋</div>
          <div class="leeg-titel">Bundel is leeg</div>
          <div class="leeg-tekst">Configureer een blok in de zijbalk en klik op "Voeg blok toe".</div>
        </div>`;
      btnGenereer.disabled = true;
      btnPdf.disabled      = true;
      return;
    }

    btnGenereer.disabled = false;
    btnPdf.disabled      = false;
    container.innerHTML  = '';
    bundelData.forEach(blok => container.appendChild(_maakBlokElement(blok)));
    // Splitsbeen ankers positioneren onder hun doelgetal
    requestAnimationFrame(() => { _positioneerSplitsbenen(); _positioneerCompenseren(); });
  }

  function _maakBlokElement(blok) {
    const isHerken        = blok.bewerking === 'herken-brug';
    const isSplitsingen   = blok.bewerking === 'splitsingen';
    const isTafels        = blok.bewerking === 'tafels';
    const isTafelsInzicht = blok.bewerking === 'tafels-inzicht';
    const isGetallenlijn  = blok.bewerking === 'tafels-getallenlijn';
    const isCijferen      = blok.bewerking === 'cijferen';
    const isVraagstuk     = blok.bewerking === 'vraagstukken';

    // ── Vraagstuk: eigen renderer ────────────────────────────
    if (isVraagstuk) return _maakVraagstukElement(blok);
    const heeftAanvullen   = !isHerken && !isSplitsingen && !isTafels && !isTafelsInzicht && !isGetallenlijn && !isCijferen && blok.hulpmiddelen?.includes('aanvullen');
    const heeftCompenseren = !isHerken && !isSplitsingen && !isTafels && !isTafelsInzicht && !isGetallenlijn && !isCijferen && blok.hulpmiddelen?.includes('compenseren');
    const heeftHulp        = !isHerken && !isSplitsingen && !isTafels && !isTafelsInzicht && !isGetallenlijn && !isCijferen && !heeftAanvullen && !heeftCompenseren && (blok.hulpmiddelen?.length > 0);
    const brugLabel = { met:'🌉 Met brug', zonder:'✅ Zonder brug', gemengd:'🔀 Gemengd' }[blok.brug] || '';
    const badgeTxt  = isGetallenlijn  ? '〰️ Getallenlijn' :
                      isCijferen      ? `🧮 Cijferen` :
                      isTafelsInzicht ? '🔍 Inzicht' :
                      isTafels      ? '✖️ Tafels' :
                      isSplitsingen ? '✂️ Splits' :
                      isHerken ? '🔦 Herken brug' :
                      blok.bewerking === 'aftrekken' ? 'Aftrekken' : 'Optellen';
    const isPunt = isSplitsingen && blok.oefeningen[0]?.type === 'puntoefening';
    let gridKlasse;
    if (isPunt)                                                            gridKlasse = 'splits-grid punt-grid';
    else if (isGetallenlijn)                                               gridKlasse = 'gl-grid';
    else if (isTafelsInzicht)                                              gridKlasse = 'inzicht-grid';
    else if (isTafels)  { const eersteType = blok.oefeningen[0]?.type; gridKlasse = (eersteType === 'redeneren' || eersteType === 'koppel') ? 'tafels-grid tafels-grid-2kol' : 'tafels-grid'; }
    else if (isSplitsingen)                                                gridKlasse = 'splits-grid';
    else if (isHerken)                                                     gridKlasse = 'herken-grid';
    else if (heeftAanvullen && blok.aanvullenVariant === 'met-schijfjes') gridKlasse = 'aanvullen-grid-2';
    else if (heeftAanvullen)                                               gridKlasse = 'aanvullen-grid-3';
    else if (heeftCompenseren)                                             gridKlasse = 'comp-grid';
    else if (heeftHulp)                                                    gridKlasse = 'hulp-grid';
    else if (isCijferen)                                                   gridKlasse = (blok.config?.bewerking === 'delen' || blok.config?.bereik >= 1000 || blok.config?.schatting) ? 'cijferen-grid-3' : 'cijferen-grid';
    else                                                                   gridKlasse = '';

    const div = document.createElement('div');
    div.className  = 'preview-blok';
    div.dataset.id = blok.id;

    div.innerHTML = `
      <div class="preview-blok-header">
        <span class="blok-type-badge">${badgeTxt}</span>
        <span class="blok-niveau">Tot ${blok.niveau}</span>
        <span style="color:rgba(255,255,255,.6);font-size:12px;margin-left:4px;">${isSplitsingen ? '' : brugLabel}</span>
        <div class="spacer"></div>
        <div class="blok-acties">
          <button class="btn-blok-actie verwijder"
            onclick="App.verwijderBlok('${blok.id}')" title="Verwijder blok">✕</button>
        </div>
      </div>
      <div class="preview-blok-body">
        <div class="opdrachtzin-wrapper" id="zin-wrapper-${blok.id}">
          ${_zinWeergave(blok)}
        </div>
        <div class="oefeningen-grid ${gridKlasse}" id="grid-${blok.id}">
          ${blok.oefeningen.map((o, i) => _oefeningHTML(blok, o, i)).join('')}
        </div>
      </div>
      <div class="preview-blok-footer">
        <span class="footer-info">
          ${blok.oefeningen.length} oefeningen · ${blok.config?.bewerking ? blok.config.bewerking : ((blok.config?.oefeningstypes) || []).join(', ')}
        </span>
        <button class="btn-add-oef" onclick="App.voegOefeningToe('${blok.id}')">+ Oefening</button>
      </div>`;
    return div;
  }

  function _zinWeergave(blok) {
    return `
      <span class="opdrachtzin-tekst" id="zin-tekst-${blok.id}">${esc(blok.opdrachtzin)}</span>
      <button class="btn-bewerk-zin" onclick="App.bewerkZin('${blok.id}')" title="Bewerk">✏️</button>`;
  }

  function _oefeningHTML(blok, oef, idx) {
    const blokId        = blok.id;
    const isHerken      = blok.bewerking === 'herken-brug';
    const hulp          = blok.hulpmiddelen || [];
    const heeftSplits   = hulp.includes('splitsbeen');
    const heeftLijnen   = hulp.includes('schrijflijnen');
    const heeftAanvullen = hulp.includes('aanvullen');
    const splitspositie = blok.splitspositie || 'aftrekker';
    const bewerking     = blok.bewerking || 'optellen';
    const schrijflijnenAantal = blok.schrijflijnenAantal || 2;
    const aanvullenVariant = blok.aanvullenVariant || 'zonder-schema';

    /* ── Tafels inzicht ──────────────────────────────────── */
    if (blok.bewerking === 'tafels-inzicht') {
      return _inzichtOefeningHTML(blok.id, oef, idx);
    }

    /* ── Tafels getallenlijn ─────────────────────────────── */
    if (blok.bewerking === 'tafels-getallenlijn') {
      return _getallenlijnHTML(blok.id, oef, idx);
    }

    /* ── Cijferen ────────────────────────────────────────── */
    if (blok.bewerking === 'cijferen') {
      if (blok.config?.bewerking === 'delen') return _deelOefHTML(blok, oef, idx);
      if (blok.config?.bewerking === 'komma') return _kommaOefHTML(blok, oef, idx);
      return _cijferenOefHTML(blok, oef, idx);
    }

    /* ── Tafels ──────────────────────────────────────────── */
    if (blok.bewerking === 'tafels') {
      return _tafelOefeningHTML(blok.id, oef, idx);
    }

    /* ── Splitsingen ─────────────────────────────────────── */
    if (blok.bewerking === 'splitsingen') {
      return _splitsingHTML(blok.id, oef, idx);
    }

    /* ── Herken-brug ─────────────────────────────────────── */
    if (isHerken) {
      return `
        <div class="oefening-item oefening-herken">
          <div class="lamp-wrapper">
            <div class="lamp-kader">
              <img src="../afbeeldingen_hoofdrekenen/zisa_lamp.png" class="zisa-lamp" alt="Zisa"
                   crossOrigin="anonymous" onerror="this.style.display='none'"/>
            </div>
          </div>
          <span class="oef-tekst">${esc(oef.vraag)}</span>
          <span class="antwoord-vak"></span>
          <button class="btn-del-oef" onclick="App.verwijderOefening('${blokId}',${idx})" title="Verwijder">✕</button>
        </div>`;
    }

    /* ── Aanvullen ───────────────────────────────────────── */
    if (heeftAanvullen) {
      return _aanvullenHTML(blokId, oef, idx, aanvullenVariant);
    }

    /* ── Compenseren ─────────────────────────────────────── */
    const heeftCompenseren = hulp.includes('compenseren');
    if (heeftCompenseren) {
      const compenserenVariant = blok.compenserenVariant || 'met-tekens';
      const metVoorbeeld       = blok.metVoorbeeld || false;
      return _compenserenHTML(blokId, oef, idx, compenserenVariant, metVoorbeeld);
    }

    /* ── Gewone oefening zonder hulpmiddelen ─────────────── */
    if (!heeftSplits && !heeftLijnen) {
      return `
        <div class="oefening-item">
          <span class="oef-tekst">${esc(oef.vraag)}</span>
          <span class="antwoord-vak"></span>
          <button class="btn-del-oef" onclick="App.verwijderOefening('${blokId}',${idx})" title="Verwijder">✕</button>
        </div>`;
    }

    /* ── Oefening met splitsbeen / schrijflijnen ─────────── */
    let doelIdx = 0;
    if (heeftSplits) {
      if (bewerking === 'optellen') doelIdx = 2;
      else if (splitspositie === 'aftrekker') doelIdx = 2;
      else doelIdx = 0;
    }
    const somZonderIs = oef.vraag.replace(' =', '').trim();
    const woorden = somZonderIs.split(' ');
    const somHTML = woorden.map((w, i) =>
      (i === doelIdx && heeftSplits) ? `<span class="splits-doel">${esc(w)}</span>` : esc(w)
    ).join(' ') + ' =';
    const isAftrektal = heeftSplits && bewerking === 'aftrekken' && splitspositie === 'aftrektal';

    // Bereken splitsbeen info voor HTML én positionering
    const splDelen   = oef.vraag.replace(' =','').trim().split(' ');
    const splDoelIdx = (bewerking === 'optellen') ? 2 : (splitspositie === 'aftrekker' ? 2 : 0);
    const splGetal   = parseInt(splDelen[splDoelIdx]) || 0;
    const splIsHTE   = splGetal >= 100 && splGetal % 100 !== 0 && splGetal % 10 !== 0;
    const splAantal  = heeftSplits ? (splIsHTE ? 3 : 2) : 0;
    const boomKlasse = splAantal === 3 ? 'splitsbeen-boom splitsbeen-3' : 'splitsbeen-boom';
    const vakjesHTML = splAantal > 0 ? Array(splAantal).fill('<div class="splits-vak"></div>').join('') : '';

    return `
      <div class="oefening-item oefening-hulp${isAftrektal ? ' aftrektal-hulp' : ''}">
        <div class="hulp-som-rij">
          <span class="oef-tekst">${somHTML}</span>
          <span class="antwoord-vak" style="margin-left:4px;"></span>
        </div>
        ${heeftSplits ? `
        <div class="hulp-splits-rij" data-splits="${splAantal}">
          <div class="splitsbeen-anker">
            <div class="${boomKlasse}"></div>
            <div class="splitsbeen-vakjes">${vakjesHTML}</div>
          </div>
        </div>` : ''}
        ${heeftLijnen ? `
        <div class="hulp-schrijflijnen">
          ${Array(schrijflijnenAantal).fill('<div class="schrijflijn"></div>').join('')}
        </div>` : ''}
        <button class="btn-del-oef" onclick="App.verwijderOefening('${blokId}',${idx})" title="Verwijder">✕</button>
      </div>`;
  }

  /* ── Aanvullen HTML per variant ──────────────────────────── */
  function _aanvullenHTML(blokId, oef, idx, variant) {
    const delen  = oef.vraag.replace(' =', '').split(' ');
    const groot  = parseInt(delen[0]);
    const klein  = parseInt(delen[2]);
    const del    = `<button class="btn-del-oef" onclick="App.verwijderOefening('${blokId}',${idx})" title="Verwijder">✕</button>`;
    const hokje  = `<span class="invulhokje"></span>`;

    if (variant === 'zonder-schema') {
      return `
        <div class="oefening-item oefening-aanvullen aanvullen-zonder">
          <div class="aanvullen-rij">${groot} - ${klein} = ${hokje}</div>
          <div class="aanvullen-rij">${klein} + ${hokje} = ${groot}</div>
          ${del}
        </div>`;
    }

    if (variant === 'met-schema') {
      return `
        <div class="oefening-item oefening-aanvullen aanvullen-schema">
          <div class="aanvullen-sommen">
            <div class="aanvullen-rij">${groot} - ${klein} = ${hokje}</div>
            <div class="aanvullen-rij">${klein} + ${hokje} = ${groot}</div>
          </div>
          <div class="aanvullen-tabel">
            <div class="aanvullen-groot">${groot}</div>
            <div class="aanvullen-rij-onder">
              <div class="aanvullen-klein">${klein}</div>
              <div class="aanvullen-vraag">?</div>
            </div>
          </div>
          ${del}
        </div>`;
    }

    if (variant === 'met-schijfjes') {
      const hKlein = Math.floor(klein / 100);
      const tKlein = Math.floor((klein % 100) / 10);
      const eKlein = klein % 10;
      const hGroot = Math.floor(groot / 100);
      const tGroot = Math.floor((groot % 100) / 10);
      const eGroot = groot % 10;
      const schijfjesHTML = _schijfjesHTML(hKlein, tKlein, eKlein, hGroot, tGroot, eGroot);
      return `
        <div class="oefening-item oefening-aanvullen aanvullen-schijfjes">
          <div class="aanvullen-sommen">
            <div class="aanvullen-rij">${groot} - ${klein} = ${hokje}</div>
            <div class="aanvullen-rij">${klein} + ${hokje} = ${groot}</div>
          </div>
          <div class="schijfjes-tabel">${schijfjesHTML}</div>
          ${del}
        </div>`;
    }

    return '';
  }

  function _schijfjesHTML(hKlein, tKlein, eKlein, hGroot, tGroot, eGroot) {
    // Altijd 10 schijfjes per kolom
    // Voorgetekend (klein getal) = ingekleurd, rest = wit (kind kleurt bij)
    const TOTAAL = 10;
    const metH = hGroot > 0;  // H-kolom enkel bij tot 1000

    function schijfjesVoorKolom(aantalVoorgetekend, klas, getal) {
      const items = [];
      for (let i = 0; i < TOTAAL; i++) {
        items.push(i < aantalVoorgetekend
          ? `<div class="schijfje ${klas}">${getal}</div>`
          : `<div class="schijfje schijfje-leeg"></div>`);
      }
      const rijen = [];
      for (let r = 0; r < items.length; r += 5) {
        rijen.push(`<div class="schijfjes-rij">${items.slice(r, r + 5).join('')}</div>`);
      }
      return rijen.join('');
    }

    const hKolom = metH ? `
      <div class="schijfjes-kolom schijfjes-kolom-h">
        <div class="schijfjes-kop schijfjes-kop-h">H</div>
        ${schijfjesVoorKolom(hKlein, 'schijfje-h', 100)}
      </div>` : '';

    return `
      ${hKolom}
      <div class="schijfjes-kolom schijfjes-kolom-t">
        <div class="schijfjes-kop schijfjes-kop-t">T</div>
        ${schijfjesVoorKolom(tKlein, 'schijfje-t', 10)}
      </div>
      <div class="schijfjes-kolom schijfjes-kolom-e">
        <div class="schijfjes-kop schijfjes-kop-e">E</div>
        ${schijfjesVoorKolom(eKlein, 'schijfje-e', 1)}
      </div>`;
  }

  /* ── Compenseren HTML ───────────────────────────────────── */
  function _compenserenHTML(blokId, oef, idx, variant, metVoorbeeld) {
    const isVoorbeeldOef = metVoorbeeld && idx === 0;
    const del = `<button class="btn-del-oef" onclick="App.verwijderOefening('${blokId}',${idx})" title="Verwijder">&#x2715;</button>`;

    const delen       = oef.vraag.replace(' =', '').split(' ');
    const a           = parseInt(delen[0]);
    const compGetal   = oef.compenseerGetal;
    const compIsLinks = (a === compGetal);

    // Bij zelf-kringen: geen cirkel, geen pijl — kind doet alles zelf
    const zelfKringen = (variant === 'zelf-kringen') && !isVoorbeeldOef;

    // Kring of gewone tekst
    const kringId = `kring-${blokId}-${idx}`;
    const kringSpan = zelfKringen
      ? `<span>${esc(String(compGetal))}</span>`
      : `<span class="comp-kring" id="${kringId}">${esc(String(compGetal))}</span>`;

    // Bewerking
    const isAftrekken = oef.vraag.includes(' - ');

    // Pijl: verborgen bij zelf-kringen
    // Bij aftrekken altijd recht naar beneden (kring staat rechts, blokje links)
    const pijlChar = (compIsLinks || isAftrekken) ? '&darr;' : '&#x2199;';
    const pijlTonen = !zelfKringen;

    // Compenseerblokje — volgorde afhankelijk van bewerking
    let blokjeInhoud;
    if (isVoorbeeldOef) {
      if (isAftrekken) {
        blokjeInhoud = `<span class="comp-blokje-teken">&minus;</span><span class="comp-blokje-getal">${oef.tiental}</span><span class="comp-blokje-teken">+</span><span class="comp-blokje-getal">${oef.compenseerDelta}</span>`;
      } else {
        blokjeInhoud = `<span class="comp-blokje-teken">+</span><span class="comp-blokje-getal">${oef.tiental}</span><span class="comp-blokje-teken">&minus;</span><span class="comp-blokje-getal">${oef.compenseerDelta}</span>`;
      }
    } else if (variant === 'met-tekens') {
      if (isAftrekken) {
        blokjeInhoud = `<span class="comp-blokje-teken">&minus;</span><span class="comp-blokje-hokje"></span><span class="comp-blokje-teken">+</span><span class="comp-blokje-hokje"></span>`;
      } else {
        blokjeInhoud = `<span class="comp-blokje-teken">+</span><span class="comp-blokje-hokje"></span><span class="comp-blokje-teken">&minus;</span><span class="comp-blokje-hokje"></span>`;
      }
    } else {
      // zonder-tekens én zelf-kringen: 2 lege brede hokjes
      blokjeInhoud = `<span class="comp-blokje-hokje comp-blokje-hokje-breed"></span><span class="comp-blokje-hokje comp-blokje-hokje-breed"></span>`;
    }

    const antw  = isVoorbeeldOef ? String(oef.antwoord) : '';
    // Schrijflijnen: tekst staat boven de lijn (als label), lijn is de streep eronder
    const lijn1tekst = isVoorbeeldOef ? esc(oef.schrijflijn1) : '';
    const lijn2tekst = isVoorbeeldOef ? esc(oef.schrijflijn2) : '';

    // Layout:
    // - Som en pijl in een 2-kolom grid zodat pijl exact onder kring staat
    // - Bij compIsLinks: kring in kol1, rest in kol2 → pijl in kol1
    // - Bij !compIsLinks: prefix in kol1, kring+rest in kol2 → pijl in kol2
    // - Blokje staat altijd links op vaste plek (onder de pijl maar los ervan)
    // Bewerkingsteken: + bij optellen, − bij aftrekken
    const teken = isAftrekken ? ' - ' : ' + ';
    const somPrefix = compIsLinks ? '' : `${esc(String(oef.andereGetal))}${teken}`;
    const somSuffix = compIsLinks ? `${teken}${esc(String(oef.andereGetal))}` : '';

    return `
      <div class="oefening-item oefening-comp${isVoorbeeldOef ? ' comp-voorbeeld' : ''}">
        <div class="comp-grid">
          <div class="cg-pre">${somPrefix}</div>
          <div class="cg-k">${kringSpan}</div>
          <div class="cg-suf">${somSuffix} =</div>
          <div class="cg-av"><span class="antwoord-vak${isVoorbeeldOef ? ' antwoord-ingevuld' : ''}">${antw}</span></div>
          <div class="cg-pijl">${pijlTonen ? pijlChar : ''}</div>
          <div class="cg-blok"><div class="comp-blokje">${blokjeInhoud}</div></div>
        </div>
        <div class="comp-schrijf">
          <div class="comp-schrijflijn"><span class="comp-schrijf-tekst">${lijn1tekst}</span></div>
          <div class="comp-schrijflijn"><span class="comp-schrijf-tekst">${lijn2tekst}</span></div>
        </div>
        ${del}
      </div>`;
  }


  /* ══════════════════════════════════════════════════════════
     SPLITSINGEN HTML RENDERERS
  ══════════════════════════════════════════════════════════ */

  function _splitsingHTML(blokId, oef, idx) {
    const del = `<button class="btn-del-oef" onclick="App.verwijderOefening('${blokId}',${idx})" title="Verwijder">✕</button>`;
    if (oef.type === 'klein-splitshuis')       return _kleinsplitshuisHTML(blokId, oef, idx, del);
    if (oef.type === 'splitsbeen')             return _splitsbeenHTML(blokId, oef, idx, del);
    if (oef.type === 'groot-splitshuis')       return _grootsplitshuisHTML(blokId, oef, idx, del);
    if (oef.type === 'splitsbeen-bewerkingen') return _splitsbeenBewerkingHTML(blokId, oef, idx, del);
    if (oef.type === 'puntoefening')           return _puntoefHTML(blokId, oef, idx, del);
    return '';
  }

  /* ── Puntoefening ────────────────────────────────────────────
     1 + ___ = 5   of   ___ + 3 = 5   etc.
     null in tekst = schrijflijn
  ────────────────────────────────────────────────────────── */
  function _puntoefHTML(blokId, oef, idx, del) {
    const delen = (oef.tekst || []).map((d, i) => {
      if (typeof d === 'string') {
        return `<span class="punt-teken">${d}</span>`;
      }
      if (d === null) {
        return `<span class="punt-lijn"></span>`;
      }
      return `<span class="punt-getal">${d}</span>`;
    }).join('');

    return `
      <div class="oefening-item oefening-splits oefening-punt">
        <div class="punt-rij">${delen}</div>
        ${del}
      </div>`;
  }

  /* ── Klein splitshuis ───────────────────────────────────────
     Visueel:
                  ╱╲
                 / N \      ← dak: totaal (of leeg vakje)
                /____\
               |  a |+| b | ← kamers: één gegeven, één leeg
               |____|_|____|
  ────────────────────────────────────────────────────────── */
  function _kleinsplitshuisHTML(blokId, oef, idx, del) {
    const dakGegeven   = oef.totaal !== null;
    const linksGegeven = oef.links  !== null;
    const rechtsGegeven= oef.rechts !== null;

    const dakHTML = dakGegeven
      ? `<span class="sh-dak-getal">${oef.totaal}</span>`
      : `<span class="sh-vakje sh-vakje-dak"></span>`;

    const linksHTML = linksGegeven
      ? `<span class="sh-kamer-getal">${oef.links}</span>`
      : `<span class="sh-vakje sh-vakje-kamer"></span>`;

    const rechtsHTML = rechtsGegeven
      ? `<span class="sh-kamer-getal">${oef.rechts}</span>`
      : `<span class="sh-vakje sh-vakje-kamer"></span>`;

    return `
      <div class="oefening-item oefening-splits oefening-kleinsplitshuis">
        <div class="splitshuis-wrap">
          <div class="sh-dak">
            <div class="sh-dak-driehoek"></div>
            <div class="sh-dak-inhoud">${dakHTML}</div>
          </div>
          <div class="sh-muur">
            <div class="sh-kamer sh-kamer-l">${linksHTML}</div>
            <div class="sh-scheidingswand"></div>
            <div class="sh-kamer sh-kamer-r">${rechtsHTML}</div>
          </div>
        </div>
        ${del}
      </div>`;
  }

  /* ── Splitsbeen ─────────────────────────────────────────────
     Omgekeerde V:
          [ totaal ]        ← invulvakje of getal bovenaan
           /      \
       [links]  [rechts]   ← invulvakje of getal onderaan
  ────────────────────────────────────────────────────────── */
  function _splitsbeenHTML(blokId, oef, idx, del) {
    const top    = `<span class="sb-hokje">${oef.totaal !== null ? oef.totaal : ''}</span>`;
    const links  = `<span class="sb-hokje">${oef.links  !== null ? oef.links  : ''}</span>`;
    const rechts = `<span class="sb-hokje">${oef.rechts !== null ? oef.rechts : ''}</span>`;

    return `
      <div class="oefening-item oefening-splits oefening-splitsbeen">
        <div class="splitsbeen-wrap">
          <div class="sb-top">${top}</div>
          <svg class="sb-v-svg" viewBox="0 0 60 24" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <line x1="30" y1="0" x2="4" y2="24" stroke="#4A90D9" stroke-width="1.5"/>
            <line x1="30" y1="0" x2="56" y2="24" stroke="#4A90D9" stroke-width="1.5"/>
          </svg>
          <div class="sb-onder">
            <div class="sb-cel">${links}</div>
            <div class="sb-cel">${rechts}</div>
          </div>
        </div>
        ${del}
      </div>`;
  }

  /* ── Groot splitshuis ───────────────────────────────────────
     Één huis met alle splitsingen gestapeld als verdiepen.
     Afwisselend links/rechts leeg. Dak altijd ingevuld.
  ────────────────────────────────────────────────────────── */
  function _grootsplitshuisHTML(blokId, oef, idx, del) {
    const rijenHTML = (oef.rijen || []).map(rij => {
      const linksHTML  = rij.links  !== null ? `<span class="sh-kamer-getal">${rij.links}</span>`  : ``;
      const rechtsHTML = rij.rechts !== null ? `<span class="sh-kamer-getal">${rij.rechts}</span>` : ``;
      return `
        <div class="sh-muur-rij">
          <div class="sh-kamer sh-kamer-l">${linksHTML}</div>
          <div class="sh-scheidingswand"></div>
          <div class="sh-kamer sh-kamer-r">${rechtsHTML}</div>
        </div>`;
    }).join('');

    return `
      <div class="oefening-item oefening-splits oefening-grootsplitshuis">
        <div class="splitshuis-wrap">
          <div class="sh-dak">
            <div class="sh-dak-driehoek"></div>
            <div class="sh-dak-inhoud"><span class="sh-dak-getal">${oef.totaal}</span></div>
          </div>
          <div class="sh-muur sh-muur-groot">
            ${rijenHTML}
          </div>
        </div>
        ${del}
      </div>`;
  }

  /* ── Splitsbeen + 4 bewerkingen ─────────────────────────────
     Splitsbeen bovenaan, daarna 4 lege bewerkingen in kader.
     Kind vult alles zelf in.
  ────────────────────────────────────────────────────────── */
  function _splitsbeenBewerkingHTML(blokId, oef, idx, del) {
    const top    = `<span class="sb-hokje">${oef.totaal}</span>`;
    const links  = `<span class="sb-hokje">${oef.links  !== null ? oef.links  : ''}</span>`;
    const rechts = `<span class="sb-hokje">${oef.rechts !== null ? oef.rechts : ''}</span>`;

    const ops  = ['+', '+', '−', '−'];
    const rijenHTML = ops.map(op => `
      <div class="sbw-bewerking">
        <span class="sbw-vak"></span>
        <span class="sbw-op">${op}</span>
        <span class="sbw-vak"></span>
        <span class="sbw-is">=</span>
        <span class="sbw-vak"></span>
      </div>`).join('');

    return `
      <div class="oefening-item oefening-splits oefening-sbw">
        <div class="sbw-kader">
          <div class="splitsbeen-wrap sbw-been">
            <div class="sb-top">${top}</div>
            <svg class="sb-v-svg" viewBox="0 0 60 24" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <line x1="30" y1="0" x2="4" y2="24" stroke="#4A90D9" stroke-width="1.5"/>
              <line x1="30" y1="0" x2="56" y2="24" stroke="#4A90D9" stroke-width="1.5"/>
            </svg>
            <div class="sb-onder">
              <div class="sb-cel">${links}</div>
              <div class="sb-cel">${rechts}</div>
            </div>
          </div>
          <div class="sbw-bewerkingen">
            ${rijenHTML}
          </div>
        </div>
        ${del}
      </div>`;
  }

  function _positioneerSplitsbenen() {
    document.querySelectorAll('.splitsbeen-anker').forEach(anker => {
      const oefening  = anker.closest('.oefening-hulp');
      const doelEl    = oefening?.querySelector('.splits-doel');
      if (!doelEl) return;

      // Meet midden van splits-doel t.o.v. oefening-hulp (inclusief padding)
      const doelRect = doelEl.getBoundingClientRect();
      const oefRect  = oefening.getBoundingClientRect();
      const doelMidden = doelRect.left - oefRect.left + doelRect.width / 2;

      const boom   = anker.querySelector('.splitsbeen-boom');
      const isDrie = boom?.classList.contains('splitsbeen-3');
      const boomB  = isDrie ? 80 : 52;  // iets groter dan werkelijke breedte → schuift links

      // Zet anker absoluut t.o.v. hulp-splits-rij (die is position:relative)
      // splits-rij heeft dezelfde left als oefening (minus padding)
      // → gebruik dezelfde doelMidden maar corrigeer voor padding van oefening
      const splitsRij = anker.closest('.hulp-splits-rij');
      if (!splitsRij) return;
      const splitsRect = splitsRij.getBoundingClientRect();
      const links = doelRect.left - splitsRect.left + doelRect.width / 2 - boomB / 2;

      anker.style.position = 'relative';
      anker.style.marginLeft = Math.round(links) + 'px';
    });
  }

  function _positioneerCompenseren() {
    document.querySelectorAll('.comp-pijl-blokje').forEach(blokje => {
      const kringId = blokje.dataset.kringId;
      const kringEl = document.getElementById(kringId);
      const somWrapper = blokje.closest('.oefening-comp')?.querySelector('.comp-som-wrapper');
      if (!kringEl || !somWrapper) return;
      // Midden van de kring t.o.v. de som-wrapper
      const kringRect    = kringEl.getBoundingClientRect();
      const wrapperRect  = somWrapper.getBoundingClientRect();
      const kringMidden  = kringRect.left - wrapperRect.left + kringRect.width / 2;
      // Pijl-blokje: pijl is ~10px breed, zet linkerkant zodat midden van pijl = midden kring
      blokje.style.left = Math.round(kringMidden - 8) + 'px';
    });
  }

  function toonZinEditor(blokId, huidigeZin) {
    const wrapper = document.getElementById(`zin-wrapper-${blokId}`);
    wrapper.innerHTML = `
      <input class="opdrachtzin-input" id="zin-inp-${blokId}" value="${esc(huidigeZin)}" />
      <button class="btn-bewerk-zin" onclick="App.slaZinOp('${blokId}')">✅</button>`;
    document.getElementById(`zin-inp-${blokId}`).focus();
  }

  /* ── Inzicht oefening HTML ──────────────────────────────── */
  function _inzichtOefeningHTML(blokId, oef, idx) {
    const del = `<button class="btn-del-oef" onclick="App.verwijderOefening('${blokId}',${idx})" title="Verwijder">×</button>`;

    // ── Eerlijk verdelen: dispatch naar eigen renderers ───
    if (oef.type === 'verdelen-emoji')      return _verdelenEmojiHTML(blokId, oef, idx);
    if (oef.type === 'verdelen-splitshuis') return _verdelenSplitshuisHTML(blokId, oef, idx);
    if (oef.type === 'verdelen-100veld')    return _verdelen100VeldHTML(blokId, oef, idx);

    function emoKols(n) { return Math.min(5, Math.ceil(Math.sqrt(n))); }

    /* ── Delen met rest ──────────────────────────────────── */
    if (oef.type === 'delen-rest') {
      const cols = emoKols(oef.uitkomst);
      const colBreedte = 26;
      let alleEmojis = '';
      for (let i = 0; i < oef.uitkomst; i++) {
        alleEmojis += `<span class="inzicht-emoji">${oef.emoji}</span>`;
      }
      const emojiBlok = `<div class="inzicht-vakje inzicht-vakje-deel" style="grid-template-columns:repeat(${cols},${colBreedte}px);row-gap:8px;">${alleEmojis}</div>`;

      const aantalMin = oef.quotient; // aantal keer aftrekken
      const minStrepen = Array(aantalMin)
        .fill(`<span class="inzicht-lijn" style="width:20px"></span>`)
        .join('<span class="inzicht-min">−</span>');

      const zin1 = `<div class="inzicht-tekst-rij"><span class="inzicht-tekst">Er zijn</span><span class="inzicht-lijn" style="width:20px"></span><span class="inzicht-tekst">${oef.emojiLabel}.</span></div>`;
      const zin2 = `<div class="inzicht-tekst-rij"><span class="inzicht-tekst">Ik verdeel in groepen van</span><span class="inzicht-ingevuld">${oef.deler}</span><span class="inzicht-tekst">.</span></div>`;
      const aftrekRij = `<div class="inzicht-optel-rij">${oef.deeltal}<span class="inzicht-min" style="margin:0 3px">−</span>${minStrepen}<span class="inzicht-is">=</span><span class="inzicht-lijn" style="width:20px"></span></div>`;
      const zin3 = `<div class="inzicht-tekst-rij"><span class="inzicht-tekst">Ik kan</span><span class="inzicht-lijn" style="width:20px"></span><span class="inzicht-tekst">groepen maken.</span></div>`;
      const zin4 = `<div class="inzicht-tekst-rij"><span class="inzicht-tekst">Dan heb ik nog</span><span class="inzicht-lijn" style="width:20px"></span><span class="inzicht-tekst">${oef.emojiLabel} over.</span></div>`;
      const zin5 = `<div class="inzicht-tekst-rij"><span class="inzicht-tekst">Dat is de rest (R).</span></div>`;
      const deelRij = `<div class="inzicht-tekst-rij"><span class="inzicht-lijn" style="width:20px"></span><span class="inzicht-op">:</span><span class="inzicht-lijn" style="width:20px"></span><span class="inzicht-is">=</span><span class="inzicht-lijn" style="width:20px"></span><span class="inzicht-tekst" style="font-style:normal;font-weight:700">R</span><span class="inzicht-lijn" style="width:20px"></span></div>`;

      return `<div class="inzicht-oef inzicht-oef-deel" data-blok="${blokId}" data-idx="${idx}">
        ${del}
        <div class="inzicht-inner">
          <div class="inzicht-links">${emojiBlok}</div>
          <div class="inzicht-rechts">
            ${zin1}${zin2}${aftrekRij}${zin3}${zin4}${zin5}${deelRij}
          </div>
        </div>
      </div>`;
    }

    /* ── Delen als herhaalde aftrekking ──────────────────── */
    if (oef.type === 'delen-aftrekking') {
      const cols = emoKols(oef.uitkomst);
      const colBreedte = 26;
      let alleEmojis = '';
      for (let i = 0; i < oef.uitkomst; i++) {
        alleEmojis += `<span class="inzicht-emoji">${oef.emoji}</span>`;
      }
      const emojiBlok = `<div class="inzicht-vakje inzicht-vakje-deel" style="grid-template-columns:repeat(${cols},${colBreedte}px);row-gap:8px;">${alleEmojis}</div>`;

      const minStrepen = Array(oef.groepen)
        .fill(`<span class="inzicht-lijn" style="width:20px"></span>`)
        .join('<span class="inzicht-min">−</span>');
      const aftrekRij = `<div class="inzicht-optel-rij">${oef.uitkomst}<span class="inzicht-min" style="margin:0 3px">−</span>${minStrepen}<span class="inzicht-is">=</span><span class="inzicht-nul">0</span></div>`;

      const zin1 = `<div class="inzicht-tekst-rij"><span class="inzicht-tekst">Er zijn</span><span class="inzicht-lijn" style="width:20px"></span><span class="inzicht-tekst">${oef.emojiLabel}.</span></div>`;
      const zin2 = `<div class="inzicht-tekst-rij"><span class="inzicht-tekst">Ik maak groepen van</span><span class="inzicht-ingevuld">${oef.groepGrootte}</span><span class="inzicht-tekst">.</span></div>`;
      const zin3 = `<div class="inzicht-tekst-rij"><span class="inzicht-tekst">Ik kan</span><span class="inzicht-lijn" style="width:20px"></span><span class="inzicht-tekst">groepen maken.</span></div>`;
      const deelRij = `<div class="inzicht-tekst-rij"><span class="inzicht-lijn" style="width:20px"></span><span class="inzicht-op">:</span><span class="inzicht-ingevuld">${oef.groepGrootte}</span><span class="inzicht-is">=</span><span class="inzicht-lijn" style="width:20px"></span></div>`;

      return `<div class="inzicht-oef inzicht-oef-deel" data-blok="${blokId}" data-idx="${idx}">
        ${del}
        <div class="inzicht-inner">
          <div class="inzicht-links">${emojiBlok}</div>
          <div class="inzicht-rechts">
            ${zin1}${zin2}${aftrekRij}${zin3}${deelRij}
          </div>
        </div>
      </div>`;
    }

    // LINKS: groepjes, max 3 per rij
    const MAX_PER_RIJ = 3;
    let rijHTML = '';
    for (let start = 0; start < oef.groepen; start += MAX_PER_RIJ) {
      const n = Math.min(MAX_PER_RIJ, oef.groepen - start);
      let vakjes = '';
      for (let g = 0; g < n; g++) {
        const cols = emoKols(oef.groepGrootte);
        let emojis = '';
        for (let b = 0; b < oef.groepGrootte; b++) {
          emojis += `<span class="inzicht-emoji">${oef.emoji}</span>`;
        }
        vakjes += `<div class="inzicht-vakje" style="grid-template-columns:repeat(${cols},1fr)">${emojis}</div>`;
      }
      rijHTML += `<div class="inzicht-groepjes-rij">${vakjes}</div>`;
    }

    // Vaste korte lijnbreedte — altijd gelijk, ongeacht aantal groepen
    const lijnW = 20;
    const lijnStyle = `style="width:${lijnW}px"`;
    const lijnStyleSmal = `style="width:${lijnW}px"`;

    // Rij 1: lijn + lijn + ... = lijn(breed)
    const delen = Array(oef.groepen)
      .fill(`<span class="inzicht-lijn" ${lijnStyle}></span>`)
      .join('<span class="inzicht-plus">+</span>');
    const optelRij = `<div class="inzicht-optel-rij">${delen}<span class="inzicht-is">=</span><span class="inzicht-lijn breed"></span></div>`;

    // Rij 2: lijn groepen van lijn = lijn
    const groepVanRij = `<div class="inzicht-tekst-rij">
      <span class="inzicht-lijn" ${lijnStyle}></span>
      <span class="inzicht-tekst">groepen van</span>
      <span class="inzicht-lijn" ${lijnStyle}></span>
      <span class="inzicht-is">=</span>
      <span class="inzicht-lijn" ${lijnStyle}></span>
    </div>`;

    // Rij 3: lijn × lijn = lijn
    const vermRij = `<div class="inzicht-tekst-rij">
      <span class="inzicht-lijn" ${lijnStyle}></span>
      <span class="inzicht-op">×</span>
      <span class="inzicht-lijn" ${lijnStyle}></span>
      <span class="inzicht-is">=</span>
      <span class="inzicht-lijn" ${lijnStyle}></span>
    </div>`;

    return `<div class="inzicht-oef" data-blok="${blokId}" data-idx="${idx}">
      ${del}
      <div class="inzicht-inner">
        <div class="inzicht-links">
          <div class="inzicht-groepjes-wrap">${rijHTML}</div>
        </div>
        <div class="inzicht-rechts">
          ${optelRij}
          ${groepVanRij}
          ${vermRij}
        </div>
      </div>
    </div>`;
  }

  /* ── Eerlijk verdelen: emoji-variant ────────────────────── */
  function _verdelenEmojiHTML(blokId, oef, idx) {
    const del = `<button class="btn-del-oef" onclick="App.verwijderOefening('${blokId}',${idx})" title="Verwijder">×</button>`;
    function emoKols(n) { return Math.min(5, Math.ceil(Math.sqrt(n))); }

    // Alle emoji's in één blok (zoals delen-aftrekking)
    const cols = emoKols(oef.totaal);
    let alleEmojis = '';
    for (let i = 0; i < oef.totaal; i++) alleEmojis += `<span class="inzicht-emoji">${oef.emoji}</span>`;
    const emojiBlok = `<div class="inzicht-vakje inzicht-vakje-deel" style="grid-template-columns:repeat(${cols},26px);row-gap:8px;">${alleEmojis}</div>`;

    // 4 zinnen
    const zin1 = `<div class="inzicht-tekst-rij"><span class="inzicht-ingevuld">${oef.totaal}</span><span class="inzicht-tekst">eerlijk verdelen in</span><span class="inzicht-ingevuld">${oef.aantalGroepen}</span><span class="inzicht-tekst">is</span><span class="inzicht-lijn" style="width:20px"></span><span class="inzicht-tekst">.</span></div>`;
    const zin2 = `<div class="inzicht-tekst-rij"><span class="inzicht-lijn" style="width:20px"></span><span class="inzicht-tekst">verdeeld in</span><span class="inzicht-lijn" style="width:20px"></span><span class="inzicht-tekst">gelijke groepen is</span><span class="inzicht-lijn" style="width:20px"></span><span class="inzicht-tekst">.</span></div>`;
    const zin3 = `<div class="inzicht-tekst-rij"><span class="inzicht-lijn" style="width:20px"></span><span class="inzicht-tekst">gedeeld door</span><span class="inzicht-lijn" style="width:20px"></span><span class="inzicht-tekst">is</span><span class="inzicht-lijn" style="width:20px"></span><span class="inzicht-tekst">.</span></div>`;
    const zin4 = `<div class="inzicht-tekst-rij"><span class="inzicht-lijn" style="width:20px"></span><span class="inzicht-op">:</span><span class="inzicht-lijn" style="width:20px"></span><span class="inzicht-is">=</span><span class="inzicht-lijn" style="width:20px"></span></div>`;

    return `<div class="inzicht-oef inzicht-oef-deel" data-blok="${blokId}" data-idx="${idx}">
      ${del}
      <div class="inzicht-inner">
        <div class="inzicht-links">${emojiBlok}</div>
        <div class="inzicht-rechts">${zin1}${zin2}${zin3}${zin4}</div>
      </div>
    </div>`;
  }

  /* ── Eerlijk verdelen: splitshuis-variant ───────────────── */
  function _verdelenSplitshuisHTML(blokId, oef, idx) {
    const del = `<button class="btn-del-oef" onclick="App.verwijderOefening('${blokId}',${idx})" title="Verwijder">×</button>`;
    const n = oef.aantalGroepen;

    // Vaste vakje-breedte en gap in SVG-eenheden
    const VAK_B   = 36;   // breedte per vakje
    const GAP     = 4;    // gap tussen vakjes
    const PAD     = 10;   // padding links/rechts
    const SVG_B   = n * VAK_B + (n - 1) * GAP + PAD * 2;
    const SVG_H   = 24;
    const midX    = SVG_B / 2;

    const lijnen = Array.from({length: n}, (_, i) => {
      const vakMidX = PAD + i * (VAK_B + GAP) + VAK_B / 2;
      return `<line x1="${midX}" y1="0" x2="${vakMidX}" y2="${SVG_H}" stroke="#aaa" stroke-width="1.2"/>`;
    }).join('');

    const beenSVG = `<svg viewBox="0 0 ${SVG_B} ${SVG_H}" style="width:100%;height:${SVG_H}px;display:block;overflow:visible;">${lijnen}</svg>`;

    const vakjesHTML = Array(n).fill('<div class="vs-vakje"></div>').join('');
    const zin1 = `<div class="inzicht-tekst-rij" style="margin-top:8px"><span class="inzicht-ingevuld">${oef.totaal}</span><span class="inzicht-tekst">verdeeld in</span><span class="inzicht-ingevuld">${n}</span><span class="inzicht-tekst">gelijke delen is</span><span class="inzicht-lijn" style="width:22px"></span><span class="inzicht-tekst">.</span></div>`;
    const zin2 = `<div class="inzicht-tekst-rij"><span class="inzicht-ingevuld">${oef.totaal}</span><span class="inzicht-op">:</span><span class="inzicht-ingevuld">${n}</span><span class="inzicht-is">=</span><span class="inzicht-lijn" style="width:22px"></span></div>`;

    return `<div class="inzicht-oef inzicht-oef-splitshuis" data-blok="${blokId}" data-idx="${idx}">
      ${del}
      <div class="vs-huis-wrap">
        <div class="vs-top-vakje">${oef.totaal}</div>
        ${beenSVG}
        <div class="vs-vakjes-rij">${vakjesHTML}</div>
      </div>
      ${zin1}${zin2}
    </div>`;
  }

  /* ── Eerlijk verdelen: 100-veld-variant ─────────────────── */
  function _verdelen100VeldHTML(blokId, oef, idx) {
    const del = `<button class="btn-del-oef" onclick="App.verwijderOefening('${blokId}',${idx})" title="Verwijder">×</button>`;
    const KLEUREN = ['#E74C3C','#5DADE2','#2ECC71','#F39C12','#9B59B6','#1ABC9C','#E67E22','#EC407A','#00BCD4','#8BC34A'];
    const n = oef.aantalGroepen;   // aantal stroken (deler)
    const p = oef.perGroep;        // cellen per strook (quotient)
    // Bouw 10×10 grid
    let cellen = '';
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const celNr = r * 10 + c; // 0-based
        let kleur = '';
        // Kleur de eerste n×p cellen, elke strook van n cellen een andere kleur
        if (celNr < n * p) {
          const strook = Math.floor(celNr / n);
          kleur = `background:${KLEUREN[strook % KLEUREN.length]};opacity:0.75;`;
        }
        cellen += `<div class="veld100-cel" style="${kleur}"></div>`;
      }
    }
    const zin1 = `<div class="inzicht-tekst-rij" style="flex-wrap:wrap;gap:3px 4px;"><span class="inzicht-tekst">Hoeveel gekleurde hokjes zijn er?</span><span class="inzicht-lijn" style="width:28px"></span></div>`;
    const zin2 = `<div class="inzicht-tekst-rij" style="flex-wrap:wrap;gap:3px 4px;"><span class="inzicht-tekst">Met hoeveel stroken van</span><span class="inzicht-ingevuld">${n}</span><span class="inzicht-tekst">kun je die bedekken?</span><span class="inzicht-lijn" style="width:28px"></span></div>`;
    const zin3 = `<div class="inzicht-tekst-rij" style="flex-wrap:wrap;gap:3px 4px;"><span class="inzicht-tekst">Hoe dikwijls gaat</span><span class="inzicht-ingevuld">${n}</span><span class="inzicht-tekst">in</span><span class="inzicht-ingevuld">${oef.totaal}</span><span class="inzicht-tekst">?</span><span class="inzicht-lijn" style="width:28px"></span><span class="inzicht-tekst">keer.</span></div>`;

    return `<div class="inzicht-oef inzicht-oef-100veld" data-blok="${blokId}" data-idx="${idx}">
      ${del}
      <div class="veld100-wrap">
        <div class="veld100-grid">${cellen}</div>
        <div class="veld100-zinnen">${zin1}${zin2}${zin3}</div>
      </div>
    </div>`;
  }

  /* ── Tafels oefening HTML ───────────────────────────────── */
  function _tafelOefeningHTML(blokId, oef, idx) {
    const del = `<button class="btn-del-oef" onclick="App.verwijderOefening('${blokId}',${idx})" title="Verwijder">×</button>`;
    let somHTML = '';

    if (oef.type === 'vermenigvuldigen') {
      somHTML = `<span class="tafel-term">${oef.a}</span>
                 <span class="tafel-op">×</span>
                 <span class="tafel-term">${oef.b}</span>
                 <span class="tafel-is">=</span>
                 <span class="tafel-vak"></span>`;
    } else if (oef.type === 'gedeeld') {
      somHTML = `<span class="tafel-term">${oef.a}</span>
                 <span class="tafel-op">:</span>
                 <span class="tafel-term">${oef.b}</span>
                 <span class="tafel-is">=</span>
                 <span class="tafel-vak"></span>`;
    } else if (oef.type === 'ontbrekende-factor') {
      if (oef.positie === 'links') {
        somHTML = `<span class="tafel-vak"></span>
                   <span class="tafel-op">×</span>
                   <span class="tafel-term">${oef.b}</span>
                   <span class="tafel-is">=</span>
                   <span class="tafel-term">${oef.product}</span>`;
      } else {
        somHTML = `<span class="tafel-term">${oef.a}</span>
                   <span class="tafel-op">×</span>
                   <span class="tafel-vak"></span>
                   <span class="tafel-is">=</span>
                   <span class="tafel-term">${oef.product}</span>`;
      }
    } else if (oef.type === 'redeneren') {
      // deeltal : deler = ___ , want ___ × deler = ___  (kind vult alles in)
      somHTML = `<span class="tafel-term">${oef.deeltal}</span>
                 <span class="tafel-op">:</span>
                 <span class="tafel-term">${oef.deler}</span>
                 <span class="tafel-is">=</span>
                 <span class="tafel-vak tafel-vak-smal"></span>
                 <span class="tafel-want">, want</span>
                 <span class="tafel-vak tafel-vak-smal"></span>
                 <span class="tafel-op">×</span>
                 <span class="tafel-term">${oef.deler}</span>
                 <span class="tafel-is">=</span>
                 <span class="tafel-vak tafel-vak-smal"></span>`;
    } else if (oef.type === 'koppel') {
      // factor1 × factor2 = ___ , dus ___ : factor2 = ___
      somHTML = `<span class="tafel-term">${oef.factor1}</span>
                 <span class="tafel-op">×</span>
                 <span class="tafel-term">${oef.factor2}</span>
                 <span class="tafel-is">=</span>
                 <span class="tafel-vak tafel-vak-smal"></span>
                 <span class="tafel-want">, dus</span>
                 <span class="tafel-vak tafel-vak-smal"></span>
                 <span class="tafel-op">:</span>
                 <span class="tafel-term">${oef.factor2}</span>
                 <span class="tafel-is">=</span>
                 <span class="tafel-vak tafel-vak-smal"></span>`;
    }

    return `<div class=tafel-oef data-blok=${blokId} data-idx=${idx}>
      ${del}
      <div class=tafel-som>${somHTML}</div>
    </div>`;
  }

  /* ── Getallenlijn preview HTML ───────────────────────────── */
 function _getallenlijnHTML(blokId, oef, idx) {
  const { groepen, stap, uitkomst, variant, positie } = oef;
  const max = Math.max(uitkomst, 20);

  const vakjeW  = Math.max(18, Math.min(24, Math.floor(540 / (max + 2))));
  const lijnW   = (max + 1) * vakjeW;
  const isBogenBoven = variant === 'getekend';
  const isBogenOnder = variant === 'delen-getekend' || variant === 'delen-rest-getekend';
  const isBogen = isBogenBoven || isBogenOnder;
  const boogH   = isBogenBoven ? 34 : 0;
  const boogHOnder = isBogenOnder ? 30 : 0; // extra ruimte onder de lijn voor bogen
  const svgH    = boogH + 44 + boogHOnder;
  const totaalW = lijnW + 34;

  const vakjeY = boogH + 8;
  const vakjeH = 22;
  const asY    = vakjeY + vakjeH + 7;

  function middenVanGetal(n) {
    return n * vakjeW + vakjeW / 2;
  }

  let svgInhoud = '';

  // vakjes
  for (let n = 0; n <= max; n++) {
    const x = n * vakjeW;
    svgInhoud += `<rect x="${x}" y="${vakjeY}" width="${vakjeW - 1}" height="${vakjeH}" rx="1.5" ry="1.5" fill="#ffffff" stroke="#85B0C6" stroke-width="1"/>`;
    svgInhoud += `<text x="${x + (vakjeW - 1) / 2}" y="${vakjeY + 14}" text-anchor="middle" font-size="10" font-family="Arial, sans-serif" fill="#333333">${n}</text>`;
  }

  // onderlijn + pijl
  svgInhoud += `<line x1="${vakjeW / 2}" y1="${asY}" x2="${lijnW + 18}" y2="${asY}" stroke="#85B0C6" stroke-width="1.4"/>`;
  svgInhoud += `<polygon points="${lijnW + 24},${asY} ${lijnW + 17},${asY - 4} ${lijnW + 17},${asY + 4}" fill="#85B0C6"/>`;

  // boogjes vermenigvuldigen: links → rechts, boven de lijn
  if (variant === 'getekend') {
    const boogBasisY = vakjeY - 2;
    const ctrlLift   = 18;
    for (let g = 0; g < groepen; g++) {
      const x1 = middenVanGetal(g * stap);
      const x2 = middenVanGetal((g + 1) * stap);
      const midX = (x1 + x2) / 2;
      const ctrlY = boogBasisY - ctrlLift;
      svgInhoud += `<path d="M ${x1} ${boogBasisY} C ${x1 + (x2 - x1) * 0.22} ${ctrlY}, ${x1 + (x2 - x1) * 0.78} ${ctrlY}, ${x2} ${boogBasisY}" stroke="#444444" stroke-width="1.6" fill="none"/>`;
      svgInhoud += `<text x="${midX}" y="${ctrlY - 4}" text-anchor="middle" font-size="10" font-family="Arial, sans-serif" font-weight="700" fill="#333333">${stap}</text>`;
    }
  }

  // boogjes delen: rechts → links, ONDER de lijn
  if (variant === 'delen-getekend' || variant === 'delen-rest-getekend') {
    const boogBasisY = asY + 2;
    const ctrlLift   = 18;
    for (let g = 0; g < groepen; g++) {
      const vanGetal  = uitkomst - g * stap;
      const naarGetal = uitkomst - (g + 1) * stap;
      const x1 = middenVanGetal(vanGetal);
      const x2 = middenVanGetal(naarGetal);
      const midX = (x1 + x2) / 2;
      const ctrlY = boogBasisY + ctrlLift;
      svgInhoud += `<path d="M ${x1} ${boogBasisY} C ${x1 + (x2 - x1) * 0.22} ${ctrlY}, ${x1 + (x2 - x1) * 0.78} ${ctrlY}, ${x2} ${boogBasisY}" stroke="#1565C0" stroke-width="1.6" fill="none"/>`;
      svgInhoud += `<text x="${midX}" y="${ctrlY + 12}" text-anchor="middle" font-size="10" font-family="Arial, sans-serif" font-weight="700" fill="#1565C0">${stap}</text>`;
    }
  }

  let inhoudOnderaan = '';

  if (variant === 'getekend') {
    const delen = Array(groepen).fill(`<span class="gl-lijn"></span>`).join(`<span class="gl-plus">+</span>`);
    inhoudOnderaan = `
      <div class="gl-zin">
        <span>Ik zie</span>
        <span class="gl-lijn kort"></span>
        <span>sprongen van</span>
        <span class="gl-lijn kort"></span>
        <span>.</span>
      </div>
      <div class="gl-formule-rij">${delen}<span class="gl-eq">=</span><span class="gl-lijn breed"></span></div>
      <div class="gl-formule-rij">
        <span class="gl-lijn"></span><span class="gl-maal">×</span><span class="gl-lijn"></span>
        <span class="gl-eq">=</span><span class="gl-lijn breed"></span>
      </div>`;

  } else if (variant === 'delen-getekend') {
    // Zinnen onder de getallenlijn (bogen staan al in SVG)
    const minStrepen = Array(groepen).fill(`<span class="gl-lijn"></span>`).join(`<span class="gl-min">−</span>`);
    inhoudOnderaan = `
      <div class="gl-formule-rij">
        <span class="gl-getal-vast">${uitkomst}</span>
        <span class="gl-min">−</span>${minStrepen}
        <span class="gl-eq">=</span><span class="gl-nul">0</span>
      </div>
      <div class="gl-zin">
        <span>Ik kan</span><span class="gl-lijn kort"></span>
        <span>sprongen maken.</span>
      </div>
      <div class="gl-zin">
        <span class="gl-getal-vast">${stap}</span>
        <span>gaat</span><span class="gl-lijn kort"></span>
        <span>keer in</span>
        <span class="gl-getal-vast">${uitkomst}</span><span>.</span>
      </div>
      <div class="gl-formule-rij">
        <span class="gl-lijn"></span><span class="gl-maal">:</span>
        <span class="gl-lijn"></span><span class="gl-eq">=</span>
        <span class="gl-lijn"></span>
      </div>`;

  } else if (variant === 'delen-zelf') {
    // Aftrekrij met stap ingevuld — kind tekent sprongen en vult deelsom zelf in
    const minStrepen = Array(groepen)
      .fill(`<span class="gl-getal-vast" style="color:#1565C0">${stap}</span>`)
      .join(`<span class="gl-min">−</span>`);
    inhoudOnderaan = `
      <div class="gl-formule-rij">
        <span class="gl-getal-vast">${uitkomst}</span>
        <span class="gl-min">−</span>${minStrepen}
        <span class="gl-eq">=</span><span class="gl-lijn"></span>
      </div>
      <div class="gl-formule-rij">
        <span class="gl-lijn"></span><span class="gl-maal">:</span>
        <span class="gl-lijn"></span><span class="gl-eq">=</span>
        <span class="gl-lijn"></span>
      </div>`;

  } else if (variant === 'delen-rest-getekend') {
    const minStrepen = Array(groepen).fill(`<span class="gl-lijn"></span>`).join(`<span class="gl-min">−</span>`);
    inhoudOnderaan = `
      <div class="gl-formule-rij">
        <span class="gl-getal-vast">${uitkomst}</span>
        <span class="gl-min">−</span>${minStrepen}
        <span class="gl-eq">=</span><span class="gl-lijn"></span>
      </div>
      <div class="gl-zin">
        <span>Ik kan</span><span class="gl-lijn kort"></span>
        <span>sprongen van</span>
        <span class="gl-getal-vast" style="color:#1565C0">${stap}</span>
        <span>maken. Dan heb ik nog</span><span class="gl-lijn kort"></span><span>over.</span>
      </div>
      <div class="gl-formule-rij">
        <span class="gl-lijn"></span><span class="gl-maal">:</span>
        <span class="gl-lijn"></span><span class="gl-eq">=</span>
        <span class="gl-lijn"></span>
        <span class="gl-getal-vast">R</span>
        <span class="gl-lijn"></span>
      </div>`;

  } else if (variant === 'delen-rest-zelf') {
    const minStrepen = Array(groepen)
      .fill(`<span class="gl-getal-vast" style="color:#1565C0">${stap}</span>`)
      .join(`<span class="gl-min">−</span>`);
    inhoudOnderaan = `
      <div class="gl-formule-rij">
        <span class="gl-getal-vast">${uitkomst}</span>
        <span class="gl-min">−</span>${minStrepen}
        <span class="gl-eq">=</span><span class="gl-lijn"></span>
      </div>
      <div class="gl-zin">
        <span>Ik kan</span><span class="gl-lijn kort"></span>
        <span>sprongen van</span>
        <span class="gl-getal-vast" style="color:#1565C0">${stap}</span>
        <span>maken. Dan heb ik nog</span><span class="gl-lijn kort"></span><span>over.</span>
      </div>
      <div class="gl-formule-rij">
        <span class="gl-lijn"></span><span class="gl-maal">:</span>
        <span class="gl-lijn"></span><span class="gl-eq">=</span>
        <span class="gl-lijn"></span>
        <span class="gl-getal-vast">R</span>
        <span class="gl-lijn"></span>
      </div>`;

  } else {
    // vermenigvuldigen zelf tekenen
    const factor1 = positie === 'achteraan' ? groepen : stap;
    const factor2 = positie === 'achteraan' ? stap : groepen;
    const plusSlots = Math.max(groepen, 5);
    const langeLijnPx = Math.min(220, 110 + plusSlots * 18);
    inhoudOnderaan = `
      <div class="gl-formule-rij">
        <span class="gl-getal-vast">${factor1}</span>
        <span class="gl-maal">×</span>
        <span class="gl-getal-vast">${factor2}</span>
        <span class="gl-eq">=</span>
        <span class="gl-lijn breed" style="width:${langeLijnPx}px"></span>
        <span class="gl-eq">=</span>
        <span class="gl-lijn breed" style="width:34px"></span>
      </div>`;
  }

  // SVG hoogte aanpassen: bogen onder de lijn hebben extra ruimte nodig
  const svgHAangepast = isBogenOnder ? svgH : svgH;

  return `
    <div class="gl-oefening">
      <div class="gl-svg-wrapper">
        <svg width="${totaalW}" height="${svgHAangepast}" viewBox="0 0 ${totaalW} ${svgHAangepast}">${svgInhoud}</svg>
      </div>
      <div class="gl-formules">${inhoudOnderaan}</div>
    </div>`;
}

  /* ── Kommaschema HTML (E,t cijferen) ───────────────────────── */
  function _kommaOefHTML(blok, oef, idx) {
    const cfg      = blok.config || {};
    const ingevuld = cfg.invulling === 'ingevuld';

    const g1E = ingevuld ? esc(String(oef.g1E))  : '';
    const g1t = ingevuld ? esc(String(oef.g1t_)) : '';
    const g2E = ingevuld ? esc(String(oef.g2E))  : '';
    const g2t = ingevuld ? esc(String(oef.g2t_)) : '';

    const op     = esc(oef.operator);
    const g1Str  = esc(oef.g1Str);
    const g2Str  = esc(oef.g2Str);
    const startpijl = cfg.startpijl !== false;

    // Schema kolommen: T(groen) | E(geel) | komma(grijs smal) | t(lichtgeel)
    const hdrT    = '<td class="cij-hdr cij-tien">T</td>';
    const hdrE    = '<td class="cij-hdr cij-een">E</td>';
    const hdrKomma= '<td class="komma-kolom komma-hdr">,</td>';
    const hdrT2   = '<td class="cij-hdr komma-tien">t</td>';
    const leeg    = '<td class="cij-getal"></td>';
    const leegK   = '<td class="komma-kolom"></td>';

    function rij(tVal, eVal, tachtVal) {
      return '<tr>' +
        '<td class="cij-getal">' + tVal + '</td>' +
        '<td class="cij-getal">' + eVal + '</td>' +
        '<td class="komma-kolom komma-dot">,</td>' +
        '<td class="cij-getal">' + tachtVal + '</td>' +
      '</tr>';
    }

    const pijlHTML = startpijl
      ? '<div class="cij-startpijl"></div>'
      : '';

    return (
      '<div class="cij-oefening">' +
        '<button class="btn-del-oef" onclick="App.verwijderOefening(\'' + blok.id + '\',' + idx + ')" title="Verwijder">&#x2715;</button>' +
        '<div class="cij-vraag">' + g1Str + ' ' + op + ' ' + g2Str + ' =</div>' +
        '<div class="cij-schema-wrap">' +
          (oef.operator === '+' || oef.operator === '−'
            ? '<span class="cij-operator">' + op + '</span>' : '') +
          pijlHTML +
          '<table class="cij-schema komma-schema">' +
            '<thead><tr>' + hdrT + hdrE + hdrKomma + hdrT2 + '</tr></thead>' +
            '<tbody>' +
              '<tr><td class="komma-onthoud"></td><td class="komma-onthoud"></td><td class="komma-onthoud komma-kolom"></td><td class="komma-onthoud"></td></tr>' +
              rij('', g1E, g1t) +
              rij('', g2E, g2t) +
              '<tr><td class="cij-oplossing" colspan="4"></td></tr>' +
            '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>'
    );
  }

  /* ── Deelschema HTML (staartdeling TE÷E) ─────────────────── */
  function _deelOefHTML(blok, oef, idx) {
    const cfg      = blok.config || {};
    const ingevuld = cfg.invulling === 'ingevuld';
    const T = (ingevuld && oef.T !== undefined) ? esc(String(oef.T)) : '';
    const E = (ingevuld && oef.E !== undefined) ? esc(String(oef.E)) : '';
    const delerTxt = esc(String(oef.deler));
    const metRest = oef.restE > 0;
    const deeltal = esc(String(oef.deeltal));

    // Vraag bovenaan (zonder R bij zonder rest)
    const vraagHTML = metRest
      ? '<div class="deel-vraag">' + deeltal + ' : ' + delerTxt + ' = <span class="deel-lijn-antw"></span> R <span class="deel-lijn-antw"></span></div>'
      : '<div class="deel-vraag">' + deeltal + ' : ' + delerTxt + ' = <span class="deel-lijn-antw"></span></div>';

    const hdrT = '<td class="deel-hdr deel-T">T</td>';
    const hdrE = '<td class="deel-hdr deel-E">E</td>';
    const leeg = '<td class="deel-cel"></td>';
    const rij1T = ingevuld ? '<td class="deel-cel">' + T + '</td>' : leeg;
    const rij1E = ingevuld ? '<td class="deel-cel">' + E + '</td>' : leeg;

    // Links schema — 7 datarijen:
    // rij1: deeltal
    // rij2: leeg
    // rij3: eerste aftrek (dikke bovenlijn, min BOVEN die lijn)
    // rij4: leeg
    // rij5: leeg
    // rij6: tweede aftrek (dikke bovenlijn, min BOVEN die lijn)
    // rij7: eindrest
    const schema = (
      '<div class="deel-links">' +
        '<table class="deel-tabel">' +
          '<thead><tr>' + hdrT + hdrE + '</tr></thead>' +
          '<tbody>' +
            '<tr>' + rij1T + rij1E + '</tr>' +
            '<tr>' + leeg + leeg + '</tr>' +
            '<tr class="deel-aftrek-rij"><td class="deel-cel deel-min"></td>' + leeg + '</tr>' +
            '<tr>' + leeg + leeg + '</tr>' +
            '<tr>' + leeg + leeg + '</tr>' +
            '<tr class="deel-aftrek-rij"><td class="deel-cel deel-min"></td>' + leeg + '</tr>' +
            '<tr>' + leeg + leeg + '</tr>' +
          '</tbody>' +
        '</table>' +
      '</div>'
    );

    // Rechterschema: margin-top = 3 rijen (header+rij1+rij2)
    // schrijflijn op hoogte rij1 (deeltal) — met deler ingevuld indien nodig
    const schrijfInhoud = ingevuld ? delerTxt : '';
    const quotSchema = (
      '<div class="deel-rechts">' +
        '<div class="deel-schrijflijn"><span class="deel-deler-val">' + schrijfInhoud + '</span></div>' +
        '<table class="deel-tabel">' +
          '<thead><tr>' + hdrT + hdrE + '</tr></thead>' +
          '<tbody><tr>' + leeg + leeg + '</tr></tbody>' +
        '</table>' +
      '</div>'
    );

    return (
      '<div class="deel-oefening">' +
        '<button class="btn-del-oef" onclick="App.verwijderOefening(\'' + blok.id + '\',' + idx + ')" title="Verwijder">&#x2715;</button>' +
        vraagHTML +
        '<div class="deel-schema-wrap">' +
          schema +
          quotSchema +
        '</div>' +
      '</div>'
    );
  }

  /* ── Cijferschema HTML ────────────────────────────────────── */
  function _cijferenOefHTML(blok, oef, idx) {
    const cfg      = blok.config || {};
    const ingevuld = cfg.invulling === 'ingevuld';
    const metPijl  = cfg.startpijl !== false;
    const metSchat = cfg.schatting === true;
    const showH    = oef.showH;
    const op       = oef.operator;

    const vraag = `${oef.g1} ${op} ${oef.g2} = ?`;

    const schattingHTML = metSchat ? `
      <div class="cij-schatting-vak">
        <span class="cij-schat-label">Ik schat:</span>
        <span class="cij-schat-lijn"></span>
      </div>` : '';

    const pijlHTML = metPijl ? `<div class="cij-startpijl"></div>` : '';

    const hCelH = showH ? `<td class="cij-header cij-honderd">H</td>` : '';
    const hCelT = `<td class="cij-header cij-tien">T</td>`;
    const hCelE = `<td class="cij-header cij-een">E${pijlHTML}</td>`;

    const oCelH = showH ? `<td class="cij-onthoud cij-honderd"></td>` : '';
    const oCelT = `<td class="cij-onthoud cij-tien"></td>`;
    const oCelE = `<td class="cij-onthoud cij-een"></td>`;

    const g1H = showH ? `<td class="cij-getal">${ingevuld ? esc(oef.H1) : ''}</td>` : '';
    const g1T = `<td class="cij-getal">${ingevuld ? esc(oef.T1) : ''}</td>`;
    const g1E = `<td class="cij-getal">${ingevuld ? esc(oef.E1) : ''}</td>`;

    const g2H = showH ? `<td class="cij-getal">${ingevuld ? esc(oef.H2) : ''}</td>` : '';
    const g2T = `<td class="cij-getal">${ingevuld ? esc(oef.T2) : ''}</td>`;
    const g2E = `<td class="cij-getal">${ingevuld ? esc(oef.E2) : ''}</td>`;

    const opH = showH ? `<td class="cij-oplossing"></td>` : '';
    const opT = `<td class="cij-oplossing"></td>`;
    const opE = `<td class="cij-oplossing"></td>`;

    return `
      <div class="cij-oefening">
        <button class="btn-del-oef" onclick="App.verwijderOefening('${blok.id}',${idx})" title="Verwijder">&#x2715;</button>
        <div class="cij-vraag">${esc(vraag)}</div>
        ${schattingHTML}
        <div class="cij-schema-wrap">
          <div class="cij-operator">${esc(op)}</div>
          <table class="cij-schema">
            <thead><tr>${hCelH}${hCelT}${hCelE}</tr></thead>
            <tbody>
              <tr>${oCelH}${oCelT}${oCelE}</tr>
              <tr>${g1H}${g1T}${g1E}</tr>
              <tr>${g2H}${g2T}${g2E}</tr>
              <tr>${opH}${opT}${opE}</tr>
            </tbody>
          </table>
        </div>
      </div>`;
  }

  /* ── Vraagstuk blok renderer ─────────────────────────────── */
  function _maakVraagstukElement(blok) {
    const inst = blok.inst || blok.config || {};
    const metRooster = inst.schema?.includes('rooster');
    const metCijfer  = inst.schema?.includes('cijfer');
    const drieGetallen = inst.aantalGetallen === '3' || inst.aantalGetallen === 'gemengd';

    // Rooster HTML
    let roosterRijen = '';
    for (let r = 0; r < 8; r++) {
      let cellen = '';
      for (let k = 0; k < 12; k++) cellen += '<div class="vs-rooster-cel"></div>';
      roosterRijen += `<div class="vs-rooster-rij">${cellen}</div>`;
    }

    // Bewerking HTML
    let bewerkingHTML = '';
    if (metRooster || metCijfer) {
      if (drieGetallen) {
        bewerkingHTML = `<div class="vs-bewerking-blok">
          <div class="vs-bew-label">Bewerking:</div>
          <div class="vs-bew-stap">STAP 1</div><div class="vs-bew-lijn"></div>
          <div class="vs-bew-stap">STAP 2</div><div class="vs-bew-lijn"></div>
        </div>`;
      } else {
        bewerkingHTML = `<div class="vs-bewerking-blok">
          <div class="vs-bew-label">Bewerking:</div>
          <div class="vs-bew-lijn"></div><div class="vs-bew-lijn"></div><div class="vs-bew-lijn"></div>
        </div>`;
      }
    }

    // Cijferschema HTML — kolommen afleiden van niveau
    function bouwCijferSchemaPreview(headers, stap, aantalRijen) {
      if (!aantalRijen) aantalRijen = 4;
      const kleuren = {
        'TD':'#c8e6c9','D':'#ffcdd2','H':'#bbdefb','T':'#81c784','E':'#FFC107',
        ',':'#bbb','t':'#fff9c4','h':'#fff9c4','d':'#fff9c4'
      };
      const tekstKleuren = {
        'TD':'#1b5e20','D':'#b71c1c','H':'#0d47a1','T':'#1b5e20','E':'#e65100',
        ',':'#fff','t':'#f57f17','h':'#f57f17','d':'#f57f17'
      };
      const celB = headers.length > 5 ? '26px' : '32px';
      const gridCols = headers.map(h => h === ',' ? '14px' : celB).join(' ');
      const hdr = headers.map(h =>
        h === ',' ? `<div class="vs-cs-komma-header">,</div>`
        : `<div class="vs-cs-header" style="background:${kleuren[h]||'#eee'};color:${tekstKleuren[h]||'#333'};width:${celB}">${h}</div>`
      ).join('');
      const maakRij = (cls) => headers.map(h =>
        h === ',' ? `<div class="vs-cs-komma-cel ${cls||''}"></div>`
        : `<div class="vs-cs-cel ${cls||''}" style="width:${celB}"></div>`
      ).join('');
      const stapLabel = stap ? `<div class="vs-cs-staplabel">${stap}</div>` : '';
      // 6 datarijen: grijs + 5 wit met vette lijn na wit-2 en wit-4
      const dataRijen = aantalRijen === 6
        ? `${maakRij('vs-cs-grijs')}${maakRij('')}${maakRij('vs-cs-dik-onder')}${maakRij('')}${maakRij('vs-cs-dik-onder')}${maakRij('')}`
        : `${maakRij('vs-cs-grijs')}${maakRij('')}${maakRij('vs-cs-dik-onder')}${maakRij('')}`;
      return `<div class="vs-cijfer-schema-blok">${stapLabel}
        <div class="vs-cs-grid" style="grid-template-columns:${gridCols}">
          ${hdr}${dataRijen}
        </div></div>`;
    }

    function kolomsVoorNiveau(inst) {
      console.log('[preview] kolomsVoorNiveau inst.bewerking=', inst.bewerking, 'inst.vermBereik=', inst.vermBereik, 'inst.niveau=', inst.niveau);
      const n = inst.niveau;
      // Bij vermenigvuldigen: kolommen bepalen op basis van bereik
      if (inst.bewerking === 'vermenigvuldigen') {
        const vb = inst.vermBereik || 'exe';
        if (vb === 'htexte' || vb === 'htexe')  return ['D','H','T','E'];
        if (vb === 'texte'  || vb === 'txte')   return ['D','H','T','E'];
        if (vb === 'texe'   || vb === 'txe')    return ['H','T','E'];
        return ['T','E']; // exe
      }
      if (n === 'kommagetallen') {
        const prefix = inst.kommaPrefix || 'E';
        const dec    = inst.kommaDecimalen || 't';
        const pk = { 'E':[], 'TE':['T'], 'HTE':['H','T'] };
        const dk = { 't':['t'], 'th':['t','h'], 'thd':['t','h','d'] };
        return [...(pk[prefix]||[]), 'E', ',', ...(dk[dec]||['t'])];
      }
      if (n === 'tot100000') return ['TD','D','H','T','E'];
      if (n === 'tot10000')  return ['D','H','T','E'];
      if (n === 'tot1000')   return ['H','T','E'];
      if (n === 'tot100')    return ['T','E'];
      return ['E'];
    }

    function deelBereikInfo(bereik) {
      switch(bereik) {
        case 'tee':   return { links:['T','E'],         rechts:['E'],         rijenLinks:4, deler:'E'  };
        case 'htee':  return { links:['H','T','E'],     rechts:['T','E'],     rijenLinks:5, deler:'E'  };
        case 'dhtee': return { links:['D','H','T','E'], rechts:['H','T','E'], rijenLinks:6, deler:'E'  };
        case 'tete':  return { links:['T','E'],         rechts:['E'],         rijenLinks:4, deler:'TE' };
        case 'htete': return { links:['H','T','E'],     rechts:['T','E'],     rijenLinks:5, deler:'TE' };
        default:      return { links:['T','E'],         rechts:['E'],         rijenLinks:4, deler:'E'  };
      }
    }

    function bouwDeelSchema(deelBereik, metRest) {
      const dk = deelBereikInfo(deelBereik || 'tee');
      const kleuren = { 'D':'#ffcdd2','H':'#bbdefb','T':'#81c784','E':'#FFC107' };
      const tekstK  = { 'D':'#b71c1c','H':'#0d47a1','T':'#1b5e20','E':'#e65100' };
      const celB = '32px';
      const maakHeader = (cols) => cols.map(k =>
        `<div class="vs-cs-header" style="background:${kleuren[k]||'#eee'};color:${tekstK[k]||'#333'};width:${celB}">${k}</div>`
      ).join('');
      const maakRij = (cols) => cols.map(() =>
        `<div class="vs-cs-cel" style="width:${celB}"></div>`
      ).join('');
      const gridL = dk.links.map(() => celB).join(' ');
      const gridR = dk.rechts.map(() => celB).join(' ');
      let linksRijen = '';
      for (let r = 0; r < dk.rijenLinks; r++) {
        linksRijen += `<div class="vs-cs-grid" style="grid-template-columns:${gridL}">${maakRij(dk.links)}</div>`;
      }
      const linksHTML = `<div class="vs-cs-grid" style="grid-template-columns:${gridL}">${maakHeader(dk.links)}</div>${linksRijen}`;
      const restRij = metRest
        ? `<div style="display:flex;align-items:center;gap:4px;margin-top:5px;padding-left:2px"><span style="font-size:11px;font-weight:700;color:#444">R =</span><div style="flex:1;border-bottom:1.5px solid #666;min-width:36px;height:14px"></div></div>`
        : '';
      const rechtsHTML = `<div style="padding-top:${celB}"></div><div class="vs-cs-grid" style="grid-template-columns:${gridR}">${maakHeader(dk.rechts)}</div><div class="vs-cs-grid" style="grid-template-columns:${gridR}">${maakRij(dk.rechts)}</div>${restRij}`;
      return `<div class="vs-deel-schema-wrap"><div class="vs-deel-links">${linksHTML}</div><div class="vs-deel-lijn"></div><div class="vs-deel-rechts">${rechtsHTML}</div></div>`;
    }

    // Aantal datarijen bepalen op basis van bermBereik
    const nRijen = ['txte','texte','htexte'].includes(inst.vermBereik || '') ? 6 : 4;

    let cijferHTML = '';
    if (metCijfer) {
      if (inst.bewerking === 'delen') {
        cijferHTML = `<div class="vs-cijfer-label">Ik cijfer.</div>${bouwDeelSchema(inst.deelBereik, inst.deelRest === 'ja')}`;
      } else {
        const headers = kolomsVoorNiveau(inst);
        if (drieGetallen) {
          cijferHTML = `<div class="vs-cijfer-label">Ik cijfer.</div><div class="vs-cijfer-stappen">${bouwCijferSchemaPreview(headers,'STAP 1',nRijen)}${bouwCijferSchemaPreview(headers,'STAP 2',nRijen)}</div>`;
        } else {
          cijferHTML = `<div class="vs-cijfer-label">Ik cijfer.</div>${bouwCijferSchemaPreview(headers,'',nRijen)}`;
        }
      }
    }

    // Antwoordzin
    const antwoordHTML = blok.antwoordzin
      ? `<div class="vs-antwoordzin-rij"><span class="vs-antw-label">Antwoordzin:</span><span class="vs-antw-tekst">${esc(blok.antwoordzin)}</span></div>`
      : `<div class="vs-antwoordzin-rij"><span class="vs-antw-label">Antwoordzin:</span><div class="vs-antw-lijn"></div></div>`;

    // Schema zone
    const heeftSchema = metRooster || metCijfer;
    const schemaZone = heeftSchema ? `
      <div class="vs-schema-zone">
        ${metRooster ? `<div class="vs-schema-links">
          <div class="vs-schema-label">Schema:</div>
          <div class="vs-rooster">${roosterRijen}</div>
          ${!metCijfer ? bewerkingHTML : ''}
        </div>` : ''}
        <div class="vs-schema-rechts">
          ${!metRooster && metCijfer ? bewerkingHTML : ''}
          ${metRooster && metCijfer ? bewerkingHTML : ''}
          ${cijferHTML}
        </div>
      </div>` : '';

    const div = document.createElement('div');
    div.className  = 'preview-blok';
    div.dataset.id = blok.id;
    div.innerHTML = `
      <div class="preview-blok-header">
        <span class="blok-type-badge">📖 Vraagstuk</span>
        <span class="blok-niveau">${inst.niveau || ''}</span>
        <div class="spacer"></div>
        <div class="blok-acties">
          <button class="btn-blok-actie verwijder"
            onclick="App.verwijderBlok('${blok.id}')" title="Verwijder blok">✕</button>
        </div>
      </div>
      <div class="preview-blok-body">
        <div class="vs-kaart" style="max-width:100%">
          <div class="vs-kaart-tekst">${(blok.vraagstuk||'').replace(/\n/g,'<br>')}</div>
          ${schemaZone}
          ${antwoordHTML}
        </div>
      </div>`;
    return div;
  }

  return { render, toonZinEditor };
})();