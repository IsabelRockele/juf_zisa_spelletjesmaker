/** Validated invoice snapshots; the store binds the archive and counter to their environment. */
import { READING_PLAN, ReadingIdentity, readingOwnerKey, readingQuantity, readingAmount } from './reading-plan';
import { ReadingPayment, ReadingPeriod } from './reading-ledger';
import { ReadingBilling } from './reading-billing';
export type ReadingInvoice = {
  key: string; environment: 'test' | 'live'; product: string; ownerKey: string;
  paymentId: string; customer: ReadingBilling;
  quantity?:number; unitAmountEUR?:string; amountEUR: string; currency: 'EUR'; issuedAt: string; period: ReadingPeriod;
  description: string; renewalText: string;
};
/** Run only after payment validation and ledger commit; use the stored billing snapshot. */
export function prepareReadingInvoice(input: {
  environment?: 'test' | 'live'; payment: ReadingPayment; owner: ReadingIdentity; period: ReadingPeriod;
  customer: ReadingInvoice['customer']; paidAt: string; quantity?:number;
}): ReadingInvoice {
  const { payment, customer, period } = input; const environment=input.environment||'test';
  if(!['test','live'].includes(environment))throw new Error('Invalid invoice environment'); const quantity=readingQuantity(input.quantity);
  if (payment.mode !== environment || payment.status !== 'paid' || !/^tr_[A-Za-z0-9]+$/.test(payment.id)
    || payment.amount?.currency !== 'EUR' || payment.amount?.value !== readingAmount(quantity).value) throw new Error('Verified reading test payment required');
  if ((Number(payment.amountRefunded?.value || 0) > 0) || (Number(payment.amountChargedBack?.value || 0) > 0)) throw new Error('Reversal requires a separate accounting review');
  if (!customer.name?.trim() || !customer.address?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email || '')) throw new Error('Billing details required');
  if (!Number.isFinite(Date.parse(input.paidAt)) || !Number.isFinite(period.start) || !Number.isFinite(period.end) || period.end <= period.start) throw new Error('Valid payment date and period required');
  return {
    key: `reading-${environment}-${payment.id}`, environment, product:READING_PLAN.id,
    ownerKey:readingOwnerKey(input.owner), paymentId:payment.id, customer:{...customer},
    quantity,unitAmountEUR:'3.99',amountEUR:readingAmount(quantity).value, currency:'EUR', issuedAt:input.paidAt, period:{...period},
    description:quantity===1?'Zisa Lezen — 1 leerkracht en de eigen klas':`Zisa Lezen — ${quantity} leerkrachten met hun eigen klas`,
    renewalText:'Automatische maandelijkse verlenging tot opzegging. Opzeggen kan via je leesaccount.',
  };
}

export type InvoicePorts = {
  /** Atomic: reserve exactly once per invoice.key, using the central TEST invoice counter.
   * Return the immutable original snapshot on retries, never replace customer or dates. */
  reserve(invoice: ReadingInvoice): Promise<{ number: string; snapshot: ReadingInvoice; storageYear?:number; archivePath?:string }>;
  /** Adapt the existing Pro PDF renderer: reading branding, recipient, period, renewal text. */
  render(invoice: ReadingInvoice, number: string): Promise<Buffer>;
  /** Create-if-absent private object; never silently overwrite an issued invoice. */
  archive(path: string, pdf: Buffer): Promise<void>;
  /** Transactionally create-if-absent outbox job with attachment reference, not public URL. */
  enqueue(key: string, job: { to: string; subject: string; invoicePath: string; invoiceNumber: string; peppolInstructions?:string }): Promise<void>;
};
export async function archiveReadingInvoice(invoice: ReadingInvoice, ports: InvoicePorts) {
  if (!['test','live'].includes(invoice.environment)) throw new Error('Invalid invoice environment');
  const { number, snapshot, storageYear, archivePath } = await ports.reserve(invoice);
  if (!(invoice.environment==='test'?/^TEST-[A-Za-z0-9-]+$/:/^[0-9]{4}-[0-9]{4,}$/).test(number) || snapshot.key !== invoice.key || snapshot.environment !== invoice.environment) throw new Error('Invalid invoice reservation');
  const year = storageYear || new Date(snapshot.issuedAt).getUTCFullYear();
  const path = archivePath || `Facturen/${invoice.environment}/Zisa Lezen/${year}/factuur-zisa-lezen-${number}.pdf`;
  if(!validReadingInvoicePath(path,invoice.environment))throw new Error('Invalid reading archive path');
  const pdf = await ports.render(snapshot, number);
  await ports.archive(path, pdf);
  // The seller retrieves the private archived PDF in Firebase; only the buyer receives mail.
  await ports.enqueue(`${snapshot.key}:customer`, { to:snapshot.customer.email, subject:`${invoice.environment==='test'?'TEST — ':''}Zisa Lezen — factuur ${number}`, invoicePath:path, invoiceNumber:number });
  return { number, path };
}

export function validReadingInvoicePath(path:string,mode:'test'|'live'):boolean {
 return mode==='test'?/^Facturen\/test\/(?:Zisa Lezen\/[0-9]{4}\/factuur-zisa-lezen-|[0-9]{4}\/)TEST-[A-Za-z0-9-]+\.pdf$/.test(path):mode==='live'&&/^Facturen\/live\/Zisa Lezen\/[0-9]{4}\/factuur-zisa-lezen-[0-9]{4}-[0-9]{4,}\.pdf$/.test(path);
}
