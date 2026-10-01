import { onRequest } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const collections = ['orders', 'Orders', 'Bestellingen'];
const origins = ['https://tools.jufzisa.be', 'https://isabelrockele.github.io', 'http://localhost:8883', 'http://127.0.0.1:8883'];
type Buyer = { uid: string; email: string };

// UID, when recorded, takes precedence over a potentially changed email address.
export function ownsProInvoice(order: any, buyer: Buyer): boolean {
  return order.uid ? order.uid === buyer.uid :
    typeof order.email === 'string' && order.email.trim().toLowerCase() === buyer.email.trim().toLowerCase();
}
export function proInvoicePath(order: any): string | null {
  if (order.invoiceSeries !== 'live' || order.status !== 'betaald' || order.source === 'school') return null;
  const number = String(order.invoiceNumber || '');
  const path = String(order.invoiceStoragePath || '');
  if (!/^\d{4}-\d{4,}$/.test(number)) return null;
  return /^Facturen\/live\/\d{4}\/\d{4}-\d{4,}\.pdf$/.test(path) && path.endsWith('/' + number + '.pdf') ? path : null;
}

export const proInvoices = onRequest({ region: 'europe-west1', invoker: 'public', maxInstances: 3 }, async (req, res) => {
  res.set('Cache-Control', 'private, no-store');
  const origin = req.headers.origin;
  if (origin && !origins.includes(origin)) { res.status(403).end(); return; }
  if (origin) res.set('Access-Control-Allow-Origin', origin).set('Vary', 'Origin');
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).end(); return; }
  let buyer: Buyer;
  try {
    const token = /^Bearer (.+)$/.exec(req.headers.authorization || '')?.[1];
    if (!token) throw new Error('Missing token');
    const decoded = await getAuth().verifyIdToken(token, true);
    const user = await getAuth().getUser(decoded.uid);
    if (!user.email || user.disabled) throw new Error('Account unavailable');
    if (!user.emailVerified) { res.status(403).json({ error: 'Bevestig eerst je e-mailadres om je facturen te openen.', verifyEmail: true }); return; }
    buyer = { uid: user.uid, email: user.email };
  } catch { res.status(401).json({ error: 'Meld je opnieuw aan om je facturen te openen.' }); return; }
  try {
    const db = getFirestore();
    if (req.body?.action === 'download') {
      const { collection, id } = req.body;
      if (!collections.includes(collection) || typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,180}$/.test(id)) { res.status(404).end(); return; }
      const order = (await db.collection(collection).doc(id).get()).data();
      const path = order && ownsProInvoice(order, buyer) && proInvoicePath(order);
      if (!path) { res.status(404).json({ error: 'Deze factuur is niet beschikbaar voor je account.' }); return; }
      const [pdf] = await getStorage().bucket().file(path).download();
      res.set('Content-Type', 'application/pdf').set('Content-Disposition', `attachment; filename="factuur-zisa-pro-${order!.invoiceNumber}.pdf"`).status(200).send(pdf);
      return;
    }
    if (req.body?.action !== 'list') { res.status(400).end(); return; }
    const invoices = new Map<string, any>();
    const queries = collections.flatMap(collection => [
      { collection, field: 'uid', value: buyer.uid },
      ...[...new Set([buyer.email, buyer.email.toLowerCase()])].map(value => ({ collection, field: 'email', value })),
    ]);
    // No license guard: customers retain their invoices after access expires.
    const results = await Promise.all(queries.map(async q => ({ collection: q.collection, rows: await db.collection(q.collection).where(q.field, '==', q.value).get() })));
    for (const { collection, rows } of results) for (const doc of rows.docs) {
      const order = doc.data();
      const path = ownsProInvoice(order, buyer) && proInvoicePath(order);
      if (!path || invoices.has(path)) continue;
      invoices.set(path, { collection, id: doc.id, number: order.invoiceNumber,
        date: order.invoiceAssignedAt?.toMillis?.() || order.paidAt?.toMillis?.() || 0,
        description: String(order.description || 'Zisa PRO'), amountEUR: String(order.amountEUR || '') });
    }
    res.status(200).json({ invoices: [...invoices.values()].sort((a, b) => b.date - a.date || b.number.localeCompare(a.number)) });
  } catch {
    res.status(503).json({ error: 'Je facturen konden niet worden geladen. Probeer opnieuw of mail zebrapost@jufzisa.be.' });
  }
});
