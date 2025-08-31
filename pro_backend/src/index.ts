/* pro_backend/src/index.ts
   Zisa PRO — Firebase Functions v2 (region: europe-west1)

   Functies:
   - createPaymentKoop / createPayment (alias)       → Mollie €40
   - createPaymentWaitlist                           → Mollie €35 (checkt waitlist)
   - mollieWebhook                                   → verwerkt betaalstatus
   - devSimulatePaid                                 → test-helper; zet licentie + mail met PDF
   - registerDevice / listDevices / unregisterDevice → apparaatlimiet (2)
   - getAccessStatus                                 → controle op licentie + vervaldatum

   E-mail: schrijft naar collecties ["mail","post"] (Trigger Email-extensie)
   Bijlage: attachments[].{ filename, content(base64), encoding:"base64", contentType:"application/pdf" }
*/

import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import type { Request, Response } from "express";
import PDFDocument from "pdfkit";

// ------------------------------ Init -----------------------------------------
const REGION = "europe-west1";
initializeApp();

const db   = getFirestore();
const auth = getAuth();

// ------------------------------ Config ---------------------------------------
const FRONTEND_REPO   = "https://isabelrockele.github.io/juf_zisa_spelletjesmaker";
const APP_INDEX_URL   = `${FRONTEND_REPO}/pro/index.html`;
const THANKYOU_URL    = `${FRONTEND_REPO}/pro/bedankt.html`;

const MAIL_COLLECTIONS     = ["mail", "post"];
const ORDER_COLLECTIONS    = ["orders", "Orders", "Bestellingen"];
const LICENSE_COLLECTIONS  = ["licenses", "Licenties"];

const ALLOWED_ORIGINS = [
  "https://isabelrockele.github.io",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:5173",
  "http://localhost:3000",
];

const SELLER_NAME       = "Juf Zisa";
const SELLER_EMAIL      = "zebrapost@jufzisa.be";
const SELLER_ADDR1      = "Maasfortbaan 108";
const SELLER_ADDR2      = "2500 Lier";
const SELLER_ENTERPRISE = "Ondernemingsnummer 1026.769.348";
const SELLER_VAT_EXEMPT = "Onderneming onderworpen aan de vrijstellingsregel voor kleine ondernemingen.";

const PRICE_EUR_KOOP     = "40.00";
const PRICE_EUR_WAITLIST = "35.00";
const DEVICE_LIMIT       = 2;
const ENTITLEMENT_ID     = "zisa-pro-1y";

const MOLLIE_API_URL = "https://api.mollie.com/v2";
const MOLLIE_API_KEY = process.env.MOLLIE_API_KEY || "";

// ------------------------------ Types ----------------------------------------
type MollieLinks = { checkout?: { href?: string } };
type MolliePayment = { id: string; status?: string; metadata?: any; _links?: MollieLinks };

// ------------------------------ Helpers --------------------------------------
function setCors(res: Response, origin?: string) {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  res.setHeader("Access-Control-Allow-Origin", allow);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function badRequest(res: Response, msg = "Bad Request") {
  res.status(400).json({ error: msg });
}

function forbidden(res: Response, msg = "Forbidden") {
  res.status(403).json({ error: msg });
}

function toLowerEmail(x: string) {
  return (x || "").trim().toLowerCase();
}

async function ensureUser(email: string): Promise<string> {
  const e = toLowerEmail(email);
  try {
    const u = await auth.getUserByEmail(e);
    return u.uid;
  } catch {
    const u = await auth.createUser({ email: e });
    return u.uid;
  }
}

// Orders/Licenses
function newOrderId(): string {
  return db.collection(ORDER_COLLECTIONS[0]).doc().id;
}

async function writeOrderAll(orderId: string, data: any) {
  await Promise.all(
    ORDER_COLLECTIONS.map((col) => db.collection(col).doc(orderId).set(data, { merge: true }))
  );
}

async function setPaymentId(orderId: string, paymentId: string) {
  await writeOrderAll(orderId, { paymentId });
}

async function findOrderByPaymentId(paymentId: string) {
  for (const col of ORDER_COLLECTIONS) {
    const qs = await db.collection(col).where("paymentId", "==", paymentId).limit(1).get();
    if (!qs.empty) return { ref: qs.docs[0].ref, data: qs.docs[0].data() };
  }
  return null;
}

async function writeLicenseAll(licenseCode: string, data: any) {
  await Promise.all(
    LICENSE_COLLECTIONS.map((col) => db.collection(col).doc(licenseCode).set(data, { merge: true }))
  );
}

async function findLicenseByUid(uid: string) {
  for (const col of LICENSE_COLLECTIONS) {
    const qs = await db.collection(col).where("uid", "==", uid).limit(1).get();
    if (!qs.empty) return qs.docs[0].data();
  }
  return null;
}

function makeLicenseCode(): string {
  const s = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 16; i++) out += s[Math.floor(Math.random() * s.length)];
  return out.replace(/(.{4})/g, "$1-").replace(/-$/, "");
}

