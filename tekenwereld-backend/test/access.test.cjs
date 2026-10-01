const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createAccess,licenseAccess,COLLEAGUES,PRO}=require('../access.cjs');
const license=(status,expires)=>({status,expiresAt:{toMillis:()=>expires}});
test('license status and expiration follow Pro portal policy',()=>{
 assert(licenseAccess(license('active',2000),1000));
 assert(licenseAccess(license('actief',2000),1000));
 assert(!licenseAccess(license('active',999),1000));
 assert(!licenseAccess(license('revoked',2000),1000));
 assert(!licenseAccess(null,1000));
});
test('verified project and latest license determine world access, with email fallback and bounded caching',async()=>{
 let time=1000;
 const data={licenses:[{uid:'paid',...license('active',2000)},{email:'mail@example.test',...license('active',3000)}],Licenties:[{uid:'paid',...license('inactive',2500)}]};
 const db={collection:n=>({where:(field,op,value)=>({orderBy:()=>({limit:()=>({get:async()=>({docs:data[n].filter(d=>d[field]===value).sort((a,b)=>b.expiresAt.toMillis()-a.expiresAt.toMillis()).slice(0,1).map(d=>({data:()=>d}))})})})})})};
 const access=createAccess(db,()=>time);
 assert.equal((await access({uid:'free',aud:COLLEAGUES})).worlds.length,4);
 await assert.rejects(access({uid:'free',aud:'other-project'}));
 assert.deepEqual((await access({uid:'trial',aud:PRO})).worlds,['aqua']);
 assert.deepEqual((await access({uid:'paid',aud:PRO})).worlds,['aqua']);
 assert.equal((await access({uid:'email',email:'mail@example.test',aud:PRO})).worlds.length,4);
 time=3001;
 assert.deepEqual((await access({uid:'email',email:'mail@example.test',aud:PRO})).worlds,['aqua']);
});
