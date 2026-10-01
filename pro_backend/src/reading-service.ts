/** Durable reading billing integration. Test-only; mounted only when explicitly enabled. */
import { randomUUID, createHash } from 'crypto';
import type { Firestore } from 'firebase-admin/firestore';
import { readingOwnerKey, firstReadingPayment, recurringReadingSubscription, readingQuantity, readingAmount } from './reading-plan';
import { readingMollie } from './reading-mollie';
import { ReadingOrder, ReadingPayment, readingPeriod, applyReadingPayment, readingPaidUntil, requestReadingCancellation, confirmReadingCancellation } from './reading-ledger';
import { createReadingLink, hashReadingToken, canUseReadingLink } from './reading-security';
import { prepareReadingInvoice, ReadingInvoice } from './reading-invoice';
import { readingSchool } from './reading-school';
import { readingBilling } from './reading-billing';

export type ReadingServiceConfig = { mode:'test'; apiKey:string; redirectUrl:string; webhookUrl:string; profileId:string };
type Buyer = { uid:string; email:string };
type Order = ReadingOrder & { email:string; billing:ReadingInvoice['customer']; createdAt:number; anchor?:number; checkoutUrl?:string; paymentStatus?:string; consentVersion:string; consentAt:number };
const identity = (uid:string) => ({ project:'zisa-spelletjesmaker-pro' as const, uid });
const ownerId = (uid:string) => createHash('sha256').update(readingOwnerKey(identity(uid))).digest('hex');
export const READING_COLLECTIONS = { orders:'readingTestOrders', accounts:'readingTestAccounts', operations:'readingTestOperations', links:'readingTestLinks', invoices:'readingTestInvoices', outbox:'readingTestOutbox' };

