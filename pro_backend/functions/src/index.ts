import * as admin from "firebase-admin";
import { onCall, HttpsError, onRequest } from "firebase-functions/v2/https";
import * as fs from "node:fs";
import * as path from "node:path";
import { onSchedule } from "firebase-functions/v2/scheduler";

// PDFKit (CommonJS import is het meest compatibel)
const PDFDocument = require("pdfkit");

// -------- Init ---------------------------------------------------------------
admin.initializeApp();

const REGION = "europe-west1";
const PROJECT_ID = process.env.GCLOUD_PROJECT || "zisa-spelletjesmaker-pro";
const MAIL_COLLECTION = "post";

// Globale helpers
const db = admin.firestore();
const bucket = admin.storage().bucket();

// -----------------------------------------------------------------------------
// Diverse helpers (valuta, datum, enz.)
// -----------------------------------------------------------------------------
function eur(amount: number): string {
  return amount.toFixed(2);
}

type Tier = "wachtlijst" | "algemeen";

async function bepaalTier(email: string): Promise<{ tier: Tier; prijs: number; productId: string }> {
  const docIds = [
    db.collection("Wachtlijst").doc(email),
    db.collection("waitlist").doc(email),
    db.collection("wachtlijst").doc(email),
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

async function volgendeFactuurnummer(): Promise<string> {
  const jaar = new Date().getFullYear();
  const ref = db.collection("Facturen").doc(`facturen-${jaar}`);
  const nr = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    let seq = snap.exists ? (snap.get("Seq") as number) ?? 0 : 0;
    seq += 1;
    tx.set(ref, { jaar, Seq: seq, bijgewerktOp: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    return seq;
  });
  return `${jaar}-${String(nr).padStart(4, "0")}`;
}

// -----------------------------------------------------------------------------
// Mollie API helpers
// -----------------------------------------------------------------------------
async function mollieCreatePayment(apiKey: string, amount: number, description: string, redirectUrl: string, webhookUrl: string, metadata: Record<string, any>) {
  const res = await fetch("https://api.mollie.com/v2/payments", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
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
// E-mail helpers
// -----------------------------------------------------------------------------

// >>> NIEUW: helper om een Storage-bestand als base64-bijlage te maken
async function storageFileAsBase64Attachment(filePath: string, filename: string) {
  const bucket = admin.storage().bucket();
  const file = bucket.file(filePath);
  const [bytes] = await file.download();
  return {
    filename,
    content: bytes.toString("base64"),
    encoding: "base64" as const,
  };
}

// >>> Aangepaste queueEmail: bijlagen binnen message.attachments
async function queueEmail(
  email: string,
  subject: string,
  html: string,
  attachments?: Array<{ filename: string; content?: string; encoding?: "base64"; path?: string }>
) {
  await db.collection(MAIL_COLLECTION).add({
    to: [email],
    message: {
      subject,
      html,
      attachments: attachments ?? [],
    },
  });
}

// -----------------------------------------------------------------------------
// Factuur genereren en uploaden
// -----------------------------------------------------------------------------
async function maakEnUploadFactuur(orderId: string, factuurNummer: string, email: string, productLabel: string, totaal: number): Promise<string> {
  const tmpFile = path.join("/tmp", `${orderId}.pdf`);
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const writeStream = fs.createWriteStream(tmpFile);
  doc.pipe(writeStream);

  const today = new Date();
  const datum = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

  doc.fontSize(22).text("Factuur", { align: "left" }).moveDown(0.2);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).stroke();

  doc.moveDown().fontSize(11)
    .text("Juf Zisa")
    .text("Maasfortbaan 108")
    .text("2500 Lier, België")
    .text("zebrapost@jufzisa.be");

  doc.fontSize(11)
    .text(`Factuurnr: ${factuurNummer}`, 350, 85, { align: "left" })
    .text(`Datum: ${datum}`, 350, doc.y + 5, { align: "left" });

  doc.moveDown(2).fontSize(12).text("Klant").moveDown(0.2).fontSize(11).text(email);

  doc.moveDown().fontSize(12).text("Omschrijving").moveDown(0.2).fontSize(11).text(productLabel);

  doc.moveDown().fontSize(12).text("Totaal").moveDown(0.2).fontSize(16).text(`€ ${totaal.toFixed(2)}`);

  doc.moveDown(1.2).fontSize(9)
    .text("Ondernemingsnummer: 1026.7xx.xxx")
    .text("Kleineondernemingsregeling – vrijstellingsregel voor kleine ondernemingen. BTW niet van toepassing.");

  doc.end();
  await new Promise<void>((resolve, reject) => {
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });

  const destination = `Facturen/${orderId}.pdf`;
  await bucket.upload(tmpFile, { destination, contentType: "application/pdf" });
  fs.unlinkSync(tmpFile);

  return destination; // Storage pad relatief aan de bucket
}

// -----------------------------------------------------------------------------
// Orderverwerking na betaling
// -----------------------------------------------------------------------------
async function completeOrderById(orderId: string) {
  const ref = db.collection("Orders").doc(orderId);
  const snap = await ref.get();
  if (!snap.exists) {
    console.error(`Order ${orderId} niet gevonden.`);
    return;
  }
  const order = snap.data()!;
  const email = (order["E-mail"] || order.email || "").toLowerCase().trim();
  const label = "Zisa PRO – licentie 1 jaar";
  const bedrag = Number(order.aantal || 40);

  // wachtwoord-resetlink (voor eerste login)
  const actionCodeSettings = {
    url: "https://isabelrockele.github.io/juf_zisa_spelletjesmaker/pro/",
    handleCodeInApp: false,
  } as any;
  const resetLink = await admin.auth().generatePasswordResetLink(email, actionCodeSettings);

  try {
    const factuurNummer = await volgendeFactuurnummer();
    const invoicePath = await maakEnUploadFactuur(orderId, factuurNummer, email, label, bedrag);

    // E-mail met PDF-bijlage (base64)
    const html = `
<p>Beste,</p>
<p>Bedankt voor uw aankoop van <strong>${label}</strong>.</p>
<p>U kunt uw wachtwoord instellen via deze link:<br>
  <a href="${resetLink}">${resetLink}</a>
</p>
<p>Na het instellen van uw wachtwoord kunt u inloggen op de app via:<br>
  <a href="https://isabelrockele.github.io/juf_zisa_spelletjesmaker/pro/">Log in op de app</a>
</p>
<p>In de bijlage vindt u uw factuur (<strong>${factuurNummer}</strong>).</p>
<p>Vriendelijke groeten,<br/>Juf Zisa</p>
`;

    const attachment = await storageFileAsBase64Attachment(
      invoicePath,
      `${factuurNummer}.pdf`
    );
    await queueEmail(
      email,
      `Zisa PRO – licentie & factuur ${factuurNummer}`,
      html,
      [attachment]
    );

    await ref.set({
      factuurnummer: factuurNummer,
      invoicePath,
      betaaldBij: admin.firestore.FieldValue.serverTimestamp(),
      status: "betaald",
    }, { merge: true });

  } catch (error) {
    console.error(`FATALE FOUT bij afhandelen order ${orderId}:`, error);
  }
}

// -----------------------------------------------------------------------------
// EXPORTED CLOUD FUNCTIONS
// -----------------------------------------------------------------------------

// Publieke functie voor het aanmaken van Mollie-betalingen
export const createPayment = onCall({ region: REGION }, async (req) => {
  const emailRaw = (req.data?.email as string | undefined) || "";
  const email = emailRaw.trim().toLowerCase();
  const forceTier = req.data?.forceTier as Tier | undefined;

  if (!email || !email.includes("@")) {
    throw new HttpsError("invalid-argument", "Ongeldig e-mailadres.");
  }

  let tierData;
  if (forceTier === "wachtlijst") {
    tierData = { tier: "wachtlijst" as Tier, prijs: 35, productId: "zisa-pro-jaarlijks-wachtlijst" };
  } else {
    tierData = await bepaalTier(email);
  }

  const { tier, prijs, productId } = tierData;

  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) {
    console.error("MOLLIE_API_KEY is not set in environment variables");
    throw new HttpsError("internal", "Server configuratiefout.");
  }
  const mode: "test" | "live" = apiKey.startsWith("live_") ? "live" : "test";

  const orderRef = await db.collection("Orders").add({
    "E-mail": email,
    Productid: productId,
    aantal: prijs,
    rang: tier,
    status: "gemaakt",
    betalingId: "",
    paymentMode: mode,
    paymentStatusHint: "open",
    gemaaktOp: admin.firestore.FieldValue.serverTimestamp(),
  });

  const redirectUrl = `https://isabelrockele.github.io/juf_zisa_spelletjesmaker/pro/bedankt.html?oid=${orderRef.id}`;
  const webhookUrl = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/mollieWebhook`;

  const payment = await mollieCreatePayment(
    apiKey,
    prijs,
    `Zisa PRO – ${tier === "wachtlijst" ? "wachtlijst" : "jaarlicentie"}`,
    redirectUrl,
    webhookUrl,
    { orderId: orderRef.id }
  );

  const checkoutUrl = payment?._links?.checkout?.href as string | undefined;
  const paymentId = payment?.id as string | undefined;
  if (!checkoutUrl || !paymentId) {
    throw new HttpsError("internal", "Kon Mollie-betaling niet aanmaken.");
  }

  await orderRef.set({ betalingId: paymentId }, { merge: true });

  return { ok: true, orderId: orderRef.id, checkoutUrl, tier };
});

export const mollieWebhook = onRequest({ region: REGION }, async (req, res) => {
  const paymentId = req.body.id as string | undefined;
  if (!paymentId) {
    res.status(400).send("Bad Request: Missing payment ID.");
    return;
  }

  try {
    const apiKey = process.env.MOLLIE_API_KEY;
    if (!apiKey) {
      console.error("MOLLIE_API_KEY is not set in environment variables");
      res.status(500).send("Internal Server Error: Missing server configuration.");
      return;
    }
    const payment = await mollieGetPayment(apiKey, paymentId);

    if (payment?.status === "paid") {
      const orderId = payment.metadata?.orderId as string | undefined;
      if (orderId) {
        await completeOrderById(orderId);
      } else {
        console.error(`FATAL: Payment ${paymentId} is paid but has no orderId in metadata.`);
      }
    }
    res.status(200).send("OK");
  } catch (error) {
    console.error(`Error processing webhook for payment ${paymentId}:`, error);
    res.status(500).send("Internal Server Error");
  }
});

// Apparaatregistratie met limiet 2 toestellen
export const registerDevice = onCall({ region: REGION }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Je moet ingelogd zijn om dit te doen.");
  }
  const uid = request.auth.uid;
  const email = request.auth.token.email;
  const deviceId = request.data.deviceId as string | undefined;

  if (!email || !deviceId) {
    throw new HttpsError("invalid-argument", "Verzoek is onvolledig.");
  }

  const ordersQuery = db.collection("Orders")
    .where("E-mail", "==", email)
    .where("status", "==", "betaald")
    .orderBy("betaaldBij", "desc")
    .limit(1);

  const orderSnapshot = await ordersQuery.get();
  if (orderSnapshot.empty) {
    return { ok: false, reason: "NO_PRO" };
  }

  const lastOrder = orderSnapshot.docs[0].data();
  const purchaseDate = (lastOrder.betaaldBij as admin.firestore.Timestamp).toDate();
  const expiryDate = new Date(purchaseDate.getTime());
  expiryDate.setDate(expiryDate.getDate() + 366);

  if (expiryDate < new Date()) {
    return { ok: false, reason: "EXPIRED_SUBSCRIPTION", expiresAt: expiryDate.getTime() };
  }

  const userRef = db.collection("Users").doc(uid);
  const userDoc = await userRef.get();
  const userData = userDoc.data() || {};
  const registeredDevices: string[] = userData.devices || [];
  const maxDevices = 2;

  if (registeredDevices.includes(deviceId)) {
    return { ok: true, expiresAt: expiryDate.getTime() };
  }

  if (registeredDevices.length >= maxDevices) {
    return { ok: false, reason: "DEVICE_LIMIT", max: maxDevices };
  }

  await userRef.set({ devices: [...registeredDevices, deviceId] }, { merge: true });
  return { ok: true, expiresAt: expiryDate.getTime() };
});

// Eenvoudige maandelijkse herinnering (voorbeeld)
export const sendExpiryReminders = onSchedule(
  { region: REGION, schedule: "0 9 1 * *" }, // elke 1e van de maand om 09:00
  async () => {
    const now = new Date();
    const soon = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // binnen 14 dagen
    const orders = await db.collection("Orders")
      .where("status", "==", "betaald")
      .get();

    for (const doc of orders.docs) {
      const orderData = doc.data();
      const betaaldBij = orderData.betaaldBij as admin.firestore.Timestamp | undefined;
      if (!betaaldBij) continue;
      const expiry = new Date(betaaldBij.toDate().getTime() + 366 * 24 * 60 * 60 * 1000);
      if (expiry > now && expiry <= soon) {
        const userEmail = orderData["E-mail"];
        const html = `
          <p>Beste klant,</p>
          <p>Dit is een herinnering dat uw Zisa PRO-abonnement binnenkort verloopt op ${expiry.toLocaleDateString()}.</p>
          <p>Verleng nu om te blijven genieten van alle functies!</p>
          <p>Met vriendelijke groeten,<br/>Juf Zisa</p>
        `;
        await queueEmail(userEmail, "Herinnering: Uw Zisa PRO-abonnement verloopt binnenkort!", html);
      }
    }
  }
);
