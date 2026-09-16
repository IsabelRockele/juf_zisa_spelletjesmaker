const ISLAND_RECT=[0,320,1536,530],ISLAND_SURFACE=120/530;
// The garden has its own route and interactive irrigation stops.
export function createGardenWorld({T,scene,art,tex,grp,wagon,height,ribbon}){
 const group=grp(),stops=[42,76,110],beds=[],wheels=[],streams=[],finishFlowers=[];group.name='cloud-garden-route';
 function island(x,width,ground){return art(tex.island,ISLAND_RECT,width,x,ground-width*ISLAND_RECT[3]/ISLAND_RECT[2]*(1-ISLAND_SURFACE),1.45,group);}
 const atlas={tower:[48,0,464,526],tank:[521,128,489,347],sluice:[1026,230,414,212],dry:[55,581,420,393],bloom:[530,532,489,448],rabbit:[1047,500,435,507],wheel:[1068,79,143,148]};
 group.add(ribbon(-25,170,'garden',tex.kit,[950,775,480,48],2.7,.35,.12,.31));
 for(let x=-25;x<170;x+=3){const cloud=art(tex.cloud,[23,21,1500,384],5,x,height(x,'garden')-1.25,.6,group,1.65);cloud.rotation.z=Math.atan2(height(x+.5,'garden')-height(x-.5,'garden'),1);}
 for(const x of [-8,24,58,92,134]){island(x,6.5,.85);art(tex.story,[88,504,568,504],4.4,x,.85,1.7,group);}
 // The tower's spout ends directly above the tank hatch at the filling stop.
 art(tex.garden,atlas.tower,5.3,2.48,1.4,1.7,group);
 island(.2,10,1.4);
 const tank=art(tex.garden,atlas.tank,4.1,0,1.05,3.07,wagon);tank.name='garden-water-tank';tank.scale.x=-1;
 const lidPivot=grp(wagon);lidPivot.position.set(-.35,3.96,3.08);art(tex.garden,[659,65,149,64],1.249,.6,0,0,lidPivot);
 const openWagon=art(tex.animals,[1030,185,483,279],5.3,0,-.13,3,wagon);
 // A visible level gauge belongs to the tank, not to the screen interface.
 const gauge=new T.Group();gauge.position.set(.75,2.65,3.12);wagon.add(gauge);
 const gaugeBack=new T.Mesh(new T.PlaneGeometry(.34,1.25),new T.MeshBasicMaterial({color:0x174561}));gauge.add(gaugeBack);
 const gaugeFill=new T.Mesh(new T.PlaneGeometry(.22,1.12),new T.MeshBasicMaterial({color:0x6ce4ff}));gaugeFill.position.z=.02;gauge.add(gaugeFill);
 const gardener=art(tex.garden,atlas.rabbit,1.7,-2.4,1.4,1.9,group);
 const valveTargets=[];
 function wheelAt(x,y){const mesh=art(tex.garden,atlas.wheel,1.1,x,y-.57,1.95,group,1.14);mesh.geometry.dispose();mesh.geometry=new T.CircleGeometry(.55,64);const halo=new T.Mesh(new T.RingGeometry(.68,.74,40),new T.MeshBasicMaterial({color:0xffd354,transparent:true,depthWrite:false}));halo.position.set(x,y,2);group.add(halo);const target=new T.Mesh(new T.PlaneGeometry(2.8,2.8),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));target.position.set(x,y,2.1);target.userData.action='waterValve';group.add(target);wheels.push({mesh,halo,target});valveTargets.push(target);return target;}
 wheelAt(.35,3.05);
 function waterPath(points){const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const g=grp(group),water=new T.Mesh(new T.TubeGeometry(path,48,.085,7,false),new T.MeshBasicMaterial({color:0x49c9ee,transparent:true,opacity:.8,depthWrite:false}));g.add(water);const beads=[];for(let i=0;i<15;i++){const b=new T.Mesh(new T.SphereGeometry(.09,7,5),new T.MeshBasicMaterial({color:0xc4faff}));g.add(b);beads.push(b);}streams.push({g,path,beads,water});return g;}
 // Stop 0: the falling stream joins the spout to the tank hatch.
 waterPath([[4.82,4.93,3.2],[4.82,4.63,3.2],[4.82,3.95,3.2]]);
 const hoses=[],devices=[],growth=[],butterflies=[];
 const G={pot:[63,47,403,176],box:[569,63,397,137],soil:[1068,58,415,161],stem:[152,285,208,215],sunStem:[657,255,216,249],trunk:[1118,254,308,252],flower:[141,530,246,222],sun:[645,518,249,237],crown:[1094,515,362,246],sprinkler:[131,770,252,216],pump:[648,764,276,241],butterfly:[1144,792,265,189]};
 function deviceTarget(x,y){const halo=new T.Mesh(new T.RingGeometry(.68,.74,40),new T.MeshBasicMaterial({color:0xffd354,transparent:true,depthWrite:false}));halo.position.set(x,y,2.05);group.add(halo);const target=new T.Mesh(new T.PlaneGeometry(2.8,2.8),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));target.position.set(x,y,2.1);target.userData.action='waterValve';group.add(target);wheels.push({mesh:null,halo,target});}
 function plant(x,soil,sun=false){const root=grp(group);root.position.set(x,soil,1.78);const stemHeight=sun?2:1.1;
  const stem=art(tex.growth,sun?G.sunStem:G.stem,sun?.75:.65,0,0,0,root,stemHeight);
  const headPivot=grp(root);headPivot.position.set(0,stemHeight-.08,.02);const head=art(tex.growth,sun?G.sun:G.flower,sun?1.15:.85,0,sun?-.55:-.4,0,headPivot,sun?1.1:.8);
  return {root,stem,head,headPivot,lean:(x%2?1:-1)*.42,sun};
 }
 for(let i=0;i<3;i++){
  const stop=stops[i];island(stop-12.5,10.5,.85);let soil,rootX;
  if(i===0){island(stop-10.15,3.8,1.32);const gate=art(tex.garden,atlas.sluice,3.3,stop-10.15,1.32,1.8,group);gate.scale.x=-1;wheelAt(stop-9.44,3.45);
   const pot=art(tex.growth,G.pot,3.7,stop-13.4,.85,1.86,group,1.05);beds.push({pot});soil=1.53;rootX=stop-13.4;
   growth.push({plants:[-.95,0,.95].map(dx=>plant(rootX+dx,soil)),soil,x:rootX});
   waterPath([[stop-9.6,2.43,1.91],[stop-10.9,2.4,1.91],[stop-11.6,2.4,1.91],[stop-12.15,2.12,1.81],[stop-12.55,soil+.03,1.76]]);
  }else if(i===1){const sprinkler=art(tex.growth,G.sprinkler,1.7,stop-9.8,.85,1.94,group,1.65);devices.push(sprinkler);deviceTarget(stop-9.8,1.9);
   const pot=art(tex.growth,G.box,4.1,stop-13.1,.85,1.86,group,.9);beds.push({pot});soil=1.55;rootX=stop-13.1;
   growth.push({plants:[-1.25,0,1.25].map(dx=>plant(rootX+dx,soil,true)),soil,x:rootX});
   waterPath([[stop-10.52,2.26,1.95],[stop-11.5,4.0,1.8],[stop-13.6,3.5,1.75],[stop-13.2,soil+.03,1.76]]);
   streams[2].water.visible=false;
  }else{const pump=art(tex.growth,G.pump,1.65,stop-9.8,.85,1.94,group,2.65);devices.push(pump);deviceTarget(stop-9.8,2.6);
   const pot=art(tex.growth,G.soil,4.5,stop-13.0,.85,1.7,group,.4);beds.push({pot});soil=1.05;rootX=stop-13;
   const tree=grp(group);tree.position.set(rootX,soil,1.8);const trunk=art(tex.growth,G.trunk,2.2,0,0,0,tree,3.15),crown=art(tex.growth,G.crown,3.8,0,1.65,.02,tree,2.65);
   growth.push({tree,trunk,crown,soil,x:rootX});
   waterPath([[stop-10.54,2.36,1.95],[stop-11,2.25,1.88],[stop-12,1.5,1.78],[rootX+.35,soil+.03,1.76]]);
  }
  const helper=art(i===0?tex.garden:tex.animals,i===0?atlas.rabbit:i===1?[555,535,385,470]:[1055,490,420,520],1.45,stop-15.7,.85,1.9,group);helper.name='garden-friend';
  const inlet=new T.Vector3(stop-7.35,2.64,3.1),end=new T.Vector3(stop-(i===0?9.44:i===2?9.76:9.1),i===0?2.5:1.2,1.98);
  const curve=new T.CatmullRomCurve3([inlet.clone(),new T.Vector3(stop-7.7,2.64,3.1),new T.Vector3(stop-8.15,1.5,2.85),new T.Vector3(stop-8.7,1.2,2.25),end].map(p=>p.sub(inlet)));
  const hose=new T.Mesh(new T.TubeGeometry(curve,40,.065,10,false),new T.MeshBasicMaterial({color:0x265b60}));hose.position.copy(inlet);group.add(hose);hoses.push(hose);
  const fly=art(tex.growth,G.butterfly,.55,rootX,3,2.15,group,.45);butterflies.push(fly);
 }
 island(126,17,.85);art(tex.party,[40,0,780,575],10,126,.85,1.6,group);
 const finishGuests=[art(tex.garden,atlas.rabbit,1.7,124.5,.85,1.9,group),art(tex.animals,[555,535,385,470],1.45,126.5,.85,1.9,group),art(tex.animals,[1055,490,420,520],1.45,128.3,.85,1.9,group)];
 for(const guest of finishGuests)guest.userData.baseY=guest.position.y;
 for(const x of [121,131.5]){art(tex.growth,G.box,2.8,x,.85,1.86,group,.7);for(const dx of [-.7,0,.7])plant(x+dx,1.42);}
 const finishBalloons=[121.5,123,129.5,131].map((x,i)=>{const balloon=art(tex.party,[1030,530,420,494],1.05,x,3.7+i%2,1.8,group);balloon.userData.base=balloon.position.clone();return balloon;});
 const finishFlies=Array.from({length:5},(_,i)=>art(tex.growth,G.butterfly,.5,122+i*2,3,2.15,group,.4));
 let target=null;
 function update(m,dt){const active=m.level===5;group.visible=active;tank.visible=lidPivot.visible=openWagon.visible=gauge.visible=active;target=null;if(!active)return;
  const celebrating=['celebrating','complete'].includes(m.phase),ct=m.celebrationTime||0;
  finishGuests.forEach((guest,i)=>{guest.position.y=guest.userData.baseY+(celebrating?Math.abs(Math.sin(ct*4+i))*.16:0);guest.rotation.z=celebrating?Math.sin(ct*3+i)*.07:0;});
  finishBalloons.forEach((b,i)=>{b.position.copy(b.userData.base);b.position.y+=celebrating?Math.min(ct*.23,2)+Math.sin(ct*2+i)*.12:Math.sin(m.time+i)*.05;});
  finishFlies.forEach((b,i)=>{b.visible=m.watered===3;b.position.set(122+i*1.8+Math.sin(m.time+i)*.6,3+Math.sin(m.time*1.5+i)*.6,2.15);b.scale.x=.6+Math.abs(Math.sin(m.time*10+i))*.4;});
  const watering=m.phase==='watering',elapsed=watering?5-m.timer:0,flow=watering&&elapsed>.45&&elapsed<4.4;
  lidPivot.rotation.z=m.task===0&&watering?Math.min(1,elapsed/.4,m.timer/.5)*.95:0;
  const amount=m.task===0?(watering?Math.min(3,Math.max(0,elapsed-.45)/3.95*3):0):m.water-(watering?Math.min(1,elapsed/4.4)/(m.task>=2?m.tasks[m.task].count:1):0);
  gaugeFill.scale.y=Math.max(.015,amount/3);gaugeFill.position.y=-.56+.56*gaugeFill.scale.y;
  for(const p of finishFlowers)p.visible=m.watered===3;
  gardener.rotation.z=watering&&m.task===0?Math.sin(m.time*3)*.05:0;
  for(let i=0;i<4;i++){const w=wheels[i],chosen=m.task===i;w.target.visible=chosen&&m.phase==='valveReady';w.halo.visible=w.target.visible;w.halo.scale.setScalar(1+Math.sin(m.time*4)*.06);if(w.mesh)w.mesh.rotation.z=chosen&&watering?-elapsed*2:0;if(w.target.visible)target=w.target;
   const s=streams[i];s.g.visible=chosen&&flow;if(s.g.visible){s.water.material.opacity=.65+Math.sin(m.time*9)*.12;for(let j=0;j<s.beads.length;j++)s.beads[j].position.copy(s.path.getPoint((m.time*.7+j/s.beads.length)%1));}
  }
  for(let i=0;i<3;i++){
   const station=growth[i],rounds=i===0?1:i===1?2:3,previous=(m.gardenGrowth||[0,0,0])[i]||0;
   const progress=Math.min(1,previous+(watering&&m.task===i+1?T.MathUtils.smoothstep(elapsed,.6,4.4)/rounds:0));
   if(station.plants)for(let j=0;j<station.plants.length;j++){
    const p=station.plants[j],k=T.MathUtils.smoothstep(progress,Math.min(.15,j*.06),1);p.root.rotation.z=p.lean*(1-k);p.root.scale.y=p.sun?.6+.4*k:1;
    p.stem.material.color.set(0x977c48).lerp(new T.Color(0xffffff),k);p.head.material.color.set(0x8a6539).lerp(new T.Color(0xffffff),k);
    p.headPivot.rotation.z=(1-k)*1.2;p.head.scale.set(.15+.85*k,.3+.7*k,1);
   }else{station.tree.scale.setScalar(.72+.28*progress);station.crown.scale.setScalar(.025+.975*T.MathUtils.smoothstep(progress,.1,1));station.crown.position.y=2.97;}
   const fly=butterflies[i];fly.visible=progress>.95;fly.position.set(station.x+Math.sin(m.time*1.4+i)*1.8,3.8+Math.sin(m.time*2+i)*.45,2.15);fly.scale.x=.65+Math.abs(Math.sin(m.time*9))*.35;
   hoses[i].scale.setScalar(watering?1-T.MathUtils.smoothstep(elapsed,4.4,5):1);hoses[i].visible=m.task===i+1&&['question','building','valveReady','watering'].includes(m.phase)&&(!watering||elapsed<5);
  }

 }
 return {group,update,get target(){return target},beds,wheels,streams,tank,growth,hoses};
}
