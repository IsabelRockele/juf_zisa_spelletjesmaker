/* pro_backend/src/index.ts
   Zisa PRO — Firebase Functions v2 (region: europe-west1)

   Functies:
   - createPaymentKoop / createPayment (alias)       → Mollie €40
   - createPaymentWaitlist                           → Mollie €35 (checkt waitlist)
   - mollieWebhook                                   → verwerkt betaalstatus
   - devSimulatePaid                                 → test-helper; zet licentie + mail met PDF
   - registerDevice / listDevices / unregisterDevice → apparaatlimiet (2)
   - getAccessStatus                                 → controle op licentie + vervaldatum
   - listDevicesHttp / unregisterDeviceHttp          → HTTP wrappers (CORS + Bearer) voor apparaten.html
*/

import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
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

const MAIL_COLLECTIONS     = ["post"];
const ORDER_COLLECTIONS    = ["orders", "Orders", "Bestellingen"];
const LICENSE_COLLECTIONS  = ["licenses", "Licenties"];

const ALLOWED_ORIGINS = [
  "https://isabelrockele.github.io",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:5173",
  "http://localhost:3000",
];

// ——— Verkoop/Factuurkop
const SELLER_NAME       = "Juf Zisa (Isabel Rockelé)";
const SELLER_EMAIL      = "zebrapost@jufzisa.be";
const SELLER_ADDR1      = "Maasfortbaan 108";
const SELLER_ADDR2      = "2500 Lier";
// Opm: vul je uiteindelijke BTW-nummer hieronder in (of via secret/ENV)
const SELLER_VAT_NUMBER = process.env.SELLER_VAT_NUMBER || ""; // bv. "BE 0123.456.789"
const SELLER_ENTERPRISE = "Ondernemingsnummer (KBO): 1026.769.348   BTW-nummer: BE1026.769.348";
const SELLER_VAT_EXEMPT = "Onderneming onderworpen aan de vrijstellingsregel voor kleine ondernemingen.";

const PRICE_EUR_KOOP     = "40.00";
const PRICE_EUR_WAITLIST = "35.00";
const PRICE_EUR_MONTH    = "6.00";
const DEVICE_LIMIT       = 2;
const ENTITLEMENT_ID     = "zisa-pro-1y";

const MOLLIE_API_URL = "https://api.mollie.com/v2";
const MOLLIE_API_KEY = (process.env.MOLLIE_LIVE_KEY || process.env.MOLLIE_API_KEY || "");

// ------------------------------ Types ----------------------------------------
type MollieLinks = { checkout?: { href?: string } };
// 'mode' toegevoegd zodat we test/live kunnen onderscheiden
type MolliePayment = { id: string; status?: string; metadata?: any; _links?: MollieLinks; mode?: "test" | "live" };

// === Factuurnummering: types ===
type Series = "live" | "test";
function seriesFromMollieMode(mode?: string): Series {
  return mode === "live" ? "live" : "test";
}

