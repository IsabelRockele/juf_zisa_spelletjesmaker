/**
 * zisa-spelletjesmaker-pro — API (Gen2, OTP + sessie via cookie OF Bearer token)
 * (Bijgewerkt: licentie-check toegevoegd en licentie activeren in webhook)
 */

import * as functions from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import crypto from "crypto";

// Mollie + mail
import createMollieClient from "@mollie/api-client";
import sgMail from "@sendgrid/mail";

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(express.json());

/** ===== CORS ===== */
const ALLOWED_ORIGINS = [
  "https://isabelrockele.github.io",
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  // "https://www.jufzisa.be",
];
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);
app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  return next();
});

/** ===== Config & helpers ===== */
const num = (v: string | undefined, d: number) =>
  Number.isFinite(Number(v)) ? Number(v) : d;
const bool = (v: string | undefined, d: boolean) =>
  v === undefined ? d : String(v).toLowerCase() === "true";

const OTP_TTL_MS = () => num(process.env.OTP_TTL_MS, 5 * 60 * 1000);           // 5 min
const OTP_MIN_INTERVAL_MS = () => num(process.env.OTP_MIN_INTERVAL_MS, 60_000); // 60 s
const DISPLAY_OTP = () => bool(process.env.DISPLAY_OTP, false);

const OTP_PEPPER = () => String(process.env.OTP_PEPPER ?? "");
const SESSION_SECRET = () => String(process.env.SESSION_SECRET ?? "");
const SESSION_TTL_MS = () => num(process.env.SESSION_TTL_MS, 24 * 60 * 60 * 1000); // 24 u

const MOLLIE_API_KEY = () => String(process.env.MOLLIE_API_KEY ?? "");
const SENDGRID_API_KEY = () => String(process.env.SENDGRID_API_KEY ?? "");
const SENDER_EMAIL = () => String(process.env.SENDER_EMAIL ?? "");

const SESSION_COOKIE_NAME = "zisa_session";

app.use(cookieParser());

function now() { return Date.now(); }
function isAdmin(uid: string) { return uid === "isabel-admin"; }

function generateOtp(): string {
  const n = crypto.randomInt(0, 1_000_000);
  return n.toString().padStart(6, "0");
}
function hashOtp(uid: string, code: string, pepper: string): string {
  return crypto.createHash("sha256").update(`${uid}:${code}:${pepper}`).digest("hex");
}
function isValidUid(uid: unknown): uid is string {
  return typeof uid === "string" && uid.trim().length >= 3 && uid.length <= 128;
}
function isValidCode(code: unknown): code is string {
  return typeof code === "string" && /^[0-9]{6}$/.test(code);
}

// Sessie/token signeren met HMAC-SHA256
type SessionPayload = { uid: string; exp: number };
function signToken(p: SessionPayload, secret: string): string {
  const body = Buffer.from(JSON.stringify(p)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}
function verifyToken(token: string, secret: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expect = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
  if (payload.exp < now()) return null;
  return payload;
}

// Mollie client & mail init
const mollie = () => createMollieClient({ apiKey: MOLLIE_API_KEY() });
function initMailer() {
  const key = SENDGRID_API_KEY();
  if (!key) return false;
  sgMail.setApiKey(key);
  return true;
}
async function sendOtpEmail(toEmail: string, code: string) {
  const from = SENDER_EMAIL();
  if (!from) throw new Error("SENDER_EMAIL missing");
  const minutes = Math.round(OTP_TTL_MS() / 60000);
  const msg = {
    to: toEmail,
    from,
    subject: "Juf Zisa – jouw inlogcode",
    text: `Je code is ${code}. Geldig gedurende ${minutes} minuten.`,
    html: `<p>Je code is <strong>${code}</strong>. Geldig gedurende ${minutes} minuten.</p>`,
  };
  await sgMail.send(msg as any);
}

/** === Licenties === */
const LICENSES_COL = "licenses";
async function hasActiveLicense(uid: string): Promise<boolean> {
  const snap = await db.collection(LICENSES_COL).doc(uid).get();
  return !!(snap.exists && (snap.data() as any)?.active === true);
}

/** ===== Testroutes ===== */
app.get("/", (_req, res) =>
  res.json({
    ok: true,
    endpoints: [
      "/ping",
      "/otp/request",
      "/otp/verify",
      "/auth/me",
      "/auth/logout",
      "/payments/create",
      "/payments/webhook",
      "/payments/:id/status",
    ],
  })
);
app.get("/ping", (_req, res) => res.json({ ok: true, msg: "pong" }));

/** ===== OTP aanvragen ===== */
app.post("/otp/request", async (req, res) => {
  try {
    const { uid } = req.body ?? {};
    if (!isValidUid(uid)) return res.status(400).json({ ok: false, error: "INVALID_UID" });

    const pepper = OTP_PEPPER();
    if (!pepper) return res.status(500).json({ ok: false, error: "SERVER_MISSING_PEPPER" });

    const docRef = db.collection("otp").doc(uid);
    const snap = await docRef.get();
    const nowMs = now();

    if (snap.exists) {
      const data = snap.data() as any;
      const lastIssuedAt = Number(data?.issuedAt ?? 0);
      const prevExpiresAt = Number(data?.expiresAt ?? 0);
      const tooSoon = nowMs - lastIssuedAt < OTP_MIN_INTERVAL_MS();

      if (tooSoon && !isAdmin(uid)) {
        return res.json({
          ok: true,
          alreadyIssued: true,
          requestedAt: lastIssuedAt,
          expiresAt: prevExpiresAt,
          retryInMs: OTP_MIN_INTERVAL_MS() - (nowMs - lastIssuedAt),
        });
      }
    }

    const code = generateOtp();
    const hash = hashOtp(uid, code, pepper);
    const expiresAt = nowMs + OTP_TTL_MS();

    await docRef.set({ uid, hash, issuedAt: nowMs, expiresAt, usedAt: null }, { merge: true });

    const payload: Record<string, any> = { ok: true, requestedAt: nowMs, expiresAt };
    if (DISPLAY_OTP() || isAdmin(uid)) payload.displayCode = code;

    return res.json(payload);
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: "SERVER_ERROR", detail: err?.message ?? String(err) });
  }
});

