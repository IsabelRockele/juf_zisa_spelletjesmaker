/** Invoice preparation; dependencies are not connected to production storage or mail. */
import { READING_PLAN, ReadingIdentity, readingOwnerKey, readingQuantity, readingAmount } from './reading-plan';
import { ReadingPayment, ReadingPeriod } from './reading-ledger';
import { ReadingBilling } from './reading-billing';
export type ReadingInvoice = {
  key: string; environment: 'test'; product: string; ownerKey: string;
  paymentId: string; customer: ReadingBilling;
  quantity?:number; unitAmountEUR?:string; amountEUR: string; currency: 'EUR'; issuedAt: string; period: ReadingPeriod;
  description: string; renewalText: string;
};
/** Run only after payment validation and ledger commit; use the stored billing snapshot. */
export function prepareReadingInvoice(input: {
  payment: ReadingPayment; owner: ReadingIdentity; period: ReadingPeriod;
  customer: ReadingInvoice['customer']; paidAt: string; quantity?:number;
}): ReadingInvoice {
  const { payment, customer, period } = input; const quantity=readingQuantity(input.quantity);
  if (payment.mode !== 'test' || payment.status !== 'paid' || !/^tr_[A-Za-z0-9]+$/.test(payment.id)
    || payment.amount?.currency !== 'EUR' || payment.amount?.value !== readingAmount(quantity).value) throw new Error('Verified reading test payment required');
  if ((Number(payment.amountRefunded?.value || 0) > 0) || (Number(payment.amountChargedBack?.value || 0) > 0)) throw new Error('Reversal requires a separate accounting review');
  if (!customer.name?.trim() || !customer.address?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email || '')) throw new Error('Billing details required');
  if (!Number.isFinite(Date.parse(input.paidAt)) || !Number.isFinite(period.start) || !Number.isFinite(period.end) || period.end <= period.start) throw new Error('Valid payment date and period required');
  return {
    key: `reading-test-${payment.id}`, environment:'test', product:READING_PLAN.id,
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
export async function archiveReadingInvoice(invoice: ReadingInvoice, ports: InvoicePorts, bookkeepingEmail: string) {
  if (invoice.environment !== 'test' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookkeepingEmail)) throw new Error('Test environment and bookkeeping recipient required');
  const { number, snapshot, storageYear, archivePath } = await ports.reserve(invoice);
  if (!/^TEST-[A-Za-z0-9-]+$/.test(number) || snapshot.key !== invoice.key || snapshot.environment !== 'test') throw new Error('Invalid invoice reservation');
  const year = storageYear || new Date(snapshot.issuedAt).getUTCFullYear();
  const path = archivePath || `Facturen/test/Zisa Lezen/${year}/factuur-zisa-lezen-${number}.pdf`;
  if(!/^Facturen\/test\/(?:Zisa Lezen\/[0-9]{4}\/factuur-zisa-lezen-|[0-9]{4}\/)TEST-[A-Za-z0-9-]+\.pdf$/.test(path))throw new Error('Invalid reading archive path');
  const pdf = await ports.render(snapshot, number);
  await ports.archive(path, pdf);
  // Separate durable jobs: bookkeeping delivery can be retried without emailing the customer again.
  await ports.enqueue(`${snapshot.key}:customer`, { to:snapshot.customer.email, subject:`TEST — Zisa Lezen — factuur ${number}`, invoicePath:path, invoiceNumber:number });
  await ports.enqueue(`${snapshot.key}:bookkeeping`, { to:bookkeepingEmail, subject:`TEST — ${snapshot.customer.peppolRequested?'Nog via Peppol te versturen — ':''}Boekhouding Zisa Lezen — ${number}`, invoicePath:path, invoiceNumber:number,
    peppolInstructions:snapshot.customer.peppolRequested?[
      'Nog via Peppol te versturen. Gebruik dezelfde factuur en hetzelfde factuurnummer; de PDF-mail is geen Peppol-verzending.',
      `School: ${snapshot.customer.organization}`,`Naam: ${snapshot.customer.name}`,`Adres: ${snapshot.customer.address}`,
      `E-mail: ${snapshot.customer.email}`,`Peppol-ID: ${snapshot.customer.peppolId}`,
      `Ondernemingsnummer: ${snapshot.customer.vatNumber||'niet opgegeven'}`,`GLN: ${snapshot.customer.gln||'niet opgegeven'}`,
      `Bestelreferentie: ${snapshot.customer.purchaseReference||'niet opgegeven'}`].join('\n'):'' });
  return { number, path };
}
