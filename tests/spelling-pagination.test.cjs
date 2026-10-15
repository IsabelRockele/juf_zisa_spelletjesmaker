const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('C:/Users/isabe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '..');

test('export wacht op prenten en houdt gridrijen met schrijfruimte bijeen', async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const page = await browser.newPage();
    await page.setContent('<div id="export" style="width:700px"><div class="to-prenten">' +
      Array.from({ length: 8 }, (_, i) => `<div><img width="90" height="90"><p>Woord ${i}</p><div style="height:80px">Schrijfruimte</div></div>`).join('') + '</div></div>');
    await page.addStyleTag({ path: path.join(root, 'spelling/thema-oefeningen.css') });
    await page.addScriptTag({ path: path.join(root, 'spelling/pdf-engine.js') });
    const result = await page.evaluate(async () => {
      const el = document.querySelector('#export');
      const grid = el.firstElementChild;
      const before = Array.from(grid.children, c => ({ width: c.offsetWidth, height: c.offsetHeight }));
      const img = el.querySelector('img');
      Object.defineProperty(img, 'complete', { value: false });
      let klaar = false;
      const pending = SpellingPDF.bereidAfbeeldingenVoor(el).then(() => { klaar = true; });
      await new Promise(resolve => setTimeout(resolve, 30));
      const wachtte = !klaar;
      img.dispatchEvent(new Event('load'));
      await pending;
      const rows = Array.from(grid.children);
      const after = rows.flatMap(row => Array.from(row.children, c => ({ width: c.offsetWidth, height: c.offsetHeight })));
      const counts = rows.map(row => row.children.length);
      // De spacer van html2pdf moet de hele rij verplaatsen.
      const second = rows[1];
      const oldTop = second.getBoundingClientRect().top;
      const spacer = document.createElement('div');
      spacer.style.height = '120px';
      grid.insertBefore(spacer, second);
      const shift = second.getBoundingClientRect().top - oldTop;
      const tops = Array.from(second.children, c => c.getBoundingClientRect().top);
      return { wachtte, before, after, counts, shift, tops };
    });
    assert.equal(result.wachtte, true);
    assert.deepEqual(result.counts, [3, 3, 2]);
    assert.deepEqual(result.after, result.before);
    assert.equal(result.shift, 120);
    assert.equal(new Set(result.tops).size, 1);
  } finally {
    await browser.close();
  }
});
