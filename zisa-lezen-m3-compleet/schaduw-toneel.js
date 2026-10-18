(()=>{
let active=0;
window.ZisaShadowShow={stop(){active++;},async play(screen,mission,done){
 const token=++active,wait=ms=>new Promise(r=>setTimeout(r,ms)),alive=()=>token===active&&screen.isConnected;
 screen.querySelector('.performance')?.remove();screen.classList.add('performing');
 const layer=document.createElement('div');layer.className='performance';screen.append(layer);
 const caption=document.createElement('p');caption.className='stage-caption';caption.setAttribute('role','status');layer.append(caption);
 const actors={};mission.chars.forEach((name,i)=>{const a=document.createElement('div');a.className='performer '+name;a.style.width=i===mission.small?'21%':'30%';a.style.left=(mission.pos[i]*33.333+16.667)+'%';a.style.bottom='4%';a.innerHTML=`<img draggable="false" src="images/leesspel-m6/${name}.png" alt="${name}">`;layer.append(a);actors[name]=a;});
 const n=actors.nar,k=actors.kat,d=actors.draak;
 const say=t=>caption.textContent=t;
 const pose=(a,name)=>{a.querySelector('img').src='images/leesspel-m6/'+name+'.png';};
 const face=(a,x)=>{const left=parseFloat(a.style.left),normalLeft=a.classList.contains('draak');a.querySelector('img').style.scale=(normalLeft?(x<left?1:-1):(x>left?1:-1))+' 1';};
 const move=async(a,x,ms=1400)=>{face(a,x);const start=parseFloat(a.style.left);a.animate([{left:start+'%'},{left:x+'%'}],{duration:ms,easing:'ease-in-out'});a.style.left=x+'%';await wait(ms);};
 const hideCat=async()=>{const nx=parseFloat(n.style.left),dx=parseFloat(d.style.left);k.style.zIndex='1';n.style.zIndex='3';pose(k,'kat-duikt');await move(k,nx+(dx>nx?-4:4),1100);};
 const approach=async()=>{const nx=parseFloat(n.style.left),dx=parseFloat(d.style.left);await move(d,nx+(dx>nx?25:-25),1400);face(n,parseFloat(d.style.left));};
 const pet=async()=>{const dx=parseFloat(d.style.left),nx=parseFloat(n.style.left),side=nx<dx?-1:1;await move(n,dx+side*19,1300);if(!alive())return;face(n,dx);face(d,parseFloat(n.style.left));pose(n,'nar-aai');pose(d,'draak-buigt');await wait(1500);};
 if(mission.act===0){
  say('De nar en de kat zijn weer veilig bij het toneel.');
  await move(n,45,1400);if(!alive())return;await move(k,29,1400);if(!alive())return;
  say('De kat nestelt zich naast de nar. De draak wacht op zijn beurt.');pose(k,'kat-duikt');face(d,45);await wait(2200);
 }else if(mission.act===1){
  say('De voorstelling begint. Daar komt de draak!');await approach();if(!alive())return;
  say('De kat schrikt en duikt achter de nar.');await hideCat();if(!alive())return;
  say('De kat blijft dicht achter de nar.');await wait(2200);
 }else if(mission.act===2){
  say('De kat blijft achter de nar zitten.');await hideCat();if(!alive())return;
  say('Maar de nar jaagt de draak niet weg. Hij stapt naar hem toe.');await pet();if(!alive())return;
  say('Hij geeft de draak voorzichtig een aai.');await wait(2200);
 }else if(mission.act===3){
  say('De draak buigt vriendelijk zijn kop.');face(d,parseFloat(n.style.left));pose(d,'draak-buigt');await wait(1600);if(!alive())return;
  say('De nar blijft bij hem. De kat durft weer te kijken.');await move(n,parseFloat(d.style.left)<50?54:46,1000);if(!alive())return;await move(k,parseFloat(n.style.left)<50?25:75,1300);if(!alive())return;
  face(k,parseFloat(d.style.left));say('Zo gaat het verhaal verder, met een onverwachte vriend.');await wait(2200);
 }else{
  say('Het verhaal is uit. Alle drie staan ze nog één keer op het doek.');
  await Promise.all([move(n,50,1400),move(k,23,1400),move(d,77,1400)]);if(!alive())return;
  pose(n,'nar-zwaait');pose(d,'draak-buigt');pose(k,'kat-duikt');say('De nar zwaait. Dan valt het doek.');await wait(1800);if(!alive())return;
  for(const side of ['left','right']){const c=document.createElement('div');c.className='closing-curtain '+side;layer.append(c);}await wait(1500);
 }
 if(!alive())return;done();
}};
})();
