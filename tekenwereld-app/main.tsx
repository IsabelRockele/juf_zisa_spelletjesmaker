import Help from './app/help';
import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {onAuthStateChanged} from 'firebase/auth';
import Teacher from './app/teacher';
import Join from './app/join';
import {auth,clearImages,apiFetch} from './lib/api';
import {edition,toolsHref,signInHref} from './lib/edition';
import './app/globals.css';

function App(){
  const child=location.pathname.endsWith('/meedoen.html');
  const [user,setUser]=useState<string|null|undefined>(undefined);
  const [allowed,setAllowed]=useState<string[]|null>(null);
  const [error,setError]=useState('');
  const [attempt,setAttempt]=useState(0);
  useEffect(()=>{
    if(child)return;
    return onAuthStateChanged(auth,u=>{clearImages();setAllowed(null);setError('');setUser(u?.uid??null);},()=>setError('Je aanmelding kon niet gecontroleerd worden.'));
  },[child]);
  useEffect(()=>{
    if(!user)return;
    let active=true;
    setError('');
    apiFetch('/api/access').then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);if(active)setAllowed(edition==='ontdek'?['aqua']:d.worlds);}).catch(e=>{if(active)setError(e.message);});
    return()=>{active=false;};
  },[user,attempt]);
  if(child)return <Join/>;
  if(error)return <main className="app-wrap"><a className="button" href={toolsHref}>← Terug naar de tools</a><p role="alert">{error}</p><button className="button" onClick={()=>setAttempt(n=>n+1)}>Opnieuw proberen</button></main>;
  if(user===null&&edition==='ontdek')return <Teacher guest allowedWorlds={['aqua']} signInHref={signInHref}/>;
  if(user===null)return <main className="app-wrap"><a className="button" href={toolsHref}>← Terug naar de tools</a><section className="panel signin-panel"><h1>Welkom in Zisa's tekenwereld</h1><Help/><p>Gebruik je bestaande account voor {edition==='pro'?'Zisa Pro':'de gratis collega-versie'}.</p><a className="button primary" href={signInHref}>Inloggen</a><p>Na het inloggen vind je de tekenwereld bij Creatief en bouwen.</p></section></main>;
  if(user===undefined||!allowed)return <main className="app-wrap"><p role="status">Je toegang wordt gecontroleerd…</p></main>;
  return <Teacher key={user} allowedWorlds={allowed} signInHref={signInHref}/>;
}
createRoot(document.getElementById('root')!).render(<App/>);
