/* pro_backend/functions/src/index.ts */

import * as admin from "firebase-admin";
import { onCall, HttpsError, onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as fs from "node:fs";
import * as path from "node:path";

// PDFKit (CommonJS import is het meest compatibel)
const PDFDocument = require("pdfkit");

// -------- Init & secrets -----------------------------------------------------

admin.initializeApp();

const MOLLIE_API_KEY = defineSecret("MOLLIE_API_KEY");
const REGION = "europe-west1";
const PROJECT_ID = process.env.GCLOUD_PROJECT || "zisa-spelletjesmaker-pro";

// E-mail: extensie luistert op deze collectie
const MAIL_COLLECTION = "post";

// Globale helpers
const db = admin.firestore();
const bucket = admin.storage().bucket();

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type Tier = "wachtlijst" | "algemeen";

interface OrderData {
  "E-mail": string;
  Productid: string;
  aantal: number;               // in EUR (35 / 40)
  rang: Tier;
  status: "gemaakt" | "betaald";
  betalingId: string;
  paymentMode: "test" | "live";
  paymentStatusHint?: string;
  factuurnummer?: string;
  invoicePath?: string;
  gemaaktOp?: FirebaseFirestore.FieldValue;
  betaaldBij?: FirebaseFirestore.FieldValue;
}

// -----------------------------------------------------------------------------
// Wachtlijst: 7-dagen geldigheid
// -----------------------------------------------------------------------------

async function bepaalTier(email: string): Promise<{ tier: Tier; prijs: number; productId: string }> {
  const docIds = [
    db.collection("Wachtlijst").doc(email),
    db.collection("waitlist").doc(email),   // tolerantie voor oudere naam
    db.collection("wachtlijst").doc(email), // idem
  ];

  for (const ref of docIds) {
    const snap = await ref.get();
    if (snap.exists) {
      const data = snap.data() as any;
      const geldigTot = data?.geldigTot as admin.firestore.Timestamp | undefined;
      if (geldigTot && geldigTot.toMillis() > Date.now()) {
        return { tier: "wachtlijst", prijs: 35, productId: "zisa-pro-jaarlijks-wachtlijst" };
      }
    }
  }
  return { tier: "algemeen", prijs: 40, productId: "zisa-pro-jaarlijks" };
}

// -----------------------------------------------------------------------------
// Factuurnummer generator: ZISA-YYYY-0001  (collectie: Facturen/facturen-YYYY)
// -----------------------------------------------------------------------------

async function volgendeFactuurnummer(): Promise<string> {
  const jaar = new Date().getFullYear();
  const ref = db.collection("Facturen").doc(`facturen-${jaar}`);
  const nr = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    let seq = 0;
    if (snap.exists) {
      seq = (snap.get("Seq") as number) ?? 0;
    }
    seq += 1;
    tx.set(
      ref,
      {
        jaar,
        Seq: seq,
        bijgewerktOp: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return seq;
  });
  return `ZISA-${jaar}-${String(nr).padStart(4, "0")}`;
}

// -----------------------------------------------------------------------------
// Mollie helpers (Node 20 heeft fetch ingebouwd)
// -----------------------------------------------------------------------------

function eur(v: number): string {
  // Mollie verwacht string met 2 decimalen
  return v.toFixed(2);
}

async function mollieCreatePayment(
  apiKey: string,
  amount: number,
  description: string,
  redirectUrl: string,
  webhookUrl: string,
  metadata: Record<string, any>
) {
  const res = await fetch("https://api.mollie.com/v2/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: { currency: "EUR", value: eur(amount) },
      description,
      redirectUrl,
      webhookUrl,
      metadata,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Mollie createPayment failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<any>;
}

async function mollieGetPayment(apiKey: string, id: string) {
  const res = await fetch(`https://api.mollie.com/v2/payments/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Mollie getPayment failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<any>;
}

// -----------------------------------------------------------------------------
// E-mail in juiste schema naar extensie-collectie "post"
// -----------------------------------------------------------------------------

async function queueEmail(
  email: string,
  subject: string,
  html: string,
  invoicePath: string,
  factuurNummer: string
) {
  const bucketName = bucket.name; // bv. zisa-spelletjesmaker-pro.appspot.com
  await db.collection(MAIL_COLLECTION).add({
    to: [email],
    message: { subject, html },
    attachments: [
      {
        filename: `${factuurNummer}.pdf`,
        path: `gs://${bucketName}/${invoicePath}`,
      },
    ],
  });
}

