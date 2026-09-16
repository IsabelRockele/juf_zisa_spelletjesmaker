const params = new URLSearchParams(location.search);
let discover = params.get('ontdek') === '1';
try { discover ||= sessionStorage.getItem('zisa_discover_preview') === '1'; } catch {}
if (discover) {
  for (const link of document.querySelectorAll('a[href*="/wolkentrein/"]')) {
    const url = new URL(link.href);
    url.searchParams.set('ontdek', '1');
    link.href = url.href;
    const note = document.createElement('small');
    note.textContent = 'Ontdek: level 1 vrij · overige levels PRO';
    link.closest('.game-info').querySelector('p').append(document.createElement('br'), note);
  }
}
