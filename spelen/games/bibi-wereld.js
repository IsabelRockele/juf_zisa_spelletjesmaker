/* Bibi's four destinations. New games can be added to each destination. */
(() => {
 const asset='leerjaar1_afbeeldingen/',speaker='spellingeiland/assets/luidspreker.png';
 const zones=[
  {id:'splitsen',name:'Splitsen',title:'De splitskorf',speech:'Hier oefen je splitsingen. Kies de bijenkorf, bingo, de honingpot of de splitsmachine.',box:[4,5,39,37],mobile:[3,1],games:[
   ['De bijenkorf','splitsen_bibi.html',asset+'splitsspel.png','Breng het juiste bijtje naar de korf.'],
   ['Bingo','splits_bingo.html',asset+'bingo.png','Zoek het juiste getal op je bingokaart.'],
   ['De honingpot','honingpot.html',asset+'honingpotspel.png','Vang de honingpot met het juiste getal.'],
   ['De splitsmachine','splitsmachine/index.html?leerjaar=1','splitsmachine/bibi-splitsmachine.png','Vul het getal in. Trek dan aan de hendel.']]},
  {id:'rekenen',name:'Rekenen',title:'Het rekenhuis',speech:'Hier oefen je plus en min tot twintig. Je kunt ook met de wolkentrein rijden of winkelen bij Bibi.',box:[57,5,39,37],mobile:[54,1],games:[
   ['Plus en min','#sommen',asset+'bibi_bloemenweide.png','Kies de bloemenweide, de honingpot of de bijenrace.'],
   ['De wolkentrein','../../wolkentrein/?leerjaar=1','train','Reis met Bo en de Wolkentrein. Oefen plus en min tot twintig.'],
   ['Bibi’s winkeltje','bibi-winkel.html',asset+'bibi_honingpot.png','Kom winkelen! Betaal met euro’s. Je kiest tot tien of tot twintig euro.'],
   ['Bibi’s rekenbrug · tot 20','rekenbrug-proef/index.html?leerjaar=1','rekenbrug-proef/brug.svg','Oefen met Bibi plus en min tot twintig. Herken de brug en leer de stappen.']]},
  {id:'puzzelen',name:'Puzzelen',title:'De puzzelweide',speech:'Hier kun je puzzelen. Leg de stukken op hun plek.',box:[4,48,39,38],mobile:[3,48],games:[
   ['Puzzelstukken','../../pentomino_studio_volledige_tool.html?play=1&leerjaar=1','../../drukknop_afbeeldingen/pentomino-studio.png','Kies een figuur en leg de puzzelstukken op hun plek.']]},
  {id:'spelling',name:'Spelling',title:'Het letterhuis',speech:'Hier komt het letterhuis. Er wordt nog aan gebouwd. Kies nu een ander plekje.',box:[57,48,39,38],mobile:[54,48],games:[]}
 ];
 const sums={id:'rekenen',name:'Plus en min',title:'Plus en min',games:[
  ['De bloemenweide','bloemenweide_keuze.html',asset+'bibi_bloemenweide.png','Reken en laat de bloemen groeien.'],
  ['De honingpot','honingpot_vullen_keuze.html',asset+'bibi_honingpot.png','Reken en vul de pot met honing.'],
  ['De bijenrace','bijenrace_keuze.html',asset+'bijenrace.png','Reken en vlieg naar de finish.']
 ]};
 const main=document.querySelector('#bee-main');
 function speak(text){if(!('speechSynthesis' in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='nl-BE';u.rate=.82;speechSynthesis.speak(u);}
 const listen=(text)=>`<button class="listen" data-speak="${text}" aria-label="Luister naar de uitleg"><img src="${speaker}" alt=""></button>`;
 function gameURL(path,island){if(path.startsWith('#'))return path;const u=new URL(path,location.href);u.searchParams.set('leerjaar','1');u.searchParams.set('eiland',island);return u.href;}
 function render(){
  window.speechSynthesis?.cancel();const id=location.hash.slice(1),zone=id==='sommen'?sums:zones.find(z=>z.id===id);document.body.classList.toggle('bee-world-inside',!!zone);
  if(!zone){main.innerHTML=`<section class="bee-map" aria-label="Bibi’s bijenwereld"><img class="scene" src="bibi-wereld/wereld.png" alt="Vier plekjes in Bibi’s wereld, met water, bloemen en bruggetjes">${zones.map(z=>`<div class="bee-place" style="--x:${z.box[0]}%;--y:${z.box[1]}%;--w:${z.box[2]}%;--h:${z.box[3]}%;--mobile-x:${z.mobile[0]}%;--mobile-y:${z.mobile[1]}%"><button class="destination" data-zone="${z.id}" aria-label="${z.name}${z.id==='spelling'?' — wordt nog aan gebouwd':''}"></button><span class="sign">${z.name}${z.id==='spelling'?'<small>Binnenkort</small>':''}</span>${listen(z.speech)}</div>`).join('')}<div class="bee-note">Speel mee met Bibi!</div></section>`;
  }else if(!zone.games.length){main.innerHTML=`<section class="bee-choice building"><h2>Spelling</h2><img class="bee-building-image" src="${asset}juf_bibi.png" alt="Bibi"><strong>Wordt nog aan gebouwd</strong>${listen(zone.speech)}<p><a class="listen" href="#" style="padding:10px 18px;text-decoration:none">Kies een spel</a></p></section>`;
  }else{main.innerHTML=`<section class="bee-choice" data-count="${zone.games.length}"><h2>${zone.title}</h2><div class="cards">${zone.games.map(([name,url,img,help])=>`<article class="bee-card"><a href="${gameURL(url,zone.id)}">${img==='train'?'<div class="train-picture" role="img" aria-label="De rode wolkentrein"></div>':`<img src="${img}" alt="">`}<span>${name}</span></a>${listen(help)}</article>`).join('')}</div></section>`;}
  document.querySelectorAll('[data-speak]').forEach(b=>b.onclick=()=>speak(b.dataset.speak));document.querySelectorAll('[data-zone]').forEach(b=>b.onclick=()=>{location.hash=b.dataset.zone;});
 }
 document.querySelector('#world-listen').onclick=()=>speak('Welkom in mijn bijenwereld! Tik op een huisje om te spelen. Bij het luidsprekertje hoor je wat je kunt doen.');
 addEventListener('hashchange',render);render();
})();
