import express from "express";
import "dotenv/config";
import { randomUUID } from "crypto";
import mongoose from "mongoose";
import User from "../models/User.js";
import PendingUserRequest from "../models/PendingUserRequest.js";
import Publication from "../models/Publication.js";
import Actualite from "../models/Actualite.js";
import PublicationAccessRequest from "../models/PublicationAccessRequest.js";
import Notification from "../models/Notification.js";
import { getActiveUsersCount, optionalProtect, protect, recordActiveUser, revokeToken } from "../middleware/auth.js";
import { requirePublicationPdfAccess } from "../middleware/publicationAccess.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";
import nodemailer from "nodemailer";
import rateLimit from "express-rate-limit";

const router = express.Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many authentication requests. Please try again later." },
});
const profileUpdateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many profile updates. Please try again later." },
});
const publicationAccessLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many PDF access requests. Please try again later." },
});
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many uploads. Please try again later." },
});

const normalizeText = (value) => String(value || "").trim();
const normalizeEmail = (value) => normalizeText(value).toLowerCase();
const syncPublicationUserProfiles = async (publication) => {
  const publicationId = String(publication._id);
  await User.updateMany(
    { "publications.id": publicationId },
    { $pull: { publications: { id: publicationId } } },
  );
  if (publication.status !== "approved") return;

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
const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production" || process.env.APP_URL?.startsWith("https://") === true,
  sameSite: "strict",
  path: "/",
};
const setAuthCookie = (res, token) => res.cookie("authToken", token, {
  ...authCookieOptions,
  maxAge: 30 * 24 * 60 * 60 * 1000,
});
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const publicAppUrl = (process.env.APP_URL || "http://localhost:5173").replace(/\/$/, "");
const mailTransport = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD
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

const createOpaqueToken = () => crypto.randomBytes(32).toString("hex");
const createVerificationCode = () => String(crypto.randomInt(100000, 1000000));
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const sendEmail = async ({ to, subject, text, html }) => {
  if (!mailTransport || !process.env.SMTP_FROM) {
    throw new Error("Email service is not configured");
  }
  await mailTransport.sendMail({ from: process.env.SMTP_FROM, to, subject, text, html });
};
const sendVerificationEmail = async (user, code) => sendEmail({
  to: user.email,
  subject: "Verify your email address",
  text: `Your verification code is ${code}. It expires in 15 minutes.`,
  html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#172033"><h2>Verify your email address</h2><p>Use the verification code below to activate your account.</p><div style="font-size:32px;font-weight:700;letter-spacing:8px;padding:20px;text-align:center;background:#f1f5f9;border-radius:12px">${code}</div><p>This code expires in 15 minutes. If you did not create this account, you can ignore this email.</p></div>`,
});
const sendPasswordResetEmail = async (user, token) => sendEmail({
  to: user.email,
  subject: "Reset your password",
  text: `Reset your password: ${publicAppUrl}/ResetPassword?token=${token}`,
});
const verifyGoogleCredential = async (credential) => {
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email || !payload.email_verified) throw new Error("Google account could not be verified");
  return payload;
};

const normalizeProfilePayload = (body = {}) => {
  const updates = {};
  const has = (field) => Object.prototype.hasOwnProperty.call(body, field);
  const textFields = ["name", "firstName", "lastName", "titleTag", "location", "summaryText"];
  const largeTextFields = ["avatar", "researchImage"];
  const booleanFields = [];

  for (const field of textFields) {
    if (has(field)) {
      if (typeof body[field] !== "string" || body[field].length > 2000) throw new Error(`Invalid ${field}`);
      if (field === "summaryText" && normalizeText(body[field]).split(/\s+/).filter(Boolean).length > 100) throw new Error("Invalid summaryText");
      updates[field] = normalizeText(body[field]);
    }
  }
  for (const field of largeTextFields) {
    if (has(field)) {
      if (typeof body[field] !== "string" || body[field].length > 3000000) throw new Error(`Invalid ${field}`);
      updates[field] = normalizeText(body[field]);
    }
  }
  for (const field of booleanFields) {
    if (has(field)) {
      if (typeof body[field] !== "boolean") throw new Error(`Invalid ${field}`);
      updates[field] = body[field];
    }
  }

  const normalizeStringList = (field, maxItems = 100) => {
    if (!has(field)) return;
    if (!Array.isArray(body[field]) || body[field].length > maxItems || body[field].some((value) => typeof value !== "string" || value.length > 500)) throw new Error(`Invalid ${field}`);
    updates[field] = body[field].map(normalizeText).filter(Boolean);
  };
  normalizeStringList("researchAxes");
  normalizeStringList("skills");

  const normalizeItems = (field, fields, maxItems = 100) => {
    if (!has(field)) return;
    if (!Array.isArray(body[field]) || body[field].length > maxItems) throw new Error(`Invalid ${field}`);
    updates[field] = body[field].map((value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`Invalid ${field}`);
      return fields.reduce((item, itemField) => {
        if (value[itemField] !== undefined) {
          if (typeof value[itemField] !== "string" || value[itemField].length > 2000) throw new Error(`Invalid ${field}`);
          item[itemField] = normalizeText(value[itemField]);
        }
        return item;
      }, {});
    });
  };
  normalizeItems("education", ["id", "institution", "degree", "field", "period"]);
  normalizeItems("workHistory", ["id", "role", "organization", "period", "description"]);
  normalizeItems("languages", ["id", "name", "level"]);
  normalizeItems("linkedAccounts", ["id", "type", "name", "handle", "meta", "avatar", "url"]);

  if (has("publications")) {
    if (!Array.isArray(body.publications) || body.publications.length > 100) throw new Error("Invalid publications");
    updates.publications = body.publications.map((publication) => {
      if (!publication || typeof publication !== "object" || Array.isArray(publication)) throw new Error("Invalid publications");
      const item = {};
      for (const field of ["id", "title", "status", "image", "journal", "doi", "abstract", "pdfUrl"]) {
        if (publication[field] !== undefined) {
          if (typeof publication[field] !== "string" || publication[field].length > 2000) throw new Error("Invalid publications");
          item[field] = normalizeText(publication[field]);
        }
      }
      if (publication.year !== undefined) {
        if (!Number.isInteger(Number(publication.year)) || Number(publication.year) < 0 || Number(publication.year) > 3000) throw new Error("Invalid publications");
        item.year = Number(publication.year);
      }
      if (publication.citations !== undefined) {
        if (!Number.isInteger(Number(publication.citations)) || Number(publication.citations) < 0) throw new Error("Invalid publications");
        item.citations = Number(publication.citations);
      }
      for (const field of ["authors", "keywords"]) {
        if (publication[field] !== undefined) {
          if (!Array.isArray(publication[field]) || publication[field].length > 100 || publication[field].some((value) => typeof value !== "string" || value.length > 500)) throw new Error("Invalid publications");
          item[field] = publication[field].map(normalizeText).filter(Boolean);
        }
      }
      if (item.status && item.status !== "published") throw new Error("Invalid publications");
      return item;
    });
  }
  return updates;
};

