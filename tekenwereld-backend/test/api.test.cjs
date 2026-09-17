const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createHandler}=require('../handler.cjs');
const {ownerId}=require('../policy.cjs');
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aAuoAAAAASUVORK5CYII=';
const drawing={name:'Testvis',world:'aqua',template:'aqua-vrij',motion:'swim',zone:'air',size:1,pivot:.55,flip:false,image:png};
function setup(){
  const docs=new Map(),files=new Map();let time=1000000000,afterSave=null;
  const snap=p=>({exists:docs.has(p),id:p.split('/').pop(),data:()=>structuredClone(docs.get(p))});
  const ref=p=>({path:p,get:async()=>snap(p),collection:n=>collection(p+'/'+n)});
  const collection=p=>({doc:id=>ref(p+'/'+id),orderBy:()=>({limit:()=>({get:async()=>({docs:[...docs.keys()].filter(k=>k.startsWith(p+'/')&&!k.slice(p.length+1).includes('/')).map(snap)})})})});
  let tail=Promise.resolve();
  const db={collection,runTransaction(fn){
    const next=tail.then(async()=>{const pending=[];const result=await fn({get:r=>r.get(),delete:r=>pending.push(()=>docs.delete(r.path)),set:(r,d,o)=>pending.push(()=>docs.set(r.path,o?.merge?{...docs.get(r.path),...d}:d)),create:(r,d)=>pending.push(()=>{assert(!docs.has(r.path));docs.set(r.path,d);})});pending.forEach(f=>f());return result;});tail=next.catch(()=>{});return next;
  }};
  const bucket={file:p=>({save:async b=>{files.set(p,b);if(afterSave)await afterSave();},delete:async()=>files.delete(p),download:async()=>[files.get(p)]})};
  const handler=createHandler({db,bucket,verifyToken:async token=>{if(!['alice','bob'].includes(token))throw Error('invalid');return {uid:token,firebase:{sign_in_provider:'password'}};},now:()=>time});
  async function request(path,method='GET',token='alice',body,code,extra={}){
    const url=new URL('https://example.test/'+path),headers={origin:'https://tools.jufzisa.be',...(token?{authorization:'Bearer '+token}:{}),...(code?{'x-class-code':code}:{}),...extra};
    const req={path:url.pathname,query:Object.fromEntries(url.searchParams),method,body,get:n=>headers[n.toLowerCase()]};
    const res={statusCode:200,headers:{},set(k,v){this.headers[k.toLowerCase()]=v;return this;},status(s){this.statusCode=s;return this;},json(d){this.body=d;return this;},end(){return this;},type(t){this.headers['content-type']=t;return this;},send(d){this.body=d;return this;}};
    await handler(req,res);return res;
  }
  return {request,docs,files,advance:n=>time+=n,afterSave:f=>afterSave=f};
}
test('teacher and child authentication is mandatory; invalid issuer/token is rejected',async()=>{
  const {request}=setup();
  assert.equal((await request('creatures','GET',null)).statusCode,401);
  assert.equal((await request('creatures','GET','invalid')).statusCode,401);
  assert.equal((await request('session','GET',null,null,'bad')).statusCode,403);
  assert.equal((await request('creatures','GET','alice',null,null,{origin:'https://evil.test'})).statusCode,403);
});
test('colleagues have separate private drawings and image bytes',async()=>{
  const {request}=setup();
  const saved=await request('creatures','POST','alice',drawing);assert.equal(saved.statusCode,201);
  assert.equal((await request('creatures')).body.length,1);
  assert.equal((await request('creatures','GET','bob')).body.length,0);
  assert.equal((await request('image?id='+saved.body.id,'GET','bob')).statusCode,404);
  assert.equal((await request('creatures?id='+saved.body.id,'DELETE','bob')).statusCode,404);
  assert.equal((await request('image?id='+saved.body.id)).headers['content-type'],'image/png');
});
test('class code grants upload only, restricted to the selected world',async()=>{
  const {request}=setup();const s=await request('session','POST','alice',{world:'aqua'});const code=s.body.code;
  const joined=await request('session','GET',null,null,code);assert.deepEqual(Object.keys(joined.body).sort(),['expires','world']);
  assert.equal((await request('creatures','POST',null,drawing,code)).statusCode,201);
  assert.equal((await request('creatures','POST',null,{...drawing,world:'space'},code)).statusCode,400);
  for(const [path,method] of [['creatures','GET'],['creatures','DELETE'],['image','GET'],['session','POST'],['session','DELETE']])assert.equal((await request(path,method,null,{},code)).statusCode,403);
});
test('rotating, closing and expiring QR codes stops uploads',async()=>{
  const {request,advance}=setup();const first=(await request('session','POST','alice',{world:'aqua'})).body.code;
  const second=(await request('session','POST','alice',{world:'aqua'})).body.code;
  assert.notEqual(first,second);assert.equal((await request('creatures','POST',null,drawing,first)).statusCode,403);
  await request('session','DELETE');assert.equal((await request('session','GET',null,null,second)).statusCode,403);
  const third=(await request('session','POST','alice',{world:'aqua'})).body.code;advance(12*3600000);
  assert.equal((await request('creatures','POST',null,drawing,third)).statusCode,403);
});
test('closing QR while an upload is saving rejects it and cleans the image',async()=>{
  const {request,files,afterSave}=setup();const code=(await request('session','POST','alice',{world:'aqua'})).body.code;
  afterSave(()=>request('session','DELETE'));
  assert.equal((await request('creatures','POST',null,drawing,code)).statusCode,403);
  assert.equal(files.size,0);assert.equal((await request('creatures')).body.length,0);
});
test('invalid images, oversized images and invalid properties cannot be stored',async()=>{
  const {request,files}=setup();
  for(const change of [{image:'data:image/svg+xml;base64,PHN2Zz4='},{image:png.slice(0,30)},{image:'x'.repeat(2500001)},{name:''},{world:'fake'},{size:99},{pivot:0},{flip:'yes'},{motion:'fake'}])assert.equal((await request('creatures','POST','alice',{...drawing,...change})).statusCode,400);
  assert.equal(files.size,0);
});
test('poll returns 304 until a drawing changes and delete removes private image',async()=>{
  const {request,files}=setup();const empty=await request('creatures');
  assert.equal((await request('creatures','GET','alice',null,null,{'if-none-match':empty.headers.etag})).statusCode,304);
  const saved=await request('creatures','POST','alice',drawing);const updated=await request('creatures');
  assert.notEqual(updated.headers.etag,empty.headers.etag);
  assert.equal((await request('creatures?id='+saved.body.id,'DELETE')).statusCode,200);
  assert.equal(files.size,0);assert.equal((await request('creatures')).body.length,0);
});
test('capacity limits and simultaneous uploads preserve counts',async()=>{
  const {request,docs,files}=setup();
  const results=await Promise.all(Array.from({length:12},()=>request('creatures','POST','alice',drawing)));
  assert(results.every(r=>r.statusCode===201));assert.equal(docs.get('tekenwereldOwners/'+ownerId('alice')).count,12);
  docs.get('tekenwereldOwners/'+ownerId('alice')).count=100;
  assert.equal((await request('creatures','POST','alice',drawing)).statusCode,409);assert.equal(files.size,12);
});
