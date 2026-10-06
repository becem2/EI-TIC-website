import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Publication from "../models/Publication.js";
import { protect } from "../middleware/auth.js";
import { validateObjectId } from "../middleware/errorHandler.js";
import { normalizeText, profileUpdateLimiter } from "../utils/authHelpers.js";

const router = express.Router();

const normalizeProfilePayload = (body = {}) => {
  const updates = {};
  const has = (field) => Object.prototype.hasOwnProperty.call(body, field);
  const textFields = ["name", "firstName", "lastName", "titleTag", "location", "summaryText"];
  const largeTextFields = ["avatar", "researchImage"];

  for (const field of textFields) {
    if (has(field)) {
      if (typeof body[field] !== "string" || body[field].length > 2000) throw new Error(`Champ invalide: ${field}`);
      if (field === "summaryText" && normalizeText(body[field]).split(/\s+/).filter(Boolean).length > 200) {
        throw new Error("Le résumé professionnel ne peut pas dépasser 200 mots.");
      }
      updates[field] = normalizeText(body[field]);
    }
  }

  for (const field of largeTextFields) {
    if (has(field)) {
      if (typeof body[field] !== "string" || body[field].length > 3000000) throw new Error(`Champ invalide: ${field}`);
      updates[field] = normalizeText(body[field]);
    }
  }

  const normalizeStringList = (field, maxItems = 100) => {
    if (!has(field)) return;
    if (!Array.isArray(body[field]) || body[field].length > maxItems || body[field].some((v) => typeof v !== "string" || v.length > 500)) {
      throw new Error(`Champ invalide: ${field}`);
    }
    updates[field] = body[field].map(normalizeText).filter(Boolean);
  };
  normalizeStringList("researchAxes");
  normalizeStringList("skills");

  const normalizeItems = (field, fields, maxItems = 100) => {
    if (!has(field)) return;
    if (!Array.isArray(body[field]) || body[field].length > maxItems) throw new Error(`Champ invalide: ${field}`);
    updates[field] = body[field].map((value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`Champ invalide: ${field}`);
      return fields.reduce((item, itemField) => {
        if (value[itemField] !== undefined) {
          if (typeof value[itemField] !== "string" || value[itemField].length > 2000) throw new Error(`Champ invalide: ${field}`);
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

  return updates;
};

// GET /api/users/me
router.get("/me", protect, async (req, res) => {
  res.status(200).json(req.user);
});

// PUT /api/users/me (update profile)
router.put("/me", protect, profileUpdateLimiter, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    const { username, phoneNumber, country } = req.body;

    if (typeof username === "string") {
      const normalizedUsername = normalizeText(username);
      if (!normalizedUsername) {
        return res.status(400).json({ message: "Le nom d'utilisateur est requis." });
      }

      const existingUser = await User.findOne({ username: normalizedUsername, _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(400).json({ message: "Ce nom d'utilisateur est déjà pris." });
      }

      user.username = normalizedUsername;
    }

    if (typeof phoneNumber === "string") {
      user.phoneNumber = normalizeText(phoneNumber);
    }

    if (typeof country === "string") {
      user.country = normalizeText(country);
    }

    const validatedUpdates = normalizeProfilePayload(req.body);
    Object.assign(user, validatedUpdates);

    await user.save();
    const updatedUser = await User.findById(user._id).select("-password");
    res.status(200).json(updatedUser);
  } catch (err) {
    next(err);
  }
});

// GET /api/users/researchers (public directory)
router.get("/researchers", async (req, res, next) => {
  try {
    const publicProfileFields = [
      "username", "email", "phoneNumber", "country", "firstName", "lastName", "name", "titleTag", "location", "avatar", "researchImage",
      "summaryText", "researchAxes", "skills", "education", "workHistory", "languages", "linkedAccounts",
      "role", "createdAt",
    ].join(" ");

    const researchers = await User.find({ role: { $in: [0, 1] }, isDisabled: { $ne: true } })
      .select(publicProfileFields)
      .sort({ createdAt: -1 });

    const researcherIds = researchers.map((r) => r._id);
    const approvedPublications = await Publication.find({
      $or: [
        { submittedBy: { $in: researcherIds } },
        { "authors.userId": { $in: researcherIds } },
      ],
      status: "approved",
      isDisabled: { $ne: true },
    })
      .select("title journal year keywords submittedBy authors")
      .sort({ year: -1, createdAt: -1 });

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
    next(err);
  }
});

// GET /api/users/researchers/:id (individual public profile lookup)
router.get("/researchers/:id", validateObjectId("id"), async (req, res, next) => {
  try {
    const publicProfileFields = [
      "username", "email", "phoneNumber", "country", "firstName", "lastName", "name", "titleTag", "location", "avatar", "researchImage",
      "summaryText", "researchAxes", "skills", "education", "workHistory", "languages", "linkedAccounts",
      "role", "createdAt",
    ].join(" ");

    const researcher = await User.findOne({ _id: req.params.id, role: { $in: [0, 1] }, isDisabled: { $ne: true } })
      .select(publicProfileFields);

    if (!researcher) {
      return res.status(404).json({ message: "Chercheur introuvable." });
    }

    const publications = await Publication.find({
      $or: [
        { submittedBy: researcher._id },
        { "authors.userId": researcher._id },
      ],
      status: "approved",
      isDisabled: { $ne: true },
    }).select("title journal year keywords submittedBy authors").sort({ year: -1 });

    res.status(200).json({
      ...researcher.toObject(),
      publications,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
