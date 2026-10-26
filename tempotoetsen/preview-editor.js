/* Eén bewerkbaar ontwerp voor het voorbeeld, flitsen en de PDF. */
window.TempotoetsenPreview = (() => {
  const kopie = waarde => JSON.parse(JSON.stringify(waarde));
  const esc = waarde => String(waarde ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const weken = new Map();
  let dag = null;
  let actief = null;
  let volgnummer = 0;
  const isOntdek = location.pathname.includes('/ontdek/');
  const toonAntwoorden = () => !isOntdek || window.ISPRO;
  const typeLabel = type => tabConfig.find(t => t.id === type)?.label || type;
  const aantal = kolom => kolom.vorm === 'invulblad' ? kolom.aantal : kolom.oefeningen.length;
  const dagOefeningen = model => model.kolommen.flatMap(k => k.oefeningen);

  function configuratieFout(type, config, vorm) {
    if ((type === 'maaltafels' || type === 'deeltafels') && !config.tafels.length) return 'Kies minstens één tafel.';
    if (type === 'gemengd-maal-deel' && (!config.tafelsKeer.length || !config.tafelsDeel.length)) return 'Kies minstens één maal- en deeltafel.';
    if (type === 'getalbeelden' && vorm === 'oefeningen') return 'Getalbeelden horen bij een invulblad voor flitsen. Kies die vorm of een ander oefeningtype.';
    return '';
  }

  function nieuweKolom(data) {
    return { uid: `kolom${++volgnummer}`, open: false, ...kopie(data) };
  }

  function instellingen(kolom, model) {
    const draft = kolom.concept || kolom;
    let html = `<label>Oefeningtype<select data-veld="type">${tabConfig.map(t => `<option value="${t.id}" ${t.id === draft.type ? 'selected' : ''}>${esc(t.label)}</option>`).join('')}</select></label>`;
    if (model.soort !== 'dag') html += `<label>Vorm<select data-veld="vorm"><option value="oefeningen" ${draft.vorm === 'oefeningen' ? 'selected' : ''}>Met oefeningen</option><option value="invulblad" ${draft.vorm === 'invulblad' ? 'selected' : ''}>Invulblad (flitsen)</option></select></label>`;
    html += renderDagConfigHTML(kolom.uid, draft.type, draft.config);
    if (draft.type === 'maaltafels' || draft.type === 'gemengd-maal-deel') {
      html += `<label>Volgorde<select data-config="richting">${[['ax', 'Tafel × getal'], ['xa', 'Getal × tafel'], ['beide', 'Door elkaar']].map(([v, l]) => `<option value="${v}" ${draft.config.richting === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`;
    }
    if (draft.type === 'getalbeelden') {
      html += `<label>Getallen tot<select data-config="max"><option value="20" ${draft.config.max === 20 ? 'selected' : ''}>20</option><option value="100" ${draft.config.max === 100 ? 'selected' : ''}>100</option></select></label>
        <label>Getalbeeld<select data-config="type">${[['mix', 'Door elkaar'], ['mab', 'MAB'], ['honderdveld', 'Honderdveld'], ['notatie', 'Tientallen en eenheden'], ['rekenrek', 'Rekenrek (tot 20)']].map(([v, l]) => `<option value="${v}" ${draft.config.type === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`;
    }
    return html + `<p class="tp-config-tip">Alleen deze kolom krijgt nieuwe oefeningen.</p><div class="tp-acties"><button type="button" data-actie="toepassen" class="knop knop-primair">Toepassen op kolom</button><button type="button" data-actie="annuleer-config" class="knop knop-secundair">Annuleren</button></div>`;
  }

  function oefeningHTML(oefening) {
    if (typeof oefening.vraag === 'string') return `<span class="tp-som">${esc(oefening.vraag)} = <span class="tp-invullijn"></span></span>`;
    if (oefening.vraag.type === 'splitsing') return `<div class="tp-splitsing">${renderSplitsingHTML(oefening.vraag)}</div>`;
    return `<div class="tp-getalbeeld">${renderGetalbeeldHTML(oefening.vraag)}</div>`;
  }

  function kolomHTML(kolom, model, index) {
    const n = aantal(kolom), invulblad = kolom.vorm === 'invulblad' || (model.soort === 'dag' && model.modus === 'antwoordblad');
    const regels = invulblad ? Array.from({ length: n }, () => null) : kolom.oefeningen;
    let offset = model.soort === 'dag' && index ? model.kolommen[0].oefeningen.length : 0;
    return `<article class="tp-kolom ${kolom.type === 'splitsingen' && model.soort !== 'dag' ? 'tp-kolom-splits' : ''} ${model.geselecteerd === kolom.uid ? 'tp-geselecteerd' : ''}" data-kolom="${kolom.uid}">
      <div class="tp-kolom-kop"><div><h4>${esc(kolom.label)}</h4>${kolom.datum ? '<small>' + esc(kolom.datum) + '</small>' : ''}</div><button type="button" data-actie="instellingen" title="Instellingen van deze kolom" aria-label="Instellingen van ${esc(kolom.label)}">⚙</button></div>
      ${model.soort !== 'dag' ? '<div class="tp-score">Score: ___ / ' + n + (model.soort === 'huistaak' ? '<span>Tijd: ___ min ___ sec</span>' : '') + '</div>' : ''}
      <ol class="tp-oefeningen">${regels.map((o, i) => `<li data-oefening="${i}"><span class="tp-nummer">${offset + i + 1}.</span><div class="tp-vraag">${o ? oefeningHTML(o) : '<span class="tp-invullijn tp-lange-lijn"></span>'}${o && model.antwoorden && toonAntwoorden() ? '<span class="tp-oplossing">' + esc(o.antwoord) + '</span>' : ''}</div><div class="tp-oef-acties">${o ? '<button type="button" data-actie="vervang" title="Andere oefening" aria-label="Vervang oefening ' + (i + 1) + ' in ' + esc(kolom.label) + '">↻</button>' : ''}<button type="button" data-actie="verwijder" title="Oefening verwijderen" aria-label="Verwijder oefening ${i + 1} in ${esc(kolom.label)}">×</button></div></li>`).join('')}</ol>
      ${n === 0 ? '<p class="tp-leeg">Voeg een oefening toe.</p>' : ''}
      ${n < kolom.maximum ? '<button type="button" class="tp-toevoegen" data-actie="toevoegen">+ ' + (invulblad ? 'Invullijn' : 'Oefening') + ' toevoegen</button>' : ''}
    </article>`;
  }

  function bericht(model, tekst) {
    model.host.querySelector('.tp-status').textContent = tekst;
  }

  function synchroniseerDag() {
    if (dag) state.huidigeOefeningen = dagOefeningen(dag);
  }

  function initialiseerLayout() {
    const app = document.querySelector('.app');
    let zijbalk = app.querySelector('.tp-zijbalk');
    if (!zijbalk) {
      zijbalk = document.createElement('aside'); zijbalk.className = 'tp-zijbalk';
      app.insertBefore(zijbalk, document.getElementById('tabs'));
      for (const id of ['tabs', 'config-paneel', 'modi']) zijbalk.appendChild(document.getElementById(id));
      for (const h of app.querySelectorAll(':scope > h2')) h.remove();
    }
    if (!document.getElementById('tp-vorm')) {
      const modi = document.getElementById('modi');
      modi.className = 'tp-vormkeuze';
      modi.innerHTML = '<label for="tp-vorm">1. Kies je toetsvorm</label><select id="tp-vorm"><option value="dag">Dagblad</option><option value="invulblad">Invulblad voor flitsen</option><option value="weekblad">Weekblad</option><option value="huistaak">Huistaakblad</option></select><button type="button" id="tp-flits" class="knop knop-secundair">⚡ Flitsen op het scherm</button>';
      zijbalk.prepend(modi);
      document.getElementById('tp-vorm').addEventListener('change', e => {
        if (e.target.value === 'weekblad' || e.target.value === 'huistaak') beginWeek(e.target.value);
        else showDay(e.target.value === 'dag' ? 'papier' : 'antwoordblad');
      });
      document.getElementById('tp-flits').addEventListener('click', () => {
        if (isOntdek && !window.ISPRO) { alert('Flitsen op het smartboard is beschikbaar in PRO.'); return; }
        if (actief && actief.soort !== 'dag') {
          const kolom = actief.kolommen.find(k => k.uid === actief.geselecteerd) || actief.kolommen[0];
          state.huidigeOefeningen = kolom.oefeningen.length ? kopie(kolom.oefeningen) : window.TempotoetsenGen.genereerToets(kolom.type, kolom.config, aantal(kolom));
        } else synchroniseerDag();
        startFlitsModus();
      });
      const paneel = document.createElement('div'); paneel.id = 'tp-kolominstellingen'; zijbalk.appendChild(paneel);
      for (const h of zijbalk.querySelectorAll(':scope > h2')) h.remove();
    }
    document.body.classList.add('tp-werkplek');
  }

  function renderZijbalk(model) {
    initialiseerLayout();
    const paneel = document.getElementById('tp-kolominstellingen');
    const kolom = model.kolommen.find(k => k.uid === model.geselecteerd);
    const isWeek = model.soort !== 'dag';
    document.getElementById('tp-vorm').value = isWeek ? model.soort : model.modus === 'papier' ? 'dag' : 'invulblad';
    document.getElementById('tabs').hidden = !!kolom || isWeek;
    document.getElementById('config-paneel').hidden = !!kolom || isWeek;
    let html = '';
    if (isWeek) {
      html += '<details class="tp-zijsectie tp-dagen-panel" ' + (model.dagenOpen ? 'open' : '') + '><summary>Dagen en volgorde (' + model.kolommen.length + ')</summary><div class="tp-dagen">' + model.kolommen.map((k, i) => '<div class="tp-dagrij" data-kolom="' + k.uid + '"><button type="button" data-actie="instellingen" class="' + (k.uid === model.geselecteerd ? 'actief' : '') + '">' + esc(k.label) + '</button><button type="button" data-actie="omhoog" aria-label="' + esc(k.label) + ' naar links" ' + (i === 0 ? 'disabled' : '') + '>↑</button><button type="button" data-actie="omlaag" aria-label="' + esc(k.label) + ' naar rechts" ' + (i === model.kolommen.length - 1 ? 'disabled' : '') + '>↓</button><button type="button" data-actie="verwijder-kolom" aria-label="Kolom ' + esc(k.label) + ' verwijderen">×</button></div>').join('') + '</div><label>Dag toevoegen<select data-model-veld="nieuweDag"><option value="">+ Kies een dag</option>' + weekdagenAlle.map(d => '<option value="' + d.id + '">' + d.label + '</option>').join('') + '</select></label><label>Week van<input type="text" maxlength="50" data-model-veld="weekVan" value="' + esc(model.weekVan) + '" placeholder="Laat leeg voor invullijn"></label></details>';
    }
    if (kolom) html += '<section class="tp-zijsectie tp-actieve-config" data-kolom="' + kolom.uid + '"><div class="tp-zijkop"><h3>' + esc(kolom.label) + ' aanpassen</h3>' + (!isWeek ? '<button type="button" data-actie="terug-instellingen">← Algemeen</button>' : '') + '</div>' + (isWeek ? '<label>Datum<input type="text" maxlength="24" data-veld="datum" value="' + esc(kolom.datum) + '" placeholder="bv. 26/10"></label>' : '') + '<div class="tp-config">' + instellingen(kolom, model) + '</div></section>';
    else if (isWeek) html += '<p class="tp-config-tip">Klik op een dag om de instellingen van die kolom aan te passen.</p>';
    paneel.innerHTML = html;
    paneel.querySelector('.tp-dagen-panel')?.addEventListener('toggle', e => { model.dagenOpen = e.target.open; });
    model.controlHost = paneel;
    paneel.onclick = e => klik(model, e);
    paneel.onchange = e => wijzig(model, e);
    paneel.oninput = e => tekstWijziging(model, e);
  }

  function render(model) {
    actief = model;
    const host = model.host;
    model.weergave ||= 'bewerken';
    const titel = model.soort === 'dag' ? 'Tempotoets — ' + (model.modus === 'antwoordblad' ? 'Invulblad' : 'Dagblad') : model.soort === 'huistaak' ? 'Tempotoets — Huistaak' : 'Tempotoets — Weekblad';
    const week = model.soort !== 'dag';
    host.innerHTML = `<div class="tp-werkbalk"><div class="tp-weergave"><button type="button" data-actie="toon-bewerken" class="${model.weergave === 'bewerken' ? 'actief' : ''}">Blad bewerken</button><button type="button" data-actie="toon-pdf" class="${model.weergave === 'pdf' ? 'actief' : ''}">Exact PDF-voorbeeld</button></div><div class="tp-acties"><button type="button" class="knop knop-secundair" data-actie="nieuw">Nieuwe oefeningen</button><button type="button" class="knop knop-primair" data-actie="download" disabled>PDF downloaden</button></div></div>
      <div class="tp-status" role="status" aria-live="polite"></div>
      <div class="tp-papier-host" ${model.weergave !== 'bewerken' ? 'hidden' : ''}>
        <div class="tp-bladinfo"><span>${week ? 'A4 liggend' : 'A4 staand'} · ${model.kolommen.reduce((som, k) => som + aantal(k), 0)} oefeningen</span>${toonAntwoorden() ? '<label><input type="checkbox" data-model-veld="antwoorden" ' + (model.antwoorden ? 'checked' : '') + '> Antwoorden tonen</label>' : ''}<span>↻ vervangen · × verwijderen · ⚙ kolom instellen</span></div>
        ${(week ? splitsInBladen(model.kolommen) : [model.kolommen]).map((groep, bladIdx, groepen) => `<div class="tp-papier ${week ? 'tp-liggend' : 'tp-staand'}"><header><h2>${titel}${groepen.length > 1 ? ' — blad ' + (bladIdx + 1) + '/' + groepen.length : ''}</h2></header><div class="tp-naamregel">Naam: ____________________ <span>${week ? 'Week van: ' + (esc(model.weekVan) || '________________') : 'Datum: ______________'}</span></div><p class="tp-opdracht">${model.modus === 'antwoordblad' ? 'Schrijf het antwoord van elke oefening op.' : model.soort === 'huistaak' ? 'Maak elke dag één kolom. Noteer de gebruikte tijd.' : 'Je hebt 1 minuut. Klaar? Start!'}</p><div class="tp-papier-kolommen" style="--kolommen:${groep.length}">${groep.map((k, i) => kolomHTML(k, model, i)).join('')}</div><footer>juf Zisa · jufzisa.be</footer></div>`).join('')}
      </div>
      <section class="tp-pdf" ${model.weergave !== 'pdf' ? 'hidden' : ''}><div class="tp-paneel-titel"><h4>Het volledige PDF-bestand</h4><span class="tp-paginas">Voorbeeld wordt gemaakt…</span></div><iframe class="tp-pdf-frame" title="Voorbeeld van de volledige PDF, inclusief de beschikbare antwoordenbladen"></iframe></section>`;
    host.onclick = e => klik(model, e);
    host.onchange = e => wijzig(model, e);
    host.oninput = e => tekstWijziging(model, e);
    renderZijbalk(model);
    werkPdfBij(model);
  }

  async function werkPdfBij(model) {
    if (actief !== model) return;
    const versie = model.versie = (model.versie || 0) + 1;
    const knop = model.host.querySelector('[data-actie="download"]');
    knop.disabled = true;
    model.pdf = null;
    const leeg = model.soort === 'dag' ? !dagOefeningen(model).length : model.kolommen.some(k => !aantal(k));
    if (leeg) {
      bericht(model, 'Voeg minstens één oefening toe aan elke lege dagkolom voordat je de PDF downloadt.');
      model.host.querySelector('.tp-paginas').textContent = 'Nog niet klaar';
      model.host.querySelector('.tp-pdf-frame').removeAttribute('src');
      return;
    }
    try {
      const bestand = model.soort === 'dag'
        ? await genereerPdf({ titel: 'Tempotoets — ' + (model.modus === 'antwoordblad' ? 'Invulblad' : 'Dagblad'), oefeningen: dagOefeningen(model), kolommen: model.kolommen.map(k => k.oefeningen), modus: model.modus, alleenVoorbeeld: true })
        : await genereerWeekbladPdf(splitsInBladen(model.kolommen), model.weekVan, model.soort === 'huistaak', true);
      if (versie !== model.versie || actief !== model || !model.host.isConnected) return;
      model.pdf = bestand;
      const oud = model.url;
      model.url = URL.createObjectURL(bestand.doc.output('blob'));
      const frame = model.host.querySelector('.tp-pdf-frame');
      frame.src = model.url + '#toolbar=0&navpanes=0&view=FitH';
      if (oud) URL.revokeObjectURL(oud);
      model.host.querySelector('.tp-paginas').textContent = `${bestand.doc.internal.getNumberOfPages()} pagina’s · A4${model.soort === 'dag' ? '' : ' liggend'}`;
      knop.disabled = false;
      bericht(model, 'Het PDF-voorbeeld is bijgewerkt. Je download bevat precies deze oefeningen.');
    } catch (error) {
      bericht(model, 'Het PDF-voorbeeld kon niet geladen worden. Controleer je verbinding en probeer opnieuw.');
      model.host.querySelector('.tp-paginas').textContent = 'Voorbeeld niet beschikbaar';
      console.error(error);
    }
  }

  function nieuwOefening(kolom, uitsluiten = []) {
    const bestaand = new Set(uitsluiten.map(o => JSON.stringify(o.vraag)));
    for (let poging = 0; poging < 20; poging++) {
      const kandidaten = window.TempotoetsenGen.genereerToets(kolom.type, kolom.config, 10);
      const nieuw = kandidaten.find(o => !bestaand.has(JSON.stringify(o.vraag)));
      if (nieuw) return nieuw;
    }
    return null;
  }

  async function download(model) {
    if (!model.pdf || model.downloadBezig) return;
    const bestand = model.pdf;
    model.downloadBezig = true;
    const knop = model.host.querySelector('[data-actie="download"]');
    knop.disabled = true;
    try {
      if (isOntdek && !window.ISPRO) {
        if (!window.OntdekTrial?.authorizeDownload) throw new Error('De accountverbinding is nog niet klaar. Probeer straks opnieuw.');
        await window.OntdekTrial.authorizeDownload(bestand.doc.internal.getNumberOfPages());
      }
      bestand.doc.save(bestand.naam);
      bericht(model, 'Je PDF is gedownload. Je ontwerp blijft hier bewaard om verder te bewerken.');
    } catch (error) {
      bericht(model, error.message);
    } finally {
      model.downloadBezig = false;
      if (model.pdf) model.host.querySelector('[data-actie="download"]').disabled = false;
    }
  }

  function klik(model, event) {
    const knop = event.target.closest('button');
    if (!knop || (!model.host.contains(knop) && !model.controlHost?.contains(knop))) return;
    const kaart = knop.closest('[data-kolom]');
    const kolom = kaart && model.kolommen.find(k => k.uid === kaart.dataset.kolom);
    const actie = knop.dataset.actie;
    if (actie === 'instellingen') { model.geselecteerd = kolom.uid; render(model); return; }
    if (actie === 'terug-instellingen') { model.geselecteerd = null; render(model); return; }
    if (actie === 'toon-bewerken' || actie === 'toon-pdf') { model.weergave = actie === 'toon-pdf' ? 'pdf' : 'bewerken'; render(model); return; }
    if (actie === 'verwijder-kolom' || actie === 'omhoog' || actie === 'omlaag') {
      const idx = model.kolommen.indexOf(kolom);
      if (actie === 'verwijder-kolom') {
        if (model.kolommen.length === 1) { bericht(model, 'Er moet minstens één dag op het blad staan.'); return; }
        model.kolommen.splice(idx, 1);
        if (model.geselecteerd === kolom.uid) model.geselecteerd = model.kolommen[0].uid;
      } else {
        const ander = idx + (actie === 'omhoog' ? -1 : 1);
        if (ander < 0 || ander >= model.kolommen.length) return;
        [model.kolommen[idx], model.kolommen[ander]] = [model.kolommen[ander], model.kolommen[idx]];
      }
      render(model); return;
    }
    if (actie === 'download') { download(model); return; }
    if (actie === 'dagen') { renderZijbalk(model); return; }
    if (actie === 'nieuw') {
      model.kolommen.forEach(k => {
        if (k.vorm !== 'invulblad') k.oefeningen = window.TempotoetsenGen.genereerToets(k.type, k.config, aantal(k));
      });
      synchroniseerDag(); render(model); return;
    }
    if (!kolom) return;
    if (!actie) {
      const config = kolom.concept ||= kopie({ type: kolom.type, config: kolom.config, vorm: kolom.vorm });
      const chips = knop.closest('[data-dag-tafels], [data-dag-tafels-keer], [data-dag-tafels-deel], [data-dag-radio]');
      if (!chips) return;
      if (knop.dataset.tafel) {
        const veld = chips.hasAttribute('data-dag-tafels') ? 'tafels' : chips.hasAttribute('data-dag-tafels-keer') ? 'tafelsKeer' : 'tafelsDeel';
        const tafel = Number(knop.dataset.tafel);
        config.config[veld] = config.config[veld].includes(tafel) ? config.config[veld].filter(t => t !== tafel) : [...config.config[veld], tafel].sort((a, b) => a - b);
        knop.classList.toggle('geselecteerd', config.config[veld].includes(tafel));
      } else if (knop.dataset.waarde) {
        const veld = chips.dataset.dagRadio.slice(kolom.uid.length + 1);
        config.config[veld] = veld === 'totaal' ? Number(knop.dataset.waarde) : knop.dataset.waarde;
        chips.querySelectorAll('button').forEach(b => b.classList.toggle('geselecteerd', b === knop));
      }
      bericht(model, 'Instellingen gewijzigd. Klik op Toepassen op kolom om het blad bij te werken.');
      return;
    }
    if (actie === 'annuleer-config') { delete kolom.concept; if (model.soort === 'dag') model.geselecteerd = null; render(model); return; }
    if (actie === 'toepassen') {
      const concept = kolom.concept || kolom;
      const fout = configuratieFout(concept.type, concept.config, model.soort === 'dag' ? model.modus === 'antwoordblad' ? 'invulblad' : 'oefeningen' : concept.vorm);
      if (fout) { bericht(model, fout); return; }
      const n = aantal(kolom) || kolom.maximum;
      kolom.type = concept.type;
      kolom.config = kopie(concept.config);
      kolom.vorm = model.soort === 'dag' ? 'oefeningen' : concept.vorm;
      kolom.aantal = n;
      kolom.oefeningen = model.soort !== 'dag' && kolom.vorm === 'invulblad' ? [] : window.TempotoetsenGen.genereerToets(kolom.type, kolom.config, n);
      delete kolom.concept;
      kolom.open = false;
    } else if (actie === 'verwijder') {
      const idx = Number(knop.closest('[data-oefening]').dataset.oefening);
      if (kolom.vorm === 'invulblad') kolom.aantal--;
      else kolom.oefeningen.splice(idx, 1);
    } else if (actie === 'vervang' || actie === 'toevoegen') {
      if (actie === 'toevoegen' && aantal(kolom) >= kolom.maximum) return;
      if (kolom.vorm === 'invulblad') kolom.aantal++;
      else {
        const nieuw = nieuwOefening(kolom, kolom.oefeningen);
        if (!nieuw) { bericht(model, 'Er is geen andere unieke oefening beschikbaar met deze instellingen.'); return; }
        if (actie === 'vervang') kolom.oefeningen[Number(knop.closest('[data-oefening]').dataset.oefening)] = nieuw;
        else kolom.oefeningen.push(nieuw);
      }
    } else return;
    synchroniseerDag();
    render(model);
  }

  function wijzig(model, event) {
    const el = event.target;
    if (el.dataset.modelVeld === 'nieuweDag') {
      if (!el.value) return;
      const max = model.soort === 'huistaak' ? 7 : 5;
      if (model.kolommen.length >= max) { bericht(model, 'Op dit blad passen maximaal ' + max + ' dagen.'); el.value = ''; return; }
      const d = weekdagenAlle.find(d => d.id === el.value);
      const bron = model.kolommen.find(k => k.uid === model.geselecteerd) || model.kolommen[0];
      const k = nieuweKolom({ id: d.id, label: d.label, kort: d.kort, datum: '', type: bron.type, config: bron.config, vorm: bron.vorm, oefeningen: bron.vorm === 'invulblad' ? [] : window.TempotoetsenGen.genereerToets(bron.type, bron.config, 10), aantal: 10, maximum: 10 });
      model.kolommen.push(k); model.geselecteerd = k.uid; render(model); return;
    }
    if (el.dataset.modelVeld === 'antwoorden') { model.antwoorden = el.checked; render(model); return; }
    if (el.dataset.modelVeld === 'modus') {
      if (el.value === 'papier' && model.kolommen.some(k => k.type === 'getalbeelden')) {
        bericht(model, 'Getalbeelden werken met een invulblad voor flitsen. Kies een ander oefeningtype voor een dagblad.');
        el.value = model.modus; return;
      }
      model.modus = el.value; werkPdfBij(model); return;
    }
    const kaart = el.closest('[data-kolom]');
    if (!kaart || (!el.dataset.veld && !el.dataset.config) || el.dataset.veld === 'datum') return;
    const kolom = model.kolommen.find(k => k.uid === kaart.dataset.kolom);
    const concept = kolom.concept ||= kopie({ type: kolom.type, config: kolom.config, vorm: kolom.vorm });
    if (el.dataset.veld === 'type') {
      concept.type = el.value;
      concept.config = kopie(state.config[el.value]);
      kaart.querySelector('.tp-config').innerHTML = instellingen(kolom, model);
    } else if (el.dataset.veld === 'vorm') concept.vorm = el.value;
    else if (el.dataset.config) {
      concept.config[el.dataset.config] = el.dataset.config === 'max' ? Number(el.value) : el.value;
      if (concept.type === 'getalbeelden' && concept.config.type === 'rekenrek') {
        concept.config.max = 20;
        kaart.querySelector('[data-config="max"]').value = '20';
      }
    }
  }

  function tekstWijziging(model, event) {
    const el = event.target;
    if (el.dataset.modelVeld === 'weekVan') model.weekVan = el.value;
    else if (el.dataset.veld === 'datum') {
      const kolom = model.kolommen.find(k => k.uid === el.closest('[data-kolom]').dataset.kolom);
      kolom.datum = el.value;
    } else return;
    clearTimeout(model.timer);
    model.versie = (model.versie || 0) + 1;
    model.pdf = null;
    model.host.querySelector('[data-actie="download"]').disabled = true;
    if (el.dataset.modelVeld === 'weekVan') model.host.querySelectorAll('.tp-naamregel span').forEach(span => { span.textContent = 'Week van: ' + (model.weekVan || '________________'); });
    else { const k = model.kolommen.find(k => k.uid === el.closest('[data-kolom]').dataset.kolom); const kop = model.host.querySelector('[data-kolom="' + k.uid + '"] .tp-kolom-kop > div'); if (kop) { let datum = kop.querySelector('small'); if (!datum) { datum = document.createElement('small'); kop.appendChild(datum); } datum.textContent = k.datum; } }
    model.timer = setTimeout(() => werkPdfBij(model), 250);
  }

  function updateDay() {
    initialiseerLayout();
    const host = document.getElementById('preview');
    if (actief && actief.soort !== 'dag') return;
    if (!configGeldig()) {
      if (dag?.url) URL.revokeObjectURL(dag.url);
      if (dag) dag.versie = (dag.versie || 0) + 1;
      state.huidigeOefeningen = [];
      host.innerHTML = '<p class="tp-leeg">Kies minstens één tafel om een toets samen te stellen.</p>';
      return;
    }
    const bron = JSON.stringify([state.type, huidigeConfig()]);
    if (!dag) dag = { soort: 'dag', host, events: false, antwoorden: false };
    if (dag.bron !== bron) {
      const oefeningen = window.TempotoetsenGen.genereerToets(state.type, huidigeConfig(), 10);
      dag.bron = bron;
      dag.modus = state.type === 'getalbeelden' ? 'antwoordblad' : 'papier';
      dag.kolommen = [0, 1].map(i => nieuweKolom({ label: i ? 'Rechterkolom' : 'Linkerkolom', type: state.type, config: huidigeConfig(), vorm: 'oefeningen', maximum: 5, oefeningen: oefeningen.slice(i * 5, i * 5 + 5) }));
    }
    synchroniseerDag();
    render(dag);
  }

  function showDay(modus) {
    actief = dag;
    if (!configGeldig()) { updateDay(); return; }
    if (!dag) updateDay();
    dag.geselecteerd = null;
    dag.modus = modus === 'papier' && dag.kolommen.every(k => k.type !== 'getalbeelden') ? 'papier' : 'antwoordblad';
    render(dag);
    dag.host.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function openWeek(dagen, weekVan, isHuistaak) {
    const soort = isHuistaak ? 'huistaak' : 'weekblad';
    const vorig = weken.get(soort);
    const telling = {};
    const kolommen = dagen.map(d => {
      const key = d.id + ':' + (telling[d.id] = (telling[d.id] || 0) + 1);
      const bron = JSON.stringify([d.type, d.config, d.vorm]);
      const bestaand = vorig?.kolommen.find(k => k.key === key && k.bron === bron);
      if (bestaand) {
        if (bestaand.bronDatum !== d.datum) bestaand.datum = d.datum;
        bestaand.bronDatum = d.datum;
        return bestaand;
      }
      return nieuweKolom({ ...d, oefeningen: d.oefeningen || [], aantal: 10, maximum: 10, config: d.config, key, bron, bronDatum: d.datum });
    });
    const model = vorig || { soort, antwoorden: false };
    model.kolommen = kolommen;
    if (model.bronWeekVan !== weekVan) model.weekVan = weekVan;
    model.bronWeekVan = weekVan;
    weken.set(soort, model);
    toonWeek(model);
  }

  function toonWeek(model) {
    model.host = document.getElementById('preview');
    if (actief?.url) URL.revokeObjectURL(actief.url);
    render(model);
  }

  function beginWeek(variant) {
    initialiseerLayout();
    let model = weken.get(variant);
    if (!model) {
      if (!configGeldig()) {
        document.getElementById('tp-vorm').value = actief?.soort === 'dag' ? 'dag' : actief?.soort || 'dag';
        alert('Kies eerst minstens één tafel bij de instellingen.');
        return;
      }
      const type = state.type === 'getalbeelden' ? 'maaltafels' : state.type;
      model = { soort: variant, weekVan: '', antwoorden: false, kolommen: weekdagenSchool.map(d => nieuweKolom({ ...d, datum: '', type, config: state.config[type], vorm: 'oefeningen', maximum: 10, aantal: 10, oefeningen: window.TempotoetsenGen.genereerToets(type, state.config[type], 10) })) };
      model.geselecteerd = model.kolommen[0].uid;
      weken.set(variant, model);
    }
    toonWeek(model);
  }

  return { updateDay, showDay, openWeek, beginWeek };
})();
