const {test}=require('node:test');const assert=require('node:assert/strict');
const {createReadingService,READING_COLLECTIONS}=require('./lib/reading-service');
// In-memory Firestore port with serial transactions; no cloud credentials or network.
function database(){
 const records=new Map();let tail=Promise.resolve();const clone=v=>v===undefined?undefined:structuredClone(v);
 const ref=path=>({path,id:path.split('/').pop(),get:async()=>snap(path),set:async(v,o)=>write(path,v,o),update:async v=>write(path,v,{merge:true})});
 const snap=path=>({exists:records.has(path),id:path.split('/').pop(),ref:ref(path),data:()=>clone(records.get(path))});
 const write=(path,v,o)=>records.set(path,clone(o?.merge?{...records.get(path),...v}:v));
 const collection=name=>{const build=(filters=[],limit=Infinity)=>({doc:id=>ref(name+'/'+id),where:(field,op,value)=>build([...filters,[field,value]],limit),limit:n=>build(filters,n),get:async()=>{const docs=[...records.keys()].filter(p=>p.startsWith(name+'/')&&p.split('/').length===2&&filters.every(([f,v])=>records.get(p)[f]===v)).slice(0,limit).map(snap);return {docs,empty:!docs.length,size:docs.length};}});return build();};
 const db={collection,doc:ref,runTransaction:fn=>{const next=tail.then(async()=>{const changes=[];const value=await fn({get:async r=>r.get(),set:(r,v,o)=>changes.push(()=>write(r.path,v,o)),update:(r,v)=>changes.push(()=>write(r.path,v,{merge:true})),create:(r,v)=>{if(records.has(r.path))throw Error('exists');changes.push(()=>write(r.path,v));}});changes.forEach(f=>f());return value;});tail=next.catch(()=>{});return next;}};
 return {db,records};
}
function fixture(options={}){
 const {db,records}=options.database||database(),mode=options.mode||'test',invoices=new Map(),payments=new Map(),operations=new Map();let clock=Date.parse('2027-01-15T12:00:00Z'),subscriptions=0,cancels=0,subscriptionAmount=null;
 const provider={
  getProfile:async()=>({id:options.profileId||'pfl_test'}),
  createCustomer:async()=>({id:'cst_customer'}),
  createPayment:async(payload,key)=>{if(!operations.has(key)){const id='tr_'+(payments.size+1);const p={...payload,id,mode,status:'open',createdAt:new Date(clock).toISOString(),_links:{checkout:{href:'https://www.mollie.com/checkout/test'}}};payments.set(id,p);operations.set(key,p);}return operations.get(key);},
  getPayment:async id=>structuredClone(payments.get(id)),
  getMandate:async()=>({id:'mdt_test',status:'valid'}),
  createSubscription:async(customer,payload)=>{subscriptionAmount=payload.amount.value;subscriptions++;if(options.beforeSubscription)await options.beforeSubscription();return {id:'sub_test'};},
  cancelSubscription:async()=>{cancels++;return {id:'sub_test',status:'canceled'};},
  listSubscriptionPayments:async()=>({_embedded:{payments:[...payments.values()].filter(p=>p.sequenceType==='recurring')}}),
 };
 const api=createReadingService(db,{mode,apiKey:mode+'_fixture',redirectUrl:'https://example.test/return',webhookUrl:'https://example.test/webhook',profileId:'pfl_test'},{provider,now:()=>clock,hasPro:async uid=>uid==='pro-user',invoice:async invoice=>invoices.set(invoice.key,invoice)});
 const buyer={uid:'reader',email:'reader@example.test'},input={name:'Reader',address:'Teststraat 1',consent:true,consentVersion:'reading-monthly-v1'};
 const pay=id=>{const p=payments.get(id);Object.assign(p,{status:'paid',paidAt:new Date(clock).toISOString(),mandateId:'mdt_test'});};
 return {api,records,invoices,payments,buyer,input,pay,clock:()=>clock,setClock:v=>clock=v,counts:()=>({subscriptions,cancels,subscriptionAmount})};
}
test('full test flow: checkout, confirmation, invoice, link, cancellation, expiry; no Pro or live writes',async()=>{
 const f=fixture();await f.api.checkout(f.buyer,f.input);
 assert.equal((await f.api.status('reader')).allowed,false);
 f.pay('tr_1');await f.api.payment('tr_1');
 let s=await f.api.status('reader');assert.equal(s.allowed,true);assert.equal(s.pro,false);assert.equal(f.invoices.size,1);assert.equal(f.counts().subscriptions,1);
 const link=await f.api.link('reader');assert.equal((await f.api.student(link.token)).allowed,true);
 await f.api.cancel('reader');s=await f.api.status('reader');assert.equal(s.renewalCanceled,true);assert.equal(s.allowed,true);
 f.setClock(s.paidUntil+1);assert.equal((await f.api.status('reader')).allowed,false);await assert.rejects(()=>f.api.student(link.token));
 for(const key of f.records.keys())assert.match(key,/^readingTest/);
});
test('duplicate checkout and webhook do not create two payments/subscriptions or invoice keys',async()=>{
 const f=fixture();await Promise.all([f.api.checkout(f.buyer,f.input),f.api.checkout(f.buyer,f.input)]);assert.equal(f.payments.size,1);
 f.pay('tr_1');await f.api.payment('tr_1');await f.api.payment('tr_1');assert.equal(f.invoices.size,1);assert.equal(f.counts().subscriptions,1);
});
test('Pro included, consent required, unrelated users cannot read or cancel the subscription',async()=>{
 const f=fixture();assert.equal((await f.api.status('pro-user')).allowed,true);await assert.rejects(()=>f.api.checkout({uid:'pro-user',email:'pro@example.test'},f.input));await assert.rejects(()=>f.api.checkout(f.buyer,{...f.input,consent:false}));
 await f.api.checkout(f.buyer,f.input);f.pay('tr_1');await f.api.payment('tr_1');assert.equal((await f.api.status('other')).allowed,false);await assert.rejects(()=>f.api.cancel('other'));await assert.rejects(()=>f.api.link('other'));
});
test('new reading link revokes previous token and next payment produces a new invoice',async()=>{
 const f=fixture();await f.api.checkout(f.buyer,f.input);f.pay('tr_1');await f.api.payment('tr_1');const old=await f.api.link('reader');const current=await f.api.link('reader');await assert.rejects(()=>f.api.student(old.token));assert.equal((await f.api.student(current.token)).allowed,true);
 const end=(await f.api.status('reader')).paidUntil;f.setClock(end);f.payments.set('tr_2',{...f.payments.get('tr_1'),id:'tr_2',sequenceType:'recurring',subscriptionId:'sub_test',createdAt:new Date(end).toISOString(),paidAt:new Date(end).toISOString()});await f.api.payment('tr_2');assert.equal(f.invoices.size,2);assert.ok((await f.api.status('reader')).paidUntil>end);
});
test('cancellation during provider creation also cancels the returned subscription',async()=>{
 let resolve,startedResolve;const wait=new Promise(r=>resolve=r),started=new Promise(r=>startedResolve=r);
 const f=fixture({beforeSubscription:async()=>{startedResolve();await wait;}});await f.api.checkout(f.buyer,f.input);f.pay('tr_1');const processing=f.api.payment('tr_1');await started;await f.api.cancel('reader');resolve();await processing;assert.equal((await f.api.status('reader')).renewalCanceled,true);assert.ok(f.counts().cancels>=1);
});
test('provider failure leaves access closed and can recover without opening a new order',async()=>{
 const f=fixture();await f.api.checkout(f.buyer,f.input);f.payments.get('tr_1').status='failed';await f.api.payment('tr_1');assert.equal((await f.api.status('reader')).allowed,false);assert.equal(f.invoices.size,0);
});
test('expired canceled subscription can restart as a new order',async()=>{
 const f=fixture();await f.api.checkout(f.buyer,f.input);f.pay('tr_1');await f.api.payment('tr_1');await f.api.cancel('reader');f.setClock((await f.api.status('reader')).paidUntil+1);await f.api.checkout(f.buyer,f.input);assert.equal(f.payments.size,2);
});
test('a key from the webshop profile cannot start a reading checkout',async()=>{
 const f=fixture({profileId:'pfl_webshop'});await assert.rejects(()=>f.api.checkout(f.buyer,f.input));assert.equal(f.records.size,0);assert.equal(f.payments.size,0);
});
test('Peppol billing is preserved for each invoice without transferring account ownership',async()=>{
 const f=fixture();await f.api.checkout(f.buyer,{...f.input,peppolRequested:true,organization:'Testschool',billingEmail:'school@example.test',peppolId:'0208:0308357159',purchaseReference:'SCHOOL-1'});
 f.pay('tr_1');await f.api.payment('tr_1');const invoice=[...f.invoices.values()][0];
 assert.equal(invoice.customer.email,'school@example.test');assert.equal(invoice.customer.peppolRequested,true);assert.equal(invoice.customer.peppolId,'0208:0308357159');assert.match(invoice.ownerKey,/:reader$/);
 assert.equal((await f.api.status('school')).allowed,false);
 const bad=fixture();await assert.rejects(()=>bad.api.checkout(bad.buyer,{...bad.input,peppolRequested:true}));assert.equal(bad.payments.size,0);
 await assert.rejects(()=>bad.api.checkout(bad.buyer,{...bad.input,quantity:5}));assert.equal(bad.payments.size,0);
});
test('month-end subscription follows its actual start date after the first paid month',async()=>{
 const f=fixture();f.setClock(Date.parse('2027-01-31T12:00:00Z'));await f.api.checkout(f.buyer,f.input);f.pay('tr_1');await f.api.payment('tr_1');
 const feb=(await f.api.status('reader')).paidUntil;assert.equal(new Date(feb).toISOString(),'2027-02-28T12:00:00.000Z');
 f.setClock(feb);f.payments.set('tr_2',{...f.payments.get('tr_1'),id:'tr_2',sequenceType:'recurring',subscriptionId:'sub_test',createdAt:new Date(feb).toISOString(),paidAt:new Date(feb).toISOString()});await f.api.payment('tr_2');
 assert.equal(new Date((await f.api.status('reader')).paidUntil).toISOString(),'2027-03-28T12:00:00.000Z');
});

