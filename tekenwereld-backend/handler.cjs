const {randomBytes,randomUUID}=require('node:crypto');
const {ApiError,fail,worlds,ownerId,codeHash,validCode,requireSession,validateDrawing}=require('./policy.cjs');
const origins=new Set(['https://tools.jufzisa.be','https://isabelrockele.github.io','http://127.0.0.1:8765','http://127.0.0.1:5173','http://localhost:5173']);
function createHandler({db,bucket,verifyToken,now=Date.now}){
  const owners=db.collection('tekenwereldOwners');
  const sessions=db.collection('tekenwereldSessions');
  return async function(req,res){
    res.set('Cache-Control','no-store');res.set('X-Content-Type-Options','nosniff');
    const origin=req.get('origin');
    if(origin&&!origins.has(origin)){res.status(403).json({error:'Open de tekenwereld via tools.jufzisa.be.'});return;}
    if(origin){res.set('Access-Control-Allow-Origin',origin);res.set('Vary','Origin');}
    res.set('Access-Control-Allow-Methods','GET, POST, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers','Authorization, Content-Type, X-Class-Code, If-None-Match');
    res.set('Access-Control-Expose-Headers','ETag');
    if(req.method==='OPTIONS'){res.status(204).end();return;}
    try{
      const route=req.path.replace(/^\/+|\/+$/g,'');
      if(!['session','creatures','image'].includes(route))fail(404,'Deze pagina bestaat niet.');
      if(!['GET','POST','DELETE'].includes(req.method))fail(405,'Deze actie is niet beschikbaar.');
      const code=req.get('x-class-code');
      let id;
      if(code){
        if(!validCode(code))fail(403,'Deze klascode is niet geldig.');
        if(!((route==='session'&&req.method==='GET')||(route==='creatures'&&req.method==='POST')))fail(403,'Alleen de leerkracht kan tekeningen bekijken of beheren.');
        const lookup=(await sessions.doc(codeHash(code)).get()).data();
        if(!lookup||lookup.expires<=now())fail(403,'Deze klasverbinding is gesloten of verlopen. Vraag een nieuwe klas-QR.');
        id=lookup.owner;
        requireSession((await owners.doc(id).get()).data(),code,now());
      }else{
        const token=/^Bearer (.+)$/.exec(req.get('authorization')||'')?.[1];
        if(!token)fail(401,'Meld je aan met je collega-account.');
        let user;
        try{user=await verifyToken(token);}catch{fail(401,'Je aanmelding is verlopen. Meld je opnieuw aan als collega.');}
        if(!user.uid||user.firebase?.sign_in_provider==='anonymous')fail(403,'Gebruik je collega-account.');
        id=ownerId(user.uid);
      }
      const ref=owners.doc(id);
      if(route==='session'){
        if(req.method==='GET'){
          const state=(await ref.get()).data();
          const s=code?requireSession(state,code,now()):state?.session;
          res.json(s&&s.expires>now()?(code?{world:s.world,expires:s.expires}:s):null);return;
        }
        const newCode=randomBytes(12).toString('hex');
        const world=req.body?.world;
        if(req.method==='POST'&&!worlds.has(world))fail(400,'Kies een geldige leefwereld.');
        const next=req.method==='POST'?{code:newCode,world,expires:now()+12*3600000}:null;
        await db.runTransaction(async tx=>{
          const old=(await tx.get(ref)).data();
          if(old?.session)tx.delete(sessions.doc(codeHash(old.session.code)));
          if(next)tx.set(sessions.doc(codeHash(newCode)),{owner:id,expires:next.expires});
          tx.set(ref,{session:next},{merge:true});
        });
        res.json(next||{ok:true});return;
      }
      if(route==='image'){
        if(req.method!=='GET')fail(405,'Deze actie is niet beschikbaar.');
        const imageId=req.query.id;
        if(typeof imageId!=='string'||!/^[a-f0-9-]{36}$/.test(imageId))fail(400,'Ongeldige tekening.');
        if(!(await ref.collection('creatures').doc(imageId).get()).exists)fail(404,'Deze tekening bestaat niet meer.');
        const [bytes]=await bucket.file(`tekenwereld/${id}/${imageId}.png`).download();
        res.type('image/png').send(bytes);return;
      }
      if(req.method==='GET'){
        // One cheap version read per poll. Image bytes are loaded separately only once.
        const state=(await ref.get()).data();const tag='"'+(state?.version||'empty')+'"';
        res.set('ETag',tag);
        if(req.get('if-none-match')===tag){res.status(304).end();return;}
        const docs=await ref.collection('creatures').orderBy('createdAt').limit(100).get();
        res.json(docs.docs.map(d=>{const {bytes,...data}=d.data();return {...data,id:d.id};}));return;
      }
      if(req.method==='DELETE'){
        const drawingId=req.query.id;
        if(typeof drawingId!=='string'||!/^[a-f0-9-]{36}$/.test(drawingId))fail(400,'Ongeldige tekening.');
        const drawingRef=ref.collection('creatures').doc(drawingId);
        await db.runTransaction(async tx=>{
          const [state,doc]=await Promise.all([tx.get(ref),tx.get(drawingRef)]);
          if(!doc.exists)fail(404,'Deze tekening bestaat niet meer.');
          tx.delete(drawingRef);tx.set(ref,{count:Math.max(0,(state.data()?.count||0)-1),bytes:Math.max(0,(state.data()?.bytes||0)-(doc.data().bytes||0)),version:randomUUID()},{merge:true});
        });
        await bucket.file(`tekenwereld/${id}/${drawingId}.png`).delete({ignoreNotFound:true});
        res.json({ok:true});return;
      }
      const {data,bytes}=validateDrawing(req.body);
      const drawingId=randomUUID(),image=bucket.file(`tekenwereld/${id}/${drawingId}.png`);
      const value={...data,id:drawingId,createdAt:new Date(now()).toISOString(),bytes:bytes.length};
      await image.save(bytes,{resumable:false,metadata:{contentType:'image/png',cacheControl:'private, no-store'}});
      try{
        await db.runTransaction(async tx=>{
          const state=(await tx.get(ref)).data()||{};
          if(code&&requireSession(state,code,now()).world!==data.world)fail(400,'Deze tekening hoort bij een andere klaswereld.');
          if((state.count||0)>=100||(state.bytes||0)+bytes.length>40*1024*1024)fail(409,'Je klaswereld is vol. Verwijder eerst enkele oude tekeningen.');
          const recent=now()-(state.windowStart||0)<60000;
          if(recent&&(state.uploads||0)>=60)fail(429,'Even wachten: er komen veel tekeningen tegelijk binnen. Probeer over een minuut opnieuw.');
          tx.create(ref.collection('creatures').doc(drawingId),value);
          tx.set(ref,{count:(state.count||0)+1,bytes:(state.bytes||0)+bytes.length,version:randomUUID(),windowStart:recent?state.windowStart:now(),uploads:recent?(state.uploads||0)+1:1},{merge:true});
        });
      }catch(e){await image.delete({ignoreNotFound:true});throw e;}
      const {bytes:ignored,...created}=value;
      res.status(201).json({...created,image:req.body.image});
    }catch(e){
      if(!(e instanceof ApiError))console.error('tekenwereld',e.code||e.name);
      res.status(e instanceof ApiError?e.status:503).json({error:e instanceof ApiError?e.message:'De klasverbinding is tijdelijk niet beschikbaar. Probeer opnieuw.'});
    }
  };
}
module.exports={createHandler};
