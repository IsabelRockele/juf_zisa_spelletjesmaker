/* PNG story worlds. Original image assets are hosted separately from website code. */
const TimerSeasonal = (() => {
 const themes=['sint','christmas','easter'];
 const clamp=n=>Math.max(0,Math.min(1,n));
 const ease=n=>{n=clamp(n);return n*n*(3-2*n);};
 const atlas={
 'easter-mouse-peek':[[0,0,1145,1374]],
 'easter-bee-cycle':[[200,0,800,660],[1180,0,800,660]],
 'easter-colorful-eggs':[[106,40,373,458],[572,42,380,457],[1052,42,375,458],[101,528,380,466],[571,529,385,466],[1047,529,385,466]],
 'squirrel-gift-poses':[[0,0,512,512],[512,0,488,512],[1000,0,536,512],[0,512,512,512],[512,512,540,512],[1160,793,169,174]],

 'penguin-sled-cycle':Array.from({length:4},(_,i)=>[(i%2)*887,Math.floor(i/2)*443,887,443]),
 'squirrel-lower-cycle':Array.from({length:4},(_,i)=>[i*543,0,543,724]),
 'piet-walk-cycle':Array.from({length:8},(_,i)=>[40+(i%4)*384,Math.floor(i/4)*512,344,512]),
 'easter-walk-cycle':Array.from({length:8},(_,i)=>[Math.floor((i%4)*1774/4),Math.floor(i/4)*443,443,443]),
 'snowman-walk-cycle':Array.from({length:6},(_,i)=>[(i%3)*512,Math.floor(i/3)*512,512,512]),
 'piet-climb-cycle':[[210,19,560,842],[986,19,580,842]],
 'squirrel-walk-cycle':Array.from({length:8},(_,i)=>[[40,480,925,1360][i%4],Math.floor(i/4)*443,[440,440,430,414][i%4],420]),

 'easter-walk':[[166,28,387,552],[709,28,391,553],[160,631,387,584],[702,631,392,584]],
 'christmas-snowman':[[0,0,724,724],[724,0,724,724],[1448,0,724,724]],
 'piet-delivery-v2':[[0,0,512,512],[512,0,512,512],[1024,0,512,512],[0,512,512,512],[512,512,512,512],[1170,680,198,207]],
 'easter-delivery':[[97,33,426,547],[706,15,448,554],[105,627,433,601],[814,813,248,283]],
 'christmas-sleigh':[[64,20,2005,671]],
 'christmas-delivery':[[161,10,511,483],[899,35,478,455],[191,522,482,486],[1001,652,272,268]],
 'piet-delivery':[[142,22,461,679],[864,22,409,679],[1587,22,444,679]],
 'christmas-ladder':[[118,18,748,1509]],
 'christmas-climb':[[97,23,324,463],[593,22,324,465],[1106,23,385,463],[82,535,340,463],[608,537,297,462],[1121,536,291,463],[1420,134,72,103]],
 'sint-poses':[[27,13,446,485],[538,14,442,481],[1037,14,455,480],[61,617,380,358],[550,514,367,495],[1078,529,367,480]],
 'piet-extra-poses':[[126,7,283,498],[598,0,328,505],[1133,50,300,449],[103,525,314,493],[591,525,360,487],[1113,524,319,494]],
 'christmas-poses':[[85,16,336,483],[557,20,409,485],[1099,21,307,484],[32,531,464,461],[519,569,482,423],[1087,531,431,469]],
 'easter-poses':[[48,49,369,480],[547,11,377,472],[1059,15,440,524],[14,630,489,363],[559,632,465,338],[1133,610,297,374],[14,730,210,265]],
 'holiday-props':[[56,19,418,462],[558,27,423,446],[1066,55,419,392],[65,522,376,485],[566,537,386,479],[1069,534,392,481]]};
 const files=['sint-background','christmas-background','easter-background',...Object.keys(atlas)];
 const plans=new Map();
 function schedule(duration=600,theme=''){
  const seconds=Math.max(1,duration);
  const interval=theme==='easter'?20:30,key=interval+':'+seconds;
  if(plans.has(key))return plans.get(key);
  const count=Math.max(1,Math.floor(seconds/interval)),first=Math.min(2,seconds*.1),length=Math.min(16,(seconds-first)*.65);
  const kinds=theme==='easter'?[0,1,0,2,0,1,0,3]:[2,0,4,2,1,3,5];
  const visits=Array.from({length:count},(_,i)=>({start:first+i*interval,length,kind:kinds[i%kinds.length],index:i}));
  if(plans.size>30)plans.clear();plans.set(key,visits);return visits;
 }
 function frame(progress,duration=600,theme=''){
  const p=clamp(progress),elapsed=p*duration,visits=schedule(duration,theme);
  const visit=p>0&&p<1?visits.find(v=>elapsed>=v.start&&elapsed<v.start+v.length):null;
  const t=visit?(elapsed-visit.start)/visit.length:0;
  return {p,elapsed,visits,visit,t,appear:ease(t/.12)*(1-ease((t-.86)/.14)),complete:p===1,
   delivered:visits.filter(v=>elapsed>=v.start+v.length*.72).length};
 }
 // A draw list shared by the live timer and exported animation previews.
 function scene(theme,progress,duration=600){
  const f=frame(progress,duration,theme),items=[];
  const put=(sheet,cell,x,y,h,extra={})=>items.push({sheet,cell,x,y,h,...extra});
  const prop=(cell,x,y,h,extra={})=>put('holiday-props',cell,x,y,h,extra);
  const step=(distance,stride=112)=>Math.floor(Math.abs(distance)/(stride/4))%4;
  const pietWalk=(x,y,distance,flip=false,h=170,carry=false)=>{
   const phase=step(distance,112*h/170),cell=phase+(carry?0:4),scale=h/466;
   const anchor=[224,214,192,179][phase],offset=(212-anchor)*scale;
   put('piet-walk-cycle',cell,x+(flip?-offset:offset),y+(512-482)*scale,512*scale,{flip,actor:'piet',walkPhase:phase});
   return phase;
  };

  let caption=theme==='sint'?'Wie komt er straks op bezoek?':theme==='christmas'?'Samen maken we het gezellig…':'Wie komt er in de paastuin?';
  if(theme==='sint'){
   const deliveries=f.visits.filter(v=>v.kind===2);
   const door=i=>[235,625,990][i%3]+(Math.floor(i/3)%2)*20;
   deliveries.forEach((v,i)=>{if(f.elapsed>=v.start+v.length*.6)put('piet-delivery-v2',5,door(i),492,32,{placed:true});});
   // A real, persistent route from the right roof down to the square.
   put('christmas-ladder',0,1100,492,340,{w:80});
   if(f.visit){
    const t=f.t,k=f.visit.kind,local=t*f.visit.length;
    if(k===0){
     put('sint-poses',3,190,151+60*(1-f.appear),112,{clip:[120,0,165,120]});
     caption='Kiekeboe! Een pietje bij de schoorsteen!';
    }else if(k===4){
     const reverse=f.visits.filter(v=>v.kind===4).indexOf(f.visit)%2===1;
     put('sint-poses',Math.floor(local*5)%3,reverse?1350-1500*t:-150+1500*t,554,265,{flip:reverse});
     caption=reverse?'De Sint rijdt terug op zijn paard!':'De Sint rijdt voorbij op zijn paard!';
    }else if(k===1){
     put('piet-extra-poses',Math.floor(local*2)%2,643,304+80*(1-f.appear),155,{clip:[594,142,108,92]});
     caption='Er zwaait een pietje vanuit het raam!';
    }else if(k===2){
     const index=deliveries.indexOf(f.visit),target=door(index),scale=170/480;
     const stop=target-124*scale;
     const leaving=t>.74;
     const footX=t<.36?-90+ease(t/.36)*(stop+90):leaving?stop-ease((t-.74)/.26)*(stop+90):stop;
     const walking=t<.36||leaving,distance=leaving?stop-footX:footX+90;
     const phase=step(distance);
     // Only one complete character PNG is drawn in every frame.
     const cell=t<.43?0:t<.52?1:t<.63?2:t<.70?3:4;
     const grip=[[73,-158],[111,-58],[124,0]];
     if(t<.6){
      const g=walking?[[90,75,88,84][phase]*170/466,-60]:[grip[cell][0]*scale,grip[cell][1]*scale];
      put('piet-delivery-v2',5,footX+g[0],492+g[1],32,{carriedGift:true});
     }
     if(walking)pietWalk(footX,492,distance,leaving,170,!leaving);
     else{
      const anchors=[265,211,192,212,260],offset=(256-anchors[cell])*scale;
      put('piet-delivery-v2',cell,footX+offset,492+(512-487)*scale,512*scale,{actor:'piet'});
     }
     caption=t<.38?'Piet draagt het pakje met twee handen.':t<.6?'Piet bukt en zet het pakje neer.':'Piet laat het pakje los en gaat weer verder.';

    }else if(k===3){
     if(t<.3){
      const x=1280-380*ease(t/.3);
      pietWalk(x,207+(x-875)*.09,1280-x,true,112);
     }else if(t<.48){
      const x=900+208*ease((t-.3)/.18);
      pietWalk(x,207+(x-875)*.09,x-900,false,112);
     }else if(t<.84){
      const stair=clamp((t-.48)/.36)*7,n=Math.min(6,Math.floor(stair)),part=ease(stair-n),q=(n+part)/7;
      const cell=n%2,feetX=1108-23*q,feetY=229+263*q;
      put('piet-climb-cycle',cell,feetX+[180,166][cell]*112/842-20,feetY,112,{actor:'piet'});
     }else{
      const x=1085+195*ease((t-.84)/.16);
      pietWalk(x,492,x-1085,false,112);
     }
     caption=t<.48?'Piet wandelt over het rechterdak.':t<.84?'Piet klimt langs de ladder naar beneden.':'Piet loopt over het plein naar huis.';
    }else{
     const peek=ease(t/.24)*(1-ease((t-.72)/.28));
     put('piet-extra-poses',2,76,-150+peek*175,142,{rotation:Math.PI,clip:[0,55,160,180]});
     caption='Kiekeboe! Een piet hangt ondersteboven in de boom!';
    }
   }
   if(f.complete)caption='Alle pakjes zijn bezorgd. Dank je wel, Sint!';
  }else if(theme==='christmas'){
   const bulbs=[[568,410],[565,300],[597,166],[645,248],[526,340],[701,344],[485,400],[615,321],[651,425],[731,404]];
   const decoratingVisits=f.visits.filter(v=>v.index%2===0);
   // Register the feet against the actual painted rungs, including the lean.
   const rungPixels=[[602,165],[568,342],[534,518],[498,696],[465,873],[429,1050],[393,1226],[358,1402]];
   const ladderFor=([bx,by])=>{
    const h=430,scale=h/1509;
    const rungs=rungPixels.map(([x,y])=>({x:(x-492)*100/748,y:530-h+(y-18)*scale}));
    const target=rungs.reduce((a,b)=>Math.abs(a.y-(by+82))<Math.abs(b.y-(by+82))?a:b);
    const x=bx-50-target.x;
    return {h,x,target,rungs:rungs.filter(r=>r.y>=target.y).reverse(),bx,by:target.y-82};
   };

   const bulb=(x,y)=>put('christmas-climb',6,x,y,103*150/463,{placed:true});
   decoratingVisits.slice(0,10).forEach((v,i)=>{if(f.elapsed>=v.start+v.length*.62){const l=ladderFor(bulbs[i]);bulb(l.bx,l.by);}});
   const giftVisits=f.visits.filter(v=>v.index%8===1);
   const giftX=i=>710+(i%4)*42;
   giftVisits.forEach((v,i)=>{if(f.elapsed>=v.start+v.length*.68){
    const baked=f.visit===v&&f.t<=.78;
    put('squirrel-gift-poses',5,giftX(i),530,48,{placedGift:true,opacity:baked?0:1,embeddedInActor:baked});
   }});
   if(f.visit){
    const t=f.t,local=t*f.visit.length,squirrel=f.visit.index%2;
    if(!squirrel){
     const n=decoratingVisits.indexOf(f.visit)%10,ladder=ladderFor(bulbs[n]);
     const climb=ease((t-.2)/.25),descend=ease((t-.68)/.17);
     const lift=t<.45?climb:t>.68?1-descend:1;
     const route=[{x:ladder.rungs[0].x-6,y:530},...ladder.rungs];
     const step=lift*(route.length-1),index=Math.min(route.length-2,Math.floor(step)),mix=ease(step-index);
     const from=route[index],to=route[index+1];
     const footX=ladder.x+from.x+(to.x-from.x)*mix,y=from.y+(to.y-from.y)*mix;
     const baseX=ladder.x+route[0].x;
     put('christmas-ladder',0,ladder.x,530,ladder.h,{w:100,opacity:ease(t/.1)*(1-ease((t-.9)/.1))});
     let x=footX,cell;
     if(t<.2){x=-130+ease(t/.2)*(baseX+130);put('christmas-poses',0,x,530,150);}
     else if(t>.85){x=baseX-ease((t-.85)/.15)*(baseX+130);put('christmas-poses',2,x,530,150,{flip:true});}
     else{
      cell=t<.45?index%2:t<.62?2:t<.68?3:4+index%2;
      const footOffsets=[-12,-6,0,6,-13,-5];
      put('christmas-climb',cell,x-footOffsets[cell],y,150);
     }
     caption=t<.45?'Konijn klimt op de ladder…':t<.68?'Konijn hangt een kerstbal aan de tak!':'De kerstbal blijft hangen!';
    }else if(f.visit.index%8===3){
     const returning=t>=.66;
     const x=t<.38?1290-490*ease(t/.38):returning?800+490*ease((t-.66)/.34):800;
     const walking=t<.38||returning,phase=step(returning?x-800:1290-x,72);
     const cell=walking?phase:t<.55?4:5,scale=135/470,baseline=cell<3?480:492;
     put('snowman-walk-cycle',cell,x,520+(512-baseline)*scale,512*scale,{flip:returning,actor:'snowman'});
     caption=t<.38?'De sneeuwpop wandelt over het plein.':t<.55?'Wat een mooie kerstboom!':t<.66?'De sneeuwpop zwaait even.':'De sneeuwpop draait om en wandelt terug naar huis.';
    }else if(f.visit.index%8===5){
     put('christmas-sleigh',0,1450-1700*t,155+Math.sin(t*Math.PI)*20,125);
     caption='Kijk! De kerstman vliegt voorbij met zijn slee!';
    }else if(f.visit.index%8===7){
     const path=q=>({x:780-360*q-20*q*q,y:900-1360*q*(1-q)});
     const point=path(t);let distance=0,previous=path(0);
     for(let i=1;i<=24;i++){const next=path(t*i/24);distance+=Math.hypot(next.x-previous.x,next.y-previous.y);previous=next;}
     const phase=step(distance,80);
     put('penguin-sled-cycle',phase,point.x,point.y+(443-405)*165/443,165,{actor:'penguin-sled',walkPhase:phase});
     caption='Pinguïn trekt de slee met kleine diertjes over het plein!';
    }else{
     const giftIndex=giftVisits.indexOf(f.visit),scale=48/174,stop=giftX(giftIndex)+184*scale;
     const x=t<.4?1300-ease(t/.4)*(1300-stop):t>.78?stop+ease((t-.78)/.22)*(1300-stop):stop;
     if(t<.4||t>.78){
      const phase=step(t<.4?1300-x:x-stop,100),cell=phase+(t>.78?4:0);
      put('squirrel-walk-cycle',cell,x,530+20*126/400,420*126/400,{flip:t>.78,actor:'squirrel'});
      if(t<.4)put('squirrel-gift-poses',5,x-89*scale,530-128*scale,48,{carriedGift:true});
     }else{
      const pose=t<.46?0:t<.54?1:t<.68?2:t<.74?3:4;
      const box=atlas['squirrel-gift-poses'][pose],feet=[263,749,1282,322,785],gx=[174,633,1098,126,604],gy=[344,405,472,964,964];
      const baseline=pose<3?472:964,anchor=pose<2?feet[pose]:gx[pose],position=pose<2?stop:giftX(giftIndex);
      if(t<.68)put('squirrel-gift-poses',5,position+(gx[pose]-anchor)*scale,530+(gy[pose]-baseline)*scale,48,{carriedGift:true,opacity:0,embeddedInActor:true});
      // These complete PNGs include the box and its natural front/back grip.
      // The standalone box is hidden until the squirrel walks away.
      put('squirrel-gift-poses',pose,position+(box[0]+box[2]/2-anchor)*scale,530+(box[1]+box[3]-baseline)*scale,box[3]*scale,{actor:'squirrel',includesGift:true});
     }
     caption=t<.68?'Eekhoorn zet zijn pakje onder de boom!':'Het pakje blijft staan. Dag eekhoorn!';
    }
   }
   if(f.complete)caption='De kerstboom straalt. Fijne kerst!';
  }else{
   const eggSpots=[[330,460],[440,486],[600,462],[760,450],[805,500],[700,520]];
   const eggVisits=f.visits.filter(v=>v.kind===0);
   const basketSpots=[[960,491],[995,490],[1030,491],[979,502],[1012,503],[1045,499]];
   const eggAngles=[-.4,.28,-.35,.5,-.25,.35];
   const basket=i=>basketSpots[i];
   const deposit=[927,486];
   const settledEgg=(i,visit)=>{
    const settle=ease((f.elapsed-visit.start-visit.length*.75)/(visit.length*.15)),[bx,by]=basket(i);
    return {x:deposit[0]+(bx-deposit[0])*settle,y:deposit[1]+(by-deposit[1])*settle,rotation:eggAngles[i]*settle};
   };
   eggSpots.forEach(([x,y],i)=>{
    const v=eggVisits[i];
    if(!v||f.elapsed<v.start+v.length*.12)put('easter-colorful-eggs',i,x,y,52,{eggId:i});
    else if(f.elapsed>=v.start+v.length*.75){const pos=settledEgg(i,v);put('easter-colorful-eggs',i,pos.x,pos.y,52,{rotation:pos.rotation,eggId:i,inBasket:true});}
   });
   if(f.visit){
    const t=f.t,local=t*f.visit.length,k=f.visit.kind;
    if(k===0){
     const n=eggVisits.indexOf(f.visit),hasEgg=n<eggSpots.length;
     const [ex,ey]=eggSpots[n%6];
     const travel=ease((t-.24)/.41),exit=ease((t-.8)/.2);
     // First turn left onto the open path, then walk toward its lower edge.
     // A diagonal from the basket cuts through the flowers on the right.
     const exitX=270*(1-Math.pow(1-exit,3)),exitY=360*exit*exit;
     // Stop outside the left edge of the basket; only the outstretched
     // paws and egg reach over its rim. Return along the open path.
     const x=t<.12?-110+ease(t/.12)*(ex-50+110):ex-50+(877-(ex-50))*travel-exitX;
     const y=ey+8+(535-ey-8)*travel+exitY;
     const hop=0,rabbitLayer=items.length;
     if(t>.8||t<.12||t>=.24&&t<.65){
      const returning=t>.8,empty=returning||t<.12;
      const distance=returning?Math.hypot(exitX,exitY):t<.12?x+110:x-(ex-50);
      const phase=step(distance,120),cell=phase+(empty?4:0),scale=155/410;
      put('easter-walk-cycle',cell,x,y+(443-418)*scale,443*scale,{flip:returning,actor:'rabbit',walkPhase:phase});
     }else put('easter-delivery',t<.24?0:2,x+(t<.24?7:0),y,155,{actor:'rabbit'});
     if(hasEgg&&t>=.12&&t<.75){
      const lift=t<.24?0:1,lower=ease((t-.65)/.1);
      put('easter-colorful-eggs',n,x+50,y-8-lift*47-hop+lower*(deposit[1]-(y-55)),52,{eggId:n,carriedEgg:true});
      // The same full-body pose determines the grip height. No separate
      // floating egg animation while the paws are still on the ground.
      items.splice(rabbitLayer,0,items.pop());
     }
     // Enlarge the complete figure around its grip, keeping the egg in its paws.
     const rabbit=items.find(i=>i.actor==='rabbit'),gripX=x+50,gripY=y-(t<.24?8:55),size=1.2;
     rabbit.x=gripX+(rabbit.x-gripX)*size;rabbit.y=gripY+(rabbit.y-gripY)*size;rabbit.h*=size;
     const heldEgg=items.find(i=>i.carriedEgg);
     if(heldEgg)items.push({sheet:heldEgg.sheet,cell:heldEgg.cell,x:heldEgg.x,y:heldEgg.y,h:heldEgg.h,eggGripFront:true,gripPose:t<.24?'pickup':t<.65?'carry':'lower'});
     caption=hasEgg?(t<.24?'De paashaas raapt een eitje op!':t<.75?'De paashaas brengt het ei naar de mand!':'Het ei blijft in de mand!'):'De paashaas komt nog eens kijken!';
    }else if(k===1){
     const x=650+110*Math.sin(Math.PI*t),y=810-1000*t*(1-t);
     put('easter-poses',3,x,y-Math.abs(Math.sin(local*3))*3,88,{actor:'chicks',flip:t>.5,inFrontOfBasket:true});
     const group=f.visits.filter(v=>v.kind===1).indexOf(f.visit)%2===1;
     if(group){const u=clamp((t-.1)/.9);put('easter-poses',3,610+100*Math.sin(Math.PI*u),820-880*u*(1-u),74,{actor:'chicks-following',flip:u>.5,inFrontOfBasket:true});}
     caption=group?'Nog twee kuikentjes volgen hun vriendjes!':'Twee kuikentjes komen kijken!';
    }else if(k===2){
     put('easter-poses',4+Math.floor(local*7)%2,-100+t*1400,300+Math.sin(t*9)*60,70,{actor:'butterfly'});
     caption='Een vlinder fladdert door de tuin!';
    }else{
     put('easter-bee-cycle',Math.floor(local*6)%2,-100+t*1400,260+Math.sin(t*Math.PI*4)*35,78,{actor:'bee'});
     caption='Bzzzz… een bijtje vliegt door de paastuin!';
    }
   }
   const flutter=(f.elapsed-8)%22;
   if(f.elapsed>=8&&!f.complete&&flutter<10){
    const u=flutter/10;
    put('easter-poses',4+Math.floor(flutter*7)%2,-80+1360*u,140+Math.sin(u*Math.PI)*65,42,{actor:'ambient-butterfly'});
   }
   const peekTime=(f.elapsed-12)%40;
   if(f.elapsed>=12&&!f.complete&&peekTime<9){
    const peek=ease(peekTime/2)*(1-ease((peekTime-6)/3));
    put('easter-mouse-peek',0,1135,370-60*peek,110,{actor:'pot-mouse'});
    items.push({foreground:[1035,230,165,205],flowerpotFront:true});
    if(!f.visit)caption='Kiekeboe! Wie zit er achter de bloempot?';
   }
   // Repaint only the basket front from the same PNG, so eggs sit inside it.
   const frontLayer={foreground:[890,460,230,114],basketFront:true};
   const foregroundActor=items.findIndex(i=>i.inFrontOfBasket);
   if(foregroundActor>=0)items.splice(foregroundActor,0,frontLayer);else items.push(frontLayer);
   if(f.complete)caption='De mand is gevuld. Vrolijk Pasen!';
  }
  return {theme,items,caption,frame:f};
 }
 function draw(ctx,images,state,width=1200,height=675){
  ctx.save();ctx.clearRect(0,0,width,height);ctx.scale(width/1200,height/675);
  const bg=images[state.theme+'-background'];if(bg)ctx.drawImage(bg,0,0,1200,675);
  for(const item of state.items){
   ctx.save();
   if(item.foreground){const [x,y,w,h]=item.foreground;if(item.basketFront){ctx.beginPath();ctx.moveTo(890,461);ctx.bezierCurveTo(942,499,1060,505,1120,460);ctx.lineTo(1120,574);ctx.lineTo(890,574);ctx.closePath();ctx.clip();}if(item.flowerpotFront){ctx.beginPath();ctx.moveTo(1035,302);ctx.lineTo(1050,278);ctx.lineTo(1074,270);ctx.lineTo(1080,253);ctx.lineTo(1100,247);ctx.lineTo(1113,240);ctx.lineTo(1133,247);ctx.lineTo(1152,239);ctx.lineTo(1173,255);ctx.lineTo(1185,274);ctx.lineTo(1200,285);ctx.lineTo(1200,435);ctx.lineTo(1035,435);ctx.closePath();ctx.clip();}ctx.drawImage(bg,x/1200*bg.width,y/675*bg.height,w/1200*bg.width,h/675*bg.height,x,y,w,h);ctx.restore();continue;}
   const im=images[item.sheet],box=atlas[item.sheet]?.[item.cell];if(!im||!box){ctx.restore();continue;}
   if(item.clip){ctx.beginPath();ctx.rect(...item.clip);ctx.clip();}
   if(item.eggGripFront){
    // The egg covers the far paw; its lower edge stays behind the near paw.
    // Reuse the same egg artwork and complete rabbit, without separate limbs.
    const bottom=item.y,cut=bottom-(item.gripPose==='carry'?18:16);
    ctx.beginPath();ctx.moveTo(item.x-35,bottom-item.h);ctx.lineTo(item.x+35,bottom-item.h);
    ctx.lineTo(item.x+35,cut+5);ctx.bezierCurveTo(item.x+10,cut+5,item.x-7,cut-5,item.x-35,cut-5);ctx.closePath();ctx.clip();
   }
   ctx.globalAlpha=item.opacity??1;
   const [sx,sy,sw,sh]=box,w=item.w??item.h*sw/sh;
   ctx.translate(item.x,item.y);if(item.flip)ctx.scale(-1,1);if(item.rotation)ctx.rotate(item.rotation);
   ctx.drawImage(im,sx,sy,sw,sh,-w/2,-item.h,w,item.h);ctx.restore();
  }
  ctx.restore();
 }
 const cache=new Map();
 function create(host){
  const doc=host.ownerDocument||document,canvas=doc.createElement('canvas');canvas.width=1200;canvas.height=675;
  if(host.classList.contains('mini-world'))host.style.position='relative';
  canvas.style.cssText='display:block;width:100%;height:100%;min-width:0;min-height:0;object-fit:contain;position:absolute;inset:0';host.replaceChildren(canvas);
  const ctx=canvas.getContext('2d'),images={};let last=null,error=false;
  // Original PNGs verified on the existing free static Cloudflare Pages project.
  const base=globalThis.TIMER_SEASONAL_ASSET_BASE||'https://zisa-klokprenten.pages.dev/feesttimers/';
  const ready=Promise.all(files.map(name=>{
   const url=new URL(name+'.png',base).href;
   if(!cache.has(url))cache.set(url,new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Prent ontbreekt: '+name));img.src=url;}));
   return cache.get(url).then(img=>images[name]=img);
  })).then(()=>{if(last)draw(ctx,images,last);}).catch(()=>{error=true;});
  return {ready,render(theme,p,running,duration=600){last=scene(theme,p,duration);if(images[theme+'-background'])draw(ctx,images,last);return error?'De prenten konden niet worden geladen.':last.caption;}};
 }
 return {themes,atlas,files,schedule,frame,scene,draw,create};
})();
if(typeof module!=='undefined')module.exports=TimerSeasonal;
