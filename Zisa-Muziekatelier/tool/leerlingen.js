import { ready, access, blocked } from './access.js';
if (await ready) {
  try {
    let url = new URL('https://tools.jufzisa.be/Zisa-Muziekatelier/tool/');
    const note = document.querySelector('.note');
    if (access.edition === 'pro') {
      let code = access.code;
      if (!code) {
        const { classLink } = await import('./pro-service.js');
        code = (await classLink()).code;
      }
      if (!/^[A-Za-z0-9_-]{12,40}$/.test(code || '')) throw new Error('Geen leerlingcode ontvangen.');
      url.searchParams.set('edition', 'pro'); url.searchParams.set('code', code);
      note.textContent = 'Deze vaste QR werkt zolang je Pro-abonnement actief is, ook na verlenging. Leerlingen hoeven niet in te loggen. De iPad heeft internet nodig. De toestellen tellen samen met Zisa Spelen: maximaal 50 gekoppeld en 30 tegelijk. Vernieuw je de leerlingcode bij Zisa Spelen, druk dan ook deze QR opnieuw af.';
    } else if (access.edition === 'ontdek') url.searchParams.set('edition', 'ontdek');
    const qr = window.qrcode(0, 'M'); qr.addData(url.href); qr.make();
    const image = document.querySelector('.qr'); image.src = qr.createDataURL(12, 48); image.hidden = false;
    const download = document.querySelector('[download]'); download.href = image.src;
    const link = document.querySelector('.link'); link.href = url.href; link.textContent = url.href;
    document.querySelector('.actions').hidden = false; link.hidden = false;
    document.getElementById('qrStatus').textContent = 'Scan en maak muziek!';
  } catch { blocked('De QR-code kon niet worden gemaakt. Controleer je verbinding en probeer opnieuw. Er is geen onbeveiligde Pro-link aangemaakt.'); }
}
