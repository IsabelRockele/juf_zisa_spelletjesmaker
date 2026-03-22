// modules/vraagstukken.js — Vraagstuk Generator module
// Juf Zisa — jufzisa.be
// Versie 1

window.VraagstukkenModule = (() => {

  // ── STAAT ────────────────────────────────────────────────────
  let gegenereerdeVraagstukken = []; // opgeslagen in de bundel
  let huidigVraagstuk = null;        // laatste gegenereerde preview

  // ── DAGELIJKS LIMIET (Firebase — per gebruiker) ─────────────
  async function haalTellerOp() {
    const user = firebase.auth().currentUser;
    if (!user) return 999; // niet ingelogd = blokkeren
    const datum = new Date().toISOString().slice(0, 10);
    const ref = firebase.database().ref(`tellerVraagstukken/${user.uid}/${datum}`);
    const snap = await ref.once('value');
    return snap.val() || 0;
  }

  async function verhoogTeller() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    const datum = new Date().toISOString().slice(0, 10);
    const ref = firebase.database().ref(`tellerVraagstukken/${user.uid}/${datum}`);
    const snap = await ref.once('value');
    await ref.set((snap.val() || 0) + 1);
  }

  // ── LIMIET BADGE UPDATEN ─────────────────────────────────────
  async function updateLimietBadge() {
    const teller = await haalTellerOp();
    const resterend = Math.max(0, 10 - teller);
    const badge = document.getElementById('vs-limiet-badge');
    if (!badge) return;
    badge.textContent = `${resterend}/10 vandaag`;
    badge.className = 'vs-limiet-badge ' + (resterend === 0 ? 'leeg' : resterend <= 5 ? 'weinig' : '');
  }

  // ── INSTELLINGEN UITLEZEN ────────────────────────────────────
  function leesInstellingen() {
    const bewerking = document.querySelector('input[name="vs-bewerking"]:checked')?.value || 'optellen';
    const niveau = document.querySelector('input[name="vs-niveau"]:checked')?.value || 'tot20';
    const leerjaar = document.querySelector('input[name="vs-leerjaar"]:checked')?.value || '2';
    const aantalGetallen = document.querySelector('input[name="vs-aantalgetallen"]:checked')?.value || '2';
    const thema = document.getElementById('vs-thema')?.value.trim() || '';
    const berekening = document.getElementById('vs-berekening')?.value.trim() || '';
    const schema = [];
    document.querySelectorAll('input[name="vs-schema"]:checked').forEach(el => schema.push(el.value));
    const antwoordzin = document.querySelector('input[name="vs-antwoordzin"]:checked')?.value || 'deels';
    const aantalBulk = parseInt(document.getElementById('vs-aantal-bulk')?.value || '1');
    const kommaDecimalen = document.querySelector('input[name="vs-komma-niveau"]:checked')?.value || 't';
    const kommaPrefix = document.querySelector('input[name="vs-komma-prefix"]:checked')?.value || 'E';
    const cijferKolommen = (() => {
      if (niveau === 'kommagetallen') return 'komma';
      if (niveau === 'tot100000') return 'TDHTE';
      if (niveau === 'tot10000') return 'DHTE';
      if (niveau === 'tot1000') return 'HTE';
      if (niveau === 'tot100') return 'TE';
      return 'E';
    })();

    // Tafels voor vermenigvuldigen
    const tafelsVerm = [];
    document.querySelectorAll('#vs-tafels-verm input[type="checkbox"]:checked').forEach(cb => tafelsVerm.push(cb.value));
    const vermNotatie = document.querySelector('input[name="vs-verm-notatie"]:checked')?.value || 'vooraan';
    const vermBereik  = document.querySelector('input[name="vs-verm-bereik"]:checked')?.value  || 'tafels';

    // Tafels voor delen
    const tafelsDeel = [];
    document.querySelectorAll('#vs-tafels-deel input[type="checkbox"]:checked').forEach(cb => tafelsDeel.push(cb.value));
    const deelVisie   = document.querySelector('input[name="vs-deel-visie"]:checked')?.value   || 'verdelen';
    const deelNotatie = document.querySelector('input[name="vs-deel-notatie"]:checked')?.value || 'vooraan';
    const deelBereik  = document.querySelector('input[name="vs-deel-bereik"]:checked')?.value  || 'tee';
    const deelRest    = document.querySelector('input[name="vs-deel-rest"]:checked')?.value    || 'nee';

    return { bewerking, niveau, leerjaar, aantalGetallen, thema, berekening, schema, antwoordzin, aantalBulk, cijferKolommen, kommaDecimalen, kommaPrefix, tafelsVerm, vermNotatie, vermBereik, tafelsDeel, deelVisie, deelNotatie, deelBereik, deelRest };
  }

  // ── PROMPT BOUWEN ────────────────────────────────────────────
  function bouwPrompt(inst, aantal) {
    const bewerkingLabel = {
      optellen: 'optelling',
      aftrekken: 'aftrekking',
      vermenigvuldigen: 'vermenigvuldiging',
      delen: 'deling'
    }[inst.bewerking] || inst.bewerking;

    const prefixGetallen = { 'E': ['3','2'], 'TE': ['13','24'], 'HTE': ['123','245'] };
    const pg = prefixGetallen[inst.kommaPrefix] || ['3','2'];
    const kommaVoorbeelden = {
      't':   `${pg[0]},4 + ${pg[1]},1`,
      'th':  `${pg[0]},45 + ${pg[1]},13`,
      'thd': `${pg[0]},458 + ${pg[1]},134`
    };
    const kommaEx = kommaVoorbeelden[inst.kommaDecimalen] || '3,4 + 2,1';

    const niveauLabel = {
      tot10: 'tot 10',
      tot20: 'tot 20',
      tot100: 'tot 100',
      tot1000: 'tot 1 000',
      tot10000: 'tot 10 000',
      tot100000: 'tot 100 000',
      kommagetallen: `met kommagetallen (bv. ${kommaEx})`
    }[inst.niveau] || inst.niveau;

    // Bij verm (E×E of T×E) of delen: niveau wordt bepaald door tafels/bereik zelf
    const niveauNietNodig = (inst.bewerking === 'vermenigvuldigen' && ['exe','txe'].includes(inst.vermBereik || 'exe'))
                         || inst.bewerking === 'delen';
    const niveauInstructie = niveauNietNodig
      ? ''
      : `- Rekenniveau: ${niveauLabel} — de UITKOMST van de bewerking mag nooit groter zijn dan ${niveauLabel}. Kies getallen zo dat het antwoord binnen dit bereik valt.`;

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

    const berekeningInstructie = inst.berekening
      ? `- Soort berekening: het vraagstuk moet gaan over "${inst.berekening}"`
      : '';

    // Tafels / notatie / bereik voor vermenigvuldigen
    let vermInstructie = '';
    if (inst.bewerking === 'vermenigvuldigen') {
      const tafels = inst.tafelsVerm && inst.tafelsVerm.length > 0
        ? `Gebruik enkel de tafels van: ${inst.tafelsVerm.join(', ')}. Geen andere tafels.`
        : 'Gebruik tafels naar keuze.';
      const notatie = inst.vermNotatie === 'achteraan'
        ? 'Schrijf de som als: getal × tafel (bv. 3 × 2, waarbij 2 de tafel is).'
        : 'Schrijf de som als: tafel × getal (bv. 2 × 3, waarbij 2 de tafel is).';
      const bereik = {
        'exe':    'Gebruik enkelvoudige getallen (1–10) als beide factoren (E×E, bv. 6×4).',
        'txe':    'Gebruik een rond tiental als eerste factor en een enkelvoudig getal als tweede (T×E, bv. 20×4). Geen eenheden in de eerste factor.',
        'texe':   'Gebruik een getal met tientallen én eenheden als eerste factor en een enkelvoudig getal als tweede (TE×E, bv. 32×4).',
        'txte':   'Gebruik een rond tiental als eerste factor en een twee-cijferig getal als tweede factor (T×TE, bv. 20×12).',
        'texte':  'Gebruik een getal met tientallen én eenheden als eerste factor en een twee-cijferig getal als tweede factor (TE×TE, bv. 32×12).',
        'htexe':  'Gebruik een drie-cijferig getal als eerste factor en een enkelvoudig getal als tweede (HTE×E, bv. 312×4).',
        'htexte': 'Gebruik een drie-cijferig getal als eerste factor en een twee-cijferig getal als tweede (HTE×TE, bv. 312×25).',
      }[inst.vermBereik] || '';

      // Uitkomst-beperking bij grotere bereiken
      const uitkomstMax = !['exe','txe'].includes(inst.vermBereik) ? (() => {
        const maxLabel = { tot20:'20', tot100:'100', tot1000:'1 000', tot10000:'10 000', tot100000:'100 000' }[inst.niveau];
        return maxLabel ? `BELANGRIJK: de uitkomst (het product) mag NOOIT groter zijn dan ${maxLabel}. Kies de factoren zo dat het antwoord binnen dit bereik blijft.` : '';
      })() : '';

      vermInstructie = `- Vermenigvuldigen: ${tafels} ${notatie} ${bereik} ${uitkomstMax}`;
    }

    // Tafels / deelvisie / notatie voor delen
    let deelInstructie = '';
    if (inst.bewerking === 'delen') {
      const tafels = inst.tafelsDeel && inst.tafelsDeel.length > 0
        ? `Gebruik enkel de deeltafels van: ${inst.tafelsDeel.join(', ')}. Geen andere tafels.`
        : 'Gebruik deeltafels naar keuze.';
      const bereikLabel = {
        'tee':   'Het DEELTAL moet een twee-cijferig getal zijn (TE, bv. 84). De DELER is een enkelvoudig getal (E, bv. 4). Voorbeeld: 84 ÷ 4.',
        'htee':  'Het DEELTAL moet een drie-cijferig getal zijn (HTE, bv. 846). De DELER is een enkelvoudig getal (E, bv. 4). Voorbeeld: 846 ÷ 4.',
        'dhtee': 'Het DEELTAL moet een vier-cijferig getal zijn (DHTE, bv. 8046). De DELER is een enkelvoudig getal (E, bv. 4). Voorbeeld: 8046 ÷ 4.',
        'tete':  'Het DEELTAL moet een twee-cijferig getal zijn (TE, bv. 84). De DELER is een twee-cijferig getal (TE, bv. 12). Voorbeeld: 84 ÷ 12.',
        'htete': 'Het DEELTAL moet een drie-cijferig getal zijn (HTE, bv. 846). De DELER is een twee-cijferig getal (TE, bv. 25). Voorbeeld: 846 ÷ 25.',
      }[inst.deelBereik] || 'Het deeltal is een twee-cijferig getal, de deler een enkelvoudig getal.';
      const visie = inst.deelVisie === 'aftrekking'
        ? 'Deelvisie: HERHAALDE AFTREKKING. Het kind verdeelt door herhaaldelijk af te trekken. Stel de situatie zo voor dat gevraagd wordt HOEVEEL GROEPJES je kan maken (bv. "Je hebt 10 snoepjes en stopt ze per 2 in een zakje — hoeveel zakjes?"). De antwoordzin vraagt naar het aantal groepjes.'
        : 'Deelvisie: EERLIJK VERDELEN. Deel een hoeveelheid eerlijk over een aantal groepen. Stel de situatie zo voor dat gevraagd wordt HOEVEEL ER PER GROEP is (bv. "Verdeel 10 snoepjes eerlijk over 2 zakjes — hoeveel per zakje?"). De antwoordzin vraagt naar het aantal per groep.';
      const notatie = inst.deelNotatie === 'achteraan'
        ? 'Schrijf de deling als: deler in deeltal (bv. 2 in 10).'
        : 'Schrijf de deling als: deeltal ÷ deler (bv. 10 ÷ 2).';
      const restLabel = inst.deelRest === 'ja'
        ? 'De deling MOET een rest hebben (rest ≠ 0). Kies getallen die NIET exact deelbaar zijn zodat er een rest overblijft. Vermeld de rest NIET in het vraagstuk zelf — het kind berekent die zelf.'
        : 'De deling moet EXACT opgaan, GEEN rest. Kies getallen zodat de rest nul is.';
      deelInstructie = `- Delen: ${bereikLabel} ${tafels} ${restLabel} ${visie} ${notatie}`;
    }

    const antwoordzinInstructie = inst.antwoordzin === 'deels'
      ? `Geef je antwoord in dit exacte formaat, met "---" als scheiding:
[vraagstuk tekst, elke zin op nieuwe regel]
---
[antwoordzin met ___ voor het ontbrekende getal, bv: "Er zijn ___ appels."]`
      : `Geef je antwoord in dit exacte formaat, met "---" als scheiding:
[vraagstuk tekst, elke zin op nieuwe regel]
---
[lege antwoordzin, schrijf enkel een lege lijn als: "_______________"]`;

    // Willekeurig variatie-element om herhaling te vermijden
    const namen = ['Emma','Luca','Sofie','Noah','Julie','Finn','Noor','Lars','Amber','Axel','Fien','Remi','Elisa','Wout','Hana','Bo','Tijs','Lore','Senne','Nathalie'];
    const settings = ['in de tuin','op school','op de markt','in het park','thuis','in de winkel','op de boerderij','in het bos','aan de zee','op de speelplaats','in de keuken','bij de bakker','in het zwembad','op de camping'];
    const r1 = namen[Math.floor(Math.random() * namen.length)];
    const r2 = namen.filter(n => n !== r1)[Math.floor(Math.random() * (namen.length - 1))];
    const setting = settings[Math.floor(Math.random() * settings.length)];
    const variatieInstructie = `- Gebruik de namen "${r1}" en/of "${r2}" en de setting "${setting}" als inspiratie voor een UNIEK verhaal. Kies zelf een origineel voorwerp of situatie — geen ballonnen, geen eieren tenzij het thema dat vraagt.`;

    const aantalInstructie = aantal > 1
      ? `Genereer ${aantal} VERSCHILLENDE vraagstukken. Elk vraagstuk heeft een ANDER verhaal, andere personages en andere situatie. Geef elk vraagstuk een nummer (1., 2., ...).`
      : 'Genereer 1 vraagstuk.';

    return `Je bent een Vlaamse onderwijsassistent die wiskundige vraagstukken maakt voor kinderen.

${aantalInstructie}

Vereisten:
- Leerjaar: ${leerjaarLabel}
- Bewerking: ${bewerkingLabel}
${niveauInstructie}
- Aantal getallen: ${aantalGetallenLabel}
${themaInstructie}
${berekeningInstructie ? berekeningInstructie : ''}
${vermInstructie ? vermInstructie : ''}
${deelInstructie ? deelInstructie : ''}
${variatieInstructie}
- Schrijf in eenvoudig, warm Nederlands (Vlaams) passend bij het leerjaar
- Het vraagstuk bevat 2-3 zinnen maximum
- Vermeld duidelijk de getallen en wat er berekend moet worden
- Elk vraagstuk moet een ANDER verhaal hebben dan vorige vraagstukken
- ${antwoordzinInstructie}

Geef ALLEEN het vraagstuk terug, zonder uitleg, zonder titel, zonder berekening.`;
  }

  // ── API AANROEP ──────────────────────────────────────────────
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
    // Splits vraagstuk en antwoordzin op ---
    const volledig = data.tekst;
    const delen = volledig.split('---');
    return {
      vraagstuk: (delen[0] || volledig).trim(),
      antwoordzin: (delen[1] || '').trim()
    };
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

    // Laad-status in sidebar
    const btn = document.getElementById('vs-btn-genereer');
    const sidebar = document.getElementById('vs-preview');
    btn.disabled = true;
    btn.textContent = '⏳ Genereren...';
    if (sidebar) sidebar.innerHTML = '<div class="vs-laden">✨ Claude bedenkt een vraagstuk...</div>';

    try {
      const prompt = bouwPrompt(inst, aantalNodig);
      const resultaat = await roepAPIaan(prompt);

      huidigVraagstuk = { ...resultaat, inst, tijdstip: new Date().toLocaleTimeString('nl-BE') };
      for (let i = 0; i < aantalNodig; i++) await verhoogTeller();

      toonPreview(resultaat.vraagstuk, resultaat.antwoordzin, inst);
      await updateLimietBadge();

    } catch (e) {
      if (sidebar) sidebar.innerHTML = `<div class="vs-fout">❌ Fout: ${e.message}</div>`;
      console.error(e);
    } finally {
      btn.disabled = false;
      btn.textContent = '✨ Genereer vraagstuk';
    }
  }

  // ── CIJFERSCHEMA BOUWEN ───────────────────────────────────────
  function vermBereikNaarAantalRijen(bereik) {
    return ['txte','texte','htexte'].includes(bereik || '') ? 6 : 4;
  }

  function deelBereikInfo(bereik) {
    // links = werkkolommen (deeltal/tussenstappen), rechts = antwoordkolommen (quotiënt)
    // rijenLinks = werkrijen links, rechts altijd 1 antwoordrij
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

  function bouwCijferSchema(headers, stap, aantalRijen) {
    if (!headers || headers.length === 0) headers = ['T', 'E'];
    if (!aantalRijen) aantalRijen = 4; // standaard: grijs + wit + dik + wit

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

    const headerRij = headers.map(h =>
      h === ',' ? `<div class="vs-cs-komma-header">,</div>`
      : `<div class="vs-cs-header" style="background:${kleuren[h]||'#e0e0e0'};color:${tekstKleuren[h]||'#333'};width:${celB}">${h}</div>`
    ).join('');

    const maakRij = (cls = '') => headers.map(h =>
      h === ',' ? `<div class="vs-cs-komma-cel"></div>`
      : `<div class="vs-cs-cel ${cls}" style="width:${celB}"></div>`
    ).join('');

    const stapLabel = stap ? `<div class="vs-cs-staplabel">${stap}</div>` : '';

    // Bouw datarijen op basis van aantalRijen
    // 4 rijen: grijs / wit / wit+dik / wit
    // 6 rijen: grijs / wit / wit+dik / wit / wit+dik / wit  (2-cijferige 2e factor)
    let dataRijen = '';
    if (aantalRijen === 6) {
      dataRijen = `
        ${maakRij('vs-cs-grijs')}
        ${maakRij()}
        ${maakRij('vs-cs-dik-onder')}
        ${maakRij()}
        ${maakRij('vs-cs-dik-onder')}
        ${maakRij()}`;
    } else {
      dataRijen = `
        ${maakRij('vs-cs-grijs')}
        ${maakRij()}
        ${maakRij('vs-cs-dik-onder')}
        ${maakRij()}`;
    }

    return `
      <div class="vs-cijfer-schema-blok">
        ${stapLabel}
        <div class="vs-cs-grid" style="grid-template-columns:${gridCols}">
          ${headerRij}
          ${dataRijen}
        </div>
      </div>`;
  }

  // ── HULPFUNCTIE: bouw schema-kaart HTML ──────────────────────
  // ── SCHEMA VOORBEELD IN SIDEBAR ─────────────────────────────
  function toonSchemaVoorbeeld(forceRefresh) {
    // Niet uitvoeren als de vraagstukken-tab niet actief is
    const tab = document.getElementById('tab-vraagstukken');
    if (!tab || tab.style.display === 'none') return;
    if (huidigVraagstuk && !forceRefresh) return;

    const metRooster     = document.getElementById('vs-schema-rooster')?.checked || false;
    const metCijfer      = document.getElementById('vs-schema-cijfer')?.checked  || false;
    const aantalGetallen = document.querySelector('input[name="vs-aantalgetallen"]:checked')?.value || '2';
    const drieGetallen   = aantalGetallen === '3' || aantalGetallen === 'gemengd';
    const sidebar        = document.getElementById('vs-preview');
    if (!sidebar) return;

    if (!metRooster && !metCijfer) {
      sidebar.innerHTML = '<div class="vs-leeg">Kies een schema en klik op "Genereer".</div>';
      return;
    }

    let roosterRijen = '';
    for (let r = 0; r < 8; r++) {
      let cellen = '';
      for (let k = 0; k < 12; k++) cellen += '<div class="vs-rooster-cel"></div>';
      roosterRijen += `<div class="vs-rooster-rij">${cellen}</div>`;
    }
    const bewerkingHTML = drieGetallen
      ? `<div class="vs-bewerking-blok"><div class="vs-bew-label">Bewerking:</div>
         <div class="vs-bew-stap">STAP 1</div><div class="vs-bew-lijn"></div>
         <div class="vs-bew-stap">STAP 2</div><div class="vs-bew-lijn"></div></div>`
      : `<div class="vs-bewerking-blok"><div class="vs-bew-label">Bewerking:</div>
         <div class="vs-bew-lijn"></div><div class="vs-bew-lijn"></div><div class="vs-bew-lijn"></div></div>`;

    let cijferHTML = '';
    if (metCijfer) {
      const inst2 = leesInstellingen();
      if (inst2.bewerking === 'delen') {
        cijferHTML = `<div class="vs-cijfer-label">Ik cijfer.</div>${bouwDeelSchema(inst2.deelBereik, inst2.deelRest === 'ja')}`;
      } else {
        const headers = leesKolommen();
        const nRijen = vermBereikNaarAantalRijen(inst2.vermBereik);
        cijferHTML = drieGetallen
          ? `<div class="vs-cijfer-label">Ik cijfer.</div><div class="vs-cijfer-stappen">${bouwCijferSchema(headers,'STAP 1',nRijen)}${bouwCijferSchema(headers,'STAP 2',nRijen)}</div>`
          : `<div class="vs-cijfer-label">Ik cijfer.</div>${bouwCijferSchema(headers,'',nRijen)}`;
      }
    }

    sidebar.innerHTML = `
        <div style="color:#aaa;font-style:italic;font-size:13px;margin-bottom:10px">
          ✏️ Klik op "Genereer" — het vraagstuk verschijnt hier.
        </div>
        <div class="vs-schema-zone">
          ${metRooster ? `<div class="vs-schema-links">
            <div class="vs-schema-label">Schema:</div>
            <div class="vs-rooster">${roosterRijen}</div>
          </div>` : ''}
          <div class="vs-schema-rechts">${bewerkingHTML}${cijferHTML}</div>
        </div>
        <div class="vs-antwoordzin-rij">
          <span class="vs-antw-label">Antwoordzin:</span>
          <div class="vs-antw-lijn"></div>
        </div>
      </div>`;
  }

  // ── PREVIEW TONEN (in sidebar, na genereren) ─────────────────
  function toonPreview(vraagstuk, antwoordzin, inst) {
    const sidebar = document.getElementById('vs-preview');
    if (!sidebar) return;

    const metRooster   = inst.schema.includes('rooster');
    const metCijfer    = inst.schema.includes('cijfer');
    const drieGetallen = inst.aantalGetallen === '3' || inst.aantalGetallen === 'gemengd';

    let roosterRijen = '';
    for (let r = 0; r < 8; r++) {
      let cellen = '';
      for (let k = 0; k < 12; k++) cellen += '<div class="vs-rooster-cel"></div>';
      roosterRijen += `<div class="vs-rooster-rij">${cellen}</div>`;
    }
    const bewerkingHTML = (metRooster || metCijfer) ? (drieGetallen
      ? `<div class="vs-bewerking-blok"><div class="vs-bew-label">Bewerking:</div>
         <div class="vs-bew-stap">STAP 1</div><div class="vs-bew-lijn"></div>
         <div class="vs-bew-stap">STAP 2</div><div class="vs-bew-lijn"></div></div>`
      : `<div class="vs-bewerking-blok"><div class="vs-bew-label">Bewerking:</div>
         <div class="vs-bew-lijn"></div><div class="vs-bew-lijn"></div><div class="vs-bew-lijn"></div></div>`)
      : '';

    let cijferHTML = '';
    if (metCijfer) {
      if (inst.bewerking === 'delen') {
        cijferHTML = `<div class="vs-cijfer-label">Ik cijfer.</div>${bouwDeelSchema(inst.deelBereik, inst.deelRest === 'ja')}`;
      } else {
        const headers = leesKolommen();
        const nRijen = vermBereikNaarAantalRijen(inst.vermBereik);
        cijferHTML = drieGetallen
          ? `<div class="vs-cijfer-label">Ik cijfer.</div><div class="vs-cijfer-stappen">${bouwCijferSchema(headers,'STAP 1',nRijen)}${bouwCijferSchema(headers,'STAP 2',nRijen)}</div>`
          : `<div class="vs-cijfer-label">Ik cijfer.</div>${bouwCijferSchema(headers,'',nRijen)}`;
      }
    }

    const antwoordHTML = antwoordzin
      ? `<div class="vs-antwoordzin-rij"><span class="vs-antw-label">Antwoordzin:</span><span class="vs-antw-tekst">${antwoordzin}</span></div>`
      : `<div class="vs-antwoordzin-rij"><span class="vs-antw-label">Antwoordzin:</span><div class="vs-antw-lijn"></div></div>`;

    const heeftSchema = metRooster || metCijfer;
    const schemaZone = heeftSchema ? `
      <div class="vs-schema-zone">
        ${metRooster ? `<div class="vs-schema-links">
          <div class="vs-schema-label">Schema:</div>
          <div class="vs-rooster">${roosterRijen}</div>
        </div>` : ''}
        <div class="vs-schema-rechts">${bewerkingHTML}${cijferHTML}</div>
      </div>${antwoordHTML}` : antwoordHTML;

    sidebar.innerHTML = `
      <div class="vs-kaart">
        <div class="vs-kaart-tekst">${vraagstuk.replace(/\n/g,'<br>')}</div>
        ${schemaZone}
        <div class="vs-acties">
          <button class="vs-btn-toevoegen" onclick="VraagstukkenModule.voegToeAanBundel()">
            ＋ Voeg toe aan bundel
          </button>
          <button class="vs-btn-opnieuw" onclick="VraagstukkenModule._reset()">
            🔄 Nieuw vraagstuk
          </button>
        </div>
      </div>`;
  }

  // ── TOEVOEGEN AAN BUNDEL ─────────────────────────────────────
  function voegToeAanBundel() {
    if (!huidigVraagstuk) {
      toonMelding('⚠️ Genereer eerst een vraagstuk.', 'waarschuwing');
      return;
    }
    const inst = huidigVraagstuk.inst;

    const blok = {
      id:          `blok-vraagstuk-${Date.now()}`,
      bewerking:   'vraagstukken',
      niveau:      inst.niveau,
      opdrachtzin: '',
      hulpmiddelen: [],
      oefeningen:  [],
      vraagstuk:   huidigVraagstuk.vraagstuk,
      antwoordzin: huidigVraagstuk.antwoordzin,
      inst,
      config: { ...inst },
    };

    // Voeg toe via App (centrale bundelData)
    if (typeof App !== 'undefined' && typeof App.voegVraagstukBlokToe === 'function') {
      App.voegVraagstukBlokToe(blok);
    } else {
      console.error('App.voegVraagstukBlokToe niet beschikbaar — controleer of app.js correct geladen is.');
      toonMelding('❌ Kan niet toevoegen: app.js niet up-to-date.', 'fout');
      return;
    }

    // Lokale teller voor sidebar
    gegenereerdeVraagstukken.push({ ...blok });
    updateBundelTeller();
    renderBundelLijst();

    // Reset sidebar-preview naar leeg schema
    huidigVraagstuk = null;
    toonSchemaVoorbeeld();
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
        <div class="vs-bundel-tekst">${(v.vraagstuk || '').replace(/\n/g, '<br>').substring(0, 100)}${(v.vraagstuk || '').length > 100 ? '...' : ''}</div>
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
    // filterNiveaus enkel aanroepen, GEEN toonSchemaVoorbeeld —
    // dat gebeurt pas als de tab echt geopend wordt via toonBewerking
    filterNiveaus('2');
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
    // Komma melding checken
    checkKomma();
  }

  // ── KOMMA CHECK ───────────────────────────────────────────────
  function checkKomma() {
    const niveau = document.querySelector('input[name="vs-niveau"]:checked')?.value || '';
    const bewerking = document.querySelector('input[name="vs-bewerking"]:checked')?.value || '';
    const isKomma = niveau === 'kommagetallen';
    const isVermDeel = bewerking === 'vermenigvuldigen' || bewerking === 'delen';
    const melding = document.getElementById('vs-komma-melding');
    if (melding) melding.style.display = (isKomma && isVermDeel) ? '' : 'none';
  }

  // ── KOMMA NIVEAU TOGGLE ──────────────────────────────────────
  function toggleKomma(tonen) {
    const el = document.getElementById('vs-komma-niveau-opties');
    if (el) el.style.display = tonen ? '' : 'none';
    checkKomma();
  }

  // ── NIVEAU FILTER PER LEERJAAR ───────────────────────────────
  const NIVEAUS_PER_LEERJAAR = {
    '1': ['tot10', 'tot20'],
    '2': ['tot20', 'tot100'],
    '3': ['tot100', 'tot1000'],
    '4': ['tot1000', 'tot10000', 'kommagetallen'],
    '5': ['tot10000', 'tot100000', 'kommagetallen'],
    '6': ['tot10000', 'tot100000', 'kommagetallen']
  };

  function filterNiveaus(leerjaar) {
    const toegestaan = NIVEAUS_PER_LEERJAAR[leerjaar] || [];
    const allLabels = document.querySelectorAll('input[name="vs-niveau"]');
    let eersteZichtbare = null;

    allLabels.forEach(input => {
      const label = input.closest('label');
      if (!label) return;
      const zichtbaar = toegestaan.includes(input.value);
      label.style.display = zichtbaar ? '' : 'none';
      if (zichtbaar && !eersteZichtbare) eersteZichtbare = input;
    });

    // Selecteer automatisch het eerste beschikbare niveau
    if (eersteZichtbare) {
      const huidig = document.querySelector('input[name="vs-niveau"]:checked');
      if (huidig && !toegestaan.includes(huidig.value)) {
        eersteZichtbare.checked = true;
        const label = eersteZichtbare.closest('label');
        document.querySelectorAll('input[name="vs-niveau"]').forEach(i => i.closest('label')?.classList.remove('geselecteerd'));
        label?.classList.add('geselecteerd');
        if (eersteZichtbare.value === 'kommagetallen') {
          document.getElementById('vs-komma-niveau-opties').style.display = '';
        } else {
          const el = document.getElementById('vs-komma-niveau-opties');
          if (el) el.style.display = 'none';
        }
      }
    }
    // Alleen schema-voorbeeld tonen als de tab al zichtbaar is
    const tab = document.getElementById('tab-vraagstukken');
    if (tab && tab.style.display !== 'none') toonSchemaVoorbeeld();
  }

  // ── CIJFER OPTIES TOGGLE ─────────────────────────────────────
  function toggleCijferOpties(aan) {
    const opties = document.getElementById('vs-cijfer-opties');
    if (opties) opties.style.display = aan ? '' : 'none';
    toonSchemaVoorbeeld();
  }

  // ── KOLOM TOGGLE ─────────────────────────────────────────────
  function toggleKolom(kolom, el) {
    el.classList.toggle('geselecteerd');
    const cb = document.getElementById(`vs-col-${kolom}`);
    if (cb) cb.checked = el.classList.contains('geselecteerd');
    updateSchemaPreview();
  }

  // ── KOLOMMEN BEPALEN OP BASIS VAN NIVEAU ─────────────────────
  function leesKolommen() {
    const niveau = document.querySelector('input[name="vs-niveau"]:checked')?.value || 'tot20';
    const bewerking = document.querySelector('input[name="vs-bewerking"]:checked')?.value || 'optellen';
    const vermBereik = document.querySelector('input[name="vs-verm-bereik"]:checked')?.value || 'exe';

    // Bij vermenigvuldigen: kolommen bepalen op basis van niveau (= max uitkomst)
    if (bewerking === 'vermenigvuldigen') {
      if (vermBereik === 'exe') return ['T','E'];
      if (vermBereik === 'txe') return ['H','T','E'];
      // Grotere bereiken: niveau bepaalt kolommen
      if (niveau === 'tot100')    return ['T','E'];
      if (niveau === 'tot1000')   return ['H','T','E'];
      if (niveau === 'tot10000')  return ['D','H','T','E'];
      if (niveau === 'tot100000') return ['TD','D','H','T','E'];
      // Fallback op bereik
      if (['texe','txte'].includes(vermBereik))            return ['H','T','E'];
      if (['texte','htexe','htexte'].includes(vermBereik)) return ['D','H','T','E'];
      return ['H','T','E'];
    }

    if (niveau === 'kommagetallen') {
      const prefix = document.querySelector('input[name="vs-komma-prefix"]:checked')?.value || 'E';
      const dec    = document.querySelector('input[name="vs-komma-niveau"]:checked')?.value || 't';
      const prefixKols = { 'E':[], 'TE':['T'], 'HTE':['H','T'] };
      const decKols    = { 't':['t'], 'th':['t','h'], 'thd':['t','h','d'] };
      return [...(prefixKols[prefix]||[]), 'E', ',', ...(decKols[dec]||['t'])];
    }
    if (niveau === 'tot100000') return ['TD','D','H','T','E'];
    if (niveau === 'tot10000')  return ['D','H','T','E'];
    if (niveau === 'tot1000')   return ['H','T','E'];
    if (niveau === 'tot100')    return ['T','E'];
    return ['E']; // tot5, tot10, tot20
  }

  // ── SCHEMA LIVE PREVIEW ──────────────────────────────────────
  function updateSchemaPreview() {
    const zone = document.getElementById('vs-schema-preview');
    if (!zone) return;
    // Alleen tonen als cijfer-schema aangevinkt is
    const metCijfer = document.getElementById('vs-schema-cijfer')?.checked;
    if (!metCijfer) { zone.innerHTML = ''; return; }

    const headers = leesKolommen();
    if (headers.length === 0) { zone.innerHTML = ''; return; }

    const kleuren = {
      'TD':'#c8e6c9','D':'#ffcdd2','H':'#bbdefb','T':'#81c784','E':'#FFC107',
      ',':'#e0e0e0','t':'#fff9c4','h':'#fff9c4','d':'#fff9c4'
    };
    const tekstKleuren = {
      'TD':'#1b5e20','D':'#b71c1c','H':'#0d47a1','T':'#1b5e20','E':'#e65100',
      ',':'#555','t':'#f57f17','h':'#f57f17','d':'#f57f17'
    };

    const celB = headers.length > 5 ? '24px' : '32px';
    const gridCols = headers.map(h => h === ',' ? '12px' : celB).join(' ');

    const headerRij = headers.map(h =>
      h === ',' ? `<div style="width:12px;height:24px;background:#bbb;border:1px solid #bbb;display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;font-weight:700">,</div>`
      : `<div style="width:${celB};height:24px;background:${kleuren[h]||'#eee'};border:1px solid #bbb;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:${tekstKleuren[h]||'#333'}">${h}</div>`
    ).join('');

    const maakRij = (grijs, dik) => headers.map(h =>
      h === ',' ? `<div style="width:12px;height:22px;background:#e0e0e0;border:1px solid #ddd;${dik?'border-bottom:2.5px solid #555':''}"></div>`
      : `<div style="width:${celB};height:22px;background:${grijs?'#e0e0e0':'#fff'};border:1px solid #ddd;${dik?'border-bottom:2.5px solid #555':''}"></div>`
    ).join('');

    zone.innerHTML = `
      <div style="font-size:11px;color:#888;margin-bottom:4px">Voorbeeld schema (automatisch op basis van niveau):</div>
      <div style="display:inline-flex;flex-direction:column;border:1px solid #bbb">
        <div style="display:grid;grid-template-columns:${gridCols}">${headerRij}</div>
        <div style="display:grid;grid-template-columns:${gridCols}">${maakRij(true,false)}</div>
        <div style="display:grid;grid-template-columns:${gridCols}">${maakRij(false,false)}</div>
        <div style="display:grid;grid-template-columns:${gridCols}">${maakRij(false,true)}</div>
        <div style="display:grid;grid-template-columns:${gridCols}">${maakRij(false,false)}</div>
      </div>`;
  }

  // ── SCHEMA TOGGLE ────────────────────────────────────────────
  function toggleSchema(waarde, el) {
    el.classList.toggle('geselecteerd');
    const cb = document.getElementById(`vs-schema-${waarde}`);
    if (cb) cb.checked = !cb.checked;
    // Toon/verberg cijfer-opties
    if (waarde === 'cijfer') {
      const opties = document.getElementById('vs-cijfer-opties');
      if (opties) opties.style.display = cb.checked ? '' : 'none';
    }
  }

  // ── KOMMA OPTIES TOGGLE (via radio) ──────────────────────────
  // Wordt aangeroepen vanuit App.selecteerRadio voor vs-cijfer-kolommen
  function updateKommaOpties() {
    const val = document.querySelector('input[name="vs-cijfer-kolommen"]:checked')?.value;
    const kommaOpties = document.getElementById('vs-komma-opties');
    if (kommaOpties) kommaOpties.style.display = val === 'komma' ? '' : 'none';
  }

  // ── THEMA CHIP SELECTIE ──────────────────────────────────────
  function kiesThema(waarde, el) {
    document.querySelectorAll('.vs-thema-chip[onclick*="_kiesThema"]').forEach(c => c.classList.remove('actief'));
    el.classList.add('actief');
    const input = document.getElementById('vs-thema');
    if (input) input.value = waarde;
  }

  // ── BEREKENING CHIP SELECTIE ─────────────────────────────────
  function kiesBerekening(waarde, el) {
    document.querySelectorAll('.vs-thema-chip[onclick*="_kiesBerekening"]').forEach(c => c.classList.remove('actief'));
    el.classList.add('actief');
    const input = document.getElementById('vs-berekening');
    if (input) input.value = waarde;
  }

  // ── PUBLIEKE API ─────────────────────────────────────────────
  function reset() {
    huidigVraagstuk = null;
    toonSchemaVoorbeeld();
  }

  return { genereer, voegToeAanBundel, verwijderUitBundel, init, reset, getBundel: () => gegenereerdeVraagstukken, _kiesBewerking: kiesBewerking, _kiesThema: kiesThema, _kiesBerekening: kiesBerekening, _toggleSchema: toggleSchema, _toggleCijferOpties: toggleCijferOpties, _toggleKolom: toggleKolom, _toggleKomma: toggleKomma, _checkKomma: checkKomma, _filterNiveaus: filterNiveaus, _updateSchemaPreview: updateSchemaPreview, _toonSchemaVoorbeeld: toonSchemaVoorbeeld, _reset: reset };

})();