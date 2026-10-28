// Alleen aantallen en vaste toolnamen; geen accountgegevens of materiaalinhoud.
(function(){
  'use strict';
  window.startZisaBezoekers=function(site){
    if(window.__zisaBezoekers||!['tools.jufzisa.be','demo.jufzisa.be','isabelrockele.github.io'].includes(location.hostname)||window.top!==window.self)return;
    window.__zisaBezoekers=true;
    const endpoint='https://europe-west1-zisa-spelletjesmaker-pro.cloudfunctions.net/recordZisaTraffic';
    const test=new URLSearchParams(location.search).get('zisa_traffic_test')==='1';
    const key='zisa-bezoekers-'+site+(test?'-test':'');let memory=null,last=0;
    const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Brussels'}).format(new Date());
    function identity(){
      let value=memory;try{value=JSON.parse(localStorage.getItem(key))||value;}catch{}
      const now=Date.now(),date=today();
      if(!value||value.day!==date)value={day:date,visitor:crypto.randomUUID(),visit:crypto.randomUUID(),at:now};
      if(now-value.at>=1800000)value.visit=crypto.randomUUID();
      value.at=now;memory=value;try{localStorage.setItem(key,JSON.stringify(value));}catch{}
      return value;
    }
    async function send(event,tool){
      const state=identity(),body={site,visitor:state.visitor,visit:state.visit,id:crypto.randomUUID(),event,test};if(tool)body.tool=tool;
      for(let i=0;i<3;i++){
        try{const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),credentials:'omit',referrerPolicy:'no-referrer',keepalive:true});if(!r.ok)throw Error();const result=await r.json();document.documentElement.dataset.zisaTrafficStatus=result.status;return;}catch{if(i<2)await new Promise(resolve=>setTimeout(resolve,1000*(i+1)));}
      }
      document.documentElement.dataset.zisaTrafficStatus='unavailable';
    }
    function touch(){if(document.visibilityState==='hidden'||Date.now()-last<15000)return;last=Date.now();send('visit');}
    document.addEventListener('click',e=>{
      const link=e.target.closest('a.img-link');
      if(!link||link.getAttribute('href')==='#'||link.classList.contains('tool-hidden'))return;
      const name=(link.querySelector('.img-label')?.textContent||link.querySelector('img')?.alt||'').replace(/\s+/g,' ').trim().slice(0,100);
      if(name){touch();send('tool',name);}
    },true);
    ['pointerdown','keydown','scroll'].forEach(event=>document.addEventListener(event,touch,{passive:true}));
    document.addEventListener('visibilitychange',touch);window.addEventListener('online',touch);touch();
  };
  const site=document.currentScript?.dataset.site;
  if(site)window.startZisaBezoekers(site);
})();
