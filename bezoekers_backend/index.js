const {onRequest}=require('firebase-functions/v2/https');
const {initializeApp}=require('firebase-admin/app');
const {getAuth}=require('firebase-admin/auth');
const {getFirestore,FieldValue}=require('firebase-admin/firestore');
const {createHash}=require('node:crypto');
initializeApp();
const colleague=initializeApp({projectId:'zisa-collegas'},'colleague');
const db=getFirestore();
const origins=['https://tools.jufzisa.be','https://demo.jufzisa.be','https://isabelrockele.github.io'];
const options={region:'europe-west1',cors:origins,maxInstances:3};
const day=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Brussels'}).format(new Date());
const hash=s=>createHash('sha256').update(s).digest('hex');
exports.recordZisaTraffic=onRequest(options,async(req,res)=>{
  if(req.method!=='POST'){res.status(405).json({error:'POST vereist'});return;}
  if(!origins.includes(req.get('origin'))){res.status(403).json({error:'Origin'});return;}
  const {site,visitor,visit,event,id,tool,test}=req.body||{};
  const uuid=/^[0-9a-f-]{36}$/i;
  if(!['ontdek','pro','demo','gratis'].includes(site)||!uuid.test(visitor)||!uuid.test(visit)||!uuid.test(id)||!['visit','tool'].includes(event)||(event==='tool'&&(typeof tool!=='string'||!tool.length||tool.length>100))){res.status(400).json({error:'Ongeldige meting'});return;}
  const date=day(),root=db.collection(test===true?'zisa_traffic_test_days':'zisa_traffic_days').doc(date+'_'+site);
  try{
    await db.runTransaction(async tx=>{
      const marker=root.collection('events').doc(hash(event==='visit'?'visit:'+visit:id));
      const unique=root.collection('browsers').doc(hash(visitor));
      const markerSnap=await tx.get(marker);
      const uniqueSnap=event==='visit'?await tx.get(unique):null;
      if(markerSnap.exists)return;
      tx.set(marker,{expiresAt:new Date(Date.now()+100*86400000)});
      tx.set(root,{date,site,updatedAt:FieldValue.serverTimestamp(),...(event==='visit'?{visits:FieldValue.increment(1),browsers:FieldValue.increment(uniqueSnap.exists?0:1)}:{})},{merge:true});
      if(event==='visit'&&!uniqueSnap.exists)tx.set(unique,{seen:true});
      if(event==='tool')tx.set(root.collection('tools').doc(hash(tool)),{name:tool,opens:FieldValue.increment(1)},{merge:true});
    });
    res.json({ok:true,status:test===true?'test-recorded':'recorded'});
  }catch(error){console.error('Traffic write failed',error.code);res.status(503).json({error:'Meting tijdelijk niet beschikbaar'});}
});
exports.readZisaTraffic=onRequest(options,async(req,res)=>{
  if(req.method!=='GET'){res.status(405).json({error:'GET vereist'});return;}
  try{
    const token=(req.get('authorization')||'').replace(/^Bearer /,'');
    const user=await getAuth(colleague).verifyIdToken(token);
    if(user.email?.toLowerCase()!=='isabel.rockele@bsdelinde.net'){res.status(403).json({error:'Alleen voor Isabel'});return;}
  }catch{res.status(401).json({error:'Meld opnieuw aan met je collega-account'});return;}
  const days=Math.min(90,Math.max(1,Number(req.query.days)||30));
  const start=new Date();start.setUTCDate(start.getUTCDate()-days+1);
  const since=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Brussels'}).format(start);
  try{
    const snapshot=await db.collection('zisa_traffic_days').where('date','>=',since).get();
    const rows=await Promise.all(snapshot.docs.map(async doc=>({ ...doc.data(),tools:(await doc.ref.collection('tools').get()).docs.map(t=>t.data())})));
    res.set('Cache-Control','no-store');res.json({rows,today:day(),since});
  }catch{res.status(503).json({error:'Cijfers laden lukt momenteel niet'});}
});
