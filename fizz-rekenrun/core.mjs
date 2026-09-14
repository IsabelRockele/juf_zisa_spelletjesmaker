// Deterministic gameplay shared by the renderer and simulation checks.
export const BODY={width:.68,height:1.9},GRAVITY=29,JUMP=11.8,MAX_SPEED=8.2;
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function rng(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
export function question(tables,operation,random=Math.random){const a=tables[Math.floor(random()*tables.length)],b=1+Math.floor(random()*10),kind=operation==='mix'?(random()<.5?'mul':'div'):operation,answer=kind==='mul'?a*b:b;const answers=new Set([answer]);let tries=0;while(answers.size<3&&tries++<100){const n=kind==='mul'?answer+(Math.floor(random()*7)-3)*a:1+Math.floor(random()*10);if(n>0&&n!==answer)answers.add(n)}for(let n=1;answers.size<3;n++)answers.add(n);const choices=[...answers];for(let i=choices.length-1;i;i--){const j=Math.floor(random()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]]}return {a,b,kind,answer,choices,text:kind==='mul'?`${a} × ${b}`:`${a*b} ÷ ${a}`,hint:kind==='mul'?`Denk aan ${b} groepjes van ${a}.`:`${a} × welk getal is ${a*b}?`}}
export const WORLDS=[
 {name:'Watervalvallei',widths:[40,32,36,31,38,32,35,33,37,35],heights:[0,.4,0,.6,.2,.8,.4,0,.5,0],gaps:[2.4,2.8,2.5,3,2.6,2.8,3,2.6,2.8],springAt:[1,4,7],spikeAt:[2,5,8],tint:0xffffff},
 {name:'Kristalgrotten',widths:[40,37,30,38,32,40,31,38,33,36],heights:[0,-.4,-.8,-.2,.5,0,-.5,.1,.7,.2],gaps:[2.8,3,2.5,3.1,2.6,3.2,2.7,3,2.5],springAt:[2,5,8],spikeAt:[1,3,6,7],tint:0xbcd8ff},
 {name:'Wolkenroute',widths:[40,30,32,29,34,30,31,34,31,35],heights:[0,.7,1.4,2,2.8,3.3,4.1,4.6,5.3,6],gaps:[2.6,2.5,2.7,2.5,2.8,2.6,2.7,2.6,2.5],springAt:[1,3,6,8],spikeAt:[2,4,7],tint:0xf5ffff},
 {name:'Zonnekloof',widths:[40,30,36,32,40,30,37,31,39,34],heights:[0,.6,-.2,.4,-.5,.2,1,.3,.9,.2],gaps:[3.2,2.8,3.3,2.7,3.1,2.6,3.2,2.8,3],springAt:[2,4,7],spikeAt:[1,3,5,6,8],tint:0xffe0ac},
 {name:'Sterrenkasteel',widths:[40,34,30,32,31,35,30,33,31,36],heights:[0,.8,1.4,.8,1.6,2.2,1.6,2.4,3,3.5],gaps:[2.8,2.6,3.2,2.7,2.6,3.3,2.6,2.8,2.7],springAt:[1,4,6,8],spikeAt:[2,3,5,7],tint:0xe5d4ff}
];
export function course(level=0){
 const config=WORLDS[level],terrain=[];let left=-10;const gaps=config.gaps.map((g,i)=>level===2&&[2,5,7].includes(i)?8:g);
 config.widths.forEach((width,i)=>{terrain.push({left,right:left+width,y:config.heights[i],ground:true});left+=width+(gaps[i]||0)});
 const gates=terrain.map((b,i)=>({x:i===0?18:b.left+8,y:b.y,index:i,end:(i===0?18:b.left+8)+9}));
 const spikes=config.spikeAt.map(i=>({x:gates[i].end+5,y:terrain[i].y,w:level>=3?1.5:1.2}));
 const springs=[],ledges=[],coins=[];
 config.springAt.forEach((i,si)=>{const b=terrain[i],x=gates[i].end+2.4;const upper={left:x+1.4,right:b.right+.8,y:b.y+3.35,ground:false,bonus:true};springs.push({x,y:b.y,targetX:upper.right-1,targetY:upper.y});ledges.push(upper);for(let cx=upper.left+.5;cx<upper.right-.5;cx+=1.1)coins.push({x:cx,y:upper.y+.85,bonus:false});coins.push({x:upper.right-1,y:upper.y+1,bonus:true});if(si===0)coins.push({x:upper.left+.6,y:upper.y+1.7,bonus:false,heart:true});const flight=.8;for(let j=1;j<=4;j++){const t=flight*j/5;coins.push({x:x+MAX_SPEED*t,y:b.y+16*t-GRAVITY*t*t/2+.9,bonus:false})}});
 for(const b of terrain){for(let x=Math.max(4,b.left+1.3);x<b.right-1;x+=2.2){if(gates.some(g=>x>g.x-2&&x<g.end+1))continue;if(spikes.some(s=>Math.abs(x-s.x)<1.2))continue;coins.push({x,y:b.y+1,bonus:false})}}
 for(let i=0;i<terrain.length-1;i++){const a=terrain[i],b=terrain[i+1];coins.push({x:(a.right+b.left)/2,y:Math.max(a.y,b.y)+2.2,bonus:false})}
 const moving=[],hazards=[],boosts=[];
 if(level===0)for(const i of [1,3,6])boosts.push({x:gates[i].end+2,y:terrain[i].y,id:i});
 if(level===1)for(const i of [1,3,4,6,8])hazards.push({kind:'crystal',x:gates[i].end+5,y:terrain[i].y,phase:i*.71,period:2.4+(i%3)*.43});
 if(level===2)for(const i of [2,5,7]){const a=terrain[i],b=terrain[i+1],center=(a.right+b.left)/2;moving.push({id:'cloud-'+i,moving:true,ground:false,baseX:center,baseY:Math.min(a.y,b.y)+.45,amplitude:2.2,phase:i,period:6,left:center-1.9,right:center+1.9,y:Math.min(a.y,b.y)+.45,dx:0,gap:i})}
 const rockSegments=level===3?[1,2,3,4,5,6,7,8]:level===1?[2,5,7]:level===4?[2,4,7]:[];for(const i of rockSegments){hazards.push({kind:'rock',x:gates[i].end+6,y:terrain[i].y,phase:i*.61,period:3.5+(i%3)*.4,amplitude:1.8});const spike=spikes.findIndex(s=>Math.abs(s.x-(gates[i].end+5))<.1);if(spike>=0)spikes.splice(spike,1);}
 if(level===4)for(const i of [1,3,6,8])hazards.push({kind:'laser',x:gates[i].end+4,y:terrain[i].y,phase:i*.4,period:3.2});
 return {terrain,platforms:[...terrain,...ledges,...moving],moving,hazards,boosts,time:0,gates,spikes,springs,coins,finish:terrain.at(-1).right-3,level,name:config.name,tint:config.tint};
}
export const WORLD_RULES=[
 'Turbostroken geven je extra snelheid. Spring op tijd!',
 'Kristallen vallen uit het plafond. Kies zelf je moment om door te lopen.',
 'Spring op de bewegende wolken. Laat je meevoeren naar de overkant.',
 'Rollende rotsen komen op je af. Spring erover of neem het hoge pad.',
 'Magische poorten gaan open en dicht. Kies je moment om erdoor te lopen.'
];
export function hazardState(h,time){const phase=((time+h.phase)%h.period+h.period)%h.period;
 if(h.kind==='crystal'){const dropping=phase<1.05;return {x:h.x,y:h.y+9-8.2*phase*phase,danger:dropping,visible:dropping,warning:false,remaining:h.period-phase,phase}}
 if(h.kind==='rock')return {x:h.x+Math.sin((time+h.phase)*Math.PI*2/h.period)*h.amplitude,y:h.y+.65,danger:true,warning:false,remaining:0,phase};
 return {x:h.x,y:h.y+1.6,danger:phase<1.3,warning:false,remaining:phase<1.3?1.3-phase:h.period-phase,phase}
}
export function updateWorld(map,time){map.time=time;for(const p of map.moving){const width=p.right-p.left,old=(p.left+p.right)/2,center=p.baseX+Math.sin((time+p.phase)*Math.PI*2/p.period)*p.amplitude;p.left=center-width/2;p.right=center+width/2;p.dx=center-old}}
export function newRunner(){return {x:2,y:0,vx:0,vy:0,grounded:true,coyote:.12,jumpBuffer:0,face:1,checkpoint:{x:2,y:0},progress:0,score:0,coins:0,streak:0,solved:0,firstTry:0,wrong:new Set(),answerMistakes:new Map(),taken:new Set(),invincible:0,boost:0,usedBoosts:new Set(),support:null,springCooldown:0,activeGate:-1,lifeNotice:'',lifeNoticeTime:0,feedback:'',feedbackTime:0,bump:0,finished:false,dead:false,lives:3,time:0}}
export function respawn(p){p.x=p.checkpoint.x;p.y=p.checkpoint.y+.1;p.vx=0;p.vy=0;p.invincible=1.8;p.boost=0;p.jumpBuffer=0;p.activeGate=-1;p.cloudAim=null;p.feedback=`Een leven kwijt. Nog ${p.lives} ${p.lives===1?'leven':'levens'}!`;p.feedbackTime=2.5}
export function loseLife(p,reason){if(p.dead)return [];p.lives=Math.max(0,p.lives-1);p.lifeNotice='−1 ♥ · Nog '+p.lives+' van 3';p.lifeNoticeTime=3;p.streak=0;if(p.lives===0){p.dead=true;p.activeGate=-1;p.vx=0;p.vy=0;p.feedback='Je levens zijn op.';return [{type:reason},{type:'dead'}]}respawn(p);return [{type:reason}]}
export function advance(p,input,dt,map,questions){const events=[];if(p.finished||p.dead)return events;p.time+=dt;if(p.grounded&&p.support){const ride=map.moving.find(b=>b.id===p.support);if(ride)p.x+=ride.dx}for(const key of ['invincible','boost','springCooldown','feedbackTime','lifeNoticeTime','bump'])p[key]=Math.max(0,p[key]-dt);p.coyote=p.grounded?.13:Math.max(0,p.coyote-dt);p.jumpBuffer=input.jump?.15:Math.max(0,p.jumpBuffer-dt);const dir=clamp(input.axis||0,-1,1),max=p.boost>0?13.5:MAX_SPEED;const target=dir*max,accel=p.grounded?48:32;p.vx+=clamp(target-p.vx,-accel*dt,accel*dt);if(dir)p.face=Math.sign(dir);if(p.jumpBuffer>0&&p.coyote>0){p.vy=JUMP;p.grounded=false;p.coyote=0;p.jumpBuffer=0;events.push({type:'jump'})}const ox=p.x,oy=p.y;p.x=Math.max(-2,p.x+p.vx*dt);p.vy-=GRAVITY*dt;p.y+=p.vy*dt;p.grounded=false;p.support=null;
 for(const b of map.platforms){if(p.x+BODY.width/2>b.left&&p.x-BODY.width/2<b.right&&p.vy<=0&&oy>=b.y-.035&&p.y<=b.y){p.y=b.y;p.vy=0;p.grounded=true;p.support=b.id||null}}
 // Active arithmetic gate: jump from below into one of its answer blocks.
 const gate=map.gates[p.progress];p.activeGate=gate&&p.x>gate.x-6?gate.index:-1;
 if(gate){p.x=Math.min(p.x,gate.end-.7);if(p.activeGate>=0&&p.vy>0){for(let i=0;i<3;i++){const bx=gate.x+i*3,underside=gate.y+2.65;if(Math.abs(p.x-bx)<.85&&oy+BODY.height<=underside+.05&&p.y+BODY.height>=underside){events.push({type:'answer',choice:i,gate:gate.index});p.vy=-1.2;p.y=underside-BODY.height-.03;p.bump=.23;break}}}}
 if(p.y<-7){events.push(...loseLife(p,'fall'));return events}
 for(let i=0;i<map.coins.length;i++){const c=map.coins[i];if(!p.taken.has(i)&&Math.abs(p.x-c.x)<.6&&Math.abs(p.y+.9-c.y)<1.1){p.taken.add(i);if(c.heart){const full=p.lives===3;p.lives=Math.min(3,p.lives+1);p.score+=full?25:0;p.lifeNotice=full?'♥ Al 3 van 3 · +25 punten':'+1 ♥ · Nu '+p.lives+' van 3';p.lifeNoticeTime=3;p.feedback=full?'Alle levens vol! +25 punten':'Een extra leven!';p.feedbackTime=2.5;events.push({type:'heart',x:c.x,y:c.y})}else{p.score+=c.bonus?100:10;p.coins++;if(c.bonus){p.feedback='BONUSKRISTAL! +100 punten';p.feedbackTime=2.5}events.push({type:'coin',x:c.x,y:c.y,bonus:c.bonus})}}}
 if(p.invincible<=0){for(const s of map.spikes){if(Math.abs(p.x-s.x)<s.w/2+.25&&p.y<s.y+.65&&p.y>=s.y-.5){events.push(...loseLife(p,'hit'));return events}}}
 if(p.invincible<=0){for(const h of map.hazards){const hs=hazardState(h,map.time);const near=Math.abs(p.x-hs.x)<(h.kind==='rock'?.8:.7);const vertical=h.kind==='laser'?p.y<h.y+3.3&&p.y+BODY.height>h.y:h.kind==='crystal'?p.y<hs.y+.9&&p.y+BODY.height>hs.y-.9:p.y<h.y+1.35&&p.y+BODY.height>h.y;if(hs.danger&&near&&vertical){events.push(...loseLife(p,'hit'));return events}}}
 for(const b of map.boosts){if(!p.usedBoosts.has(b.id)&&Math.abs(p.x-b.x)<.7&&Math.abs(p.y-b.y)<.25){p.usedBoosts.add(b.id);p.boost=2.5;p.feedback='TURBO! Houd rechts vast en spring op tijd!';p.feedbackTime=2;events.push({type:'boost',x:b.x,y:b.y})}}
 for(const s of map.springs){if(p.springCooldown<=0&&Math.abs(p.x-s.x)<.65&&p.y<s.y+.25&&p.y>=s.y-.1&&p.vy<=0){p.vy=16;p.grounded=false;p.coyote=0;p.springCooldown=.6;p.feedback='Houd rechts vast: boven ligt een bonusplatform!';p.feedbackTime=2.5;events.push({type:'spring',x:s.x,y:s.y})}}
 if(p.progress===map.gates.length&&p.x>=map.finish){p.finished=true;events.push({type:'finish'})}return events}
