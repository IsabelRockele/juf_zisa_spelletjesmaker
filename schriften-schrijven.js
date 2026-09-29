(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const paper = $('paper'), ink = $('ink'), ns = 'http://www.w3.org/2000/svg';
  let color = '#233b45', erasing = false, stroke = null, pointer = null;
  let versions = [];
  let sheetKey = 'books', familyMode = false;
  const sheets = new Map();
  function guides() {
    const height = familyMode ? 620 : 665;
    paper.setAttribute('viewBox', `0 0 640 ${height}`);
    paper.style.aspectRatio = `640 / ${height}`;
    $('guides').style.display = 'none';
    $('family-guides').style.display = familyMode ? '' : 'none';
    $('family-lines').style.display = $('schema').checked ? '' : 'none';
    $('strip-guides').style.display = !familyMode ? '' : 'none';
    $('strip-writing-guides').style.display = $('schema').checked ? '' : 'none';
  }
  window.addEventListener('writing-mode', event => {
    sheets.set(sheetKey, { content: ink.innerHTML, versions: [...versions] });
    sheetKey = event.detail.key; familyMode = event.detail.family;
    const saved = sheets.get(sheetKey);
    ink.innerHTML = saved?.content || ''; versions = saved?.versions ? [...saved.versions] : [];
    $('ink-undo').disabled = !versions.length;
    $('writing-title').textContent = familyMode ? 'Schrijf alle vier de bewerkingen' : 'Strookvoorstelling en bewerkingen';
    paper.setAttribute('aria-label', familyMode ? 'Drie getallen met vier schrijflijnen. Schrijf met je vinger, bordpen of muis.' : 'Lege strookvoorstelling: schrijf het geheel bovenaan en de twee delen onderaan. Daaronder schrijf je de bewerkingen.');
    guides();
  });
  const remember = () => { versions.push(ink.innerHTML); if (versions.length > 100) versions.shift(); $('ink-undo').disabled = false; };
  function location(event) {
    const point = paper.createSVGPoint(); point.x = event.clientX; point.y = event.clientY;
    return point.matrixTransform(paper.getScreenCTM().inverse());
  }
  function erase(point) {
    for (const path of [...ink.children]) {
      const length = path.getTotalLength();
      for (let d = 0; d <= length; d += 5) {
        const p = path.getPointAtLength(d);
        if (Math.hypot(point.x - p.x, point.y - p.y) < 18) { path.remove(); break; }
      }
    }
  }
  function selectPen() {
    document.querySelectorAll('[data-pen]').forEach(button => button.setAttribute('aria-pressed', String(!erasing && button.dataset.pen === color)));
    $('eraser').setAttribute('aria-pressed', String(erasing));
    paper.classList.toggle('erasing', erasing);
  }
  document.querySelectorAll('[data-pen]').forEach(button => button.addEventListener('click', () => { color = button.dataset.pen; erasing = false; selectPen(); }));
  $('eraser').addEventListener('click', () => { erasing = !erasing; selectPen(); });
  paper.addEventListener('pointerdown', event => {
    if (pointer !== null || event.button !== 0) return;
    event.preventDefault(); pointer = event.pointerId; paper.setPointerCapture(pointer); remember();
    const point = location(event);
    if (erasing) { erase(point); return; }
    stroke = document.createElementNS(ns, 'path'); stroke.setAttribute('stroke', color); stroke.setAttribute('stroke-width', '4');
    stroke.setAttribute('d', `M${point.x},${point.y} l0.1,0.1`); ink.appendChild(stroke);
  });
  paper.addEventListener('pointermove', event => {
    if (pointer !== event.pointerId) return;
    event.preventDefault();
    const samples = event.getCoalescedEvents?.();
    for (const sample of (samples?.length ? samples : [event])) {
      const point = location(sample);
      if (erasing) erase(point);
      else if (stroke) stroke.setAttribute('d', stroke.getAttribute('d') + ` L${point.x},${point.y}`);
    }
  });
  const finish = event => { if (event.pointerId === pointer) { pointer = null; stroke = null; } };
  paper.addEventListener('pointerup', finish); paper.addEventListener('pointercancel', finish); paper.addEventListener('lostpointercapture', finish);
  $('ink-undo').disabled = true;
  $('ink-undo').addEventListener('click', () => { if (versions.length) ink.innerHTML = versions.pop(); $('ink-undo').disabled = !versions.length; });
  $('restart').addEventListener('click', () => $('ink-clear').click());
  $('ink-clear').addEventListener('click', () => { if (ink.children.length) { remember(); ink.replaceChildren(); } });
  $('schema').addEventListener('change', guides);
  guides();
})();
