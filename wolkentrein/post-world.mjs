export function createPostWorld({T,scene,art,tex,grp,wagon,height,ribbon}){
 const group=grp(),balloons=[],cargo=[],deliveries=[],birds=[],parcelRect=[1083,804,225,179];group.name='cloud-post-route';
 // A single continuous undulating railway, with no fork, tunnel or bridge gap.
 const rail=ribbon(-25,215,'postal',tex.kit,[950,775,480,48],1.25,.35,.12,.31);group.add(rail);
 for(let x=-25;x<215;x+=2.6){const c=art(tex.cloud,[23,21,1500,384],4.5,x,height(x,'postal')-1.2,.6,group,1.5);c.rotation.z=Math.atan2(height(x+.5,'postal')-height(x-.5,'postal'),1);}
 art(tex.post,[20,16,500,497],5.7,-3,.05,1.6,group);
 const loadingBelt=art(tex.post,[20,622,591,322],7,1,.25,2.9,group,2.8);
 const helpers=[art(tex.animals,[88,511,342,494],1.65,-3.5,.15,3.5,group),art(tex.animals,[555,535,385,470],1.8,-5.4,.15,3.5,group)];
 const handParcel=art(tex.post,parcelRect,.68,-3,1.3,3.7,group);
 art(tex.cloud,[23,21,1500,384],9,-3,-1.2,1,group,1.4);
 for(let i=0;i<4;i++){const stop=38+i*28;art(tex.cloud,[23,21,1500,384],7,stop-11,-.95,.8,group,1.65);art(tex.post,[552,45,498,471],5,stop-11,.5,1.7,group);deliveries.push(art(tex.post,parcelRect,.65,stop-13,.82,3.6,group));const bird=art(tex.post,[1108,556,313,233],.95,stop-9,3.6,2.2,group);bird.userData.baseX=stop-9;birds.push(bird);}
 for(const x of [21,51,80,109,138])art(tex.post,[652,522,331,495],3,x,height(x,'postal')-.1,.9,group);
 art(tex.post,[20,16,500,497],6.5,165,-.1,1.5,group);
 for(let i=0;i<3;i++){const b=art(tex.post,[1140,0,346,519],3.2,152+i*5,2.6,1.8,group);balloons.push(b);}
 const wagonArt=art(tex.animals,[1030,185,483,279],5.3,0,-.13,3,wagon);wagonArt.name='post-wagon';
 for(let i=0;i<7;i++)cargo.push(art(tex.post,parcelRect,.68,0,0,2.96,group));
 const lever=art(tex.post,[1331,719,178,273],.7,1.65,.9,3.18,wagon);lever.name='post-lever';
 const halo=new T.Mesh(new T.RingGeometry(.63,.7,40),new T.MeshBasicMaterial({color:0xffd457,transparent:true,depthWrite:false}));halo.position.set(1.65,1.6,3.2);wagon.add(halo);
 const target=new T.Mesh(new T.PlaneGeometry(2.6,2.6),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));target.position.set(1.65,1.6,3.3);target.userData.action='postLever';wagon.add(target);
 const chute=art(tex.post,[20,622,591,322],7,0,.15,3.1,group,2.8),moving=art(tex.post,parcelRect,.72,0,0,4.1,group);
 const launchTimes=[null,null,null];let previousDone=0;
 function update(m,dt){const active=m.level===4;group.visible=active;wagonArt.visible=active;lever.visible=active;target.visible=active&&m.phase==='dispatchReady';halo.visible=target.visible;if(!active)return;
  if(m.done<previousDone)launchTimes.fill(null);previousDone=m.done;
  halo.scale.setScalar(1+Math.sin(m.time*4)*.08);lever.rotation.z=m.phase==='dispatching'?-.45:0;
  const sending=m.phase==='dispatching',stop=38+Math.max(0,m.task-1)*28,load=[0,3,5,7][Math.min(3,m.done)],launched=Math.max(0,m.done-7),remaining=load-m.postDelivered-launched-(sending?1:0);
  const loading=m.task===0&&m.phase==='building',elapsed=loading?6-m.timer:0;
  const old=loading?[0,3,5][m.done-1]:load,batch=load-old,slot=loading?Math.min(batch-1,Math.floor(elapsed/1.65)):0,local=elapsed-slot*1.65;
  const worker=loading?(old+slot)%2:m.done%2;
  for(let j=0;j<2;j++){const h=helpers[j],working=j===worker;h.position.x=working?-3.15:-5.15;h.position.y=.15+(j===0?1.65*494/342:1.8*470/385)/2;h.rotation.z=loading&&working&&local<.5?-.16*Math.sin(local/.5*Math.PI):0;}
  handParcel.visible=m.task===0&&(!loading||local<.5);handParcel.position.set(-2.7,1.55,3.7);
  if(loading&&local<.5)handParcel.position.lerp(new T.Vector3(-2,1.9,3.7),local/.5);
  const retract=m.task>0?1:loading&&m.done===3?T.MathUtils.clamp((elapsed-4.4)/1.4,0,1):0;
  loadingBelt.scale.x=1-.92*retract;loadingBelt.position.x=1-3.2*retract;
  for(let i=0;i<7;i++){const c=cargo[i];c.visible=i<remaining;const pos=new T.Vector3(-1.55+(i%4)*1.02,2.93+Math.floor(i/4)*.5,2.96);wagon.localToWorld(pos);c.position.copy(pos);c.rotation.z=wagon.rotation.z;
   if(loading&&i>=old){const t=elapsed-(i-old)*1.65;c.visible=t>=.5;
    if(t>=.5&&t<1.35){const u=(t-.5)/.85;c.position.set(T.MathUtils.lerp(-2,3.3,u),T.MathUtils.lerp(1.9,3.35,u),3.4);c.rotation.z=0;}
    else if(t>=1.35&&t<1.65){const u=(t-1.35)/.3;c.position.lerp(new T.Vector3(3.3,3.35,3.4),1-u);}
   }
  }
  chute.visible=target.visible||sending;chute.position.x=stop-9.9;
  moving.visible=sending;if(sending){const t=1-m.timer/1.8;moving.position.set(T.MathUtils.lerp(stop-6.9,stop-13,Math.min(1,t/.8)),t<.8?T.MathUtils.lerp(3,1.7,t/.8):T.MathUtils.lerp(1.7,.82,(t-.8)/.2),4.1);}
  for(let i=0;i<4;i++)deliveries[i].visible=m.postDelivered>i;
  for(let i=0;i<3;i++){if(m.done>7+i&&launchTimes[i]===null)launchTimes[i]=m.time;const age=launchTimes[i]===null?0:m.time-launchTimes[i];balloons[i].position.set(152+i*5+age*.45,5+age*1.2+Math.sin(m.time+i)*.08,1.8);}
  for(const b of birds){const awake=m.birdPulse>0&&Math.abs(m.x-b.userData.baseX)<18;b.position.x=b.userData.baseX+(awake?Math.sin(m.time*5)*.35:0);b.position.y=4+(awake?Math.abs(Math.sin(m.time*7))*.8:Math.sin(m.time)*.025);b.rotation.z=awake?Math.sin(m.time*8)*.12:0;}
 }
 return {group,update,target,wagonArt,lever};
}
