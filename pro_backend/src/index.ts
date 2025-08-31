/* Zisa PRO backend — Functions v2 — europe-west1
   - Koop (€40) en Wachtlijst (€35)
   - Webhook (idempotent) → licentie +1 jaar, mail met reset-link + app-link + PDF-factuur
   - Device-callables (limiet 2)
   - Access-check callable (guard.js)
   - CORS + alias: /createPaymentKoop én /createPayment (voor oudere front-ends)
*/

import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// PDFKit via require (stabiel met CommonJS-build)
const PDFDocument = require("pdfkit");

// Init
initializeApp();
const db = getFirestore();
const auth = getAuth();

// ================== CONSTANTEN ==================
const REGION = "europe-west1";

// Frontend origins (CORS)
const ALLOWED_ORIGINS = [
  "https://isabelrockele.github.io", // productie (GitHub Pages)
  // onderstaande 2 enkel gebruiken als u lokaal wil testen:
  "http://127.0.0.1:5500",
  "http://localhost:5500",
];

const FRONTEND_REPO = "https://isabelrockele.github.io/juf_zisa_spelletjesmaker/pro/index.html";
// ► App-link in mail (zoals gevraagd):
const APP_URL = `${FRONTEND_REPO}/pro/`;

const MAIL_COLLECTION = "post";

// ► Verkoopgegevens (factuurkop)
const SELLER_NAME = "Juf Zisa";
const SELLER_EMAIL = "zebrapost@jufzisa.be";
const SELLER_ADDR1 = "Maasfortbaan 108";
const SELLER_ADDR2 = "2500 Lier";
const SELLER_ENTERPRISE = "Ondernemingsnummer 1026.769.348";
const SELLER_VAT_EXEMPT = "Onderneming onderworpen aan de vrijstellingsregel voor kleine ondernemingen.";

const PRICE_EUR_KOOP = "40.00";
const PRICE_EUR_WAITLIST = "35.00";

const DEVICE_LIMIT = 2;
const ENTITLEMENT_ID = "zisa-pro-1y";

const MOLLIE_API_URL = "https://api.mollie.com/v2";

// ================== HULPFUNCTIES ==================
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

async function queueEmail(
  toEmail: string,
  subject: string,
  html: string,
  attachments?: Array<{ filename: string; content?: string; encoding?: "base64" }>
) {
  await db.collection(MAIL_COLLECTION).add({
    to: [toEmail],
    message: { subject, html },
    attachments: attachments ?? [],
  });
}