const schoolToken=f=>{const job=[...f.records.values()].filter(v=>v.kind==='invitation').at(-1);return new URL(job.url).hash.slice('#invite='.length);};
async function paidSchool(quantity=4){const f=fixture();await f.api.checkout(f.buyer,{...f.input,quantity,organization:'Testschool'});f.pay('tr_1');await f.api.payment('tr_1');return f;}
test('school charges four places once and owner needs a seat to read; teachers cannot access billing',async()=>{
 const f=await paidSchool();assert.equal(f.payments.get('tr_1').amount.value,'15.96');assert.equal(f.counts().subscriptionAmount,'15.96');assert.equal([...f.invoices.values()][0].amountEUR,'15.96');assert.equal([...f.invoices.values()][0].quantity,4);
 let s=await f.api.status('reader');assert.equal(s.allowed,false);assert.equal(s.school.seats.length,4);
 await f.api.invite('reader',0,'teacher@example.test');const token=schoolToken(f);
 await assert.rejects(()=>f.api.accept({uid:'other',email:'wrong@example.test'},token));
 await f.api.accept({uid:'teacher',email:'teacher@example.test'},token);await f.api.accept({uid:'teacher',email:'teacher@example.test'},token);
 s=await f.api.status('teacher');assert.equal(s.allowed,true);assert.equal(s.school,null);assert.equal(s.invoices.length,0);await assert.rejects(()=>f.api.cancel('teacher'));await assert.rejects(()=>f.api.invite('teacher',1,'other@example.test'));
 await assert.rejects(()=>f.api.invite('reader',4,'fifth@example.test'));await assert.rejects(()=>f.api.invite('reader',1,'TEACHER@example.test'));
 await f.api.invite('reader',1,f.buyer.email);await f.api.accept(f.buyer,schoolToken(f));assert.equal((await f.api.status('reader')).allowed,true);
});
test('replacement revokes teacher QR and old invitation; removing seat does not reduce billed quantity',async()=>{
 const f=await paidSchool();await f.api.invite('reader',0,'old@example.test');const old=schoolToken(f);await f.api.accept({uid:'old',email:'old@example.test'},old);const qr=await f.api.link('old');assert.equal((await f.api.student(qr.token)).allowed,true);
 await f.api.invite('reader',0,'new@example.test');assert.equal((await f.api.status('old')).allowed,false);await assert.rejects(()=>f.api.student(qr.token));await assert.rejects(()=>f.api.accept({uid:'old',email:'old@example.test'},old));
 await f.api.accept({uid:'new',email:'new@example.test'},schoolToken(f));await f.api.invite('reader',0,'',true);assert.equal((await f.api.status('new')).allowed,false);assert.equal((await f.api.status('reader')).quantity,4);
});
test('invite retries are idempotent, resend invalidates old token and expired invites fail',async()=>{
 const f=await paidSchool();await f.api.invite('reader',0,'a@example.test');const old=schoolToken(f);await f.api.invite('reader',0,'a@example.test');assert.equal(schoolToken(f),old);
 await f.api.invite('reader',0,'a@example.test',false,true);const latest=schoolToken(f);assert.notEqual(latest,old);await assert.rejects(()=>f.api.accept({uid:'a',email:'a@example.test'},old));
 f.setClock(f.clock()+15*86400000);await assert.rejects(()=>f.api.accept({uid:'a',email:'a@example.test'},latest));
});
test('school renewal keeps correct quantity and cancellation retains teachers until paid period ends',async()=>{
 const f=await paidSchool();await f.api.invite('reader',0,'a@example.test');await f.api.accept({uid:'a',email:'a@example.test'},schoolToken(f));const qr=await f.api.link('a');
 const end=(await f.api.status('reader')).paidUntil;f.setClock(end);f.payments.set('tr_2',{...f.payments.get('tr_1'),id:'tr_2',sequenceType:'recurring',subscriptionId:'sub_test',createdAt:new Date(end).toISOString(),paidAt:new Date(end).toISOString()});await f.api.payment('tr_2');assert.equal(f.invoices.size,2);assert.equal([...f.invoices.values()][1].amountEUR,'15.96');
 await f.api.cancel('reader');assert.equal((await f.api.student(qr.token)).allowed,true);f.setClock((await f.api.status('reader')).paidUntil+1);await assert.rejects(()=>f.api.student(qr.token));assert.equal((await f.api.status('a')).allowed,false);
});
test('forged school amount and unpaid school cannot grant places',async()=>{
 const f=fixture();await f.api.checkout(f.buyer,{...f.input,quantity:4,organization:'School'});await assert.rejects(()=>f.api.invite('reader',0,'a@example.test'));f.pay('tr_1');f.payments.get('tr_1').amount.value='3.99';await assert.rejects(()=>f.api.payment('tr_1'));assert.equal(f.invoices.size,0);
 for(const quantity of [0,1.5,101,'4'])await assert.rejects(()=>fixture().api.checkout(f.buyer,{...f.input,quantity,organization:'School'}));
});
test('simultaneous acceptance cannot give one place to two accounts',async()=>{
 const f=await paidSchool();await f.api.invite('reader',0,'a@example.test');const token=schoolToken(f);const results=await Promise.allSettled(['a','b'].map(uid=>f.api.accept({uid,email:'a@example.test'},token)));assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
});

