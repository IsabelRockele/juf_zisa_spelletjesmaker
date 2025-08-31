/* Zisa PRO backend — Functions v2 — europe-west1
   - E-mail: schrijft naar 'mail' én 'post'
   - Bijlage: { filename, content (base64), type: "application/pdf" }
   - Mollie redirect => /pro/bedankt.html
   - Password reset 'Continue' => /pro/index.html
   - Alias: /createPayment
   - Schrijven/zoeken in orders:  ["orders","Orders","Bestellingen"]
   - Schrijven/zoeken in licenses:["licenses","Licenties"]
*/

import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const PDFDocument = require("pdfkit");

// ------------------------------------------------------------------
// Init
// ------------------------------------------------------------------
initializeApp();
const db   = getFirestore();
const auth = getAuth();

const REGION = "europe-west1";

// ------------------------------------------------------------------
// Config & constanten
// ------------------------------------------------------------------
const ALLOWED_ORIGINS = [
  "https://isabelrockele.github.io",
  // "http://127.0.0.1:5500",
  // "http://localhost:5500",
];

const FRONTEND_REPO   = "https://isabelrockele.github.io/juf_zisa_spelletjesmaker";
const APP_INDEX_URL   = `${FRONTEND_REPO}/pro/index.html`;    // voor password reset "Continue"
const THANKYOU_URL    = `${FRONTEND_REPO}/pro/bedankt.html`;  // redirect na Mollie

const MAIL_COLLECTIONS     = ["mail", "post"];
const ORDER_COLLECTIONS    = ["orders", "Orders", "Bestellingen"];
const LICENSE_COLLECTIONS  = ["licenses", "Licenties"];

const SELLER_NAME       = "Juf Zisa";
const SELLER_EMAIL      = "zebrapost@jufzisa.be";
const SELLER_ADDR1      = "Maasfortbaan 108";
const SELLER_ADDR2      = "2500 Lier";
const SELLER_ENTERPRISE = "Ondernemingsnummer 1026.769.348";
const SELLER_VAT_EXEMPT = "Onderneming onderworpen aan de vrijstellingsregel voor kleine ondernemingen.";

const PRICE_EUR_KOOP      = "40.00";
const PRICE_EUR_WAITLIST  = "35.00";

const DEVICE_LIMIT    = 2;
const ENTITLEMENT_ID  = "zisa-pro-1y";