function emailHtml(opts: {
  name: string;
  appUrl: string;
  passwordLink: string;
  koopOfWaitlist: "koop" | "wachtlijst";
}) {
  const { name, appUrl, passwordLink, koopOfWaitlist } = opts;
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6">
    <p>Beste ${name},</p>
    <p>Hartelijk dank voor uw ${
      koopOfWaitlist === "koop" ? "aankoop" : "aankoop via de wachtlijst"
    } van <strong>Zisa PRO</strong>.</p>
    <p>1) Stel uw wachtwoord in via deze link:<br>
      <a href="${passwordLink}">${passwordLink}</a>
    </p>
    <p>2) Ga vervolgens naar de PRO-omgeving:<br>
      <a href="${appUrl}">${appUrl}</a>
    </p>
    <p>U kunt later steeds uw wachtwoord wijzigen of opnieuw instellen via “Wachtwoord vergeten?” op de inlogpagina.</p>
    <p>De factuur vindt u in de bijlage.</p>
    <p>Met vriendelijke groeten,<br/>Zebrapost van juf Zisa</p>
  </div>`;
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
    const pwd = makeLicenseCode().replace(/-/g, "");
    const user = await auth.createUser({ email, password: pwd, emailVerified: false, disabled: false });
    return user.uid!;
  }
}

async function generatePasswordLink(email: string): Promise<string> {
  return await auth.generatePasswordResetLink(email, {
    url: APP_URL,
    handleCodeInApp: false,
  });
}

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

    // Kop + verkoopgegevens
    doc.fontSize(20).text("FACTUUR", { align: "right" });
    doc.moveDown();
    doc.fontSize(12).text(SELLER_NAME);
    doc.text(`Contact: ${SELLER_EMAIL}`);
    doc.text(`Adres: ${SELLER_ADDR1}, ${SELLER_ADDR2}`);
    doc.text(SELLER_ENTERPRISE);
    doc.moveDown();

    // Meta
    doc.text(`Factuurnummer: ${params.invoiceNumber}`);
    doc.text(`Datum: ${params.dateISO}`);
    doc.text(`Klant: ${params.toEmail}`);
    doc.text(`Mollie betaling: ${params.paymentId}`);
    doc.moveDown();

    // Lijnitems
    doc.font("Helvetica-Bold").text("Omschrijving");
    doc.font("Helvetica").text(params.product);
    doc.moveDown();

    // Totaal
    doc.text(`Totaal: ${asEUR(params.amountEUR)}`, { align: "right" });

    // Vrijstellingsvermelding
    doc.moveDown(2);
    doc.fontSize(10).text(SELLER_VAT_EXEMPT, { align: "left" });

    doc.moveDown();
    doc.fontSize(10).text("Dank u voor uw aankoop!", { align: "center" });

    doc.end();
  });
}

// ================== ORDERS & LICENTIES ==================
async function createOrderDoc(params: {
  email: string;
  source: "koop" | "wachtlijst";
  amountEUR: string;
  paymentId: string;
  mode: "test" | "live";
}) {
  const ref = await db.collection("orders").add({
    email: params.email.trim().toLowerCase(),
    source: params.source,
    amountEUR: params.amountEUR,
    paymentId: params.paymentId,
    mode: params.mode,
    status: "open",
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

async function setPaymentId(orderId: string, paymentId: string) {
  await db.collection("orders").doc(orderId).set({ paymentId }, { merge: true });
}

async function completeOrderByPayment(payment: any) {
  const meta = payment.metadata || {};
  const orderId = (meta.orderId as string | undefined) || undefined;

  let orderRef: any = null;
  if (orderId) {
    orderRef = db.collection("orders").doc(orderId);
  } else {
    const qs = await db.collection("orders").where("paymentId", "==", payment.id).limit(1).get();
    orderRef = qs.empty ? null : qs.docs[0].ref;
  }
  if (!orderRef) {
    logger.error("Geen order gevonden bij payment", { paymentId: payment.id });
    return;
  }

  const snap = await orderRef.get();
  const order = snap.data()!;
  if (order.status === "betaald" && order.mailSentAt) {
    logger.info("Order reeds afgerond", { orderId: orderRef.id });
    return;
  }

  const expected = order.source === "wachtlijst" ? PRICE_EUR_WAITLIST : PRICE_EUR_KOOP;
  if (payment.amount?.value !== expected) {
    logger.error("Amount mismatch", { orderId: orderRef.id, paymentId: payment.id, got: payment.amount?.value, expected });
    await orderRef.set({ status: "open" }, { merge: true });
    return;
  }

  const email = order.email as string;
  const uid = await ensureUser(email);

  const licenseCode = makeLicenseCode();
  const expiresAt = calcExpiry();
  await db.collection("licenses").doc(licenseCode).set(
    {
      code: licenseCode,
      email,
      uid,
      entitlement: ENTITLEMENT_ID,
      deviceLimit: DEVICE_LIMIT,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt,
      orderId: orderRef.id,
      status: "active",
    },
    { merge: true }
  );

  await orderRef.set({ status: "betaald", licenseCode, paidAt: FieldValue.serverTimestamp() }, { merge: true });

  const passwordLink = await generatePasswordLink(email);
  const invoiceBase64 = await makeInvoicePdfBase64({
    invoiceNumber: `ZISA-${orderRef.id.slice(0, 8)}`,
    dateISO: new Date().toISOString().slice(0, 10),
    toEmail: email,
    product: `Zisa PRO – 1 jaar licentie (${order.source})`,
    amountEUR: expected,
    paymentId: payment.id,
  });

  const html = emailHtml({ name: email, appUrl: APP_URL, passwordLink, koopOfWaitlist: order.source });

  await queueEmail(email, "Uw Zisa PRO – toegang & factuur", html, [
    { filename: `factuur-${orderRef.id}.pdf`, content: invoiceBase64, encoding: "base64" },
  ]);

  await orderRef.set({ mailSentAt: FieldValue.serverTimestamp() }, { merge: true });
  logger.info("Order afgerond + mail in queue", { orderId: orderRef.id, email });
}

// ================== MOLLIE API ==================
const fetchFn: any = (globalThis as any).fetch;

async function mollieCreatePayment(params: { amountEUR: string; description: string; metadata: any }) {
  const key = process.env.MOLLIE_API_KEY;
  if (!key) throw new Error("MOLLIE_API_KEY ontbreekt");
  const body = {
    amount: { currency: "EUR", value: params.amountEUR },
    description: params.description,
    redirectUrl: APP_URL,
    webhookUrl: `https://${REGION}-zisa-spelletjesmaker-pro.cloudfunctions.net/mollieWebhook`,
    method: ["bancontact", "ideal", "creditcard", "applepay"],
    metadata: params.metadata,
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
  const r = await fetchFn(`${MOLLIE_API_URL}/payments/${id}`, { headers: { Authorization: `Bearer ${key}` } });
  if (!r || !r.ok) {
    const t = r ? await r.text() : "no response";
    logger.error("Mollie get payment failed", { status: r?.status, body: t });
    throw new HttpsError("internal", "Mollie get payment failed");
  }
  return await r.json();
}

