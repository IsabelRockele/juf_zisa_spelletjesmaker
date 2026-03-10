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
    const isHerken       = blok.bewerking === 'herken-brug';
    const heeftAanvullen   = !isHerken && blok.hulpmiddelen?.includes('aanvullen');
    const heeftCompenseren = !isHerken && blok.hulpmiddelen?.includes('compenseren');
    const heeftHulp        = !isHerken && !heeftAanvullen && !heeftCompenseren && (blok.hulpmiddelen?.length > 0);
    const brugLabel = { met:'🌉 Met brug', zonder:'✅ Zonder brug', gemengd:'🔀 Gemengd' }[blok.brug] || '';
    const badgeTxt  = isHerken ? '🔦 Herken brug' : blok.bewerking === 'aftrekken' ? 'Aftrekken' : 'Optellen';
    let gridKlasse;
    if (isHerken)                                                          gridKlasse = 'herken-grid';
    else if (heeftAanvullen && blok.aanvullenVariant === 'met-schijfjes') gridKlasse = 'aanvullen-grid-2';
    else if (heeftAanvullen)                                               gridKlasse = 'aanvullen-grid-3';
    else if (heeftCompenseren)                                             gridKlasse = 'comp-grid';
    else if (heeftHulp)                                                    gridKlasse = 'hulp-grid';
    else                                                                   gridKlasse = '';

    const div = document.createElement('div');
    div.className  = 'preview-blok';
    div.dataset.id = blok.id;

    div.innerHTML = `
      <div class="preview-blok-header">
        <span class="blok-type-badge">${badgeTxt}</span>
        <span class="blok-niveau">Tot ${blok.niveau}</span>
        <span style="color:rgba(255,255,255,.6);font-size:12px;margin-left:4px;">${brugLabel}</span>
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
          ${blok.oefeningen.length} oefeningen · ${blok.config.oefeningstypes.join(', ')}
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

    /* ── Herken-brug ─────────────────────────────────────── */
    if (isHerken) {
      return `
        <div class="oefening-item oefening-herken">
          <div class="lamp-wrapper">
            <div class="lamp-kader">
              <img src="../afbeeldingen_hoofdrekenen/zisa_lamp.png" class="zisa-lamp" alt="Zisa"
                   onerror="this.style.display='none'"/>
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

  return { render, toonZinEditor };
})();
