import {apiFetch} from '@/lib/api';
import {useEffect,useRef,useState} from 'react';
import {CheckCircle2,Camera,ArrowLeftRight} from 'lucide-react';
import Upload from './upload';
import {worlds} from '@/lib/worlds';

export default function Join(){
 const [code,setCode]=useState(''),[entry,setEntry]=useState(''),[world,setWorld]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[sent,setSent]=useState<string|null>(null);
 const request=useRef(0),activeCode=useRef('');
 function clear(){activeCode.current='';setCode('');setWorld('');setSent(null);setError('');}
 function change(){request.current++;clear();setBusy(false);setEntry('');history.replaceState(null,'',location.pathname+location.search);}
 async function connect(value:string){
  const ticket=++request.current;clear();setBusy(true);
  try{
   const clean=value.replace(/[\s–-]/g,'').toLowerCase();
   if(!/^[a-f0-9]{24}$/.test(clean))throw Error('Scan de klas-QR van de juiste wereld, of vul de volledige klascode in.');
   const r=await apiFetch('/api/session',{headers:{'x-class-code':clean}}),d=await r.json();
   if(ticket!==request.current)return;
   if(!r.ok||!worlds.some(w=>w.id===d?.world))throw Error(d?.error||'Controleer de klascode.');
   activeCode.current=clean;setCode(clean);setWorld(d.world);setEntry('');
   history.replaceState(null,'',location.pathname+location.search+'#'+clean);
  }catch(e){if(ticket===request.current)setError((e as Error).message);}
  finally{if(ticket===request.current)setBusy(false);}
 }
 useEffect(()=>{
  const follow=()=>{const c=location.hash.slice(1);if(c)void connect(c);else change();};
  follow();window.addEventListener('hashchange',follow);
  return()=>{request.current++;activeCode.current='';window.removeEventListener('hashchange',follow);};
 },[]);
 return <main className="child-app"><header className="topbar"><div className="brand"><span className="brandmark">z<span>✦</span></span><span>Zisa <b>Tekenwereld</b></span></div><div className="top-actions">{world&&<span className="child-world">{worlds.find(w=>w.id===world)?.icon} {worlds.find(w=>w.id===world)?.name}</span>}{(world||busy||error)&&<button className="button" onClick={change}><ArrowLeftRight size={18}/> Andere klas-QR</button>}</div></header><div className="app-wrap">
 {busy?<section className="join-card"><p role="status">De nieuwe klaswereld wordt geopend…</p></section>:sent!==null?<section className="success-card"><CheckCircle2 size={64}/><h1>{sent||'Je figuurtje'} is onderweg!</h1><p>Kijk naar het smartboard. Je wezen verschijnt normaal binnen enkele seconden in de klaswereld.</p><button className="button primary" onClick={()=>setSent(null)}><Camera size={20}/> Nog een tekening toevoegen</button></section>:world?<Upload key={code} world={world} classCode={code} child onSave={c=>{if(activeCode.current===code)setSent(c.name);}}/>:<section className="join-card"><span className="join-icon">✦</span><h1>Doe mee met de juiste wereld</h1><p>Open de camera van je gsm en scan de klas-QR van de gewenste wereld op het smartboard. Je kunt ook hieronder de klascode invullen.</p><p>Verkeerde wereld geopend? Scan de andere klas-QR. Deze pagina schakelt dan over naar die wereld.</p><label className="field">Klascode<input value={entry} onChange={e=>setEntry(e.target.value)} placeholder="Code van je juf" autoCapitalize="none" autoComplete="off" spellCheck={false}/></label><button className="button primary full" disabled={!entry.trim()} onClick={()=>connect(entry)}>Naar onze klaswereld</button></section>}
 {error&&<p role="alert" className="message error">{error}</p>}</div></main>;
}