// ------------------------------ Helpers --------------------------------------
function setCors(res: Response, origin?: string) {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  res.setHeader("Access-Control-Allow-Origin", allow);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  // Authorization toegevoegd voor Bearer-token
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
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
// Fallback-lookup op e-mail
async function findLicenseByEmail(emailLower: string) {
  const e = (emailLower || "").trim().toLowerCase();
  for (const col of LICENSE_COLLECTIONS) {
    const qs = await db.collection(col).where("email", "==", e).limit(1).get();
    if (!qs.empty) return qs.docs[0].data();
  }
  return null;
}

// ---- Helpers voor licentie-selectie -----------------------------------------
async function fetchLicensesBy(field: "uid" | "email", value: string, limit = 20) {
  const out: any[] = [];
  for (const col of LICENSE_COLLECTIONS) {
    const qs = await db.collection(col).where(field, "==", value).limit(limit).get();
    qs.forEach((d) => out.push(d.data()));
  }
  return out;
}

function pickLatest(list: any[]) {
  let best: any | null = null;
  let bestMs = -Infinity;
  for (const it of list) {
    const t = it?.expiresAt as Timestamp | undefined;
    const ms = t ? t.toMillis() : 0;
    if (ms > bestMs) { best = it; bestMs = ms; }
  }
  return best;
}

function pickLatestValid(list: any[], nowMs: number) {
  let best: any | null = null;
  let bestMs = -Infinity;
  for (const it of list) {
    const t = it?.expiresAt as Timestamp | undefined;
    if (t) {
      const ms = t.toMillis();
      if (ms > nowMs && ms > bestMs) { best = it; bestMs = ms; }
    }
  }
  return best;
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
function calcExpiryMonthly(prev?: Timestamp): Timestamp {
  const base = (prev && prev.toMillis() > Date.now()) ? new Date(prev.toMillis()) : new Date();
  base.setMonth(base.getMonth() + 1);
  return Timestamp.fromDate(base);
}


// === Factuurnummering: helper (TEST/LIVE) ===================================
async function assignInvoiceNumber(
  orderRef: FirebaseFirestore.DocumentReference,
  series: Series
): Promise<string> {
  const countersRef = db.doc(`counters/${series}_invoice_seq`);
  return await db.runTransaction(async (tx) => {
    // 1) Idempotentie
    const orderSnap = await tx.get(orderRef);
    const existing = orderSnap.exists ? (orderSnap.get("invoiceNumber") as string | undefined) : undefined;
    if (existing) return existing;

    // 2) Teller lezen/init
    const now  = new Date();
    const year = now.getFullYear();
    const counterSnap = await tx.get(countersRef);
    const data = counterSnap.exists
      ? (counterSnap.data() as { next: number; year: number })
      : { next: 1, year };
    const next = (data.year === year) ? data.next : 1;

    // 3) Nummer opbouwen
    const invoiceNumber = (series === "live")
      ? `${year}-${String(next).padStart(4, "0")}`
      : `TEST-${String(next).padStart(4, "0")}`;

    // 4) Teller + order updaten
    tx.set(countersRef, { next: next + 1, year }, { merge: true });
    tx.set(orderRef, {
      invoiceNumber,
      invoiceSeries: series,
      invoiceYear: year,
      invoiceAssignedAt: now,
    }, { merge: true });

    return invoiceNumber;
  });
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
    if (SELLER_VAT_NUMBER) doc.text(`BTW-nummer: ${SELLER_VAT_NUMBER}`);
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

// --------------------------- Mail routing ------------------------------------
// Microsoft-domeinen => via Brevo (collection: post_msft). Alles anders => bestaande route.
const MSF_DOMAINS = new Set<string>([
  "hotmail.com", "hotmail.be", "hotmail.nl",
  "outlook.com", "outlook.be", "outlook.nl",
  "live.com", "live.be", "live.nl",
  "msn.com", "windowslive.com",
]);

function pickMailCollections(toEmail: string): string[] {
  const domain = (toEmail || "").toLowerCase().split("@")[1]?.trim() ?? "";
  return MSF_DOMAINS.has(domain) ? ["post_msft"] : MAIL_COLLECTIONS;
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
    content: a.content,
    encoding: "base64",
    contentType: a.type ?? "application/pdf",
  }));

  const doc = {
    to: [toEmail],
    message: {
      subject,
      html,
      text: "Klik op de knop in deze mail om verder te gaan.",
      attachments: normAtt,
    },
  };

  // NIEUW: routeer op domein
  const cols = pickMailCollections(toEmail);

  await Promise.all(
    cols.map((col) => db.collection(col).add(doc).catch(() => null))
  );
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

  // === Factuurnummer: TEST/LIVE bepalen + nummer toekennen (idempotent) ===
  const series: Series = seriesFromMollieMode(payment?.mode);
  const orderRef = orderRes.ref;
  const invoiceNumber = await assignInvoiceNumber(orderRef, series);
  await writeOrderAll(orderId, { invoiceNumber, invoiceSeries: series });

  // Mail + factuur (PDF)
  const passwordLink  = await generatePasswordLink(email);
  const invoiceBase64 = await makeInvoicePdfBase64({
    invoiceNumber,
    dateISO: new Date().toISOString().slice(0, 10),
    toEmail: email,
    product: order.description || "Zisa PRO – jaarlicentie",
    amountEUR: order.amountEUR || PRICE_EUR_KOOP,
    paymentId,
  });

  // === PDF ook bewaren in Storage ==========================================
  const year = new Date().getFullYear();
  const storagePath = series === "live"
    ? `Facturen/live/${year}/${invoiceNumber}.pdf`
    : `Facturen/test/${year}/${invoiceNumber}.pdf`;

  await getStorage().bucket().file(storagePath).save(
    Buffer.from(invoiceBase64, "base64"),
    {
      contentType: "application/pdf",
      resumable: false,
      metadata: { cacheControl: "private, max-age=0" },
    }
  );

  await writeOrderAll(orderId, { invoiceStoragePath: storagePath });

  await queueEmail(
    email,
    "Uw Zisa PRO – toegang & factuur",
    emailHtml({ name: email, passwordLink }),
    [{ filename: `factuur-${invoiceNumber}.pdf`, content: invoiceBase64, type: "application/pdf" }]
  );
}
async function completeMonthlyPayment(
  payment: MolliePayment,
  orderRes: { ref: FirebaseFirestore.DocumentReference, data: any }
) {
  const paymentId = String(payment.id);
  const orderId   = orderRes.ref.id;
  const order     = orderRes.data as any;

  if (order.status === "betaald") { 
    logger.info("Order reeds betaald", { orderId }); 
    return; 
  }

  const email = String(order.email);
  const uid   = await ensureUser(email);

  // Bestaande licentie zoeken en verlengen; anders nieuw aanmaken
  const list   = await fetchLicensesBy("uid", uid, 5);
  const latest = pickLatest(list) || null;

  let licenseCode: string;
  let newExpires: Timestamp;

  if (latest && latest.code) {
    licenseCode = String(latest.code);
    const prev  = latest.expiresAt as Timestamp | undefined;
    newExpires  = calcExpiryMonthly(prev);
    await writeLicenseAll(licenseCode, { expiresAt: newExpires, status: "active", uid, email });
  } else {
    licenseCode = makeLicenseCode();
    newExpires  = calcExpiryMonthly();
    const licenseDoc = {
      code: licenseCode,
      uid, email,
      productId: "zisa-pro-maand",
      deviceLimit: DEVICE_LIMIT,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: newExpires,
      orderId,
      status: "active",
    };
    await writeLicenseAll(licenseCode, licenseDoc);
  }

  // Orderstatus bijwerken
  await writeOrderAll(orderId, { status: "betaald", licenseCode, paidAt: FieldValue.serverTimestamp() });

  // Factuur: nummer toekennen + PDF + mail (zelfde flow als jaar)
  const series: Series = seriesFromMollieMode(payment?.mode);
  const orderRef = orderRes.ref;
  const invoiceNumber = await assignInvoiceNumber(orderRef, series);
  await writeOrderAll(orderId, { invoiceNumber, invoiceSeries: series });

  const passwordLink  = await generatePasswordLink(email);
  const invoiceBase64 = await makeInvoicePdfBase64({
    invoiceNumber,
    dateISO: new Date().toISOString().slice(0, 10),
    toEmail: email,
    product: order.description || "Zisa PRO – maand (prepaid)",
    amountEUR: order.amountEUR || PRICE_EUR_MONTH,
    paymentId,
  });

  // PDF opslaan in Storage
  const year = new Date().getFullYear();
  const storagePath = series === "live"
    ? `Facturen/live/${year}/${invoiceNumber}.pdf`
    : `Facturen/test/${year}/${invoiceNumber}.pdf`;

  await getStorage().bucket().file(storagePath).save(
    Buffer.from(invoiceBase64, "base64"),
    { contentType: "application/pdf", resumable: false, metadata: { cacheControl: "private, max-age=0" } }
  );

  await writeOrderAll(orderId, { invoiceStoragePath: storagePath });

  // Mail met wachtwoordlink + factuur
  await queueEmail(
    email,
    "Uw Zisa PRO – toegang & factuur",
    emailHtml({ name: email, passwordLink }),
    [{ filename: `factuur-${invoiceNumber}.pdf`, content: invoiceBase64, type: "application/pdf" }]
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

async function handleCreateMonthlyPurchase(req: Request, res: Response): Promise<void> {
  setCors(res, req.headers.origin as string | undefined);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }
  if (req.method !== "POST")     { res.status(405).send("Method Not Allowed"); return; }

  const emailRaw = (req.body as any)?.email ?? "";
  const email    = toLowerEmail(String(emailRaw));
  if (!email) { badRequest(res, "email ontbreekt"); return; }

  // Order vastleggen (bron = monthly)
  const orderId = newOrderId();
  await writeOrderAll(orderId, {
    orderId, email, source: "monthly",
    amountEUR: PRICE_EUR_MONTH, description: "Zisa PRO – maand (prepaid)",
    status: "open", createdAt: FieldValue.serverTimestamp(),
  });

  // Mollie betaling aanmaken (géén mandaat; gewoon éénmalig €6)
  const payment: MolliePayment = await mollieCreatePayment({
    amountEUR: PRICE_EUR_MONTH,
    description: "Zisa PRO – maand (prepaid)",
    metadata: { source: "monthly", orderId },
  });

  await setPaymentId(orderId, payment.id);
  const checkoutUrl = payment._links?.checkout?.href ?? null;
  res.status(200).json({ checkoutUrl, orderId, paymentId: payment.id });
}


// ------------------------------ Exports (HTTP) -------------------------------
export const createPaymentKoop     =
  onRequest({ region: REGION, secrets: ["MOLLIE_LIVE_KEY"] }, handleCreatePaymentKoop);

export const createPayment         =
  onRequest({ region: REGION, secrets: ["MOLLIE_LIVE_KEY"] }, handleCreatePaymentKoop); // alias

export const createPaymentWaitlist =
  onRequest({ region: REGION, secrets: ["MOLLIE_LIVE_KEY"] }, handleCreatePaymentWaitlist);

export const createMonthlyFirstPayment =
  onRequest({ region: REGION, secrets: ["MOLLIE_LIVE_KEY"] }, handleCreateMonthlyPurchase);

export const createMonthlyPurchase =
  onRequest({ region: REGION, secrets: ["MOLLIE_LIVE_KEY"] }, handleCreateMonthlyPurchase);

export const mollieWebhook = onRequest(
  { region: REGION, secrets: ["MOLLIE_LIVE_KEY"] },
  async (req: Request, res: Response): Promise<void> => {
    if (req.method !== "POST") { res.setHeader("Allow", "POST"); res.status(405).send("Method Not Allowed"); return; }
    const id = (req.body as any)?.id || (req.query as any)?.id;
    const paymentId = String(id || "").trim();
    if (!paymentId) { res.status(400).send("Missing id"); return; }

    try {
      const payment: MolliePayment = await mollieGetPayment(paymentId);
            // --- Maand (prepaid): eigen afhandeling -------------------------------------
      const orderRes = await findOrderByPaymentId(paymentId);
      if (orderRes) {
        const order = orderRes.data as any;
        if (order.source === "monthly" && payment.status === "paid") {
          await completeMonthlyPayment(payment, orderRes);
          res.status(200).send("OK");
          return; // => voorkom dat de jaar-logica hieronder nog loopt
        }
      }

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
  }
);
export const importWaitlist = onRequest(
  { region: REGION },
  async (req: Request, res: Response): Promise<void> => {
    // CORS & method
    setCors(res, req.headers.origin as string | undefined);
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }
    if (req.method !== "POST")     { res.status(405).send("Method Not Allowed"); return; }

    // eenvoudige bescherming met sleutel (mag hardcoded of via secret/ENV)
    const IMPORT_KEY = process.env.IMPORT_KEY || "zet-hier-een-sterke-eenmalige-sleutel";
    const key = String((req.query as any).key || (req.headers as any)["x-admin-key"] || "");
    if (key !== IMPORT_KEY) { res.status(403).send("forbidden"); return; }

    // input
    const emailsRaw = (req.body as any)?.emails ?? [];
    const emails: string[] = (Array.isArray(emailsRaw) ? emailsRaw : [])
      .map((e: any) => toLowerEmail(String(e)))
      .filter(Boolean);

    const eligibleDays = Number((req.body as any)?.eligibleDays ?? 7);
    const until = Timestamp.fromMillis(Date.now() + eligibleDays * 24 * 60 * 60 * 1000);

    // batch write
    let batch = db.batch(); let n = 0;
    for (const email of emails) {
      const ref = db.collection("waitlist").doc(email);
      batch.set(ref, {
        eligibleUntil: until,
        addedAt: FieldValue.serverTimestamp(),
        source: "csv-import",
      }, { merge: true });
      n++;
      if (n % 400 === 0) { await batch.commit(); batch = db.batch(); }
    }
    if (n % 400 !== 0) await batch.commit();

    res.status(200).json({ ok: true, count: n, eligibleUntil: until.toDate().toISOString() });
  }
);
// ------------------------------ Test-helper ----------------------------------
// ------------------------------ Test-helper ----------------------------------
// ------------------------------ Test-helper ----------------------------------
export const devSimulatePaid = onRequest({ region: REGION }, async (req: Request, res: Response): Promise<void> => {
  try {
    const q = req.query as any;
    const b = (req.body as any) || {};

    const rawEmail = (q.email ?? b.email ?? "").toString().trim();
    const email = toLowerEmail(rawEmail);
    if (!email) { badRequest(res, "email ontbreekt"); return; }

    // Bron bepalen (robuust: accepteert 'monthly', 'maandelijks' of monthly=1/true)
    const sRaw = (q.source ?? b.source ?? q.bron ?? b.bron ?? "").toString().trim().toLowerCase();
    const monthlyFlag = (q.monthly ?? b.monthly ?? "").toString().trim().toLowerCase();
    const isMonthly   = sRaw === "monthly" || sRaw === "maandelijks" || monthlyFlag === "1" || monthlyFlag === "true";
    const isWaitlist  = sRaw === "wachtlijst" || sRaw === "waitlist";

    const source = isMonthly ? "monthly" : (isWaitlist ? "wachtlijst" : "koop");

    const orderId   = newOrderId();
    const paymentId = "SIM-" + Date.now();

    // Bedrag + omschrijving volgens bron
    let amountEUR   = PRICE_EUR_KOOP;
    let description = "Zisa PRO – jaarlicentie";
    if (source === "wachtlijst") {
      amountEUR   = PRICE_EUR_WAITLIST;
      description = "Zisa PRO – jaarlicentie (wachtlijst)";
    }
    if (source === "monthly") {
      amountEUR   = PRICE_EUR_MONTH;          // "6.00"
      description = "Zisa PRO – maand (prepaid)";
    }

    // Order registreren
    await writeOrderAll(orderId, {
      orderId, email, source,
      amountEUR, description,
      status: "open",
      createdAt: FieldValue.serverTimestamp(),
      paymentId,
    });

    // 'Betaald' simuleren in TEST-modus (dus testfactuur + opslag in /Facturen/test/)
    const fakePayment: MolliePayment = { id: paymentId, status: "paid", mode: "test" as const };

    if (source === "monthly") {
      const orderRes = await findOrderByPaymentId(paymentId);
      if (!orderRes) { badRequest(res, "order niet gevonden"); return; }
      await completeMonthlyPayment(fakePayment, orderRes);   // ==> maandflow: +1 maand, factuur, mail
    } else {
      await completeOrderByPayment(fakePayment);             // ==> jaar/wachtlijst: bestaande flow
    }

    res.status(200).json({ ok: true, orderId, paymentId, source, amountEUR });
  } catch (e: any) {
    logger.error("devSimulatePaid error", { error: e?.message || String(e) });
    res.status(500).send("devSimulatePaid error");
  }
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

// AANGEPAST: val terug op e-mail wanneer licentie niet op uid staat
export const getAccessStatus = onCall({ region: REGION, enforceAppCheck: true }, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Login vereist.");
  const uid = req.auth.uid;
  const tokenEmail = (req.auth.token as any)?.email
    ? String((req.auth.token as any).email).toLowerCase()
    : "";

  const nowMs = Timestamp.now().toMillis();

  // 1) Zoek licenties op uid; zo niet, val terug op e-mail
  let list = await fetchLicensesBy("uid", uid);
  let lic  = pickLatestValid(list, nowMs);

  if (!lic && tokenEmail) {
    const byEmail = await fetchLicensesBy("email", tokenEmail);
    const validE  = pickLatestValid(byEmail, nowMs);
    if (validE) lic = validE;
    list = list.concat(byEmail); // voor nette "expired"-melding
  }

  // 2) Geldige licentie → toegang
  if (lic) {
    const exp = lic.expiresAt as Timestamp;
    return {
      allowed: true,
      expiresAt: exp.toDate().toISOString(),
      deviceLimit: lic.deviceLimit ?? DEVICE_LIMIT,
    };
  }

  // 3) Alles verlopen? Meld "expired" met laatste vervaldatum
  const latest = pickLatest(list);
  if (latest) {
    const exp = latest.expiresAt as Timestamp | undefined;
    return {
      allowed: false,
      reason: "expired",
      expiresAt: exp ? exp.toDate().toISOString() : null,
    };
  }

  // 4) Helemaal niets gevonden
  return { allowed: false, reason: "no_license" };
});


// --------------------------- HTTP wrappers (CORS) -----------------------------
export const listDevicesHttp = onRequest({ region: REGION }, async (req: Request, res: Response) => {
  setCors(res, req.headers.origin as string | undefined);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }
  try {
    const authHeader = String(req.headers.authorization || "");
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!idToken) { forbidden(res, "Missing Bearer token"); return; }

    const decoded = await auth.verifyIdToken(idToken, true);
    const uid = decoded.uid;

    const qs = await db.collection("users").doc(uid).collection("devices")
      .orderBy("createdAt", "asc").get();
    const items = qs.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    res.status(200).json({ devices: items, limit: DEVICE_LIMIT });
  } catch (e: any) {
    logger.error("listDevicesHttp error", { error: e?.message || String(e) });
    res.status(500).json({ error: "internal" });
  }
});

