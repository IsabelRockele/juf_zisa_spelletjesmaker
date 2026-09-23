/* Same-origin editions share art and gameplay; only PRO uses the existing PRO guard. */
(function(root) {
  const edition=AdventurePolicy.edition(location.pathname);
  const local=location.protocol==='file:' || ['localhost','127.0.0.1','[::1]'].includes(location.hostname);
  const home=edition==='pro'?'../pro/app.html':edition==='ontdek'?'../ontdek/app.html':'../index.html';
  const access=root.AdventureAccess={edition,ready:local || edition==='ontdek'};
  const base=new URL('.',document.currentScript.src);
  document.documentElement.dataset.access=access.ready?'ready':'pending';
  function ready(){access.ready=true;document.documentElement.dataset.access='ready';}
  function failed(){document.getElementById('accessMessage').textContent='De inlogcontrole kon niet laden. Herlaad de pagina of ga terug naar het tooloverzicht.';}
  document.addEventListener('DOMContentLoaded',()=>{
    for(const id of ['menuLink','accessBack']) document.getElementById(id).href=new URL(home,base).href;
    document.getElementById('menuLink').textContent=edition==='pro'?'← Alle Pro-tools':edition==='ontdek'?'← Alle Ontdek-tools':'← Alle tools';
    if(edition==='ontdek') {
      document.getElementById('editionNote').hidden=false;
      document.getElementById('worldEyebrow').textContent='ONTDEK · TWEE SPELVORMEN';
    }
  });
  if(access.ready) return;
  root.onProReady=ready;
  root.onAdventureColleagueReady=ready;
  const script=document.createElement('script');script.type='module';
  script.src=new URL(edition==='pro'?'../pro/guard.js':'colleague-access.js?v=15',base).href;
  script.onerror=()=>{if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',failed,{once:true});else failed();};
  document.head.appendChild(script);
})(globalThis);
