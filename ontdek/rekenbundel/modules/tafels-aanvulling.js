/* Aanvullende tafelvormen. Eén tekening in mm voor preview en PDF. */
const TafelsAanvulling = (() => {
  const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
  const namen = { taal:'Kijken en schrijven met rekentaal', tussenstap:'Van tussenstap naar bewerking', tekenen:'Zelf groepjes tekenen', koppelen:'Wat hoort bij elkaar?', vraagstukken:'Vraagstukken' };
  const opdrachten = {
    taal:'Bekijk de groepjes. Schrijf de tussenstap, de rekentaal en de bewerking.',
    tussenstap:'Schrijf de passende bewerking bij de tussenstap. Reken uit.',
    tekenen:'Teken de deling met kruisjes in groepjes. Schrijf de herhaalde aftrekking en de deling.',
    koppelen:'Geef wat bij elkaar hoort dezelfde kleur.',
    vraagstukken:'Lees elk vraagstuk. Schrijf de bewerking en de antwoordzin.'
  };
  function schud(a) { a=[...a]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
  // Zes verschillende situaties per tafel en per specifieke deelwijze.
  function verhalen(t, soort) {
    const ms=[3,5,4,8,6,9];
    const verm=[
      (m,n)=>[`Er zijn ${m} zakjes met elk ${t} koekjes. Hoeveel koekjes zijn er samen?`, `Er zijn samen ${n} koekjes.`],
      (m,n)=>[`Er staan ${m} vazen. In elke vaas zitten ${t} bloemen. Hoeveel bloemen zijn dat samen?`, `Dat zijn samen ${n} bloemen.`],
      (m,n)=>[`Er zijn ${m} kinderen. Elk kind krijgt ${t} stickers. Hoeveel stickers zijn er nodig?`, `Er zijn ${n} stickers nodig.`],
      (m,n)=>[`Er staan ${m} dozen met elk ${t} potloden. Hoeveel potloden zijn er samen?`, `Er zijn samen ${n} potloden.`],
      (m,n)=>[`Er zijn ${m} rijen met telkens ${t} stoelen. Hoeveel stoelen zijn er?`, `Er zijn ${n} stoelen.`],
      (m,n)=>[`Er zijn ${m} manden met elk ${t} appels. Hoeveel appels zijn er samen?`, `Er zijn samen ${n} appels.`]
    ];
    const groep=[
      (m,n)=>[`Er zijn ${n} koekjes. In elk zakje komen ${t} koekjes. Hoeveel zakjes kun je vullen?`, `Je kunt ${m} zakjes vullen.`],
      (m,n)=>[`Er zijn ${n} bloemen. Je maakt boeketten van ${t} bloemen. Hoeveel boeketten kun je maken?`, `Je kunt ${m} boeketten maken.`],
      (m,n)=>[`Er zijn ${n} stickers. Elk kind krijgt ${t} stickers. Hoeveel kinderen kunnen stickers krijgen?`, `${m} kinderen kunnen stickers krijgen.`],
      (m,n)=>[`Er zijn ${n} potloden. In elke doos passen ${t} potloden. Hoeveel dozen heb je nodig?`, `Je hebt ${m} dozen nodig.`],
      (m,n)=>[`Er zijn ${n} stoelen. Je zet telkens ${t} stoelen op een rij. Hoeveel rijen maak je?`, `Je maakt ${m} rijen.`],
      (m,n)=>[`Er zijn ${n} appels. In elke mand komen ${t} appels. Hoeveel manden kun je vullen?`, `Je kunt ${m} manden vullen.`]
    ];
    const eerlijk=[
      (m,n)=>[`Je verdeelt ${n} koekjes eerlijk over ${t} kinderen. Hoeveel koekjes krijgt elk kind?`, `Elk kind krijgt ${m} koekjes.`],
      (m,n)=>[`Je verdeelt ${n} bloemen gelijk over ${t} vazen. Hoeveel bloemen komen in elke vaas?`, `In elke vaas komen ${m} bloemen.`],
      (m,n)=>[`Je verdeelt ${n} stickers eerlijk over ${t} kinderen. Hoeveel stickers krijgt elk kind?`, `Elk kind krijgt ${m} stickers.`],
      (m,n)=>[`Je verdeelt ${n} potloden gelijk over ${t} dozen. Hoeveel potloden komen in elke doos?`, `In elke doos komen ${m} potloden.`],
      (m,n)=>[`Je verdeelt ${n} stoelen gelijk over ${t} rijen. Hoeveel stoelen staan in elke rij?`, `In elke rij staan ${m} stoelen.`],
      (m,n)=>[`Je verdeelt ${n} appels gelijk over ${t} manden. Hoeveel appels komen in elke mand?`, `In elke mand komen ${m} appels.`]
    ];
    return (soort==='vermenigvuldigen'?verm:soort==='groepjes'?groep:eerlijk).map((f,i)=>{
      const m=ms[i],n=t*m,[tekst,antwoordzin]=f(m,n),antwoord=soort==='vermenigvuldigen'?n:m;
      return {type:'vraagstukken',soort,t,m,n,tekst,antwoord,antwoordzin,bewerking:soort==='vermenigvuldigen'?`${m} × ${t} = ${n}`:`${n} : ${t} = ${m}`,sleutel:`verhaal-${t}-${soort}-${i}`};
    });
  }
  function genereer(c) {
    const tafels=c.tafels||[2],type=c.variant,deel=c.bewerking!=='vermenigvuldigen';
    let groepen=[];
    if(type==='vraagstukken') {
      for(const t of tafels) for(const soort of c.soorten) groepen.push(schud(verhalen(t,soort)));
    } else {
      for(const t of tafels) {
        const pool=[];
        for(let m=1;m<=(c.tafelMax||10);m++) {
          if(c.modus==='tot-uitkomst'&&t*m>c.maxUitkomst) continue;
          const o={type,t,m,n:t*m,deel,sleutel:`${type}-${deel}-${t}-${m}`};
          if(type==='koppelen') {
            // Drie verschillende aantallen groepjes: betekenis, niet alleen uitkomst.
            const keuzes=[m,m+1,m+2].map(g=>({t,m:g,n:t*g}));
            if(keuzes.some(k=>k.m>(c.tafelMax||10)||(c.modus==='tot-uitkomst'&&k.n>c.maxUitkomst))) continue;
            o.kaarten=schud(keuzes.flatMap((k,i)=>[0,1,2,3].map(v=>({...k,groep:i,v}))));
          }
          pool.push(o);
        }
        groepen.push(schud(pool));
      }
    }
    // Verdeel de selectie over de gekozen tafels en deelwijzen, zonder dubbels.
    groepen=schud(groepen); const pool=[];
    for(let i=0;groepen.some(g=>i<g.length);i++) for(const g of groepen) if(g[i])pool.push(g[i]);
    if(c.eersteVoorbeeld && type!=='vraagstukken') {
      const idx=pool.findIndex(o=>o.m>=2&&o.m<=5);
      if(idx>0)[pool[0],pool[idx]]=[pool[idx],pool[0]];
    }
    return pool.slice(0,c.aantalOefeningen||pool.length);
  }
  function regels(s,max=76) {
    const out=[]; let lijn='';
    for(const woord of String(s).split(/\s+/)){ if(lijn&&(lijn+' '+woord).length>max){out.push(lijn);lijn='';} lijn+=(lijn?' ':'')+woord; }
    if(lijn)out.push(lijn);return out;
  }
  function isCompact(o) {
    return ['tussenstap','tekenen'].includes(o.type) || (o.type==='taal' && !o.deel);
  }
  function tekening(o,c={}) {
    const items=[],w=isCompact(o)?88:182;let y=8;
    const text=(s,x=6,yy=y,antwoord=false)=>items.push({vorm:'text',s:String(s),x,y:yy,antwoord});
    const line=(x,y,w)=>items.push({vorm:'line',x,y,w});
    const rect=(x,y,w,h,antwoord=false)=>items.push({vorm:'rect',x,y,w,h,antwoord});
    function zin(s,antwoord=false){for(const r of regels(s,w===88?34:76)){text(r,6,y,antwoord);y+=6;}y+=3;}
    function invul(s){for(const r of regels(s,w===88?34:76)){line(6,y+1,w-16);text(r,6,y,true);y+=9;}}
    function gegeven(s,antwoord){
      const start=items.length;zin(s);
      items.slice(start).forEach(p=>{p.leerling=true;items.push({...p,leerling:false,antwoord:true,s:p.s.replace('…',String(antwoord))});});
    }
    const opt=Array(o.m).fill(o.t).join(' + '),aft=`${o.n} - `+Array(o.m).fill(o.t).join(' - ');
    const bewerking=o.deel?`${o.n} : ${o.t} = ${o.m}`:`${o.m} × ${o.t} = ${o.n}`;
    function groepjes(oplossing=false){
      const cols=Math.min(5,o.t),gh=5+Math.ceil(o.t/cols)*4,gw=5+cols*4;
      const perRij=Math.max(1,Math.floor((w-16)/(gw+3)));
      for(let g=0;g<o.m;g++){
        const x=6+(g%perRij)*(gw+3),gy=y+Math.floor(g/perRij)*(gh+3);
        rect(x,gy,gw,gh,oplossing);
        for(let i=0;i<o.t;i++)text(oplossing?'×':'•',x+3+(i%cols)*4,gy+5+Math.floor(i/cols)*4,oplossing);
      }
      y+=Math.ceil(o.m/perRij)*(gh+3)+7;
    }
    if(o.type==='vraagstukken') {
      zin(o.tekst);
      text('Bewerking:');line(35,y+1,137);text(o.bewerking,35,y,true);
      y+=16;
      text('Antwoordzin:');
      const antwoordRegels=regels(o.antwoordzin,64);
      if(c.antwoordzin==='deels') {
        regels(o.antwoordzin.replace(String(o.antwoord),'________'),64).forEach((r,i)=>{
          text(r,35,y+i*6);items[items.length-1].leerling=true;
        });
      } else line(35,y+1,137);
      antwoordRegels.forEach((r,i)=>text(r,35,y+i*6,true));
      y+=Math.max(1,antwoordRegels.length)*6+7;
    } else if(o.type==='taal') {
      groepjes();invul(o.deel?`${aft} = 0`:`${opt} = ${o.n}`);
      if(o.deel)invul(`${o.n} verdelen in groepen van ${o.t} is ${o.m}.`);
      else {invul(`${o.m} keer ${o.t} is ${o.n}.`);invul(`${o.m} maal ${o.t} is ${o.n}.`);}
      invul(bewerking);
    } else if(o.type==='tussenstap') {
      if(o.deel)zin(`${aft} = 0`);else gegeven(`${opt} = …`,o.n);
      invul(bewerking);
    } else if(o.type==='tekenen') {
      gegeven(`${o.n} : ${o.t} = …`,o.m);zin(`Maak groepjes van ${o.t}.`);
      const start=y;groepjes(true);rect(4,start-2,w-8,y-start);y+=5;
      invul(`${aft} = 0`);invul(bewerking);
    } else if(o.type==='koppelen') {
      const kleuren=[[255,215,215],[210,231,255],[213,241,216]];
      const kaartTekst=k=>k.v===0?(o.deel?`${k.n} : ${k.t}`:`${k.m} × ${k.t}`):k.v===1?(o.deel?`${k.n} in groepen van ${k.t}`:`${k.m} keer ${k.t}`):(o.deel?`${k.n} - `+Array(k.m).fill(k.t).join(' - '):Array(k.m).fill(k.t).join(' + '));
      const kaartH=Math.max(14,...o.kaarten.map(k=>k.v===3?4+Math.ceil(k.m/4)*6:4+regels(kaartTekst(k),22).length*5));
      o.kaarten.forEach((k,i)=>{
        const x=6+(i%3)*56,yy=5+Math.floor(i/3)*(kaartH+2);
        rect(x,yy,54,kaartH);
        items.push({vorm:'rect',x,y:yy,w:54,h:kaartH,antwoord:true,kleur:kleuren[k.groep]});
        const s=kaartTekst(k);
        if(k.v===3) {
          for(let g=0;g<k.m;g++) {
            const gx=x+2+(g%4)*12,gy=yy+2+Math.floor(g/4)*6;
            rect(gx,gy,10,5);
            for(let d=0;d<k.t;d++)items.push({vorm:'dot',x:gx+1.4+(d%5)*1.7,y:gy+1.6+Math.floor(d/5)*1.7});
          }
        } else regels(s,22).forEach((r,j)=>text(r,x+2,yy+6+j*5));
      });y=5+Math.ceil(o.kaarten.length/3)*(kaartH+2)+4;
    }
    return {items,h:y+4,w};
  }
  function svg(o,c) {
    const {items,h,w}=tekening(o,c);
    return `<svg class="tafel-kaart" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(namen[o.type])}">${items.map(p=>{
      const cl=p.antwoord?' class="tafel-oplossing"':p.leerling?' class="tafel-leerling"':'';
      if(p.vorm==='text')return `<text${cl} x="${p.x}" y="${p.y}" font-size="4" fill="${p.antwoord?'#16803b':'#25394c'}">${esc(p.s)}</text>`;
      if(p.vorm==='line')return `<path d="M${p.x} ${p.y}h${p.w}" stroke="#8f9da8" stroke-width=".25"/>`;
      if(p.vorm==='dot')return `<circle cx="${p.x}" cy="${p.y}" r=".45" fill="#25394c"/>`;
      return `<rect${cl} x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="1.5" fill="${p.kleur?`rgb(${p.kleur.join(',')})`:'none'}" stroke="#7395ae" stroke-width=".3"/>`;
    }).join('')}</svg>`;
  }
  function maakBlokElement(blok) {
    const el=document.createElement('div');el.className='preview-blok tafel-aanvulling';el.dataset.id=blok.id;
    const kaart=(o,i)=>`<div class="tafel-oefening">${svg(o,blok.config)}<button class="btn-del-oef" onclick="App.verwijderOefening('${blok.id}',${i})" title="Verwijder oefening">✕</button></div>`;
    const kolommen=blok.oefeningen[0]&&isCompact(blok.oefeningen[0])?2:1;
    const rijen=[];for(let i=0;i<blok.oefeningen.length;i+=kolommen)rijen.push(`<div class="tafel-rij tafel-rij-${kolommen}">${blok.oefeningen.slice(i,i+kolommen).map((o,k)=>kaart(o,i+k)).join('')}</div>`);
    el.innerHTML=`<div class="preview-blok-header"><span class="blok-type-badge">${esc(namen[blok.config.variant])}</span><div class="spacer"></div><button class="btn-blok-actie verwijder" onclick="App.verwijderBlok('${blok.id}')">✕</button></div><div class="preview-blok-body"><div class="tafel-eerste-rij"><div class="opdrachtzin-wrapper" id="zin-wrapper-${blok.id}"><span class="opdrachtzin-tekst">${esc(blok.opdrachtzin)}</span><button class="btn-bewerk-zin" onclick="App.bewerkZin('${blok.id}')">✏️</button></div>${rijen[0]||''}</div>${rijen.slice(1).join('')}</div><div class="preview-blok-footer">${blok.oefeningen.length} oefeningen<button class="btn-add-oef" onclick="App.voegOefeningToe('${blok.id}')">+ Oefening</button></div>`;
    return el;
  }
  function markeerVoorbeeld(el,oef) {
    const eerste=el.querySelector('.tafel-oefening,.inzicht-oef,.gl-oefening,.tafel-oef');
    if(!eerste)return el;
    eerste.classList.add('tafel-uitgewerkt');
    eerste.setAttribute('aria-label','Uitgewerkt voorbeeld');
    eerste.querySelectorAll('[data-antwoord]').forEach(v=>{
      v.textContent=v.dataset.antwoord;v.removeAttribute('data-antwoord');v.classList.add('tafel-vast-antwoord');
    });
    eerste.querySelectorAll('.gl-boog-oplossing').forEach(v=>{v.setAttribute('opacity','1');v.classList.remove('gl-boog-oplossing');});
    // Toon bij groepjes maken ook de getekende verdeling.
    if(['delen-aftrekking','delen-rest'].includes(oef.type)) {
      const links=eerste.querySelector('.inzicht-links');
      const aantal=oef.groepen??oef.quotient,grootte=oef.groepGrootte??oef.deler;
      if(links)links.innerHTML=Array.from({length:aantal},()=>`<span class="tafel-voorbeeld-groep">${Array(grootte).fill(esc(oef.emoji)).join(' ')}</span>`).join('')+(oef.rest?`<span>${Array(oef.rest).fill(esc(oef.emoji)).join(' ')}</span>`:'');
    }
    return el;
  }
  function tekenPdf(blok,doc,start,layout) {
    let y=start;const {ML,CW,MT,PH,MB,metAntwoorden,nieuwePagina}=layout;
    const next=()=>{nieuwePagina();y=MT;};
    const tekeningen=blok.oefeningen.map(o=>tekening(o,blok.config));
    if(!tekeningen.length)return y;
    doc.setFont('helvetica','bold');doc.setFontSize(12);
    const kolommen=blok.oefeningen[0]&&isCompact(blok.oefeningen[0])?2:1;
    const kop=blok.opdrachtzin?doc.splitTextToSize(blok.opdrachtzin,CW):[],kopH=kop.length?kop.length*6+5:0;
    if(y+kopH+Math.max(...tekeningen.slice(0,kolommen).map(t=>t.h))>PH-MB)next();
    doc.setFont('helvetica','bold');doc.setFontSize(12);
    doc.setTextColor(26,58,92);if(kop.length)doc.text(kop,ML,y+4);y+=kopH;
    for(let i=0;i<tekeningen.length;i+=kolommen) {
      const rij=tekeningen.slice(i,i+kolommen),rijH=Math.max(...rij.map(t=>t.h));
      if(y+rijH>PH-MB)next();
      rij.forEach(({items,h,w},k)=>{
      const x=ML+k*(w+6),voorbeeld=blok.config.eersteVoorbeeld&&i+k===0,opgelost=metAntwoorden||voorbeeld;
      doc.setDrawColor(...(voorbeeld?[220,156,42]:[185,203,216]));doc.setLineWidth(voorbeeld?.65:.3);
      doc.setFillColor(...(voorbeeld?[255,248,223]:[255,255,255]));doc.roundedRect(x,y,w,rijH,2,2,'FD');
      for(const p of items) {
        if(p.antwoord&&!opgelost||p.leerling&&opgelost)continue;
        doc.setDrawColor(115,149,174);doc.setLineWidth(.3);
        if(p.vorm==='text') {doc.setFont('helvetica',p.antwoord?'bold':'normal');doc.setFontSize(11.34);doc.setTextColor(...(p.antwoord?[22,128,59]:[37,57,76]));doc.text(p.s.replace(/…/g,'...'),x+p.x,y+p.y);}
        else if(p.vorm==='line')doc.line(x+p.x,y+p.y,x+p.x+p.w,y+p.y);
        else if(p.vorm==='dot'){doc.setFillColor(37,57,76);doc.circle(x+p.x,y+p.y,.45,'F');}
        else {if(p.kleur)doc.setFillColor(...p.kleur);doc.roundedRect(x+p.x,y+p.y,p.w,p.h,1.5,1.5,p.kleur?'FD':undefined);}
      }
      });y+=rijH+6;
    }
    return y+4;
  }
  return {namen,opdrachten,verhalen,genereer,tekening,svg,maakBlokElement,markeerVoorbeeld,tekenPdf};
})();
