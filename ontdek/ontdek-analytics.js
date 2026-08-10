(function () {
  'use strict';

  if (window.__zisaAnalyticsGeladen) return;
  window.__zisaAnalyticsGeladen = true;

  const METING_ID = 'G-9LHNLFHSXX';
  const KEUZE_SLEUTEL = 'zisa_analytics_toestemming_v1';
  let gestart = false;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500,
  });

  function startMeting() {
    if (gestart) return;
    gestart = true;
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${METING_ID}`;
    document.head.appendChild(script);
    window.gtag('js', new Date());
    window.gtag('config', METING_ID, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_title: document.title,
      page_location: location.href,
    });
  }

  window.zisaTrack = function (naam, parameters = {}) {
    if (!gestart) return;
    window.gtag('event', naam, parameters);
  };

  function sluitBanner() {
    document.getElementById('zisa-analytics-keuze')?.remove();
  }

  function bewaarKeuze(keuze) {
    localStorage.setItem(KEUZE_SLEUTEL, keuze);
    sluitBanner();
    if (keuze === 'akkoord') startMeting();
  }

  function toonBanner() {
    if (document.getElementById('zisa-analytics-keuze')) return;
    const stijl = document.createElement('style');
    stijl.textContent = `
      #zisa-analytics-keuze{position:fixed;left:18px;right:18px;bottom:18px;z-index:2147483647;display:flex;align-items:center;justify-content:space-between;gap:18px;max-width:920px;margin:auto;padding:16px 18px;border:1px solid #efc14c;border-radius:16px;background:#fffaf0;box-shadow:0 12px 38px rgba(19,53,89,.24);font-family:Nunito,Arial,sans-serif;color:#173b63}
      #zisa-analytics-keuze strong{display:block;font-size:16px;margin-bottom:3px}#zisa-analytics-keuze p{margin:0;font-size:13px;line-height:1.45}
      .zisa-analytics-knoppen{display:flex;gap:8px;flex-shrink:0}.zisa-analytics-knoppen button{border:1px solid #174a7c;border-radius:10px;padding:10px 14px;font:800 13px Nunito,Arial,sans-serif;cursor:pointer}
      #zisa-analytics-nee{color:#174a7c;background:#fff}#zisa-analytics-ja{color:#fff;background:#174a7c}
      @media(max-width:650px){#zisa-analytics-keuze{align-items:stretch;flex-direction:column}.zisa-analytics-knoppen button{flex:1}}
    `;
    document.head.appendChild(stijl);
    const banner = document.createElement('aside');
    banner.id = 'zisa-analytics-keuze';
    banner.setAttribute('aria-label', 'Keuze voor anonieme bezoekersstatistieken');
    banner.innerHTML = `
      <div><strong>Help je de Spelgenerator verbeteren?</strong><p>Met anonieme statistieken zien we welke Ontdek-tools gebruikt worden. We meten geen naam, e-mailadres of inhoud van je materiaal.</p></div>
      <div class="zisa-analytics-knoppen"><button id="zisa-analytics-nee" type="button">Liever niet</button><button id="zisa-analytics-ja" type="button">Dat is goed</button></div>`;
    document.body.appendChild(banner);
    banner.querySelector('#zisa-analytics-nee').addEventListener('click', () => bewaarKeuze('geweigerd'));
    banner.querySelector('#zisa-analytics-ja').addEventListener('click', () => bewaarKeuze('akkoord'));
  }

  function veiligeNaam(tekst) {
    return String(tekst || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  }

  function volgKlikken() {
    document.addEventListener('click', event => {
      const element = event.target.closest('a,button');
      if (!element) return;
      const tekst = veiligeNaam(element.textContent || element.getAttribute('aria-label'));
      const href = element.tagName === 'A' ? element.getAttribute('href') || '' : '';
      if (/download|pdf|png|exporteer|afdruk/i.test(tekst)) {
        window.zisaTrack('ontdek_download_klik', { knop: tekst, pagina: location.pathname });
      } else if (element.matches('a.img-link') || /start met ontdekken/i.test(tekst)) {
        window.zisaTrack('ontdek_tool_openen', { tool: tekst, bestemming: href });
      }
    }, true);
  }

  const keuze = localStorage.getItem(KEUZE_SLEUTEL);
  if (keuze === 'akkoord') startMeting();
  document.addEventListener('DOMContentLoaded', () => {
    volgKlikken();
    if (!keuze) toonBanner();
  });
})();