const MOLLIE_API_URL  = "https://api.mollie.com/v2";

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
function setCors(res: any, origin?: string) {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  res.set("Access-Control-Allow-Origin", allow);
  res.set("Vary", "Origin");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function makeLicenseCode(): string {
  const block = () =>
    Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
  return `${block()}-${block()}-${block()}-${block()}`;
}

function asEUR(value: string) {
  return `€ ${Number(value).toFixed(2).replace(".", ",")}`;
}

function calcExpiry(): Timestamp {
  const now = new Date();
  const next = new Date(now.getTime());
  next.setFullYear(now.getFullYear() + 1);
  return Timestamp.fromDate(next);
}

async function ensureUser(email: string): Promise<string> {
  try {
    const user = await auth.getUserByEmail(email);
    return user.uid;
  } catch {
    const pwd  = makeLicenseCode().replace(/-/g, "");
    const user = await auth.createUser({ email, password: pwd, emailVerified: false, disabled: false });
    return user.uid!;
  }
}

async function generatePasswordLink(email: string): Promise<string> {
  return await auth.generatePasswordResetLink(email, {
    url: APP_INDEX_URL,
    handleCodeInApp: false,
  });
}

// -------------------- Orders: schrijf/zoek in ALLE varianten -----------------
function newOrderId(): string {
  return db.collection(ORDER_COLLECTIONS[0]).doc().id;
}

async function writeOrderAll(orderId: string, data: any) {
  await Promise.all(
    ORDER_COLLECTIONS.map((col) =>
      db.collection(col).doc(orderId).set(data, { merge: true })
    )
  );
}

async function findOrderRefById(orderId: string) {
  for (const col of ORDER_COLLECTIONS) {
    const ref = db.collection(col).doc(orderId);
    const snap = await ref.get();
    if (snap.exists) return ref;
  }
  return null;
}

async function findOrderRefByPaymentId(paymentId: string) {
  for (const col of ORDER_COLLECTIONS) {
    const qs = await db.collection(col).where("paymentId", "==", paymentId).limit(1).get();
    if (!qs.empty) return qs.docs[0].ref;
  }
  return null;
}

async function createOrderDoc(params: {
  email: string; source: "koop" | "wachtlijst"; amountEUR: string; paymentId: string; mode: "test" | "live";
}) {
  const orderId = newOrderId();
  const base = {
    email: params.email.trim().toLowerCase(),
    source: params.source,
    amountEUR: params.amountEUR,
    paymentId: params.paymentId,
    mode: params.mode,
    status: "open",
    createdAt: FieldValue.serverTimestamp(),
  };
  await writeOrderAll(orderId, base);
  return orderId;
}

async function setPaymentId(orderId: string, paymentId: string) {
  await writeOrderAll(orderId, { paymentId });
}

// ---------------------- Licenses: schrijf/zoek in ALLE varianten --------------
async function writeLicenseAll(licenseCode: string, data: any) {
  await Promise.all(
    LICENSE_COLLECTIONS.map((col) =>
      db.collection(col).doc(licenseCode).set(data, { merge: true })
    )
  );
}

async function findLicenseByUid(uid: string) {
  for (const col of LICENSE_COLLECTIONS) {
    const qs = await db.collection(col)
      .where("uid", "==", uid)
      .where("entitlement", "==", ENTITLEMENT_ID)
      .limit(1).get();
    if (!qs.empty) return qs.docs[0].data();
  }
  return null;
}

// ----------------------------- E-mail ----------------------------------------
async function queueEmail(
  toEmail: string,
  subject: string,
  html: string,
  attachments?: Array<{ filename: string; content: string; type?: string }>
) {
  const doc = {
    to: [toEmail],
    message: { subject, html, text: "Klik op de knop in deze mail om verder te gaan." },
    attachments: attachments ?? [],
  };
  await Promise.all(
    MAIL_COLLECTIONS.map((col) =>
      db.collection(col).add(doc).catch(() => null)
    )
  );
}

function emailHtml(opts: { name: string; passwordLink: string }) {
  const { name, passwordLink } = opts;
  const btn = (href: string, label: string) =>
    `<a href="${href}" style="display:inline-block;padding:10px 14px;border-radius:8px;background:#111827;color:#fff;text-decoration:none;font-weight:700">${label}</a>`;
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#0f172a">
    <p>Beste ${name},</p>
    <p>Hartelijk dank voor uw aankoop van <strong>Zisa PRO</strong>.</p>
    <p>1) Stel eerst uw wachtwoord in:</p>
    <p>${btn(passwordLink, "Wachtwoord instellen")}</p>
    <p style="margin-top:14px">2) Open daarna de PRO-omgeving:</p>
    <p>${btn(APP_INDEX_URL, "Open Zisa PRO")}</p>
    <p>U kunt later steeds uw wachtwoord wijzigen via “Wachtwoord vergeten?” op de inlogpagina.</p>
    <p>De factuur zit in de bijlage.</p>
    <p>Met vriendelijke groeten,<br/>Zebrapost van juf Zisa</p>
  </div>`;
}

// ------------------------- Factuur PDF (base64) ------------------------------
async function makeInvoicePdfBase64(params: {
  invoiceNumber: string;
  dateISO: string;
  toEmail: string;
  product: string;
  amountEUR: string;
  paymentId: string;
}): Promise<string> {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const chunks: any[] = [];
  return await new Promise<string>((resolve, reject) => {
    doc.on("data", (c: any) => chunks.push(Buffer.from(c)));
    doc.on("end", () => resolve(Buffer.concat(chunks).toString("base64")));
    doc.on("error", reject);

    doc.fontSize(20).text("FACTUUR", { align: "right" });
    doc.moveDown();
    doc.fontSize(12).text(SELLER_NAME);
    doc.text(`Contact: ${SELLER_EMAIL}`);
    doc.text(`Adres: ${SELLER_ADDR1}, ${SELLER_ADDR2}`);
    doc.text(SELLER_ENTERPRISE);
    doc.moveDown();

    doc.text(`Factuurnummer: ${params.invoiceNumber}`);
    doc.text(`Datum: ${params.dateISO}`);
    doc.text(`Klant: ${params.toEmail}`);
    doc.text(`Mollie betaling: ${params.paymentId}`);
    doc.moveDown();

    doc.font("Helvetica-Bold").text("Omschrijving");
    doc.font("Helvetica").text(params.product);
    doc.moveDown();

    doc.text(`Totaal: ${asEUR(params.amountEUR)}`, { align: "right" });

    doc.moveDown(2);
    doc.fontSize(10).text(SELLER_VAT_EXEMPT, { align: "left" });

    doc.moveDown();
    doc.fontSize(10).text("Dank u voor uw aankoop!", { align: "center" });

    doc.end();
  });
}

// ------------------------------------------------------------------
// Mollie API
// ------------------------------------------------------------------
const fetchFn: any = (globalThis as any).fetch;

async function mollieCreatePayment(params: { amountEUR: string; description: string; metadata: any }) {
  const key = process.env.MOLLIE_API_KEY;
  if (!key) throw new Error("MOLLIE_API_KEY ontbreekt");
  const body = {
    amount:      { currency: "EUR", value: params.amountEUR },
    description: params.description,
    redirectUrl: THANKYOU_URL,
    webhookUrl:  `https://${REGION}-zisa-spelletjesmaker-pro.cloudfunctions.net/mollieWebhook`,
    method:      ["bancontact", "ideal", "creditcard", "applepay"],
    metadata:    params.metadata,
  };
  const r = await fetchFn(`${MOLLIE_API_URL}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
  if (!r || !r.ok) {
    const t = r ? await r.text() : "no response";
    logger.error("Mollie create payment failed", { status: r?.status, body: t });
    throw new HttpsError("internal", "Mollie create payment failed");
  }
  return await r.json();
}

async function mollieGetPayment(id: string) {
  const key = process.env.MOLLIE_API_KEY;
  if (!key) throw new Error("MOLLIE_API_KEY ontbreekt");
  const r = await fetchFn(`${MOLLIE_API_URL}/payments/${id}`, {
    headers: { Authorization: `Bearer ${key}` }
  });
  if (!r || !r.ok) {
    const t = r ? await r.text() : "no response";
    logger.error("Mollie get payment failed", { status: r?.status, body: t });
    throw new HttpsError("internal", "Mollie get payment failed");
  }
  return await r.json();
}

// ------------------------------------------------------------------
// Order afronden bij betaalde Mollie payment
// ------------------------------------------------------------------
async function completeOrderByPayment(payment: any) {
  const meta     = payment.metadata || {};
  const metaId   = (meta.orderId as string | undefined) || undefined;

  let orderRef: FirebaseFirestore.DocumentReference | null = null;

  if (metaId) orderRef = await findOrderRefById(metaId);
  if (!orderRef) orderRef = await findOrderRefByPaymentId(payment.id);
  if (!orderRef) {
    logger.error("Geen order gevonden bij payment", { paymentId: payment.id, metaOrderId: metaId });
    return;
  }

  const orderId = orderRef.id;
  const snap    = await orderRef.get();
  const order   = snap.data()!;

  if (order.status === "betaald" && order.mailSentAt) {
    logger.info("Order reeds afgerond", { orderId });
    return;
  }

  const expected = order.source === "wachtlijst" ? PRICE_EUR_WAITLIST : PRICE_EUR_KOOP;
  if (payment.amount?.value !== expected) {
    logger.error("Amount mismatch", { orderId, paymentId: payment.id, got: payment.amount?.value, expected });
    await writeOrderAll(orderId, { status: "open" });
    return;
  }

  const email = order.email as string;
  const uid   = await ensureUser(email);

  const licenseCode = makeLicenseCode();
  const expiresAt   = calcExpiry();

  const licenseDoc = {
    code: licenseCode,
    email,
    uid,
    entitlement: ENTITLEMENT_ID,        // voor getAccessStatus
    productId: "zisa-pro-jaarlijks",    // compatibel met oudere naamgeving
    deviceLimit: DEVICE_LIMIT,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt,
    orderId,
    status: "active",
  };

  await writeLicenseAll(licenseCode, licenseDoc);
  await writeOrderAll(orderId, { status: "betaald", licenseCode, paidAt: FieldValue.serverTimestamp() });

  const passwordLink  = await generatePasswordLink(email);
  const invoiceBase64 = await makeInvoicePdfBase64({
    invoiceNumber: `ZISA-${orderId.slice(0, 8)}`,
    dateISO: new Date().toISOString().slice(0, 10),
    toEmail: email,
    product: `Zisa PRO – 1 jaar licentie (${order.source})`,
    amountEUR: expected,
    paymentId: payment.id,
  });

  const html = emailHtml({ name: email, passwordLink });

  await queueEmail(email, "Uw Zisa PRO – toegang & factuur", html, [
    { filename: `factuur-${orderId}.pdf`, content: invoiceBase64, type: "application/pdf" },
  ]);

  await writeOrderAll(orderId, { mailSentAt: FieldValue.serverTimestamp() });
  logger.info("Order afgerond + mail in queue", { orderId, email });
}

// ------------------------------------------------------------------
// HTTP handlers
// ------------------------------------------------------------------
const handleCreatePaymentKoop = async (req: any, res: any) => {
  setCors(res, req.headers.origin as string | undefined);
  if (req.method === "OPTIONS") return res.status(204).send("");
  if (req.method !== "POST") { res.set("Allow", "POST, OPTIONS"); return res.status(405).send("Method Not Allowed"); }

  const email = (req.body?.email || "").toString().trim().toLowerCase();
  if (!email) return res.status(400).json({ error: "email verplicht" });

  const orderId = await createOrderDoc({
    email,
    source: "koop",
    amountEUR: PRICE_EUR_KOOP,
    paymentId: "pending",
    mode: process.env.MOLLIE_API_KEY?.startsWith("test_") ? "test" : "live",
  });

  const payment = await mollieCreatePayment({
    amountEUR: PRICE_EUR_KOOP,
    description: "Zisa PRO – jaarlicentie",
    metadata: { source: "koop", orderId },
  });

  await setPaymentId(orderId, payment.id);
  const checkoutUrl = payment._links?.checkout?.href;
  return res.status(200).json({ checkoutUrl, orderId, paymentId: payment.id });
};

const handleCreatePaymentWaitlist = async (req: any, res: any) => {
  setCors(res, req.headers.origin as string | undefined);
  if (req.method === "OPTIONS") return res.status(204).send("");
  if (req.method !== "POST") { res.set("Allow", "POST, OPTIONS"); return res.status(405).send("Method Not Allowed"); }

  const email = (req.body?.email || "").toString().trim().toLowerCase();
  if (!email) return res.status(400).json({ error: "email verplicht" });

  const w = await db.collection("waitlist").doc(email).get();
  if (!w.exists) return res.status(403).json({ error: "Geen wachtlijsttoegang gevonden" });
  const d: any = w.data()!;
  const eligibleUntil: Timestamp | undefined = d.eligibleUntil;
  if (eligibleUntil && eligibleUntil.toDate() < new Date()) {
    return res.status(403).json({ error: "Wachtlijst-link verlopen" });
  }

  const orderId = await createOrderDoc({
    email,
    source: "wachtlijst",
    amountEUR: PRICE_EUR_WAITLIST,
    paymentId: "pending",
    mode: process.env.MOLLIE_API_KEY?.startsWith("test_") ? "test" : "live",
  });

  const payment = await mollieCreatePayment({
    amountEUR: PRICE_EUR_WAITLIST,
    description: "Zisa PRO – jaarlicentie (wachtlijst)",
    metadata: { source: "wachtlijst", orderId },
  });

  await setPaymentId(orderId, payment.id);
  const checkoutUrl = payment._links?.checkout?.href;
  return res.status(200).json({ checkoutUrl, orderId, paymentId: payment.id });
};

// ------------------------------------------------------------------
// Exports
// ------------------------------------------------------------------
export const createPaymentKoop     = onRequest({ region: REGION }, handleCreatePaymentKoop);
export const createPayment         = onRequest({ region: REGION }, handleCreatePaymentKoop); // alias
export const createPaymentWaitlist = onRequest({ region: REGION }, handleCreatePaymentWaitlist);

export const mollieWebhook = onRequest({ region: REGION }, async (req: any, res: any) => {
  if (req.method !== "POST") { res.set("Allow", "POST"); return res.status(405).send("Method Not Allowed"); }
  const id = (req.body?.id || req.query?.id || "").toString().trim();
  if (!id) return res.status(400).send("Missing id");

  try {
    const payment = await mollieGetPayment(id);
    if (payment.status === "paid") await completeOrderByPayment(payment);
    else logger.info("Webhook received non-paid status", { id, status: payment.status });
    return res.status(200).send("OK");
  } catch (e: any) {
    logger.error("Webhook error", { id, error: e?.message || String(e) });
    return res.status(200).send("OK");
  }
});

// ------------------------------ Dev helper -----------------------------------
export const devSimulatePaid = onRequest({ region: REGION }, async (req: any, res: any) => {
  const paymentId = (req.query.paymentId || req.body?.paymentId || "").toString();
  const source    = (req.query.source    || req.body?.source    || "koop").toString();
  const email     = (req.query.email     || req.body?.email     || "").toString().trim().toLowerCase();
  if (!paymentId || !email) return res.status(400).json({ error: "paymentId en email verplicht" });

  const expected = source === "wachtlijst" ? PRICE_EUR_WAITLIST : PRICE_EUR_KOOP;
  const orderId  = await createOrderDoc({ email, source, amountEUR: expected, paymentId, mode: "test" } as any);

  const fakePayment = { id: paymentId, status: "paid", amount: { currency: "EUR", value: expected }, metadata: { orderId, source } };
  await completeOrderByPayment(fakePayment);
  res.status(200).json({ ok: true });
});

// ------------------------------ Callables ------------------------------------
export const registerDevice = onCall({ region: REGION, enforceAppCheck: true }, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Login vereist");
  const uid      = req.auth.uid;
  const email    = (req.auth.token.email as string) || "";
  const deviceId = (req.data?.deviceId || "").toString();
  const label    = (req.data?.label || "").toString();

  if (!deviceId) throw new HttpsError("invalid-argument", "deviceId ontbreekt");

  const userDevicesRef = db.collection("users").doc(uid).collection("devices");

  const existing = await userDevicesRef.where("deviceId", "==", deviceId).limit(1).get();
  if (!existing.empty) return { ok: true };

  const all   = await userDevicesRef.get();
  const count = all.size;
  if (count >= DEVICE_LIMIT) throw new HttpsError("resource-exhausted", `Limiet van ${DEVICE_LIMIT} toestellen bereikt`);

  await userDevicesRef.add({ deviceId, label: label || null, createdAt: FieldValue.serverTimestamp(), email });
  return { ok: true };
});

export const listDevices = onCall({ region: REGION, enforceAppCheck: true }, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Login vereist");
  const uid = req.auth.uid;
  const qs  = await db.collection("users").doc(uid).collection("devices").orderBy("createdAt", "asc").get();
  const items = qs.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  return { devices: items, limit: DEVICE_LIMIT };
});

export const unregisterDevice = onCall({ region: REGION, enforceAppCheck: true }, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Login vereist");
  const uid        = req.auth.uid;
  const deviceDocId = (req.data?.deviceDocId || "").toString();
  if (!deviceDocId) throw new HttpsError("invalid-argument", "deviceDocId ontbreekt");
  await db.collection("users").doc(uid).collection("devices").doc(deviceDocId).delete();
  return { ok: true };
});

export const getAccessStatus = onCall({ region: REGION, enforceAppCheck: true }, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Login vereist.");
  const uid = req.auth.uid;

  const lic: any = await findLicenseByUid(uid);
  if (!lic) return { allowed: false, reason: "no_license" };

  const now = Timestamp.now();
  const exp: Timestamp | undefined = lic.expiresAt;
  if (!exp || exp.toMillis() <= now.toMillis()) {
    return { allowed: false, reason: "expired", expiresAt: exp ? exp.toDate().toISOString() : null };
  }

  return { allowed: true, expiresAt: exp.toDate().toISOString(), deviceLimit: lic.deviceLimit ?? DEVICE_LIMIT };
});