export function createReadingService(db:Firestore, config:ReadingServiceConfig, deps:{
  hasPro:(uid:string)=>Promise<boolean>;
  invoice:(invoice:ReadingInvoice)=>Promise<void>;
  provider?:ReturnType<typeof readingMollie>;
  now?:()=>number;
}) {
  const provider=deps.provider || readingMollie(config);
  const now=deps.now || Date.now;
  const school=readingSchool(db,now,config.redirectUrl);
  const orders=db.collection(READING_COLLECTIONS.orders),accounts=db.collection(READING_COLLECTIONS.accounts);
  async function orderFor(uid:string):Promise<Order|null> {
    const account=await accounts.doc(ownerId(uid)).get();
    const id=account.data()?.orderId;
    if(!id)return null;
    const snap=await orders.doc(id).get();const order=snap.data() as Order;
    if(!order || order.owner.uid!==uid || order.owner.project!=='zisa-spelletjesmaker-pro')throw new Error('Invalid owner binding');
    return order;
  }
  /** Provider operations are outside transactions. Stable keys make short retries safe.
   * After 50 minutes an uncertain result needs reconciliation, not another POST. */
  async function operation<T>(key:string, run:(id:string)=>Promise<T>):Promise<T> {
    const ref=db.collection(READING_COLLECTIONS.operations).doc(key);
    const saved=await db.runTransaction(async tx=>{
      const snap=await tx.get(ref);const data=snap.data();
      if(data?.done)return {done:true,value:data.value};
      if(data && now()-data.startedAt>50*60*1000)throw new Error('Betaling wordt gecontroleerd; start geen tweede betaling.');
      if(!snap.exists)tx.create(ref,{startedAt:now(),done:false});
      return {done:false,value:null};
    });
    if(saved.done)return saved.value as T;
    const result=await run(key);
    await ref.set({done:true,value:result},{merge:true});
    return result;
  }
  async function status(uid:string) {
    const pro=await deps.hasPro(uid),order=await orderFor(uid);
    const paidUntil=order ? readingPaidUntil(order,now()):0;
    const member=await school.membership(uid);
    const personal=(order?.quantity||1)===1&&paidUntil>now();
    const invoices=await db.collection(READING_COLLECTIONS.invoices).where('ownerKey','==',readingOwnerKey(identity(uid))).get();
    return {pro,allowed:pro||personal||member.allowed,school:school.overview(order),schoolMember:member.allowed,quantity:order?.quantity||1,amountEUR:readingAmount(order?.quantity).value,accessUntil:Math.max(personal?paidUntil:0,member.paidUntil),paidUntil,renewalCanceled:order?.renewalCanceled||false,cancelRequested:order?.cancelRequested||false,paymentStatus:order?.paymentStatus||'none',
      invoices:invoices.docs.map(d=>({id:d.id,number:d.data().number,date:d.data().snapshot?.issuedAt,ready:d.data().ready===true})).sort((a,b)=>(b.date||'').localeCompare(a.date||''))};
  }
  async function checkout(buyer:Buyer, input:any) {
    if(!/^pfl_[A-Za-z0-9]+$/.test(config.profileId) || (await provider.getProfile()).id!==config.profileId)throw new Error('Mollie profile does not match the spelletjesmaker');
    const quantity=readingQuantity(input?.quantity);
    if(quantity===1 && await deps.hasPro(buyer.uid))throw new Error('Zisa Lezen is al inbegrepen bij je Pro-abonnement.');
    if(input?.consent!==true || input?.consentVersion!=='reading-monthly-v1')throw new Error('Bevestig de maandelijkse betaling.');
    const billing=readingBilling(input,buyer.email);
    if(quantity>1 && !billing.organization)throw new Error('Vul de naam van de school in.');
    if(quantity===1 && (await school.membership(buyer.uid)).allowed)throw new Error('Je hebt al leestoegang via je school.');
    const accountRef=accounts.doc(ownerId(buyer.uid));
    const id=await db.runTransaction(async tx=>{
      const account=await tx.get(accountRef);const existingId=account.data()?.orderId;
      if(existingId){
        const snap=await tx.get(orders.doc(existingId));const old=snap.data() as Order;
        if(!old || old.owner.uid!==buyer.uid)throw new Error('Invalid account');
        if(readingPaidUntil(old,now())>now())throw new Error('Je hebt al betaalde leestoegang.');
        if(old.subscriptionId && !old.renewalCanceled)throw new Error('Beheer eerst je bestaande abonnement.');
        if(!old.renewalCanceled && !['failed','canceled','expired'].includes(old.paymentStatus||'')){if((old.quantity||1)!==quantity)throw new Error('Je hebt al een lopende bestelling met een ander aantal plaatsen.');return existingId as string;}
      }
      const orderId=randomUUID();
      const fresh:Order={id:orderId,owner:identity(buyer.uid),email:buyer.email,billing,quantity,createdAt:now(),customerId:'',firstPaymentId:'',entries:{},cancelRequested:false,renewalCanceled:false,consentVersion:'reading-monthly-v1',consentAt:now()};
      tx.create(orders.doc(orderId),fresh);tx.set(accountRef,{orderId},{merge:true});return orderId;
    });
    let order=(await orders.doc(id).get()).data() as Order;
    const customer=await operation(`${id}-customer`,()=>provider.createCustomer(buyer.email,`${id}:customer`));
    if(!/^cst_[A-Za-z0-9]+$/.test(customer.id))throw new Error('Invalid provider customer');
    await orders.doc(id).update({customerId:customer.id});
    order={...order,customerId:customer.id};
    const result=await operation(`${id}-payment`,()=>provider.createPayment(firstReadingPayment(config,{id,customerId:customer.id,owner:order.owner,quantity:order.quantity,consentRecorded:true}),`${id}:first`));
    const url=new URL(result?._links?.checkout?.href || '');
    if(!/^tr_[A-Za-z0-9]+$/.test(result.id) || result.mode!=='test' || url.protocol!=='https:' || !['www.mollie.com','checkout.mollie.com'].includes(url.hostname))throw new Error('Invalid checkout response');
    await orders.doc(id).update({firstPaymentId:result.id,checkoutUrl:url.href});
    return {checkoutUrl:url.href};
  }
  async function cancel(uid:string,expectedOrderId?:string) {
    const order=await orderFor(uid);if(!order)throw new Error('Geen leesabonnement gevonden.');
    if(expectedOrderId&&order.id!==expectedOrderId)throw new Error('Deze bestelling is gewijzigd. Zoek het abonnement opnieuw op.');
    await orders.doc(order.id).update({cancelRequested:requestReadingCancellation(order,identity(uid)).cancelRequested});
    await settleCancellation(order.id);
    return status(uid);
  }
  async function settleCancellation(id:string) {
    const order=(await orders.doc(id).get()).data() as Order;
    if(!order.cancelRequested)return;
    if(!order.subscriptionId)return; // Reconciliation handles an in-flight creation.
    const remote=await provider.cancelSubscription(order.customerId,order.subscriptionId);
    const next=confirmReadingCancellation(order,remote);
    await orders.doc(id).update({renewalCanceled:next.renewalCanceled});
    const ref=db.collection(READING_COLLECTIONS.outbox).doc(`${id}-canceled`);
    await db.runTransaction(async tx=>{const s=await tx.get(ref);if(!s.exists)tx.create(ref,{kind:'cancellation',to:order.email,ownerKey:readingOwnerKey(order.owner),paidUntil:readingPaidUntil(order,now()),createdAt:now(),sent:false});});
  }
  async function payment(paymentId:string) {
    const remote=await provider.getPayment(paymentId) as ReadingPayment & {paidAt?:string;createdAt?:string;mandateId?:string};
    let found=await orders.where('firstPaymentId','==',paymentId).limit(1).get();
    if(found.empty && remote.subscriptionId)found=await orders.where('subscriptionId','==',remote.subscriptionId).limit(1).get();
    if(found.empty)throw new Error('Payment binding is not ready; retry later');
    const ref=found.docs[0].ref;
    const result=await db.runTransaction(async tx=>{
      const snap=await tx.get(ref);const order=snap.data() as Order;
      const isFirst=paymentId===order.firstPaymentId;
      const paidAt=Date.parse(remote.paidAt||'');
      if(isFirst && !order.anchor && remote.status!=='paid'){
        // Validate all bindings even for pending/failed messages.
        applyReadingPayment(order,remote,readingPeriod(order.createdAt,0));
        tx.update(ref,{paymentStatus:remote.status});return null;
      }
      const anchor=order.anchor || paidAt;
      if(!Number.isFinite(anchor))throw new Error('Provider payment date missing');
      let period=order.entries[paymentId]?.period;
      if(!period){
        if(isFirst)period=readingPeriod(anchor,0);
        else {
          // Map by provider creation date, never webhook arrival time. Subscription charges
          // may occur at midnight while the first purchase happened later that day.
          const created=Date.parse(remote.createdAt||'');if(!Number.isFinite(created))throw new Error('Provider creation date missing');
          // The subscription starts at the end of the first paid period. Mollie
          // anchors subsequent charges to THAT start date (e.g. Feb 28 after Jan 31).
          const renewalAnchor=readingPeriod(anchor,0).end;
          const a=new Date(renewalAnchor),d=new Date(created);
          const index=(d.getUTCFullYear()-a.getUTCFullYear())*12+d.getUTCMonth()-a.getUTCMonth();
          if(index<0)throw new Error('Unrecognized recurring period');
          period=readingPeriod(renewalAnchor,index);
          const expected=new Date(period.start).toISOString().slice(0,10);
          if(new Date(created).toISOString().slice(0,10)!==expected)throw new Error('Recurring payment needs period reconciliation');
        }
      }
      const next=applyReadingPayment(order,remote,period);
      tx.update(ref,{entries:next.entries,anchor,paymentStatus:remote.status});
      return {...next,anchor} as Order;
    });
    if(!result)return;
    if(remote.status==='paid' && !result.entries[paymentId].reversed){
      await deps.invoice(prepareReadingInvoice({payment:remote,owner:result.owner,period:result.entries[paymentId].period,customer:result.billing,quantity:result.quantity,paidAt:remote.paidAt!}));
      if(paymentId===result.firstPaymentId)await renew(result,remote.mandateId||'');
    }
    await settleCancellation(result.id);
  }
  async function renew(order:Order, mandateId:string) {
    let current=(await orders.doc(order.id).get()).data() as Order;
    if(current.subscriptionId || current.cancelRequested)return;
    const mandate=await provider.getMandate(order.customerId,mandateId);
    if(mandate.id!==mandateId || mandate.status!=='valid')throw new Error('Waiting for a valid mandate');
    const payload=recurringReadingSubscription(config,{firstPaymentPaid:true,quantity:order.quantity,mandateStatus:mandate.status,mandateId,paidUntil:new Date(readingPeriod(order.anchor!,0).end)},new Date(now()));
    const remote=await operation(`${order.id}-subscription`,()=>provider.createSubscription(order.customerId,payload,`${order.id}:subscription`));
    if(!/^sub_[A-Za-z0-9]+$/.test(remote.id))throw new Error('Invalid subscription');
    await orders.doc(order.id).update({subscriptionId:remote.id});
    await settleCancellation(order.id); // A concurrent cancellation must win.
  }
  async function link(uid:string) {
    if(!(await status(uid)).allowed)throw new Error('Geen actieve leestoegang.');
    const ref=accounts.doc(ownerId(uid));const version=await db.runTransaction(async tx=>{const s=await tx.get(ref);const v=(s.data()?.linkVersion||0)+1;tx.set(ref,{linkVersion:v},{merge:true});return v;});
    const result=createReadingLink(identity(uid),version,null,now());
    await db.collection(READING_COLLECTIONS.links).doc(result.record.hash).set({...result.record,uid});
    return {token:result.token};
  }
  async function student(token:string) {
    const snap=await db.collection(READING_COLLECTIONS.links).doc(hashReadingToken(token)).get();const record=snap.data() as any;
    if(!record)throw new Error('Deze leeslink is niet actief.');
    const account=await accounts.doc(ownerId(record.uid)).get();
    const allowed=canUseReadingLink(record,{token,ownerKey:readingOwnerKey(identity(record.uid)),version:account.data()?.linkVersion,hasReadingAccess:(await status(record.uid)).allowed,now:now(),scope:'reading'});
    if(!allowed)throw new Error('Deze leeslink is niet actief.');
    return {allowed:true};
  }
  async function reconcile(id:string) {
    const snap=await orders.doc(id).get();if(!snap.exists)return;
    const order=snap.data() as Order;
    if(order.firstPaymentId)await payment(order.firstPaymentId);
    const fresh=(await orders.doc(id).get()).data() as Order;
    if(fresh.subscriptionId){
      const response=await provider.listSubscriptionPayments(fresh.customerId,fresh.subscriptionId);
      for(const p of response?._embedded?.payments||[])await payment(p.id);
    }
    await settleCancellation(id);
  }
  return {status,checkout,cancel,payment,link,student,reconcile,invite:school.assign,accept:school.accept};
}
