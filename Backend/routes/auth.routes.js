import express from "express";
import crypto from "crypto";
import { randomUUID } from "crypto";
import User from "../models/User.js";
import PendingUserRequest from "../models/PendingUserRequest.js";
import { protect, recordActiveUser, revokeToken } from "../middleware/auth.js";
import {
  authLimiter,
  normalizeEmail,
  normalizeText,
  createOpaqueToken,
  createVerificationCode,
  hashToken,
  sendVerificationEmail,
  sendPasswordResetEmail,
  verifyGoogleCredential,
  generateToken,
  setAuthCookie,
  clearAuthCookie,
} from "../utils/authHelpers.js";

const router = express.Router();

// Register / SignUp
router.post(["/register", "/SignUp"], authLimiter, async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phoneNumber, country, username, googleCredential } = req.body;

    const normalizedFirstName = normalizeText(firstName);
    const normalizedLastName = normalizeText(lastName);
    const normalizedPhoneNumber = normalizeText(phoneNumber);
    const normalizedCountry = normalizeText(country);
    const normalizedEmail = normalizeEmail(email);
    const normalizedPassword = normalizeText(password);
    const normalizedUsername = normalizeText(username);
    const normalizedRole = 2; // Default to Visitor until approved

    if (!normalizedEmail || (!googleCredential && !normalizedPassword) || !normalizedFirstName || !normalizedLastName || !normalizedPhoneNumber || !normalizedCountry) {
      return res.status(400).json({ message: "Veuillez remplir tous les champs obligatoires." });
    }

    let googlePayload = null;
    if (googleCredential) {
      try {
        googlePayload = await verifyGoogleCredential(normalizeText(googleCredential));
      } catch {
        return res.status(401).json({ message: "Le compte Google n’a pas pu être vérifié." });
      }
      if (normalizeEmail(googlePayload.email) !== normalizedEmail) {
        return res.status(400).json({ message: "L'e-mail doit correspondre à votre compte Google." });
      }
    }

    // Auto-resolve non-colliding username if not explicitly specified
    let finalUsername = normalizedUsername || `${normalizedFirstName} ${normalizedLastName}`.trim();
    if (!normalizedUsername) {
      let candidate = finalUsername;
      let suffix = 1;
      while (await User.exists({ username: candidate })) {
        candidate = `${finalUsername} ${suffix}`;
        suffix += 1;
      }
      finalUsername = candidate;
    } else {
      const existingUser = await User.findOne({ username: finalUsername });
      if (existingUser) {
        return res.status(400).json({ message: "Ce nom d'utilisateur est déjà utilisé." });
      }
    }

    const emailExists = await User.findOne({ email: normalizedEmail });
    if (emailExists) {
      return res.status(400).json({ message: "Un compte avec cette adresse e-mail existe déjà." });
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
      return res.status(500).json({ message: "Impossible d’enregistrer votre demande d’accès. Veuillez réessayer." });
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
      return res.status(503).json({ message: "Impossible d’envoyer l’e-mail de confirmation. Veuillez contacter le laboratoire." });
    }

    res.status(201).json({ message: "Compte créé. Vérifiez votre boîte e-mail pour obtenir votre code d’activation.", email: user.email });
  } catch (err) {
    next(err);
  }
});

// Verify email with token
router.get("/verify-email", authLimiter, async (req, res, next) => {
  try {
    const token = normalizeText(req.query.token);
    if (!token) return res.status(400).json({ message: "Le jeton de vérification est requis." });

    const user = await User.findOne({
      emailVerificationTokenHash: hashToken(token),
      emailVerificationExpiresAt: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ message: "Le lien de vérification est invalide ou expiré." });

    user.emailVerified = true;
    user.emailVerificationTokenHash = "";
    user.emailVerificationExpiresAt = undefined;
    await user.save();
    res.status(200).json({ message: "Adresse e-mail vérifiée avec succès." });
  } catch (err) {
    next(err);
  }
});

// Verify email with 6-digit code
router.post("/verify-email-code", authLimiter, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const code = normalizeText(req.body.code);
    if (!email || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ message: "Veuillez saisir le code de vérification à 6 chiffres." });
    }

    const user = await User.findOne({
      email,
      emailVerificationCodeHash: hashToken(code),
      emailVerificationCodeExpiresAt: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ message: "Code de vérification invalide ou expiré." });

    user.emailVerified = true;
    user.emailVerificationCodeHash = "";
    user.emailVerificationCodeExpiresAt = undefined;
    await user.save();

    const sessionToken = generateToken(user._id, user.authVersion);
    setAuthCookie(res, sessionToken);
    recordActiveUser(user._id);

    res.status(200).json({
      message: "Adresse e-mail vérifiée avec succès.",
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
  } catch (err) {
    next(err);
  }
});

// Resend verification
router.post("/resend-verification", authLimiter, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const genericMessage = "Si un compte existe, un nouveau code vous sera envoyé sous peu.";
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
  } catch (err) {
    next(err);
  }
});

