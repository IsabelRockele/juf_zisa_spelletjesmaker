/* ══════════════════════════════════════════════════════════════
   app.js
   Verantwoordelijkheid: centrale app-logica
   - Beheert de bundelData array (de enige bron van waarheid)
   - Verbindt de UI-acties met Generator, Preview en PdfEngine
   - Geen rekenlogica hier — Geen PDF-tekenlogica hier
   ══════════════════════════════════════════════════════════════ */

const App = (() => {

  let bundelData  = [];
  let actieveBewerking = 'optellen'; // 'optellen' of 'aftrekken'

  /* ── Toast ───────────────────────────────────────────────── */
  function toonToast(tekst, kleur = '#1A3A5C') {
    const t = document.getElementById('toast');
    t.textContent      = tekst;
    t.style.background = kleur;
    t.classList.add('zichtbaar');
    setTimeout(() => t.classList.remove('zichtbaar'), 2500);
  }

  /* ── Tab wisselen tussen optellen / aftrekken ────────────── */
  function toonBewerking(bewerking, tabEl) {
    actieveBewerking = bewerking;

    document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
    tabEl.classList.add('active');

    const isHerken = bewerking === 'herken-brug';

    // Sectietitel
    const titel = document.getElementById('sectie-titel');
    if (titel) {
      if (isHerken)               titel.textContent = 'Herken de brugoefening';
      else if (bewerking === 'aftrekken') titel.textContent = 'Configureer een aftrekblok';
      else                        titel.textContent = 'Configureer een optelblok';
    }

    // Standaard opdrachtzin
    const zinInp = document.getElementById('inp-opdrachtzin');
    if (zinInp) {
      if (isHerken)               zinInp.value = 'Kleur Zisa groen bij elke brugoefening.';
      else if (bewerking === 'aftrekken') zinInp.value = 'Trek af.';
      else                        zinInp.value = 'Reken vlug uit.';
    }

    // Niveau- en brugkaart verbergen bij herken-brug
    const kaartNiveau = document.getElementById('kaart-niveau');
    const kaartBrug   = document.getElementById('kaart-brug');
    if (kaartNiveau) kaartNiveau.style.display = isHerken ? 'none' : 'block';
    if (kaartBrug)   kaartBrug.style.display   = isHerken ? 'none' : 'block';
    _updateHulpmiddelenUI(isHerken ? 'zonder' : _getBrugWaarde());

    // Types laden
    const niveau = isHerken ? 100 : parseInt(document.querySelector('[name="niveau"]:checked')?.value || 20);
    const brug   = isHerken ? 'gemengd' : _getBrugWaarde();
    _updateTypesUI(niveau, brug);
  }

  /* ── Brug: hoofd- en subkeuze ───────────────────────────── */
  // Berekent de effectieve brugwaarde die de rest van de app gebruikt
  function _getBrugWaarde() {
    const niveau = parseInt(document.querySelector('[name="niveau"]:checked')?.value || 20);
    const hoofd  = document.querySelector('[name="brug-hoofd"]:checked')?.value || 'zonder';
    if (hoofd === 'zonder') return 'zonder';
    // Tot 1000: subkeuze bepaalt de exacte brugwaarde
    if (niveau >= 1000) {
      const sub = document.querySelector('[name="brug-sub"]:checked')?.value || 'naar-tiental';
      if (hoofd === 'met')  return sub;          // naar-tiental / naar-honderdtal / beide
      if (hoofd === 'beide') return 'gemengd';   // zonder én met brug door elkaar
    }
    // Tot 100: met brug = 'met', beide = 'gemengd'
    if (hoofd === 'met')   return 'met';
    if (hoofd === 'beide') return 'gemengd';
    return 'zonder';
  }

  // Schrijft de effectieve waarde terug naar het verborgen [name="brug"] input
  function _syncBrugInput() {
    const waarde = _getBrugWaarde();
    const verborgen = document.querySelector('[name="brug"]');
    if (verborgen) verborgen.value = waarde;
    return waarde;
  }

  function selecteerBrugHoofd(waarde, el) {
    document.querySelectorAll('[name="brug-hoofd"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    el.classList.add('geselecteerd');
    _updateBrugSubUI();
    const brug = _syncBrugInput();
    const niveau = parseInt(document.querySelector('[name="niveau"]:checked')?.value || 20);
    _updateTypesUI(niveau, brug);
    _updateHulpmiddelenUI(brug);
  }

  function selecteerBrugSub(waarde, el) {
    document.querySelectorAll('[name="brug-sub"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    el.classList.add('geselecteerd');
    const brug = _syncBrugInput();
    const niveau = parseInt(document.querySelector('[name="niveau"]:checked')?.value || 20);
    _updateTypesUI(niveau, brug);
    _updateHulpmiddelenUI(brug);
  }

  // Toont/verbergt de subkeuze-rij + past beschikbare sub-opties aan bij compenseren
  function _updateBrugSubUI(compenseren = false) {
    const niveau = parseInt(document.querySelector('[name="niveau"]:checked')?.value || 20);
    const hoofd  = document.querySelector('[name="brug-hoofd"]:checked')?.value || 'zonder';
    const rijSub = document.getElementById('rij-brug-sub');
    if (!rijSub) return;

    // Subkeuze enkel bij tot 1000 + met brug (niet bij 'beide' = gemengd)
    const toonSub = niveau >= 1000 && hoofd === 'met';
    rijSub.style.display = toonSub ? 'block' : 'none';

    if (toonSub && compenseren) {
      // Compenseren aftrekken tot 1000: enkel HT-HT → enkel naar-honderdtal
      // Compenseren optellen tot 1000: alle bruggen mogelijk
      const bewerking = actieveBewerking;
      const chipHond = rijSub.querySelector('[value="naar-honderdtal"]')?.closest('.radio-chip');
      const chipTien = rijSub.querySelector('[value="naar-tiental"]')?.closest('.radio-chip');
      const chipBeide = rijSub.querySelector('[value="beide"]')?.closest('.radio-chip');
      if (bewerking === 'aftrekken') {
        // Enkel naar-honderdtal beschikbaar
        if (chipTien)  chipTien.style.display  = 'none';
        if (chipBeide) chipBeide.style.display = 'none';
        if (chipHond)  { chipHond.style.display = ''; chipHond.click(); }
      } else {
        // Alle opties
        if (chipTien)  chipTien.style.display  = '';
        if (chipBeide) chipBeide.style.display = '';
        if (chipHond)  chipHond.style.display  = '';
      }
    } else if (toonSub) {
      // Alle sub-opties zichtbaar
      rijSub.querySelectorAll('.radio-chip').forEach(c => c.style.display = '');
    }
  }

  /* ── Radio selecteren (niet-brug) ───────────────────────── */
  function selecteerRadio(naam, waarde, el) {
    document.querySelectorAll(`[name="${naam}"]`).forEach(r => {
      r.closest('.radio-chip')?.classList.remove('geselecteerd');
    });
    el.classList.add('geselecteerd');

    const niveau = parseInt(document.querySelector('[name="niveau"]:checked')?.value || 20);
    if (naam === 'niveau') {
      _updateTypesUI(parseInt(waarde), null);
      _updateBrugSubUI();
      const brug = _syncBrugInput();
      _updateHulpmiddelenUI(brug);
    }
  }

  /* ── Types UI opbouwen ───────────────────────────────────── */
  function _updateTypesUI(niveau, brug) {
    if (!brug) brug = _getBrugWaarde();

    const hulpmiddelen = [...document.querySelectorAll('[name="hulpmiddelen"]:checked')].map(c => c.value);
    const beschikbaar = Generator.getTypes(actieveBewerking, niveau, brug, hulpmiddelen);
    const container   = document.getElementById('cg-types');
    container.innerHTML = '';

    beschikbaar.forEach((type, i) => {
      const label = document.createElement('label');
      label.className = 'vink-chip' + (i === 0 ? ' geselecteerd' : '');
      label.innerHTML = `
        <span class="vink-box">${i === 0 ? '✓' : ''}</span>
        <input type="checkbox" name="types" value="${type}" ${i === 0 ? 'checked' : ''} style="display:none">
        <span>${type}</span>`;

      label.onclick = (e) => {
        e.preventDefault();
        const checkbox = label.querySelector('input');

        if (type === 'Gemengd') {
          container.querySelectorAll('.vink-chip').forEach(l => {
            l.classList.remove('geselecteerd');
            l.querySelector('input').checked = false;
            l.querySelector('.vink-box').textContent = '';
          });
          label.classList.add('geselecteerd');
          checkbox.checked = true;
          label.querySelector('.vink-box').textContent = '✓';
        } else {
          const gemengd = [...container.querySelectorAll('.vink-chip')]
            .find(l => l.querySelector('input').value === 'Gemengd');
          if (gemengd) {
            gemengd.classList.remove('geselecteerd');
            gemengd.querySelector('input').checked = false;
            gemengd.querySelector('.vink-box').textContent = '';
          }
          const wasChecked = checkbox.checked;
          checkbox.checked = !wasChecked;
          label.classList.toggle('geselecteerd', !wasChecked);
          label.querySelector('.vink-box').textContent = !wasChecked ? '✓' : '';
        }
      };

      container.appendChild(label);
    });

    // Brugkaart verbergen voor niveau 5 en 10
    const kaartBrug = document.getElementById('kaart-brug');
    if (kaartBrug) kaartBrug.style.display = (niveau <= 10) ? 'none' : 'block';
    if (niveau <= 10) _updateHulpmiddelenUI('zonder');

    // Bij niveau <= 100: enkel 'zonder' en 'naar-tiental' tonen, rest verbergen
    const alleenTiental = niveau <= 100;
    ['naar-honderdtal','beide'].forEach(val => {
      const chip = document.querySelector(`[name="brug"][value="${val}"]`)?.closest('.radio-chip');
      if (chip) chip.style.display = alleenTiental ? 'none' : '';
    });
    // Bij niveau ≤ 100: brug-sub verbergen, hoofd-brug naar 'zonder' resetten indien nodig
    if (alleenTiental) {
      const rijSub = document.getElementById('rij-brug-sub');
      if (rijSub) rijSub.style.display = 'none';
    }

    // Aanvullen: enkel tot 100. Compenseren: tot 100 én tot 1000 (optellen)
    const chipComp = document.getElementById('chip-compenseren');
    const chipAanv = document.getElementById('chip-aanvullen');

    // Aanvullen: verbergen boven 100
    if (chipAanv) {
      const verbergAanv = niveau <= 20 || niveau > 100;
      chipAanv.style.display = verbergAanv ? 'none' : '';
      if (verbergAanv) {
        const cb = chipAanv.querySelector('input');
        if (cb) cb.checked = false;
        chipAanv.classList.remove('geselecteerd');
        const vb = chipAanv.querySelector('.vink-box');
        if (vb) vb.textContent = '';
        const rijAanv = document.getElementById('rij-aanvullen');
        if (rijAanv) rijAanv.style.display = 'none';
      }
    }

    // Compenseren: beschikbaar tot 100 (optellen+aftrekken) en tot 1000 (enkel optellen)
    if (chipComp) {
      const verbergComp = niveau <= 20 || (niveau > 100 && niveau < 1000);
      chipComp.style.display = verbergComp ? 'none' : '';
      if (verbergComp) {
        const cb = chipComp.querySelector('input');
        if (cb) cb.checked = false;
        chipComp.classList.remove('geselecteerd');
        const vb = chipComp.querySelector('.vink-box');
        if (vb) vb.textContent = '';
        const rijComp = document.getElementById('rij-compenseren');
        if (rijComp) rijComp.style.display = 'none';
      }
    }
  }

  /* ── Hulpmiddelen UI ────────────────────────────────────── */
  function _updateHulpmiddelenUI(brug) {
    const kaart = document.getElementById('kaart-hulpmiddelen');
    if (!kaart) return;

    const niveau = parseInt(document.querySelector('[name="niveau"]:checked')?.value || 20);
    const isBrug = ['naar-tiental','naar-honderdtal','beide','met'].includes(brug);
    const isZonderTot1000 = brug === 'zonder' && niveau >= 1000;
    if (niveau < 20) { kaart.style.display = 'none'; return; }

    // Toon bij brug (alle niveaus) of bij zonder+tot1000
    const toon = (isBrug || isZonderTot1000) && (actieveBewerking !== 'herken-brug');
    kaart.style.display = toon ? 'block' : 'none';

    if (!toon) {
      document.querySelectorAll('[name="hulpmiddelen"]').forEach(cb => {
        cb.checked = false;
        cb.closest('.vink-chip')?.classList.remove('geselecteerd');
        const vb = cb.closest('.vink-chip')?.querySelector('.vink-box');
        if (vb) vb.textContent = '';
      });
      const rijPos = document.getElementById('rij-splitspositie');
      if (rijPos) rijPos.style.display = 'none';
      const rijAanv = document.getElementById('rij-aanvullen');
      if (rijAanv) rijAanv.style.display = 'none';
      const rijComp = document.getElementById('rij-compenseren');
      if (rijComp) rijComp.style.display = 'none';
      const rijLijnen = document.getElementById('rij-schrijflijnen-aantal');
      if (rijLijnen) rijLijnen.style.display = 'none';
    }

    // Bij zonder+tot1000: enkel splitsbeen tonen, rest verbergen
    const chipSplits    = document.getElementById('chip-splitsbeen');
    const chipLijnen    = document.getElementById('chip-schrijflijnen');
    const chipAanvullen = document.getElementById('chip-aanvullen');
    const chipComp      = document.getElementById('chip-compenseren');

    if (isZonderTot1000) {
      // Splitsbeen en schrijflijnen beschikbaar, rest niet
      if (chipSplits)    chipSplits.style.display    = '';
      if (chipLijnen)    chipLijnen.style.display    = '';
      if (chipAanvullen) { chipAanvullen.style.display = 'none'; _resetChip(chipAanvullen, 'rij-aanvullen'); }
      if (chipComp)      { chipComp.style.display      = 'none'; _resetChip(chipComp, 'rij-compenseren'); }
    } else if (isBrug) {
      // Alle chips zichtbaar (niveau-filter doet de rest)
      if (chipSplits) chipSplits.style.display = '';
      if (chipLijnen) chipLijnen.style.display = '';
    }

    // Splitspositie enkel bij aftrekken
    const rijPos = document.getElementById('rij-splitspositie');
    if (rijPos) rijPos.style.display = (toon && actieveBewerking === 'aftrekken') ? 'block' : 'none';
  }

  function _resetChip(chip, rijId) {
    if (!chip) return;
    const cb = chip.querySelector('input');
    if (cb) cb.checked = false;
    chip.classList.remove('geselecteerd');
    const vb = chip.querySelector('.vink-box');
    if (vb) vb.textContent = '';
    const rij = document.getElementById(rijId);
    if (rij) rij.style.display = 'none';
  }

  /* ── Blok toevoegen ──────────────────────────────────────── */
  function voegBlokToe() {
    const niveau = parseInt(document.querySelector('[name="niveau"]:checked')?.value || 20);
    const brug   = _getBrugWaarde();
    const types  = [...document.querySelectorAll('[name="types"]:checked')].map(c => c.value);
    const aantal = parseInt(document.getElementById('inp-aantal').value);
    const zin    = document.getElementById('inp-opdrachtzin').value.trim() ||
                   (actieveBewerking === 'aftrekken' ? 'Trek af.' : 'Reken vlug uit.');

    if (types.length === 0) {
      toonToast('⚠️ Kies minstens één oefentype!', '#E74C3C');
      return;
    }

    const isHerken = actieveBewerking === 'herken-brug';
    const hulpmiddelen        = [...document.querySelectorAll('[name="hulpmiddelen"]:checked')].map(c => c.value);
    const splitspositie       = document.querySelector('[name="splitspositie"]:checked')?.value || 'aftrekker';
    const aanvullenVariant    = document.querySelector('[name="aanvullen-variant"]:checked')?.value || 'zonder-schema';
    const compenserenVariant  = document.querySelector('[name="compenseren-variant"]:checked')?.value || 'met-tekens';
    const schrijflijnenAantal = parseInt(document.querySelector('[name="schrijflijnen-aantal"]:checked')?.value || '2');
    const metVoorbeeld        = document.getElementById('cb-metvoorbeeld')?.checked || false;
    const blok = Generator.maakBlok({
      bewerking: actieveBewerking,
      niveau:    isHerken ? 100 : niveau,
      oefeningstypes: types,
      brug:      isHerken ? 'gemengd' : brug,
      aantalOefeningen: aantal,
      opdrachtzin: zin,
      hulpmiddelen,
      splitspositie,
      aanvullenVariant,
      compenserenVariant,
      schrijflijnenAantal,
      metVoorbeeld,
    });

    if (!blok) {
      toonToast('⚠️ Te weinig oefeningen gevonden. Pas de instellingen aan.', '#E74C3C');
      return;
    }

    bundelData.push(blok);
    Preview.render(bundelData);
    toonToast(`✅ Blok toegevoegd! (${blok.oefeningen.length} oefeningen)`, '#27AE60');
  }

  /* ── Bewerkingen op preview ──────────────────────────────── */
  function verwijderBlok(id) {
    bundelData = bundelData.filter(b => b.id !== id);
    Preview.render(bundelData);
    toonToast('🗑 Blok verwijderd');
  }

  function verwijderOefening(blokId, idx) {
    const blok = bundelData.find(b => b.id === blokId);
    if (!blok) return;
    blok.oefeningen.splice(idx, 1);
    Preview.render(bundelData);
  }

  function voegOefeningToe(blokId) {
    const blok = bundelData.find(b => b.id === blokId);
    if (!blok) return;
    const gelukt = Generator.voegOefeningToe(blok);
    if (gelukt) {
      Preview.render(bundelData);
      toonToast('➕ Oefening toegevoegd', '#27AE60');
    } else {
      toonToast('⚠️ Geen nieuwe unieke oefening beschikbaar', '#E74C3C');
    }
  }

  function bewerkZin(blokId) {
    const blok = bundelData.find(b => b.id === blokId);
    if (!blok) return;
    Preview.toonZinEditor(blokId, blok.opdrachtzin);
  }

  function slaZinOp(blokId) {
    const blok = bundelData.find(b => b.id === blokId);
    if (!blok) return;
    const inp = document.getElementById(`zin-inp-${blokId}`);
    if (inp) blok.opdrachtzin = inp.value.trim() || blok.opdrachtzin;
    Preview.render(bundelData);
  }

  /* ── Hulpmiddel vinkje togglen ──────────────────────────── */
  function toggleHulpmiddel(label, waarde) {
    const cb = label.querySelector('input');
    const was = cb.checked;
    cb.checked = !was;
    label.classList.toggle('geselecteerd', !was);
    label.querySelector('.vink-box').textContent = !was ? '\u2713' : '';

    if (waarde === 'splitsbeen') {
      const rijPos = document.getElementById('rij-splitspositie');
      if (rijPos) rijPos.style.display = (!was && actieveBewerking === 'aftrekken') ? 'block' : 'none';
    }
    if (waarde === 'schrijflijnen') {
      const rijAantal = document.getElementById('rij-schrijflijnen-aantal');
      if (rijAantal) rijAantal.style.display = !was ? 'block' : 'none';
    }
    if (waarde === 'aanvullen') {
      const rijAanvullen = document.getElementById('rij-aanvullen');
      if (rijAanvullen) rijAanvullen.style.display = !was ? 'block' : 'none';
      const niveau = parseInt(document.querySelector('[name="niveau"]:checked')?.value || 20);
      _updateTypesUI(niveau, _getBrugWaarde());
    }
    if (waarde === 'compenseren') {
      const rijComp = document.getElementById('rij-compenseren');
      if (rijComp) rijComp.style.display = !was ? 'block' : 'none';
      // Pas brug-subkeuze aan en herlaad types voor compenseren-module
      _updateBrugSubUI(!was);
      const niveau = parseInt(document.querySelector('[name="niveau"]:checked')?.value || 20);
      _updateTypesUI(niveau, _getBrugWaarde());
    }
  }

  function toggleVoorbeeld(label) {
    const cb = label.querySelector('input');
    const was = cb.checked;
    cb.checked = !was;
    label.classList.toggle('geselecteerd', !was);
    label.querySelector('.vink-box').textContent = !was ? '\u2713' : '';
  }

  /* ── Preview en PDF ──────────────────────────────────────── */
  function genereerPreview() {
    Preview.render(bundelData);
    toonToast('✅ Preview bijgewerkt');
  }

  function downloadPDF() {
    if (bundelData.length === 0) return;
    const titel = document.getElementById('bundel-titel').value.trim() || 'Rekenbundel';
    PdfEngine.genereer(bundelData, titel);
    toonToast('📄 PDF gedownload!', '#27AE60');
  }

  /* ── Initialisatie ───────────────────────────────────────── */
  function init() {
    _updateTypesUI(20, 'zonder');
    Preview.render(bundelData);


  }

  return {
    init, toonBewerking, selecteerRadio, selecteerBrugHoofd, selecteerBrugSub, _updateHulpmiddelenUI, toggleHulpmiddel, toggleVoorbeeld,
    voegBlokToe, verwijderBlok, verwijderOefening,
    voegOefeningToe, bewerkZin, slaZinOp,
    genereerPreview, downloadPDF,
  };
})();

document.addEventListener('DOMContentLoaded', App.init);