/** ===== OTP verifiëren (zet cookie EN return token) ===== */
app.post("/otp/verify", async (req, res) => {
  try {
    const { uid, code } = req.body ?? {};
    if (!isValidUid(uid)) return res.status(400).json({ ok: false, error: "INVALID_UID" });
    if (!isValidCode(code)) return res.status(400).json({ ok: false, error: "INVALID_CODE" });

    const pepper = OTP_PEPPER();
    const secret = SESSION_SECRET();
    if (!pepper || !secret) return res.status(500).json({ ok: false, error: "SERVER_SECRETS_MISSING" });

    const docRef = db.collection("otp").doc(uid);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ ok: false, error: "OTP_NOT_FOUND" });

    const data = snap.data() as any;
    const { hash, expiresAt, usedAt } = data ?? {};
    if (usedAt) return res.status(410).json({ ok: false, error: "OTP_ALREADY_USED" });
    if (!hash || typeof hash !== "string") return res.status(500).json({ ok: false, error: "OTP_INVALID_STATE" });

    const nowMs = now();
    if (Number(expiresAt ?? 0) < nowMs) return res.status(410).json({ ok: false, error: "OTP_EXPIRED" });

    const candidate = hashOtp(uid, code, pepper);
    if (candidate !== hash) return res.status(401).json({ ok: false, error: "OTP_MISMATCH" });

    // ►►► LICENTIE-CHECK
    const active = await hasActiveLicense(uid);
    if (!active) return res.status(403).json({ ok:false, error:"NO_ACTIVE_LICENSE" });

    // Token + cookie aanmaken
    const exp = nowMs + SESSION_TTL_MS();
    const token = signToken({ uid, exp }, secret);

    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: "none", // nodig omdat je front-end op GitHub Pages draait (cross-site)
      path: "/",
      maxAge: SESSION_TTL_MS(),
    });

    return res.json({ ok: true, token, exp, uid });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: "SERVER_ERROR", detail: err?.message ?? String(err) });
  }
});

/** ===== Auth status (cookie OF Authorization: Bearer) ===== */
app.get("/auth/me", (req, res) => {
  try {
    const secret = SESSION_SECRET();
    if (!secret) return res.status(500).json({ ok: false, error: "SERVER_SECRETS_MISSING" });

    // 1) Probeer cookie
    let raw = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;

    // 2) Of Bearer token
    if (!raw) {
      const auth = req.header("authorization") || req.header("Authorization");
      if (auth && auth.startsWith("Bearer ")) {
        raw = auth.slice("Bearer ".length).trim();
      }
    }

    if (!raw) return res.status(401).json({ ok: false, error: "NO_SESSION" });

    const payload = verifyToken(raw, secret);
    if (!payload) return res.status(401).json({ ok: false, error: "INVALID_SESSION" });

    return res.json({ ok: true, uid: payload.uid, exp: payload.exp });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: "SERVER_ERROR", detail: err?.message ?? String(err) });
  }
});

/** ===== Logout ===== */
app.post("/auth/logout", (_req, res) => {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true, secure: true, sameSite: "none", path: "/",
  });
  return res.json({ ok: true });
});

