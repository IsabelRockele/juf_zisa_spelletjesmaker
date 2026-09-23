export const runtime='nodejs';
import {AppError,teacher,database,bucket,clean,json,sameOrigin,newCode,readLimited,validatePng} from '@/lib/atelier-server';
export const dynamic='force-dynamic';
type Lesson={id:string;owner:string;code:string;title:string;open:number;created_at:number};
async function run(req:Request){try{const u=new URL(req.url),path=u.pathname.replace(/^\/api\/atelier\//,'').split('/'),method=req.method;
 if(method!=='GET')sameOrigin(req);
 // Anonymous pupils can submit only with a currently open class code.
 if(path[0]==='submit'&&method==='POST'){
  const code=clean(u.searchParams.get('code'),8).toUpperCase(),id=u.searchParams.get('id')||'',name=clean(u.searchParams.get('name'),40);
  if(!/^[A-Z2-9]{8}$/.test(code)||!name||! /^[a-f0-9-]{36}$/.test(id))throw new AppError(400,'Vul je voornaam en de klascode in.');
  const db=database();const lesson=await db.prepare('SELECT * FROM lessons WHERE code = ?').bind(code).first<Lesson>();
  if(!lesson)throw new AppError(404,'Deze klascode klopt niet. Vraag het even aan je juf of meester.');
  const previous=await db.prepare('SELECT id, lesson_id FROM works WHERE id = ?').bind(id).first<{id:string;lesson_id:string}>();
  if(previous?.lesson_id===lesson.id)return json({ok:true});
  if(previous)throw new AppError(409,'Probeer opnieuw met een nieuwe inzending.');
  if(!lesson.open)throw new AppError(409,'Deze les is gesloten. Vraag je juf of meester om de les te openen.');
  const count=await db.prepare('SELECT COUNT(*) AS n FROM works WHERE lesson_id = ?').bind(lesson.id).first<{n:number}>();
  if((count?.n??0)>=500)throw new AppError(409,'Deze les zit vol. Vraag een nieuwe klascode.');
  if(!req.headers.get('content-type')?.startsWith('image/png'))throw new AppError(400,'Stuur een tekening uit het tekenatelier.');
  const bytes=await readLimited(req,4*1024*1024);validatePng(bytes);
  const key=`works/${lesson.id}/${id}-${crypto.randomUUID()}.png`;
  await bucket().put(key,bytes,{httpMetadata:{contentType:'image/png'}});
  try{const inserted=await db.prepare('INSERT OR IGNORE INTO works (id,lesson_id,name,object_key,created_at) SELECT ?,?,?,?,? WHERE EXISTS (SELECT 1 FROM lessons WHERE id = ? AND open = 1)').bind(id,lesson.id,name,key,Date.now(),lesson.id).run();if(!inserted.meta.changes){await bucket().delete(key);const winner=await db.prepare('SELECT lesson_id FROM works WHERE id = ?').bind(id).first<{lesson_id:string}>();if(winner?.lesson_id===lesson.id)return json({ok:true});throw new AppError(409,'Deze les is net gesloten. Je tekening staat nog op je scherm.');}}catch(e){await bucket().delete(key).catch(()=>{});throw e;}
  return json({ok:true});
 }
 const user=await teacher(),db=database();
 if(path[0]==='lessons'&&path.length===1){
  if(method==='GET'){const result=await db.prepare('SELECT l.id,l.code,l.title,l.open,l.created_at,COUNT(w.id) AS total FROM lessons l LEFT JOIN works w ON w.lesson_id=l.id WHERE l.owner=? GROUP BY l.id ORDER BY l.created_at DESC').bind(user.userId).all();return json({lessons:result.results});}
  if(method==='POST'){const body=await req.json() as {title?:unknown};const title=clean(body.title,80);if(!title)throw new AppError(400,'Geef de les een naam.');const id=crypto.randomUUID(),code=newCode();await db.prepare('INSERT INTO lessons (id,owner,code,title,open,created_at) VALUES (?,?,?,?,1,?)').bind(id,user.userId,code,title,Date.now()).run();return json({id,code,title,open:1,total:0},201);}
 }
 if(path[0]==='lessons'&&path[1]){const lesson=await db.prepare('SELECT * FROM lessons WHERE id=? AND owner=?').bind(path[1],user.userId).first<Lesson>();if(!lesson)throw new AppError(404,'Deze les is niet gevonden.');
  if(method==='PATCH'&&path.length===2){const body=await req.json() as {open?:unknown};if(typeof body.open!=='boolean')throw new AppError(400,'Kies openen of sluiten.');await db.prepare('UPDATE lessons SET open=? WHERE id=? AND owner=?').bind(body.open?1:0,lesson.id,user.userId).run();return json({ok:true});}
  if(method==='GET'&&path[2]==='works'){const result=await db.prepare('SELECT id,name,created_at FROM works WHERE lesson_id=? ORDER BY created_at DESC').bind(lesson.id).all();return json({works:result.results});}
 }
 if(path[0]==='works'&&path[1]&&method==='GET'){const work=await db.prepare('SELECT w.object_key FROM works w JOIN lessons l ON l.id=w.lesson_id WHERE w.id=? AND l.owner=?').bind(path[1],user.userId).first<{object_key:string}>();if(!work)throw new AppError(404,'Dit werkje is niet gevonden.');const file=await bucket().get(work.object_key);if(!file)throw new AppError(404,'Deze afbeelding is niet beschikbaar.');return new Response(file.body,{headers:{'Content-Type':'image/png','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}
 throw new AppError(404,'Niet gevonden.');
 }catch(e){if(e instanceof AppError)return json({error:e.message},e.status);console.error('Atelier request failed',e);return json({error:'Het verbinden lukt even niet. Probeer opnieuw. Je tekening blijft op je scherm.'},503);}}
export const GET=run;export const POST=run;export const PATCH=run;
