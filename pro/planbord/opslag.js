// === OPSLAG ===
// Export en import van het bord als JSON-bestand

function exporteerBord() {
  const canvas = document.getElementById('bord-canvas');
  const elementen = [];

  // Verzamel alle vakken en losse afbeeldingen in DOM-volgorde
  canvas.querySelectorAll('.vak, .canvas-afbeelding').forEach((el) => {
    const basis = {
      id: el.id,
      x: parseFloat(el.style.left) || 0,
      y: parseFloat(el.style.top) || 0,
      breedte: el.offsetWidth,
      hoogte: el.offsetHeight,
    };

    if (el.classList.contains('vak')) {
      const vaktype = el.dataset.vaktype;
      const kleur = el.dataset.kleur;
      const titelEl = el.querySelector('.vak-titel');
      const titel = titelEl?.innerText || '';
      const titelNiveau = titelEl?.dataset.tekstniveau != null ? parseInt(titelEl.dataset.tekstniveau, 10) : null;

      if (vaktype === 'vrij') {
        const inhoudEl = el.querySelector('.vak-inhoud');
        const inhoud = inhoudEl?.innerText || '';
        const inhoudNiveau = inhoudEl?.dataset.tekstniveau != null ? parseInt(inhoudEl.dataset.tekstniveau, 10) : null;
        elementen.push({
          ...basis,
          type: 'vak',
          vaktype: 'vrij',
          kleur,
          titel,
          inhoud,
          titelNiveau,
          inhoudNiveau,
        });
      } else if (vaktype === 'checklist') {
        // Verzamel items én witregels in volgorde
        const regels = [];
        const lijst = el.querySelector('.checklist-items');
        // Niveau: eerst uit vak.dataset.itemNiveau (vaste keuze van leerkracht),
        // anders uit eerste item-tekst
        const eersteItem = el.querySelector('.item-tekst');
        let itemsNiveau = null;
        if (el.dataset.itemNiveau != null) {
          itemsNiveau = parseInt(el.dataset.itemNiveau, 10);
        } else if (eersteItem?.dataset.tekstniveau != null) {
          itemsNiveau = parseInt(eersteItem.dataset.tekstniveau, 10);
        }
        const opsommingsstijl = el.dataset.opsommingsstijl || 'hokje';
        if (lijst) {
          Array.from(lijst.children).forEach((kind) => {
            if (kind.classList.contains('checklist-item')) {
              regels.push({
                type: 'item',
                afbeelding: kind.dataset.afbeelding || '',
                tekst: kind.querySelector('.item-tekst')?.innerText || '',
              });
            } else if (kind.classList.contains('checklist-witregel')) {
              regels.push({ type: 'witregel', hoogte: kind.offsetHeight });
            }
          });
        }
        elementen.push({
          ...basis,
          type: 'vak',
          vaktype: 'checklist',
          kleur,
          titel,
          titelNiveau,
          itemsNiveau,
          opsommingsstijl,
          regels,
        });
      } else if (vaktype === 'timer') {
        const timerStijl = el.querySelector('.timer-visueel')?.dataset.stijl || 'cijfers';
        elementen.push({
          ...basis,
          type: 'vak',
          vaktype: 'timer',
          kleur,
          titel,
          titelNiveau,
          minuten: parseInt(el.dataset.minuten) || 5,
          seconden: parseInt(el.dataset.seconden) || 0,
          timerStijl,
          geluidsmodus: el.dataset.geluidsmodus || 'normaal',
        });
      } else if (vaktype === 'weer') {
        elementen.push({
          ...basis,
          type: 'vak',
          vaktype: 'weer',
          kleur,
          titel,
          titelNiveau,
          weerLat: parseFloat(el.dataset.weerLat) || null,
          weerLon: parseFloat(el.dataset.weerLon) || null,
          weerNaam: el.dataset.weerNaam || '',
        });
      } else if (vaktype === 'werkstijl') {
        elementen.push({
          ...basis,
          type: 'vak',
          vaktype: 'werkstijl',
          kleur,
          titel,
          titelNiveau,
          werkstijl: el.dataset.werkstijl || 'stilte',
        });
      }
    } else if (el.classList.contains('canvas-afbeelding')) {
      elementen.push({
        ...basis,
        type: 'afbeelding',
        bestand: el.dataset.bestand,
        rotatie: parseFloat(el.dataset.rotatie) || 0,
      });
    }
  });

  return {
    versie: 4,
    header: (typeof getHeaderInstellingen === 'function') ? getHeaderInstellingen() : null,
    canvas: {
      breedte: canvas.clientWidth,
      hoogte: canvas.clientHeight,
    },
    elementen,
  };
}

