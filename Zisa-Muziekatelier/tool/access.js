const params = new URLSearchParams(location.search);
const code = params.get('code') || '';
const edition = params.has('code') || params.get('edition') === 'pro' ? 'pro' : params.get('edition') === 'ontdek' ? 'ontdek' : 'gratis';
const student = params.has('code');
const root = new URL('./', import.meta.url);
const home = new URL(edition === 'pro' ? '../../pro/app.html' : edition === 'ontdek' ? '../../ontdek/app.html' : '../../index.html', root);
export function musicUrl(file, studentCode = code) {
  const url = new URL(file, root);
  if (edition !== 'gratis') url.searchParams.set('edition', edition);
  if (studentCode) url.searchParams.set('code', studentCode);
  return url.href;
}
function links() {
  document.querySelectorAll('a[href]').forEach(link => {
    const url = new URL(link.href);
    if (url.origin !== root.origin) return;
    if (url.pathname.startsWith(root.pathname) && /(?:\/|\.html)$/.test(url.pathname)) {
      if (edition !== 'gratis') url.searchParams.set('edition', edition);
      if (student) url.searchParams.set('code', code);
      link.href = url.href;
    } else if (url.pathname === new URL('../../index.html', root).pathname) {
      link.href = student ? musicUrl('index.html') : home.href;
      if (student) link.textContent = '← Muziekatelier';
    }
  });
  if (student) document.querySelectorAll('.qr-entry').forEach(link => link.hidden = true);
}
let gate;
export function blocked(message, login = false) {
  // Stop scheduled audio before hiding the activity, without reloading recordings.
  document.querySelector('#stop')?.click();
  window.speechSynthesis?.cancel();
  document.documentElement.dataset.musicAccess = 'blocked';
  gate ||= document.body.appendChild(document.createElement('section'));
  gate.id = 'musicAccessGate'; gate.replaceChildren();
  const card = gate.appendChild(document.createElement('div'));
  const title = card.appendChild(document.createElement('h1')); title.textContent = 'Even je toegang nakijken';
  card.appendChild(document.createElement('p')).textContent = message;
  if (login && !student) {
    const link = card.appendChild(document.createElement('a'));
    link.textContent = 'Inloggen bij Pro'; link.href = new URL('../../pro/index.html', root).href;
    link.target = '_blank'; link.rel = 'noopener';
  }
  const retry = card.appendChild(document.createElement('button'));
  retry.textContent = 'Opnieuw controleren'; retry.onclick = () => location.reload();
}
function errorText(error) {
  if (error.code === 'music/login') return error.message;
  if (/permission-denied|failed-precondition/.test(error.code || '')) return student ? 'De Pro-toegang van je leerkracht is niet actief. Vraag je leerkracht om hulp. Na verlenging werkt dezelfde QR-code weer.' : 'Er is geen actief Pro-abonnement gevonden. Controleer je abonnement in Pro.';
  if (/not-found|invalid-argument/.test(error.code || '')) return 'Deze leerling-QR klopt niet meer. Vraag je leerkracht om de huidige QR-code.';
  if (/resource-exhausted/.test(error.code || '')) return 'De limiet voor leerlingentoestellen is bereikt. Vraag je leerkracht om de toestellen bij Zisa Spelen na te kijken.';
  return 'De toegang kon niet worden gecontroleerd. Controleer je internetverbinding en probeer opnieuw.';
}
export const access = {edition, student, code, musicUrl};
export const ready = (async () => {
  links();
  if (edition !== 'pro') return true;
  gate = document.body.appendChild(document.createElement('section'));
  gate.id = 'musicAccessGate';
  gate.innerHTML = '<div><h1>Even wachten…</h1><p>We controleren je toegang tot het muziekatelier.</p></div>';
  try {
    const service = await import('./pro-service.js');
    const check = () => student ? service.student(code) : service.teacher();
    const result = await check();
    if (!result.allowed) throw Object.assign(new Error(), {code:'functions/permission-denied'});
    document.documentElement.dataset.musicAccess = 'ready';
    gate.remove(); gate = null;
    let checking = false;
    const refresh = async () => {
      if (checking || document.hidden) return;
      checking = true;
      try { const latest = await check(); if (!latest.allowed) throw Object.assign(new Error(), {code:'functions/permission-denied'}); }
      catch (error) { blocked(errorText(error), error.code === 'music/login'); }
      finally { checking = false; }
    };
    setInterval(refresh, 120000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
    return true;
  } catch (error) { blocked(errorText(error), error.code === 'music/login'); return false; }
})();
