/* Eén afspraak voor de plaats van het gekozen tafelgetal in alle tafelspellen. */
(() => {
  const ownRoot=new URL('./',document.currentScript.src);
  const layout=document.createElement('link');layout.rel='stylesheet';layout.href=new URL('tafel-layout.css?v=2',ownRoot).href;document.head.append(layout);
  const controller=document.createElement('script');controller.src=new URL('tafel-layout.js?v=2',ownRoot).href;controller.defer=true;document.head.append(controller);
  const key='zisa_tafel_volgorde';
  let order='achteraan';
  try { if(localStorage.getItem(key)==='vooraan')order='vooraan'; } catch {}
  function set(value){
    order=value==='vooraan'?'vooraan':'achteraan';
    try{localStorage.setItem(key,order)}catch{}
  }
  function format(table,factor){
    return order==='vooraan'?`${table} × ${factor}`:`${factor} × ${table}`;
  }
  window.ZisaTafelVolgorde={format,set,get:()=>order};
  function mount(){
    if(document.getElementById('tafel-volgorde'))return;
    const start=document.querySelector('#startSpel,#start-spel-knop,#startOefening,#startKnop,#startButton,#start');
    if(!start)return;
    const box=document.createElement('div');box.id='tafel-volgorde';
    box.style.cssText='margin:16px 0;padding:14px;border:1px solid #b8ccd4;border-radius:14px;background:#fff;color:#17324d;text-align:left;';
    box.setAttribute('role','group');box.setAttribute('aria-labelledby','tafel-volgorde-titel');
    const title=document.createElement('strong');title.id='tafel-volgorde-titel';title.textContent='Hoe schrijf je de som in jouw klas?';title.style.cssText='display:block;font:700 18px Arial;margin-bottom:6px';
    const note=document.createElement('p');note.textContent='Kijk naar de voorbeelden van de tafel van 2. Kies zoals je juf of meester het voordoet.';note.style.cssText='margin:0 0 12px;font:15px/1.4 Arial';
    const cards=document.createElement('div');cards.style.cssText='display:flex;flex-wrap:wrap;gap:10px';
    const buttons=[];
    function refresh(){buttons.forEach(button=>{const selected=button.dataset.order===order;button.setAttribute('aria-pressed',String(selected));button.style.borderColor=selected?'#16734b':'#b8ccd4';button.style.background=selected?'#e8f7ef':'#fff';button.querySelector('small').textContent=selected?'✓ Zo oefenen we':'Kies dit voorbeeld';});}
    for(const value of ['achteraan','vooraan']){
      const button=document.createElement('button');button.type='button';button.dataset.order=value;
      button.style.cssText='position:static;flex:1 1 180px;min-width:0;min-height:120px;padding:14px;border:3px solid;border-radius:12px;color:#17324d;cursor:pointer;text-align:center;white-space:normal';
      const equation=value==='achteraan'?'3 × <b style="color:#1768ac">2</b> = 6':'<b style="color:#1768ac">2</b> × 3 = 6';
      button.innerHTML='<span style="display:block;font:700 27px Arial">'+equation+'</span><span style="display:block;margin:8px 0;font:16px Arial">De 2 staat '+value+'</span><small style="display:block;font:700 14px Arial"></small>';
      button.addEventListener('click',()=>{set(value);refresh()});buttons.push(button);cards.append(button);
    }
    box.append(title,note,cards);refresh();
    const anchor=start.closest('.start-blok')||start;anchor.before(box);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