function calcExpiry(): Timestamp {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return Timestamp.fromDate(d);
}

// ------------------------------ PDF Factuur ----------------------------------
async function makeInvoicePdfBase64(params: {
  invoiceNumber: string;
  dateISO: string;
  toEmail: string;
  product: string;
  amountEUR: string;
  paymentId: string;
}): Promise<string> {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const chunks: Buffer[] = [];

  return await new Promise<string>((resolve, reject) => {
    doc.on("data", (c) => chunks.push(Buffer.from(c)));
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

    doc.font("Helvetica-Bold").text("Bedrag").moveDown(0.5);
    doc.font("Helvetica").text(`€ ${params.amountEUR}`);
    doc.moveDown();

    doc.text(SELLER_VAT_EXEMPT);
    doc.end();
  });
}

// ------------------------------ Mail helper ----------------------------------
async function queueEmail(
  toEmail: string,
  subject: string,
  html: string,
  attachments?: Array<{ filename: string; content: string; type?: string }>
) {
  const normAtt = (attachments ?? []).map((a) => ({
    filename: a.filename,
    content: a.content,                 // base64
    encoding: "base64",                 // nodig voor Nodemailer/Extensie
    contentType: a.type ?? "application/pdf",
  }));

  const doc = {
    to: [toEmail],
    message: { subject, html, text: "Klik op de knop in deze mail om verder te gaan." },
    attachments: normAtt,
  };

  await Promise.all(MAIL_COLLECTIONS.map((col) => db.collection(col).add(doc).catch(() => null)));
}

function emailHtml(opts: { name: string; passwordLink: string }) {
  const { name, passwordLink } = opts;
  const btn = (href: string, label: string) =>
    `<a href="${href}" style="display:inline-block;padding:10px 16px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">${label}</a>`;
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#0f172a">
    <p>Beste ${name},</p>
    <p>Hartelijk dank voor uw aankoop van <strong>Zisa PRO</strong>.</p>
    <p>1) Stel eerst uw wachtwoord in:</p>
    <p>${btn(passwordLink, "Wachtwoord instellen")}</p>
    <p style="margin-top:14px">2) Open daarna de PRO-omgeving:</p>
    <p>${btn(APP_INDEX_URL, "Open Zisa PRO")}</p>
    <p style="margin-top:14px">Veel plezier! Bij vragen kunt u antwoorden op deze e-mail.</p>
    <p>Vriendelijke groeten,<br>${SELLER_NAME}</p>
  </div>`;
}

async function generatePasswordLink(email: string): Promise<string> {
  return auth.generatePasswordResetLink(email, { url: APP_INDEX_URL, handleCodeInApp: false });
}

// ------------------------------ Mollie API -----------------------------------
async function mollieCreatePayment(params: {
  amountEUR: string;
  description: string;
  metadata: any;
}): Promise<MolliePayment> {
  if (!MOLLIE_API_KEY) throw new Error("MOLLIE_API_KEY ontbreekt");

  const body = {
    amount: { currency: "EUR", value: params.amountEUR },
    description: params.description,
    redirectUrl: THANKYOU_URL,
    webhookUrl: `https://${REGION}-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/mollieWebhook`,
    metadata: params.metadata || {},
  };

  const r = await fetch(`${MOLLIE_API_URL}/payments`, {
    method: "POST",
    headers: { Authorization: `Bearer ${MOLLIE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Mollie create failed: ${r.status}`);
  return (await r.json()) as MolliePayment;
}

async function mollieGetPayment(id: string): Promise<MolliePayment> {
  if (!MOLLIE_API_KEY) throw new Error("MOLLIE_API_KEY ontbreekt");
  const r = await fetch(`${MOLLIE_API_URL}/payments/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${MOLLIE_API_KEY}` },
  });
  if (!r.ok) throw new Error(`Mollie get failed: ${r.status}`);
  return (await r.json()) as MolliePayment;
}

