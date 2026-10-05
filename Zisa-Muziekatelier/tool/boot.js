import { ready, blocked } from './access.js?v=2';
if (await ready) {
  try {
    for (const placeholder of document.querySelectorAll('script[data-music-src]')) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = placeholder.dataset.musicSrc;
        script.onload = resolve; script.onerror = reject;
        document.body.append(script);
      });
    }
  } catch { blocked('Een onderdeel kon niet laden. Controleer je verbinding en probeer opnieuw.'); }
}
