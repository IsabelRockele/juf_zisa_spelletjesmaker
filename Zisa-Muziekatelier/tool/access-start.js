// Hide protected content before the first paint. No stored edition can override a QR.
const musicParams = new URLSearchParams(location.search);
// Older free QR codes point to the folder URL; keep those child-friendly too.
const musicChild = musicParams.has('code') || musicParams.get('leerling') === '1' ||
  (!musicParams.has('leerling') && location.pathname.endsWith('/Zisa-Muziekatelier/tool/') && musicParams.get('edition') !== 'pro');
document.documentElement.dataset.musicAudience = musicChild ? 'child' : 'teacher';
if (musicParams.get('edition') === 'pro' || musicParams.has('code')) {
  document.documentElement.dataset.musicAccess = 'pending';
}
