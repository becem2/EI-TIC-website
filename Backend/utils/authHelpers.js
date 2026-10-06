import "dotenv/config";
import crypto from "crypto";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";
import rateLimit from "express-rate-limit";
import User from "../models/User.js";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Trop de requêtes d’authentification. Veuillez réessayer plus tard." },
});

export const profileUpdateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Trop de mises à jour de profil. Veuillez réessayer plus tard." },
});

export const publicationAccessLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Trop de demandes d’accès PDF. Veuillez réessayer plus tard." },
});

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Trop de téléversements. Veuillez réessayer plus tard." },
});

export const normalizeText = (value) => String(value || "").trim();
export const normalizeEmail = (value) => normalizeText(value).toLowerCase();

export const syncPublicationUserProfiles = async (publication) => {
  const publicationId = String(publication._id);
  await User.updateMany(
    { "publications.id": publicationId },
    { $pull: { publications: { id: publicationId } } },
  );

  if (publication.status !== "approved" || publication.isDisabled) return;

  const linkedUserIds = new Set([
    ...(publication.submittedBy ? [String(publication.submittedBy)] : []),
    ...(publication.authors || []).map((author) => String(author.userId || "")).filter(Boolean),
  ]);

  const publicationSummary = {
    id: publicationId,
    title: publication.title,
    status: "published",
    journal: publication.journal,
    year: publication.year,
    citations: publication.citationsCount,
    doi: publication.doi,
    abstract: publication.abstract || publication.summary,
    authors: (publication.authors || []).map((author) => author.name).filter(Boolean),
    linkedAuthors: (publication.authors || [])
      .filter((author) => author.userId)
      .map((author) => ({ userId: author.userId, name: author.name })),
    authorUserIds: [...linkedUserIds],
    keywords: publication.keywords || [],
    pdfUrl: `/api/users/publications/${publicationId}/pdf`,
  };

  await Promise.all([...linkedUserIds].map((userId) => User.updateOne(
    { _id: userId },
    { $addToSet: { publications: publicationSummary } },
  )));
};

export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production" || process.env.APP_URL?.startsWith("https://") === true,
  sameSite: "strict",
  path: "/",
};

export const setAuthCookie = (res, token) => res.cookie("authToken", token, {
  ...authCookieOptions,
  maxAge: 30 * 24 * 60 * 60 * 1000,
});

export const clearAuthCookie = (res) => res.clearCookie("authToken", authCookieOptions);

export const generateToken = (id, authVersion) => {
  return jwt.sign(
    { id, jti: randomUUID(), ver: authVersion ?? 0 },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

export const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
export const publicAppUrl = (process.env.APP_URL || "http://localhost:5173").replace(/\/$/, "");

export const mailTransport = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
      auth: {
        user: process.env.SMTP_USER.trim(),
        pass: process.env.SMTP_PASSWORD.replace(/\s/g, ""),
      },
    })
  : null;

export const createOpaqueToken = () => crypto.randomBytes(32).toString("hex");
export const createVerificationCode = () => String(crypto.randomInt(100000, 1000000));
export const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

export const sendEmail = async ({ to, subject, text, html }) => {
  if (!mailTransport || !process.env.SMTP_FROM) {
    throw new Error("Email service is not configured");
  }
  await mailTransport.sendMail({ from: process.env.SMTP_FROM, to, subject, text, html });
};

export const sendVerificationEmail = async (user, code) => sendEmail({
  to: user.email,
  subject: "Vérification de votre compte - Laboratoire EI&TIC",
  text: `Votre code de vérification est ${code}. Il expire dans 15 minutes.`,
  html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#172033"><h2>Vérification de votre compte</h2><p>Utilisez le code ci-dessous pour activer votre compte laboratoire.</p><div style="font-size:32px;font-weight:700;letter-spacing:8px;padding:20px;text-align:center;background:#f1f5f9;border-radius:12px">${code}</div><p>Ce code expire dans 15 minutes.</p></div>`,
});

export const sendPasswordResetEmail = async (user, token) => sendEmail({
  to: user.email,
  subject: "Réinitialisation de votre mot de passe",
  text: `Réinitialisez votre mot de passe: ${publicAppUrl}/ResetPassword?token=${token}`,
});

export const verifyGoogleCredential = async (credential) => {
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email || !payload.email_verified) throw new Error("Google account could not be verified");
  return payload;
};

export const requireMemberOrAdmin = (req, res, next) => {
  if (req.user?.role !== 0 && req.user?.role !== 1) {
    return res.status(403).json({ message: "Seuls les membres et administrateurs peuvent soumettre du contenu." });
  }
  return next();
};

export const requireAdmin = (req, res, next) => {
  if (Number(req.user?.role) !== 0) {
    return res.status(403).json({ message: "Accès administrateur requis." });
  }
  return next();
};
