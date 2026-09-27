const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readingAccess, readingOwnerKey, nextReadingMonth, firstReadingPayment, recurringReadingSubscription } = require('./lib/reading-plan.js');
const identity = { project:'zisa-collegas', uid:'colleague-1' };
const now=Date.parse('2026-09-27T12:00:00Z');
const input={ identity, grandfatheredColleague:false, now, environment:'live' };
const grant={owner:identity,product:'zisa-lezen-monthly',environment:'live',paidUntil:now+1000};
test('existing colleague retains full access without a purchase',()=>assert.deepEqual(readingAccess({...input,grandfatheredColleague:true}),{allowed:true,reason:'colleague'}));
test('anonymous and new colleague have no paid access',()=>{
  assert.equal(readingAccess({...input,identity:null,grandfatheredColleague:true}).allowed,false);
  assert.equal(readingAccess(input).allowed,false);
});
test('only verified Pro identity can use a Pro entitlement',()=>{
  assert.equal(readingAccess({...input,proPaidUntil:now+1000}).allowed,false);
  assert.equal(readingAccess({...input,identity:{project:'zisa-spelletjesmaker-pro',uid:'pro-1'},proPaidUntil:now+1000}).reason,'pro');
});
test('cancellation preserves paid period; expiration and revocation deny access',()=>{
  assert.equal(readingAccess({...input,grant:{...grant,renewalCanceled:true}}).allowed,true);
  assert.equal(readingAccess({...input,grant:{...grant,paidUntil:now}}).allowed,false);
  assert.equal(readingAccess({...input,grant:{...grant,revoked:true}}).allowed,false);
});
test('test payment, another UID, another product or another auth project cannot grant live access',()=>{
  for(const other of [{...grant,environment:'test'},{...grant,owner:{...identity,uid:'other'}},{...grant,product:'zisa-pro'},{...grant,owner:{...identity,project:'zisa-spelletjesmaker-pro'}}]) assert.equal(readingAccess({...input,grant:other}).allowed,false);
  assert.notEqual(readingOwnerKey(identity),readingOwnerKey({...identity,project:'zisa-spelletjesmaker-pro'}));
});
test('calendar months clamp at month end, including leap years',()=>{
  assert.equal(nextReadingMonth(new Date('2027-01-31T12:00:00Z')).toISOString(),'2027-02-28T12:00:00.000Z');
  assert.equal(nextReadingMonth(new Date('2028-01-31T12:00:00Z')).toISOString(),'2028-02-29T12:00:00.000Z');
  assert.equal(nextReadingMonth(new Date('2026-12-27T12:00:00Z')).toISOString(),'2027-01-27T12:00:00.000Z');
});
const config={mode:'test',apiKey:'test_fixture',redirectUrl:'https://example.test/return',webhookUrl:'https://example.test/webhook'};
const order={id:'order-1',customerId:'cst_fixture',owner:identity,consentRecorded:true};
test('preparation cannot use live payments or skip explicit consent',()=>{
  assert.throws(()=>firstReadingPayment({...config,mode:'disabled'},order));
  assert.throws(()=>firstReadingPayment({...config,apiKey:'live_fixture'},order));
  assert.throws(()=>firstReadingPayment(config,{...order,consentRecorded:false}));
  const payment=firstReadingPayment(config,order);
  assert.deepEqual(payment.amount,{currency:'EUR',value:'3.99'});
  assert.equal(payment.sequenceType,'first');
});
test('renewal starts after first paid period and requires a valid mandate',()=>{
  const setup={firstPaymentPaid:true,mandateStatus:'valid',mandateId:'mdt_fixture',paidUntil:new Date('2026-10-27T12:00:00Z')};
  const payload=recurringReadingSubscription(config,setup,new Date(now));
  assert.equal(payload.startDate,'2026-10-27');assert.equal(payload.interval,'1 month');
  assert.throws(()=>recurringReadingSubscription(config,{...setup,firstPaymentPaid:false},new Date(now)));
  assert.throws(()=>recurringReadingSubscription(config,{...setup,mandateStatus:'invalid'},new Date(now)));
});