export function choose(p,index,map,questions){const g=map.gates[p.progress];if(p.dead||p.finished||!g||p.activeGate!==g.index||p.bump>.24)return null;const q=questions[g.index];if(q.choices[index]!==q.answer){p.wrong.add(g.index);const mistakes=(p.answerMistakes.get(g.index)||0)+1;p.answerMistakes.set(g.index,mistakes);p.streak=0;const lifeLost=mistakes>=2;if(lifeLost){p.lives=Math.max(0,p.lives-1);p.lifeNotice='−1 ♥ · Nog '+p.lives+' van 3';p.lifeNoticeTime=3;if(p.lives===0){p.dead=true;p.activeGate=-1;p.vx=0;p.vy=0}}p.feedback=p.dead?'Je levens zijn op.':lifeLost?`Weer fout: 1 leven kwijt. ${q.hint}`:`Eerste fout: je behoudt je levens. ${q.hint}`;p.feedbackTime=4;return {type:'wrong',index,lifeLost,dead:p.dead,mistakes}}p.firstTry+=p.wrong.has(g.index)?0:1;p.streak=p.wrong.has(g.index)?0:p.streak+1;const points=p.wrong.has(g.index)?60:100+(p.streak%3===0?100:0);p.score+=points;p.progress++;p.solved++;p.activeGate=-1;p.checkpoint={x:g.end-1,y:g.y};p.boost=0;p.feedback=p.streak&&p.streak%3===0?'COMBO! +200 punten!':'Goed! De poort is open. Verder naar rechts!';p.feedbackTime=2.4;return {type:'correct',index,points,x:g.x+index*3,y:g.y+3.1}}