test('checkout waits for webhook automatically instead of reporting no payment',async()=>{const f=fixture();await f.api.checkout(f.buyer,f.input);const pending=await f.api.status('reader');assert.equal(pending.paymentStatus,'open');assert.equal(pending.allowed,false);f.pay('tr_1');await f.api.payment('tr_1');const paid=await f.api.status('reader');assert.equal(paid.paymentStatus,'paid');assert.equal(paid.allowed,true);});

function recurringPayment(f,id,start,status){
 const first=f.payments.get('tr_1');
 const payment={...first,id,sequenceType:'recurring',subscriptionId:'sub_test',status,createdAt:new Date(start).toISOString()};
 if(status==='paid')payment.paidAt=new Date(start).toISOString();else delete payment.paidAt;
 f.payments.set(id,payment);
}
test('paid renewal extends exactly one month, keeps existing pupil QR and deduplicates concurrent notifications',async()=>{
 const f=fixture();await f.api.checkout(f.buyer,f.input);f.pay('tr_1');await f.api.payment('tr_1');
 const end=(await f.api.status('reader')).paidUntil;const qr=await f.api.link('reader');f.setClock(end);
 recurringPayment(f,'tr_renew',end,'paid');await Promise.all([f.api.payment('tr_renew'),f.api.payment('tr_renew')]);await f.api.payment('tr_renew');
 const s=await f.api.status('reader');assert.equal(new Date(s.paidUntil).toISOString(),'2027-03-15T12:00:00.000Z');assert.equal(s.allowed,true);assert.equal(s.paymentStatus,'paid');assert.equal(f.invoices.size,2);assert.equal(f.counts().subscriptions,1);assert.equal((await f.api.student(qr.token)).allowed,true);
});
test('failed renewal preserves remaining paid hours, creates no invoice and closes access and QR at expiry',async()=>{
 const f=fixture();await f.api.checkout(f.buyer,f.input);f.pay('tr_1');await f.api.payment('tr_1');
 const end=(await f.api.status('reader')).paidUntil;const qr=await f.api.link('reader');const midnight=end-12*3600000;f.setClock(midnight);
 recurringPayment(f,'tr_failed',midnight,'failed');await f.api.payment('tr_failed');await f.api.payment('tr_failed');
 let s=await f.api.status('reader');assert.equal(s.paymentStatus,'failed');assert.equal(s.paidUntil,end);assert.equal(s.allowed,true);assert.equal(f.invoices.size,1);assert.equal((await f.api.student(qr.token)).allowed,true);
 f.setClock(end+1);s=await f.api.status('reader');assert.equal(s.allowed,false);await assert.rejects(()=>f.api.student(qr.token));assert.equal(f.invoices.size,1);
});
test('failed school renewal expires all teacher seats without generating another school invoice',async()=>{
 const f=await paidSchool(2);await f.api.invite('reader',0,'teacher@example.test');await f.api.accept({uid:'teacher',email:'teacher@example.test'},schoolToken(f));const qr=await f.api.link('teacher');
 const end=(await f.api.status('reader')).paidUntil;f.setClock(end-12*3600000);recurringPayment(f,'tr_schoolfail',f.clock(),'failed');await f.api.payment('tr_schoolfail');assert.equal((await f.api.status('teacher')).allowed,true);assert.equal(f.invoices.size,1);
 f.setClock(end+1);assert.equal((await f.api.status('teacher')).allowed,false);await assert.rejects(()=>f.api.student(qr.token));assert.equal(f.invoices.size,1);
});

