const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readingAuthenticator, createReadingLink, canUseReadingLink } = require('./lib/reading-security');
const { readingPeriod, applyReadingPayment, readingPaidUntil, requestReadingCancellation, confirmReadingCancellation } = require('./lib/reading-ledger');
const { readingMollie } = require('./lib/reading-mollie');
const { readingAccess } = require('./lib/reading-plan');
const { prepareReadingInvoice, archiveReadingInvoice } = require('./lib/reading-invoice');
const owner = { project: 'zisa-spelletjesmaker-pro', uid: 'buyer1' };
const anchor = Date.parse('2027-01-31T12:00:00Z');
const order = () => ({ id:'order1', owner, customerId:'cst_test', subscriptionId:'sub_test', firstPaymentId:'tr_first', entries:{}, cancelRequested:false, renewalCanceled:false });
const payment = () => ({ id:'tr_first', mode:'test', status:'paid', customerId:'cst_test', sequenceType:'first', amount:{currency:'EUR',value:'3.99'}, metadata:{ product:'zisa-lezen-monthly', orderId:'order1', ownerKey:'zisa-spelletjesmaker-pro:buyer1' } });
test('reading buyers cannot inherit colleagues or Pro privileges', () => {
  assert.equal(readingAccess({identity:owner,grandfatheredColleague:true,now:anchor,environment:'live'}).allowed,false);
  for (const project of ['zisa-collegas','unrelated-project','']) assert.throws(()=>readingAuthenticator(project,{}));
});
test('auth checks revocation, verified email and exact shared Pro project', async () => {
  let revoked;
  const claims={uid:'buyer1',aud:'zisa-spelletjesmaker-pro',iss:'https://securetoken.google.com/zisa-spelletjesmaker-pro',email_verified:true};
  const verifier={verifyIdToken:async(token,check)=>{assert.equal(token,'jwt');revoked=check;return claims;}};
  const authenticate=readingAuthenticator('zisa-spelletjesmaker-pro',verifier);
  assert.deepEqual(await authenticate('Bearer jwt'),owner); assert.equal(revoked,true);
  await assert.rejects(()=>authenticate('Bearer jwt extra'));
  claims.email_verified=false; await assert.rejects(()=>authenticate('Bearer jwt'));
  claims.email_verified=true;claims.aud='zisa-collegas';await assert.rejects(()=>authenticate('Bearer jwt'));
});
test('calendar billing retains original day beyond February', () => {
  assert.equal(new Date(readingPeriod(anchor,1).end).toISOString(),'2027-03-31T12:00:00.000Z');
  assert.equal(new Date(readingPeriod(Date.parse('2028-01-31T12:00:00Z'),0).end).getUTCDate(),29);
});
test('pending payment grants nothing; paid, duplicate and stale notifications cannot add months', () => {
  const p=readingPeriod(anchor,0),now=anchor+1000;
  let state=applyReadingPayment(order(),{...payment(),status:'pending'},p);
  assert.equal(readingPaidUntil(state,now),0);
  state=applyReadingPayment(state,payment(),p);
  const duplicate=applyReadingPayment(state,payment(),p);assert.deepEqual(duplicate,state);
  state=applyReadingPayment(state,{...payment(),status:'open'},p);
  assert.equal(readingPaidUntil(state,now),p.end);
  assert.throws(()=>applyReadingPayment(state,payment(),readingPeriod(anchor,1)));
});
test('mismatched owner, price, customer, mode and subscription are rejected', () => {
  for(const patch of [{mode:'live'},{customerId:'cst_other'},{amount:{currency:'EUR',value:'0.01'}},{metadata:{...payment().metadata,ownerKey:'zisa-spelletjesmaker-pro:other'}},{id:'tr_other',sequenceType:'recurring',subscriptionId:'sub_other'}]) {
    assert.throws(()=>applyReadingPayment(order(),{...payment(),...patch},readingPeriod(anchor,0)));
  }
});
test('future and failed renewals do not grant an unpaid period', () => {
  const recurring={...payment(),id:'tr_next',subscriptionId:'sub_test',sequenceType:'recurring'};
  let state=applyReadingPayment(order(),recurring,readingPeriod(anchor,2));
  assert.equal(readingPaidUntil(state,anchor+1),0);
  state=applyReadingPayment(state,{...recurring,id:'tr_fail',status:'failed'},readingPeriod(anchor,0));
  assert.equal(readingPaidUntil(state,anchor+1),0);
});
test('refund or chargeback removes only affected period and stale paid cannot restore it', () => {
  for(const kind of ['amountRefunded','amountChargedBack']) {
    let state=applyReadingPayment(order(),payment(),readingPeriod(anchor,0));
    state=applyReadingPayment(state,{...payment(),[kind]:{currency:'EUR',value:'3.99'}},readingPeriod(anchor,0));
    state=applyReadingPayment(state,payment(),readingPeriod(anchor,0));assert.equal(readingPaidUntil(state,anchor+1),0);
    state=applyReadingPayment(state,{...payment(),id:'tr_next',subscriptionId:'sub_test',sequenceType:'recurring'},readingPeriod(anchor,1));
    assert.equal(readingPaidUntil(state,readingPeriod(anchor,1).start+1),readingPeriod(anchor,1).end);
  }
});
test('cancellation requires owner and provider confirmation while preserving paid access', () => {
  let state=applyReadingPayment(order(),payment(),readingPeriod(anchor,0));
  assert.throws(()=>requestReadingCancellation(state,{...owner,uid:'other'}));
  state=requestReadingCancellation(state,owner);
  assert.throws(()=>confirmReadingCancellation(state,{id:'sub_test',status:'active'}));
  state=confirmReadingCancellation(state,{id:'sub_test',status:'canceled'});
  assert.equal(state.renewalCanceled,true);assert.equal(readingPaidUntil(state,anchor+1),readingPeriod(anchor,0).end);
  assert.deepEqual(requestReadingCancellation(state,owner),state);
});
test('student link expires, can be revoked and never grants account or generator privileges', () => {
  const {token,record}=createReadingLink(owner,1,anchor+5000,anchor);
  const current={token,ownerKey:'zisa-spelletjesmaker-pro:buyer1',version:1,hasReadingAccess:true,now:anchor,scope:'reading'};
  assert.equal(canUseReadingLink(record,current),true);
  assert.equal(JSON.stringify(record).includes(token),false);
  for(const patch of [{scope:'billing'},{scope:'generator'},{version:2},{hasReadingAccess:false},{now:anchor+5000},{ownerKey:'zisa-spelletjesmaker-pro:other'},{token:'bad'}]) assert.equal(canUseReadingLink(record,{...current,...patch}),false);
});
test('class QR works beyond a year without sessions but still requires entitlement and current version',()=>{
 const {token,record}=createReadingLink(owner,1,null,anchor);
 const current={token,ownerKey:'zisa-spelletjesmaker-pro:buyer1',version:1,hasReadingAccess:true,now:anchor+800*86400000,scope:'reading'};
 assert.equal(canUseReadingLink(record,current),true);
 assert.equal(canUseReadingLink(record,{...current,hasReadingAccess:false}),false);
 assert.equal(canUseReadingLink(record,{...current,version:2}),false);
 assert.equal(canUseReadingLink(record,{...current,scope:'billing'}),false);
 assert.equal(canUseReadingLink({...record,expiresAt:undefined},current),false);
});
test('Peppol identifiers and billing email validation reject incomplete or inconsistent details',()=>{
 const {readingBilling}=require('./lib/reading-billing');
 const base={name:'School',address:'Teststraat 1',organization:'School',peppolRequested:true,peppolId:'0088:1548079098355',gln:'1548079098355'};
 assert.equal(readingBilling(base,'owner@example.test').peppolId,base.peppolId);
 for(const patch of [{gln:'1548079098354'},{peppolId:'0088:1548079098354'},{billingEmail:'invalid'},{organization:''}])assert.throws(()=>readingBilling({...base,...patch},'owner@example.test'));
 assert.equal(readingBilling({...base,peppolRequested:false},'owner@example.test').peppolId,'');
});
test('Mollie adapter blocks live credentials and uses stable retry keys without real network', async () => {
  assert.throws(()=>readingMollie({mode:'test',apiKey:'live_secret'}));
  assert.throws(()=>readingMollie({mode:'live',apiKey:'test_fixture'}));
  const calls=[];
  const client=readingMollie({mode:'test',apiKey:'test_fixture'},async(url,options)=>{
    calls.push({url,options});return {ok:true,status:200,json:async()=>({id:'tr_first',mode:'test'})};
  });
  await client.createPayment({},'order1:first'); await client.createPayment({},'order1:first');
  assert.equal(calls[0].options.headers['Idempotency-Key'],calls[1].options.headers['Idempotency-Key']);
  assert.equal((await client.getPayment('tr_first')).mode,'test');
  assert.throws(()=>client.getMandate('../x','mdt_test'));
});
test('cancel retry reads provider state and avoids a second delete', async () => {
  let canceled=false,deletes=0;
  const client=readingMollie({mode:'test',apiKey:'test_fixture'},async(url,options)=>{
    if(options.method==='DELETE'){canceled=true;deletes++;}
    return {ok:true,status:200,json:async()=>({id:'sub_test',status:canceled?'canceled':'active'})};
  });
  await client.cancelSubscription('cst_test','sub_test');await client.cancelSubscription('cst_test','sub_test');assert.equal(deletes,1);
});
test('each paid month has its own invoice; pending and live payments cannot create test invoices', () => {
  const input={payment:payment(),owner,period:readingPeriod(anchor,0),paidAt:new Date(anchor).toISOString(),customer:{name:'Testklant',email:'buyer@example.test',address:'Teststraat 1'}};
  const first=prepareReadingInvoice(input);
  const next=prepareReadingInvoice({...input,payment:{...payment(),id:'tr_next'},period:readingPeriod(anchor,1)});
  assert.notEqual(first.key,next.key); assert.equal(first.amountEUR,'3.99');
  assert.match(first.renewalText,/Automatische/);
  for(const patch of [{status:'pending'},{mode:'live'},{amount:{currency:'EUR',value:'6.00'}}]) assert.throws(()=>prepareReadingInvoice({...input,payment:{...payment(),...patch}}));
});
test('invoice archive and separate customer/bookkeeping outbox jobs survive retries without duplicate numbers', async () => {
  const invoice=prepareReadingInvoice({payment:payment(),owner,period:readingPeriod(anchor,0),paidAt:new Date(anchor).toISOString(),customer:{name:'Testklant',email:'buyer@example.test',address:'Teststraat 1'}});
  const reservations=new Map(),files=new Map(),jobs=new Map();let fail=true;
  const ports={
    reserve:async value=>{if(!reservations.has(value.key))reservations.set(value.key,{number:'TEST-0001',snapshot:value});return reservations.get(value.key);},
    render:async()=>Buffer.from('fake PDF for orchestration test'),
    archive:async(path,pdf)=>{if(!files.has(path))files.set(path,pdf);},
    enqueue:async(key,job)=>{if(key.endsWith(':bookkeeping')&&fail){fail=false;throw new Error('temporary mail queue failure');}if(!jobs.has(key))jobs.set(key,job);},
  };
  await assert.rejects(()=>archiveReadingInvoice(invoice,ports,'books@example.test'));
  await archiveReadingInvoice(invoice,ports,'books@example.test');
  assert.equal(reservations.size,1);assert.equal(files.size,1);assert.equal(jobs.size,2);
  assert.equal(jobs.get(invoice.key+':customer').to,'buyer@example.test');
  assert.equal(jobs.get(invoice.key+':bookkeeping').to,'books@example.test');
});
test('reading archive uses reserved calendar year and keeps an existing legacy invoice path on retry',async()=>{
 const invoice=prepareReadingInvoice({payment:payment(),owner,period:readingPeriod(anchor,0),paidAt:new Date(anchor).toISOString(),customer:{name:'School',email:'school@example.test',address:'Teststraat 1'}});
 const paths=[];let archivePath;
 const ports={reserve:async()=>({number:'TEST-0001',snapshot:invoice,storageYear:2027,archivePath}),render:async()=>Buffer.from('test'),archive:async path=>paths.push(path),enqueue:async()=>{}};
 await archiveReadingInvoice(invoice,ports,'books@example.test');assert.equal(paths[0],'Facturen/test/Zisa Lezen/2027/factuur-zisa-lezen-TEST-0001.pdf');
 archivePath='Facturen/test/2026/TEST-0001.pdf';await archiveReadingInvoice(invoice,ports,'books@example.test');assert.equal(paths[1],archivePath);
});