// SignUp
router.post(["/SignUp", "/register"], authLimiter, async (req, res) => {
  const { email, password, firstName, lastName, phoneNumber, country, username, googleCredential } = req.body;

  const normalizedFirstName = normalizeText(firstName);
  const normalizedLastName = normalizeText(lastName);
  const normalizedPhoneNumber = normalizeText(phoneNumber);
  const normalizedCountry = normalizeText(country);
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = normalizeText(password);
  const normalizedUsername = normalizeText(username);
  const normalizedRole = 2;

  try {
    if (!normalizedEmail || (!googleCredential && !normalizedPassword) || !normalizedFirstName || !normalizedLastName || !normalizedPhoneNumber || !normalizedCountry) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }

    let googlePayload = null;
    if (googleCredential) {
      try {
        googlePayload = await verifyGoogleCredential(normalizeText(googleCredential));
      } catch {
        return res.status(401).json({ message: "Google account could not be verified" });
      }
      if (normalizeEmail(googlePayload.email) !== normalizedEmail) {
        return res.status(400).json({ message: "The email must match your Google account" });
      }
    }

    const finalUsername = normalizedUsername || `${normalizedFirstName} ${normalizedLastName}`;
    const userExists = await User.findOne({ $or: [{ email: normalizedEmail }, { username: finalUsername }] });
    if (userExists) {
      if (userExists.email === normalizedEmail) {
        return res.status(400).json({ message: "User already exists" });
      }
      return res.status(400).json({ message: "Username already taken" });
    }

    const user = await User.create({
      username: finalUsername,
      email: normalizedEmail,
      password: normalizedPassword || randomUUID(),
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
      phoneNumber: normalizedPhoneNumber,
      country: normalizedCountry,
      role: normalizedRole,
      emailVerified: Boolean(googlePayload),
      googleId: googlePayload?.sub,
      authProvider: googlePayload ? "google" : "local",
      avatar: googlePayload?.picture || "",
    });

    try {
      await PendingUserRequest.create({
        user: user._id,
        name: `${normalizedFirstName} ${normalizedLastName}`.trim(),
        email: normalizedEmail,
        role: 2,
        status: "pending",
      });
    } catch (pendingErr) {
      await User.findByIdAndDelete(user._id);
      console.error("Failed to create pending user request; rolled back new user", pendingErr);
      return res.status(500).json({ message: "Could not create your access request. Please try again." });
    }

    const verificationCode = createVerificationCode();
    user.emailVerified = false;
    user.emailVerificationCodeHash = hashToken(verificationCode);
    user.emailVerificationCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    try {
      await sendVerificationEmail(user, verificationCode);
    } catch (mailError) {
      await PendingUserRequest.deleteOne({ user: user._id });
      await User.findByIdAndDelete(user._id);
      console.error("Failed to send verification email", mailError);
      return res.status(503).json({ message: "The email provider rejected the SMTP credentials. Check SMTP_USER and use a valid Gmail App Password in SMTP_PASSWORD." });
    }

    res.status(201).json({ message: "Account created. Check your email for the verification code.", email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/verify-email", authLimiter, async (req, res) => {
  const token = normalizeText(req.query.token);
  if (!token) return res.status(400).json({ message: "Verification token is required" });

  const user = await User.findOne({
    emailVerificationTokenHash: hashToken(token),
    emailVerificationExpiresAt: { $gt: new Date() },
  });
  if (!user) return res.status(400).json({ message: "Verification link is invalid or expired" });

  user.emailVerified = true;
  user.emailVerificationTokenHash = "";
  user.emailVerificationExpiresAt = undefined;
  await user.save();
  res.status(200).json({ message: "Email verified successfully" });
});

router.post("/verify-email-code", authLimiter, async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const code = normalizeText(req.body.code);
  if (!email || !/^\d{6}$/.test(code)) return res.status(400).json({ message: "Enter the six-digit verification code" });

  const user = await User.findOne({
    email,
    emailVerificationCodeHash: hashToken(code),
    emailVerificationCodeExpiresAt: { $gt: new Date() },
  });
  if (!user) return res.status(400).json({ message: "Verification code is invalid or expired" });

  user.emailVerified = true;
  user.emailVerificationCodeHash = "";
  user.emailVerificationCodeExpiresAt = undefined;
  await user.save();
  const sessionToken = generateToken(user._id, user.authVersion);
  setAuthCookie(res, sessionToken);
  recordActiveUser(user._id);
  res.status(200).json({
    message: "Email verified successfully",
    user: {
      id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      country: user.country,
      role: user.role,
    },
  });
});

router.post("/resend-verification", authLimiter, async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const genericMessage = "If an account exists, a verification email will be sent shortly.";
  const user = await User.findOne({ email });
  if (!user || user.emailVerified) return res.status(200).json({ message: genericMessage });

  const code = createVerificationCode();
  user.emailVerificationCodeHash = hashToken(code);
  user.emailVerificationCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();
  try {
    await sendVerificationEmail(user, code);
  } catch (error) {
    console.error("Failed to resend verification email", error);
  }
  res.status(200).json({ message: genericMessage });
});

router.post("/forgot-password", authLimiter, async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const genericMessage = "If an account exists, password reset instructions will be sent shortly.";
  const user = await User.findOne({ email });
  if (!user || user.authProvider === "google") return res.status(200).json({ message: genericMessage });

  const token = createOpaqueToken();
  user.passwordResetTokenHash = hashToken(token);
  user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();
  try {
    await sendPasswordResetEmail(user, token);
  } catch (error) {
    console.error("Failed to send password reset email", error);
  }
  res.status(200).json({ message: genericMessage });
});

