// functions/src/index.ts
import * as admin from "firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { onRequest, onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { defineSecret } from "firebase-functions/params";

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage().bucket();

const REGION = "europe-west1" as const;

// ✅ Door u bevestigd — eindigt op slash
const APP_URL = "https://isabelrockele.github.io/juf_zisa_spelletjesmaker/pro/";

// --- Vul uw afzender-/factuurgegevens aan ---
const SELLER = {
  name: "Zisa Spelletjesmaker PRO",
  address1: "Maasfortbaan 108",          // bv. Straat 1
  address2: "2500 Lier, België",          // bv. 2500 Lier, België
  email: "isabel.rockele@gmail.com",
  vatNote: "BTW niet van toepassing.", // of bv. "BTW 21% BE0xxx..."
  iban: "",              // optioneel
  bic: ""                // optioneel
};

// Secrets
const MOLLIE_API_KEY = defineSecret("MOLLIE_API_KEY");

// ---------- Helpers ----------
function toEmailLower(email: string) {
  return (email || "").trim().toLowerCase();
}
function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}
function pad4(n: number) {
  return n.toString().padStart(4, "0");
}
function generateLicenseCode(): string {
  // ZISA-XXXX-XXXX-XXXX (zonder verwarrende tekens)
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const block = (n = 4) =>
    Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `ZISA-${block()}-${block()}-${block()}`;
}

// Mail helper met bijlagen (Base64)
async function sendMail(
  to: string,
  subject: string,
  html: string,
  text?: string,
  attachments?: Array<{ filename: string; content: string; encoding: "base64" }>
) {
  const message: any = { subject, html };
  if (text) message.text = text;
  if (attachments?.length) message.attachments = attachments;
  await db.collection("mail").add({ to: [to], message });
}

async function ensureAuthUserAndInvite(email: string, continueUrl?: string) {
  const em = toEmailLower(email);
  try {
    await admin.auth().getUserByEmail(em);
  } catch {
    await admin.auth().createUser({ email: em });
  }
  const link = await admin.auth().generatePasswordResetLink(em, {
    url: continueUrl ?? `${APP_URL}index.html`,
    handleCodeInApp: false,
  });
  return link;
}

async function upsertEntitlement(email: string, expiresAt: Timestamp, source: any) {
  const em = toEmailLower(email);
  // Audit trail
  await db.collection("entitlements").doc().set({
    email: em,
    type: "pro",
    active: true,
    expiresAt,
    source,
    createdAt: FieldValue.serverTimestamp(),
  });
  // Snelle lookup
  await db
    .collection("entitlements_by_email")
    .doc(em)
    .set(
      {
        active: true,
        expiresAt,
        lastUpdated: FieldValue.serverTimestamp(),
        maxDevices: 2 // standaardlimiet
      },
      { merge: true }
    );
}

// ---- Mollie REST (zonder SDK) ----
const MOLLIE_API = "https://api.mollie.com/v2";

// Gebruik globalThis.fetch via any (geen DOM-typings nodig)
async function httpFetch(url: string, init: any) {
  const f = (globalThis as any).fetch;
  if (typeof f !== "function") throw new Error("Global fetch is not available at runtime.");
  return (f as (u: string, i?: any) => Promise<any>)(url, init);
}
async function mollieGetPayment(paymentId: string): Promise<any> {
  const res = await httpFetch(`${MOLLIE_API}/payments/${encodeURIComponent(paymentId)}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${MOLLIE_API_KEY.value()}` },
  });
  if (!res.ok) throw new Error(`Mollie GET failed ${res.status}: ${await res.text()}`);
  return await res.json();
}
async function mollieCreatePayment(body: any): Promise<any> {
  const res = await httpFetch(`${MOLLIE_API}/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MOLLIE_API_KEY.value()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Mollie POST failed ${res.status}: ${await res.text()}`);
  return await res.json();
}