export function computerInput(p,map,questions,dt,difficulty='easy'){
 if(p.dead||p.finished)return {axis:0,jump:false};let axis=1,jump=false;const g=map.gates[p.progress];
 if(g&&p.x>g.x-5){const target=g.x+questions[g.index].choices.indexOf(questions[g.index].answer)*3;axis=clamp((target-p.x)*4-p.vx*.8,-1,1);if(Math.abs(p.x-target)<.2&&Math.abs(p.vx)<.4&&p.grounded){p.thinking=(p.thinking||0)+dt;jump=p.thinking>({easy:12,normal:7,hard:3.5}[difficulty])}else if(p.thoughtGate!==p.progress){p.thinking=0;p.thoughtGate=p.progress}return {axis,jump}}
 p.thinking=0;p.thoughtGate=p.progress;
 if(p.cloudAim&&!p.grounded){const cloud=map.moving.find(b=>b.id===p.cloudAim);if(cloud)return {axis:clamp(((cloud.left+cloud.right)/2-p.x)*2.5-p.vx*.6,-1,1),jump:false}}
 const surface=map.platforms.filter(b=>p.x>=b.left-.1&&p.x<=b.right+.1&&Math.abs(p.y-b.y)<.12).sort((a,b)=>b.y-a.y)[0];
 if(surface&&p.grounded){const next=map.terrain.find(b=>b.left>p.x);if(surface.moving){p.cloudAim=null;if(next&&next.left-p.x<4.2){axis=1;jump=true}else axis=clamp(((surface.left+surface.right)/2-p.x)*3-p.vx*.8,-1,1)}else if(surface.right-p.x<(p.boost>0?2.1:1.6)){const nextGround=map.terrain.find(b=>b.left>surface.right);const cloud=map.moving.find(b=>b.baseX>surface.right&&nextGround&&b.baseX<nextGround.left);if(cloud){if(cloud.left-p.x<3){jump=true;p.cloudAim=cloud.id}else axis=clamp((surface.right-1.3-p.x)*4-p.vx*.8,-1,1)}else jump=true}}
 if(map.spikes.some(s=>s.x-p.x>0&&s.x-p.x<2.3)&&p.grounded)jump=true;
 for(const h of map.hazards){const hs=hazardState(h,map.time);if(hs.x>p.x-.2&&hs.x-p.x<4&&p.y<h.y+2.5){if(h.kind==='rock'){if(hs.x-p.x<2.6&&p.grounded)jump=true}else{const wait=h.kind==='laser'?(hs.danger||hs.remaining<.8):(hs.danger||hs.warning);if(wait)axis=clamp((h.x-2-p.x)*4-p.vx*.8,-1,1)}}}
 return {axis,jump};
}
