const {test}=require('node:test');const assert=require('node:assert/strict');
const {requireReadingAdmin,readingAdmin}=require('./lib/reading-admin');
test('admin access fails closed for unlisted, unverified and disabled users',()=>{
 for(const user of [{uid:'buyer',emailVerified:true,disabled:false},{uid:'admin',emailVerified:false,disabled:false},{uid:'admin',emailVerified:true,disabled:true}])assert.throws(()=>requireReadingAdmin(user,'admin'));
 assert.throws(()=>requireReadingAdmin({uid:'admin',emailVerified:true,disabled:false},''));
 requireReadingAdmin({uid:'admin',emailVerified:true,disabled:false},'admin');
});
function setup(){const order={id:'order1',owner:{uid:'buyer',project:'zisa-spelletjesmaker-pro'},quantity:2,subscriptionId:'sub_test',entries:{},renewalCanceled:false};let calls=0;const audits=[];
 const db={collection:name=>({doc:()=>({get:async()=>({data:()=>name==='readingTestAccounts'?{orderId:'order1'}:order}),set:async v=>audits.push(v),update:async v=>audits.push(v)})})};
 const admin=readingAdmin(db,{getUserByEmail:async()=>({uid:'buyer',email:'buyer@example.com'})},{cancel:async(uid,id)=>{assert.equal(uid,'buyer');assert.equal(id,'order1');calls++;order.renewalCanceled=true;return {renewalCanceled:true}}});return {admin,order,audits,get calls(){return calls}};
}
test('wrong owner binding is rejected',async()=>{const f=setup();f.order.owner.uid='other';await assert.rejects(f.admin.find('buyer@example.com'));});
test('confirmation and unchanged order are required',async()=>{const f=setup();await assert.rejects(f.admin.cancel('admin',{email:'buyer@example.com',orderId:'order1'}));await assert.rejects(f.admin.cancel('admin',{email:'buyer@example.com',orderId:'old',requestedByBuyer:true}));assert.equal(f.calls,0);});
test('cancellation uses buyer order and writes audit',async()=>{const f=setup();const result=await f.admin.cancel('admin',{email:'buyer@example.com',orderId:'order1',requestedByBuyer:true});assert.equal(f.calls,1);assert.equal(result.renewalCanceled,true);assert.equal(f.audits[0].actorUid,'admin');assert.equal(f.audits[1].state,'completed');});
