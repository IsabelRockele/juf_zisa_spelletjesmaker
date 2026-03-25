/* ══════════════════════════════════════════════════════════════
   gi-preview.js
   Verantwoordelijkheid: getallenlijn-preview tekenen in de sidebar
   Gebruikt: geen externe afhankelijkheden behalve het DOM
   Exporteert: window.GI_Preview.renderPreview()
               window.GI_Preview.updateDragSuggestions()
   ══════════════════════════════════════════════════════════════ */

window.GI_Preview = (() => {
  const NS     = 'http://www.w3.org/2000/svg';
  const PAD_L  = 40;
  const PAD_R  = 30;

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  /* ── SVG hulpjes ──────────────────────────────────────────── */
  const _group = p => {
    const g = document.createElementNS(NS, 'g');
    p.appendChild(g);
    return g;
  };

  const _line = (p, x1, y1, x2, y2, str, w) => {
    const l = document.createElementNS(NS, 'line');
    l.setAttribute('x1', x1); l.setAttribute('y1', y1);
    l.setAttribute('x2', x2); l.setAttribute('y2', y2);
    l.setAttribute('stroke', str || '#6b879a');
    l.setAttribute('stroke-width', w || '2');
    p.appendChild(l);
    return l;
  };

  const _label = (p, x, y, txt) => {
    const g = _group(p);
    const s = String(txt);
    const bw = s.length <= 2 ? 38 : s.length === 3 ? 46 : 54;
    const bh = 28;
    const r = document.createElementNS(NS, 'rect');
    // rect: onderkant op y, bovenkant op y-bh
    r.setAttribute('x', x - bw/2); r.setAttribute('y', y - bh);
    r.setAttribute('width', bw);   r.setAttribute('height', bh);
    r.setAttribute('fill', '#fff'); r.setAttribute('stroke', '#6b879a');
    r.setAttribute('stroke-width', '2'); r.setAttribute('rx', 7);
    g.appendChild(r);
    const t = document.createElementNS(NS, 'text');
    // tekst verticaal gecentreerd in rect: y - bh/2 + ~5 (baseline correctie)
    t.setAttribute('x', x); t.setAttribute('y', y - bh/2 + 6);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('dominant-baseline', 'middle');
    t.setAttribute('font-size', '17'); t.setAttribute('font-weight', '700');
    t.textContent = s;
    g.appendChild(t);
  };

  /* ── Lees UI-waarden ──────────────────────────────────────── */
  function getRulerOpts() {
    return {
      start:      parseInt($('#start').value, 10),
      end:        parseInt($('#end').value, 10),
      unit:       Math.max(1, parseInt($('#unit').value, 10)),
      showZero:   $('#showZero').checked,
      showEnds:   $('#showEnds').checked,
      showTens:   $('#showTens').checked,
      showFives:  $('#showFives').checked,
      showOnes:   $('#showOnes').checked,
      majorStep:  parseInt($('#majorStep').value, 10),
      mode:       ($$('input[name=mode]:checked')[0] || {}).value || 'none',
      dragValues: ($('#dragList').value || '').split(/[ ,;]+/)
                    .map(s => parseInt(s.trim(), 10)).filter(Number.isFinite),
      blankCount: parseInt(($('#blankCount') || {}).value, 10) || 5,
      showOnly:   ($('#showOnly')?.checked && $('#showOnlyList')?.value)
                    ? ($('#showOnlyList').value || '').split(/[ ,;]+/)
                        .map(s => parseInt(s.trim(), 10)).filter(Number.isFinite)
                    : null,
    };
  }

  const _wantLabel = (val, o) => {
    // Als showOnly ingesteld is: enkel die getallen tonen
    if (o.showOnly && o.showOnly.length > 0) return o.showOnly.includes(val);
    return o.showOnes ||
      (o.showTens  && val % 10 === 0) ||
      (o.showFives && val % 5  === 0) ||
      (o.showZero  && val === 0) ||
      (o.showEnds  && (val === o.start || val === o.end));
  };

  /* ── Teken getallenlijn in een SVG-element ────────────────── */
  function drawRuler(svgEl, o) {
    const width  = svgEl.clientWidth || 1400;
    const height = 220;
    svgEl.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svgEl.innerHTML = '';

    const baseY  = Math.round(height * 0.55);
    const units  = o.end - o.start;
    if (units <= 0) return;

    const rawTicksCount = Math.floor(units / o.unit) + 1;
    const MAX_TICKS     = 400;
    const sampleStep    = rawTicksCount > MAX_TICKS
      ? Math.ceil(rawTicksCount / MAX_TICKS) : 1;
    const pxPerUnit     = (width - PAD_L - PAD_R) / units;

    const g    = _group(svgEl);
    const defs = document.createElementNS(NS, 'defs');
    const marker = document.createElementNS(NS, 'marker');
    marker.setAttribute('id', 'arrowhead');
    marker.setAttribute('markerWidth', '8'); marker.setAttribute('markerHeight', '8');
    marker.setAttribute('refX', '4');        marker.setAttribute('refY', '4');
    marker.setAttribute('orient', 'auto');
    const tip = document.createElementNS(NS, 'path');
    tip.setAttribute('d', 'M0,0 L8,4 L0,8 Z');
    tip.setAttribute('fill', '#1e88e5');
    marker.appendChild(tip); defs.appendChild(marker); g.appendChild(defs);

    _line(g, PAD_L, baseY, width - PAD_R + 5, baseY);

    const ticks = [];
    for (let si = 0, v = o.start; v <= o.end; si++, v = o.start + si * o.unit * sampleStep) {
      if (v > o.end) break;
      const x       = PAD_L + (v - o.start) * pxPerUnit;
      const isMajor = v % o.majorStep === 0;
      const h       = isMajor ? 18 : (v % 5 === 0 ? 12 : 9);
      _line(g, x, baseY, x, baseY - h);
      ticks.push({ v, x, isMajor });
    }

    ticks.forEach(t => {
      if (sampleStep > 1) {
        if (t.v === o.start || t.v === o.end || t.isMajor || _wantLabel(t.v, o))
          _label(g, t.x, baseY - (t.isMajor ? 20 : 16), t.v);
      } else {
        if (_wantLabel(t.v, o))
          _label(g, t.x, baseY - (t.isMajor ? 20 : 16), t.v);
      }
    });

    return { ticks, baseY, g, width, height };
  }

  /* ── Public: teken preview ────────────────────────────────── */
  function renderPreview() {
    const svgEl = $('#previewSvg');
    if (!svgEl) return;
    const o = getRulerOpts();
    if (o.end <= o.start) return;
    drawRuler(svgEl, o);
  }

  /* ── Public: vul willekeurige getallen in het drag-veld ───── */
  function updateDragSuggestions() {
    const start = parseInt($('#start').value, 10);
    const end   = parseInt($('#end').value,   10);
    const inp   = $('#dragList');
    if (!inp || end <= start) return;
    const set = new Set();
    while (set.size < 3) {
      set.add(Math.floor(Math.random() * (end - start + 1)) + start);
    }
    inp.value = Array.from(set).sort((a, b) => a - b).join(', ');
  }

  /* ── Init: koppel live-preview aan invoervelden ───────────── */
  function init() {
    // Wacht tot DOM klaar is
    const inputs = [
      '#start', '#end', '#unit', '#majorStep',
      '#showZero', '#showEnds', '#showTens', '#showFives', '#showOnes',
      '#showOnlyList',
    ];
    inputs.forEach(sel => {
      const el = $(sel);
      if (el) {
        el.addEventListener('input', renderPreview);
        // Bij aanpassing van start of end: herbereken drag-suggesties
        if (sel === '#start' || sel === '#end') {
          el.addEventListener('change', updateDragSuggestions);
          el.addEventListener('input',  updateDragSuggestions);
        }
      }
    });

    document.querySelectorAll('input[name="preset"]').forEach(r => {
      r.addEventListener('change', e => {
        const ab = e.target.value.split('-').map(Number);
        const s = $('#start'), en = $('#end');
        if (s) s.value = ab[0];
        if (en) en.value = ab[1];
        renderPreview();
        updateDragSuggestions();
      });
    });

    document.querySelectorAll('input[name="mode"]').forEach(r => {
      r.addEventListener('change', () => {
        const v = (document.querySelector('input[name="mode"]:checked') || {}).value;
        const dragDiv   = document.getElementById('mode-drag');
        const blanksDiv = document.getElementById('mode-blanks');
        if (dragDiv)   dragDiv.style.display   = (v === 'drag')   ? 'block' : 'none';
        if (blanksDiv) blanksDiv.style.display = (v === 'blanks') ? 'block' : 'none';
        renderPreview();
      });
    });

    renderPreview();
    updateDragSuggestions();
  }

  document.addEventListener('DOMContentLoaded', init);

  return { renderPreview, updateDragSuggestions, getRulerOpts, drawRuler };
})();