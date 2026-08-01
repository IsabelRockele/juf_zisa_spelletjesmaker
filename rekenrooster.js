document.addEventListener('DOMContentLoaded',()=>{
  const $=id=>document.getElementById(id), canvas=$('roosterCanvas'),ctx=canvas.getContext('2d');
  const controls=[...document.querySelectorAll('.settings input,.settings select')];
  let puzzles=[],toonOplossingen=false;

  for(let i=1;i<=10;i++){
    const label=document.createElement('label');label.className='tafel-chip';
    label.innerHTML=`<input type="checkbox" value="${i}" ${i>=2?'checked':''}><span>${i}</span>`;
    $('tafelKeuze').appendChild(label);
  }

  const checked=(naam)=>document.querySelector(`input[name="${naam}"]:checked`)?.value;
  const shuffle=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b};
  const uniek=(min,max,n,filter=()=>true)=>{const set=new Set();let tries=0;while(set.size<n&&tries++<4000){const v=Math.floor(Math.random()*(max-min+1))+min;if(filter(v))set.add(v)}return [...set]};
  const rond=(v,d)=>Number(v.toFixed(d));
  const format=(v,d=0)=>d?Number(v).toLocaleString('nl-BE',{minimumFractionDigits:d,maximumFractionDigits:d}):Number(v).toLocaleString('nl-BE');

  function cfg(){
    const op=checked('bewerking')||'+',soort=checked('getalsoort')||'natuurlijk';
    const roosterInstellingen=[...document.querySelectorAll('#brugPerRooster .bridge-grid-choice')].map(vak=>({op:vak.querySelector('[data-role="op"]')?.value,type:vak.querySelector('[data-role="type"]')?.value,bereik:+vak.querySelector('[data-role="bereik"]')?.value,brug:vak.querySelector('[data-role="brug"]')?.value}));
    return {op,soort:['x','mixall'].includes(op)?'natuurlijk':soort,brug:$('brugKeuze').value,brugVerdeling:$('brugVerdeling').value,roosterInstellingen,bereik:+$('numberRange').value,decimalen:+$('decimalen').value,grid:+$('gridSize').value,aantal:+$('aantalTabellen').value,type:$('puzzelType').value,titel:$('werkbladTitel').value.trim()||'Rekenen in een rooster'};
  }

  function updateRoosterInstellingen(c,aantal,actief){
    const vak=$('brugPerRooster'),oud=[...vak.querySelectorAll('.bridge-grid-choice')].map(blok=>({op:blok.querySelector('[data-role="op"]')?.value,type:blok.querySelector('[data-role="type"]')?.value,bereik:blok.querySelector('[data-role="bereik"]')?.value,brug:blok.querySelector('[data-role="brug"]')?.value}));
    const nieuwActief=actief&&vak.dataset.actief!=='ja',reeks=c.op==='mixpm'?['+','-']:c.op==='mixall'?['+','-','x']:[c.op];
    if(oud.length!==aantal||nieuwActief){
      const bereiken=c.soort==='komma'?[10,100,1000]:[10,20,100,1000,10000];
      vak.innerHTML=Array.from({length:aantal},(_,i)=>`<div class="bridge-grid-choice"><span class="bridge-grid-title">Rooster ${i+1}</span><div class="bridge-grid-fields"><div class="bridge-mini-field"><label>Bewerking</label><select data-role="op"><option value="+">Optellen</option><option value="-">Aftrekken</option><option value="x">Vermenigvuldigen</option></select></div><div class="bridge-mini-field"><label>Opdracht</label><select data-role="type"><option value="klassiek">Vul uitkomsten in</option><option value="omgekeerd">Zoek startgetallen</option></select></div><div class="bridge-mini-field"><label>Getalbereik</label><select data-role="bereik">${bereiken.map(v=>`<option value="${v}">Tot ${format(v)}</option>`).join('')}</select></div><div class="bridge-mini-field"><label>Brug</label><select data-role="brug"><option value="beide">Gemengd</option><option value="zonder">Zonder brug</option><option value="met">Met brug</option></select></div></div></div>`).join('');
      [...vak.querySelectorAll('.bridge-grid-choice')].forEach((blok,i)=>{
        const eerder=nieuwActief?null:oud[i];
        blok.querySelector('[data-role="op"]').value=eerder?.op||reeks[i%reeks.length];
        blok.querySelector('[data-role="type"]').value=eerder?.type||c.type;
        blok.querySelector('[data-role="bereik"]').value=eerder?.bereik||String(c.bereik);
        blok.querySelector('[data-role="brug"]').value=eerder?.brug||c.brug;
        blok.querySelectorAll('select').forEach(s=>s.addEventListener('change',genereer));
      });
    }
    vak.dataset.actief=actief?'ja':'nee';
    [...vak.querySelectorAll('.bridge-grid-choice')].forEach(blok=>{
      const isTafel=blok.querySelector('[data-role="op"]').value==='x';
      blok.classList.toggle('is-tafel',isTafel);
      blok.querySelector('.bridge-grid-title').textContent=isTafel?`${blok.querySelector('.bridge-grid-title').textContent.split(' — ')[0]} — gebruikt de gekozen tafels`:blok.querySelector('.bridge-grid-title').textContent.split(' — ')[0];
      blok.querySelector('[data-role="bereik"]').closest('.bridge-mini-field').classList.toggle('hidden',isTafel);
      blok.querySelector('[data-role="brug"]').closest('.bridge-mini-field').classList.toggle('hidden',isTafel);
    });
  }

  function updateUI(){
    const c=cfg(),perRooster=c.brugVerdeling==='perRooster',eigenOps=perRooster?c.roosterInstellingen.map(r=>r.op):[];
    const heeftX=['x','mixall'].includes(c.op)||eigenOps.includes('x'),heeftPlusMin=c.op!=='x'||eigenOps.some(op=>op!=='x'),isKomma=c.soort==='komma';
    const uitleg={
      '+':'Alle roosters op het werkblad bevatten optellingen.',
      '-':'Alle roosters op het werkblad bevatten aftrekkingen.',
      mixpm:'Op één werkblad krijg je minstens één optelrooster en één aftrekrooster.',
      x:'Alle roosters op het werkblad bevatten vermenigvuldigingen.',
      mixall:'Op één werkblad krijg je minstens één optelrooster, één aftrekrooster en één vermenigvuldigrooster.'
    };
    $('operationHint').textContent=uitleg[c.op];
    if(!perRooster&&c.op==='mixpm'&&+$('aantalTabellen').value<2)$('aantalTabellen').value='2';
    if(!perRooster&&c.op==='mixall'&&+$('aantalTabellen').value<3)$('aantalTabellen').value='3';
    const aantal=+$('aantalTabellen').value,toonPerRooster=perRooster&&aantal>1;
    updateRoosterInstellingen(c,aantal,toonPerRooster);
    $('brugPerRooster').classList.toggle('hidden',!toonPerRooster);
    $('gezamenlijkeInstellingen').classList.toggle('hidden',toonPerRooster);
    $('puzzelTypeField').classList.toggle('hidden',toonPerRooster);
    $('bridgeHint').textContent=toonPerRooster?'Stel hieronder de bewerking, het getalbereik en de brug voor elk rooster apart in.':c.brug==='beide'
      ?'Binnen elk optel- of aftrekrooster staan oefeningen zonder én met brug door elkaar.'
      :c.brug==='zonder'?'Geen enkele oefening vraagt een brug.':'Elk rooster bevat oefeningen waarbij een brug nodig is.';
    $('getalsoortTabs').classList.toggle('hidden',heeftX);
    $('tafelsField').classList.toggle('hidden',!heeftX);
    $('brugField').classList.toggle('hidden',!heeftPlusMin||toonPerRooster);
    $('bereikField').classList.toggle('hidden',c.op==='x'||toonPerRooster);
    $('decimalenField').classList.toggle('hidden',!isKomma||heeftX);
    $('bereikField').classList.toggle('full',isKomma&&!heeftX);
    const bereik=$('numberRange'),waarden=isKomma?[10,100,1000]:[10,20,100,1000,10000],huidig=+bereik.value;
    bereik.innerHTML=waarden.map(v=>`<option value="${v}">Tot ${format(v)}</option>`).join('');
    bereik.value=waarden.includes(huidig)?String(huidig):String(isKomma?10:100);
    $('tafelHint').textContent=`Kies minstens ${c.grid-1} tafels. De kolomkoppen zijn vermenigvuldigers van 1 tot 10.`;
  }

  function heeftBrug(a,b,op,decimalen){
    let x=Math.round(a*10**decimalen),y=Math.round(b*10**decimalen),carry=0,borrow=0;
    const cijfers=Math.max(String(x).length,String(y).length)+1;
    for(let i=0;i<cijfers;i++){
      const dx=x%10,dy=y%10;x=Math.floor(x/10);y=Math.floor(y/10);
      if(op==='+'){const som=dx+dy+carry;if(som>=10)return true;carry=som>=10?1:0;}
      else{const tekort=dx-borrow<dy;if(tekort)return true;borrow=tekort?1:0;}
    }
    return false;
  }

  function maakPuzzel(c,gekozenOp,poging=0){
    const n=c.grid-1,op=gekozenOp||c.op,sol=Array.from({length:c.grid},()=>Array(c.grid).fill(null));sol[0][0]=op==='x'?'×':op;
    let cols=[],rows=[];
    if(op==='x'){
      const tafels=[...document.querySelectorAll('#tafelKeuze input:checked')].map(x=>+x.value);
      if(tafels.length<n)return null;
      rows=shuffle(tafels).slice(0,n);cols=shuffle([1,2,3,4,5,6,7,8,9,10]).slice(0,n);
    }else{
      const d=c.soort==='komma'?c.decimalen:0,scale=10**d,max=Math.round(c.bereik*scale);
      if(op==='+'){
        const filter=v=>!d||v%scale!==0,hoog=Math.max(scale,Math.floor(max/2));
        const colInt=uniek(scale,hoog,n,filter),rowInt=uniek(scale,hoog,n,filter);
        if(colInt.length<n||rowInt.length<n)return null;cols=colInt.map(v=>v/scale);rows=rowInt.map(v=>v/scale);
      }else{
        const colInt=uniek(scale,Math.max(scale,max-Math.max(n,scale)),n,v=>!d||v%scale!==0);
        if(colInt.length<n)return null;const minRow=Math.max(...colInt)+1;
        const rowInt=uniek(minRow,max,n,v=>!d||v%scale!==0);
        if(rowInt.length<n)return null;cols=colInt.map(v=>v/scale);rows=rowInt.map(v=>v/scale);
      }
    }
    cols.forEach((v,i)=>sol[0][i+1]=v);rows.forEach((v,i)=>sol[i+1][0]=v);
    for(let r=1;r<c.grid;r++)for(let col=1;col<c.grid;col++){
      const a=sol[r][0],b=sol[0][col];
      sol[r][col]=op==='+'?rond(a+b,c.soort==='komma'?c.decimalen:0):op==='-'?rond(a-b,c.soort==='komma'?c.decimalen:0):a*b;
    }
    if(op!=='x'){
      const d=c.soort==='komma'?c.decimalen:0;
      const bruggen=[];for(let r=1;r<c.grid;r++)for(let col=1;col<c.grid;col++)bruggen.push(heeftBrug(sol[r][0],sol[0][col],op,d));
      const geldig=c.brug==='zonder'?!bruggen.some(Boolean)
        :c.brug==='met'?bruggen.some(Boolean)
        :bruggen.some(Boolean)&&bruggen.some(v=>!v);
      if(!geldig){if(poging<800)return maakPuzzel(c,gekozenOp,poging+1);return null;}
    }
    const display=sol.map(row=>[...row]);
    if(c.type==='klassiek'){
      // De startgetallen zijn gegeven; alle witte resultaatvakken zijn oefeningen.
      for(let r=1;r<c.grid;r++)for(let col=1;col<c.grid;col++)display[r][col]='';
    }else{
      // Laat minstens de helft van de startgetallen zien. Voor elk ontbrekend
      // startgetal komt er precies één verspreid resultaat als noodzakelijke hint.
      for(let r=1;r<c.grid;r++)for(let col=1;col<c.grid;col++)display[r][col]='';
      const headers=[];
      for(let i=1;i<c.grid;i++){headers.push({type:'row',index:i});headers.push({type:'col',index:i});}
      const rows=shuffle(headers.filter(h=>h.type==='row'));
      const cols=shuffle(headers.filter(h=>h.type==='col'));
      const zichtbaarAantal=Math.max(3,Math.ceil(headers.length/2));
      const zichtbaar=[rows.pop(),cols.pop()];
      while(zichtbaar.length<zichtbaarAantal){
        const bron=rows.length&&cols.length?(zichtbaar.length%2?rows:cols):(rows.length?rows:cols);
        zichtbaar.push(bron.pop());
      }
      const sleutel=h=>`${h.type}-${h.index}`,bekend=new Set(zichtbaar.map(sleutel)),initieelBekend=new Set(bekend);
      headers.forEach(h=>{if(!bekend.has(sleutel(h)))display[h.type==='row'?h.index:0][h.type==='col'?h.index:0]='';});
      const onbekend=shuffle(headers.filter(h=>!bekend.has(sleutel(h))));
      const gebruikteParen=new Set();
      onbekend.forEach(h=>{
        const tegenType=h.type==='row'?'col':'row';
        // Koppel uitsluitend aan een startgetal dat al zichtbaar was. Zo blijven
        // de hulpvakjes verspreid en ontstaat nooit opnieuw een volle hulprij/-kolom.
        const kandidaten=shuffle(headers.filter(k=>k.type===tegenType&&initieelBekend.has(sleutel(k))));
        const k=kandidaten.find(x=>!gebruikteParen.has(`${h.type==='row'?h.index:x.index}-${h.type==='col'?h.index:x.index}`))||kandidaten[0];
        const r=h.type==='row'?h.index:k.index,col=h.type==='col'?h.index:k.index;
        display[r][col]=sol[r][col];gebruikteParen.add(`${r}-${col}`);bekend.add(sleutel(h));
      });
    }
    return {solution:sol,display,op,type:c.type};
  }

  function genereer(){
    updateUI();const c=cfg();puzzles=[];
    const reeks=c.op==='mixpm'?['+','-']:c.op==='mixall'?['+','-','x']:[c.op];
    const volgorde=Array.from({length:c.aantal},(_,i)=>reeks[i%reeks.length]);
    for(let i=0;i<c.aantal;i++){
      const eigen=c.brugVerdeling==='perRooster'?c.roosterInstellingen[i]:null;
      const op=eigen?.op||volgorde[i],brug=eigen?.brug||c.brug,bereik=eigen?.bereik||c.bereik,type=eigen?.type||c.type;
      const p=maakPuzzel({...c,brug,bereik,type,soort:op==='x'?'natuurlijk':c.soort},op);if(p)puzzles.push(p)
    }
    toonOplossingen=false;$('oplossingBtn').textContent='👁 Toon oplossingen';teken();
  }

  function roundRect(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.stroke()}}

  function teken(){
    const c=cfg(),W=canvas.width,H=canvas.height;ctx.clearRect(0,0,W,H);ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#173f66';ctx.font='700 27px Arial';ctx.textAlign='left';ctx.fillText('Naam:',60,72);ctx.strokeStyle='#40566b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(145,76);ctx.lineTo(500,76);ctx.stroke();
    ctx.fillText('Datum:',760,72);ctx.beginPath();ctx.moveTo(860,76);ctx.lineTo(1175,76);ctx.stroke();
    ctx.textAlign='center';ctx.fillStyle='#0f4f86';ctx.font='800 42px Arial';ctx.fillText(c.titel,W/2,145);
    ctx.strokeStyle='#2877b8';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(60,170);ctx.lineTo(W-60,170);ctx.stroke();
    roundRect(60,195,W-120,62,12,'#edf5ff','#8ebbe0');ctx.fillStyle='#174a73';ctx.font='italic 700 23px Arial';ctx.textAlign='left';
    ctx.fillText('Vul de ontbrekende getallen in.',82,235);
    if(!puzzles.length){ctx.textAlign='center';ctx.font='24px Arial';ctx.fillStyle='#8a3c2d';ctx.fillText('Kies voldoende tafels of pas de instellingen aan.',W/2,500);return}
    const layout=puzzles.length===1?{cols:1,rows:1}:puzzles.length===2?{cols:2,rows:1}:{cols:2,rows:2};
    const left=70,top=300,gapX=55,gapY=70,availW=W-left*2-gapX*(layout.cols-1),availH=H-top-85-gapY*(layout.rows-1);
    const boxW=availW/layout.cols,boxH=availH/layout.rows;
    puzzles.forEach((p,idx)=>{
      const bx=left+(idx%layout.cols)*(boxW+gapX),by=top+Math.floor(idx/layout.cols)*(boxH+gapY);
      const roosterOpdracht=p.type==='omgekeerd'?'Zoek startgetallen':'Vul uitkomsten in';
      ctx.fillStyle='#55718b';ctx.font='700 19px Arial';ctx.textAlign='left';ctx.fillText(`Rooster ${idx+1} · ${roosterOpdracht}`,bx,by-13);
      const size=Math.min(boxW,boxH),cell=size/c.grid,gx=bx+(boxW-size)/2,gy=by;
      const data=toonOplossingen?p.solution:p.display;
      for(let r=0;r<c.grid;r++)for(let col=0;col<c.grid;col++){
        const x=gx+col*cell,y=gy+r*cell,isHead=r===0||col===0,isMissing=p.display[r][col]==='';
        ctx.fillStyle=isHead?'#e6f2fb':toonOplossingen&&isMissing?'#e9f8ee':'#fff';ctx.fillRect(x,y,cell,cell);
        ctx.strokeStyle=isHead?'#4389bd':'#7890a5';ctx.lineWidth=isHead?2.4:1.5;ctx.strokeRect(x,y,cell,cell);
        const val=data[r][col];if(val!==null&&val!==''){
          ctx.fillStyle=toonOplossingen&&isMissing?'#16834f':isHead?'#0c568e':'#172b3c';
          const txt=(r===0&&col===0)?val:format(val,c.soort==='komma'&&p.op!=='x'?c.decimalen:0);
          let fs=Math.min(cell*.37,28);if(txt.length>6)fs=Math.min(fs,cell*.25);ctx.font=`${isHead?'800':'700'} ${fs}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(txt,x+cell/2,y+cell/2);
        }
      }
    });
    ctx.fillStyle='#8b99a5';ctx.font='15px Arial';ctx.textAlign='left';ctx.fillText('Juf Zisa • Werkbladgenerator',60,H-34);
  }

  function toggleOplossing(){toonOplossingen=!toonOplossingen;$('oplossingBtn').textContent=toonOplossingen?'🙈 Verberg oplossingen':'👁 Toon oplossingen';teken()}
  function downloadPng(){const a=document.createElement('a');a.download='rekenrooster-werkblad.png';a.href=canvas.toDataURL('image/png');a.click()}
  function downloadPdf(metOplossingen=false){
    if(!window.jspdf){alert('De PDF-module is nog niet geladen. Probeer opnieuw.');return}
    const vorigeWeergave=toonOplossingen;
    if(metOplossingen&&!toonOplossingen){toonOplossingen=true;teken()}
    const{jsPDF}=window.jspdf,doc=new jsPDF('p','mm','a4');
    doc.addImage(canvas.toDataURL('image/png'),'PNG',5,5,200,287);
    doc.save(metOplossingen?'rekenrooster-oplossingen.pdf':'rekenrooster-werkblad.pdf');
    if(toonOplossingen!==vorigeWeergave){toonOplossingen=vorigeWeergave;teken()}
  }

  $('genereerBtn').onclick=genereer;$('regenBtn').onclick=genereer;$('oplossingBtn').onclick=toggleOplossing;$('downloadPngBtn').onclick=downloadPng;$('downloadPdfBtn').onclick=()=>downloadPdf(false);$('downloadSolutionPdfBtn').onclick=()=>downloadPdf(true);
  controls.forEach(el=>el.addEventListener('change',()=>{updateUI();genereer()}));
  $('werkbladTitel').addEventListener('input',teken);
  (document.fonts?.ready||Promise.resolve()).then(()=>{updateUI();genereer()});
});