// ----------------------- Afhandeling bij 'paid' -------------------------------
async function completeOrderByPayment(payment: MolliePayment) {
  const paymentId = String(payment.id);
  const orderRes = await findOrderByPaymentId(paymentId);
  if (!orderRes) {
    logger.error("Order niet gevonden bij payment", { paymentId });
    return;
  }
  const orderId = orderRes.ref.id;
  const order   = orderRes.data as any;

  if (order.status === "betaald") {
    logger.info("Order reeds betaald", { orderId });
    return;
  }

  const email = String(order.email);
  const uid   = await ensureUser(email);

  const licenseCode = makeLicenseCode();
  const expiresAt   = calcExpiry();

  const licenseDoc = {
    code: licenseCode,
    email,
    uid,
    entitlement: ENTITLEMENT_ID,
    productId: "zisa-pro-jaarlijks",
    deviceLimit: DEVICE_LIMIT,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt,
    orderId,
    status: "active",
  };

  await writeLicenseAll(licenseCode, licenseDoc);
  await writeOrderAll(orderId, { status: "betaald", licenseCode, paidAt: FieldValue.serverTimestamp() });

  // Mail + factuur
  const passwordLink  = await generatePasswordLink(email);
  const invoiceBase64 = await makeInvoicePdfBase64({
    invoiceNumber: `ZISA-${orderId.slice(0, 8)}`,
    dateISO: new Date().toISOString().slice(0, 10),
    toEmail: email,
    product: order.description || "Zisa PRO – jaarlicentie",
    amountEUR: order.amountEUR || PRICE_EUR_KOOP,
    paymentId,
  });

  await queueEmail(
    email,
    "Uw Zisa PRO – toegang & factuur",
    emailHtml({ name: email, passwordLink }),
    [{ filename: `factuur-${orderId}.pdf`, content: invoiceBase64, type: "application/pdf" }]
  );
}

// ------------------------------ HTTP Handlers --------------------------------
async function handleCreatePaymentKoop(req: Request, res: Response): Promise<void> {
  setCors(res, req.headers.origin as string | undefined);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }
  if (req.method !== "POST") { res.status(405).send("Method Not Allowed"); return; }

  const emailRaw = (req.body as any)?.email ?? "";
  const email    = toLowerEmail(String(emailRaw));
  if (!email) { badRequest(res, "email ontbreekt"); return; }

  const orderId = newOrderId();
  await writeOrderAll(orderId, {
    orderId, email, source: "koop",
    amountEUR: PRICE_EUR_KOOP, description: "Zisa PRO – jaarlicentie",
    status: "open", createdAt: FieldValue.serverTimestamp(),
  });

  const payment: MolliePayment = await mollieCreatePayment({
    amountEUR: PRICE_EUR_KOOP,
    description: "Zisa PRO – jaarlicentie",
    metadata: { source: "koop", orderId },
  });

  await setPaymentId(orderId, payment.id);
  const checkoutUrl = payment._links?.checkout?.href ?? null;
  res.status(200).json({ checkoutUrl, orderId, paymentId: payment.id });
}

async function handleCreatePaymentWaitlist(req: Request, res: Response): Promise<void> {
  setCors(res, req.headers.origin as string | undefined);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }
  if (req.method !== "POST") { res.status(405).send("Method Not Allowed"); return; }

  const emailRaw = (req.body as any)?.email ?? "";
  const email    = toLowerEmail(String(emailRaw));
  if (!email) { badRequest(res, "email ontbreekt"); return; }

  // Waitlist-check
  const w = await db.collection("waitlist").doc(email).get();
  if (!w.exists) { forbidden(res, "Geen wachtlijsttoegang gevonden"); return; }
  const el = w.data()?.eligibleUntil as Timestamp | undefined;
  if (el && el.toMillis() <= Date.now()) { forbidden(res, "Wachtlijst-link verlopen"); return; }

  const orderId = newOrderId();
  await writeOrderAll(orderId, {
    orderId, email, source: "wachtlijst",
    amountEUR: PRICE_EUR_WAITLIST, description: "Zisa PRO – jaarlicentie (wachtlijst)",
    status: "open", createdAt: FieldValue.serverTimestamp(),
  });

  const payment: MolliePayment = await mollieCreatePayment({
    amountEUR: PRICE_EUR_WAITLIST,
    description: "Zisa PRO – jaarlicentie (wachtlijst)",
    metadata: { source: "wachtlijst", orderId },
  });

  await setPaymentId(orderId, payment.id);
  const checkoutUrl = payment._links?.checkout?.href ?? null;
  res.status(200).json({ checkoutUrl, orderId, paymentId: payment.id });
}