export const unregisterDeviceHttp = onRequest({ region: REGION }, async (req: Request, res: Response) => {
  setCors(res, req.headers.origin as string | undefined);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }
  try {
    const authHeader = String(req.headers.authorization || "");
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!idToken) { forbidden(res, "Missing Bearer token"); return; }

    const decoded = await auth.verifyIdToken(idToken, true);
    const uid = decoded.uid;

    const deviceDocId = String((req.body as any)?.deviceDocId || "").trim();
    if (!deviceDocId) { badRequest(res, "deviceDocId ontbreekt"); return; }

    await db.collection("users").doc(uid).collection("devices").doc(deviceDocId).delete();
    res.status(200).json({ ok: true });
  } catch (e: any) {
    logger.error("unregisterDeviceHttp error", { error: e?.message || String(e) });
    res.status(500).json({ error: "internal" });
  }
});
// ===== KidLinks (QR die vervalt met licentie) =================================

// Korte, niet-raadbare code (zonder i, l, 0, 1)
function mkCode(len = 9) {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += abc[Math.floor(Math.random() * abc.length)];
  return s;
}

/**
 * Maakt een kind-link (QR) aan voor de ingelogde leerkracht.
 * target: "kid-start" | "plus100" | "min100" | "plus1000" | "min1000"
 * range:  "100" | "1000"
 */
