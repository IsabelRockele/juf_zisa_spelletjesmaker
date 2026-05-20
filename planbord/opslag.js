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
      const tekstgrootte = parseInt(el.dataset.tekstgrootte, 10) || TEKSTGROOTTE_DEFAULT;
      const titelEl = el.querySelector('.vak-titel');
      const titel = titelEl?.innerText || '';
      // Per-element niveaus (alleen opslaan als ze afwijken van het globale)
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
          tekstgrootte,
          titel,
          inhoud,
          titelNiveau,
          inhoudNiveau,
        });
      } else if (vaktype === 'checklist') {
        // Verzamel items én witregels in volgorde
        const regels = [];
        const lijst = el.querySelector('.checklist-items');
        const itemsNiveau = lijst?.dataset.tekstniveau != null ? parseInt(lijst.dataset.tekstniveau, 10) : null;
        if (lijst) {
          Array.from(lijst.children).forEach((kind) => {
            if (kind.classList.contains('checklist-item')) {
              regels.push({
                type: 'item',
                afbeelding: kind.dataset.afbeelding || '',
                tekst: kind.querySelector('.item-tekst')?.innerText || '',
              });
            } else if (kind.classList.contains('checklist-witregel')) {
              regels.push({ type: 'witregel' });
            }
          });
        }
        elementen.push({
          ...basis,
          type: 'vak',
          vaktype: 'checklist',
          kleur,
          tekstgrootte,
          titel,
          titelNiveau,
          itemsNiveau,
          regels,
        });
      }
    } else if (el.classList.contains('canvas-afbeelding')) {
      elementen.push({
        ...basis,
        type: 'afbeelding',
        bestand: el.dataset.bestand,
      });
    }
  });

  return {
    versie: 3,
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

  // Bouw opnieuw op
  data.elementen.forEach((el) => {
    if (el.type === 'vak') {
      const vak = voegVakToe(el.vaktype);
      vak.style.left = el.x + 'px';
      vak.style.top = el.y + 'px';
      vak.style.width = el.breedte + 'px';
      vak.style.height = el.hoogte + 'px';
      _wijzigKleur(vak, el.kleur);

      // Tekstgrootte herstellen
      if (typeof el.tekstgrootte === 'number') {
        vak.dataset.tekstgrootte = el.tekstgrootte;
        _pasTekstgrootteToe(vak);
      }

      const titelEl = vak.querySelector('.vak-titel');
      if (titelEl) {
        titelEl.textContent = el.titel || '';
        if (typeof el.titelNiveau === 'number') {
          _zetElementNiveau(titelEl, el.titelNiveau);
        }
      }

      if (el.vaktype === 'vrij') {
        const inhoudEl = vak.querySelector('.vak-inhoud');
        if (inhoudEl) {
          inhoudEl.textContent = el.inhoud || '';
          if (typeof el.inhoudNiveau === 'number') {
            _zetElementNiveau(inhoudEl, el.inhoudNiveau);
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

          // Per-element niveau voor de hele items-lijst
          if (typeof el.itemsNiveau === 'number') {
            _zetElementNiveau(lijst, el.itemsNiveau);
          }
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