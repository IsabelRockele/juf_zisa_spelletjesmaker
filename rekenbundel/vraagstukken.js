// modules/vraagstukken.js — Vraagstuk Generator module
// Juf Zisa — jufzisa.be
// Versie 1

window.VraagstukkenModule = (() => {

  // ── STAAT ────────────────────────────────────────────────────
  let gegenereerdeVraagstukken = []; // opgeslagen in de bundel
  let huidigVraagstuk = null;        // laatste gegenereerde preview

  // ── DAGELIJKS LIMIET (localStorage — tijdelijk voor testen) ──
  async function haalTellerOp() {
    const datum = new Date().toISOString().slice(0, 10);
    const key = `vs-teller-${datum}`;
    return parseInt(localStorage.getItem(key) || '0');
  }

  async function verhoogTeller() {
    const datum = new Date().toISOString().slice(0, 10);
    const key = `vs-teller-${datum}`;
    const huidig = parseInt(localStorage.getItem(key) || '0');
    localStorage.setItem(key, huidig + 1);
  }

  // ── LIMIET BADGE UPDATEN ─────────────────────────────────────
  async function updateLimietBadge() {
    const teller = await haalTellerOp();
    const resterend = Math.max(0, 10 - teller);
    const badge = document.getElementById('vs-limiet-badge');
    if (!badge) return;
    badge.textContent = `${resterend}/10 vandaag`;
    badge.className = 'vs-limiet-badge ' + (resterend === 0 ? 'leeg' : resterend <= 3 ? 'weinig' : '');
  }

  // ── INSTELLINGEN UITLEZEN ────────────────────────────────────
  function leesInstellingen() {
    const bewerking = document.querySelector('input[name="vs-bewerking"]:checked')?.value || 'optellen';
    const niveau = document.querySelector('input[name="vs-niveau"]:checked')?.value || 'tot20';
    const leerjaar = document.querySelector('input[name="vs-leerjaar"]:checked')?.value || '2';
    const aantalGetallen = document.querySelector('input[name="vs-aantalgetallen"]:checked')?.value || '2';
    const thema = document.getElementById('vs-thema')?.value.trim() || '';
    const schema = [];
    document.querySelectorAll('input[name="vs-schema"]:checked').forEach(el => schema.push(el.value));
    const antwoordzin = document.querySelector('input[name="vs-antwoordzin"]:checked')?.value || 'deels';
    const aantalBulk = parseInt(document.getElementById('vs-aantal-bulk')?.value || '1');
    return { bewerking, niveau, leerjaar, aantalGetallen, thema, schema, antwoordzin, aantalBulk };
  }

  // ── PROMPT BOUWEN ────────────────────────────────────────────
  function bouwPrompt(inst, aantal) {
    const bewerkingLabel = {
      optellen: 'optelling',
      aftrekken: 'aftrekking',
      vermenigvuldigen: 'vermenigvuldiging',
      delen: 'deling'
    }[inst.bewerking] || inst.bewerking;

    const niveauLabel = {
      tot10: 'tot 10',
      tot20: 'tot 20',
      tot100: 'tot 100',
      tot1000: 'tot 1000',
      kommagetallen: 'met kommagetallen (één decimaal, bv. 3,4 + 2,1)'
    }[inst.niveau] || inst.niveau;

    const leerjaarLabel = {
      '1': '1e leerjaar (6-7 jaar)',
      '2': '2e leerjaar (7-8 jaar)',
      '3': '3e leerjaar (8-9 jaar)',
      '4': '4e leerjaar (9-10 jaar)'
    }[inst.leerjaar] || '2e leerjaar (7-8 jaar)';

    const aantalGetallenLabel = {
      '2': 'gebruik exact 2 getallen in de bewerking (bv. 12 + 5)',
      '3': 'gebruik exact 3 getallen in de bewerking (bv. 12 + 5 + 3)',
      'gemengd': 'gebruik 2 of 3 getallen, eventueel met gemengde bewerkingen (bv. 12 + 5 - 3)'
    }[inst.aantalGetallen] || 'gebruik exact 2 getallen';

    const themaInstructie = inst.thema
      ? `- Thema: gebruik "${inst.thema}" als context voor het vraagstuk`
      : '- Gebruik een concrete, herkenbare situatie (school, dieren, speelgoed, eten, seizoenen...)';

    const antwoordzinInstructie = inst.antwoordzin === 'deels'
      ? 'Eindig met een antwoordzin waarbij alleen het eindgetal ontbreekt en vervangen is door "___". Bv: "Er zijn ___ appels."'
      : 'Laat de antwoordzin volledig leeg (schrijf enkel "Antwoord: _______________").';

    const aantalInstructie = aantal > 1
      ? `Genereer ${aantal} verschillende vraagstukken. Geef elk vraagstuk een nummer (1., 2., ...).`
      : 'Genereer 1 vraagstuk.';

    return `Je bent een Vlaamse onderwijsassistent die wiskundige vraagstukken maakt voor kinderen.

${aantalInstructie}

Vereisten:
- Leerjaar: ${leerjaarLabel}
- Bewerking: ${bewerkingLabel}
- Rekenniveau: ${niveauLabel}
- Aantal getallen: ${aantalGetallenLabel}
${themaInstructie}
- Schrijf in eenvoudig, warm Nederlands (Vlaams) passend bij het leerjaar
- Het vraagstuk bevat 2-3 zinnen maximum
- Vermeld duidelijk de getallen en wat er berekend moet worden
- ${antwoordzinInstructie}

Geef ALLEEN het vraagstuk terug, zonder uitleg, zonder titel, zonder berekening.`;
  }

  async function roepAPIaan(prompt) {
    const CLOUD_FUNCTION_URL = 'https://europe-west1-zisa-spelletjesmaker-pro.cloudfunctions.net/genereerVraagstuk';

    const resp = await fetch(CLOUD_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    if (!resp.ok) throw new Error(await resp.text());
    const data = await resp.json();
    if (data.error) throw new Error(data.error);
    return data.tekst;
  }

  // ── GENEREER ─────────────────────────────────────────────────
  async function genereer() {
    const teller = await haalTellerOp();
    const inst = leesInstellingen();
    const aantalNodig = inst.aantalBulk;

    if (teller + aantalNodig > 10) {
      const resterend = Math.max(0, 10 - teller);
      toonMelding(
        resterend === 0
          ? '⏰ Je hebt je dagelijks limiet van 10 vraagstukken bereikt. Morgen kan je opnieuw!'
          : `⚠️ Je kan nog ${resterend} vraagstuk${resterend === 1 ? '' : 'ken'} genereren vandaag.`,
        'waarschuwing'
      );
      return;
    }

    // Laad-status tonen
    const btn = document.getElementById('vs-btn-genereer');
    const preview = document.getElementById('vs-preview');
    btn.disabled = true;
    btn.textContent = '⏳ Genereren...';
    preview.innerHTML = '<div class="vs-laden">✨ Claude bedenkt een vraagstuk...</div>';

    try {
      const prompt = bouwPrompt(inst, aantalNodig);
      const tekst = await roepAPIaan(prompt);

      // Sla op
      huidigVraagstuk = { tekst, inst, tijdstip: new Date().toLocaleTimeString('nl-BE') };

      // Teller verhogen (per bulk-aanroep telt het aantal)
      for (let i = 0; i < aantalNodig; i++) await verhoogTeller();

      // Toon in preview
      toonPreview(tekst, inst);
      await updateLimietBadge();

    } catch (e) {
      preview.innerHTML = `<div class="vs-fout">❌ Fout: ${e.message}</div>`;
      console.error(e);
    } finally {
      btn.disabled = false;
      btn.textContent = '✨ Genereer vraagstuk';
    }
  }

  // ── PREVIEW TONEN ────────────────────────────────────────────
  function toonPreview(tekst, inst) {
    const preview = document.getElementById('vs-preview');
    const schema = inst.schema;

    let schemaHTML = '';
    if (schema.includes('tekenschema')) {
      const teken = { optellen: '+', aftrekken: '−', vermenigvuldigen: '×', delen: '÷' }[inst.bewerking] || '?';
      schemaHTML += `
        <div class="vs-schema-blok">
          <div class="vs-schema-label">Tekenschema</div>
          <div class="vs-tekenschema">
            <div class="vs-ts-vak">___</div>
            <div class="vs-ts-teken">${teken}</div>
            <div class="vs-ts-vak">___</div>
            <div class="vs-ts-teken">=</div>
            <div class="vs-ts-vak">___</div>
          </div>
        </div>`;
    }
    if (schema.includes('schrijflijnen')) {
      schemaHTML += `
        <div class="vs-schema-blok">
          <div class="vs-schema-label">Schrijflijnen</div>
          <div class="vs-schrijflijnen">
            <div class="vs-schrijflijn"></div>
            <div class="vs-schrijflijn"></div>
            <div class="vs-schrijflijn"></div>
          </div>
        </div>`;
    }
    if (schema.includes('cijferschema')) {
      schemaHTML += `
        <div class="vs-schema-blok">
          <div class="vs-schema-label">Cijferschema</div>
          <div class="vs-cijferschema">
            <div class="vs-cs-rij"><div class="vs-cs-cel"></div><div class="vs-cs-cel"></div><div class="vs-cs-cel"></div></div>
            <div class="vs-cs-rij vs-cs-lijn"><div class="vs-cs-cel">+</div><div class="vs-cs-cel"></div><div class="vs-cs-cel"></div></div>
            <div class="vs-cs-rij"><div class="vs-cs-cel">=</div><div class="vs-cs-cel"></div><div class="vs-cs-cel"></div></div>
          </div>
        </div>`;
    }

    preview.innerHTML = `
      <div class="vs-kaart">
        <div class="vs-kaart-tekst">${tekst.replace(/\n/g, '<br>')}</div>
        ${schemaHTML ? `<div class="vs-schemas">${schemaHTML}</div>` : ''}
        <div class="vs-acties">
          <button class="vs-btn-toevoegen" onclick="VraagstukkenModule.voegToeAanBundel()">
            ＋ Voeg toe aan bundel
          </button>
          <button class="vs-btn-opnieuw" onclick="VraagstukkenModule.genereer()">
            🔄 Nieuw vraagstuk
          </button>
        </div>
      </div>`;
  }

  // ── TOEVOEGEN AAN BUNDEL ─────────────────────────────────────
  function voegToeAanBundel() {
    if (!huidigVraagstuk) return;
    gegenereerdeVraagstukken.push({ ...huidigVraagstuk, id: Date.now() });
    toonMelding('✅ Vraagstuk toegevoegd aan bundel!', 'succes');
    updateBundelTeller();

    // Toon in de bundel-lijst
    renderBundelLijst();
  }

  function updateBundelTeller() {
    const el = document.getElementById('vs-bundel-teller');
    if (el) el.textContent = `${gegenereerdeVraagstukken.length} vraagstu${gegenereerdeVraagstukken.length === 1 ? 'k' : 'kken'} in bundel`;
  }

  function renderBundelLijst() {
    const lijst = document.getElementById('vs-bundel-lijst');
    if (!lijst) return;
    if (gegenereerdeVraagstukken.length === 0) {
      lijst.innerHTML = '<div class="vs-leeg">Nog geen vraagstukken toegevoegd.</div>';
      return;
    }
    lijst.innerHTML = gegenereerdeVraagstukken.map((v, i) => `
      <div class="vs-bundel-item">
        <div class="vs-bundel-nummer">${i + 1}</div>
        <div class="vs-bundel-tekst">${v.tekst.replace(/\n/g, '<br>').substring(0, 100)}${v.tekst.length > 100 ? '...' : ''}</div>
        <button class="vs-bundel-verwijder" onclick="VraagstukkenModule.verwijderUitBundel(${v.id})">✕</button>
      </div>
    `).join('');
  }

  function verwijderUitBundel(id) {
    gegenereerdeVraagstukken = gegenereerdeVraagstukken.filter(v => v.id !== id);
    renderBundelLijst();
    updateBundelTeller();
  }

  // ── MELDING ──────────────────────────────────────────────────
  function toonMelding(tekst, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = tekst;
    toast.className = 'toast toon ' + type;
    setTimeout(() => { toast.className = 'toast'; }, 3500);
  }

  // ── INITIALISEER ─────────────────────────────────────────────
  async function init() {
    await updateLimietBadge();
    renderBundelLijst();
  }

  // ── BEWERKING CHIP SELECTIE ──────────────────────────────────
  function kiesBewerking(waarde, el) {
    document.querySelectorAll('.vs-bew-chip').forEach(c => c.classList.remove('geselecteerd'));
    el.classList.add('geselecteerd');
    el.querySelector('input').checked = true;
    // Toon/verberg tafels kaart
    const tafelKaart = document.getElementById('vs-kaart-tafels');
    if (tafelKaart) {
      tafelKaart.style.display = (waarde === 'vermenigvuldigen' || waarde === 'delen') ? '' : 'none';
    }
  }

  // ── PUBLIEKE API ─────────────────────────────────────────────
  return { genereer, voegToeAanBundel, verwijderUitBundel, init, getBundel: () => gegenereerdeVraagstukken, _kiesBewerking: kiesBewerking };

})();