// -----------------------------------------------------------------------------
// PDF maken en uploaden naar Storage/Facturen/<orderId>.pdf
// -----------------------------------------------------------------------------

async function maakEnUploadFactuur(
  orderId: string,
  factuurNummer: string,
  email: string,
  productLabel: string,
  totaal: number
): Promise<string> {
  const tmpFile = path.join("/tmp", `${orderId}.pdf`);
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  const writeStream = fs.createWriteStream(tmpFile);
  doc.pipe(writeStream);

  const today = new Date();
  const datum = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

  // Header
  doc.fontSize(22).text("Factuur", { align: "left" }).moveDown(0.2);
  doc
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .lineWidth(0.5)
    .stroke();

  // Verkoper
  doc.moveDown().fontSize(11);
  doc.text("Juf Zisa");
  doc.text("Maasfortbaan 108");
  doc.text("2500 Lier, België");
  doc.text("zebrapost@jufzisa.be");

  // Factuurinfo rechts
  doc
    .fontSize(11)
    .text(`Factuurnr: ${factuurNummer}`, 350, 85, { align: "left" })
    .text(`Datum: ${datum}`, 350, doc.y + 5, { align: "left" });

  // Klant
  doc.moveDown().moveDown();
  doc.fontSize(12).text("Klant", { underline: false }).moveDown(0.2);
  doc.fontSize(11).text(email);

  // Omschrijving
  doc.moveDown().fontSize(12).text("Omschrijving").moveDown(0.2);
  doc.fontSize(11).text(productLabel);

  // Totaal
  doc.moveDown().fontSize(12).text("Totaal").moveDown(0.2);
  doc.fontSize(16).text(`€ ${totaal.toFixed(2)}`);

  // Footer
  doc.moveDown(1.2).fontSize(9).text(
    "Ondernemingsnummer: 1026.769.348 — Onderneming onderworpen aan de vrijstellingsregel voor kleine ondernemingen. BTW niet van toepassing."
  );

  doc.end();
  await new Promise<void>((resolve, reject) => {
    writeStream.on("finish", () => resolve());
    writeStream.on("error", reject);
  });

  const destination = `Facturen/${orderId}.pdf`;
  await bucket.upload(tmpFile, {
    destination,
    contentType: "application/pdf",
  });

  try {
    fs.unlinkSync(tmpFile);
  } catch {}

  return destination; // invoicePath
}

// -----------------------------------------------------------------------------
// Complete order: factuur, mail, status bijwerken
// -----------------------------------------------------------------------------

async function completeOrderById(orderId: string) {
  const ref = db.collection("Orders").doc(orderId);
  const snapshot = await ref.get();
  if (!snapshot.exists) return;

  const data = snapshot.data() as OrderData;
  if (data.status === "betaald") return; // al afgewerkt

  const email = data["E-mail"];
  const bedrag = data.aantal;
  const label =
    data.rang === "wachtlijst" ? "Zisa PRO – jaarlicentie (wachtlijst)" : "Zisa PRO – jaarlicentie";

  // Factuurnummer & PDF
  const factuurNummer = await volgendeFactuurnummer();
  const invoicePath = await maakEnUploadFactuur(orderId, factuurNummer, email, label, bedrag);

  // Password-resetlink
  const resetLink = await admin.auth().generatePasswordResetLink(email);

  // E-mail (HTML)
  const html = `
<p>Beste,</p>
<p>Bedankt voor uw aankoop van <strong>${label}</strong>.</p>
<p>U kunt uw wachtwoord instellen via deze link:<br>
  <a href="${resetLink}">${resetLink}</a>
</p>
<p>In de bijlage vindt u uw factuur (<strong>${factuurNummer}</strong>).</p>
<p>Vriendelijke groeten,<br/>Juf Zisa</p>`;

  // Mail in wachtrij zetten
  await queueEmail(email, `Zisa PRO – licentie & factuur ${factuurNummer}`, html, invoicePath, factuurNummer);

  // Order bijwerken
  await ref.set(
    {
      factuurnummer: factuurNummer,
      invoicePath,
      betaaldBij: admin.firestore.FieldValue.serverTimestamp(),
      status: "betaald",
    } as Partial<OrderData>,
    { merge: true }
  );
}