// Forgot password
router.post("/forgot-password", authLimiter, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const genericMessage = "Si un compte existe, les instructions de réinitialisation vous ont été envoyées.";
    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ message: genericMessage });

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
  } catch (err) {
    next(err);
  }
});

// Reset password
router.post("/reset-password", authLimiter, async (req, res, next) => {
  try {
    const token = normalizeText(req.body.token);
    const password = normalizeText(req.body.password);
    if (!token || password.length < 8) {
      return res.status(400).json({ message: "Un jeton valide et un mot de passe d’au moins 8 caractères sont requis." });
    }

    const user = await User.findOne({
      passwordResetTokenHash: hashToken(token),
      passwordResetExpiresAt: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ message: "Le lien de réinitialisation est invalide ou expiré." });

    user.password = password;
    user.authVersion = (user.authVersion || 0) + 1;
    user.passwordResetTokenHash = "";
    user.passwordResetExpiresAt = undefined;
    await user.save();

    res.status(200).json({ message: "Mot de passe réinitialisé avec succès." });
  } catch (err) {
    next(err);
  }
});

// Login / SignIn
router.post(["/login", "/SignIn"], authLimiter, async (req, res, next) => {
  try {
    const normalizedEmail = normalizeEmail(req.body.email);
    const normalizedPassword = normalizeText(req.body.password);

    if (!normalizedEmail || !normalizedPassword) {
      return res.status(400).json({ message: "Veuillez remplir tous les champs." });
    }

    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user || !(await user.matchPassword(normalizedPassword))) {
      return res.status(401).json({ message: "Identifiants invalides." });
    }

    if (!user.emailVerified && user.authProvider !== "google") {
      return res.status(403).json({ message: "Veuillez vérifier votre adresse e-mail avant de vous connecter." });
    }

    if (user.isDisabled) {
      return res.status(403).json({ message: "Votre compte a été désactivé par l'administrateur." });
    }

    const token = generateToken(user._id, user.authVersion);
    setAuthCookie(res, token);
    recordActiveUser(user._id);

    res.status(200).json({
      id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      country: user.country,
      role: user.role,
    });
  } catch (err) {
    next(err);
  }
});

// Google Profile Info (pre-registration check)
router.post("/google/profile", authLimiter, async (req, res, next) => {
  try {
    const credential = normalizeText(req.body.credential);
    if (!credential) return res.status(400).json({ message: "Jeton Google manquant." });
    const payload = await verifyGoogleCredential(credential);
    res.status(200).json({
      email: payload.email,
      firstName: payload.given_name || "",
      lastName: payload.family_name || "",
    });
  } catch (err) {
    next(err);
  }
});

// Google Sign-In / Sign-Up
router.post("/google", authLimiter, async (req, res, next) => {
  try {
    const credential = normalizeText(req.body.credential);
    if (!credential || !process.env.GOOGLE_CLIENT_ID) {
      return res.status(400).json({ message: "L’authentification Google n’est pas configurée." });
    }

    const payload = await verifyGoogleCredential(credential);
    const googleId = payload?.sub;
    const email = normalizeEmail(payload?.email);
    if (!googleId || !email) return res.status(401).json({ message: "Compte Google non vérifié." });

    const firstName = normalizeText(payload.given_name) || "Chercheur";
    const lastName = normalizeText(payload.family_name) || "Google";
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
        phoneNumber: "",
        country: "",
        googleId,
        authProvider: "google",
        emailVerified: true,
        role: 2,
        avatar: payload.picture || "",
      });
      isNewUser = true;

      await PendingUserRequest.create({
        user: user._id,
        name: `${firstName} ${lastName}`.trim(),
        email,
        role: 2,
        status: "pending",
      });
    } else {
      if (!user.googleId) user.googleId = googleId;
      if (!user.avatar && payload.picture) user.avatar = payload.picture;
      if (!user.emailVerified) user.emailVerified = true;
      await user.save();
    }

    if (user.isDisabled) {
      return res.status(403).json({ message: "Votre compte a été désactivé." });
    }

    const token = generateToken(user._id, user.authVersion);
    setAuthCookie(res, token);
    recordActiveUser(user._id);

    res.status(isNewUser ? 201 : 200).json({
      id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      country: user.country,
      role: user.role,
    });
  } catch (err) {
    next(err);
  }
});

// Logout (Safe: always clears cookie regardless of token status)
router.post("/logout", async (req, res, next) => {
  try {
    const cookieHeader = req.headers.cookie;
    if (typeof cookieHeader === "string") {
      const authCookie = cookieHeader.split(";").map((p) => p.trim()).find((p) => p.startsWith("authToken="));
      const token = authCookie ? authCookie.slice("authToken=".length) : null;
      if (token) {
        await revokeToken(token);
      }
    }
  } catch (err) {
    console.error("Token revocation on logout warning:", err.message);
  } finally {
    clearAuthCookie(res);
    res.status(200).json({ message: "Déconnexion réussie." });
  }
});

// Current authenticated user
router.get("/me", protect, async (req, res) => {
  res.status(200).json(req.user);
});

export default router;