router.post("/reset-password", authLimiter, async (req, res) => {
  const token = normalizeText(req.body.token);
  const password = normalizeText(req.body.password);
  if (!token || password.length < 10) return res.status(400).json({ message: "A valid token and a password of at least 10 characters are required" });

  const user = await User.findOne({
    passwordResetTokenHash: hashToken(token),
    passwordResetExpiresAt: { $gt: new Date() },
  });
  if (!user) return res.status(400).json({ message: "Reset link is invalid or expired" });

  user.password = password;
  user.authVersion = (user.authVersion || 0) + 1;
  user.passwordResetTokenHash = "";
  user.passwordResetExpiresAt = undefined;
  await user.save();
  res.status(200).json({ message: "Password reset successfully" });
});

// SignIn
router.post(["/SignIn", "/login"], authLimiter, async (req, res) => {
  const normalizedEmail = normalizeEmail(req.body.email);
  const normalizedPassword = normalizeText(req.body.password);

  try {
    if (!normalizedEmail || !normalizedPassword) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }
    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user || !(await user.matchPassword(normalizedPassword))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    if (!user.emailVerified && user.authProvider !== "google") {
      return res.status(403).json({ message: "Please verify your email before signing in" });
    }
    const token = generateToken(user._id, user.authVersion);
    setAuthCookie(res, token);
    recordActiveUser(user._id);
    res.status(200).json({
      id: user._id,
      username: user.username,
      firstname:user.firstName,
      lastname:user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      country: user.country,
      role: user.role,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post("/google/profile", authLimiter, async (req, res) => {
  try {
    const payload = await verifyGoogleCredential(normalizeText(req.body.credential));
    res.status(200).json({ email: normalizeEmail(payload.email), firstName: payload.given_name || "", lastName: payload.family_name || "", name: payload.name || "" });
  } catch {
    res.status(401).json({ message: "Google account could not be verified" });
  }
});

router.post("/google", authLimiter, async (req, res) => {
  try {
    const credential = normalizeText(req.body.credential);
    if (!credential || !process.env.GOOGLE_CLIENT_ID) {
      return res.status(400).json({ message: "Google authentication is not configured" });
    }

    const payload = await verifyGoogleCredential(credential);
    const googleId = payload?.sub;
    const email = normalizeEmail(payload?.email);
    if (!googleId || !email) return res.status(401).json({ message: "Google account could not be verified" });

    const firstName = normalizeText(payload.given_name) || "Google";
    const lastName = normalizeText(payload.family_name) || "User";
    const usernameBase = normalizeText(payload.name) || `${firstName} ${lastName}`;
    let user = await User.findOne({ $or: [{ googleId }, { email }] }).select("+googleId");
    let isNewUser = false;

    if (!user) {
      let username = usernameBase;
      let suffix = 1;
      while (await User.exists({ username })) {
        username = `${usernameBase} ${suffix}`;
        suffix += 1;
      }

      user = await User.create({
        username,
        email,
        password: randomUUID(),
        firstName,
        lastName,
        phoneNumber: "Google account",
        country: "",
        googleId,
        authProvider: "google",
        emailVerified: true,
        role: 2,
      });
      isNewUser = true;

      await PendingUserRequest.create({
        user: user._id,
        name: `${firstName} ${lastName}`.trim(),
        email,
        role: 2,
        status: "pending",
      });
    } else if (!user.googleId || user.authProvider !== "google") {
      user.googleId = googleId;
      user.authProvider = "google";
      user.emailVerified = true;
      if (!user.avatar && payload.picture) user.avatar = payload.picture;
      await user.save();
    }

    const token = generateToken(user._id, user.authVersion);
    setAuthCookie(res, token);
    recordActiveUser(user._id);
    res.status(isNewUser ? 201 : 200).json({
      id: user._id,
      username: user.username,
      firstname: user.firstName,
      lastname: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      country: user.country,
      role: user.role,
    });
  } catch (err) {
    console.error("Google authentication failed", err);
    res.status(401).json({ message: "Google authentication failed" });
  }
});

// Me
router.get("/me", protect, async (req, res) => {
  res.status(200).json(req.user);
});

router.put("/me", protect, profileUpdateLimiter, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { username, phoneNumber, country } = req.body;

    if (typeof username === "string") {
      const normalizedUsername = normalizeText(username);
      if (!normalizedUsername) {
        return res.status(400).json({ message: "Username is required" });
      }

      const existingUser = await User.findOne({ username: normalizedUsername, _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }

      user.username = normalizedUsername;
    }

    if (typeof phoneNumber === "string") {
      user.phoneNumber = normalizeText(phoneNumber);
    }

    if (typeof country === "string") {
      user.country = normalizeText(country);
    }

    if (typeof req.body.researchImage === "string") {
      user.researchImage = normalizeText(req.body.researchImage);
    }

    Object.assign(user, normalizeProfilePayload(req.body));

    await user.save();
    const updatedUser = await User.findById(user._id).select("-password");
    res.status(200).json(updatedUser);
  } catch (err) {
    if (err.message.startsWith("Invalid ")) {
      return res.status(400).json({ message: "Invalid profile data" });
    }
    console.error('Profile update failed', err);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

router.get("/researchers", async (req, res) => {
  try {
    const publicProfileFields = [
      "username", "email", "phoneNumber", "country", "firstName", "lastName", "name", "titleTag", "location", "avatar", "researchImage",
      "summaryText", "researchAxes", "skills", "education", "workHistory", "publications", "languages",
      "role", "createdAt",
    ].join(" ");
    const researchers = await User.find({ role: { $in: [0, 1] }, isDisabled: { $ne: true } })
      .select(publicProfileFields)
      .sort({ createdAt: -1 });
    const researcherIds = researchers.map((researcher) => researcher._id);
    const approvedPublications = await Publication.find({
      $or: [
        { submittedBy: { $in: researcherIds } },
        { "authors.userId": { $in: researcherIds } },
      ],
      status: "approved",
      isDisabled: { $ne: true },
    })
      .select("title journal year keywords submittedBy authors")
      .sort({ createdAt: -1 });
    const publicationsByResearcher = new Map();

    for (const publication of approvedPublications) {
      const publicationData = {
        title: publication.title,
        journal: publication.journal,
        year: publication.year,
        keywords: publication.keywords,
      };
      const linkedResearcherIds = new Set([
        ...(publication.submittedBy ? [String(publication.submittedBy)] : []),
        ...(publication.authors || []).map((author) => String(author.userId || "")).filter(Boolean),
      ]);
      for (const researcherId of linkedResearcherIds) {
        const publications = publicationsByResearcher.get(researcherId) || [];
        publications.push(publicationData);
        publicationsByResearcher.set(researcherId, publications);
      }
    }

    res.status(200).json(researchers.map((researcher) => ({
      ...researcher.toObject(),
      publications: publicationsByResearcher.get(String(researcher._id)) || [],
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load researchers" });
  }
});

router.get("/admin/stats", protect, async (req, res) => {
  if (req.user.role !== 0) {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    const [totalUsers, researchers, visitors, pendingUsers, totalPublications, pendingPublications, approvedPublications, rejectedPublications, totalActualites, pendingActualites, approvedActualites, rejectedActualites] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 1 }),
      User.countDocuments({ role: 2 }),
      PendingUserRequest.countDocuments({ status: "pending" }),
      Publication.countDocuments({ status: { $ne: "deleted" } }),
      Publication.countDocuments({ status: "pending" }),
      Publication.countDocuments({ status: "approved" }),
      Publication.countDocuments({ status: "rejected" }),
      Actualite.countDocuments({ status: { $ne: "deleted" } }),
      Actualite.countDocuments({ status: "pending" }),
      Actualite.countDocuments({ status: "approved" }),
      Actualite.countDocuments({ status: "rejected" }),
    ]);

    res.status(200).json({
      totalUsers,
      researchers,
      visitors,
      onlineUsers: getActiveUsersCount(),
      pendingUsers,
      totalPublications,
      pendingPublications,
      approvedPublications,
      rejectedPublications,
      totalActualites,
      pendingActualites,
      approvedActualites,
      rejectedActualites,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load admin statistics" });
  }
});

router.get("/admin/users", protect, async (req, res) => {
  if (req.user.role !== 0) {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load users" });
  }
});

router.put("/admin/users/:id/disable", protect, async (req, res) => {
  if (req.user.role !== 0) {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isDisabled = true;
    await user.save();
    res.status(200).json({ message: "User disabled successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to disable user" });
  }
});

router.put("/admin/users/:id/restore", protect, async (req, res) => {
  if (req.user.role !== 0) {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isDisabled = false;
    await user.save();
    res.status(200).json({ message: "User restored successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to restore user" });
  }
});

router.put("/admin/users/:id", protect, async (req, res) => {
  if (req.user.role !== 0) {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { username, firstName, lastName, phoneNumber, country, role } = req.body;

    if (typeof username === "string") user.username = normalizeText(username);
    if (typeof firstName === "string") user.firstName = normalizeText(firstName);
    if (typeof lastName === "string") user.lastName = normalizeText(lastName);
    if (typeof phoneNumber === "string") user.phoneNumber = normalizeText(phoneNumber);
    if (typeof country === "string") user.country = normalizeText(country);
    if (typeof role === "number") {
      if (![0, 1, 2].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      user.role = role;
    }

    await user.save();
    res.status(200).json({ message: "User updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update user" });
  }
});

router.get("/admin/publications", protect, async (req, res) => {
  if (req.user.role !== 0) {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    const publications = await Publication.find().sort({ createdAt: -1 }).populate("submittedBy", "username email role");
    res.status(200).json(publications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load publications" });
  }
});

router.put("/admin/publications/:id", protect, async (req, res) => {
  if (req.user.role !== 0) {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    const publication = await Publication.findById(req.params.id);
    if (!publication) {
      return res.status(404).json({ message: "Publication not found" });
    }

    const body = req.body;
    const has = (field) => Object.prototype.hasOwnProperty.call(body, field);
    const editableStringFields = [
      "title", "author", "summary", "abstract", "introduction", "methodology",
      "conclusion", "journal", "doi", "department",
    ];
    const publicationDetailKeys = [
      "conferenceTitle", "conferenceLocation", "country", "pages", "dates", "conferenceSite",
      "volume", "firstPublicationDate", "journalTitle", "journalIssn", "journalQuartile2025",
      "publicationQuartile", "impactFactor2025", "publicationImpactFactor", "indexation",
      "journalSite", "paperLink", "publisher", "publisherLink", "edition", "isbnIssn",
      "publicationDate",
    ];
    const publicationTypes = [
      "Communication", "Article scientifique", "Chapitre d'ouvrage", "Ouvrage scientifique",
    ];
    const publicationStatuses = ["pending", "approved", "rejected"];

    for (const field of editableStringFields) {
      if (!has(field)) continue;
      if (typeof body[field] !== "string") {
        return res.status(400).json({ message: `Invalid ${field}` });
      }
      const value = normalizeText(body[field]);
      if (field === "title" && !value) {
        return res.status(400).json({ message: "Publication title is required" });
      }
      publication[field] = value;
    }

    if (has("authors")) {
      if (!Array.isArray(body.authors) || body.authors.some((author) => (
        typeof author?.name !== "string" ||
        author.userId !== undefined && !mongoose.isValidObjectId(author.userId)
      ))) {
        return res.status(400).json({ message: "Invalid authors" });
      }
      const authorUserIds = [...new Set(body.authors.map((author) => author.userId).filter(Boolean))];
      const existingAuthorIds = authorUserIds.length
        ? await User.distinct("_id", {
          _id: { $in: authorUserIds },
          role: { $in: [0, 1] },
          isDisabled: { $ne: true },
        })
        : [];
      if (existingAuthorIds.length !== authorUserIds.length) {
        return res.status(400).json({ message: "One or more publication authors are not active researchers" });
      }
      publication.authors = body.authors.map((author) => ({
        ...(author.userId ? { userId: author.userId } : {}),
        name: normalizeText(author.name),
      }));
    }

    if (has("keywords")) {
      if (!Array.isArray(body.keywords) || body.keywords.some((keyword) => typeof keyword !== "string")) {
        return res.status(400).json({ message: "Invalid keywords" });
      }
      publication.keywords = body.keywords.map(normalizeText).filter(Boolean);
    }

    for (const field of ["year", "citationsCount", "downloadsCount"]) {
      if (!has(field)) continue;
      const value = body[field] === "" && field === "year" ? undefined : Number(body[field]);
      if (value !== undefined && (!Number.isFinite(value) || value < 0 || (field !== "year" && !Number.isInteger(value)))) {
        return res.status(400).json({ message: `Invalid ${field}` });
      }
      publication[field] = value;
    }

    if (has("type")) {
      if (typeof body.type !== "string" || !publicationTypes.includes(body.type)) {
        return res.status(400).json({ message: "Invalid publication type" });
      }
      publication.type = body.type;
    }

    if (has("status")) {
      if (typeof body.status !== "string" || !publicationStatuses.includes(body.status)) {
        return res.status(400).json({ message: "Invalid publication status" });
      }
      if (publication.status === "deleted") {
        return res.status(409).json({ message: "Deleted publications cannot have their status changed" });
      }
      if (publication.status !== "pending" && body.status === "pending") {
        return res.status(409).json({ message: "Approved or rejected publications cannot return to pending" });
      }
      publication.status = body.status;
    }

    if (has("isPrivate")) {
      if (typeof body.isPrivate !== "boolean") {
        return res.status(400).json({ message: "Invalid privacy setting" });
      }
      publication.isPrivate = body.isPrivate;
    }

    if (has("details")) {
      if (!body.details || typeof body.details !== "object" || Array.isArray(body.details)) {
        return res.status(400).json({ message: "Invalid publication details" });
      }
      const details = {};
      for (const [key, value] of Object.entries(body.details)) {
        if (typeof value !== "string") {
          return res.status(400).json({ message: `Invalid publication detail: ${key}` });
        }
        details[key] = normalizeText(value);
      }
      publication.details = details;
      for (const key of publicationDetailKeys) {
        publication[key] = details[key] || "";
      }
    }

    await publication.save();
    await syncPublicationUserProfiles(publication);
    res.status(200).json({ message: "Publication updated successfully" });
  } catch (err) {
    console.error("Failed to update publication", err);
    res.status(500).json({ message: err.message || "Failed to update publication" });
  }
});

router.put("/admin/publications/:id/disable", protect, async (req, res) => {
  if (req.user.role !== 0) {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    const publication = await Publication.findById(req.params.id);
    if (!publication) {
      return res.status(404).json({ message: "Publication not found" });
    }

    publication.isDisabled = true;
    await publication.save();
    res.status(200).json({ message: "Publication disabled successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to disable publication" });
  }
});

router.put("/admin/publications/:id/restore", protect, async (req, res) => {
  if (req.user.role !== 0) {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    const publication = await Publication.findById(req.params.id);
    if (!publication) {
      return res.status(404).json({ message: "Publication not found" });
    }

    publication.isDisabled = false;
    await publication.save();
    res.status(200).json({ message: "Publication restored successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to restore publication" });
  }
});

// Logout
router.post("/logout", protect, async (req, res) => {
  if (req.token) {
    await revokeToken(req.token);
  }

  res.clearCookie("authToken", authCookieOptions);
  res.status(200).json({ message: "Logged out successfully" });
});

router.get("/admin/pending-users", protect, async (req, res) => {
  if (req.user.role !== 0) {
    return res.status(403).json({ message: "Admin access required" });
  }

  const requests = await PendingUserRequest.find({ status: "pending" }).sort({ createdAt: -1 }).populate("user");
  res.status(200).json(requests);
});

router.post("/admin/pending-users/:id/approve", protect, async (req, res) => {
  if (req.user.role !== 0) {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    const request = await PendingUserRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status !== "pending") {
      return res.status(409).json({ message: `Request already ${request.status}` });
    }

    const user = await User.findById(request.user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = request.role === 0 ? 0 : 1;
    await user.save();
    request.status = "approved";
    await request.save();

    res.status(200).json({ message: "User approved as researcher" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to approve user" });
  }
});

router.post("/admin/pending-users/:id/reject", protect, async (req, res) => {
  if (req.user.role !== 0) {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    const request = await PendingUserRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status !== "pending") {
      return res.status(409).json({ message: `Request already ${request.status}` });
    }

    request.status = "rejected";
    await request.save();

    res.status(200).json({ message: "User request rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to reject user" });
  }
});

router.get("/admin/pending-publications", protect, async (req, res) => {
  if (req.user.role !== 0) {
    return res.status(403).json({ message: "Admin access required" });
  }

  const publications = await Publication.find({ status: "pending" }).sort({ createdAt: -1 });
  res.status(200).json(publications);
});

router.post("/admin/pending-publications/:id/approve", protect, async (req, res) => {
  if (req.user.role !== 0) {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    const publication = await Publication.findById(req.params.id);
    if (!publication) {
      return res.status(404).json({ message: "Publication not found" });
    }

    if (publication.status !== "pending") {
      return res.status(409).json({ message: `Publication already ${publication.status}` });
    }

    publication.status = "approved";
    await publication.save();
    await syncPublicationUserProfiles(publication);

    res.status(200).json({ message: "Publication approved", publication });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to approve publication" });
  }
});

router.post("/admin/pending-publications/:id/reject", protect, async (req, res) => {
  if (req.user.role !== 0) {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    const publication = await Publication.findById(req.params.id);
    if (!publication) {
      return res.status(404).json({ message: "Publication not found" });
    }

    if (publication.status !== "pending") {
      return res.status(409).json({ message: `Publication already ${publication.status}` });
    }

    publication.status = "rejected";
    await publication.save();

    res.status(200).json({ message: "Publication rejected", publication });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to reject publication" });
  }
});

// Setup multer for PDF uploads
const uploadsDir = path.join(process.cwd(), 'Backend', 'uploads');
const actualiteUploadsDir = path.join(uploadsDir, 'actualites');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(actualiteUploadsDir)) fs.mkdirSync(actualiteUploadsDir, { recursive: true });
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const unique = `${crypto.randomUUID()}.pdf`;
    cb(null, unique);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
  if (file.mimetype !== 'application/pdf') return cb(new Error('Only PDF allowed'));
  cb(null, true);
  },
});
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, actualiteUploadsDir);
  },
  filename: function (req, file, cb) {
    const extension = { "image/jpeg": ".jpg", "image/jpg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif" }[file.mimetype];
    const unique = `${crypto.randomUUID()}${extension}`;
    cb(null, unique);
  }
});
const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];
    if (!allowed.includes(file.mimetype)) return cb(new Error('Only image files are allowed'));
    cb(null, true);
  },
});

