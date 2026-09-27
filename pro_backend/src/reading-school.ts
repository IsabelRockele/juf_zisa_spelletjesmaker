import {randomBytes,createHash} from 'crypto';
import type {Firestore} from 'firebase-admin/firestore';
import {readingPaidUntil,ReadingOrder} from './reading-ledger';
import {readingOwnerKey} from './reading-plan';
type Seat={email:string;uid:string|null;version:number;state:'invited'|'active'|'empty';expiresAt:number};
type SchoolOrder=ReadingOrder & {seats?:Record<string,Seat>};
const ownerKey=(uid:string)=>readingOwnerKey({project:'zisa-spelletjesmaker-pro',uid});
const accountId=(uid:string)=>createHash('sha256').update(ownerKey(uid)).digest('hex');
const digest=(value:string)=>createHash('sha256').update(value).digest('hex');
export function readingSchool(db:Firestore,now:()=>number,returnUrl:string){
 const accounts=db.collection('readingTestAccounts'),orders=db.collection('readingTestOrders');
 const invites=db.collection('readingTestInvitations'),outbox=db.collection('readingTestOutbox');
 function overview(order:SchoolOrder|null){
   if(!order || (order.quantity||1)<2)return null;
   return {quantity:order.quantity,active:readingPaidUntil(order,now())>now(),seats:Array.from({length:order.quantity!},(_,i)=>{
     const seat=order.seats?.[String(i)];return {index:i,email:seat?.email||'',state:seat?.state||'empty',expired:seat?.state==='invited'&&seat.expiresAt<=now()};
   })};
 }
 async function membership(uid:string){
   const a=(await accounts.doc(accountId(uid)).get()).data();
   if(!a?.schoolOrderId)return {allowed:false,paidUntil:0};
   const o=(await orders.doc(a.schoolOrderId).get()).data() as SchoolOrder|undefined;
   const seat=o?.seats?.[String(a.schoolSeat)];
   const paidUntil=o && seat?.uid===uid && seat.state==='active'?readingPaidUntil(o,now()):0;
   return {allowed:paidUntil>now(),paidUntil};
 }
 async function assign(uid:string,index:number,emailInput:string,remove=false,resend=false){
   const email=typeof emailInput==='string'?emailInput.trim().toLowerCase():'';
   if(!remove && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254))throw new Error('Vul een geldig e-mailadres in.');
   if(!Number.isInteger(index)||index<0||index>=100)throw new Error('Deze leerkrachtplaats bestaat niet.');
   const token=randomBytes(32).toString('base64url'),hash=digest(token);
   return db.runTransaction(async tx=>{
     const a=await tx.get(accounts.doc(accountId(uid)));
     const orderId=a.data()?.orderId;if(!orderId)throw new Error('Geen schoolabonnement gevonden.');
     const ref=orders.doc(orderId),snap=await tx.get(ref),order=snap.data() as SchoolOrder;
     if(!order || order.owner.uid!==uid || order.owner.project!=='zisa-spelletjesmaker-pro' || (order.quantity||1)<2 || index>=order.quantity!)throw new Error('Geen toegang tot deze leerkrachtplaats.');
     if(!remove && readingPaidUntil(order,now())<=now())throw new Error('Geen actieve schoolbetaling.');
     const seats={...order.seats},old=seats[String(index)];
     if(!remove && Object.entries(seats).some(([i,s])=>i!==String(index)&&s.state!=='empty'&&s.email===email))throw new Error('Dit e-mailadres staat al bij een andere leerkrachtplaats.');
     if(!remove && old?.email===email && (old.state==='active'||(!resend && old.state==='invited'&&old.expiresAt>now())))return {queued:old.state==='invited'};
     const oldRef=old?.uid?accounts.doc(accountId(old.uid)):null;
     const oldAccount=oldRef?(await tx.get(oldRef)).data():null;
     const version=(old?.version||0)+1,expiresAt=now()+14*86400000;
     seats[String(index)]={email:remove?'':email,uid:null,version,state:remove?'empty':'invited',expiresAt};
     tx.update(ref,{seats});
     if(oldRef && oldAccount?.schoolOrderId===orderId && oldAccount.schoolSeat===index){
       tx.set(oldRef,{schoolOrderId:null,schoolSeat:null,linkVersion:(oldAccount.linkVersion||0)+1},{merge:true});
     }
     if(!remove){
       tx.create(invites.doc(hash),{orderId,index,email,version,expiresAt,acceptedUid:null});
       const url=new URL(returnUrl);url.hash=`invite=${token}`;
       tx.create(outbox.doc(`invite-${hash}`),{kind:'invitation',to:email,subject:'TEST — Je school nodigt je uit voor Zisa Lezen',url:url.href,invitationHash:hash,createdAt:now(),sent:false});
     }
     return {queued:!remove};
   });
 }
 async function accept(buyer:{uid:string;email:string},token:string){
   if(!/^[A-Za-z0-9_-]{43}$/.test(token||''))throw new Error('Deze uitnodiging is ongeldig.');
   return db.runTransaction(async tx=>{
     const ref=invites.doc(digest(token)),inv=(await tx.get(ref)).data();
     if(!inv || inv.email!==buyer.email.toLowerCase() || inv.expiresAt<=now())throw new Error('Deze uitnodiging is verlopen of hoort bij een ander e-mailadres.');
     const orderRef=orders.doc(inv.orderId),order=(await tx.get(orderRef)).data() as SchoolOrder;
     const seat=order?.seats?.[String(inv.index)];
     if(!seat || seat.version!==inv.version || seat.email!==inv.email || readingPaidUntil(order,now())<=now())throw new Error('Deze uitnodiging is niet meer actief.');
     if(inv.acceptedUid===buyer.uid && seat.uid===buyer.uid)return {accepted:true};
     if(inv.acceptedUid || seat.uid || seat.state!=='invited')throw new Error('Deze uitnodiging is al gebruikt.');
     const aRef=accounts.doc(accountId(buyer.uid)),a=(await tx.get(aRef)).data();
     const existing=a?.schoolOrderId?(await tx.get(orders.doc(a.schoolOrderId))).data() as SchoolOrder:undefined;
     const own=a?.orderId?(await tx.get(orders.doc(a.orderId))).data() as SchoolOrder:undefined;
     if(existing?.seats?.[String(a?.schoolSeat)]?.uid===buyer.uid && readingPaidUntil(existing,now())>now())throw new Error('Je hebt al een actieve plaats bij een school.');
     if(own && (own.quantity||1)===1 && readingPaidUntil(own,now())>now())throw new Error('Je hebt nog een persoonlijk leesabonnement. Laat eerst die betaalde periode aflopen.');
     tx.update(orderRef,{seats:{...order.seats,[String(inv.index)]:{...seat,state:'active',uid:buyer.uid}}});
     tx.update(ref,{acceptedUid:buyer.uid});
     tx.set(aRef,{schoolOrderId:inv.orderId,schoolSeat:inv.index,linkVersion:(a?.linkVersion||0)+1},{merge:true});
     return {accepted:true};
   });
 }
 return {overview,membership,assign,accept};
}
