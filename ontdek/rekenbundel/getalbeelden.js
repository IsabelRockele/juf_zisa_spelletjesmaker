/* Getalbeelden tot 10: dezelfde tekenlogica voor voorbeeld en PDF. */
const Getalbeelden = (() => {
  let bewerking = 'optellen';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function positie(i, structuur) {
    return structuur === '2' ? [Math.floor(i / 2), i % 2] : [i % 5, Math.floor(i / 5)];
  }
  function maakBlok(config, soort, aantal) {
    const pool = [];
    for (let totaal = config.modus === 'rond' ? config.max : 2; totaal <= config.max; totaal++) {
      for (let a = 1; a < totaal; a++) pool.push({a, b:totaal-a, totaal});
    }
    const oefeningen = [];
    while (oefeningen.length < aantal) {
      const ronde = pool.slice();
      for (let i=ronde.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [ronde[i],ronde[j]]=[ronde[j],ronde[i]]; }
      oefeningen.push(...ronde.slice(0,aantal-oefeningen.length));
    }
    return {id:`getalbeeld-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,bewerking:soort,niveau:config.max,brug:'zonder',hulpmiddelen:[],config:{...config,getalbeelden:true},
      opdrachtzin:soort==='rekenrelaties'?'Schrijf de vier bewerkingen bij het getalbeeld.':soort==='aftrekken'?'Schrijf de aftrekking.':'Schrijf de optelling.',oefeningen};
  }
  function regels(o, soort) {
    const {a,b,totaal:t}=o;
    return soort==='rekenrelaties'?[[a,'+',b,t],[b,'+',a,t],[t,'−',a,b],[t,'−',b,a]]:soort==='aftrekken'?[[t,'−',b,a]]:[[a,'+',b,t]];
  }
  function svg(blok,o,oplossing=false) {
    const c=blok.config, ei=c.beeld==='eierdoos', min=blok.bewerking==='aftrekken', h=blok.bewerking==='rekenrelaties'?390:235;
    let s=`<svg xmlns="http://www.w3.org/2000/svg" width="360" height="${h}" viewBox="0 0 360 ${h}" role="img" aria-label="${ei?'Eierdoos':'Tienveld'} met ${c.structuur}-structuur"><rect width="360" height="${h}" fill="white"/>`;
    if(ei) s+='<path d="M58 64 L49 21 Q49 15 56 15 H282 Q289 15 289 21 L280 64 Z" fill="#f6e8b9" stroke="#cbb989"/><path d="M64 54 L59 25 H279 L273 54Z" fill="#fff8dc"/><rect x="49" y="65" width="242" height="74" rx="12" fill="#f6e8b9"/>';
    for(let i=0;i<10;i++){
      const [col,row]=positie(i,c.structuur),x=70+col*44,y=81+row*34,filled=i<o.totaal,second=i>=o.a;
      if(!ei)s+=`<rect x="${x-21}" y="${y-17}" width="44" height="34" fill="white" stroke="#777"/>`;
      if(ei)s+=`<ellipse cx="${x}" cy="${y+5}" rx="15" ry="10" fill="#d5c6a5"/>`;
      if(filled){
        const kleur=ei?(second&&!min?'#dc9452':'#fffdf5'):(second&&!min?'#c63127':'#075775');
        s+=ei?`<path d="M${x-13} ${y+7} C${x-16} ${y-4} ${x-7} ${y-16} ${x} ${y-16} C${x+7} ${y-16} ${x+16} ${y-4} ${x+13} ${y+7} Q${x} ${y+15} ${x-13} ${y+7}Z" fill="${kleur}" stroke="#a9916f"/>`:`<circle cx="${x}" cy="${y}" r="12" fill="${kleur}"/>`;
        if(min&&second)s+=`<ellipse cx="${x}" cy="${y}" rx="18" ry="16" fill="none" stroke="#c63127" stroke-width="2"/><path d="M${x+13} ${y-11} l10 -13 m-6 1 l6 -1 l-1 6" fill="none" stroke="#c63127" stroke-width="1.5"/>`;
      }
    }
    regels(o,blok.bewerking).forEach((r,i)=>{
      const y=205+i*54, tekst=oplossing?`${r[0]} ${r[1]} ${r[2]} = ${r[3]}`:blok.bewerking!=='rekenrelaties'&&c.invullen==='begonnen'?`${r[0]} ${r[1]} ____ = ____`:'';
      s+=`<line x1="36" y1="${y+7}" x2="324" y2="${y+7}" stroke="#b2b9bf"/><text x="42" y="${y}" font-family="Arial,sans-serif" font-size="21" fill="${oplossing?'#0072aa':'#222'}">${tekst}</text>`;
    });
    return s+'</svg>';
  }

  function bediening(el,blok){
    const zin=el.querySelector('.opdrachtzin-wrapper');zin.id='zin-wrapper-'+blok.id;
    zin.innerHTML='<span class="opdrachtzin-tekst"></span><button class="btn-bewerk-zin" title="Bewerk opdrachtzin">✏️</button>';
    zin.querySelector('span').textContent=blok.opdrachtzin;zin.querySelector('button').onclick=()=>App.bewerkZin(blok.id);
    el.querySelectorAll('.gb-grid > div,.verhaal-grid > div').forEach((card,i)=>{card.classList.add('oefening-item');card.style.cssText='position:relative;display:block;min-width:0';const del=document.createElement('button');del.className='btn-del-oef';del.style.cssText='position:absolute;right:6px;top:6px';del.title='Verwijder oefening';del.textContent='×';del.onclick=()=>App.verwijderOefening(blok.id,i);card.append(del);});
    const footer=document.createElement('div');footer.className='preview-blok-footer';footer.innerHTML='<span class="footer-info"></span><button class="btn-add-oef">+ Oefening</button>';footer.querySelector('span').textContent=blok.oefeningen.length+' oefeningen';const add=footer.querySelector('button');add.onclick=()=>App.voegOefeningToe(blok.id);if(blok.config.rekenverhalen&&blok.oefeningen.length>=6){add.disabled=true;add.title='Maximaal 6 verhaalprenten per blok';}el.append(footer);return el;
  }
  function render(blok,solutions) {
    const kolommen=blok.niveau<=10&&blok.bewerking!=='rekenrelaties'?3:2;
    const el=document.createElement('div');el.className='preview-blok';el.dataset.id=blok.id;
    el.innerHTML=`<div class="preview-blok-header"><span class="blok-type-badge">Getalbeelden · ${blok.bewerking}</span><span class="blok-niveau">${blok.config.modus==='rond'?'Rond':'Tot'} ${blok.niveau} · ${blok.config.structuur}-structuur</span><div class="spacer"></div><button class="btn-blok-actie verwijder" title="Verwijder blok">✕</button></div><div class="preview-blok-body"><div class="opdrachtzin-wrapper">${esc(blok.opdrachtzin)}</div><div class="gb-grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px"></div></div>`;
    el.querySelector('.gb-grid').style.gridTemplateColumns=`repeat(${kolommen},minmax(0,1fr))`;
    el.querySelector('button').onclick=()=>App.verwijderBlok(blok.id);
    blok.oefeningen.forEach((o,i)=>{const card=document.createElement('div');card.className='oefening-item';card.style.position='relative';card.innerHTML=svg(blok,o,solutions||(blok.config.voorbeeld&&i===0));card.querySelector('svg').style.cssText='width:100%;height:auto';el.querySelector('.gb-grid').append(card);});return bediening(el,blok);
  }
  function instellingen(panel) {
    const v=n=>panel.querySelector(`[data-gb="${n}"]`).value;
    return {max:+v('max'),modus:v('modus'),beeld:v('beeld'),structuur:v('structuur'),invullen:panel.id==='gb-relaties'?'zelf':v('invullen'),voorbeeld:panel.querySelector('[data-gb="voorbeeld"]').checked};
  }
  function kaart(id,relaties){
    const el=document.createElement('details');el.className='config-kaart';el.id=id;
    const select=(naam,label,options)=>`<div class="form-rij"><label>${label}<select data-gb="${naam}">${options.map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select></label></div>`;
    el.innerHTML=`<summary style="cursor:pointer;font-weight:700">${relaties?'Vier bewerkingen bij één getalbeeld':'Rekenen met getalbeelden'}</summary>`+
      (relaties?select('max','Getalgebied', [5,6,7,8,9,10].map(n=>[n,`Tot ${n}`])):'<input type="hidden" data-gb="max" value="5">')+
      select('modus','Oefenen', [['tot','Alles tot dit getal'],['rond','Rond één getal']])+
      select('beeld','Voorstelling',[['tienveld','Tienveld met stippen'],['eierdoos','Eierdoos']])+
      select('structuur','Structuur',[['5','5-structuur: eerst een rij van vijf'],['2','2-structuur: per kolom van twee']])+
      (relaties?'':select('invullen','Bewerking schrijven',[['zelf','Volledig zelf schrijven'],['begonnen','Begonnen bewerking aanvullen']]))+
      select('aantal','Aantal oefeningen',[4,6,8,10,12].map(n=>[n,n]))+
      '<label><input type="checkbox" data-gb="voorbeeld"> Eerste oefening als ingevuld voorbeeld</label><div data-gb="preview"></div><button type="button" class="btn-toevoegen">Voeg getalbeelden toe aan bundel</button>';
    const refresh=()=>{const b=maakBlok(instellingen(el),relaties?'rekenrelaties':bewerking,1);el.querySelector('[data-gb="preview"]').innerHTML=svg(b,{a:2,b:b.niveau-2,totaal:b.niveau},b.config.voorbeeld);el.querySelector('svg').style.cssText='width:100%;max-width:360px;height:auto';};
    el.addEventListener('change',refresh);el.querySelector('button').onclick=()=>App.voegGetalbeeldenBlokToe(maakBlok(instellingen(el),relaties?'rekenrelaties':bewerking,+el.querySelector('[data-gb="aantal"]').value));el.refresh=refresh;refresh();return el;
  }
  function kies(soort){bewerking=soort;syncBereik();}
  function syncBereik(){const el=document.getElementById('gb-hoofd');if(!el)return;const n=+document.querySelector('[name="niveau"]:checked')?.value;const ok=[5,6,7,8,9,10].includes(n)&&['optellen','aftrekken'].includes(bewerking);el.style.display=ok?'':'none';if(ok){el.querySelector('[data-gb="max"]').value=n;el.querySelector('summary').textContent=(bewerking==='optellen'?'Optellen':'Aftrekken')+' met getalbeelden · tot '+n;el.refresh();}}
  document.addEventListener('change',e=>{if(e.target.name==='niveau')syncBereik();});
  document.addEventListener('DOMContentLoaded',()=>{document.getElementById('cg-types').closest('.config-kaart').after(kaart('gb-hoofd',false));document.querySelector('#tab-rekenrelaties .sectie-header').after(kaart('gb-relaties',true));kies(bewerking);});
  return {positie,maakBlok,regels,svg,render,kies};
})();