export const createKidLink = onCall({ region: REGION, cors: true }, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Login vereist.");
  const uid = req.auth.uid;
  const { target = "kid-start", range = "100" } = (req.data || {}) as {
    target?: string; range?: "100" | "1000";
  };

  // ——— Pak jouw nieuwste geldige licentie (je helpers bestaan al)
  const nowMs = Timestamp.now().toMillis();
  const list = await fetchLicensesBy("uid", uid);
  const lic  = pickLatestValid(list, nowMs);
  if (!lic) throw new HttpsError("failed-precondition", "Geen (geldige) licentie gevonden.");

  const expiresAt = lic.expiresAt as Timestamp;
  if (!expiresAt || expiresAt.toMillis() <= nowMs) {
    throw new HttpsError("failed-precondition", "Licentie is verlopen.");
  }

  // ——— Maak code en bewaar
  const code = mkCode(9);
  await db.collection("kidLinks").doc(code).set({
    uid,
    licenseId: lic.licenseId || lic.id || null,   // optioneel; afhankelijk van je model
    target,                                       // bv. 'kid-start'
    range,                                        // '100' | '1000'
    expiresAt,
    createdAt: Timestamp.now(),
    disabled: false,
  });

  const proj   = process.env.GCLOUD_PROJECT!;
  const region = REGION;
  const url    = `https://${region}-${proj}.cloudfunctions.net/proLink/${code}`;

  return { url, code, expiresAt: expiresAt.toDate().toISOString() };
});

