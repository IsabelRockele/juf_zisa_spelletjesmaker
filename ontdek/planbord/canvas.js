// === CANVAS ===
// Konva-canvas met drag, scale, selectie

const CANVAS_BREEDTE = 1280;
const CANVAS_HOOGTE = 720;

let stage = null;
let laag = null;
let transformer = null;
let geselecteerd = null;

function _initCanvas() {
  // Bereken schaal zodat canvas in beeld past
  const wrap = document.getElementById('canvas-wrap');
  const beschikbareBreedte = wrap.clientWidth;
  const beschikbareHoogte = wrap.clientHeight;
  const schaal = Math.min(
    beschikbareBreedte / CANVAS_BREEDTE,
    beschikbareHoogte / CANVAS_HOOGTE
  );

  stage = new Konva.Stage({
    container: 'canvas-container',
    width: CANVAS_BREEDTE * schaal,
    height: CANVAS_HOOGTE * schaal,
  });

  // Inhoud-laag (alles wat de leerkracht plaatst)
  laag = new Konva.Layer();
  stage.add(laag);

  // Schaal de hele stage zodat we intern met 1280×720 kunnen werken
  stage.scale({ x: schaal, y: schaal });

  // Transformer voor selectie (greep om te schalen)
  transformer = new Konva.Transformer({
    rotateEnabled: false,
    keepRatio: true,
    enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    anchorSize: 12,
    anchorStroke: '#534AB7',
    anchorFill: 'white',
    borderStroke: '#534AB7',
    borderStrokeWidth: 2,
  });
  laag.add(transformer);

  // Klik op leeg canvas = niets selecteren
  stage.on('click tap', (e) => {
    if (e.target === stage) {
      _deselecteer();
    }
  });

  // Reageer op browser-resize
  window.addEventListener('resize', _herbereken);
}

function _herbereken() {
  const wrap = document.getElementById('canvas-wrap');
  const beschikbareBreedte = wrap.clientWidth;
  const beschikbareHoogte = wrap.clientHeight;
  const schaal = Math.min(
    beschikbareBreedte / CANVAS_BREEDTE,
    beschikbareHoogte / CANVAS_HOOGTE
  );
  stage.width(CANVAS_BREEDTE * schaal);
  stage.height(CANVAS_HOOGTE * schaal);
  stage.scale({ x: schaal, y: schaal });
}

function _selecteer(node) {
  geselecteerd = node;
  transformer.nodes([node]);
  laag.draw();
}

function _deselecteer() {
  geselecteerd = null;
  transformer.nodes([]);
  laag.draw();
}

function _maakSelecteerbaar(node) {
  node.on('click tap', (e) => {
    e.cancelBubble = true;
    _selecteer(node);
  });
}

// === AFBEELDING TOEVOEGEN ===
function voegAfbeeldingToe(bestand, naam) {
  const img = new Image();
  img.onload = () => {
    // Schaal de afbeelding naar redelijke grootte (max 250px)
    const maxGrootte = 250;
    let breedte = img.width;
    let hoogte = img.height;
    if (breedte > maxGrootte || hoogte > maxGrootte) {
      const r = Math.min(maxGrootte / breedte, maxGrootte / hoogte);
      breedte = breedte * r;
      hoogte = hoogte * r;
    }

    // Plaats in het midden van canvas
    const node = new Konva.Image({
      image: img,
      x: CANVAS_BREEDTE / 2 - breedte / 2,
      y: CANVAS_HOOGTE / 2 - hoogte / 2,
      width: breedte,
      height: hoogte,
      draggable: true,
      name: 'afbeelding',
    });
    node.setAttr('bronBestand', bestand);

    laag.add(node);
    _maakSelecteerbaar(node);
    _selecteer(node);
    laag.draw();
  };
  img.onerror = () => {
    alert(`Afbeelding "${bestand}" niet gevonden. Plaats het bestand in de map afbeeldingen/.`);
  };
  img.src = `afbeeldingen/${bestand}`;
}

// === TEKST TOEVOEGEN ===
function voegTekstToe(tekst, grootte, kleur) {
  const node = new Konva.Text({
    text: tekst,
    x: CANVAS_BREEDTE / 2,
    y: CANVAS_HOOGTE / 2,
    fontSize: grootte,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontStyle: '500',
    fill: kleur,
    draggable: true,
    name: 'tekst',
  });
  // Centreer
  node.offsetX(node.width() / 2);
  node.offsetY(node.height() / 2);

  laag.add(node);
  _maakSelecteerbaar(node);

  // Dubbelklik om te bewerken
  node.on('dblclick dbltap', () => {
    _bewerkTekst(node);
  });

  _selecteer(node);
  laag.draw();
}