const requireMemberOrAdmin = (req, res, next) => {
  if (req.user.role !== 0 && req.user.role !== 1) {
    return res.status(403).json({ message: 'Only admins and members can submit content' });
  }
  return next();
};

const validateUploadSignature = (kind) => async (req, res, next) => {
  if (!req.file) return next();

  let header;
  try {
    const handle = await fs.promises.open(req.file.path, "r");
    try {
      header = Buffer.alloc(12);
      await handle.read(header, 0, header.length, 0);
    } finally {
      await handle.close();
    }
  } catch (error) {
    console.error("Failed to validate uploaded file", error);
    return res.status(500).json({ message: "Could not validate uploaded file" });
  }

  const isPdf = req.file.mimetype === "application/pdf" && header.subarray(0, 5).toString() === "%PDF-";
  const isPng = header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  const isGif = header.subarray(0, 6).toString() === "GIF87a" || header.subarray(0, 6).toString() === "GIF89a";
  const isWebp = header.subarray(0, 4).toString() === "RIFF" && header.subarray(8, 12).toString() === "WEBP";
  const valid = kind === "pdf"
    ? isPdf
    : (req.file.mimetype === "image/png" && isPng)
      || ((req.file.mimetype === "image/jpeg" || req.file.mimetype === "image/jpg") && isJpeg)
      || (req.file.mimetype === "image/gif" && isGif)
      || (req.file.mimetype === "image/webp" && isWebp);

  if (!valid) {
    try {
      await fs.promises.unlink(req.file.path);
    } catch (error) {
      console.error("Failed to remove invalid uploaded file", error);
      return res.status(500).json({ message: "Could not remove invalid uploaded file" });
    }
    return res.status(400).json({ message: "Uploaded file content does not match an allowed file type" });
  }

  return next();
};

