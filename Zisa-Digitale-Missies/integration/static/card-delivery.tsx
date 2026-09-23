import {useRef,useState,useEffect} from 'react';
import {availability,submitWork} from './submit-work.js';
export default function CardDelivery({card,pupil,dirty}:{card:{name:string;image:string};pupil:string;dirty:boolean}){
  const [message,setMessage]=useState(''),[busy,setBusy]=useState(false),[sent,setSent]=useState(false);
  const pending=useRef({image:'',name:'',id:''}),flight=useRef(false);
  useEffect(()=>{setSent(false);setMessage('');},[card.image,pupil]);
  const reason=availability();
  async function submit(){
    if(flight.current||dirty||sent)return;flight.current=true;setBusy(true);
    try{if(pending.current.image!==card.image||pending.current.name!==pupil)pending.current={image:card.image,name:pupil,id:crypto.randomUUID().replaceAll('-','')};await submitWork(card.image,pupil,'Naamkaartje',pending.current.id);setSent(true);setMessage('Ontvangen! Je leerkracht kan je werk bekijken.');}
    catch(e){setMessage((e as Error).message);}finally{flight.current=false;setBusy(false);}
  }
  return <section className="card-delivery"><div><img src={card.image} alt="Je bewaarde naamkaartje"/><div><h3>Bewaar je naamkaartje</h3><p>{reason||'Stuur je kaartje naar je leerkracht via de klaslink.'}</p></div></div>{dirty&&<p>Bewaar eerst je laatste wijzigingen.</p>}<div className="delivery-actions"><a className="card-download-link" href={dirty?undefined:card.image} download={card.name} aria-disabled={dirty}>Download afbeelding</a><button disabled={dirty||busy||sent||!!reason} onClick={submit}>{sent?'Ingeleverd':busy?'Versturen…':'Stuur naar de juf'}</button><button disabled={dirty} onClick={()=>{const w=window.open('','_blank');if(w){w.document.title='Naamkaartje';const img=w.document.createElement('img');img.src=card.image;img.style.maxWidth='100%';w.document.body.append(img);w.document.close();}}}>Open afbeelding</button></div>{message&&<p role="status">{message}</p>}</section>;
}
