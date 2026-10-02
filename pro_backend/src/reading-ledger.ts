/** Pure transaction reducers. Production callers must load and save within one database transaction. */
import { READING_PLAN, ReadingIdentity, readingOwnerKey, readingAmount } from './reading-plan';
export type ReadingPeriod = { id: string; start: number; end: number };
export type ReadingPayment = {
  id: string; mode: string; status: string; customerId: string; subscriptionId?: string;
  sequenceType: string; amount: { currency: string; value: string };
  amountRefunded?: { currency: string; value: string }; amountChargedBack?: { currency: string; value: string };
  metadata?: { product?: string; orderId?: string; ownerKey?: string };
};
export type LedgerEntry = { paymentId: string; period: ReadingPeriod; paid: boolean; reversed: boolean; failed?:boolean };
export type ReadingOrder = {
  environment?: 'test' | 'live'; id: string; owner: ReadingIdentity; customerId: string; subscriptionId?: string;
  quantity?:number; firstPaymentId: string; entries: Record<string, LedgerEntry>; cancelRequested: boolean; renewalCanceled: boolean;
};

/** Always calculate from the original anchor, so Jan 31 -> Feb 28 -> Mar 31. */
export function readingPeriod(anchor: number, index: number): ReadingPeriod {
  if (!Number.isFinite(anchor) || !Number.isSafeInteger(index) || index < 0) throw new Error('Invalid period');
  const boundary = (offset: number) => {
    const start = new Date(anchor), result = new Date(anchor);
    result.setUTCDate(1); result.setUTCMonth(start.getUTCMonth() + offset);
    const last = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
    result.setUTCDate(Math.min(start.getUTCDate(), last)); return result.getTime();
  };
  const start = boundary(index), end = boundary(index + 1);
  if (!Number.isFinite(start) || !Number.isFinite(end)) throw new Error('Invalid period');
  return { id: `${anchor}:${index}`, start, end };
}
function reversedAmount(amount?: { currency: string; value: string }) {
  if (!amount) return false;
  if (amount.currency !== 'EUR' || !/^\d+\.\d{2}$/.test(amount.value)) throw new Error('Invalid reversal amount');
  return Number(amount.value) > 0;
}
/** payment must be fetched server-to-server from Mollie, never passed from the browser/webhook body.
 * period must come from a durable payment->billing-period mapping, never webhook arrival time.
 * This preparation fails closed on any refund; partial refunds require manual review. */
export function applyReadingPayment(order: ReadingOrder, payment: ReadingPayment, period: ReadingPeriod): ReadingOrder {
  if (!/^tr_[A-Za-z0-9]+$/.test(payment.id) || payment.mode !== (order.environment||'test') || payment.customerId !== order.customerId
    || payment.amount?.currency !== READING_PLAN.amount.currency || payment.amount?.value !== readingAmount(order.quantity).value) throw new Error('Payment does not match reading order');
  const first = payment.id === order.firstPaymentId;
  if (first) {
    if (payment.sequenceType !== 'first' || payment.metadata?.product !== READING_PLAN.id
      || payment.metadata?.ownerKey !== readingOwnerKey(order.owner) || payment.metadata?.orderId !== order.id) throw new Error('Invalid first payment');
  } else if (!order.subscriptionId || payment.subscriptionId !== order.subscriptionId || payment.sequenceType !== 'recurring') {
    throw new Error('Unknown recurring subscription');
  }
  if (!period.id || !Number.isFinite(period.start) || !Number.isFinite(period.end) || period.end <= period.start) throw new Error('Invalid period');
  const previous = order.entries[payment.id];
  if (previous && (previous.period.id !== period.id || previous.period.start !== period.start || previous.period.end !== period.end)) throw new Error('Payment period cannot change');
  const reversed = previous?.reversed === true || reversedAmount(payment.amountRefunded) || reversedAmount(payment.amountChargedBack);
  const paid = previous?.paid === true || payment.status === 'paid';
  return { ...order, entries: { ...order.entries, [payment.id]: { paymentId: payment.id, period: { ...period }, paid, reversed, failed:!paid && ['failed','canceled','expired'].includes(payment.status) } } };
}
export function readingPaidUntil(order: ReadingOrder, now: number): number {
  if (!Number.isFinite(now)) return 0;
  // Gaps and future payments cannot grant access to an unpaid current period.
  const paid = Object.values(order.entries).filter(x => x.paid && !x.reversed).map(x => x.period);
  let end = now;
  for (;;) {
    const next = Math.max(end, ...paid.filter(p => p.start <= end && p.end > end).map(p => p.end));
    if (next === end) return end === now ? 0 : end;
    end = next;
  }
}
export function requestReadingCancellation(order: ReadingOrder, identity: ReadingIdentity): ReadingOrder {
  if (readingOwnerKey(order.owner) !== readingOwnerKey(identity)) throw new Error('Alleen de eigenaar kan opzeggen');
  return { ...order, cancelRequested: true };
}
export function confirmReadingCancellation(order: ReadingOrder, remote: { id: string; status: string }): ReadingOrder {
  if (!order.cancelRequested || remote.id !== order.subscriptionId || remote.status !== 'canceled') throw new Error('Mollie cancellation has not been confirmed');
  return { ...order, renewalCanceled: true }; // Never erase the paid ledger.
}