router.post('/publications', protect, requireMemberOrAdmin, uploadLimiter, upload.single('pdf'), validateUploadSignature("pdf"), async (req, res) => {
  try {
    const title = normalizeText(req.body.title);
    const type = normalizeText(req.body.type);
    const yearValue = Number(req.body.year);
    const authorText = normalizeText(req.body.author);
    const journal = normalizeText(req.body.journal);
    const abstract = normalizeText(req.body.abstract || req.body.summary);
    const introduction = normalizeText(req.body.introduction);
    const methodology = normalizeText(req.body.methodology);
    const conclusion = normalizeText(req.body.conclusion);
    const department = normalizeText(req.body.department);
    const isPrivate = req.body.isPrivate === 'true' || req.body.isPrivate === true;
    let details = {};
    if (typeof req.body.details === 'string') {
      try {
        const parsedDetails = JSON.parse(req.body.details);
        if (parsedDetails && typeof parsedDetails === 'object' && !Array.isArray(parsedDetails)) {
          details = Object.fromEntries(
            Object.entries(parsedDetails).map(([key, value]) => [key, normalizeText(value)])
          );
        }
      } catch {
        details = {};
      }
    }

    if (!title) return res.status(400).json({ message: 'Publication title is required' });
    if (!type) return res.status(400).json({ message: 'Publication type is required' });
    if (!req.file) return res.status(400).json({ message: 'PDF file is required' });
    if (!Number.isFinite(yearValue)) return res.status(400).json({ message: 'Publication year is required' });

    let keywords = [];
    const rawKeywords = req.body.keywords;
    if (typeof rawKeywords === 'string') {
      try {
        const parsedKeywords = JSON.parse(rawKeywords);
        keywords = Array.isArray(parsedKeywords)
          ? parsedKeywords.map((item) => normalizeText(item)).filter(Boolean)
          : [];
      } catch {
        keywords = rawKeywords
          .split(',')
          .map((item) => normalizeText(item))
          .filter(Boolean);
      }
    } else if (Array.isArray(rawKeywords)) {
      keywords = rawKeywords.map((item) => normalizeText(item)).filter(Boolean);
    }

    let authorsInput = [];
    const rawAuthors = req.body.authors;

    if (typeof rawAuthors === 'string') {
      try {
        const parsedAuthors = JSON.parse(rawAuthors);
        if (Array.isArray(parsedAuthors)) {
          authorsInput = parsedAuthors;
        } else {
          return res.status(400).json({ message: 'Invalid publication authors' });
        }
      } catch (error) {
        console.error('Failed to parse submitted publication authors', error);
        return res.status(400).json({ message: 'Invalid publication authors' });
      }
    } else if (Array.isArray(rawAuthors)) {
      authorsInput = rawAuthors;
    }

    if (authorsInput.some((author) => (
      typeof author === 'string'
        ? !normalizeText(author)
        : !author || typeof author.name !== 'string' ||
          author.userId !== undefined && !mongoose.isValidObjectId(author.userId)
    ))) {
      return res.status(400).json({ message: 'Invalid publication authors' });
    }
    const authorUserIds = [...new Set(authorsInput.map((author) => typeof author === 'string' ? null : author.userId).filter(Boolean))];
    const existingAuthorIds = authorUserIds.length
      ? await User.distinct("_id", { _id: { $in: authorUserIds }, role: { $in: [0, 1] }, isDisabled: { $ne: true } })
      : [];
    if (existingAuthorIds.length !== authorUserIds.length) {
      return res.status(400).json({ message: 'One or more publication authors are not active researchers' });
    }
    const authors = authorsInput
      .map((author) => typeof author === 'string'
        ? { name: normalizeText(author) }
        : {
          ...(author.userId ? { userId: author.userId } : {}),
          name: normalizeText(author.name),
        })
      .filter((author) => author.name);
    const submitterId = String(req.user._id);
    if (!authors.some((author) => String(author.userId || '') === submitterId)) {
      authors.unshift({
        userId: req.user._id,
        name: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.username,
      });
    }

    const citationsCount = Number(req.body.citationsCount || 0);
    const doi = normalizeText(req.body.doi);
    const authorDisplay = authorText || authors.map((item) => item.name).join(', ');
    const publicationDetailKeys = [
      'conferenceTitle', 'conferenceLocation', 'country', 'pages', 'dates', 'conferenceSite',
      'volume', 'firstPublicationDate', 'journalTitle', 'journalIssn', 'journalQuartile2025',
      'publicationQuartile', 'impactFactor2025', 'publicationImpactFactor', 'indexation',
      'journalSite', 'paperLink', 'publisher', 'publisherLink', 'edition', 'isbnIssn',
      'publicationDate',
    ];
    const explicitDetails = Object.fromEntries(
      publicationDetailKeys.map((key) => [key, details[key] || ''])
    );

    const publication = await Publication.create({
      title,
      author: authorDisplay,
      authors,
      summary: abstract,
      abstract,
      introduction,
      methodology,
      conclusion,
      journal,
      keywords,
      citationsCount,
      doi,
      department,
      submittedBy: req.user._id,
      isPrivate,
      status: 'pending',
      pdfPath: path.relative(process.cwd(), req.file.path),
      year: yearValue,
      type,
      details,
      ...explicitDetails,
    });

    res.status(201).json(publication);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to submit publication' });
  }
});

