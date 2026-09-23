export function availability(){
  if(!window.ZISA_INLEVER_CONFIG?.enabled)return 'Online inleveren is nog niet geactiveerd. Download je werk en laat het aan je leerkracht zien.';
  const p=new URLSearchParams(location.hash.slice(1));
  if(!/^[a-f0-9]{32}$/.test(p.get('klas')||'')||!/^[a-f0-9]{48}$/.test(p.get('sleutel')||''))return 'Open de klaslink van je leerkracht om je werk in te leveren.';
  return '';
}
export async function submitWork(png,author,task,requestId){
  const unavailable=availability();if(unavailable)throw Error(unavailable);
  if(!author.trim())throw Error('Vul je voornaam in.');
  const p=new URLSearchParams(location.hash.slice(1));
  const link={inboxId:p.get('klas'),token:p.get('sleutel')};
  const {inboxClient}=await import(/* @vite-ignore */ '/digitale-missies/inlever-api.js');
  const api=await inboxClient();
  const dest=await api.call('previewMissionInbox',link);
  if(!confirm('Inleveren bij '+dest.label+'? Je voornaam en dit werkstuk worden naar je leerkracht gestuurd.'))throw Error('Niet verstuurd. Je werk blijft hier beschikbaar.');
  if(png.length>780000)throw Error('Deze afbeelding is te groot. Download je werk en vraag je leerkracht om hulp.');
  const result=await api.call('submitMissionWork',{...link,author:author.trim(),task,png,requestId});
  if(result.received!==true)throw Error('Geen ontvangstbevestiging. Probeer opnieuw.');
}
