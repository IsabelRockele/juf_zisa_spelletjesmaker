'use client';
import {Children,isValidElement,cloneElement,useState,useEffect,ReactNode,ReactElement} from 'react';
import {ChevronLeft,ChevronRight} from 'lucide-react';
export default function MissionGrid({children}:{children:ReactNode}){
 const [age,setAge]=useState('all'),[page,setPage]=useState(0);
 useEffect(()=>{const a=new URLSearchParams(location.search).get('leeftijd');if(a==='6-7'||a==='7-8')setAge(a);},[]);
 const cards=Children.toArray(children).filter(c=>isValidElement(c)&&!(age==='6-7'&&(c.props as {'data-older'?:boolean})['data-older']));
 const total=Math.ceil(cards.length/6);
 return <><div className="mission-filter"><label htmlFor="mission-age">Leeftijd</label><select id="mission-age" value={age} onChange={e=>{setAge(e.target.value);setPage(0);const u=new URL(location.href);u.searchParams.set('leeftijd',e.target.value);history.replaceState(null,'',u);}}><option value="all">6–8 jaar</option><option value="6-7">6–7 jaar</option><option value="7-8">7–8 jaar</option></select></div><div className="mission-choices">{cards.slice(page*6,page*6+6).map(c=>{const el=c as ReactElement<{href:string}>;return el.props.href.startsWith('/ontdekken')?cloneElement(el,{href:el.props.href+(age==='all'?'':'&leeftijd='+age)}):el;})}</div><nav className="mission-pages" aria-label="Bladeren door missies"><button disabled={page===0} onClick={()=>setPage(p=>p-1)}><ChevronLeft/> Vorige</button><span aria-live="polite">{page+1} / {total}</span><button disabled={page===total-1} onClick={()=>setPage(p=>p+1)}>Meer missies <ChevronRight/></button></nav></>;
}
