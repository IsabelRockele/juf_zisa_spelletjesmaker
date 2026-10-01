const {worlds}=require('./policy.cjs');
const COLLEAGUES='zisa-collegas',PRO='zisa-spelletjesmaker-pro';
const ownerEmails=new Set(['isabel.rockele@gmail.com','jorn.neeus@gmail.com']);
// Match the Pro portal: latest license by uid, then email; active and unexpired.
function licenseAccess(license,now){
  const expires=license?.expiresAt?.toMillis?.()||0;
  return !!license&&['active','actief'].includes(String(license.status).toLowerCase())&&(!expires||expires>now);
}
function createAccess(db,now=Date.now){
  const cache=new Map();
  return async user=>{
    if(user.aud===COLLEAGUES)return {worlds:[...worlds],expires:Infinity};
    if(user.aud!==PRO)throw Error('Unexpected token audience');
    const cached=cache.get(user.uid);
    if(cached&&cached.until>now())return cached.access;
    async function newest(field,value){
      const lists=await Promise.all(['licenses','Licenties'].map(name=>db.collection(name).where(field,'==',value).orderBy('expiresAt','desc').limit(1).get()));
      return lists.flatMap(s=>s.docs.map(d=>d.data())).sort((a,b)=>(b.expiresAt?.toMillis?.()||0)-(a.expiresAt?.toMillis?.()||0))[0];
    }
    const email=String(user.email||'').toLowerCase();
    const owner=ownerEmails.has(email);
    const license=owner?null:await newest('uid',user.uid)|| (email?await newest('email',email):null);
    const paid=owner||licenseAccess(license,now());
    const expires=paid?(license?.expiresAt?.toMillis?.()||Infinity):Infinity;
    const access={worlds:paid?[...worlds]:['aqua'],expires};
    if(cache.size>1000)cache.clear();
    cache.set(user.uid,{until:Math.min(now()+60000,expires),access});
    return access;
  };
}
module.exports={createAccess,licenseAccess,COLLEAGUES,PRO};
