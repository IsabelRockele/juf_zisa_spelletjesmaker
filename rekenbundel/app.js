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
    _updateHulpmiddelenUI(isHerken ? 'zonder' : (document.querySelector('[name="brug"]:checked')?.value || 'zonder'));

    // Types laden
    const niveau = isHerken ? 100 : parseInt(document.querySelector('[name="niveau"]:checked')?.value || 20);
    const brug   = isHerken ? 'gemengd' : (document.querySelector('[name="brug"]:checked')?.value || 'zonder');
    _updateTypesUI(niveau, brug);
  }

  /* ── Radio selecteren ────────────────────────────────────── */
  function selecteerRadio(naam, waarde, el) {
    document.querySelectorAll(`[name="${naam}"]`).forEach(r => {
      r.closest('.radio-chip')?.classList.remove('geselecteerd');
    });
    el.classList.add('geselecteerd');

    const niveau = parseInt(document.querySelector('[name="niveau"]:checked')?.value || 20);
    if (naam === 'niveau') _updateTypesUI(parseInt(waarde), null);
    if (naam === 'brug') {
      _updateTypesUI(niveau, waarde);
      _updateHulpmiddelenUI(waarde);
    }
  }

  /* ── Types UI opbouwen ───────────────────────────────────── */
  function _updateTypesUI(niveau, brug) {
    if (!brug) brug = document.querySelector('[name="brug"]:checked')?.value || 'zonder';

    const beschikbaar = Generator.getTypes(actieveBewerking, niveau, brug);
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
  }

  /* ── Hulpmiddelen UI ────────────────────────────────────── */
  function _updateHulpmiddelenUI(brug) {
    const kaart = document.getElementById('kaart-hulpmiddelen');
    if (!kaart) return;

    // Enkel tonen bij "met brug" en niet bij herken-brug tab
    const toon = (brug === 'met') && (actieveBewerking !== 'herken-brug');
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
    }

    // Splitspositie enkel bij aftrekken
    const rijPos = document.getElementById('rij-splitspositie');
    if (rijPos) rijPos.style.display = (actieveBewerking === 'aftrekken') ? 'block' : 'none';
  }

  /* ── Blok toevoegen ──────────────────────────────────────── */
  function voegBlokToe() {
    const niveau = parseInt(document.querySelector('[name="niveau"]:checked')?.value || 20);
    const brug   = document.querySelector('[name="brug"]:checked')?.value || 'zonder';
    const types  = [...document.querySelectorAll('[name="types"]:checked')].map(c => c.value);
    const aantal = parseInt(document.getElementById('inp-aantal').value);
    const zin    = document.getElementById('inp-opdrachtzin').value.trim() ||
                   (actieveBewerking === 'aftrekken' ? 'Trek af.' : 'Reken vlug uit.');

    if (types.length === 0) {
      toonToast('⚠️ Kies minstens één oefentype!', '#E74C3C');
      return;
    }

    const isHerken = actieveBewerking === 'herken-brug';
    const hulpmiddelen       = [...document.querySelectorAll('[name="hulpmiddelen"]:checked')].map(c => c.value);
    const splitspositie      = document.querySelector('[name="splitspositie"]:checked')?.value || 'aftrekker';
    const aanvullenVariant   = document.querySelector('[name="aanvullen-variant"]:checked')?.value || 'zonder-schema';
    const compenserenVariant = document.querySelector('[name="compenseren-variant"]:checked')?.value || 'met-tekens';
    const metVoorbeeld       = document.getElementById('cb-metvoorbeeld')?.checked || false;
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
    if (waarde === 'aanvullen') {
      const rijAanvullen = document.getElementById('rij-aanvullen');
      if (rijAanvullen) rijAanvullen.style.display = !was ? 'block' : 'none';
    }
    if (waarde === 'compenseren') {
      const rijComp = document.getElementById('rij-compenseren');
      if (rijComp) rijComp.style.display = !was ? 'block' : 'none';
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
    init, toonBewerking, selecteerRadio, _updateHulpmiddelenUI, toggleHulpmiddel, toggleVoorbeeld,
    voegBlokToe, verwijderBlok, verwijderOefening,
    voegOefeningToe, bewerkZin, slaZinOp,
    genereerPreview, downloadPDF,
  };
})();

document.addEventListener('DOMContentLoaded', App.init);
