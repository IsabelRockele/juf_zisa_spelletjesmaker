/* Local, synchronous protection: also works before the online access check. */
(() => {
  if (location.pathname.endsWith('/pentomino_studio_volledige_tool.html') && new URLSearchParams(location.search).get('play') !== '1') return;
  if (window.zisaTabletSafety) return;
  window.zisaTabletSafety = true;
  const style = document.createElement('style');
  style.textContent = `
    html { touch-action: pan-x pan-y; -webkit-text-size-adjust:100%; }
    body { overscroll-behavior:none; -webkit-touch-callout:none; }
    body :not(input):not(textarea) { -webkit-user-select:none; user-select:none; }
    input,select,textarea { font-size:max(16px,1em); }
    #zisaNumberPad { position:fixed; right:12px; bottom:max(12px,env(safe-area-inset-bottom));
      z-index:2147483646; width:230px; padding:12px; border:2px solid #a4c5d0;
      border-radius:18px; background:#fffaf1; box-shadow:0 6px 30px #17324d55; }
    #zisaNumberPad[hidden] { display:none; }
    #zisaNumberPad strong { display:block; margin-bottom:8px; color:#17324d; }
    #zisaNumberPad div { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; }
    #zisaNumberPad button { min-height:44px; font:700 20px Arial; border:1px solid #a4c5d0;
      border-radius:9px; background:white; color:#17324d; touch-action:manipulation; }
    #zisaNumberPad button:last-child { grid-column:1/-1; background:#d9eee4; }
    input[data-zisa-number-active] { outline:3px solid #e79d24; outline-offset:2px; }
  `;
  document.head.append(style);
  // Safari ignores user-scalable=no on some iPads. Cancel the zoom gesture itself.
  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
    document.addEventListener(type, event => event.preventDefault(), {passive:false});
  }
  document.addEventListener('touchmove', event => {
    if (event.touches.length > 1) event.preventDefault();
  }, {passive:false});
  document.addEventListener('dblclick', event => event.preventDefault(), {passive:false});
  document.addEventListener('contextmenu', event => {
    if (!event.target.closest('input:not([readonly]),textarea')) event.preventDefault();
  });
  document.addEventListener('dragstart', event => {
    if (event.target.closest('img,a')) event.preventDefault();
  });

  const keypadSelector = '.toetsenbord,.numeric-keypad,.numpad,#toetsenbord,#numpad,.keypad,#keypad';
  let active = null, pad;
  const isNumeric = input => input.matches('input[type="number"],input[inputmode="numeric"],input[inputmode="decimal"]');
  function protect(input) {
    if (!(input instanceof HTMLInputElement)) return;
    const ownKeys = document.querySelector(keypadSelector);
    if (!isNumeric(input) && !(ownKeys && input.matches('input[type="text"],input[type="tel"],input:not([type])') && !/name|naam/i.test(input.id))) return;
    if (input.dataset.zisaInput) return;
    // Readonly is essential: inputmode alone does not reliably suppress Safari's keyboard.
    const alreadyReadonly = input.readOnly;
    input.dataset.zisaInput = input.hasAttribute('data-zisa-number-pad') ? 'pad' : ownKeys || alreadyReadonly ? 'own' : 'pad';
    input.readOnly = true;
    input.inputMode = 'none';
    input.autocomplete = 'off';
  }
  function closePad() {
    if (active) active.removeAttribute('data-zisa-number-active');
    active = null;
    if (pad) pad.hidden = true;
  }
  function openPad(input) {
    closePad();
    active = input;
    active.setAttribute('data-zisa-number-active','');
    if (!pad) {
      pad = document.createElement('section');
      pad.id = 'zisaNumberPad';
      pad.setAttribute('aria-label','Cijfertoetsen');
      pad.innerHTML = '<strong>Vul het getal in</strong><div>' + ['1','2','3','4','5','6','7','8','9','wis','0','⌫','Klaar ✓'].map(key => `<button type="button" data-number="${key}">${key}</button>`).join('') + '</div>';
      pad.addEventListener('pointerdown', event => event.preventDefault());
      pad.addEventListener('click', event => {
        const key = event.target.closest('button')?.dataset.number;
        if (!key || !active || active.disabled) return;
        if (key === 'Klaar ✓') { closePad(); return; }
        const limit = active.maxLength > 0 ? active.maxLength : 6;
        active.value = key === 'wis' ? '' : key === '⌫' ? active.value.slice(0,-1) : (active.value + key).slice(0,limit);
        active.dispatchEvent(new Event('input',{bubbles:true}));
        active.dispatchEvent(new Event('change',{bubbles:true}));
      });
      document.body.append(pad);
    }
    pad.hidden = false;
    // Keep the currently edited field visible, including lower workbook fields.
    const rect = input.getBoundingClientRect();
    pad.style.top = rect.bottom > innerHeight - 300 ? '12px' : 'auto';
    pad.style.bottom = rect.bottom > innerHeight - 300 ? 'auto' : 'max(12px,env(safe-area-inset-bottom))';
  }
  document.addEventListener('pointerdown', event => {
    protect(event.target);
    if (active && !event.target.closest('#zisaNumberPad') && event.target !== active) closePad();
  },true);
  document.addEventListener('focusin', event => {
    protect(event.target);
    if (event.target.dataset?.zisaInput === 'pad') openPad(event.target);
  },true);
  document.addEventListener('click', event => {
    if (event.target.dataset?.zisaInput === 'pad') openPad(event.target);
  });
  function scan() {
    document.querySelectorAll('input').forEach(protect);
    if (active && (!active.isConnected || active.disabled || !active.getClientRects().length)) closePad();
  }
  function ready() {
    scan();
    new MutationObserver(scan).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','hidden']});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',ready,{once:true});
  else ready();
})();