// Public endpoint to list approved publications
router.get('/publications', async (req, res) => {
  try {
    const publications = await Publication.find({
      status: 'approved',
      isDisabled: { $ne: true },
    }).sort({ createdAt: -1 });
    res.status(200).json(publications.map((publication) => {
      const publicPublication = publication.toObject();
      const hasPdf = Boolean(publication.pdfPath);
      delete publicPublication.pdfPath;
      delete publicPublication.pdfAccessUsers;
      delete publicPublication.deletedBy;
      delete publicPublication.deletedAt;
      return { ...publicPublication, hasPdf };
    }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch publications' });
  }
});

router.post('/publications/:id/access-request', publicationAccessLimiter, protect, async (req, res) => {
  try {
    const publication = await Publication.findOne({
      _id: req.params.id,
      status: 'approved',
      isPrivate: true,
    });

    if (!publication) return res.status(404).json({ message: 'Publication privée introuvable' });
    if (!publication.submittedBy) return res.status(409).json({ message: 'Cette publication ne possède pas d’auteur responsable' });
    const requesterId = String(req.user._id);
    const isAuthor = String(publication.submittedBy) === requesterId
      || publication.authors?.some((author) => String(author.userId || "") === requesterId);
    if (isAuthor) {
      return res.status(400).json({ message: 'Vous êtes déjà l’auteur de cette publication' });
    }

    const existingRequest = await PublicationAccessRequest.findOne({
      publication: publication._id,
      requester: req.user._id,
    });
    if (existingRequest?.status === 'approved') {
      return res.status(409).json({ message: `Demande déjà ${existingRequest.status === 'pending' ? 'en attente' : existingRequest.status === 'approved' ? 'approuvée' : 'refusée'}`, request: existingRequest });
    }

    const accessRequest = existingRequest || await PublicationAccessRequest.create({
      publication: publication._id,
      requester: req.user._id,
      author: publication.submittedBy,
    });
    if (existingRequest) {
      existingRequest.status = 'pending';
      await existingRequest.save();
    }
    const requesterName = [req.user.firstName, req.user.lastName].filter(Boolean).join(' ').trim() || req.user.username;
    await Notification.create({
      recipient: publication.submittedBy,
      type: 'publication_access_request',
      accessRequest: accessRequest._id,
      message: `${requesterName} demande l’accès au PDF « ${publication.title} »`,
    });

    res.status(201).json({ message: 'Demande d’accès envoyée', request: accessRequest });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ message: 'Une demande existe déjà pour cette publication' });
    console.error('Failed to create publication access request', err);
    res.status(500).json({ message: 'Impossible d’envoyer la demande d’accès' });
  }
});

