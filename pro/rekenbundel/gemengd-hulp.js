/* Eigen hulpmiddelen per bewerking, met de bestaande generators en weergave. */
const GemengdHulp = (() => {
  let niveau = 100, brug = 'zonder';
  const opties = [
    ['','Geen extra hulpmiddel'], ['splitsbeen','Splitsbeen'], ['schrijflijnen','Schrijflijnen'],
    ['splitsbeen+schrijflijnen','Splitsbeen en schrijflijnen'],
    ['aanvullen','Aanvullen'], ['compenseren','Compenseren'], ['transformeren','Transformeren'],
    ...Object.entries(Tot20Hulp.soorten).map(([k,v])=>[k,v[0]])
  ];
  const varianten = {
    aanvullen: [['zonder-schema','Zonder schema'],['met-schema','Met schema'],['met-schijfjes','Met schijfjes']],
    compenseren: [['met-tekens','Met + en −'],['zonder-tekens','Zelf tekens invullen'],['zelf-kringen','Zelf kringen en pijl tekenen'],['zonder-hulp','Alleen schrijflijnen']],
    transformeren: [['schema','Met schema'],['pijltjes','Met pijltjes'],['kaal','Zonder schema of pijltjes']]
  };
  function configuratie(op) {
    const kaart=document.getElementById('gem-hulp-'+op);
    const key=kaart?.querySelector('select').value || '';
    const config={hulpmiddelen:key ? key.split('+') : []};
    if (varianten[key]) config[key+'Variant']=kaart.querySelector('.gem-hulp-variant').value;
    config.tienraamStructuur=kaart?.querySelector('.gem-tienraam-structuur select')?.value || 'twee';
    config.metVoorbeeld=!!kaart?.querySelector('.gem-hulp-voorbeeld').checked;
    config.splitspositie=document.querySelector('[name="gem-splitspositie"]:checked')?.value || 'aftrekker';
    config.schrijflijnenAantal=Number(document.querySelector('[name="gem-schrijflijnen-aantal"]:checked')?.value || 2);
    return config;
  }
  function extra() { return Object.fromEntries(['optellen','aftrekken'].map(op=>[op,configuratie(op)])); }
  function toonVoorbeeld(kaart,op) {
    const details=kaart.querySelector('details'); if(!details.open)return;
    const cfg=configuratie(op), types=Generator.getTypes(op,niveau,brug,cfg.hulpmiddelen);
    const blok=Generator.maakBlok({...cfg,bewerking:op,niveau,brug,oefeningstypes:[types.find(t=>t!=='Gemengd')||'Gemengd'],aantalOefeningen:2});
    const host=kaart.querySelector('.hulp-voorbeeld-inhoud');host.replaceChildren();if(!blok)return;
    const vb=Preview.maakHulpmiddelVoorbeeld(blok);host.append(vb);
    requestAnimationFrame(()=>{vb.style.width='360px';vb.style.zoom=Math.min(1,(host.clientWidth-16)/360);Preview.positioneerBlok(vb);});
  }
  function update(n,b) {
    niveau=Number(n);brug=b;
    const hoofd=document.getElementById('kaart-gem-hulpmiddelen');
    if(!hoofd)return;
    const aan=niveau>=20 && brug!=='zonder'; hoofd.style.display=aan?'block':'none';
    let paneel=document.getElementById('gem-hulp-extra');
    if(!paneel){
      paneel=document.createElement('div');paneel.id='gem-hulp-extra';
      paneel.innerHTML='<p style="font-size:12px;margin-bottom:12px">Kies voor plus- en minsommen afzonderlijk een hulpmiddel.</p>';
      for(const op of ['optellen','aftrekken']){
        const kaart=document.createElement('div');kaart.id='gem-hulp-'+op;kaart.className='form-rij';
        kaart.innerHTML=`<label for="gem-hulp-keuze-${op}">${op==='optellen'?'Bij optellen':'Bij aftrekken'}</label><select id="gem-hulp-keuze-${op}"></select><select class="gem-hulp-variant" aria-label="Variant bij ${op}" style="display:none;margin-top:8px"></select><label class="gem-tienraam-structuur" style="display:none;margin-top:8px">Structuur van de tienramen<select><option value="twee">Twee-structuur (per kolom)</option><option value="vijf">Vijf-structuur (eerst de bovenste rij)</option></select></label><label class="hulp-eerste-voorbeeld"><input type="checkbox" class="gem-hulp-voorbeeld"> Eerste ${op==='optellen'?'plussom':'minsom'} uitwerken</label><details class="gem-hulp-detail"><summary>Voorbeeld</summary><div class="hulp-voorbeeld-inhoud"></div></details>`;
        kaart.addEventListener('change',()=>{vulVarianten(kaart);toonVoorbeeld(kaart,op);App.verversGemengdHulp();});
        kaart.querySelector('details').addEventListener('toggle',()=>toonVoorbeeld(kaart,op));paneel.append(kaart);
      }
      hoofd.querySelector('.form-rij').style.display='none';
      hoofd.querySelector('.kaart-titel').after(paneel);
    }
    for(const op of ['optellen','aftrekken']){
      const kaart=document.getElementById('gem-hulp-'+op),select=kaart.querySelector('select'),oud=select.value;
      const beschikbaar=opties.filter(([key])=>{
        if(Tot20Hulp.soorten[key])return niveau===20&&brug==='met'&&(key.startsWith('aftrek-')===(op==='aftrekken'));
        if(key==='aanvullen' && op!=='aftrekken')return false;
        if(['aanvullen','compenseren','transformeren'].includes(key))return niveau>=100;
        return true;
      });
      select.replaceChildren(...beschikbaar.map(([v,t])=>new Option(t,v)));
      select.value=beschikbaar.some(([v])=>v===oud)?oud:'';
      if(!aan)select.value='';
      vulVarianten(kaart);toonVoorbeeld(kaart,op);
    }
    const configs=extra();
    document.getElementById('rij-gem-splitspositie').style.display=configs.aftrekken.hulpmiddelen.includes('splitsbeen')?'block':'none';
    document.getElementById('rij-gem-schrijflijnen-aantal').style.display=Object.values(configs).some(c=>c.hulpmiddelen.includes('schrijflijnen'))?'block':'none';
  }
  function vulVarianten(kaart){
    const key=kaart.querySelector('select').value,select=kaart.querySelector('.gem-hulp-variant');
    if(select.dataset.key!==key){select.replaceChildren(...(varianten[key]||[]).map(([v,t])=>new Option(t,v)));select.dataset.key=key;}
    select.style.display=varianten[key]?'block':'none';
    kaart.querySelector('.gem-tienraam-structuur').style.display=key.includes('tienra')?'block':'none';
    const voorbeeld=kaart.querySelector('.gem-hulp-voorbeeld');
    const kanVoorbeeld=!!Tot20Hulp.soorten[key] || key.includes('schrijflijnen') || ['compenseren','transformeren'].includes(key);
    voorbeeld.closest('label').style.setProperty('display',kanVoorbeeld?'flex':'none','important');
    if(!kanVoorbeeld)voorbeeld.checked=false;
  }
  return {update,extra};
})();
