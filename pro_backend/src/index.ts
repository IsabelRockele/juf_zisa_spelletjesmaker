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

const MAIL_COLLECTIONS     = ["post_msft"];
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

  // Logo als base64 — geen extern bestand nodig in Cloud Function
  const LOGO_B64 = "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";

  const doc = new PDFDocument({ size: "A4", margin: 0, autoFirstPage: true });
  const chunks: Buffer[] = [];

  return await new Promise<string>((resolve, reject) => {
    doc.on("data", (c) => chunks.push(Buffer.from(c)));
    doc.on("end",  () => resolve(Buffer.concat(chunks).toString("base64")));
    doc.on("error", reject);

    const W = 595.28;
    const H = 841.89;
    const M = 35;
    const DARK       = "#2a2a2a";
    const GOLD       = "#ffcf56";
    const LIGHT      = "#f5f3f0";
    const GRAY       = "#555555";
    const BORDER     = "#e0d8cc";
    const GREEN      = "#065f46";
    const GREEN_BG   = "#ecfdf5";
    const GREEN_BD   = "#a7f3d0";
    const AMBER_BG   = "#fffbeb";
    const AMBER_BD   = "#fde68a";
    const AMBER_TX   = "#92400e";
    const FOOTER_COL = "#aaaaaa";
    const VAT_COL    = "#999999";

    // ── HEADER ──────────────────────────────────────────────
    doc.rect(0, 0, W, 90).fill(DARK);

    // Logo
    const logoBuffer = Buffer.from(LOGO_B64, "base64");
    doc.image(logoBuffer, M, 12, { width: 66, height: 66 });

    // Naam + contact
    doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(13)
       .text("Juf Zisa\'s Spelgenerator PRO", M + 80, 24, { lineBreak: false });
    doc.fillColor("#aaaaaa").font("Helvetica").fontSize(8.5)
       .text("zebrapost@jufzisa.be  ·  jufzisa.be", M + 80, 42, { lineBreak: false });

    // FACTUUR rechts
    doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(24)
       .text("FACTUUR", W - M - 150, 30, { width: 150, align: "right", lineBreak: false });

    // Gouden lijn
    doc.moveTo(0, 91).lineTo(W, 91).lineWidth(2).strokeColor(GOLD).stroke();

    // ── VAN (links) ──────────────────────────────────────────
    let y = 122;
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(9)
       .text("Van", M, y, { lineBreak: false });
    doc.fillColor(DARK).font("Helvetica").fontSize(9)
       .text(SELLER_NAME,    M, y + 14, { lineBreak: false })
       .text(`${SELLER_ADDR1}, ${SELLER_ADDR2}`, M, y + 27, { lineBreak: false })
       .text(SELLER_EMAIL,   M, y + 40, { lineBreak: false });
    doc.fillColor(GRAY).fontSize(9)
       .text(SELLER_ENTERPRISE, M, y + 53, { lineBreak: false });

    // ── FACTUURDETAILS (rechts) ───────────────────────────────
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(9)
       .text("Factuurdetails", W - M - 200, y, { width: 200, align: "right", lineBreak: false });
    doc.fillColor(DARK).font("Helvetica").fontSize(9)
       .text(`Nummer: ${params.invoiceNumber}`, W - M - 200, y + 14, { width: 200, align: "right", lineBreak: false })
       .text(`Datum: ${params.dateISO}`,        W - M - 200, y + 27, { width: 200, align: "right", lineBreak: false });
    doc.fillColor(GRAY).fontSize(9)
       .text(`Mollie: ${params.paymentId}`, W - M - 200, y + 40, { width: 200, align: "right", lineBreak: false });

    // ── AAN BLOK ─────────────────────────────────────────────
    const ay = y + 53 + 20;
    const ah = 40;
    doc.roundedRect(M, ay, W - 2 * M, ah, 6).fill(LIGHT);
    doc.roundedRect(M, ay, W - 2 * M, ah, 6).lineWidth(0.5).strokeColor(BORDER).stroke();

    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(9)
       .text("Aan", M + 12, ay + 9, { lineBreak: false });
    doc.fillColor(GRAY).font("Helvetica").fontSize(9)
       .text(params.toEmail, M + 12, ay + 22, { lineBreak: false });

    // Reeds betaald badge
    const bx = W - M - 110;
    const by = ay + 9;
    doc.roundedRect(bx, by - 4, 100, 16, 4).fill(GREEN_BG);
    doc.roundedRect(bx, by - 4, 100, 16, 4).lineWidth(0.5).strokeColor(GREEN_BD).stroke();
    doc.fillColor(GREEN).font("Helvetica-Bold").fontSize(8)
       .text("Reeds betaald", bx, by + 1, { width: 100, align: "center", lineBreak: false });

    // ── TABEL ────────────────────────────────────────────────
    const ty = ay + ah + 18;
    const th = 24;
    const rh = 32;

    // Header
    doc.roundedRect(M, ty, W - 2 * M, th, 4).fill(DARK);
    doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(9)
       .text("Omschrijving", M + 12, ty + 8, { lineBreak: false })
       .text("Bedrag", W - M - 12 - 60, ty + 8, { width: 60, align: "right", lineBreak: false });

    // Rij
    doc.roundedRect(M, ty + th, W - 2 * M, rh, 4).fill(LIGHT);
    doc.roundedRect(M, ty + th, W - 2 * M, rh, 4).lineWidth(0.5).strokeColor(BORDER).stroke();
    doc.fillColor(DARK).font("Helvetica").fontSize(9)
       .text(params.product, M + 12, ty + th + 11, { lineBreak: false });
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(9)
       .text(`\u20ac ${params.amountEUR}`, W - M - 12 - 60, ty + th + 11,
             { width: 60, align: "right", lineBreak: false });

    // ── NIET AUTOMATISCH VERLENGD ────────────────────────────
    const nvy = ty + th + rh + 18;
    const nvh = 26;
    doc.roundedRect(M, nvy, W - 2 * M, nvh, 5).fill(AMBER_BG);
    doc.roundedRect(M, nvy, W - 2 * M, nvh, 5).lineWidth(0.5).strokeColor(AMBER_BD).stroke();
    doc.fillColor(AMBER_TX).font("Helvetica").fontSize(8)
       .text("Dit abonnement wordt niet automatisch verlengd.",
             M + 12, nvy + 9, { lineBreak: false });

    // ── BTW VRIJSTELLING ─────────────────────────────────────
    doc.fillColor(VAT_COL).font("Helvetica-Oblique").fontSize(7.5)
       .text(SELLER_VAT_EXEMPT, M, nvy + nvh + 18, { lineBreak: false });

    // ── FOOTER ───────────────────────────────────────────────
    doc.moveTo(M, H - 50).lineTo(W - M, H - 50).lineWidth(0.8).strokeColor(GOLD).stroke();
    doc.fillColor(FOOTER_COL).font("Helvetica").fontSize(7)
       .text(
         `${SELLER_NAME}  ·  ${SELLER_ADDR1}, ${SELLER_ADDR2}  ·  ${SELLER_EMAIL}  ·  jufzisa.be`,
         M, H - 38, { width: W - 2 * M, align: "center", lineBreak: false }
       );

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

// Beschouw 'paid' en 'authorized' als betaald
function isPaidStatus(status?: string) {
  const s = (status || "").toLowerCase();
  return s === "paid" || s === "authorized";
}

export const mollieWebhook = onRequest(
  { region: REGION, secrets: ["MOLLIE_LIVE_KEY"] },
  async (req: Request, res: Response): Promise<void> => {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      res.status(405).send("Method Not Allowed");
      return;
    }

    const id = (req.body as any)?.id || (req.query as any)?.id;
    const paymentId = String(id || "").trim();
    if (!paymentId) {
      res.status(400).send("Missing id");
      return;
    }

    try {
      const payment: MolliePayment = await mollieGetPayment(paymentId);

      // --- Maand (prepaid): eigen afhandeling --------------------------------
      const orderRes = await findOrderByPaymentId(paymentId);
      if (orderRes) {
        const order = orderRes.data as any;
        if (order.source === "monthly" && isPaidStatus(payment.status)) {
          await completeMonthlyPayment(payment, orderRes);
          res.status(200).send("OK");
          return; // => voorkom dat de jaar-logica hieronder nog loopt
        }
      }

      // --- Jaar / wachtlijst --------------------------------------------------
      logger.info("Webhook ontvangen", { paymentId, status: payment.status });

      if (isPaidStatus(payment.status)) {
        await completeOrderByPayment(payment);
        logger.info("Order afgehandeld als 'betaald'", { paymentId });
      } else {
        logger.info("Webhook met niet-betaalde status, geen actie", {
          paymentId,
          status: payment.status,
        });
      }

      // Bij een succesvol afgehandelde webhook altijd 200 teruggeven
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

// Altijd de meest recente licentie kiezen (eerst op uid, anders op e-mail)
export const getAccessStatus = onCall({ region: REGION, enforceAppCheck: true }, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Login vereist.");

  const uid = req.auth.uid;
  const tokenEmail = (req.auth.token as any)?.email
    ? String((req.auth.token as any).email).toLowerCase()
    : "";

  const nowMs = Date.now();

  // helper: haal per collectie de nieuwste licentie op (orderBy expiresAt desc)
  const newestBy = async (field: "uid" | "email", value: string) => {
    let best: FirebaseFirestore.QueryDocumentSnapshot | null = null;
    for (const col of LICENSE_COLLECTIONS) {
      const qs = await db
        .collection(col)
        .where(field, "==", value)
        .orderBy("expiresAt", "desc")
        .limit(1)
        .get();

      if (!qs.empty) {
        const d = qs.docs[0];
        if (!best) best = d;
        else {
          const a = (best.data() as any)?.expiresAt;
          const b = (d.data() as any)?.expiresAt;
          const ams = a?.toMillis?.() ?? 0;
          const bms = b?.toMillis?.() ?? 0;
          if (bms > ams) best = d;
        }
      }
    }
    return best;
  };

  // 1) Probeer op uid
  let doc = await newestBy("uid", uid);

  // 2) Zoniet, val terug op e-mail
  if (!doc && tokenEmail) {
    doc = await newestBy("email", tokenEmail);
  }

  // 3) Geen licentie gevonden
  if (!doc) {
    logger.info("[getAccessStatus] Geen licentie", { uid, email: tokenEmail });
    return { allowed: false, reason: "no_license" };
  }

  // 4) Controleer status en vervaldatum
  const lic = doc.data() as any;
  const expMs = lic.expiresAt?.toMillis?.() ?? 0;
  const expIso =
    lic.expiresAt?.toDate?.() ? lic.expiresAt.toDate().toISOString() : null;

  logger.info("[getAccessStatus] Gekozen licentie", {
    uid,
    email: tokenEmail,
    id: doc.id,
    path: doc.ref.path,
    status: lic.status,
    expiresAtMs: expMs,
    entitlement: lic.entitlement,
    deviceLimit: lic.deviceLimit,
  });

  const isActive =
  String(lic.status || "").toLowerCase() === "actief" ||
  String(lic.status || "").toLowerCase() === "active";

if (!isActive) {
  return { allowed: false, reason: "inactive", expiresAt: expIso };
}

  if (expMs && expMs < nowMs) {
    return { allowed: false, reason: "expired", expiresAt: expIso };
  }

  return {
    allowed: true,
    reason: "ok",
    expiresAt: expIso,
    entitlement: lic.entitlement || ENTITLEMENT_ID,
    deviceLimit: lic.deviceLimit ?? DEVICE_LIMIT,
  };
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