router.get('/publications/:id/access-status', protect, async (req, res) => {
  try {
    const publication = await Publication.findOne({ _id: req.params.id, status: 'approved' }).select('isPrivate submittedBy authors.userId pdfAccessUsers');
    if (!publication) return res.status(404).json({ message: 'Publication introuvable' });

    const requesterId = String(req.user._id);
    const isAuthor = String(publication.submittedBy || '') === requesterId
      || publication.authors?.some((author) => String(author.userId || '') === requesterId);
    const hasAccess = isAuthor
      || Number(req.user.role) === 0
      || publication.pdfAccessUsers?.some((userId) => String(userId) === String(req.user._id));
    const request = await PublicationAccessRequest.findOne({ publication: publication._id, requester: req.user._id }).select('status');

    res.status(200).json({
      isPrivate: Boolean(publication.isPrivate),
      hasAccess: Boolean(hasAccess),
      requestStatus: request?.status || null,
    });
  } catch (err) {
    console.error('Failed to load publication access status', err);
    res.status(500).json({ message: 'Impossible de vérifier l’accès au PDF' });
  }
});

router.get('/notifications', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate({
        path: 'accessRequest',
        populate: [
          { path: 'publication', select: 'title isPrivate' },
          { path: 'requester', select: 'username firstName lastName' },
        ],
      });
    res.status(200).json(notifications);
  } catch (err) {
    console.error('Failed to load notifications', err);
    res.status(500).json({ message: 'Impossible de charger les notifications' });
  }
});

router.patch('/notifications/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { readAt: new Date() },
      { new: true },
    );
    if (!notification) return res.status(404).json({ message: 'Notification introuvable' });
    res.status(200).json(notification);
  } catch (err) {
    console.error('Failed to mark notification as read', err);
    res.status(500).json({ message: 'Impossible de mettre à jour la notification' });
  }
});

router.post('/publication-access-requests/:id/decision', protect, async (req, res) => {
  const decision = normalizeText(req.body.decision);
  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ message: 'Décision invalide' });
  }

  try {
    const accessRequest = await PublicationAccessRequest.findOne({
      _id: req.params.id,
      author: req.user._id,
    }).populate('publication', 'title');
    if (!accessRequest) return res.status(404).json({ message: 'Demande d’accès introuvable' });
    if (accessRequest.status !== 'pending') return res.status(409).json({ message: `Demande déjà ${accessRequest.status}` });

    accessRequest.status = decision;
    await accessRequest.save();
    if (decision === 'approved') {
      await Publication.updateOne(
        { _id: accessRequest.publication._id },
        { $addToSet: { pdfAccessUsers: accessRequest.requester } },
      );
    }
    await Notification.updateMany(
      { recipient: req.user._id, accessRequest: accessRequest._id, type: 'publication_access_request' },
      { readAt: new Date() },
    );

    await Notification.create({
      recipient: accessRequest.requester,
      type: 'publication_access_decision',
      accessRequest: accessRequest._id,
      message: `Votre demande d’accès au PDF « ${accessRequest.publication.title} » a été ${decision === 'approved' ? 'acceptée' : 'refusée'}`,
    });

    res.status(200).json({ message: 'Décision enregistrée', request: accessRequest });
  } catch (err) {
    console.error('Failed to decide publication access request', err);
    res.status(500).json({ message: 'Impossible d’enregistrer la décision' });
  }
});

