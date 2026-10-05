/* Dezelfde SVG-opmaak voor preview, werkblad en oplossingssleutel. */
window.HalverenVerdubbelen=(()=>{
  const soorten={tekenen:'Verdubbel. Teken erbij en vul aan.',schema:'Vul de splitsvakjes en de zinnen aan.',zinnen:'Gebruik de som. Vul de zinnen aan.',kort:'Halveer of verdubbel. Vul in.'};
  const namen={tekenen:'Tekenen en rekenen',schema:'Splitsvakjes en zinnen',zinnen:'Van som naar helft en dubbel',kort:'Korte vraagjes'};
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  function pool(type){return shuffle(Array.from({length:type==='kort'?60:type==='schema'?20:10},(_,i)=>({n:i%10+1,variant:Math.floor(i/10),sleutel:`${type}-${i}`})));}
  function append(blok){const used=new Set(blok.oefeningen.map(o=>o.sleutel));const next=pool(blok.config.type).find(o=>!used.has(o.sleutel));if(!next)return false;blok.oefeningen.push(next);return true;}
  function maten(type){return [360,{tekenen:480,schema:400,zinnen:310,kort:150}[type]];}
  function layout(type,o,solution=false){
    const [w,h]=maten(type),n=o.n,total=2*n,fields=[];
    let body=`<rect x="1" y="1" width="${w-2}" height="${h-2}" rx="10" fill="white" stroke="#aac2d4"/>`;
    const text=(x,y,t,size=16,color='#243746')=>{body+=`<text x="${x}" y="${y}" font-family="Arial,sans-serif" font-size="${size}" fill="${color}">${esc(t)}</text>`;};
    const field=(key,x,y,width,answer)=>{
      fields.push({key,x,y,width,height:50,answer:String(answer)});
      body+=`<rect x="${x}" y="${y}" width="${width}" height="50" rx="4" fill="white" stroke="#9eb6c8"/>`;
      const value=solution?answer:(o.answers?.[key]||'');
      if(value!=='')text(x+6,y+32,value,17,solution?'#187342':'#243746');
    };
    const symbol=(i,y,color)=>{const x=32+(i%5)*57,cy=y+Math.floor(i/5)*33;
      if(n%3===0)body+=`<path d="M${x-9} ${cy-9} L${x+9} ${cy+9} M${x+9} ${cy-9} L${x-9} ${cy+9}" stroke="${color}" stroke-width="3"/>`;
      else if(n%3===1)body+=`<path d="M${x} ${cy-12} L${x+12} ${cy+10} L${x-12} ${cy+10} Z" fill="${color}"/>`;
      else body+=`<circle cx="${x}" cy="${cy}" r="11" fill="${color}"/>`;
    };
    if(type==='kort'){
      const phrases=[`De helft van ${total} is`,`Het dubbel van ${n} is`,`Als ik ${total} halveer, heb ik`,`Ik verdubbel ${n} en heb nu`,`Als ik ${n} verdubbel, heb ik`,`Ik halveer ${total} en heb nu`];
      text(16,37,phrases[o.variant]);field('kort',16,67,326,[n,total,n,total,total,n][o.variant]);
    }else{
      let y;
      if(type==='tekenen'){
        for(let i=0;i<n;i++)symbol(i,30,'#397d92');
        text(16,105,'Teken er nog evenveel bij.',14);
        body+='<rect x="14" y="116" width="332" height="112" fill="white" stroke="#d4e1eb" stroke-dasharray="3 3"/>';
        if(solution)for(let i=0;i<n;i++)symbol(i,145,'#187342');
        else for(const d of o.ink||[])body+=`<path d="${esc(d)}" fill="none" stroke="#28789c" stroke-width="2" stroke-linecap="round"/>`;
        y=244;
        text(16,y+32,`${n} + ${n} =`);field('som',126,y,218,total);
      }else if(type==='schema'){
        body+='<rect x="70" y="14" width="220" height="108" fill="white" stroke="#617f94"/><path d="M70 68 H290 M180 68 V122" fill="none" stroke="#617f94"/>';
        if(o.variant===0){text(174,48,total,20);field('links',74,70,102,n);field('rechts',184,70,102,n);}
        else{field('geheel',74,16,212,total);text(119,103,n,20);text(229,103,n,20);}
        y=146;field('som',16,y,328,`${n} + ${n} = ${total}`);
      }else{y=28;text(16,y+29,`${n} + ${n} = ${total}`,20);}
      y+=57;text(16,y+32,`Het dubbel van ${n} is`);field('dubbel',204,y,140,total);
      y+=57;text(16,y+32,`De helft van ${total} is`);field('helft',204,y,140,n);
      y+=57;text(16,y+32,`Want ${total} =`);field('want',112,y,232,`${n} + ${n}`);
    }
    return {svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`,fields};
  }
  function uitleg(){return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="178" viewBox="0 0 720 178"><rect x="1" y="1" width="718" height="176" rx="10" fill="#f0f7fb" stroke="#aac2d4"/><g font-family="Arial,sans-serif" fill="#243746"><text x="18" y="26" font-size="18" font-weight="bold">Halveren en verdubbelen tot 20</text><g fill="white" stroke="#617f94"><rect x="22" y="43" width="160" height="54"/><path d="M22 70 H182 M102 70 V97"/><rect x="22" y="112" width="160" height="54"/><path d="M22 139 H182 M102 139 V166"/></g><g font-size="16" text-anchor="middle"><text x="102" y="63">20</text><text x="62" y="89">10</text><text x="142" y="89">10</text><text x="102" y="132">8</text><text x="62" y="158">4</text><text x="142" y="158">4</text></g><g font-size="16"><text x="205" y="61">Halveren: verdeel in twee gelijke delen.</text><text x="205" y="85">De helft van 20 is 10. 10 is de helft van 20.</text><text x="205" y="130">Verdubbelen: neem hetzelfde aantal twee keer.</text><text x="205" y="155">Het dubbel van 4 is 8. 8 is het dubbel van 4.</text></g></g></svg>`;}
  async function png(source){return new Promise((resolve,reject)=>{const image=new Image();const url=URL.createObjectURL(new Blob([source],{type:'image/svg+xml'}));image.onload=()=>{try{const canvas=document.createElement('canvas');canvas.width=image.width*3;canvas.height=image.height*3;canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL('image/png'));}catch(e){reject(e);}finally{URL.revokeObjectURL(url);}};image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Oefenfiguur kon niet worden geladen.'));};image.src=url;});}
  function render(blok,solutions){
    const div=document.createElement('div');div.className='preview-blok hv-blok';div.dataset.id=blok.id;
    div.innerHTML=`<div class="preview-blok-header"><span class="blok-type-badge">Halveren en verdubbelen</span><span class="blok-niveau">Tot 20</span><div class="spacer"></div><button class="btn-blok-actie verwijder" onclick="App.verwijderBlok('${blok.id}')">✕</button></div><div class="preview-blok-body"><div class="opdrachtzin-wrapper" id="zin-wrapper-${blok.id}"><span class="opdrachtzin-tekst" id="zin-tekst-${blok.id}">${esc(blok.opdrachtzin)}</span><button class="btn-bewerk-zin" onclick="App.bewerkZin('${blok.id}')">✏️</button></div>${blok.config.uitleg?`<div class="hv-uitleg">${uitleg()}</div>`:''}<div class="hv-grid"></div></div><div class="preview-blok-footer"><span class="footer-info">${blok.oefeningen.length} oefeningen</span><button class="btn-add-oef" onclick="App.voegOefeningToe('${blok.id}')">+ Oefening</button></div>`;
    blok.oefeningen.forEach((o,i)=>{
      const solved=solutions||(blok.config.voorbeeld&&i===0),card=document.createElement('div');card.className='hv-card';
      const spec=layout(blok.config.type,o,solved),[w,h]=maten(blok.config.type);card.innerHTML=spec.svg;
      if(!solved)spec.fields.forEach(f=>{const input=document.createElement('input');input.type='text';input.className='hv-answer';input.value=o.answers?.[f.key]||'';input.setAttribute('aria-label',f.key);input.style.cssText=`left:${100*f.x/w}%;top:${100*f.y/h}%;width:${100*f.width/w}%;height:${100*f.height/h}%`;input.oninput=()=>{o.answers=o.answers||{};o.answers[f.key]=input.value;};card.append(input);});
      const del=document.createElement('button');del.className='btn-del-oef';del.textContent='✕';del.onclick=()=>App.verwijderOefening(blok.id,i);card.append(del);
      if(blok.config.type==='tekenen'&&!solved){
        const svg=card.querySelector('svg');let path=null;
        const point=e=>{const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse());};
        svg.onpointerdown=e=>{const p=point(e);if(p.y<116||p.y>228||p.x<14||p.x>346)return;e.preventDefault();svg.setPointerCapture(e.pointerId);path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',`M${p.x} ${p.y}`);path.setAttribute('fill','none');path.setAttribute('stroke','#28789c');path.setAttribute('stroke-width','2');svg.append(path);};
        svg.onpointermove=e=>{if(!path)return;const p=point(e);path.setAttribute('d',path.getAttribute('d')+` L${Math.max(14,Math.min(346,p.x))} ${Math.max(116,Math.min(228,p.y))}`);};
        const finish=()=>{if(path){(o.ink||=([])).push(path.getAttribute('d'));path=null;}};svg.onpointerup=finish;svg.onpointercancel=finish;
        const undo=document.createElement('button');undo.className='hv-undo';undo.textContent='Wis tekening';undo.onclick=()=>{o.ink=[];const replacement=render(blok,solutions);div.replaceWith(replacement);};card.append(undo);
      }
      div.querySelector('.hv-grid').append(card);
    });return div;
  }
  function init(){
    const tab=document.createElement('div');tab.className='sidebar-tab tab-halveren';tab.textContent='½ Halveren en verdubbelen';tab.onclick=()=>App.toonBewerking('halveren-verdubbelen',tab);document.querySelector('.tab-splits').after(tab);
    const panel=document.createElement('div');panel.id='tab-halveren';panel.className='sidebar-content';panel.style.display='none';
    panel.innerHTML=`<div class="sectie-titel">Halveren en verdubbelen tot 20</div><p>Halveer even getallen tot 20. Verdubbel aantallen tot 10.</p><div class="config-kaart"><label><input id="hv-uitleg" type="checkbox" checked> Uitlegkader toevoegen</label><br><label><input id="hv-voorbeeld" type="checkbox"> Eerste oefening uitwerken</label></div><div class="config-kaart">${Object.keys(soorten).map((type,i)=>`<div class="hv-keuze"><label><input name="hv-type" type="checkbox" value="${type}" ${i===0?'checked':''}> ${namen[type]}</label><label>Aantal <input id="hv-count-${type}" type="number" min="1" max="${type==='kort'?20:type==='schema'?20:10}" value="4"></label></div>`).join('')}</div><button id="hv-add" class="btn-toevoegen">➕ Voeg gekozen oefeningen toe</button>`;
    document.getElementById('tab-rekentaal').after(panel);
    panel.querySelector('#hv-add').onclick=()=>{
      const selected=[...panel.querySelectorAll('[name="hv-type"]:checked')];if(!selected.length){App.toonToast('Kies minstens één oefensoort.');return;}
      selected.forEach(input=>{const type=input.value,field=document.getElementById(`hv-count-${type}`),count=Math.max(1,Math.min(Number(field.max),Math.floor(Number(field.value)||1)));field.value=count;
        App.voegHalverenBlokToe({id:`hv-${Date.now()}-${type}`,bewerking:'halveren-verdubbelen',niveau:20,opdrachtzin:soorten[type],hulpmiddelen:[],config:{type,uitleg:document.getElementById('hv-uitleg').checked,voorbeeld:document.getElementById('hv-voorbeeld').checked},oefeningen:pool(type).slice(0,count)});
      });
    };
  }
  document.addEventListener('DOMContentLoaded',init);
  return {append,render,layout,maten,uitleg,png,pool};
})();