// ================== HANDLERS (los) ==================
const handleCreatePaymentKoop = async (req: any, res: any) => {
  setCors(res, req.headers.origin as string | undefined);
  if (req.method === "OPTIONS") return res.status(204).send(""); // preflight OK
  if (req.method !== "POST") { res.set("Allow","POST, OPTIONS"); return res.status(405).send("Method Not Allowed"); }

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
  if (req.method === "OPTIONS") return res.status(204).send(""); // preflight OK
  if (req.method !== "POST") { res.set("Allow","POST, OPTIONS"); return res.status(405).send("Method Not Allowed"); }

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

// ================== HTTP EXPORTS (incl. alias) ==================
export const createPaymentKoop     = onRequest({ region: REGION }, handleCreatePaymentKoop);
export const createPayment         = onRequest({ region: REGION }, handleCreatePaymentKoop); // ← alias voor oude front-ends
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

// ================== Dev/test helper (privé gebruiken) ==================
export const devSimulatePaid = onRequest({ region: REGION }, async (req: any, res: any) => {
  const paymentId = (req.query.paymentId || req.body?.paymentId || "").toString();
  const source = (req.query.source || req.body?.source || "koop").toString();
  const email = (req.query.email || req.body?.email || "").toString().trim().toLowerCase();
  if (!paymentId || !email) return res.status(400).json({ error: "paymentId en email verplicht" });

  const expected = source === "wachtlijst" ? PRICE_EUR_WAITLIST : PRICE_EUR_KOOP;
  await createOrderDoc({ email, source, amountEUR: expected, paymentId, mode: "test" } as any);

  const fakePayment = { id: paymentId, status: "paid", amount: { currency: "EUR", value: expected }, metadata: { orderId: null, source } };
  await completeOrderByPayment(fakePayment);
  res.status(200).json({ ok: true });
});

// ================== CALLABLES: DEVICES ==================
export const registerDevice = onCall({ region: REGION, enforceAppCheck: true }, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Login vereist");
  const uid = req.auth.uid;
  const email = (req.auth.token.email as string) || "";
  const deviceId = (req.data?.deviceId || "").toString();
  const label = (req.data?.label || "").toString();

  if (!deviceId) throw new HttpsError("invalid-argument", "deviceId ontbreekt");

  const userDevicesRef = db.collection("users").doc(uid).collection("devices");

  // idempotent
  const existing = await userDevicesRef.where("deviceId", "==", deviceId).limit(1).get();
  if (!existing.empty) return { ok: true };

  const all = await userDevicesRef.get();
  const count = all.size;
  if (count >= DEVICE_LIMIT) throw new HttpsError("resource-exhausted", `Limiet van ${DEVICE_LIMIT} toestellen bereikt`);

  await userDevicesRef.add({ deviceId, label: label || null, createdAt: FieldValue.serverTimestamp(), email });
  return { ok: true };
});

export const listDevices = onCall({ region: REGION, enforceAppCheck: true }, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Login vereist");
  const uid = req.auth.uid;
  const qs = await db.collection("users").doc(uid).collection("devices").orderBy("createdAt", "asc").get();
  const items = qs.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  return { devices: items, limit: DEVICE_LIMIT };
});

export const unregisterDevice = onCall({ region: REGION, enforceAppCheck: true }, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Login vereist");
  const uid = req.auth.uid;
  const deviceDocId = (req.data?.deviceDocId || "").toString();
  if (!deviceDocId) throw new HttpsError("invalid-argument", "deviceDocId ontbreekt");
  await db.collection("users").doc(uid).collection("devices").doc(deviceDocId).delete();
  return { ok: true };
});

// ================== CALLABLE: ACCESS CHECK ==================
export const getAccessStatus = onCall({ region: REGION, enforceAppCheck: true }, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Login vereist.");
  const uid = req.auth.uid;
  const now = Timestamp.now();

  const qs = await db.collection("licenses").where("uid", "==", uid).where("entitlement", "==", ENTITLEMENT_ID).limit(1).get();
  if (qs.empty) return { allowed: false, reason: "no_license" };

  const lic: any = qs.docs[0].data();
  const exp: Timestamp | undefined = lic.expiresAt;
  if (!exp || exp.toMillis() <= now.toMillis()) {
    return { allowed: false, reason: "expired", expiresAt: exp ? exp.toDate().toISOString() : null };
  }
  return { allowed: true, expiresAt: exp.toDate().toISOString(), deviceLimit: lic.deviceLimit ?? DEVICE_LIMIT };
});