/**
 * Publieke redirect: valideert code + geldigheid en stuurt door naar PRO.
 * Bij verlopen link: toont nette melding met link naar je site.
 */
export const proLink = onRequest({ region: REGION }, async (req, res) => {
  try {
    const code = (req.path || req.url).split("/").pop()!.trim();
    if (!code) { res.status(400).send("Code ontbreekt."); return; }

    const ref = db.collection("kidLinks").doc(code);
    const doc = await ref.get();
    if (!doc.exists) { res.status(404).send("Link niet gevonden."); return; }

    const data = doc.data()!;
    if (data.disabled) { res.status(410).send("Link is ingetrokken."); return; }

    const expMs = (data.expiresAt as Timestamp).toMillis();
    if (Date.now() >= expMs) {
      res.status(410).send(`
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <div style="font-family:system-ui;max-width:640px;margin:40px auto;line-height:1.5">
          <h2>Licentie verlopen</h2>
          <p>Deze QR is niet meer geldig omdat de licentie vervallen is.</p>
          <p><a href="${FRONTEND_REPO}" style="font-weight:700">Koop of verleng je licentie</a></p>
        </div>`);
      return;
    }

    // Bepaal je PRO-basis aan de hand van FRONTEND_REPO
    // LIVE:
    const base = `${FRONTEND_REPO}/pro/`;
    // STAGING (tijdelijk testen)? Zet FRONTEND_REPO even naar je staging-repo,
    // of dupliceer deze function met een andere base.

    const t = encodeURIComponent(Date.now().toString(36)); // mini-nonce tegen caching
    let dest = "";
    switch (data.target) {
      case "plus100":  dest = `${base}plus100.html?kid=1&range=100&t=${t}`;   break;
      case "min100":   dest = `${base}min100.html?kid=1&range=100&t=${t}`;    break;
      case "plus1000": dest = `${base}plus1000.html?kid=1&range=1000&t=${t}`; break;
      case "min1000":  dest = `${base}min1000.html?kid=1&range=1000&t=${t}`;  break;
      default:         dest = `${base}hulpschema-kid.html?kid=1&range=${data.range || "100"}&t=${t}`;
    }

    res.setHeader("Cache-Control", "no-store, private, max-age=0");
    res.redirect(302, dest);
  } catch (e: any) {
    logger.error("proLink error", { error: e?.message || String(e) });
    res.status(500).send("Interne fout.");
  }
});

