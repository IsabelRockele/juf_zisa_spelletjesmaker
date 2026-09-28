(() => {
  'use strict';
  const $=id=>document.getElementById(id), ns='http://www.w3.org/2000/svg';
  const el=(tag,attrs={},text)=>{const n=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));if(text)n.textContent=text;return n;};
  const exercises=[
    {kind:0,shape:'circle',n:3,q:'Kleur het geheel.'},
    {kind:0,shape:'strip',n:6,q:'Kleur het geheel.'},
    {kind:1,shape:'square',n:1,q:'Verdeel het vierkant in twee gelijke delen.'},
    {kind:1,shape:'square',n:1,q:'Verdeel het vierkant op een andere manier in twee gelijke delen.',diagonal:true},
    {kind:2,shape:'circle',n:5,q:'In hoeveel gelijke delen is het geheel verdeeld?'},
    {kind:2,shape:'groups',n:4,q:'In hoeveel gelijke delen zijn de blokjes verdeeld?'},
    {kind:3,shape:'strip',n:6,target:1,q:'Kleur één van de gelijke delen.'},
    {kind:3,shape:'circle',n:8,target:3,q:'Kleur 3 gelijke delen.'},
    {kind:3,shape:'grid',n:6,target:2,q:'Kleur 2 gelijke delen.'},
    {kind:4,q:'Wat gebeurt er met één deel als we hetzelfde geheel in meer gelijke delen verdelen?'}
  ];
  const mixedOrder=[0,2,4,6,9,1,3,5,7,8];
  let filter='mixed',order=[...mixedOrder],position=0;
  let index=0,colored=new Set(),lines=[],revealed=false,choice=null,active=null;
  const svg=$('figure-board');
  function part(tag,attrs,i){const p=el(tag,{...attrs,fill:colored.has(i)?'#65b4cf':'#fff',stroke:'#425f68','stroke-width':3,role:'button',tabindex:0,'aria-label':`Kleur deel ${i+1}`,'aria-pressed':String(colored.has(i))});const toggle=()=>{if(exercises[index].kind===1)return;colored.has(i)?colored.delete(i):colored.add(i);revealed=false;render();};p.onclick=toggle;p.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}};svg.append(p);}
  function render(){const e=exercises[index];svg.replaceChildren();$('figure-question').textContent=e.q;$('figure-progress').textContent=`Oefening ${position+1} van ${order.length}`;$('figure-kind').value=filter;$('figure-prev').disabled=position===0;$('figure-next').disabled=position===order.length-1;
    $('figure-hint').textContent=e.kind===1?'Trek met je vinger, bordpen of muis een rechte verdeellijn.':e.kind===0||e.kind===3?'Tik op een deel om het te kleuren. Tik opnieuw om de kleur weg te doen.':e.kind===2?'Tel de gelijke delen. Kies daarna samen een antwoord.':'De drie stroken zijn even groot. Vergelijk de gekleurde delen.';
    if(e.shape==='circle'){for(let i=0;i<e.n;i++){const a=i*2*Math.PI/e.n-Math.PI/2,b=(i+1)*2*Math.PI/e.n-Math.PI/2;part('path',{d:`M500 220L${500+170*Math.cos(a)} ${220+170*Math.sin(a)}A170 170 0 0 1 ${500+170*Math.cos(b)} ${220+170*Math.sin(b)}Z`},i);}}
    if(e.shape==='strip'||e.shape==='grid'){const cols=e.shape==='grid'?3:e.n,rows=e.shape==='grid'?2:1;for(let i=0;i<e.n;i++)part('rect',{x:180+(i%cols)*640/cols,y:100+Math.floor(i/cols)*240/rows,width:640/cols,height:240/rows},i);}
    if(e.shape==='square'){for(let x=320;x<=680;x+=45)svg.append(el('path',{d:`M${x} 40V400M320 ${x-280}H680`,stroke:'#d4e1e3','stroke-dasharray':'4 5'}));svg.append(el('rect',{x:320,y:40,width:360,height:360,fill:'transparent',stroke:'#425f68','stroke-width':4}));for(const l of lines)svg.append(el('line',{x1:l[0],y1:l[1],x2:l[2],y2:l[3],stroke:'#227da5','stroke-width':5}));if(revealed)svg.append(el('path',{d:e.diagonal?'M320 40L680 400':'M500 40V400',stroke:'#c65331','stroke-width':5,'stroke-dasharray':'12 8',fill:'none'}));}
    if(e.shape==='groups'){for(let i=0;i<4;i++){svg.append(el('rect',{x:110+i*200,y:90,width:175,height:260,rx:25,fill:'#fff',stroke:'#7da1ac','stroke-width':3}));for(let j=0;j<3;j++)svg.append(el('rect',{x:164+i*200,y:115+j*78,width:65,height:60,rx:8,fill:'#67aec8',stroke:'#296c88','stroke-width':3}));}}
    if(e.kind===4){[2,4,8].forEach((n,row)=>{for(let i=0;i<n;i++)svg.append(el('rect',{x:210+i*600/n,y:45+row*135,width:600/n,height:85,fill:i===0?'#65b4cf':'#fff',stroke:'#425f68','stroke-width':3}));svg.append(el('text',{x:180,y:97+row*135,'text-anchor':'end','font-size':26,fill:'#213e49'},String(n)));});}
    $('figure-choices').replaceChildren();if(e.kind===2||e.kind===4){const answers=e.kind===4?['kleiner','groter']:[e.n-1,e.n,e.n+1];answers.forEach(a=>{const b=document.createElement('button');b.textContent=e.kind===2?`${a} gelijke delen`:a;b.setAttribute('aria-pressed',String(choice===a));if(revealed&&a===(e.kind===2?e.n:'kleiner'))b.className='figure-correct';b.onclick=()=>{choice=a;revealed=false;render();};$('figure-choices').append(b);});}
    $('figure-undo').hidden=e.kind!==1;$('figure-undo').disabled=!lines.length;$('figure-answer').textContent=revealed?'Verberg antwoord':'Toon antwoord';
    let answer='';if(revealed){if(e.kind===0)answer=colored.size===e.n?'Ja, het hele geheel is gekleurd.':'Het geheel is de volledige figuur: kleur alle delen.';if(e.kind===1)answer='De stippellijn toont één mogelijkheid. Zijn de twee delen precies even groot?';if(e.kind===2)answer=`Er zijn ${e.n} gelijke delen.${e.shape==='groups'?' In elk deel zitten 3 blokjes.':''}`;if(e.kind===3)answer=colored.size===e.target?`Goed: ${e.target===1?'één deel is':e.target+' delen zijn'} gekleurd. Elk ander gelijk deel mag ook.`:`Er zijn ${colored.size} delen gekleurd. De opdracht vraagt ${e.target}.`;if(e.kind===4)answer='Hoe meer gelijke delen, hoe kleiner elk deel wordt. Het geheel blijft even groot.';}$('figure-result').textContent=answer;
  }
  function reset(){colored=new Set();lines=[];choice=null;revealed=false;active=null;render();}
  $('figure-prev').onclick=()=>{if(position>0){index=order[--position];reset();}};$('figure-next').onclick=()=>{if(position<order.length-1){index=order[++position];reset();}};$('figure-kind').onchange=()=>{filter=$('figure-kind').value;order=filter==='mixed'?[...mixedOrder]:exercises.map((e,i)=>e.kind===Number(filter)?i:-1).filter(i=>i>=0);position=0;index=order[0];reset();};$('figure-reset').onclick=reset;$('figure-undo').onclick=()=>{lines.pop();revealed=false;render();};$('figure-answer').onclick=()=>{revealed=!revealed;render();};
  function point(e){const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(svg.getScreenCTM().inverse());return [Math.max(320,Math.min(680,q.x)),Math.max(40,Math.min(400,q.y))];}
  svg.addEventListener('pointerdown',e=>{if(exercises[index].kind!==1||e.button!==0)return;e.preventDefault();active=point(e);lines.push([...active,...active]);svg.setPointerCapture(e.pointerId);revealed=false;render();});svg.addEventListener('pointermove',e=>{if(!active)return;lines[lines.length-1]=[...active,...point(e)];render();});function stop(){active=null;}svg.addEventListener('pointerup',stop);svg.addEventListener('pointercancel',stop);render();
})();
