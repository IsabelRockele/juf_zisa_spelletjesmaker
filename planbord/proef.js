(function () {
  const OPSLAGSLEUTEL = 'juf-zisa-planbord-proef-v39';
  const DB_NAAM = 'juf-zisa-klasbord-proef';
  const DB_WINKEL = 'bordensets';
  const frame = document.getElementById('planbord-frame');
  const lijst = document.getElementById('bordenlijst');
  const naamveld = document.getElementById('bordnaam');
  const status = document.getElementById('bewaarstatus');
  let set = null;
  let actiefId = null;
  let frameKlaar = false;
  let laatsteSnapshot = '';
  let wisselt = false;
  let klasmodus = false;

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const aanvraag = indexedDB.open(DB_NAAM, 1);
      aanvraag.onupgradeneeded = () => {
        if (!aanvraag.result.objectStoreNames.contains(DB_WINKEL)) aanvraag.result.createObjectStore(DB_WINKEL);
      };
      aanvraag.onsuccess = () => resolve(aanvraag.result);
      aanvraag.onerror = () => reject(aanvraag.error);
    });
  }

  async function leesUitDatabase() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const aanvraag = db.transaction(DB_WINKEL, 'readonly').objectStore(DB_WINKEL).get(OPSLAGSLEUTEL);
      aanvraag.onsuccess = () => resolve(aanvraag.result || null);
      aanvraag.onerror = () => reject(aanvraag.error);
    });
  }

  async function schrijfNaarDatabase(waarde) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transactie = db.transaction(DB_WINKEL, 'readwrite');
      transactie.objectStore(DB_WINKEL).put(waarde, OPSLAGSLEUTEL);
      transactie.oncomplete = () => resolve();
      transactie.onerror = () => reject(transactie.error);
    });
  }

  async function wisDatabase() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transactie = db.transaction(DB_WINKEL, 'readwrite');
      transactie.objectStore(DB_WINKEL).delete(OPSLAGSLEUTEL);
      transactie.oncomplete = () => resolve();
      transactie.onerror = () => reject(transactie.error);
    });
  }

  async function laadSet() {
    try {
      const opgeslagen = await leesUitDatabase();
      if (opgeslagen && opgeslagen.versie >= 2 && Array.isArray(opgeslagen.borden) && opgeslagen.borden.length) return opgeslagen;
    } catch (fout) {
      console.warn('Ruime browseropslag is niet beschikbaar.', fout);
    }
    // Eenmalige migratie van de eerste proefversie.
    try {
      const opgeslagen = JSON.parse(localStorage.getItem(OPSLAGSLEUTEL));
      if (opgeslagen && opgeslagen.versie >= 2 && Array.isArray(opgeslagen.borden) && opgeslagen.borden.length) {
        schrijfNaarDatabase(opgeslagen).catch(() => {});
        return opgeslagen;
      }
    } catch (fout) {
      console.warn('Opgeslagen proefborden konden niet worden gelezen.', fout);
    }
    const nieuw = window.maakProefSjablonen();
    nieuw.actiefId = nieuw.borden[0].id;
    return nieuw;
  }

  function huidigBord() { return set.borden.find((bord) => bord.id === actiefId); }

  async function bewaarSet() {
    if (!set) return;
    set.actiefId = actiefId;
    try {
      await schrijfNaarDatabase(set);
      status.textContent = `Automatisch bewaard om ${new Date().toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })}`;
    } catch (fout) {
      console.warn('Automatisch bewaren is mislukt.', fout);
      status.textContent = 'Gebruik “Bordenset meenemen” om je werk veilig te bewaren';
    }
  }

  function leesFrame() {
    if (!frameKlaar || wisselt) return null;
    const win = frame.contentWindow;
    if (!win || typeof win.exporteerBord !== 'function') return null;
    return win.exporteerBord();
  }

  function bewaarHuidigBord() {
    const bord = huidigBord();
    const data = leesFrame();
    if (!bord || !data) return;
    const snapshot = JSON.stringify(data);
    if (snapshot === laatsteSnapshot) return;
    bord.data = data;
    laatsteSnapshot = snapshot;
    bewaarSet();
  }

  function tekenNavigatie() {
    if (!set) return;
    lijst.innerHTML = '';
    set.borden.forEach((bord, index) => {
      const rij=document.createElement('div');rij.className=`bordregel${bord.zichtbaar===false?' verborgen-bord':''}`;
      const knop = document.createElement('button');
      knop.type = 'button';
      knop.className = `bordknop${bord.id === actiefId ? ' actief' : ''}`;
      knop.innerHTML = `<span class="bordicoon">${bord.icoon || '📌'}</span><span><strong>${veilig(bord.naam)}</strong><small>${veilig(bord.omschrijving || `Bord ${index + 1}`)}</small></span>`;
      knop.addEventListener('click', () => openBord(bord.id));
      const opties=document.createElement('div');opties.className='bordvolgorde';
      const toon=document.createElement('label');toon.title='Dit bord in de klasmodus tonen';const vink=document.createElement('input');vink.type='checkbox';vink.checked=bord.zichtbaar!==false;vink.onchange=()=>{bord.zichtbaar=vink.checked;tekenNavigatie();bewaarSet();};toon.append(vink,document.createTextNode(' tonen'));
      const omhoog=document.createElement('button'),omlaag=document.createElement('button');omhoog.type=omlaag.type='button';omhoog.textContent='↑';omlaag.textContent='↓';omhoog.title='Eerder tonen';omlaag.title='Later tonen';omhoog.disabled=index===0;omlaag.disabled=index===set.borden.length-1;
      const verplaats=(delta)=>{const doel=index+delta;if(doel<0||doel>=set.borden.length)return;[set.borden[index],set.borden[doel]]=[set.borden[doel],set.borden[index]];tekenNavigatie();bewaarSet();};omhoog.onclick=()=>verplaats(-1);omlaag.onclick=()=>verplaats(1);
      opties.append(toon,omhoog,omlaag);rij.append(knop,opties);lijst.appendChild(rij);
    });
  }

  function veilig(tekst) {
    return String(tekst).replace(/[&<>"']/g, (teken) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[teken]));
  }

  function openBord(id) {
    if (!frameKlaar || id === actiefId) return;
    bewaarHuidigBord();
    actiefId = id;
    laadActiefBord();
  }

  function laadActiefBord() {
    const bord = huidigBord();
    if (!bord || !frameKlaar) return;
    wisselt = true;
    frame.contentWindow.importeerBord(JSON.parse(JSON.stringify(bord.data)));
    if (bord.rijk && typeof window.renderRijkBord === 'function') {
      window.renderRijkBord(frame.contentWindow, bord, !klasmodus, () => bewaarSet());
    }
    laatsteSnapshot = JSON.stringify(frame.contentWindow.exporteerBord());
    naamveld.value = bord.naam;
    werkKlasnavigatieBij();
    tekenNavigatie();
    bewaarSet();
    wisselt = false;
  }

  const EXTRA_AFBEELDINGEN = [
    ['maandag', 'maandag'], ['dinsdag', 'dinsdag'], ['woensdag', 'woensdag'], ['donderdag', 'donderdag'],
    ['vrijdag', 'vrijdag'], ['zaterdag', 'zaterdag'], ['zondag', 'zondag'],
    ['zon', 'zon'], ['halfbewolkt', 'half bewolkt'], ['bewolkt', 'bewolkt'], ['zwaar-bewolkt', 'zwaar bewolkt'],
    ['lichte-regen', 'lichte regen'], ['zware-regen', 'zware regen'], ['hagel', 'hagel'], ['onweer', 'onweer'], ['storm', 'storm'],
    ['veel-wind', 'veel wind'], ['beetje-wind', 'een beetje wind'], ['windstil', 'windstil'], ['wind', 'wind'],
    ['sneeuw', 'sneeuw'], ['regenboog', 'regenboog'], ['warm', 'warm'], ['koud', 'koud'],
    ['turnen', 'turnen'], ['zwemmen', 'zwemmen'], ['godsdienst', 'godsdienst'], ['muzische-vorming', 'muzische vorming'],
    ['wereldorientatie', 'WO'], ['rekenen', 'rekenen'], ['taal', 'taal'], ['lezen', 'lezen'],
    ['spelling', 'spelling'], ['handschrift', 'handschrift'], ['speeltijd', 'speeltijd'], ['uitstap', 'uitstap'],
    ['verjaardag', 'verjaardag'], ['sinterklaas', 'Sinterklaas'], ['pasen', 'Pasen'], ['strapdag', 'Strapdag'],
    ['brooddoos-broodbak', 'brooddoos in broodbak'], ['drinkbus-vaste-plek', 'drinkbus op vaste plek'],
    ['snack-fruit-bak', 'koek en fruit in de bak'], ['agendamap-tafel', 'agendamap op tafel'],
    ['brieven-afgeven', 'brieven afgeven'], ['huistaak-afgeven', 'huistaak afgeven'],
    ['boekentas-opbergen', 'boekentas opbergen'], ['stille-dagstarter', 'stil aan de dagstarter'],
    ['jas-kapstok','jas aan de kapstok'],['werkplek-opruimen','werkplek opruimen'],['rustig-in-rij','rustig in de rij'],
    ['stil-binnenkomen','stil binnenkomen'],['agenda-invullen','agenda invullen'],['boekentas-maken','boekentas maken'],
    ['tafel-taakje-opruimen','tafel en taakje opruimen'],['stoel-onder-tafel','stoel onder tafel'],['stoel-op-tafel','stoel op tafel'],
    ['bakje-netjes','bakje netjes'],['bakje-in-kast','bakje in de kast'],['losse-drinkbus','drinkbus'],
    ['losse-brooddoos','brooddoos'],['losse-koekendoos','koekendoos'],['losse-fruitdoos','fruitdoos'],
    ['losse-agendamap','agendamap'],['losse-huistaken','huistaken'],
    ['boom-lente','boom in de lente'],['boom-zomer','boom in de zomer'],['boom-herfst','boom in de herfst'],['boom-winter','boom in de winter'],
    ['decor-terug-school', 'terug naar school'], ['decor-herfst', 'herfstdecoratie'], ['decor-winter', 'winterdecoratie'],
    ['decor-lente', 'lentedecoratie'], ['decor-zomer', 'zomerdecoratie'], ['decor-kerst', 'kerstdecoratie'],
    ['decor-sinterklaas', 'Sinterklaasdecoratie'], ['decor-pasen', 'paasdecoratie'], ['decor-valentijn', 'valentijn'],
    ['decor-carnaval', 'carnaval'], ['decor-sportdag', 'sportdag'], ['decor-strapdag', 'Strapdag'], ['decor-halloween', 'Halloween'],
    ['film','naar de film'],['toneel','naar toneel'],['schoolreis','schoolreis'],['schoolfeest','schoolfeest'],['schoolmusical','schoolmusical'],
    ['soep-school','soep op school'],['schoolfruit','fruit van de school'],['ontbijt-school','ontbijt op school'],['eetfestijn','eetfestijn'],
    ['moederdag','moederdag'],['vaderdag','vaderdag'],['dikke-truiendag','dikke truiendag'],['wieltjesdag','wieltjesdag'],
    ['doe-doosjes','doe-doosjes'],['ipad','iPad'],['laptop','laptop'],['toets','toets'],
    ['levensbeschouwing','levensbeschouwing'],['levensbeschouwing-nieuw','levensbeschouwing'],['katholieke-godsdienst','katholieke godsdienst'],
    ['islamitische-godsdienst','islamitische godsdienst'],['protestantse-godsdienst','protestantse godsdienst'],['orthodoxe-godsdienst','orthodoxe godsdienst'],
    ['anglicaanse-godsdienst','anglicaanse godsdienst'],['zedenleer','niet-confessionele zedenleer'],
    ['meisje-heet','meisje voor heet weer'],['meisje-warm','meisje voor warm weer'],['meisje-fris','meisje voor fris weer'],['meisje-koud','meisje voor koud weer'],
    ['meisje-vriezen','meisje voor vriesweer'],['meisje-regen','meisje voor regen'],['meisje-wind','meisje voor wind'],
    ['jongen-heet','jongen voor heet weer'],['jongen-warm','jongen voor warm weer'],['jongen-fris','jongen voor fris weer'],['jongen-koud','jongen voor koud weer'],
    ['jongen-vriezen','jongen voor vriesweer'],['jongen-regen','jongen voor regen'],['jongen-wind','jongen voor wind'],
    ['boerderijklassen','boerderijklassen'],['sportklassen','sportklassen'],['zeeklassen','zeeklassen'],['bosklassen','bosklassen'],
  ];

  function installeerProefBibliotheek(win) {
    const grid = win.document.getElementById('bib-grid');
    if (!grid || grid.dataset.proefUitgebreid) return;
    grid.dataset.proefUitgebreid = 'ja';
    EXTRA_AFBEELDINGEN.forEach(([bestandsnaam, naam]) => {
      const bestand = `../assets/icons/${bestandsnaam}.png?schoon=39`;
      const item = win.document.createElement('div');
      item.className = 'bib-item proef-bib-item';
      item.dataset.bestand = bestand;
      item.dataset.naam = naam;
      item.draggable = true;
      const img = win.document.createElement('img');
      img.src = `afbeeldingen/${bestand}`;
      img.alt = naam;
      img.draggable = false;
      const label = win.document.createElement('span');
      label.className = 'naam';
      label.textContent = naam;
      item.append(img, label);
      item.addEventListener('click', () => win.voegAfbeeldingToe(bestand, naam));
      item.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('text/plain', bestand);
        event.dataTransfer.effectAllowed = 'copy';
      });
      grid.appendChild(item);
    });
  }

  function tekenEigenBibliotheek(win) {
    const grid=win.document.getElementById('bib-grid');
    if(!grid||!set)return;
    grid.querySelectorAll('.eigen-bib-item').forEach(el=>el.remove());
    (set.eigenBibliotheek||[]).forEach(item=>{
      const kaart=win.document.createElement('div');kaart.className='bib-item eigen-bib-item';kaart.title='Klik om op het huidige bord te zetten';
      const img=win.document.createElement('img');img.src=item.bron;img.alt=item.naam;img.draggable=false;
      const label=win.document.createElement('span');label.className='naam';label.textContent=item.naam;
      const wis=win.document.createElement('button');wis.type='button';wis.textContent='×';wis.title='Uit mijn bibliotheek verwijderen';
      wis.style.cssText='position:absolute;right:3px;top:3px;width:24px;height:24px;border:0;border-radius:50%;color:#8b3348;background:#ffe5ec;font-weight:900;';
      wis.onclick=e=>{e.stopPropagation();if(!confirm(`“${item.naam}” uit je eigen bibliotheek verwijderen? Afbeeldingen die al op een bord staan blijven staan.`))return;set.eigenBibliotheek=set.eigenBibliotheek.filter(x=>x.id!==item.id);tekenEigenBibliotheek(win);bewaarSet();};
      kaart.style.position='relative';kaart.append(img,label,wis);kaart.onclick=()=>win.voegAfbeeldingToe(item.bron,item.naam);grid.prepend(kaart);
    });
    win._proefOrdenAfbeeldingen?.();
  }

  function installeerRustigeEditor(win) {
    if (win.document.getElementById('proef-rustige-editor')) return;
    const stijl = win.document.createElement('style');
    stijl.id = 'proef-rustige-editor';
    stijl.textContent = `
      body.proef-editor .topbar { display: none !important; }
      body.proef-editor:not(.in-presentatie) { overflow:auto !important; }
      body.proef-editor .werkruimte { height: 100vh !important; }
      body.proef-editor:not(.in-presentatie) .werkruimte { overflow:auto !important; }
      body.proef-editor .zijpaneel { display: none; width: 290px; min-width: 290px; box-shadow: 8px 0 22px rgba(42,34,88,.12); z-index: 20; }
      body.proef-editor .zijpaneel.proef-paneel-open { display: flex; }
      body.proef-editor .proef-paneel-sluiten { position:absolute; z-index:5; right:10px; top:9px; width:38px; height:38px; border:0; border-radius:50%; color:#fff; background:#c94f68; font-size:25px; font-weight:900; cursor:pointer; }
      body.proef-editor .zijpaneel .tabs { padding-right:48px; }
      body.proef-editor .zijpaneel .tab[data-tab="vakken"] { display:none; }
      body.proef-editor .zijpaneel .tab[data-tab="afbeeldingen"] { width:100%; pointer-events:none; }
      body.proef-editor .proef-afbeeldingen-zoeken { width:calc(100% - 20px); margin:10px; padding:11px 13px; border:2px solid #d8d2ef; border-radius:12px; color:#342861; background:#fff; font:600 14px/1.2 inherit; outline:none; }
      body.proef-editor .proef-afbeeldingen-zoeken:focus { border-color:#755fc9; box-shadow:0 0 0 3px rgba(117,95,201,.14); }
      body.proef-editor .proef-geen-afbeeldingen { margin:16px 10px; color:#6f6880; text-align:center; line-height:1.45; }
      body.proef-editor #bib-grid { display:block; }
      body.proef-editor .proef-afbeelding-categorie { margin:8px 10px; border:1px solid #ded8f1; border-radius:12px; background:#fff; overflow:hidden; }
      body.proef-editor .proef-afbeelding-categorie > summary { padding:11px 12px; color:#443486; background:#f2effc; font-weight:900; cursor:pointer; }
      body.proef-editor .proef-cat-aantal { float:right; color:#756c91; font-size:12px; }
      body.proef-editor .proef-cat-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; padding:9px; }
      body.proef-editor .canvas-zone { padding: 12px; }
      body.proef-editor:not(.in-presentatie) .canvas-zone { overflow:auto !important; align-items:flex-start !important; justify-content:flex-start !important; scrollbar-gutter:stable both-edges; }
      body.proef-editor:not(.in-presentatie) #bord { transform-origin:top left !important; }
      body.proef-editor #bord { box-shadow: 0 8px 30px rgba(38,30,76,.15); }
      body.proef-editor #bord, body.proef-editor #bord-canvas { overflow: visible !important; }
      body.proef-editor .bord-header { position:relative; z-index:1; }
      body.proef-editor #bord-canvas { z-index:5; }
      body.proef-editor .vak, body.proef-editor .canvas-afbeelding { z-index: 80 !important; }
      body.proef-editor .vak { container-type:size; }
      body.proef-editor .vak[data-vaktype="weer"] > .vak-titel, body.proef-editor .vak[data-vaktype="timer"] > .vak-titel, body.proef-editor .vak[data-vaktype="werkstijl"] > .vak-titel { display:none !important; }
      body.proef-editor .vak[data-vaktype="weer"] .weer-inhoud, body.proef-editor .vak[data-vaktype="timer"] .timer-inhoud { height:100%; }
      body.proef-editor .vak[data-vaktype="weer"] .weer-icoon-groot { font-size:clamp(42px,24cqw,150px); }
      body.proef-editor .vak[data-vaktype="weer"] .weer-temperatuur { font-size:clamp(34px,18cqw,110px); }
      body.proef-editor .vak[data-vaktype="weer"] .weer-omschrijving { font-size:clamp(12px,6cqw,34px); }
      body.proef-editor .vak[data-vaktype="weer"] .weer-locatie-label { font-size:clamp(10px,4cqw,24px); }
      body.proef-editor .vak[data-vaktype="weer"] .weer-rij { gap:clamp(8px,4cqw,28px); }
      body.proef-editor .vak[data-vaktype="werkstijl"] .werkstijl-emoji { font-size:clamp(64px,28cqw,190px); }
      body.proef-editor .vak[data-vaktype="werkstijl"] .werkstijl-label { font-size:clamp(16px,7cqw,42px); }
      body.proef-editor .vak[data-vaktype="werkstijl"] .werkstijl-knop { font-size:clamp(11px,4cqw,22px); }
      body.proef-editor .vak[data-vaktype="vrij"] .vak-inhoud { font-size:clamp(16px,6cqw,42px); }
      body.proef-editor .vak[data-vaktype="checklist"] .item-tekst { font-size:clamp(14px,4.5cqw,30px); }
      body.proef-editor .vak[data-vaktype="timer"] { min-width:310px; min-height:330px; overflow:visible; container-type:size; padding:12px 15px 18px; }
      body.proef-editor .vak[data-vaktype="timer"] .timer-inhoud { overflow:visible; gap:6px; }
      body.proef-editor .vak[data-vaktype="timer"] .timer-visueel { flex:1 1 auto; width:100%; height:calc(100% - 58px); max-height:none; min-height:180px; overflow:hidden; }
      body.proef-editor .vak[data-vaktype="timer"] .timer-svg { width:100%; height:100%; max-height:none; }
      body.proef-editor .vak[data-vaktype="timer"] .timer-cijfers { font-size:clamp(28px,14cqw,74px); }
      body.proef-editor .vak[data-vaktype="timer"] .timer-knoppen { position:absolute; z-index:8; left:auto; right:4px; bottom:-48px; transform:none; gap:8px; padding:6px 9px; border:1px solid #d8d2ef; border-radius:11px; background:#fff; box-shadow:0 5px 14px rgba(42,32,88,.2); }
      body.proef-editor .vak[data-vaktype="timer"] .timer-knop { width:36px; height:34px; opacity:1; }
      body.proef-editor.in-presentatie .vak[data-vaktype="timer"] .timer-knoppen { display:flex!important; }
      body.proef-editor .timer-sleepbalk { position:absolute; z-index:9; left:4px; bottom:-48px; height:47px; display:flex; align-items:center; padding:0 14px; border:1px solid #d8d2ef; border-radius:11px; color:#fff; background:#6754bd; box-shadow:0 5px 14px rgba(42,32,88,.2); font-size:13px; font-weight:900; cursor:grab; touch-action:none; white-space:nowrap; }
      body.proef-editor .timer-sleepbalk:active { cursor:grabbing; }
      body.proef-editor .vak-actie.proef-verwijder-kruis { color:#fff !important; background:#d83f58 !important; font-size:20px !important; font-weight:1000 !important; line-height:1 !important; }
      body.proef-editor .vak-actie.proef-verwijder-kruis:hover { background:#b92540 !important; transform:scale(1.08); }
      body.proef-editor .bord-header { min-height: 116px; }
      body.proef-editor.in-presentatie .zijpaneel { display: none !important; }
      body.proef-klasmodus #btn-sluit-presentatie { display:none !important; }
    `;
    win.document.head.appendChild(stijl);
    win.document.body.classList.add('proef-editor');
    const paneel=win.document.querySelector('.zijpaneel');
    if(paneel&&!paneel.querySelector('.proef-paneel-sluiten')){const sluit=win.document.createElement('button');sluit.type='button';sluit.className='proef-paneel-sluiten';sluit.textContent='×';sluit.title='Afbeeldingen sluiten';sluit.setAttribute('aria-label','Afbeeldingen sluiten');sluit.onclick=()=>paneel.classList.remove('proef-paneel-open');paneel.prepend(sluit);}
    installeerAfbeeldingenZoeken(win);
    installeerTimerKeuze(win);
    installeerVrijPlaatsenEnDeselecteren(win);
  }

  function installeerAfbeeldingenZoeken(win){
    const doc=win.document,inhoud=doc.getElementById('tab-afbeeldingen'),grid=doc.getElementById('bib-grid');
    if(!inhoud||!grid||inhoud.querySelector('.proef-afbeeldingen-zoeken'))return;
    const zoek=doc.createElement('input'),leeg=doc.createElement('p');
    zoek.type='search';zoek.className='proef-afbeeldingen-zoeken';zoek.placeholder='Zoek een afbeelding…';zoek.setAttribute('aria-label','Zoek in alle afbeeldingen');
    leeg.className='proef-geen-afbeeldingen';leeg.textContent='Geen afbeelding gevonden. Probeer een ander woord.';leeg.hidden=true;
    const categorieen=[['eigen','Mijn eigen afbeeldingen'],['activiteiten','Activiteiten en bijzondere dagen'],['vakken','Schoolvakken en dagprogramma'],['weer','Weer en kleding'],['routines','Klasroutines'],['versiering','Kalender, dagen en versiering']];
    const vakken=/rekenen|taal|lezen|spelling|handschrift|wereldorientatie|muzische|godsdienst|levensbeschouwing|zedenleer|turnen|zwemmen|doe-doos|ipad|laptop|toets/;
    const weer=/zon|bewolkt|regen|hagel|onweer|storm|wind|sneeuw|regenboog|warm|koud|vriezen|meisje-|jongen-/;
    const routines=/brooddoos|drinkbus|snack-fruit|agendamap|brieven|huistaak|boekentas|dagstarter|kapstok|werkplek|rustig-in-rij|stil-binnenkomen|agenda-invullen|tafel-taakje|stoel-|bakje-|losse-/;
    const versiering=/^(maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)|boom-|decor-|lente|zomer|herfst|winter|kerst|carnaval|halloween/;
    const soort=item=>{if(item.classList.contains('eigen-bib-item'))return'eigen';const bron=`${item.dataset.bestand||''} ${item.dataset.naam||''}`.toLocaleLowerCase('nl');if(versiering.test(bron))return'versiering';if(weer.test(bron))return'weer';if(routines.test(bron))return'routines';if(vakken.test(bron))return'vakken';return'activiteiten';};
    let ordent=false;const dozen={};categorieen.forEach(([id,titel])=>{const detail=doc.createElement('details');detail.className='proef-afbeelding-categorie';detail.dataset.categorie=id;detail.open=false;const summary=doc.createElement('summary'),naam=doc.createElement('span'),aantal=doc.createElement('span'),bak=doc.createElement('div');naam.textContent=titel;aantal.className='proef-cat-aantal';bak.className='proef-cat-grid';summary.append(naam,aantal);detail.append(summary,bak);grid.appendChild(detail);dozen[id]={detail,bak,aantal};});
    const orden=()=>{if(ordent)return;ordent=true;grid.querySelectorAll('.bib-item').forEach(item=>dozen[soort(item)].bak.appendChild(item));Object.values(dozen).forEach(x=>x.aantal.textContent=`${x.bak.querySelectorAll('.bib-item').length}`);ordent=false;filter();};
    const normaal=s=>String(s||'').toLocaleLowerCase('nl').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    const afstand=(a,b)=>{if(Math.abs(a.length-b.length)>2)return 9;const d=Array.from({length:a.length+1},(_,i)=>[i]);for(let j=1;j<=b.length;j++)d[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[a.length][b.length];};
    function filter(){
      const term=normaal(zoek.value.trim()),termen=term.split(/\s+/).filter(Boolean),resultaten=[];
      Object.entries(dozen).forEach(([categorie,x])=>x.bak.querySelectorAll('.bib-item').forEach((item,index)=>{if(!item.dataset.proefVolgorde)item.dataset.proefVolgorde=String(index);const basis=normaal(`${item.dataset.naam||''} ${item.textContent||''} ${item.querySelector('img')?.alt||''} ${item.dataset.bestand||''}`),synoniemen=basis.replace(/lezen/g,'lezen leesboek leeskwartier boek').replace(/uitstap/g,'uitstap excursie schoolreis').replace(/turnen/g,'turnen gym sport').replace(/dagstarter/g,'dagstarter dagelijkse kost'),woorden=synoniemen.split(/[^a-z0-9]+/).filter(Boolean),letterlijk=!!term&&termen.every(t=>basis.includes(t)),nabij=!!term&&termen.every(t=>synoniemen.includes(t)||woorden.some(w=>t.length>=4&&afstand(t,w)<=(t.length>=5?2:1)));resultaten.push({item,categorie,letterlijk,nabij,score:letterlijk?0:nabij?1:9});}));
      if(!term){resultaten.sort((a,b)=>Number(a.item.dataset.proefVolgorde)-Number(b.item.dataset.proefVolgorde)).forEach(r=>{r.item.hidden=false;dozen[r.categorie].bak.appendChild(r.item);});Object.values(dozen).forEach(x=>{x.detail.hidden=false;x.detail.open=false;});leeg.hidden=true;return;}
      const letterlijk=resultaten.filter(r=>r.letterlijk),nabij=resultaten.filter(r=>r.nabij);let selectie=letterlijk,benaderd=false,besteCategorie='';
      if(!selectie.length&&nabij.length){benaderd=true;const aantallen={};nabij.forEach(r=>aantallen[r.categorie]=(aantallen[r.categorie]||0)+1);besteCategorie=Object.keys(aantallen).sort((a,b)=>aantallen[b]-aantallen[a])[0];selectie=resultaten.filter(r=>r.categorie===besteCategorie);}
      resultaten.forEach(r=>r.item.hidden=!selectie.includes(r));selectie.sort((a,b)=>a.score-b.score||Number(a.item.dataset.proefVolgorde)-Number(b.item.dataset.proefVolgorde)).forEach(r=>dozen[r.categorie].bak.appendChild(r.item));
      Object.entries(dozen).forEach(([categorie,x])=>{const toon=selectie.some(r=>r.categorie===categorie);x.detail.hidden=!toon;x.detail.open=toon;});
      if(letterlijk.length){leeg.hidden=true;}else{leeg.hidden=false;leeg.textContent=benaderd?'Geen letterlijke afbeelding gevonden. We openen de categorie die het dichtst aansluit; misschien vind je ze daar. Anders kun je via “Eigen afbeelding + bibliotheek” zelf een afbeelding toevoegen.':'Geen passende afbeelding gevonden. Voeg eventueel zelf een afbeelding toe via “Eigen afbeelding + bibliotheek”.';}
    }
    zoek.addEventListener('input',filter);win._proefOrdenAfbeeldingen=orden;
    const tip=doc.createElement('p');tip.className='hint';tip.textContent='Klik een categorie open of typ hierboven een zoekwoord.';
    inhoud.querySelector('.hint')?.after(zoek,tip);inhoud.appendChild(leeg);
    orden();
  }

  function installeerVrijPlaatsenEnDeselecteren(win){
    const doc=win.document;if(doc.body.dataset.proefVrijPlaatsen)return;doc.body.dataset.proefVrijPlaatsen='ja';
    const maakKruisjes=()=>doc.querySelectorAll('.vak-actie[aria-label*="Verwijder"]').forEach(knop=>{if(knop.classList.contains('proef-verwijder-kruis'))return;knop.textContent='×';knop.title='Onderdeel verwijderen';knop.classList.add('proef-verwijder-kruis');});
    maakKruisjes();win.setInterval(maakKruisjes,500);
    doc.addEventListener('pointerdown',event=>{
      const element=event.target.closest?.('.vak,.canvas-afbeelding');
      if(!element){
        if(!event.target.closest?.('.zijpaneel,.modal-overlay,.tekstgereedschap,.vak-acties,.proef-editorbalk,#kleurkiezer,.kleurkiezer')){doc.querySelector('.tekstgereedschap')?.remove();win.deselecteer?.();}
        return;
      }
      if(event.target.closest('[contenteditable="true"],button,input,select,.greep,.rotatie-greep,.vak-acties,.timer-klok,.timer-sleepbalk'))return;
      event.preventDefault();event.stopImmediatePropagation();win.selecteerVak?.(element);element.setPointerCapture?.(event.pointerId);
      const canvas=doc.getElementById('bord-canvas'),schaal=doc.getElementById('bord').getBoundingClientRect().width/doc.getElementById('bord').offsetWidth,sx=event.clientX,sy=event.clientY,bx=parseFloat(element.style.left)||0,by=parseFloat(element.style.top)||0;
      const bewegen=e=>{const minY=-canvas.offsetTop,minX=-20,x=Math.max(minX,Math.min(canvas.offsetWidth-element.offsetWidth,bx+(e.clientX-sx)/schaal)),y=Math.max(minY,Math.min(canvas.offsetHeight-element.offsetHeight,by+(e.clientY-sy)/schaal));element.style.left=`${x}px`;element.style.top=`${y}px`;};
      const stop=()=>{element.removeEventListener('pointermove',bewegen);element.removeEventListener('pointerup',stop);element.removeEventListener('pointercancel',stop);laatsteSnapshot='';bewaarHuidigBord();};element.addEventListener('pointermove',bewegen);element.addEventListener('pointerup',stop);element.addEventListener('pointercancel',stop);
    },true);
  }

  function installeerTimerKeuze(win){
    const doc=win.document;if(doc.body.dataset.proefTimerKeuze)return;doc.body.dataset.proefTimerKeuze='ja';
    const timerKnop=doc.querySelector('.vak-knop[data-vaktype="timer"]');
    if(timerKnop)timerKnop.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();doc.querySelector('.tekstgereedschap')?.remove();const vak=win.voegVakToe('timer');setTimeout(()=>vak.querySelector('.timer-instellen')?.click(),30);},true);
    const voorbeeldStijl=doc.createElement('style');voorbeeldStijl.textContent='#timer-modal .modal-inhoud{width:min(760px,94vw);max-width:760px}.timer-stijl-grid{grid-template-columns:repeat(5,1fr)!important}.timer-stijl-knop{min-height:145px!important;padding:8px!important}.timer-echt-voorbeeld{display:grid;place-items:center;width:94px;height:94px;padding:4px;border-radius:12px;background:#f8f7fc}.timer-echt-voorbeeld .timer-svg{width:84px;height:84px}.timer-echt-voorbeeld .balk-buiten{width:82px}.timer-echt-cijfers{color:#534ab7;font-size:23px;font-weight:900;font-variant-numeric:tabular-nums}';doc.head.appendChild(voorbeeldStijl);
    const voegSchaalToe=svg=>{if(!svg||svg.querySelector('.timer-minutenschaal'))return;const ns='http://www.w3.org/2000/svg',groep=doc.createElementNS(ns,'g');groep.setAttribute('class','timer-minutenschaal');for(let m=0;m<60;m+=5){const hoek=m/60*Math.PI*2-Math.PI/2,x1=50+39*Math.cos(hoek),y1=50+39*Math.sin(hoek),x2=50+43*Math.cos(hoek),y2=50+43*Math.sin(hoek),lijn=doc.createElementNS(ns,'line');lijn.setAttribute('x1',x1);lijn.setAttribute('y1',y1);lijn.setAttribute('x2',x2);lijn.setAttribute('y2',y2);lijn.setAttribute('stroke','#423b54');lijn.setAttribute('stroke-width','1');groep.appendChild(lijn);const tekst=doc.createElementNS(ns,'text'),r=34;tekst.setAttribute('x',50+r*Math.cos(hoek));tekst.setAttribute('y',50+r*Math.sin(hoek)+1.8);tekst.setAttribute('text-anchor','middle');tekst.setAttribute('font-size','5');tekst.setAttribute('font-weight','700');tekst.setAttribute('fill','#423b54');tekst.textContent=String(m);groep.appendChild(tekst);}svg.appendChild(groep);};
    const zorgTimerSleepbalk=vak=>{if(vak.querySelector('.timer-sleepbalk'))return;const balk=doc.createElement('div');balk.className='timer-sleepbalk';balk.textContent='⠿ verplaatsen';balk.addEventListener('pointerdown',event=>{event.preventDefault();event.stopPropagation();const canvas=doc.getElementById('bord-canvas'),schaal=canvas.getBoundingClientRect().width/canvas.offsetWidth,sx=event.clientX,sy=event.clientY,bx=parseFloat(vak.style.left)||0,by=parseFloat(vak.style.top)||0;const bewegen=e=>{const x=Math.max(-20,Math.min(canvas.offsetWidth-vak.offsetWidth,bx+(e.clientX-sx)/schaal)),y=Math.max(-canvas.offsetTop,Math.min(canvas.offsetHeight-vak.offsetHeight,by+(e.clientY-sy)/schaal));vak.style.left=`${x}px`;vak.style.top=`${y}px`;};const stop=()=>{doc.removeEventListener('pointermove',bewegen);doc.removeEventListener('pointerup',stop);laatsteSnapshot='';bewaarHuidigBord();};doc.addEventListener('pointermove',bewegen);doc.addEventListener('pointerup',stop);});vak.appendChild(balk);};
    const maakVoorbeelden=()=>{const minuten=Math.max(1,Number(doc.getElementById('timer-minuten')?.value)||5),seconden=Math.max(0,Number(doc.getElementById('timer-seconden')?.value)||0);doc.querySelectorAll('.timer-stijl-knop').forEach(knop=>{const stijl=knop.dataset.stijl;let houder=knop.querySelector('.timer-echt-voorbeeld');if(!houder){knop.querySelector('.stijl-icoon')?.remove();houder=doc.createElement('span');houder.className='timer-echt-voorbeeld';knop.prepend(houder);}if(stijl==='cijfers'){houder.innerHTML=`<span class="timer-echt-cijfers">${String(minuten).padStart(2,'0')}:${String(seconden).padStart(2,'0')}</span>`;}else{houder.innerHTML=win._maakTimerVisueelHTML(stijl);const fractie=stijl==='klok'?Math.min(1,(minuten*60+seconden)/3600):.68;if(stijl==='klok'){const klok=houder.querySelector('.timer-klok');win._updateKlok(klok,fractie);voegSchaalToe(klok);}if(stijl==='taart')win._updateTaart(houder.querySelector('.timer-taart'),fractie);if(stijl==='zandloper')win._updateZandloper(houder.querySelector('.timer-zandloper'),fractie);if(stijl==='balk')win._updateBalk(houder.querySelector('.balk-buiten'),fractie);}});};
    doc.getElementById('timer-minuten')?.addEventListener('input',maakVoorbeelden);doc.getElementById('timer-seconden')?.addEventListener('input',maakVoorbeelden);maakVoorbeelden();
    const uitleg=doc.createElement('p');uitleg.textContent='Tip: bij de visuele klok kun je daarna met je vinger over de wijzerplaat draaien om de tijd aan te passen.';uitleg.style.cssText='margin:8px 0;color:#625b78;font-size:12px;line-height:1.35;';doc.querySelector('#timer-modal .modal-inhoud')?.appendChild(uitleg);
    setInterval(()=>{doc.querySelectorAll('.vak[data-vaktype="timer"]').forEach(vak=>zorgTimerSleepbalk(vak));doc.querySelectorAll('.vak[data-vaktype="timer"] .timer-klok').forEach(klok=>{const tekst=klok.closest('.vak').querySelector('.timer-tijd')?.textContent||'0:00';const delen=tekst.split(':').map(Number);if(delen.every(Number.isFinite)&&typeof win._updateKlok==='function')win._updateKlok(klok,Math.min(1,(delen[0]*60+delen[1])/3600));voegSchaalToe(klok);});},250);
    doc.addEventListener('pointerdown',event=>{
      const klok=event.target.closest?.('.timer-klok');if(!klok)return;const vak=klok.closest('.vak[data-vaktype="timer"]');if(!vak)return;
      event.preventDefault();event.stopPropagation();const rect=klok.getBoundingClientRect();let minuten=Number(vak.dataset.minuten)||5;
      const draai=e=>{const x=e.clientX-(rect.left+rect.width/2),y=e.clientY-(rect.top+rect.height/2);let hoek=(Math.atan2(x,-y)*180/Math.PI+360)%360;minuten=Math.max(1,Math.min(60,Math.round(hoek/6)||60));vak.dataset.minuten=String(minuten);vak.dataset.seconden='0';const tijd=vak.querySelector('.timer-tijd');if(tijd)tijd.textContent=`${minuten}:00`;if(typeof win._updateKlok==='function')win._updateKlok(klok,minuten/60);};
      const stop=()=>{doc.removeEventListener('pointermove',draai);doc.removeEventListener('pointerup',stop);if(typeof win._stopTimer==='function')win._stopTimer(vak.id);vak.innerHTML=win._maakTimerVakHTML({minuten,seconden:0,timerStijl:'klok',geluidsmodus:vak.dataset.geluidsmodus||'normaal'});win._initTimer(vak);laatsteSnapshot='';bewaarHuidigBord();};
      draai(event);doc.addEventListener('pointermove',draai);doc.addEventListener('pointerup',stop,{once:true});
    },true);
  }

  function openBinnenpaneel(tabnaam) {
    if (!frameKlaar) return;
    const doc = frame.contentWindow.document;
    const paneel = doc.querySelector('.zijpaneel');
    if(paneel.classList.contains('proef-paneel-open')&&paneel.dataset.proefTab===tabnaam){paneel.classList.remove('proef-paneel-open');return;}
    paneel.classList.add('proef-paneel-open');paneel.dataset.proefTab=tabnaam;
    const tab = doc.querySelector(`.tab[data-tab="${tabnaam}"]`);
    if (tab) tab.click();
  }

  function installeerEigenAfbeeldingen(win) {
    if (win.voegAfbeeldingToe._ondersteuntEigenAfbeeldingen) return;
    const origineel = win.voegAfbeeldingToe;
    const uitgebreid = function (bestand, naam) {
      const bord = huidigBord();
      if (bord?.rijk && typeof window.voegVrijElementToe === 'function') {
        window.voegVrijElementToe(win, bord, 'afbeelding', { bron: String(bestand).startsWith('data:image/') ? bestand : `../planbord/afbeeldingen/${bestand}`, naam: naam || 'Afbeelding' }, () => bewaarSet());
        return;
      }
      if (!String(bestand).startsWith('data:image/')) return origineel(bestand, naam);
      const canvas = win.document.getElementById('bord-canvas');
      const afb = win.document.createElement('div');
      afb.className = 'canvas-afbeelding';
      afb.id = win._nieuwId();
      afb.dataset.type = 'afbeelding';
      afb.dataset.bestand = bestand;
      afb.dataset.eigenAfbeelding = 'ja';
      afb.style.left = `${canvas.clientWidth / 2 - 100}px`;
      afb.style.top = `${canvas.clientHeight / 2 - 100}px`;
      afb.style.width = '200px';
      afb.style.height = '200px';
      const img = win.document.createElement('img');
      img.src = bestand;
      img.alt = naam || 'Eigen afbeelding';
      afb.appendChild(img);
      canvas.appendChild(afb);
      win._koppelAfbeeldingInteractie(afb);
      win.selecteerVak(afb);
      return afb;
    };
    uitgebreid._ondersteuntEigenAfbeeldingen = true;
    win.voegAfbeeldingToe = uitgebreid;
  }

  function navigeer(richting) {
    const reeks=klasmodus?set.borden.filter(bord=>bord.zichtbaar!==false):set.borden;
    if(!reeks.length)return;
    let index=reeks.findIndex(bord=>bord.id===actiefId);if(index<0)index=richting>0?-1:0;
    const volgend=(index+richting+reeks.length)%reeks.length;openBord(reeks[volgend].id);
  }

  function werkKlasnavigatieBij() {
    const bord = huidigBord();
    const reeks=klasmodus?set.borden.filter(item=>item.zichtbaar!==false):set.borden;
    const index = reeks.findIndex((item) => item.id === actiefId);
    document.getElementById('klas-bordnaam').textContent = bord ? bord.naam : '';
    document.getElementById('klas-teller').textContent = `${Math.max(0,index) + 1} van ${reeks.length}`;
  }

  function startKlasmodus() {
    if (!frameKlaar) return;
    bewaarHuidigBord();
    const zichtbaar=set.borden.filter(bord=>bord.zichtbaar!==false);if(!zichtbaar.length){alert('Vink eerst minstens één bord aan om in de klasmodus te tonen.');return;}
    if(huidigBord()?.zichtbaar===false){actiefId=zichtbaar[0].id;laadActiefBord();}
    klasmodus = true;
    document.body.classList.add('klasmodus');
    frame.contentDocument?.body.classList.add('proef-klasmodus');
    if (huidigBord()?.rijk) window.renderRijkBord(frame.contentWindow, huidigBord(), false, () => bewaarSet());
    frame.contentWindow.toonPresentatie();
    werkKlasnavigatieBij();
  }

  function stopKlasmodus() {
    if (!frameKlaar) return;
    klasmodus = false;
    document.body.classList.remove('klasmodus');
    frame.contentDocument?.body.classList.remove('proef-klasmodus');
    frame.contentWindow.sluitPresentatie();
    if (huidigBord()?.rijk) window.renderRijkBord(frame.contentWindow, huidigBord(), true, () => bewaarSet());
  }

  frame.addEventListener('load', () => {
    const win = frame.contentWindow;
    if (typeof win.importeerBord !== 'function') {
      status.textContent = 'Het planbord kon niet worden geladen.';
      return;
    }
    installeerEigenAfbeeldingen(win);
    installeerProefBibliotheek(win);
    installeerRustigeEditor(win);
    frameKlaar = true;
    if (set) { tekenEigenBibliotheek(win); laadActiefBord(); document.body.classList.add('frame-klaar'); }
  });

  naamveld.addEventListener('change', () => {
    const bord = huidigBord();
    if (!bord) return;
    bord.naam = naamveld.value.trim() || 'Naamloos bord';
    naamveld.value = bord.naam;
    tekenNavigatie();
    bewaarSet();
  });

  document.getElementById('vorig-bord').addEventListener('click', () => navigeer(-1));
  document.getElementById('volgend-bord').addEventListener('click', () => navigeer(1));
  document.getElementById('start-klasmodus').addEventListener('click', startKlasmodus);
  document.getElementById('stop-klasmodus').addEventListener('click', stopKlasmodus);
  document.getElementById('klas-vorig').addEventListener('click', () => navigeer(-1));
  document.getElementById('klas-volgend').addEventListener('click', () => navigeer(1));
  const bordenKnop=document.getElementById('toon-borden');
  const werkBordenKnopBij=()=>{const open=!document.body.classList.contains('borden-dicht');bordenKnop.textContent=open?'◀ Bordenlijst sluiten':'☰ Mijn borden';bordenKnop.setAttribute('aria-pressed',String(open));};
  bordenKnop.addEventListener('click',()=>{document.body.classList.toggle('borden-dicht');werkBordenKnopBij();});
  werkBordenKnopBij();
  document.getElementById('toon-afbeeldingen').addEventListener('click', () => openBinnenpaneel('afbeeldingen'));
  [['voeg-vrij-vak-toe','vrij'],['voeg-checklist-toe','checklist'],['voeg-weer-toe','weer']].forEach(([id,type])=>document.getElementById(id).addEventListener('click',()=>{if(!frameKlaar)return;frame.contentWindow.voegVakToe(type);laatsteSnapshot='';bewaarHuidigBord();}));
  document.getElementById('voeg-tekst-toe').addEventListener('click', () => {
    const bord = huidigBord();
    if (bord?.rijk) window.voegVrijElementToe(frame.contentWindow, bord, 'tekst', { tekst: 'Typ hier je tekst' }, () => bewaarSet());
    else frame.contentWindow.voegVakToe('vrij');
  });
  document.getElementById('voeg-timer-toe').addEventListener('click', () => {
    if(!frameKlaar)return;
    frame.contentWindow.document.querySelector('.tekstgereedschap')?.remove();
    const vak=frame.contentWindow.voegVakToe('timer');
    laatsteSnapshot='';bewaarHuidigBord();
    setTimeout(()=>vak?.querySelector('.timer-instellen')?.click(),50);
  });
  document.getElementById('voeg-stilte-toe').addEventListener('click', () => {
    if(!frameKlaar)return;
    frame.contentWindow.voegVakToe('werkstijl');laatsteSnapshot='';bewaarHuidigBord();
  });
  document.getElementById('groot-werkvlak').addEventListener('click', () => {
    startKlasmodus();
  });
  document.addEventListener('keydown', (event) => {
    if (!klasmodus) return;
    if (event.key === 'ArrowLeft') navigeer(-1);
    if (event.key === 'ArrowRight' || event.key === ' ') navigeer(1);
    if (event.key === 'Escape') stopKlasmodus();
  });

  document.getElementById('nieuw-bord').addEventListener('click', () => {
    bewaarHuidigBord();
    const leeg = {
      id: `eigen-${Date.now()}`, naam: 'Nieuw bord', icoon: '✨', omschrijving: 'Eigen leeg bord',
      data: { versie: 4, header: { tekst: 'Ons klasbord', thema: 'zon', tekstkleur: '#633806', jarige: '' }, canvas: { breedte: 1600, hoogte: 730 }, elementen: [] },
    };
    set.borden.push(leeg);
    actiefId = leeg.id;
    laadActiefBord();
    naamveld.focus();
    naamveld.select();
  });

  function maakDraagbareAfbeelding(bestand) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Het afbeeldingsbestand kon niet worden gelezen.'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Dit afbeeldingsformaat wordt niet ondersteund.'));
        img.onload = () => {
          const maximaal = 1600;
          const schaal = Math.min(1, maximaal / Math.max(img.naturalWidth, img.naturalHeight));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.naturalWidth * schaal));
          canvas.height = Math.max(1, Math.round(img.naturalHeight * schaal));
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/webp', 0.84));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(bestand);
    });
  }

  document.getElementById('eigen-afbeelding').addEventListener('click', () => {
    document.getElementById('eigen-afbeelding-bestand').click();
  });

  document.getElementById('eigen-afbeelding-bestand').addEventListener('change', async (event) => {
    const bestand = event.target.files[0];
    event.target.value = '';
    if (!bestand || !frameKlaar) return;
    try {
      status.textContent = 'Afbeelding wordt verkleind…';
      const dataUrl = await maakDraagbareAfbeelding(bestand);
      set.eigenBibliotheek=set.eigenBibliotheek||[];
      const bibGrootte=set.eigenBibliotheek.reduce((som,item)=>som+(item.bron?.length||0),0);
      if(set.eigenBibliotheek.length>=40||bibGrootte+dataUrl.length>25*1024*1024){
        alert('Je persoonlijke bibliotheek is vol (maximaal 40 afbeeldingen of ongeveer 25 MB). De afbeelding wordt wel op dit bord geplaatst. Verwijder eerst een ongebruikte afbeelding uit je bibliotheek om ze ook daar te bewaren.');
      }else{
        set.eigenBibliotheek.push({id:`eigen-${Date.now()}`,naam:bestand.name.replace(/\.[^.]+$/,''),bron:dataUrl});
        tekenEigenBibliotheek(frame.contentWindow);
      }
      frame.contentWindow.voegAfbeeldingToe(dataUrl, bestand.name);
      laatsteSnapshot = '';
      bewaarHuidigBord();
    } catch (fout) {
      alert(fout.message);
    }
  });

  const exportscherm=document.getElementById('exportscherm'),exportnaam=document.getElementById('exportnaam');
  document.getElementById('exporteer-set').addEventListener('click', () => {
    const datum=new Date(),maand=String(datum.getMonth()+1).padStart(2,'0'),uur=String(datum.getHours()).padStart(2,'0'),minuut=String(datum.getMinutes()).padStart(2,'0');
    exportnaam.value=`mijn-planbord-${datum.getFullYear()}-${maand}-${String(datum.getDate()).padStart(2,'0')}-${uur}${minuut}.zisabord`;
    exportscherm.hidden=false;setTimeout(()=>exportnaam.select(),0);
  });
  document.getElementById('sluit-export').addEventListener('click',()=>{exportscherm.hidden=true;});
  exportscherm.addEventListener('click',event=>{if(event.target===exportscherm)exportscherm.hidden=true;});
  document.getElementById('bevestig-export').addEventListener('click',async()=>{
    bewaarHuidigBord();
    const basis=(exportnaam.value||'mijn-planbord').replace(/\.(json|zisabord)$/i,'').replace(/[<>:"/\\|?*]+/g,'-').trim()||'mijn-planbord';
    const bestandsnaam=`${basis}.zisabord`;
    const pakket={formaat:'juf-zisa-bordenset',versie:1,gemaaktOp:new Date().toISOString(),bordenset:set};
    const blob=new Blob([JSON.stringify(pakket)],{type:'application/json'});
    try{
      if(window.showSaveFilePicker){const handvat=await window.showSaveFilePicker({suggestedName:bestandsnaam,types:[{description:'Juf Zisa-planbordbestand',accept:{'application/json':['.zisabord']}}]});const schrijf=await handvat.createWritable();await schrijf.write(blob);await schrijf.close();}
      else{const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=bestandsnaam;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(link.href),1000);alert('Het planbord staat bij je Downloads. Verplaats het naar je vaste map Planbord.');}
      exportscherm.hidden=true;status.textContent=`Alles bewaard als ${bestandsnaam}`;
    }catch(fout){if(fout?.name!=='AbortError')alert(`Bewaren is niet gelukt. ${fout.message}`);}
  });

  document.getElementById('importeer-set').addEventListener('click', () => {
    document.getElementById('bordenset-bestand').click();
  });

  const hulpscherm=document.getElementById('hulpscherm');
  document.getElementById('toon-hulp').addEventListener('click',()=>{hulpscherm.hidden=false;});
  document.getElementById('sluit-hulp').addEventListener('click',()=>{hulpscherm.hidden=true;});
  hulpscherm.addEventListener('click',event=>{if(event.target===hulpscherm)hulpscherm.hidden=true;});

  document.getElementById('bordenset-bestand').addEventListener('change', async (event) => {
    const bestand = event.target.files[0];
    event.target.value = '';
    if (!bestand) return;
    try {
      const pakket = JSON.parse(await bestand.text());
      if (pakket.formaat !== 'juf-zisa-bordenset' || !Array.isArray(pakket.bordenset?.borden) || !pakket.bordenset.borden.length) {
        throw new Error('Dit is geen geldig Juf Zisa-bordensetbestand.');
      }
      if (!confirm('De geopende bordenset vervangt de huidige proefborden. Doorgaan?')) return;
      set = pakket.bordenset;
      actiefId = set.borden.some((bord) => bord.id === set.actiefId) ? set.actiefId : set.borden[0].id;
      tekenEigenBibliotheek(frame.contentWindow);
      laadActiefBord();
      await bewaarSet();
    } catch (fout) {
      alert(`De bordenset kon niet worden geopend. ${fout.message}`);
    }
  });

  document.getElementById('dupliceer-bord').addEventListener('click', () => {
    bewaarHuidigBord();
    const bron = huidigBord();
    if (!bron) return;
    const kopie = JSON.parse(JSON.stringify(bron));
    kopie.id = `kopie-${Date.now()}`;
    kopie.naam = `${bron.naam} — kopie`;
    kopie.omschrijving = 'Eigen kopie';
    set.borden.splice(set.borden.indexOf(bron) + 1, 0, kopie);
    actiefId = kopie.id;
    laadActiefBord();
  });

  document.getElementById('herstel-borden').addEventListener('click', async () => {
    if (!confirm('Alle aanpassingen worden gewist. De voorbeeldborden herstellen?')) return;
    localStorage.removeItem(OPSLAGSLEUTEL);
    await wisDatabase().catch(() => {});
    set = window.maakProefSjablonen();
    actiefId = set.borden[0].id;
    laadActiefBord();
  });

  window.addEventListener('beforeunload', bewaarHuidigBord);
  setInterval(bewaarHuidigBord, 1500);

  async function start() {
    set = await laadSet();
    set.eigenBibliotheek=set.eigenBibliotheek||[];
    actiefId = set.borden.some((bord) => bord.id === set.actiefId) ? set.actiefId : set.borden[0].id;
    tekenNavigatie();
    if (frameKlaar) { tekenEigenBibliotheek(frame.contentWindow); laadActiefBord(); document.body.classList.add('frame-klaar'); }
  }

  start();
})();
