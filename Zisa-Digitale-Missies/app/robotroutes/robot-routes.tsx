'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowDown,ArrowLeft,ArrowRight,ArrowUp,Bot,Check,ChevronLeft,ChevronRight,House,Play,Plus,RotateCcw,Square,Star,Trash2,Volume2,BrickWall} from 'lucide-react';
import Listen from '@/components/listen';
import {Direction,Point,levels,same,step} from './routes';
const icons={up:ArrowUp,right:ArrowRight,down:ArrowDown,left:ArrowLeft};
const names={up:'Omhoog',right:'Rechts',down:'Omlaag',left:'Links'};
const MAX_STEPS=40;
type Result='idle'|'running'|'success'|'short'|'edge'|'wall'|'stopped';
export default function RobotRoutes(){
 const [levelIndex,setLevelIndex]=useState(0);const level=levels[levelIndex];
 const [plan,setPlan]=useState<Direction[]>([]);const [selected,setSelected]=useState<number|null>(null);
 const [position,setPosition]=useState<Point>(level.start);const [trail,setTrail]=useState<Point[]>([level.start]);
 const [result,setResult]=useState<Result>('idle');const [active,setActive]=useState(-1);const [completed,setCompleted]=useState<number[]>([]);const [notice,setNotice]=useState('');
 const [speechAvailable,setSpeechAvailable]=useState(false);const activeButton=useRef<HTMLButtonElement|null>(null);const sequenceRef=useRef<HTMLDivElement|null>(null);const boardRef=useRef<HTMLDivElement|null>(null);
 const running=result==='running';
 useEffect(()=>{setSpeechAvailable('speechSynthesis' in window);return()=>{if('speechSynthesis' in window)window.speechSynthesis.cancel();};},[]);
 useEffect(()=>{
  if(!running)return;
  const timer=setTimeout(()=>{
   const index=active+1;
   if(index>=plan.length){const won=same(position,level.goal);setResult(won?'success':'short');if(won)setCompleted(previous=>previous.includes(levelIndex)?previous:[...previous,levelIndex]);return;}
   const next=step(level,position,plan[index]);setActive(index);
   if(next.error){setResult(next.error);return;}
   setPosition(next.position);setTrail(previous=>[...previous,next.position]);
  },active===-1?400:800);
  return()=>clearTimeout(timer);
 },[running,active,position,plan,level,levelIndex]);
 useEffect(()=>{const button=activeButton.current;const box=sequenceRef.current;if(running&&button&&box){const top=button.offsetTop;if(top<box.scrollTop||top+button.offsetHeight>box.scrollTop+box.clientHeight)box.scrollTo({top:Math.max(0,top-10),behavior:'smooth'});}},[active,running]);
 function resetPosition(){setResult('idle');setActive(-1);setPosition(level.start);setTrail([level.start]);setNotice('');}
 function changeLevel(index:number){if(index<0||index>=levels.length)return;setLevelIndex(index);setPlan([]);setSelected(null);setResult('idle');setActive(-1);setPosition(levels[index].start);setTrail([levels[index].start]);setNotice('');if(speechAvailable)window.speechSynthesis.cancel();}
 function add(direction:Direction){if(running)return;if(selected===null&&plan.length>=MAX_STEPS){setNotice('Je plan is vol. Wis een stap of verander een pijl.');return;}resetPosition();setPlan(previous=>selected===null?[...previous,direction]:previous.map((d,i)=>i===selected?direction:d));if(selected!==null)setSelected(null);}
 function remove(){if(running||!plan.length)return;resetPosition();const index=selected??plan.length-1;setPlan(previous=>previous.filter((_,i)=>i!==index));setSelected(null);}
 function run(){if(!plan.length||running)return;resetPosition();setSelected(null);setResult('running');if(window.matchMedia('(max-width:700px)').matches)boardRef.current?.scrollIntoView({behavior:'smooth',block:'start'});}
 function speak(){if(!speechAvailable)return;window.speechSynthesis.cancel();const message=new SpeechSynthesisUtterance('Breng de robot naar de ster. Maak eerst je plan met de pijlen. Elke pijl is één vakje. De pijlen wijzen naar de rand van het scherm. Druk daarna op Laat de robot stappen.');message.lang='nl-BE';message.rate=.85;const voices=window.speechSynthesis.getVoices();const voice=voices.find(v=>v.lang==='nl-BE')??voices.find(v=>v.lang.startsWith('nl'));if(voice)message.voice=voice;window.speechSynthesis.speak(message);}
 const feedback=result==='success'?'Gelukt! Je robot staat op de ster.':result==='edge'?`Oeps! Stap ${active+1} gaat buiten het veld. Verander die pijl.`:result==='wall'?`Oeps! Bij stap ${active+1} staat een blok. Zoek een weg eromheen.`:result==='short'?'Je plan is klaar, maar je bent nog niet bij de ster. Pas je plan aan.':result==='stopped'?'Gestopt. Je kunt je plan aanpassen.':running?`De robot volgt je plan. ${active>=0?`Stap ${active+1} van ${plan.length}.`:''}`:'Maak je plan. Laat de robot daarna stappen.';
 return <div className="robot-app"><header className="robot-header"><a className="robot-brand" href="/"><Bot size={32}/><div><strong>Robotroutes</strong><small>Zisa’s digitale missies</small></div></a><a className="robot-home" href="/"><House size={23}/> Missies</a></header>
 <main className="robot-main"><div className="robot-lesson-nav"><button onClick={()=>changeLevel(levelIndex-1)} disabled={levelIndex===0||running} aria-label="Vorige opdracht"><ChevronLeft/></button><div><span>Opdracht {levelIndex+1} van {levels.length}</span><h1>{level.name}</h1></div><button onClick={()=>changeLevel(levelIndex+1)} disabled={levelIndex===levels.length-1||running} aria-label="Volgende opdracht"><ChevronRight/></button></div>
 <div className="robot-instruction"><span>Breng de robot naar de <Star size={25} fill="currentColor" aria-label="ster"/>.</span><Listen text="Breng de robot naar de ster. Maak eerst je plan met de pijlen. Elke pijl is één vakje. De pijlen wijzen naar de rand van het scherm. Druk daarna op Laat de robot stappen." label="Luister naar de opdracht"/></div>
 <div className="robot-workspace"><section className="robot-field-panel" aria-label="Robotveld"><p>Elke pijl is één vakje.</p><div ref={boardRef} className="robot-board" role="img" aria-label={`Veld van ${level.cols} kolommen en ${level.rows} rijen. Robot op kolom ${position.x+1}, rij ${position.y+1}. Ster op kolom ${level.goal.x+1}, rij ${level.goal.y+1}.`} style={{gridTemplateColumns:`repeat(${level.cols},minmax(0,1fr))`,gridTemplateRows:`repeat(${level.rows},minmax(0,1fr))`,aspectRatio:`${level.cols} / ${level.rows}`}}>
 {Array.from({length:level.cols*level.rows},(_,i)=>{const cell={x:i%level.cols,y:Math.floor(i/level.cols)};const wall=level.walls.some(w=>same(w,cell));return <div key={i} className={`robot-cell ${wall?'blocked':''} ${trail.some(t=>same(t,cell))?'visited':''} ${same(cell,level.start)?'start':''}`}>{wall?<BrickWall aria-hidden="true"/>:same(cell,level.goal)?<Star className="goal-star" fill="currentColor" aria-hidden="true"/>:same(cell,level.start)?<span className="start-dot"/>:null}</div>;})}
 <div className={`robot-piece ${running&&active>=0?'walking':''} ${result==='success'?'won':''}`} style={{width:`${100/level.cols}%`,height:`${100/level.rows}%`,left:`${position.x*100/level.cols}%`,top:`${position.y*100/level.rows}%`}}><span><img src="/robot-vriendje.png" alt="" draggable={false}/></span></div>
 </div><div className="robot-legend"><span><Bot size={20}/> Start</span><span><Star size={20} fill="currentColor"/> Doel</span>{level.walls.length>0&&<span><BrickWall size={20}/> Blok</span>}</div></section>
 <section className="robot-plan-panel" aria-label="Jouw stappenplan"><div className="robot-plan-title"><h2>Jouw plan</h2><span>{plan.length} / {MAX_STEPS}</span></div><div ref={sequenceRef} className="robot-sequence" aria-label="Geplande stappen">{plan.length===0?<span className="robot-plan-empty"><Plus size={28}/> Tik hieronder op de pijlen.</span>:plan.map((direction,index)=>{const Icon=icons[direction];return <button key={index} ref={active===index?activeButton:undefined} disabled={running} onClick={()=>setSelected(selected===index?null:index)} aria-label={`Stap ${index+1}: ${names[direction]}`} aria-pressed={selected===index} className={`${selected===index?'selected':''} ${active===index?'active':''} ${active===index&&(result==='edge'||result==='wall')?'failed':''}`}><small>{index+1}</small><Icon size={27}/></button>;})}</div>
 <p className="robot-edit-hint">{selected===null?'Tik op een stap om die te veranderen.':`Verander stap ${selected+1}: kies een andere pijl.`}</p>
 <div className="robot-arrows" aria-label="Kies een richting">{(['up','left','down','right'] as Direction[]).map(direction=>{const Icon=icons[direction];return <button className={`direction-${direction}`} key={direction} onClick={()=>add(direction)} disabled={running} aria-label={names[direction]}><Icon size={36}/></button>;})}</div>
 <div className="robot-edit-buttons"><button onClick={()=>setSelected(null)} disabled={running||selected===null}><Plus size={20}/> Achteraan</button><button onClick={remove} disabled={running||!plan.length}><Trash2 size={20}/> Wis stap</button><button onClick={()=>{resetPosition();setPlan([]);setSelected(null);}} disabled={running||!plan.length} aria-label="Wis het hele plan"><RotateCcw size={20}/> Wis alles</button></div>
 <div className="robot-feedback" role="status" data-result={result}>{result==='success'&&<Check size={24}/>}<span>{notice||feedback}</span><Listen text={notice||feedback} label="Luister naar de uitleg"/></div>
 {running?<button className="robot-run robot-stop" onClick={()=>{setResult('stopped');setActive(-1);setPosition(level.start);setTrail([level.start]);}}><Square size={23} fill="currentColor"/> Stop</button>:<button className="robot-run" onClick={run} disabled={!plan.length}><Play size={24} fill="currentColor"/> {result==='idle'?'Laat de robot stappen':'Test opnieuw'}</button>}
 {result==='success'&&(levelIndex<levels.length-1?<button className="robot-next" onClick={()=>changeLevel(levelIndex+1)}>Volgende opdracht <ArrowRight size={23}/></button>:<div className="robot-finished"><Star fill="currentColor"/> Laatste route gelukt! <a href="/">Naar de missies <ArrowRight size={20}/></a></div>)}
 <details className="robot-help"><summary>Denkhulp</summary><p>Wijs de route eerst met je vinger aan. Tel de vakjes. Elke pijl is één stap naar de rand van het scherm: ↑ boven, → rechts, ↓ onder, ← links. De robot hoeft niet eerst te draaien.</p><p>Een blok? Ga eromheen. Je mag elke vrije route kiezen. Je plan klopt als de robot na de laatste pijl op de ster staat.</p></details>
 </section></div>
 <nav className="robot-levels" aria-label="Kies een opdracht">{levels.map((l,i)=><button key={l.name} disabled={running} onClick={()=>changeLevel(i)} aria-label={`Opdracht ${i+1}: ${l.name}${completed.includes(i)?', gelukt':''}`} aria-current={i===levelIndex?'step':undefined} className={completed.includes(i)?'completed':''}>{i+1}{completed.includes(i)&&<Check size={13}/>}</button>)}</nav>
 </main></div>;
}