/** ===== Payments: aanmaken ===== */
app.post("/payments/create", async (req, res) => {
  try {
    const { uid, email, amountEur, description, redirectUrl } = req.body ?? {};
    if (!isValidUid(uid)) return res.status(400).json({ ok:false, error:"INVALID_UID" });
    if (typeof email !== "string" || !email.includes("@")) return res.status(400).json({ ok:false, error:"INVALID_EMAIL" });

    const apiKey = MOLLIE_API_KEY();
    if (!apiKey) return res.status(500).json({ ok:false, error:"SERVER_MISSING_MOLLIE_KEY" });

    const amountStr = (Number(amountEur) > 0 ? Number(amountEur).toFixed(2) : "1.00");
    const mollieClient = mollie();

    const payment: any = await mollieClient.payments.create({
      amount: { currency: "EUR", value: amountStr },
      description: description || "Zisa PRO toegang",
      redirectUrl: redirectUrl || "https://isabelrockele.github.io/juf_zisa_spelletjesmaker/pro/",
      webhookUrl: `${req.protocol}://${req.get("host")}/payments/webhook`,
      metadata: { uid, email },
    });

    await db.collection("payments").doc(payment.id).set({
      uid, email, status: payment.status, amount: amountStr,
      createdAt: now(), processed: false,
    });

    return res.json({ ok:true, paymentId: payment.id, checkoutUrl: payment?._links?.checkout?.href || null });
  } catch (err:any) {
    return res.status(500).json({ ok:false, error:"SERVER_ERROR", detail: err?.message ?? String(err) });
  }
});

/** ===== Payments: webhook ===== */
app.post("/payments/webhook", express.urlencoded({ extended: false }), async (req, res) => {
  try {
    const paymentId = (req.body?.id || req.query?.id) as string;
    if (!paymentId) return res.status(400).send("missing id");

    const apiKey = MOLLIE_API_KEY();
    if (!apiKey) return res.status(500).send("missing mollie key");

    const mollieClient = mollie();
    const payment: any = await mollieClient.payments.get(paymentId);

    const docRef = db.collection("payments").doc(payment.id);
    const snap = await docRef.get();
    const prev = snap.exists ? (snap.data() as any) : {};

    await docRef.set({ ...(prev||{}), status: payment.status, updatedAt: now() }, { merge: true });

    if ((payment.status === "paid" || payment.status === "authorized") && !prev?.processed) {
      const uid = payment?.metadata?.uid as string;
      const email = payment?.metadata?.email as string;

      if (!isValidUid(uid) || !email) {
        await docRef.set({ ...(prev||{}), processed: true, processError: "missing uid/email" }, { merge: true });
      } else {
        const pepper = OTP_PEPPER();
        if (!pepper) throw new Error("OTP_PEPPER missing");

        // ►►► LICENTIE ACTIVEREN
        await db.collection(LICENSES_COL).doc(uid).set({
          active: true, plan: "pro", paidAt: now()
        }, { merge: true });

        // OTP genereren + versturen
        const code = generateOtp();
        const hash = hashOtp(uid, code, pepper);
        const expiresAt = now() + OTP_TTL_MS();
        await db.collection("otp").doc(uid).set(
          { uid, hash, issuedAt: now(), expiresAt, usedAt: null },
          { merge: true }
        );

        if (!initMailer()) throw new Error("SENDGRID_API_KEY missing");
        await sendOtpEmail(email, code);

        await docRef.set({ ...(prev||{}), processed: true, processedAt: now() }, { merge: true });
      }
    }

    return res.status(200).send("ok");
  } catch (_err:any) {
    return res.status(500).send("error");
  }
});

/** ===== Payments: status ophalen ===== */
app.get("/payments/:id/status", async (req, res) => {
  try {
    const paymentId = req.params.id;
    const apiKey = MOLLIE_API_KEY();
    if (!apiKey) return res.status(500).json({ ok:false, error:"SERVER_MISSING_MOLLIE_KEY" });

    const mollieClient = mollie();
    const payment: any = await mollieClient.payments.get(paymentId);
    return res.json({ ok:true, id: payment.id, status: payment.status });
  } catch (err:any) {
    return res.status(500).json({ ok:false, error:"SERVER_ERROR", detail: err?.message ?? String(err) });
  }
});

export const api = functions.onRequest(
  {
    region: "europe-west1",
    secrets: [
      "OTP_PEPPER",
      "DISPLAY_OTP",
      "OTP_TTL_MS",
      "OTP_MIN_INTERVAL_MS",
      "SESSION_SECRET",
      "SESSION_TTL_MS",
      "MOLLIE_API_KEY",
      "SENDGRID_API_KEY",
      "SENDER_EMAIL",
    ],
  },
  app
);
