// Gedeelde kenmerken maken de aanwijzingen nodig: niet één opvallend portret.
window.ZISA_GAME_CASTS={
 cats:[
 ['pip','Pip','rood','groen','geen'],['mies','Mies','zwart','groen','geen'],['mo','Mo','zwart','geel','blauw'],['pluis','Pluis','wit','blauw','rood'],['snor','Snor','grijs','groen','rood'],['vlek','Vlek','gevlekt','geel','blauw'],
 ['amber','Amber','rood','groen','blauw'],['roos','Roos','rood','groen','rood'],['roet','Roet','zwart','groen','rood'],['wolk','Wolk','wit','groen','rood'],['grijs','Grijs','grijs','groen','blauw'],['stip','Stip','gevlekt','groen','rood']
 ].map(([id,name,coat,eyes,collar])=>({id,name,coat,eyes,collar})),
 guests:[
 ['fien','Fien','heks','paars',false,true,'geen',2],['noor','Noor','heks','rood',false,false,'geen',2],['yas','Yas','wolf','geen',false,false,'blauw',2],['raf','Raf','wolf','geen',true,false,'rood',2],['mok','Mok','monster','geen',false,false,'geen',3],['tik','Tik','monster','paars',false,false,'geen',2],
 ['lien','Lien','heks','rood',false,true,'geen',2],['luna','Luna','heks','paars',false,false,'geen',2],['ben','Ben','wolf','geen',true,false,'blauw',2],['sam','Sam','wolf','geen',false,false,'rood',2],['puk','Puk','monster','geen',false,false,'geen',2],['bob','Bob','monster','paars',false,false,'geen',3]
 ].map(([id,name,kind,hat,glasses,broom,scarf,ears])=>({id,name,kind,hat,glasses,broom,scarf,ears}))
};
window.ZISA_BUILD_CLUES=function(castName,target){
 const cast=window.ZISA_GAME_CASTS[castName],rules=[];
 const add=(text,test)=>{const fits=cast.filter(test).map(c=>c.id);if(fits.includes(target.id)&&fits.length<cast.length)rules.push({text,fits})};
 if(castName==='cats'){
  const coat={rood:'rood',zwart:'helemaal zwart',wit:'wit, zonder zwarte vlekken',grijs:'grijs',gevlekt:'wit met zwarte vlekken'};
  Object.entries(coat).forEach(([value,label])=>{add(`Mijn vacht is ${label}.`,c=>c.coat===value);add(value==='wit'?'Mijn vacht is niet helemaal wit.':value==='gevlekt'?'Ik heb geen zwart-witte vacht.':`Mijn vacht is niet ${label}.`,c=>c.coat!==value)});
  Object.entries({groen:'groene',geel:'gele',blauw:'blauwe'}).forEach(([value,label])=>{add(`Ik heb ${label} ogen.`,c=>c.eyes===value);add(`Ik heb geen ${label} ogen.`,c=>c.eyes!==value)});
  add('Ik draag een halsband.',c=>c.collar!=='geen');add('Ik draag geen halsband.',c=>c.collar==='geen');
  for(const [value,label] of [['rood','rode'],['blauw','blauwe']]){add(`Ik draag een ${label} halsband.`,c=>c.collar===value);add(`Ik draag geen ${label} halsband.`,c=>c.collar!==value)}
 }else{
  add('Ik heb een groene vacht.',c=>c.kind==='monster');add('Ik heb geen groene vacht.',c=>c.kind!=='monster');add('Ik draag een wolvenpak.',c=>c.kind==='wolf');add('Ik draag geen wolvenpak.',c=>c.kind!=='wolf');add('Ik draag een heksenhoed.',c=>c.kind==='heks');add('Ik draag geen heksenhoed.',c=>c.kind!=='heks');
  add('Ik draag een hoed.',c=>c.hat!=='geen');add('Ik draag geen hoed.',c=>c.hat==='geen');
  for(const [value,label] of [['rood','rode'],['paars','paarse']]){add(`Ik draag een ${label} hoed.`,c=>c.hat===value);add(`Ik draag geen ${label} hoed.`,c=>c.hat!==value)}
  add('Ik draag een bril.',c=>c.glasses);add('Ik draag geen bril.',c=>!c.glasses);add('Ik heb een bezem bij me.',c=>c.broom);add('Ik heb geen bezem bij me.',c=>!c.broom);
  for(const [value,label] of [['rood','rode'],['blauw','blauwe']]){add(`Ik draag een ${label} sjaal.`,c=>c.scarf===value);add(`Ik draag geen ${label} sjaal.`,c=>c.scarf!==value)}
  add('Ik heb drie oren.',c=>c.ears===3);add('Ik heb twee oren.',c=>c.ears===2);
 }
 const intersection=(ids,r)=>ids.filter(id=>r.fits.includes(id));
 // Tot de vierde aanwijzing blijven minimaal twee mogelijkheden over.
 // Ook de combinatie van de eerste twee mag de oplossing niet verklappen.
 let best=[],bestScore=Infinity;
 for(const a of rules){if(a.fits.length<6||a.fits.length>10)continue;
  for(const b of rules){const two=intersection(a.fits,b);if(two.length<4||two.length>=a.fits.length)continue;
   for(const c of rules){const three=intersection(two,c);if(three.length<2||three.length>=two.length||three.length>4)continue;
    const finish=rules.filter(d=>intersection(three,d).length===1);
    if(!finish.length)continue;const score=Math.abs(a.fits.length-8)+Math.abs(two.length-5)+Math.abs(three.length-3);
    if(score<bestScore){bestScore=score;best=[]}if(score===bestScore)for(const d of finish)best.push([a,b,c,d]);
   }
  }
 }
 if(!best.length)throw new Error('Geen vier ondubbelzinnige aanwijzingen voor '+target.id);
 const chosen=best[Math.floor(Math.random()*best.length)];
 return {...target,clues:chosen.map(r=>r.text),fits:chosen.map(r=>r.fits)};
};
