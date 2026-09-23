import { Globe, Search, BookOpen, ShieldCheck, LockKeyhole, HeartHandshake, Star, ArrowRight, GraduationCap, House, LayoutGrid, Palette, Pause, Pencil, Play, Square, Sun } from 'lucide-react';
import './missions.css';
import MissionGrid from './mission-grid';
import {missions} from './ontdekken/lessons';
import {Tablet,HandHeart,Keyboard,FolderOpen,PencilRuler,Bot,Heart} from 'lucide-react';
const extraIcons:Record<string,typeof Tablet>={tablet:Tablet,care:HandHeart,keyboard:Keyboard,folder:FolderOpen,tools:PencilRuler,robot:Bot,heart:Heart};
const extraColors:Record<string,string>={blue:'watch',green:'draw',purple:'robot',yellow:'safe',orange:'lookup'};

export default function Home(){return <div className="missions-home">
  <header className="missions-header"><div className="missions-brand"><span><LayoutGrid size={26}/></span><strong>Zisa’s digitale missies</strong></div><a className="missions-teacher" href="/doelen"><GraduationCap size={22}/><span>Leerkracht</span></a></header>
  <main className="missions-main"><h1>Kies je missie</h1><MissionGrid>
    <a href="/atelier.html" className="mission-choice mission-draw" aria-label="Tekenen">
      <div className="mission-picture" aria-hidden="true"><div className="drawing-paper"><Sun className="picture-sun" size={51}/><House className="picture-house" size={100} strokeWidth={2.2}/><span className="picture-grass"/></div><Pencil className="picture-pencil" size={115} strokeWidth={1.8}/><Palette className="picture-palette" size={68} strokeWidth={1.8}/></div>
      <div className="mission-caption"><h2>Tekenen</h2><span className="mission-go"><ArrowRight size={30}/></span></div>
    </a>
    <a href="/kijken" className="mission-choice mission-watch" aria-label="Filmpjes bedienen">
      <div className="mission-picture" aria-hidden="true"><div className="picture-screen"><Play size={78} fill="currentColor" strokeWidth={1.5}/><div className="picture-timeline"><span/></div></div><div className="picture-controls"><span><Play size={30} fill="currentColor"/></span><span><Pause size={30} fill="currentColor"/></span><span><Square size={26} fill="currentColor"/></span></div></div>
      <div className="mission-caption"><h2>Filmpjes bedienen</h2><span className="mission-go"><ArrowRight size={30}/></span></div>
    </a>
    <a href="/robotroutes" className="mission-choice mission-robot" aria-label="Robotroutes">
      <div className="mission-picture robot-mission-picture" aria-hidden="true"><img className="mission-robot-image" src="/robot-vriendje.png" alt=""/><div className="robot-mission-path"><ArrowRight size={35}/><ArrowRight size={35}/><Star size={55} fill="currentColor"/></div></div>
      <div className="mission-caption"><h2>Robotroutes</h2><span className="mission-go"><ArrowRight size={30}/></span></div>
    </a>
    <a href="/veilig" className="mission-choice mission-safe" aria-label="Veilig met media"><div className="mission-picture safe-mission-picture" aria-hidden="true"><ShieldCheck size={130}/><div><LockKeyhole size={48}/><HeartHandshake size={53}/></div></div><div className="mission-caption"><h2>Veilig met media</h2><span className="mission-go"><ArrowRight size={30}/></span></div></a>
    <a href="/zoeken" className="mission-choice mission-search" aria-label="Slim zoeken"><div className="mission-picture search-mission-picture" aria-hidden="true"><Search size={125}/><BookOpen size={74}/></div><div className="mission-caption"><h2>Slim zoeken</h2><span className="mission-go"><ArrowRight size={30}/></span></div></a>
    <a href="/opzoeken" className="mission-choice mission-lookup" aria-label="Zelf opzoeken"><div className="mission-picture search-mission-picture" aria-hidden="true"><BookOpen size={125}/><Globe size={74}/></div><div className="mission-caption"><h2>Zelf opzoeken</h2><span className="mission-go"><ArrowRight size={30}/></span></div></a>
    {missions.map(m=>{const Icon=extraIcons[m.icon];return <a href={'/ontdekken?missie='+m.id} key={m.id} data-older={!!m.older} className={'mission-choice mission-'+extraColors[m.color]} aria-label={m.title}><div className="mission-picture added-mission-picture" aria-hidden="true">{m.id==='robot'?<img className="mission-robot-image" src="/robot-vriendje.png" alt=""/>:<Icon size={115}/>}</div><div className="mission-caption"><div><h2>{m.title}</h2><small className="mission-age">{m.older?'7–8 jaar':'6–8 jaar'}</small></div><span className="mission-go"><ArrowRight size={30}/></span></div></a>;})}
  </MissionGrid></main>
</div>}
