/**
 * zisa-spelletjesmaker-pro — API (Gen2, OTP + sessie via cookie OF Bearer token)
 * Endpoints:
 *  - GET  /             : status
 *  - GET  /ping         : test
 *  - POST /otp/request  : { uid }
 *  - POST /otp/verify   : { uid, code } => zet cookie EN return { token }
 *  - GET  /auth/me      : leest cookie OF Authorization: Bearer
 *  - POST /auth/logout  : wist cookie (token moet client-side gewist worden)
 */

import * as functions from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import crypto from "crypto";

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(express.json());

/** ===== CORS ===== */
const ALLOWED_ORIGINS = [
  "https://isabelrockele.github.io",
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  // Voeg hier later bv. "https://jufzisa.be" aan toe
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true
  })
);

app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Credentials", "true");
  // Belangrijk: Authorization toestaan
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  return next();
});

/** ===== Config & helpers ===== */
const num = (v: string | undefined, d: number) => (Number.isFinite(Number(v)) ? Number(v) : d);
const bool = (v: string | undefined, d: boolean) => (v === undefined ? d : String(v).toLowerCase() === "true");

const OTP_TTL_MS = () => num(process.env.OTP_TTL_MS, 5 * 60 * 1000);
const OTP_MIN_INTERVAL_MS = () => num(process.env.OTP_MIN_INTERVAL_MS, 60 * 1000);
const DISPLAY_OTP = () => bool(process.env.DISPLAY_OTP, false);

const OTP_PEPPER = () => String(process.env.OTP_PEPPER ?? "");
const SESSION_SECRET = () => String(process.env.SESSION_SECRET ?? ""); // verplicht via secret
const SESSION_TTL_MS = () => num(process.env.SESSION_TTL_MS, 24 * 60 * 60 * 1000); // 24u

const SESSION_COOKIE_NAME = "zisa_session";

app.use(cookieParser());

function now() { return Date.now(); }
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

/** ===== Testroutes ===== */
app.get("/", (_req, res) =>
  res.json({ ok: true, endpoints: ["/ping", "/otp/request", "/otp/verify", "/auth/me", "/auth/logout"] })
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
      if (nowMs - lastIssuedAt < OTP_MIN_INTERVAL_MS()) {
        const waitMs = OTP_MIN_INTERVAL_MS() - (nowMs - lastIssuedAt);
        return res.status(429).json({ ok: false, error: "TOO_MANY_REQUESTS", retryInMs: waitMs });
      }
    }

    const code = generateOtp();
    const hash = hashOtp(uid, code, pepper);
    const expiresAt = nowMs + OTP_TTL_MS();

    await docRef.set({ uid, hash, issuedAt: nowMs, expiresAt, usedAt: null }, { merge: true });

    const payload: Record<string, any> = { ok: true, requestedAt: nowMs, expiresAt };
    // **Gewijzigd: toon code ook voor isabel-admin**
    if (DISPLAY_OTP() || uid === "isabel-admin") payload.displayCode = code;

    return res.json(payload);
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: "SERVER_ERROR", detail: err?.message ?? String(err) });
  }
});

/** ===== OTP verifiëren ===== */
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

    await docRef.set({ usedAt: nowMs }, { merge: true });

    const exp = nowMs + SESSION_TTL_MS();
    const token = signToken({ uid, exp }, secret);

    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: SESSION_TTL_MS()
    });

    return res.json({ ok: true, token, exp, uid });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: "SERVER_ERROR", detail: err?.message ?? String(err) });
  }
});

/** ===== Auth status ===== */
app.get("/auth/me", (req, res) => {
  try {
    const secret = SESSION_SECRET();
    if (!secret) return res.status(500).json({ ok: false, error: "SERVER_SECRETS_MISSING" });

    let raw = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;

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
    httpOnly: true, secure: true, sameSite: "none", path: "/"
  });
  return res.json({ ok: true });
});

export const api = functions.onRequest(
  {
    region: "europe-west1",
    secrets: ["OTP_PEPPER", "DISPLAY_OTP", "OTP_TTL_MS", "OTP_MIN_INTERVAL_MS", "SESSION_SECRET", "SESSION_TTL_MS"]
  },
  app
);