function _bewerkTekst(node) {
  const huidigeTekst = node.text();
  const nieuweTekst = prompt('Bewerk tekst:', huidigeTekst);
  if (nieuweTekst !== null && nieuweTekst !== '') {
    node.text(nieuweTekst);
    laag.draw();
  }
}

// === VERWIJDEREN ===
function verwijderGeselecteerd() {
  if (geselecteerd) {
    geselecteerd.destroy();
    _deselecteer();
    laag.draw();
  }
}

// === EXPORT NAAR JSON ===
function exporteerBord() {
  const nodes = laag.getChildren((n) => n.name() === 'afbeelding' || n.name() === 'tekst');
  const data = {
    versie: 1,
    canvasBreedte: CANVAS_BREEDTE,
    canvasHoogte: CANVAS_HOOGTE,
    elementen: nodes.map((n) => {
      const basis = {
        type: n.name(),
        x: n.x(),
        y: n.y(),
        breedte: n.width() * n.scaleX(),
        hoogte: n.height() * n.scaleY(),
      };
      if (n.name() === 'afbeelding') {
        return { ...basis, bestand: n.getAttr('bronBestand') };
      }
      if (n.name() === 'tekst') {
        return {
          ...basis,
          tekst: n.text(),
          lettergrootte: n.fontSize(),
          kleur: n.fill(),
          offsetX: n.offsetX(),
          offsetY: n.offsetY(),
        };
      }
    }),
  };
  return data;
}

// === IMPORT VAN JSON ===
function importeerBord(data) {
  // Verwijder alles behalve transformer
  laag.getChildren((n) => n.name() === 'afbeelding' || n.name() === 'tekst').forEach((n) => n.destroy());
  _deselecteer();

  data.elementen.forEach((el) => {
    if (el.type === 'afbeelding') {
      const img = new Image();
      img.onload = () => {
        const node = new Konva.Image({
          image: img,
          x: el.x,
          y: el.y,
          width: el.breedte,
          height: el.hoogte,
          draggable: true,
          name: 'afbeelding',
        });
        node.setAttr('bronBestand', el.bestand);
        laag.add(node);
        _maakSelecteerbaar(node);
        laag.draw();
      };
      img.src = `afbeeldingen/${el.bestand}`;
    } else if (el.type === 'tekst') {
      const node = new Konva.Text({
        text: el.tekst,
        x: el.x,
        y: el.y,
        fontSize: el.lettergrootte,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontStyle: '500',
        fill: el.kleur,
        offsetX: el.offsetX || 0,
        offsetY: el.offsetY || 0,
        draggable: true,
        name: 'tekst',
      });
      laag.add(node);
      _maakSelecteerbaar(node);
      node.on('dblclick dbltap', () => _bewerkTekst(node));
      laag.draw();
    }
  });
}

// === PRESENTATIE-MODUS ===
let presStage = null;

function toonPresentatie() {
  const overlay = document.getElementById('presentatie');
  overlay.classList.remove('hidden');

  // Bereken schaal voor fullscreen
  const beschikbareBreedte = window.innerWidth;
  const beschikbareHoogte = window.innerHeight;
  const schaal = Math.min(
    beschikbareBreedte / CANVAS_BREEDTE,
    beschikbareHoogte / CANVAS_HOOGTE
  );

  // Maak een nieuwe stage voor presentatie (kopie zonder transformer/dragging)
  presStage = new Konva.Stage({
    container: 'presentatie-canvas',
    width: CANVAS_BREEDTE * schaal,
    height: CANVAS_HOOGTE * schaal,
  });
  presStage.scale({ x: schaal, y: schaal });

  const presLaag = new Konva.Layer();
  presStage.add(presLaag);

  // Kopieer alle elementen
  laag.getChildren((n) => n.name() === 'afbeelding' || n.name() === 'tekst').forEach((n) => {
    const kloon = n.clone({ draggable: false });
    presLaag.add(kloon);
  });

  presLaag.draw();
}

function sluitPresentatie() {
  const overlay = document.getElementById('presentatie');
  overlay.classList.add('hidden');
  if (presStage) {
    presStage.destroy();
    presStage = null;
  }
}