for(const mode of ['test','live']) test(mode+': isolated purchase, school seats, QR and cancellation',async()=>{
 const shared=database(),f=fixture({mode,database:shared}),other=fixture({mode:mode==='test'?'live':'test',database:shared});
 await f.api.checkout(f.buyer,{...f.input,quantity:2,organization:'School'});f.pay('tr_1');await f.api.payment('tr_1');
 assert.equal((await other.api.status(f.buyer.uid)).school,null);assert.equal([...f.invoices.values()][0].environment,mode);
 await f.api.invite(f.buyer.uid,0,'teacher@example.test');
 const inv=[...f.records.values()].find(x=>x.kind==='invitation');const token=new URL(inv.url).hash.slice(8);
 await assert.rejects(()=>other.api.accept({uid:'teacher',email:'teacher@example.test'},token));
 await f.api.accept({uid:'teacher',email:'teacher@example.test'},token);
 const qr=await f.api.link('teacher');await assert.rejects(()=>other.api.student(qr.token));
 assert.equal((await f.api.student(qr.token)).allowed,true);assert.equal((await other.api.status('teacher')).allowed,false);
 await assert.rejects(()=>f.api.cancel('teacher'));await f.api.cancel(f.buyer.uid);assert.equal((await f.api.status('teacher')).allowed,true);
 assert([...f.records.keys()].every(k=>k.startsWith(mode==='test'?'readingTest':'readingLive')));
});
test('live order rejects a provider test payment without granting access or invoice',async()=>{
 const f=fixture({mode:'live'});await f.api.checkout(f.buyer,f.input);f.pay('tr_1');f.payments.get('tr_1').mode='test';await assert.rejects(()=>f.api.payment('tr_1'));assert.equal((await f.api.status('reader')).allowed,false);assert.equal(f.invoices.size,0);
});
test('failed renewal queues one customer notice, survives old first-payment callbacks, clears after recovery',async()=>{
 const f=fixture({mode:'live'});await f.api.checkout(f.buyer,f.input);f.pay('tr_1');await f.api.payment('tr_1');
 const end=(await f.api.status('reader')).paidUntil;f.setClock(end-1000);
 f.payments.set('tr_failed',{...f.payments.get('tr_1'),id:'tr_failed',status:'failed',sequenceType:'recurring',subscriptionId:'sub_test',createdAt:new Date(end).toISOString()});
 await f.api.payment('tr_failed');await f.api.payment('tr_failed');await f.api.payment('tr_1');
 let status=await f.api.status('reader');assert.equal(status.renewalFailed,true);assert.equal(status.allowed,true);assert.equal(f.invoices.size,1);
 assert.equal([...f.records.values()].filter(v=>v.kind==='renewal-failed').length,1);
 f.setClock(end+1);assert.equal((await f.api.status('reader')).allowed,false);
 f.pay('tr_failed');await f.api.payment('tr_failed');assert.equal((await f.api.status('reader')).renewalFailed,false);assert.equal((await f.api.status('reader')).allowed,true);assert.equal(f.invoices.size,2);
});
