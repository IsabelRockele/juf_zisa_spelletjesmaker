// Hide protected content before the first paint. No stored edition can override a QR.
const musicParams = new URLSearchParams(location.search);
if (musicParams.get('edition') === 'pro' || musicParams.has('code')) {
  document.documentElement.dataset.musicAccess = 'pending';
}