function downloadJson() {
  const data = exporteerBord();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const nu = new Date();
  const datum = `${nu.getFullYear()}-${String(nu.getMonth() + 1).padStart(2, '0')}-${String(nu.getDate()).padStart(2, '0')}`;
  const bestandsnaam = `planbord_${datum}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = bestandsnaam;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importeerBord(data) {
  if (!data || !data.elementen) {
    alert('Dit bestand bevat geen geldig planbord.');
    return;
  }

  // Wis huidig canvas
  const canvas = document.getElementById('bord-canvas');
  deselecteer();
  canvas.querySelectorAll('.vak, .canvas-afbeelding').forEach((el) => el.remove());

  // Header herstellen indien opgeslagen
  if (data.header && typeof zetHeaderInstellingen === 'function') {
    zetHeaderInstellingen(data.header);
  }

  // Bouw opnieuw op
  data.elementen.forEach((el) => {
    if (el.type === 'vak') {
      const vak = voegVakToe(el.vaktype);
      vak.style.left = el.x + 'px';
      vak.style.top = el.y + 'px';
      vak.style.width = el.breedte + 'px';
      vak.style.height = el.hoogte + 'px';
      _wijzigKleur(vak, el.kleur);

      const titelEl = vak.querySelector('.vak-titel');
      if (titelEl) {
        titelEl.textContent = el.titel || '';
        if (typeof el.titelNiveau === 'number') {
          _zetNiveau(titelEl, el.titelNiveau);
        }
      }

      if (el.vaktype === 'vrij') {
        const inhoudEl = vak.querySelector('.vak-inhoud');
        if (inhoudEl) {
          inhoudEl.textContent = el.inhoud || '';
          if (typeof el.inhoudNiveau === 'number') {
            _zetNiveau(inhoudEl, el.inhoudNiveau);
          }
        }
      } else if (el.vaktype === 'checklist') {
        const lijst = vak.querySelector('.checklist-items');
        if (lijst) {
          lijst.innerHTML = '';
          // Ondersteun zowel oude (items) als nieuwe (regels) opmaak
          const regels = el.regels || (el.items ? el.items.map((it) => ({
            type: 'item',
            afbeelding: it.afbeelding,
            tekst: it.tekst,
          })) : []);

          regels.forEach((r) => {
            const wrap = document.createElement('div');
            wrap.innerHTML = _maakChecklistRegelHTML(r);
            const regel = wrap.firstElementChild;
            lijst.appendChild(regel);
            _koppelChecklistRegelInteractie(regel);
          });

          // Opsommingsstijl herstellen
          if (el.opsommingsstijl) {
            zetOpsommingsstijl(vak, el.opsommingsstijl);
          }

          // Per-item tekstniveaus herstellen (alle items hetzelfde niveau)
          if (typeof el.itemsNiveau === 'number') {
            vak.dataset.itemNiveau = el.itemsNiveau;
            vak.querySelectorAll('.item-tekst').forEach((t) => _zetNiveau(t, el.itemsNiveau));
          }
        }
      } else if (el.vaktype === 'timer') {
        // Stop het standaard-interval dat voegVakToe gestart heeft
        if (typeof _stopTimer === 'function') _stopTimer(vak.id);
        vak.dataset.minuten = el.minuten || 5;
        vak.dataset.seconden = el.seconden || 0;
        vak.dataset.geluidsmodus = el.geluidsmodus || 'normaal';
        // Herrender de timer-inhoud met de juiste stijl
        vak.innerHTML = _maakTimerVakHTML({
          titel: el.titel || '',
          minuten: vak.dataset.minuten,
          seconden: vak.dataset.seconden,
          timerStijl: el.timerStijl || 'cijfers',
          geluidsmodus: vak.dataset.geluidsmodus,
        });
        _initTimer(vak);
        if (typeof el.titelNiveau === 'number') {
          const t = vak.querySelector('.vak-titel');
          if (t) _zetNiveau(t, el.titelNiveau);
        }
      } else if (el.vaktype === 'weer') {
        // Titel herstellen
        const t = vak.querySelector('.vak-titel');
        if (t) {
          t.textContent = el.titel || '';
          if (typeof el.titelNiveau === 'number') _zetNiveau(t, el.titelNiveau);
        }
        // Opgeslagen locatie herstellen en weer opnieuw ophalen
        if (typeof el.weerLat === 'number' && typeof el.weerLon === 'number') {
          vak.dataset.weerLat = el.weerLat;
          vak.dataset.weerLon = el.weerLon;
          vak.dataset.weerNaam = el.weerNaam || '';
          if (typeof _toonLocatieLabel === 'function') _toonLocatieLabel(vak);
          if (typeof _haalWeerOp === 'function') _haalWeerOp(vak, true);
        }
      } else if (el.vaktype === 'werkstijl') {
        const t = vak.querySelector('.vak-titel');
        if (t) {
          t.textContent = el.titel || '';
          if (typeof el.titelNiveau === 'number') _zetNiveau(t, el.titelNiveau);
        }
        if (el.werkstijl) {
          zetWerkstijl(vak, el.werkstijl);
        }
      }
    } else if (el.type === 'afbeelding') {
      voegAfbeeldingToe(el.bestand, '');
      const afb = canvas.lastElementChild;
      if (afb && afb.classList.contains('canvas-afbeelding')) {
        afb.style.left = el.x + 'px';
        afb.style.top = el.y + 'px';
        afb.style.width = el.breedte + 'px';
        afb.style.height = el.hoogte + 'px';
        if (typeof el.rotatie === 'number' && el.rotatie !== 0) {
          afb.dataset.rotatie = el.rotatie;
          afb.style.transform = `rotate(${el.rotatie}deg)`;
        }
      }
    }
  });

  deselecteer();
}

function uploadJson(bestand) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      importeerBord(data);
    } catch (err) {
      alert('Kon het bestand niet inlezen: ' + err.message);
    }
  };
  reader.readAsText(bestand);
}