// Actualites endpoints
router.get('/actualites', async (_req, res) => {
  try {
    const actualites = await Actualite.find({ status: 'approved' }).sort({ createdAt: -1 });
    res.status(200).json(actualites);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch actualites' });
  }
});

router.post('/actualites', protect, requireMemberOrAdmin, uploadLimiter, imageUpload.single('image'), validateUploadSignature("image"), async (req, res) => {
  try {
    const title = normalizeText(req.body.title);
    const category = normalizeText(req.body.category);
    const date = normalizeText(req.body.date);
    const author = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.username || req.user.email;
    const readTime = normalizeText(req.body.readTime);
    const excerpt = normalizeText(req.body.excerpt);
    const content = normalizeText(req.body.content);
    const isImportant = req.body.isImportant === 'true' || req.body.isImportant === true;
    const uploadedImageUrl = req.file ? `/uploads/actualites/${req.file.filename}` : normalizeText(req.body.imageUrl);

    if (!title) return res.status(400).json({ message: 'Actualite title is required' });
    if (!category) return res.status(400).json({ message: 'Actualite category is required' });
    if (!content) return res.status(400).json({ message: 'Actualite content is required' });

    const actualite = await Actualite.create({
      title,
      category,
      date: date || new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
      author,
      readTime: readTime || '3 min',
      excerpt: excerpt || content.slice(0, 180),
      content,
      imageUrl: uploadedImageUrl || '',
      isImportant,
      submittedBy: req.user._id,
      status: 'pending',
    });

    res.status(201).json(actualite);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to submit actualite' });
  }
});

router.get('/admin/pending-actualites', protect, async (req, res) => {
  if (req.user.role !== 0) {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const actualites = await Actualite.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.status(200).json(actualites);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch pending actualites' });
  }
});

router.get('/admin/actualites', protect, async (req, res) => {
  if (req.user.role !== 0) {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const actualites = await Actualite.find({ status: { $ne: 'deleted' } }).sort({ createdAt: -1 });
    res.status(200).json(actualites);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch actualites' });
  }
});

router.put('/admin/actualites/:id', protect, async (req, res) => {
  if (req.user.role !== 0) {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const actualite = await Actualite.findById(req.params.id);
    if (!actualite) {
      return res.status(404).json({ message: 'Actualite not found' });
    }

    const { title, category, date, author, readTime, excerpt, content, status, isImportant } = req.body;
    const allowedCategories = ['Événement', 'Découverte', 'Distinction', 'Partenariat', 'Conférence'];

    if (typeof title === 'string' && normalizeText(title)) actualite.title = normalizeText(title);
    if (typeof category === 'string' && allowedCategories.includes(category)) actualite.category = category;
    if (typeof date === 'string') actualite.date = normalizeText(date);
    if (typeof author === 'string' && normalizeText(author)) actualite.author = normalizeText(author);
    if (typeof readTime === 'string') actualite.readTime = normalizeText(readTime);
    if (typeof excerpt === 'string') actualite.excerpt = normalizeText(excerpt);
    if (typeof content === 'string' && normalizeText(content)) actualite.content = normalizeText(content);
    if (typeof status === 'string' && ['pending', 'approved', 'rejected'].includes(status)) actualite.status = status;
    if (typeof isImportant === 'boolean') actualite.isImportant = isImportant;

    await actualite.save();
    res.status(200).json({ message: 'Actualite updated successfully', actualite });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Failed to update actualite' });
  }
});

router.post('/admin/pending-actualites/:id/:decision', protect, async (req, res) => {
  if (req.user.role !== 0) {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const { decision } = req.params;
  if (decision !== 'approve' && decision !== 'reject') {
    return res.status(400).json({ message: 'Invalid actualite decision' });
  }

  try {
    const actualite = await Actualite.findById(req.params.id);
    if (!actualite) {
      return res.status(404).json({ message: 'Actualite not found' });
    }

    if (actualite.status === 'deleted' || actualite.status === 'approved' && decision === 'approve' || actualite.status === 'rejected' && decision === 'reject') {
      return res.status(409).json({ message: `Actualite already ${actualite.status}` });
    }

    actualite.status = decision === 'approve' ? 'approved' : 'rejected';
    await actualite.save();

    res.status(200).json({ message: `Actualite ${decision === 'approve' ? 'approved' : 'rejected'}`, actualite });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: `Failed to ${decision} actualite` });
  }
});

// Serve PDF for a publication
router.get('/publications/:id/pdf', optionalProtect, requirePublicationPdfAccess, async (req, res) => {
  try {
    const publication = req.publication;

    if (!publication.pdfPath) {
      return res.status(404).json({ message: 'PDF not found' });
    }

    const fullPath = path.isAbsolute(publication.pdfPath)
      ? publication.pdfPath
      : path.join(process.cwd(), publication.pdfPath);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: 'File missing on server' });
    }

    await Publication.updateOne({ _id: publication._id }, { $inc: { downloadsCount: 1 } });

    return res.sendFile(fullPath);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to serve PDF' });
  }
});

// Delete a publication (admin only)
router.delete('/publications/:id', protect, async (req, res) => {
  console.log('DELETE /publications/:id called', { id: req.params.id, user: req.user?._id?.toString(), role: req.user?.role });
  if (req.user.role !== 0) {
    console.warn('Delete denied: not admin', req.user.role);
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const publication = await Publication.findById(req.params.id);
    if (!publication) {
      console.warn('Publication not found', req.params.id);
      return res.status(404).json({ message: 'Publication not found' });
    }

    publication.status = 'deleted';
    await publication.save();

    res.status(200).json({ message: 'Publication deleted' });
  } catch (err) {
    console.error('Failed to delete publication:', err.message || err);
    res.status(500).json({ message: 'Failed to delete publication', error: err.message || String(err) });
  }
});

// Generate JWT token
const generateToken = (id, authVersion) => {
  return jwt.sign({ id, jti: randomUUID(), ver: authVersion ?? 0 }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

export default router;
