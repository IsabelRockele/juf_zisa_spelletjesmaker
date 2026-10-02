/** Shared plan and pure payment payload builders. */
import { assertReadingKey } from './reading-environment';
export const READING_PLAN = Object.freeze({
  id: 'zisa-lezen-monthly',
  amount: Object.freeze({ currency: 'EUR', value: '3.99' }),
  interval: '1 month',
  description: 'Zisa Lezen — maandabonnement',
  automaticRenewal: true,
});

export function readingQuantity(value:unknown=1):number {
  if(typeof value!=='number'||!Number.isInteger(value)||value<1||value>100)throw new Error('Vul een aantal van 1 tot 100 leerkrachten in.');
  return value;
}
export function readingAmount(quantity:unknown=1){return {currency:'EUR',value:(readingQuantity(quantity)*399/100).toFixed(2)};}
// Reading buyers share Pro Auth; product grants are stored separately from Pro licenses.
export type ReadingIdentity = { project: 'zisa-collegas' | 'zisa-spelletjesmaker-pro'; uid: string };
export type ReadingGrant = {
  owner: ReadingIdentity;
  product: 'zisa-lezen-monthly';
  environment: 'test' | 'live';
  paidUntil: number;
  revoked?: boolean;
  renewalCanceled?: boolean;
};

/** Arguments must come from verified tokens and server-owned records, never browser claims. */
export function readingAccess(input: {
  identity: ReadingIdentity | null;
  grandfatheredColleague: boolean;
  proPaidUntil?: number;
  grant?: ReadingGrant;
  now: number;
  environment: 'test' | 'live';
}): { allowed: boolean; reason: 'colleague' | 'pro' | 'reading' | 'preview' } {
  const { identity, grant, now } = input;
  if (!identity || !identity.uid || !Number.isFinite(now)) return { allowed: false, reason: 'preview' };
  if (identity.project === 'zisa-collegas' && input.grandfatheredColleague) {
    return { allowed: true, reason: 'colleague' };
  }
  if (identity.project === 'zisa-spelletjesmaker-pro' && Number.isFinite(input.proPaidUntil) && input.proPaidUntil! > now) {
    return { allowed: true, reason: 'pro' };
  }
  if (grant?.product === READING_PLAN.id && grant.owner.project === identity.project && grant.owner.uid === identity.uid
    && grant.environment === input.environment && !grant.revoked && Number.isFinite(grant.paidUntil) && grant.paidUntil > now) {
    // Canceling renewal does not remove the period already paid for.
    return { allowed: true, reason: 'reading' };
  }
  return { allowed: false, reason: 'preview' };
}

export function readingOwnerKey(identity: ReadingIdentity): string {
  if (!['zisa-collegas', 'zisa-spelletjesmaker-pro'].includes(identity.project) || !identity.uid) throw new Error('Invalid reading identity');
  // Preserve identity boundaries: matching emails or UIDs in different projects do not link accounts.
  return `${identity.project}:${encodeURIComponent(identity.uid)}`;
}

/** End-of-month clamping avoids March 3 for a payment made on January 31. */
export function nextReadingMonth(start: Date): Date {
  if (!Number.isFinite(start.getTime())) throw new Error('Invalid date');
  const result = new Date(start);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + 1);
  const last = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, last));
  return result;
}

type PreparationConfig = { mode: 'disabled' | 'test' | 'live'; apiKey?: string; redirectUrl: string; webhookUrl: string };
function requireBillingConfig(config: PreparationConfig) {
  assertReadingKey(config.mode,config.apiKey||'');
  for (const value of [config.redirectUrl, config.webhookUrl]) {
    if (new URL(value).protocol !== 'https:') throw new Error('HTTPS endpoints required');
  }
}

/** Payload preparation only. These helpers do not contact Mollie or store credentials. */
export function firstReadingPayment(config: PreparationConfig, order: {
  id: string; customerId: string; owner: ReadingIdentity; consentRecorded: boolean; quantity?:number;
}) {
  requireBillingConfig(config);
  if (!order.id || !order.customerId.startsWith('cst_') || order.consentRecorded !== true) throw new Error('Order, customer and recurring-payment consent required');
  return {
    amount: readingAmount(order.quantity), customerId: order.customerId, sequenceType: 'first',
    description: READING_PLAN.description, redirectUrl: config.redirectUrl, webhookUrl: config.webhookUrl,
    metadata: { product: READING_PLAN.id, orderId: order.id, ownerKey: readingOwnerKey(order.owner) },
  };
}

export function recurringReadingSubscription(config: PreparationConfig, setup: {
  firstPaymentPaid: boolean; mandateStatus: string; mandateId: string; paidUntil: Date; quantity?:number;
}, now = new Date()) {
  requireBillingConfig(config);
  if (setup.firstPaymentPaid !== true || setup.mandateStatus !== 'valid' || !setup.mandateId.startsWith('mdt_')) throw new Error('Verified paid first payment and valid mandate required');
  if (!Number.isFinite(setup.paidUntil.getTime()) || setup.paidUntil <= now) throw new Error('A future paid period is required');
  return {
    amount: readingAmount(setup.quantity), interval: READING_PLAN.interval,
    description: READING_PLAN.description, mandateId: setup.mandateId,
    startDate: setup.paidUntil.toISOString().slice(0, 10), webhookUrl: config.webhookUrl,
    metadata: { product: READING_PLAN.id },
  };
}
