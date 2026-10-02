const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),ts=require('typescript');
const exportsUnderTest={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/reading-verification.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:exportsUnderTest,require});
function setup(){
 const records=new Map();let generated=0;
 const user={uid:'reader',email:'reader@example.com',emailVerified:false};
 const claims={uid:'reader',aud:'zisa-spelletjesmaker-pro',iss:'https://securetoken.google.com/zisa-spelletjesmaker-pro',firebase:{sign_in_provider:'password'}};
 const auth={verifyIdToken:async(t,revoked)=>{assert.equal(revoked,true);if(t!=='valid')throw Error('invalid');return claims},getUser:async()=>user,generateEmailVerificationLink:async email=>{assert.equal(email,user.email);generated++;return 'https://example.com/verify?code=secret&mode=verifyEmail'}};
 const write=(ref,data)=>records.set(ref.id,{...records.get(ref.id),...data});
 const db={collection:name=>({doc:(id='mail-'+records.size)=>({id:name+'/'+id})}),runTransaction:async fn=>fn({get:async ref=>({data:()=>records.get(ref.id)}),set:write}),batch:()=>{const ops=[];return {create:(ref,data)=>ops.push(()=>write(ref,data)),set:(ref,data)=>ops.push(()=>write(ref,data)),commit:async()=>ops.forEach(fn=>fn())}}};
 const env={READING_TEST_EMAILS:user.email,READING_TEST_MAIL_ENABLED:'true',READING_TEST_RECIPIENT:'different@example.com'};
 return {user,claims,env,records,auth,run:(time=100000)=>exportsUnderTest.queueReadingVerification(auth,db,'Bearer valid',env,time),get generated(){return generated}};
}
test('unverified allowed account queues only to its Auth address, never reroutes or returns link',async()=>{const s=setup();const r=await s.run();assert.equal(r.queued,true);assert(!JSON.stringify(r).includes('secret'));const mail=[...s.records.entries()].find(([k])=>k.startsWith('post_msft/'))[1];assert.equal(mail.to[0],s.user.email);assert(mail.message.html.includes('&amp;mode'));assert.equal(s.generated,1)});
test('disallowed, disabled and anonymous identities cannot send',async()=>{for(const mode of ['disallowed','disabled','anonymous']){const s=setup();if(mode==='disallowed')s.env.READING_TEST_EMAILS='other@example.com';if(mode==='disabled')s.user.disabled=true;if(mode==='anonymous')s.claims.firebase.sign_in_provider='anonymous';await assert.rejects(s.run());assert.equal(s.generated,0)}});
test('wrong project cannot send',async()=>{const s=setup();s.claims.aud='other';await assert.rejects(s.run());assert.equal(s.generated,0)});
test('verified accounts do not receive another confirmation',async()=>{const s=setup();s.user.emailVerified=true;assert.equal((await s.run()).alreadyVerified,true);assert.equal(s.generated,0)});
test('resending is limited to once per minute and five times per hour',async()=>{const s=setup();await s.run();await assert.rejects(s.run(100001));for(let i=1;i<5;i++)await s.run(100000+i*60000);await assert.rejects(s.run(400000));assert.equal(s.generated,5)});
test('queue failure is surfaced instead of reporting sent',async()=>{const s=setup();s.auth.generateEmailVerificationLink=async()=>{throw Error('provider unavailable')};await assert.rejects(s.run());assert(![...s.records.keys()].some(k=>k.startsWith('post_msft/')))});
