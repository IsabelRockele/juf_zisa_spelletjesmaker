import {readingCollections,ReadingEnvironment} from './reading-environment';
import { createHash } from 'crypto';
import type { Firestore } from 'firebase-admin/firestore';
import type { Auth } from 'firebase-admin/auth';
import { readingPaidUntil } from './reading-ledger';

export function requireReadingAdmin(user:{uid:string;emailVerified:boolean;disabled:boolean},allowed:string){
 if(user.disabled||!user.emailVerified||!allowed.split(',').map(v=>v.trim()).filter(Boolean).includes(user.uid))throw new Error('Geen toegang tot leesbeheer.');
}
export function readingAdmin(db:Firestore,auth:Auth,service:{cancel:(uid:string,expectedOrderId?:string)=>Promise<any>},mode:ReadingEnvironment='test'){
 const collections=readingCollections(mode);
 async function lookup(input:unknown){
  const email=typeof input==='string'?input.trim().toLowerCase():'';
  if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Vul het e-mailadres van de aankoper in.');
  let buyer;
  try{buyer=await auth.getUserByEmail(email);}catch(error){if((error as any).code==='auth/user-not-found')throw new Error('Geen account gevonden met dit e-mailadres.');throw error;}
  const key=createHash('sha256').update('zisa-spelletjesmaker-pro:'+encodeURIComponent(buyer.uid)).digest('hex');
  const account=(await db.collection(collections.accounts).doc(key).get()).data();
  if(!account?.orderId)throw new Error('Geen eigen leesabonnement gevonden. Gebruik het account van de aankoper, niet dat van een uitgenodigde leerkracht.');
  const order=(await db.collection(collections.orders).doc(account.orderId).get()).data();
  if(!order||order.id!==account.orderId||order.owner?.uid!==buyer.uid||order.owner?.project!=='zisa-spelletjesmaker-pro')throw new Error('Geen geldig leesabonnement gevonden.');
  return {buyer,order};
 }
 function summary(buyer:any,order:any){return {orderId:order.id,email:buyer.email,quantity:order.quantity||1,school:order.billing?.organization||'',paidUntil:readingPaidUntil(order,Date.now()),renewalCanceled:!!order.renewalCanceled,cancelRequested:!!order.cancelRequested,paymentStatus:order.paymentStatus||'none'};}
 return {
  find:async(email:unknown)=>{const {buyer,order}=await lookup(email);return summary(buyer,order);},
  cancel:async(actorUid:string,input:any)=>{
   if(input?.requestedByBuyer!==true)throw new Error('Bevestig dat de aankoper om opzegging heeft gevraagd.');
   const {buyer,order}=await lookup(input.email);
   if(typeof input.orderId!=='string'||order.id!==input.orderId)throw new Error('Deze bestelling is gewijzigd. Zoek het abonnement opnieuw op.');
   if(!order.subscriptionId&&!order.renewalCanceled)throw new Error('Geen actief terugkerend abonnement gevonden.');
   const audit=db.collection(collections.adminActions).doc();
   await audit.set({action:'cancel',actorUid,buyerUid:buyer.uid,orderId:order.id,requestedByBuyer:true,requestedAt:Date.now(),state:'requested'});
   try{
    const status=await service.cancel(buyer.uid,order.id);
    await audit.update({state:status.renewalCanceled?'completed':'pending',completedAt:Date.now()});
    const latest=await lookup(input.email);return summary(latest.buyer,latest.order);
   }catch(error){await audit.update({state:'failed',failedAt:Date.now()});throw error;}
  }
 };
}
