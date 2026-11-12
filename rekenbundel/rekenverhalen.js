/* Rekenverhalen: zes prenten per bewerking en bereik, met lokale gebruiksgeschiedenis. */
const Rekenverhalen = (() => {
  let actief = 'optellen';
  const memory = {};
  const cache = new Map();
  const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const catalogus = () => window.REKENVERHALEN_PRENTEN || [];
  function base() {
    if (['localhost','127.0.0.1'].includes(location.hostname)) return window.REKENVERHALEN_BASE_URL || '/output/rekenverhalen/cloudflare/';
    return window.REKENVERHALEN_BASE_URL || '';
  }
  function url(o) { const b=base();return b?b.replace(/\/$/,'')+'/'+o.file:''; }
  function lees(key) { try {return JSON.parse(localStorage.getItem(key)||'null')||memory[key]||[];}catch{return memory[key]||[];} }
  function bewaar(key,value) {memory[key]=value;try{localStorage.setItem(key,JSON.stringify(value));}catch{/* Blijft werken binnen deze sessie. */}}
  function schud(items) {const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function kiesPrenten(n,type,aantal,vermijd=[]) {
    if(![5,6,7,8,9,10].includes(+n))throw Error('Kies een bereik van 5 tot en met 10.');
    aantal=Math.max(1,Math.min(6,Math.floor(+aantal)||1));
    const neem=(soort,count)=>{
      const pool=catalogus().filter(o=>o.n===+n&&o.type===soort), key=`zisa-rekenverhalen-v1-${n}-${soort}`;
      const history=lees(key).filter(id=>pool.some(o=>o.id===id));
      // Nooit dubbels binnen een bundel. Bij nieuwe rondes eerst de minst recent gebruikte.
      const volgorde=schud(pool).sort((a,b)=>{
        const sa=(vermijd.includes(a.id)?1000:0)+(history.indexOf(a.id)+1);
        const sb=(vermijd.includes(b.id)?1000:0)+(history.indexOf(b.id)+1);
        return sa-sb;
      });
      const result=volgorde.slice(0,count), ids=result.map(o=>o.id);
      bewaar(key,[...history.filter(id=>!ids.includes(id)),...ids]);return result;
    };
    if(type==='gemengd'){
      const key=`zisa-rekenverhalen-v1-${n}-start`,vorige=lees(key)[0],start=vorige==='optellen'?'aftrekken':'optellen';bewaar(key,[start]);
      const plus=Math.floor(aantal/2)+(aantal%2&&start==='optellen'?1:0);
      return schud([...neem('optellen',plus),...neem('aftrekken',aantal-plus)]);
    }
    const result=schud(neem(type,aantal));
    if(result.length>1 && result.every((o,i)=>o.id===vermijd[i]))result.push(result.shift());
    return result;
  }
  function maakBlok(n,type,aantal,voorbeeld=false,vermijd=[]) {
    return {id:`verhaal-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,bewerking:type,niveau:+n,brug:'zonder',hulpmiddelen:[],opdrachtzin:'Kijk naar de prent. Schrijf de bewerking en los op.',config:{rekenverhalen:true,voorbeeld},oefeningen:kiesPrenten(n,type,aantal,vermijd).map(o=>({...o}))};
  }
  function antwoord(o) {return o.type==='optellen'?`${o.a} + ${o.b} = ${o.totaal}`:`${o.totaal} − ${o.b} = ${o.a}`;}

  function bediening(el,blok){
    const zin=el.querySelector('.opdrachtzin-wrapper');zin.id='zin-wrapper-'+blok.id;
    zin.innerHTML='<span class="opdrachtzin-tekst"></span><button class="btn-bewerk-zin" title="Bewerk opdrachtzin">✏️</button>';
    zin.querySelector('span').textContent=blok.opdrachtzin;zin.querySelector('button').onclick=()=>App.bewerkZin(blok.id);
    el.querySelectorAll('.gb-grid > div,.verhaal-grid > div').forEach((card,i)=>{card.classList.add('oefening-item');card.style.cssText='position:relative;display:block;min-width:0';const del=document.createElement('button');del.className='btn-del-oef';del.style.cssText='position:absolute;right:6px;top:6px';del.title='Verwijder oefening';del.textContent='×';del.onclick=()=>App.verwijderOefening(blok.id,i);card.append(del);});
    const footer=document.createElement('div');footer.className='preview-blok-footer';footer.innerHTML='<span class="footer-info"></span><button class="btn-add-oef">+ Oefening</button>';footer.querySelector('span').textContent=blok.oefeningen.length+' oefeningen';const add=footer.querySelector('button');add.onclick=()=>App.voegOefeningToe(blok.id);if(blok.config.rekenverhalen&&blok.oefeningen.length>=6){add.disabled=true;add.title='Maximaal 6 verhaalprenten per blok';}el.append(footer);return el;
  }
  function render(blok,solutions) {
    const el=document.createElement('div');el.className='preview-blok verhaal-blok';el.dataset.id=blok.id;
    el.innerHTML=`<div class="preview-blok-header"><span class="blok-type-badge">Rekenverhalen · ${esc(blok.bewerking)}</span><span class="blok-niveau">Tot ${blok.niveau}</span><div class="spacer"></div><button class="btn-blok-actie" data-refresh>Andere prenten</button><button class="btn-blok-actie verwijder" title="Verwijder blok" data-delete>✕</button></div><div class="preview-blok-body"><div class="opdrachtzin-wrapper">${esc(blok.opdrachtzin)}</div><div class="verhaal-grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:26px 20px"></div></div>`;
    el.querySelector('[data-delete]').onclick=()=>App.verwijderBlok(blok.id);
    el.querySelector('[data-refresh]').style.cssText='width:auto;min-width:110px;white-space:nowrap;padding:4px 10px;color:white';
    el.querySelector('[data-refresh]').onclick=()=>{blok.oefeningen=kiesPrenten(blok.niveau,blok.bewerking,blok.oefeningen.length,blok.oefeningen.map(o=>o.id)).map(o=>({...o}));el.replaceWith(render(blok,solutions));};
    blok.oefeningen.forEach((o,i)=>{
      const card=document.createElement('div');card.className='verhaal-oefening';
      const renew=document.createElement('button');renew.className='btn-refresh-prent';renew.textContent='↻';renew.title='Vervang deze verhaalprent';renew.setAttribute('aria-label','Vervang deze verhaalprent');renew.style.cssText='position:absolute;right:30px;top:6px;z-index:1;border:1px solid #bdd4ee;border-radius:5px;background:white;color:#1766a5;font-size:22px;cursor:pointer;width:30px;height:30px';
      renew.onclick=async()=>{const ids=blok.oefeningen.map(v=>v.id);if(!catalogus().some(v=>v.n===blok.niveau&&v.type===o.type&&!ids.includes(v.id))){App.toonToast('Alle zes verhalen van deze bewerking staan al in dit blok. Verwijder eerst een prent om te kunnen wisselen.');return;}renew.disabled=true;try{const nieuw=kiesPrenten(blok.niveau,o.type,1,ids)[0];await laad(nieuw);blok.oefeningen[i]={...nieuw};el.replaceWith(render(blok,solutions));}catch(e){App.toonToast(e.message);renew.disabled=false;}};card.append(renew);
      const img=document.createElement('img');img.src=url(o);img.alt=`Rekenverhaal met ${o.title}`;img.style.cssText='display:block;width:100%;aspect-ratio:1.95;object-fit:contain';
      img.onerror=()=>{img.alt='Prent kon niet laden. Controleer de verbinding.';};card.append(img);
      const line=document.createElement('div');line.className='verhaal-antwoord';line.style.cssText='height:35px;margin:32px 10px 14px;border-bottom:1px solid #9aa6af;font-size:22px;color:#0072aa';line.textContent=solutions||(blok.config.voorbeeld&&i===0)?antwoord(o):'';card.append(line);el.querySelector('.verhaal-grid').append(card);
    });return bediening(el,blok);
  }
  async function laad(o) {
    const src=url(o);if(!src)throw Error('De verhaalprenten zijn nog niet gekoppeld aan Cloudflare.');
    if(!cache.has(src))cache.set(src,(async()=>{const r=await fetch(src,{mode:'cors'});if(!r.ok)throw Error(`Prent niet bereikbaar: ${o.id}`);const blob=await r.blob();const data=await new Promise((resolve,reject)=>{const f=new FileReader();f.onload=()=>resolve(f.result);f.onerror=reject;f.readAsDataURL(blob);});const image=new Image();image.src=data;await image.decode();return {data,width:image.naturalWidth,height:image.naturalHeight};})().catch(e=>{cache.delete(src);throw e;}));
    return cache.get(src);
  }
  async function tekenPdf(blok,doc,y,{ML,CW,checkRuimte,getY,metAntwoorden}) {
    // Eerst alles laden: geen PDF met stilzwijgend ontbrekende prenten.
    const images=await Promise.all(blok.oefeningen.map(laad));
    const w=(CW-10)/2,h=w/1.95,rowH=h+24;
    doc.setFont('helvetica','bold');doc.setFontSize(12);const title=doc.splitTextToSize(blok.opdrachtzin,CW);
    checkRuimte(title.length*6+rowH+4);y=getY();doc.setTextColor(26,58,92);doc.text(title,ML,y+3);y+=title.length*6+5;
    for(let i=0;i<images.length;i+=2){
      // De aanroeper synchroniseert y voordat de paginacontrole wordt uitgevoerd.
      checkRuimte(rowH,y);y=getY();
      for(let k=0;k<2&&i+k<images.length;k++){
        const img=images[i+k],x=ML+k*(w+10),scale=Math.min(w/img.width,h/img.height),iw=img.width*scale,ih=img.height*scale;
        doc.addImage(img.data,'PNG',x+(w-iw)/2,y+(h-ih)/2,iw,ih,undefined,'FAST');
        const ly=y+h+17;doc.setDrawColor(160,170,180);doc.setLineWidth(.25);doc.line(x+2,ly,x+w-2,ly);
        if(metAntwoorden||(blok.config.voorbeeld&&i+k===0)){doc.setFont('helvetica','normal');doc.setFontSize(13);doc.setTextColor(0,114,170);doc.text(antwoord(blok.oefeningen[i+k]).replace('−','-'),x+3,ly-2);}
      }
      y+=rowH;
    }
    return y+8;
  }
  function kaart(id,gemengd) {
    const el=document.createElement('details');el.id=id;el.className='config-kaart';
    el.innerHTML=`<summary style="font-weight:700;cursor:pointer">Rekenverhalen met prenten</summary><input type="hidden" data-rv="niveau" value="5"><div class="form-rij"><label>Aantal prenten <select data-rv="aantal">${[1,2,3,4,5,6].map(n=>`<option ${n===2?'selected':''}>${n}</option>`).join('')}</select></label></div><label><input type="checkbox" data-rv="voorbeeld"> Eerste oefening als ingevuld voorbeeld</label><p>Maximaal 6 oefeningen, per twee naast elkaar. Recent gebruikte prenten komen pas opnieuw aan bod nadat de andere gebruikt zijn.</p>${gemengd?'<p>Vanaf twee oefeningen: optellen én aftrekken door elkaar.</p>':''}<p data-rv="status"></p><button class="btn-toevoegen" type="button">Voeg verhaalprenten toe</button>`;
    const button=el.querySelector('button');button.onclick=async()=>{
      if(!base()){App.toonToast('De verhaalprenten wachten nog op de Cloudflare-upload.');return;}
      button.disabled=true;
      try{const b=maakBlok(+el.querySelector('[data-rv="niveau"]').value,gemengd?'gemengd':actief,+el.querySelector('[data-rv="aantal"]').value,el.querySelector('[data-rv="voorbeeld"]').checked);await Promise.all(b.oefeningen.map(laad));App.voegGetalbeeldenBlokToe(b);}catch(e){App.toonToast(e.message);}finally{button.disabled=false;}
    };
    if(!base())el.querySelector('[data-rv="status"]').textContent='Beschikbaar na de Cloudflare-upload.';
    return el;
  }
  function kies(type){actief=type;syncBereik();}
  function syncBereik(){for(const [id,group,mixed] of [['rv-hoofd','niveau',false],['rv-gemengd','gem-niveau',true]]){const el=document.getElementById(id);if(!el)continue;const n=+document.querySelector('[name="'+group+'"]:checked')?.value;const ok=[5,6,7,8,9,10].includes(n)&&(mixed||['optellen','aftrekken'].includes(actief));el.style.display=ok?'':'none';if(ok){el.querySelector('[data-rv="niveau"]').value=n;el.querySelector('summary').textContent=(mixed?'Gemengd':actief==='aftrekken'?'Aftrekken':'Optellen')+' met verhaalprenten · tot '+n;}}}
  document.addEventListener('change',e=>{if(['niveau','gem-niveau'].includes(e.target.name))syncBereik();});
  document.addEventListener('DOMContentLoaded',()=>{document.getElementById('gb-hoofd').after(kaart('rv-hoofd',false));document.querySelector('#tab-gemengd .config-kaart').after(kaart('rv-gemengd',true));document.querySelector('#rv-gemengd summary').textContent='Gemengde rekenverhalen met prenten · tot 5–10';kies(actief);});
  return {kies,kiesPrenten,maakBlok,render,antwoord,laad,tekenPdf,url};
})();
