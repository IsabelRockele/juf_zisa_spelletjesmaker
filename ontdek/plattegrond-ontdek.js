document.addEventListener('DOMContentLoaded',()=>{
  const host=document.querySelector('.canvas-container');
  if(host){host.classList.add('ontdek-plattegrond-canvas');const badge=document.createElement('div');badge.className='ontdek-plattegrond-badge';badge.innerHTML='<strong>ONTDEK</strong><span>Vrij tekenen · namen en legende zijn PRO</span>';host.appendChild(badge);}
  const heading=document.querySelector('.workspace-heading p');
  if(heading)heading.textContent='Teken en richt het lokaal vrij in. Namen, plaatsen wisselen en de kleurenlegende zijn beschikbaar in PRO.';
  const style=document.createElement('style');style.textContent=`
    .ontdek-plattegrond-canvas{position:relative!important}
    .ontdek-plattegrond-badge{position:absolute;z-index:40;right:14px;top:14px;display:flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid #e4bf4a;border-radius:10px;background:rgba(255,248,213,.94);color:#5d4700;box-shadow:0 3px 12px rgba(69,52,0,.12);pointer-events:none;font:700 11px/1.2 Nunito,Arial,sans-serif}
    .ontdek-plattegrond-badge strong{padding:3px 6px;border-radius:999px;background:#ffd34e;color:#493500;font-size:10px}
    .ontdek-plattegrond-pro{position:relative;border-color:#e2bf50!important;background:#fff8d9!important;color:#604900!important}
    .ontdek-plattegrond-pro::after{content:'PRO';display:inline-flex;margin-left:7px;padding:2px 6px;border-radius:999px;background:#ffd34e;color:#493500;font-size:9px;font-weight:950}
  `;document.head.appendChild(style);
  ['namenModusKnop','legendeModusKnop','wisselModusKnop','downloadPdfNamenKnop','downloadPdfLegendeKnop','importeerJsonKnop'].forEach(id=>document.getElementById(id)?.classList.add('ontdek-plattegrond-pro'));
  [document.getElementById('namenTonenToggle')?.closest('label'),document.getElementById('legendeTonenToggle')?.closest('label')].filter(Boolean).forEach(el=>{el.hidden=true;el.style.setProperty('display','none','important');});
});