// ------------------------------ Exports (HTTP) -------------------------------
export const createPaymentKoop     = onRequest({ region: REGION }, handleCreatePaymentKoop);
export const createPayment         = onRequest({ region: REGION }, handleCreatePaymentKoop); // alias
export const createPaymentWaitlist = onRequest({ region: REGION }, handleCreatePaymentWaitlist);

export const mollieWebhook = onRequest({ region: REGION }, async (req: Request, res: Response): Promise<void> => {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); res.status(405).send("Method Not Allowed"); return; }
  const id = (req.body as any)?.id || (req.query as any)?.id;
  const paymentId = String(id || "").trim();
  if (!paymentId) { res.status(400).send("Missing id"); return; }

  try {
    const payment: MolliePayment = await mollieGetPayment(paymentId);
    if (payment.status === "paid") {
      await completeOrderByPayment(payment);
    } else {
      logger.info("Webhook received non-paid status", { paymentId, status: payment.status });
    }
    res.status(200).send("OK");
  } catch (e: any) {
    logger.error("Webhook error", { paymentId, error: e?.message || String(e) });
    res.status(500).send("ERROR");
  }
});

// ------------------------------ Test-helper ----------------------------------
export const devSimulatePaid = onRequest({ region: REGION }, async (req: Request, res: Response): Promise<void> => {
  const raw = (req.query as any)?.email || (req.body as any)?.email || "";
  const email = toLowerEmail(String(raw));
  if (!email) { badRequest(res, "email ontbreekt"); return; }

  const source    = String((req.query as any)?.source || (req.body as any)?.source || "koop");
  const paymentId = String((req.query as any)?.paymentId || (req.body as any)?.paymentId || ("SIM-" + Date.now()));
  const orderId   = newOrderId();

  await writeOrderAll(orderId, {
    orderId, email, source,
    amountEUR: source === "wachtlijst" ? PRICE_EUR_WAITLIST : PRICE_EUR_KOOP,
    description: source === "wachtlijst" ? "Zisa PRO – jaarlicentie (wachtlijst)" : "Zisa PRO – jaarlicentie",
    status: "open",
    createdAt: FieldValue.serverTimestamp(),
    paymentId,
  });

  const fakePayment: MolliePayment = { id: paymentId, status: "paid" };
  await completeOrderByPayment(fakePayment);

  res.status(200).json({ ok: true, orderId, paymentId });
});

// ------------------------------ Callables (App Check) ------------------------
export const registerDevice = onCall({ region: REGION, enforceAppCheck: true }, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Login vereist");
  const uid      = req.auth.uid;
  const deviceId = String((req.data as any)?.deviceId || "").trim();
  if (!deviceId) throw new HttpsError("invalid-argument", "deviceId ontbreekt");

  const col = db.collection("users").doc(uid).collection("devices");

  // Idempotent: bestaat dit deviceId al?
  const exists = await col.where("deviceId", "==", deviceId).limit(1).get();
  if (!exists.empty) return { ok: true };

  const countSnap = await col.count().get();
  const n = Number(countSnap.data().count || 0);
  if (n >= DEVICE_LIMIT) {
    throw new HttpsError("resource-exhausted", "DEVICE_LIMIT");
  }

  await col.add({
    deviceId,
    createdAt: FieldValue.serverTimestamp(),
    userAgent: (req.rawRequest?.headers?.["user-agent"] as string) || "",
    email: (req.auth.token as any)?.email || null,
  });
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
  const uid         = req.auth.uid;
  const deviceDocId = String((req.data as any)?.deviceDocId || "").trim();
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