// ---------- Factuurnummer + PDF ----------
async function nextInvoiceNumber(): Promise<{ number: string; seq: number; year: number }> {
  const year = new Date().getFullYear();
  const ref = db.collection("counters").doc("invoices");
  const seq = await db.runTransaction(async (t) => {
    const snap = await t.get(ref);
    let s = 0;
    if (snap.exists) {
      const docYear = snap.get("year") as number | undefined;
      const docSeq = snap.get("seq") as number | undefined;
      if (docYear === year && typeof docSeq === "number") s = docSeq;
    }
    s += 1;
    t.set(ref, { year, seq: s, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return s;
  });
  return { number: `ZISA-${year}-${pad4(seq)}`, seq, year };
}

function centsToEuro(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

async function buildInvoicePdfBuffer(params: {
  invoiceNumber: string;
  invoiceDate: Date;
  buyerEmail: string;
  description: string;
  amountCents: number;
}): Promise<Buffer> {
  // Dynamische import via require om typings-troubles te vermijden
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const PDFDocument = require("pdfkit");
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));

  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const { invoiceNumber, invoiceDate, buyerEmail, description, amountCents } = params;

  // Header
  doc.fontSize(16).text(SELLER.name, { continued: false });
  if (SELLER.address1) doc.fontSize(10).text(SELLER.address1);
  if (SELLER.address2) doc.text(SELLER.address2);
  if (SELLER.email) doc.text(SELLER.email);
  if (SELLER.iban) doc.text(`IBAN: ${SELLER.iban}${SELLER.bic ? ` • BIC: ${SELLER.bic}` : ""}`);
  doc.moveDown();

  doc.fontSize(18).text("Factuur", { align: "right" });
  doc.fontSize(10).text(`Factuurnummer: ${invoiceNumber}`, { align: "right" });
  doc.text(`Datum: ${invoiceDate.toLocaleDateString("nl-BE")}`, { align: "right" });
  doc.moveDown();

  // Klant
  doc.fontSize(12).text("Aan:", { underline: false });
  doc.fontSize(10).text(buyerEmail);
  doc.moveDown();

  // Tabeltje (1 regel)
  doc.fontSize(11).text("Omschrijving");
  doc.moveDown(0.2);
  doc.fontSize(10).text(description);
  doc.moveDown();

  // Bedrag
  const amount = centsToEuro(amountCents);
  doc.moveDown();
  doc.fontSize(12).text(`Totaal: € ${amount}`, { align: "right" });
  if (SELLER.vatNote) {
    doc.fontSize(9).text(SELLER.vatNote, { align: "right" });
  }

  doc.moveDown();
  doc.fontSize(9).fillColor("#555").text(
    "Deze factuur werd automatisch aangemaakt na uw betaling. Bewaar dit document voor uw administratie.",
    { align: "left" }
  );

  doc.end();
  return done;
}

// ---------- Orderverwerking na "paid" ----------
async function completeOrder(params: {
  orderId: string;
  paymentId: string;
  email: string;
  productId: string;
  tier?: "waitlist" | "general";
}) {
  const { orderId, paymentId, email, productId, tier } = params;
  const em = toEmailLower(email);

  const orderRef = db.collection("orders").doc(orderId);
  const existing = await orderRef.get();
  // 🔁 Idempotentie
  if (existing.exists && existing.get("status") === "paid") {
    logger.info(`Order ${orderId} already paid; skipping`);
    return existing.data();
  }

  const now = new Date();
  const expiresAtJS = addDays(now, 365);
  const expiresAt = Timestamp.fromDate(expiresAtJS);

  // 1) Licentie
  const licenseCode = generateLicenseCode();
  const licenseRef = db.collection("licenses").doc();
  await licenseRef.set({
    email: em,
    code: licenseCode,
    productId,
    paymentId,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt,
    orderId,
    tier: tier ?? null,
  });

  // 2) Entitlement
  await upsertEntitlement(em, expiresAt, {
    kind: "mollie",
    paymentId,
    productId,
    orderId,
    tier: tier ?? null,
  });

  // 3) Order bijwerken
  await orderRef.set(
    {
      email: em,
      productId,
      status: "paid",
      licenseId: licenseRef.id,
      paymentId,
      updatedAt: FieldValue.serverTimestamp(),
      expiresAt,
      tier: tier ?? null,
    },
    { merge: true }
  );

  // ---- Factuur opmaken ----
  const orderAmountCents =
    (existing.exists && typeof existing.get("amountCents") === "number"
      ? existing.get("amountCents")
      : productId.includes("waitlist")
      ? 3500
      : 4000) as number;

  const { number: invoiceNumber } = await nextInvoiceNumber();
  const invoiceDate = now;
  const description = productId.includes("waitlist")
    ? "Zisa PRO – 1 jaar (wachtlijst)"
    : "Zisa PRO – 1 jaar";

  const pdfBuffer = await buildInvoicePdfBuffer({
    invoiceNumber,
    invoiceDate,
    buyerEmail: em,
    description,
    amountCents: orderAmountCents,
  });

  // Upload naar Storage
  const invoiceId = `${orderId}`;
  const filePath = `invoices/${invoiceId}.pdf`;
  const file = storage.file(filePath);
  await file.save(pdfBuffer, {
    contentType: "application/pdf",
    resumable: false,
    metadata: { cacheControl: "private, max-age=0" },
  });

  // Log naar Firestore (invoices)
  await db.collection("invoices").doc(invoiceId).set(
    {
      invoiceNumber,
      orderId,
      paymentId,
      email: em,
      amountCents: orderAmountCents,
      currency: "EUR",
      description,
      createdAt: FieldValue.serverTimestamp(),
      filePath,
    },
    { merge: true }
  );

  // 4) Resetlink + mail (met PDF-bijlage)
  const resetLink = await ensureAuthUserAndInvite(em, `${APP_URL}index.html`);
  const expStr = expiresAtJS.toLocaleDateString("nl-BE");

  const base64pdf = pdfBuffer.toString("base64");
  const attachments = [
    {
      filename: `Factuur_${invoiceNumber}.pdf`,
      content: base64pdf,
      encoding: "base64" as const,
    },
  ];

  const html = `
    <p>Beste,</p>
    <p>Hartelijk dank voor uw aankoop. Uw PRO-licentiecode: <strong>${licenseCode}</strong><br>
    <em>Geldig t.e.m. ${expStr}</em>.</p>
    <p>
      <a href="${resetLink}" style="text-decoration:none;background:#4a67ff;color:#fff;padding:12px 18px;border-radius:8px;display:inline-block">Wachtwoord instellen</a>
      &nbsp;
      <a href="${APP_URL}index.html" style="text-decoration:none;background:#111827;color:#fff;padding:12px 18px;border-radius:8px;display:inline-block">Open Zisa PRO</a>
    </p>
    <p>In de bijlage vindt u <strong>uw factuur ${invoiceNumber}</strong> in PDF-formaat.</p>
    <p>Vriendelijke groet,<br>${SELLER.name}</p>
  `;

  await sendMail(
    em,
    `Zisa PRO – licentie & factuur ${invoiceNumber}`,
    html,
    undefined,
    attachments
  );

  return { ok: true, orderId, licenseId: licenseRef.id, expiresAt, invoiceNumber };
}

// ---------- Callables / HTTPS ----------

// PRO-status check
export const checkEntitlement = onCall({ region: REGION }, async (req) => {
  const email = (req.auth?.token.email as string) || (req.data?.email as string);
  if (!email) throw new Error("Geen e-mail.");
  const em = toEmailLower(email);
  const snap = await db.collection("entitlements_by_email").doc(em).get();
  const data = snap.data();
  const now = Timestamp.now();
  const active =
    !!data && data.active === true && data.expiresAt && data.expiresAt.toMillis() > now.toMillis();
  return { active, expiresAt: data?.expiresAt || null, maxDevices: data?.maxDevices ?? 2 };
});

// ✅ Toestel registreren + limiet afdwingen
export const registerDevice = onCall({ region: REGION }, async (req) => {
  const email = (req.auth?.token.email as string) || (req.data?.email as string);
  const userId = req.auth?.uid || null;
  const { deviceId, ua } = (req.data || {}) as { deviceId: string; ua?: string };
  if (!email) throw new Error("Geen e-mail.");
  if (!deviceId) throw new Error("deviceId vereist");

  const em = toEmailLower(email);
  const entSnap = await db.collection("entitlements_by_email").doc(em).get();
  const ent = entSnap.data();
  if (!ent || ent.active !== true || !ent.expiresAt) throw new Error("no_entitlement");
  const now = Timestamp.now();
  if (ent.expiresAt.toMillis() <= now.toMillis()) throw new Error("expired");
  const maxDevices = ent.maxDevices ?? 2;

  const thisRef = db.collection("devices").doc(`${em}__${deviceId}`);
  const thisDoc = await thisRef.get();
  if (!thisDoc.exists) {
    const q = await db.collection("devices").where("email", "==", em).get();
    const count = q.size;
    if (count >= maxDevices) throw new Error("device_limit");
    await thisRef.set({
      email: em,
      userId,
      deviceId,
      ua: ua || "",
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  return { ok: true, maxDevices };
});

// Toestellen bekijken
export const listDevices = onCall({ region: REGION }, async (req) => {
  const email = (req.auth?.token.email as string) || (req.data?.email as string);
  if (!email) throw new Error("Geen e-mail.");
  const em = toEmailLower(email);
  const q = await db.collection("devices").where("email", "==", em).get();
  return q.docs.map((d) => ({ id: d.id, ...d.data() }));
});

// Toestel afmelden
export const deactivateDevice = onCall({ region: REGION }, async (req) => {
  const email = (req.auth?.token.email as string) || (req.data?.email as string);
  const { deviceId } = (req.data || {}) as { deviceId: string };
  if (!email || !deviceId) throw new Error("email en deviceId vereist");
  const em = toEmailLower(email);
  const ref = db.collection("devices").doc(`${em}__${deviceId}`);
  const snap = await ref.get();
  if (!snap.exists || snap.get("email") !== em) throw new Error("Onbevoegd of onbekend toestel");
  await ref.delete();
  return { ok: true };
});

// 🟢 Betaling aanmaken – met server-side wachtlijstcontrole (REST)
export const createPayment = onCall({ region: REGION, secrets: [MOLLIE_API_KEY] }, async (req) => {
  const email = (req.auth?.token.email as string) || (req.data?.email as string);
  if (!email) throw new Error("Login of e-mail vereist.");
  const em = toEmailLower(email);

  // ---- Server-side prijsbepaling ----
  const waitDoc = await db.collection("waitlist").doc(em).get();
  const tier: "waitlist" | "general" = waitDoc.exists ? "waitlist" : "general";

  const currency = "EUR";
  const productId = tier === "waitlist" ? "zisa-pro-annual-waitlist" : "zisa-pro-annual";
  const amount = tier === "waitlist" ? "35.00" : "40.00";

  // Order initialiseren
  const orderId = db.collection("orders").doc().id;
  await db.collection("orders").doc(orderId).set(
    {
      status: "open",
      email: em,
      productId,
      amountCents: Math.round(parseFloat(amount) * 100),
      currency,
      tier,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // Mollie payment via REST
  const body = {
    amount: { currency, value: amount },
    description: tier === "waitlist" ? "Zisa PRO – 1 jaar (wachtlijst)" : "Zisa PRO – 1 jaar",
    redirectUrl: `${APP_URL}bedankt.html?oid=${orderId}`,
    webhookUrl: `https://${REGION}-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/mollieWebhook`,
    metadata: { orderId, email: em, productId, tier },
    locale: "nl_BE",
  };
  const payment = await mollieCreatePayment(body);

  return {
    orderId,
    paymentId: payment.id,
    checkoutUrl: payment?._links?.checkout?.href || null,
    tier,
  };
});

// 🌐 Webhook – verwerk enkel "paid" (REST)
export const mollieWebhook = onRequest(
  { region: REGION, secrets: [MOLLIE_API_KEY] },
  async (req, res) => {
    try {
      const paymentId = (req.body?.id || req.query?.id) as string;
      if (!paymentId) {
        res.status(400).send("missing id");
        return;
      }

      const payment = await mollieGetPayment(paymentId);

      if (payment.status !== "paid") {
        logger.info(`Webhook for ${paymentId} with status ${payment.status} (ignored)`);
        res.status(200).send("ignored");
        return;
      }

      const md = (payment.metadata || {}) as any;
      const orderId = md.orderId || db.collection("orders").doc().id;
      const email = md.email as string;
      const productId = (md.productId as string) ?? "zisa-pro-annual";
      const tier = (md.tier as "waitlist" | "general") ?? undefined;

      // Idempotentie
      const orderRef = db.collection("orders").doc(orderId);
      const orderSnap = await orderRef.get();
      if (orderSnap.exists && orderSnap.get("status") === "paid") {
        logger.info(`Order ${orderId} already paid (idempotent)`);
        res.status(200).send("already");
        return;
      }

      await completeOrder({ orderId, paymentId, email, productId, tier });
      logger.info(`Order ${orderId} processed for ${email} (tier=${tier || "n/a"})`);
      res.status(200).send("processed");
    } catch (e: any) {
      logger.error(e);
      // Mollie verwacht 200, ook bij interne fout; wij loggen het
      res.status(200).send("ok");
    }
  }
);

// 🧪 Dev/test: activeer PRO zonder Mollie
export const devSimulatePaid = onCall({ region: REGION }, async (req) => {
  const email = (req.data?.email as string) || (req.auth?.token.email as string);
  if (!email) throw new Error("email vereist");
  const em = toEmailLower(email);
  const waitDoc = await db.collection("waitlist").doc(em).get();
  const tier: "waitlist" | "general" = waitDoc.exists ? "waitlist" : "general";
  const productId = tier === "waitlist" ? "zisa-pro-annual-waitlist" : "zisa-pro-annual";

  const orderId = db.collection("orders").doc().id;
  const paymentId = `dev_${Date.now()}`;
  await completeOrder({ orderId, paymentId, email: em, productId, tier });
  return { ok: true, orderId, paymentId, tier };
});