async function completeOrderByPaymentId(paymentId: string, mollieApiKey: string) {
  // Probeer via metadata.orderId (indien aanwezig)
  try {
    const payment = await mollieGetPayment(mollieApiKey, paymentId);
    const metaOrderId = payment?.metadata?.orderId as string | undefined;
    if (metaOrderId) {
      await completeOrderById(metaOrderId);
      return;
    }
  } catch {
    // fall-through naar query op betalingId
  }

  // Fallback: zoek in Orders op betalingId
  const snap = await db
    .collection("Orders")
    .where("betalingId", "==", paymentId)
    .limit(1)
    .get();

  if (!snap.empty) {
    await completeOrderById(snap.docs[0].id);
  }
}

// -----------------------------------------------------------------------------
// Functions
// -----------------------------------------------------------------------------

export const createPayment = onCall(
  { region: REGION, secrets: [MOLLIE_API_KEY] },
  async (req) => {
    const emailRaw = (req.data?.email as string | undefined) || "";
    const email = emailRaw.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      throw new HttpsError("invalid-argument", "Ongeldig e-mailadres.");
    }

    const { tier, prijs, productId } = await bepaalTier(email);
    const apiKey = MOLLIE_API_KEY.value();
    const mode: "test" | "live" = apiKey.startsWith("live_") ? "live" : "test";

    // Maak order (status: gemaakt)
    const orderRef = await db.collection("Orders").add({
      "E-mail": email,
      Productid: productId,
      aantal: prijs,
      rang: tier,
      status: "gemaakt",
      betalingId: "", // volgt na Mollie create
      paymentMode: mode,
      paymentStatusHint: "open",
      gemaaktOp: admin.firestore.FieldValue.serverTimestamp(),
    } satisfies OrderData);

    const redirectUrl = `https://isabelrockele.github.io/juf_zisa_spelletjesmaker/pro/bedankt.html?oid=${orderRef.id}`;
    const webhookUrl = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/mollieWebhook`;

    // Mollie betaling aanmaken
    const payment = await mollieCreatePayment(apiKey, prijs, "Zisa PRO – jaarlicentie", redirectUrl, webhookUrl, {
      orderId: orderRef.id,
      email,
      tier,
    });

    const checkoutUrl = payment?._links?.checkout?.href as string | undefined;
    const paymentId = payment?.id as string | undefined;
    if (!checkoutUrl || !paymentId) {
      throw new HttpsError("internal", "Kon Mollie-betaling niet aanmaken.");
    }

    // Order aanvullen met betalingId
    await orderRef.set({ betalingId: paymentId } as Partial<OrderData>, { merge: true });

    return { ok: true, orderId: orderRef.id, checkoutUrl, tier };
  }
);

// Mollie webhook (GET/POST) → ?id=<paymentId>
export const mollieWebhook = onRequest(
  { region: REGION, secrets: [MOLLIE_API_KEY] },
  async (req, res) => {
    try {
      const id =
        (req.method === "POST" ? (req.body?.id as string | undefined) : undefined) ||
        (req.query?.id as string | undefined);

      if (!id) {
        res.status(400).send("missing id");
        return;
      }

      const apiKey = MOLLIE_API_KEY.value();
      const payment = await mollieGetPayment(apiKey, id);

      // Alleen betalen/authorized afwerken
      const status = String(payment?.status || "");
      if (!["paid", "authorized"].includes(status)) {
        res.status(200).send(`ignored (${status})`);
        return;
      }

      await completeOrderByPaymentId(id, apiKey);
      res.status(200).send("OK");
    } catch (e: any) {
      console.error("webhook error", e);
      res.status(500).send("ERR");
    }
  }
);

// Snelle test: zet een "betaald" order neer zonder Mollie, maakt PDF + mail
export const devSimulatePaid = onCall({ region: REGION }, async (req) => {
  const emailRaw = (req.data?.email as string | undefined) || "";
  const email = emailRaw.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new HttpsError("invalid-argument", "Ongeldig e-mailadres.");
  }

  const { tier, prijs, productId } = await bepaalTier(email);
  const paymentId = `dev_${Date.now()}`;

  const orderRef = await db.collection("Orders").add({
    "E-mail": email,
    Productid: productId,
    aantal: prijs,
    rang: tier,
    status: "gemaakt",
    betalingId: paymentId,
    paymentMode: "test",
    paymentStatusHint: "open",
    gemaaktOp: admin.firestore.FieldValue.serverTimestamp(),
  } satisfies OrderData);

  await completeOrderById(orderRef.id);

  return { ok: true, orderId: orderRef.id, paymentId, tier };
});
