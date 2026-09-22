import Help from './app/help';
import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {onAuthStateChanged} from 'firebase/auth';
import Teacher from './app/teacher';
import Join from './app/join';
import {auth,clearImages} from './lib/api';
import './app/globals.css';

function App(){
  const child=location.pathname.endsWith('/meedoen.html');
  const [user,setUser]=useState<string|null|undefined>(undefined);
  const [failed,setFailed]=useState(false);
  useEffect(()=>{
    if(child)return;
    return onAuthStateChanged(auth,u=>{clearImages();setUser(u?.uid??null);},()=>setFailed(true));
  },[child]);
  if(child)return <Join/>;
  if(failed||user===null)return <main className="app-wrap"><a className="button" href="../index.html#creatief">← Terug naar de tools</a><section className="panel signin-panel"><h1>Welkom in Zisa's tekenwereld</h1><Help/><p>Gebruik je bestaande account voor de gratis collega-versie.</p><a className="button primary" href="../login_collega.html">Inloggen als collega</a><p>Na het inloggen vind je de tekenwereld bij Creatief en bouwen.</p></section></main>;
  if(user===undefined)return <main className="app-wrap"><p role="status">Je collega-login wordt gecontroleerd…</p></main>;
  return <Teacher key={user}/>;
}
createRoot(document.getElementById('root')!).render(<App/>);
