export function createStarWorld({T,scene,art,tex,grp,wagon,height,ribbon,glowTexture}){
 const group=grp();group.name='star-festival-route';const stars=tex.stars,glow=glowTexture(),guests=[],balloons=[],gateLights=[],lanternLights=[];
 const A={arch:[47,5,441,494],pavilion:[531,14,475,490],lantern:[1142,8,281,495],bell:[38,526,451,456],star:[587,510,407,493],balloon:[1078,505,429,486]};
 function island(x,width,y=.85){return art(tex.island,[0,320,1536,530],width,x,y-width*410/1536,1.45,group);}
 function lamp(x,y,size=2,color=0xffd76b){const o=new T.Sprite(new T.SpriteMaterial({map:glow,color,transparent:true,depthWrite:false,opacity:.75}));o.position.set(x,y,2);o.scale.set(size,size,1);group.add(o);return o;}
 function target(x,y,action){const mesh=new T.Mesh(new T.PlaneGeometry(2.8,2.8),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));mesh.position.set(x,y,2.3);mesh.userData.action=action;group.add(mesh);const halo=new T.Mesh(new T.RingGeometry(.57,.63,40),new T.MeshBasicMaterial({color:0xffdf74,transparent:true,depthWrite:false}));halo.position.set(x,y,2.2);group.add(halo);return {mesh,halo};}
 group.add(ribbon(-25,180,'stars',tex.kit,[950,775,480,48],2.7,.35,.12,.31));
 for(let x=-25;x<180;x+=3.2){const c=art(tex.cloud,[23,21,1500,384],5.6,x,height(x,'stars')-1.3,.6,group,1.7);c.material.color.set(0xb9c7ee);c.rotation.z=Math.atan2(height(x+.5,'stars')-height(x-.5,'stars'),1);}
 island(17,11);const arch=art(stars,A.arch,5.3,17,.85,1.8,group);
 gateLights.push(lamp(15.2,5.2,2),lamp(18.8,5.2,2));
 island(49,12);const lantern=art(stars,A.lantern,3.2,49,.85,1.8,group);lanternLights.push(lamp(47.93,4.49,1.8),lamp(49.05,5.30,2.1),lamp(50.10,4.49,1.8));
 island(82,9);const bellScale=3.2/451;
 function bellPiece(rect,parent=group){return art(stars,rect,rect[2]*bellScale,82+(rect[0]+rect[2]/2-263.5)*bellScale,.85+(982-rect[1]-rect[3])*bellScale,1.8,parent);}
 for(const rect of [[38,526,451,76],[38,602,112,234],[377,602,112,234],[38,836,451,146]])bellPiece(rect);
 const bellSwing=grp(group);bellSwing.position.set(82,.85+(982-602)*bellScale,0);const bell=bellPiece([150,602,227,234],bellSwing);bell.position.x-=bellSwing.position.x;bell.position.y-=bellSwing.position.y;const bellGlow=lamp(82,3.15,3.2);const bellTarget=target(83.3,1.97,'bell');
 island(131,21);const stage=art(stars,A.pavilion,6.5,134,.85,1.7,group),bigStar=art(stars,A.star,3,127.2,.85,1.85,group),starGlow=lamp(127,3.4,6);const finaleTarget=target(128.43,3.12,'finale');
 const stageLight=lamp(134,4.6,8,0xffe5a4);stageLight.position.z=1.65;
 const rects=[[88,511,342,494],[555,535,385,470],[1055,490,420,520]];
 for(let i=0;i<3;i++){const friend=art(tex.animals,rects[i],1.2,132.3+i*1.65,2.26,1.95,group);friend.userData.base=friend.position.clone();guests.push(friend);}
 // These friends wait safely on the islands, beside the foreground railway.
 art(tex.garden,[1047,500,435,507],1.4,20,.85,1.9,group);art(tex.animals,rects[1],1.25,52,.85,1.9,group);art(tex.animals,rects[2],1.25,85,.85,1.9,group);
 for(let i=0;i<5;i++){const b=art(stars,A.balloon,1.8,121+i*3.6,6+(i%2)*1.3,1.5,group);b.userData.base=b.position.clone();balloons.push(b);}
 // A few star ornaments ride in the festive open wagon.
 const cart=art(tex.animals,[1030,185,483,279],5.3,0,-.13,3,wagon),ornaments=[];
 for(let i=0;i<3;i++)ornaments.push(art(stars,[625,518,285,260],.8,-1.1+i*1.05,2.6,2.98,wagon));
 const twinkles=[];for(let i=0;i<36;i++){const p=lamp(-10+i*4.5,5+(i%5)*.7,.16,0xffe7a3);twinkles.push(p);}
 // Slow, coloured bursts in the sky; no whole-screen flashes.
 const count=192,positions=new Float32Array(count*3),colors=new Float32Array(count*3),geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(positions,3));geo.setAttribute('color',new T.BufferAttribute(colors,3));
 const fireworks=new T.Points(geo,new T.PointsMaterial({map:glow,size:.32,transparent:true,depthWrite:false,vertexColors:true,opacity:.95}));fireworks.frustumCulled=false;group.add(fireworks);
 const palette=[0xffcf54,0x65e2ff,0xff7cc4,0xa6f27a,0xdfa2ff,0xffab66];for(let i=0;i<count;i++){const c=new T.Color(palette[Math.floor(i/32)]);colors.set([c.r,c.g,c.b],i*3);}
 const confetti=[];for(let i=0;i<48;i++){const piece=new T.Mesh(new T.PlaneGeometry(.10,.18),new T.MeshBasicMaterial({color:palette[i%6],side:T.DoubleSide}));group.add(piece);confetti.push(piece);}
 let activeTarget=null;
 function update(m,dt){const active=m.level===6;group.visible=cart.visible=active;for(const o of ornaments)o.visible=active;activeTarget=null;if(!active)return;
  const party=m.phase==='celebrating',finished=m.phase==='complete',ct=m.celebrationTime||0;
  const reveal=m.phase==='building'?T.MathUtils.smoothstep(3-m.timer,0,1.3):1;
  arch.material.color.set(0x777d9d).lerp(new T.Color(0xffffff),Math.min(1,(m.done-(m.task===0?1-reveal:0))/2));gateLights.forEach((o,i)=>{o.visible=m.done>i;o.material.opacity=.9*(m.task===0&&m.done===i+1?reveal:1);o.scale.setScalar(2+(m.task===0&&m.done===i+1?Math.sin(reveal*Math.PI)*1.2:0));});
  lantern.material.color.set(m.done>=5?0xffffff:0x667086);lanternLights.forEach((o,i)=>{o.visible=m.done>=3+i;o.material.opacity=.9*(m.task===1&&m.done===3+i?reveal:1);});
  const ringing=m.task===2&&m.inTask===2&&m.phase==='building',bellElapsed=3-m.timer;bellSwing.rotation.z=ringing?Math.sin(bellElapsed*Math.PI*4)*.16*Math.sin(Math.PI*Math.min(1,bellElapsed/3)):0;
  bellGlow.visible=ringing;bellGlow.material.opacity=.45+.2*Math.sin(m.time*5);
  bellTarget.mesh.visible=bellTarget.halo.visible=m.phase==='bellReady';finaleTarget.mesh.visible=finaleTarget.halo.visible=m.phase==='starReady';
  for(const t of [bellTarget,finaleTarget]){t.halo.scale.setScalar(1+Math.sin(m.time*4)*.06);if(t.mesh.visible)activeTarget=t.mesh;}
  bigStar.material.color.set(m.done>=10?0xffffff:m.done>=8?0xc8a366:0x777382);starGlow.visible=m.done>=8;starGlow.scale.setScalar(party?6+Math.sin(ct*1.4)*.5:Math.min(4,m.done-6));starGlow.material.opacity=party?.8:.4;
  stageLight.visible=party||finished;stage.material.color.set(party||finished?0xffffff:0xb4b7c9);
  guests.forEach((g,i)=>{g.position.copy(g.userData.base);if(party){g.position.y+=Math.abs(Math.sin(ct*4+i))*.2;g.rotation.z=Math.sin(ct*3+i)*.08;}else g.rotation.z=0;});
  balloons.forEach((b,i)=>{b.visible=party||finished;b.position.copy(b.userData.base);if(party||finished){b.position.y+=Math.max(0,ct-3)*.36;b.position.x+=Math.sin(ct*.7+i)*.4;}});
  twinkles.forEach((p,i)=>p.material.opacity=.4+Math.sin(m.time*1.1+i)*.2);
  fireworks.visible=party&&ct>1.5;
  if(fireworks.visible){for(let i=0;i<count;i++){const burst=Math.floor(i/32),j=i%32,age=(ct-1.5-burst*.42+12)%3.8,angle=j/32*Math.PI*2,r=Math.min(age*1.55,3.4),cx=121+(burst%3)*7,cy=7.4+Math.floor(burst/3)*2.8;positions[i*3]=cx+Math.cos(angle)*r;positions[i*3+1]=cy+Math.sin(angle)*r-age*age*.1;positions[i*3+2]=2;if(age>=2.4)positions[i*3+1]=-1000;}geo.attributes.position.needsUpdate=true;}
  confetti.forEach((p,i)=>{p.visible=party&&ct>6;if(p.visible){p.position.set(119+(i*.73)%19,9-((ct-6)*1.2+i*.33)%8.5,2.2);p.rotation.z=ct*1.4+i;p.rotation.y=ct*2+i;}});
 }
 return {group,update,get target(){return activeTarget},bellTarget,finaleTarget,guests,balloons,fireworks};
}
