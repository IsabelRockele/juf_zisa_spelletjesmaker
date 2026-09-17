import {initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';

// The same default Firebase app and persistence as login_collega.html.
export const auth = getAuth(initializeApp({
  apiKey:'AIzaSyCYkB9CSNahs1UNv9pduNC7TTsj0LNNHSU',
  authDomain:'zisa-collegas.firebaseapp.com',projectId:'zisa-collegas',
  storageBucket:'zisa-collegas.firebasestorage.app',
  messagingSenderId:'1029178227426',appId:'1:1029178227426:web:cb21cf199072c44b30bcbb'
}));
const endpoint='https://europe-west1-zisa-spelletjesmaker-pro.cloudfunctions.net/tekenwereldApi';
const images=new Map<string,string>();
export function clearImages(){for(const url of images.values())URL.revokeObjectURL(url);images.clear();}

export async function apiFetch(path:string,init:RequestInit={}):Promise<Response>{
  const headers=new Headers(init.headers);
  if(!headers.has('x-class-code')){
    await auth.authStateReady();
    if(!auth.currentUser)return Response.json({error:'Meld je aan met je collega-account.'},{status:401});
    headers.set('Authorization','Bearer '+await auth.currentUser.getIdToken());
  }
  const resource=path.replace(/^\/api\//,'');
  const response=await fetch(endpoint+'/'+resource,{...init,headers,cache:'no-store',credentials:'omit'});
  // Drawings stay private: load image bytes through the authenticated API, never public bucket URLs.
  if(resource==='creatures'&&(!init.method||init.method==='GET')&&response.ok){
    const list=await response.json();
    const present=new Set(list.map((c:{id:string})=>c.id));
    for(const [id,url] of images)if(!present.has(id)){URL.revokeObjectURL(url);images.delete(id);}
    // Limit concurrent image requests for full classrooms.
    for(let i=0;i<list.length;i+=5){
      await Promise.all(list.slice(i,i+5).map(async(c:{id:string;image:string})=>{
        if(!images.has(c.id)){
          const image=await fetch(endpoint+'/image?id='+encodeURIComponent(c.id),{headers,cache:'no-store'});
          if(!image.ok)throw Error('Een tekening kon niet geladen worden. Probeer opnieuw.');
          images.set(c.id,URL.createObjectURL(await image.blob()));
        }
        c.image=images.get(c.id)!;
      }));
    }
    return Response.json(list,{headers:response.headers});
  }
  return response;
}
