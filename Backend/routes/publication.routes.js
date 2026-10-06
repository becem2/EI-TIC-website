import express from "express";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import Publication from "../models/Publication.js";
import PublicationAccessRequest from "../models/PublicationAccessRequest.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { optionalProtect, protect } from "../middleware/auth.js";
import { requirePublicationPdfAccess } from "../middleware/publicationAccess.js";
import { validateObjectId } from "../middleware/errorHandler.js";
import {
  normalizeText,
  publicationAccessLimiter,
  requireMemberOrAdmin,
  syncPublicationUserProfiles,
  uploadLimiter,
} from "../utils/authHelpers.js";
import { pdfUpload, safeUnlink, validateUploadSignature } from "../utils/fileUpload.js";

const router = express.Router();

// GET /api/publications (public approved publications)
router.get("/", async (req, res, next) => {
  try {
    const publications = await Publication.find({
      status: "approved",
      isDisabled: { $ne: true },
    }).sort({ year: -1, createdAt: -1 });

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
    next(err);
  }
});

// POST /api/publications (submit new publication)
router.post(
  "/",
  protect,
  requireMemberOrAdmin,
  uploadLimiter,
  pdfUpload.single("pdf"),
  validateUploadSignature("pdf"),
  async (req, res, next) => {
    // If validation fails at any point, we MUST clean up the uploaded PDF file!
    const cleanupUploadedFile = async () => {
      if (req.file?.path) {
        await safeUnlink(req.file.path);
      }
    };

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
      const isPrivate = req.body.isPrivate === "true" || req.body.isPrivate === true;

      if (!title) {
        await cleanupUploadedFile();
        return res.status(400).json({ message: "Le titre de la publication est requis." });
      }
      if (!type) {
        await cleanupUploadedFile();
        return res.status(400).json({ message: "Le type de publication est requis." });
      }
      if (!req.file) {
        return res.status(400).json({ message: "Le fichier PDF est obligatoire." });
      }
      if (!Number.isFinite(yearValue)) {
        await cleanupUploadedFile();
        return res.status(400).json({ message: "L'année de publication est invalide." });
      }

      let details = {};
      if (typeof req.body.details === "string") {
        try {
          const parsed = JSON.parse(req.body.details);
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            details = Object.fromEntries(
              Object.entries(parsed).map(([k, v]) => [k, normalizeText(v)])
            );
          }
        } catch {
          details = {};
        }
      }

      let keywords = [];
      const rawKeywords = req.body.keywords;
      if (typeof rawKeywords === "string") {
        try {
          const parsed = JSON.parse(rawKeywords);
          keywords = Array.isArray(parsed) ? parsed.map(normalizeText).filter(Boolean) : [];
        } catch {
          keywords = rawKeywords.split(",").map(normalizeText).filter(Boolean);
        }
      } else if (Array.isArray(rawKeywords)) {
        keywords = rawKeywords.map(normalizeText).filter(Boolean);
      }

      let authorsInput = [];
      const rawAuthors = req.body.authors;
      if (typeof rawAuthors === "string") {
        try {
          const parsed = JSON.parse(rawAuthors);
          if (Array.isArray(parsed)) authorsInput = parsed;
          else {
            await cleanupUploadedFile();
            return res.status(400).json({ message: "Format des auteurs invalide." });
          }
        } catch {
          await cleanupUploadedFile();
          return res.status(400).json({ message: "Format des auteurs invalide." });
        }
      } else if (Array.isArray(rawAuthors)) {
        authorsInput = rawAuthors;
      }

      const authorUserIds = [
        ...new Set(
          authorsInput
            .map((a) => (typeof a === "string" ? null : a.userId))
            .filter((id) => id && mongoose.isValidObjectId(id))
        ),
      ];

      const authors = authorsInput
        .map((a) =>
          typeof a === "string"
            ? { name: normalizeText(a) }
            : {
                ...(a.userId && mongoose.isValidObjectId(a.userId) ? { userId: a.userId } : {}),
                name: normalizeText(a.name),
              }
        )
        .filter((a) => a.name);

      const submitterId = String(req.user._id);
      if (!authors.some((a) => String(a.userId || "") === submitterId)) {
        authors.unshift({
          userId: req.user._id,
          name: `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim() || req.user.username,
        });
      }

      const citationsCount = Number(req.body.citationsCount || 0);
      const doi = normalizeText(req.body.doi);
      const authorDisplay = authorText || authors.map((a) => a.name).join(", ");

      const publicationDetailKeys = [
        "conferenceTitle", "conferenceLocation", "country", "pages", "dates", "conferenceSite",
        "volume", "firstPublicationDate", "journalTitle", "journalIssn", "journalQuartile2025",
        "publicationQuartile", "impactFactor2025", "publicationImpactFactor", "indexation",
        "journalSite", "paperLink", "publisher", "publisherLink", "edition", "isbnIssn",
        "publicationDate",
      ];
      const explicitDetails = Object.fromEntries(
        publicationDetailKeys.map((key) => [key, details[key] || ""])
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
        status: "pending",
        pdfPath: path.relative(process.cwd(), req.file.path),
        year: yearValue,
        type,
        details,
        ...explicitDetails,
      });

      res.status(201).json(publication);
    } catch (err) {
      await cleanupUploadedFile();
      next(err);
    }
  }
);

// GET /api/publications/:id/pdf (serve PDF)
router.get("/:id/pdf", validateObjectId("id"), optionalProtect, requirePublicationPdfAccess, async (req, res, next) => {
  try {
    const publication = req.publication;

    if (!publication.pdfPath) {
      return res.status(404).json({ message: "Fichier PDF introuvable pour cette publication." });
    }

    const fullPath = path.isAbsolute(publication.pdfPath)
      ? publication.pdfPath
      : path.join(process.cwd(), publication.pdfPath);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: "Le fichier physique est introuvable sur le serveur." });
    }

    await Publication.updateOne({ _id: publication._id }, { $inc: { downloadsCount: 1 } });
    return res.sendFile(fullPath);
  } catch (err) {
    next(err);
  }
});

// POST /api/publications/:id/access-request
router.post("/:id/access-request", validateObjectId("id"), publicationAccessLimiter, protect, async (req, res, next) => {
  try {
    const publication = await Publication.findOne({
      _id: req.params.id,
      status: "approved",
      isPrivate: true,
    });

    if (!publication) return res.status(404).json({ message: "Publication privée introuvable." });
    if (!publication.submittedBy) return res.status(409).json({ message: "Cette publication ne possède pas d’auteur responsable." });

    const requesterId = String(req.user._id);
    const isAuthor = String(publication.submittedBy) === requesterId
      || publication.authors?.some((a) => String(a.userId || "") === requesterId);

    if (isAuthor) {
      return res.status(400).json({ message: "Vous êtes déjà l'un des auteurs de cette publication." });
    }

    const existingRequest = await PublicationAccessRequest.findOne({
      publication: publication._id,
      requester: req.user._id,
    });

    if (existingRequest?.status === "approved") {
      return res.status(409).json({ message: "Demande déjà approuvée.", request: existingRequest });
    }

    const accessRequest = existingRequest || await PublicationAccessRequest.create({
      publication: publication._id,
      requester: req.user._id,
      author: publication.submittedBy,
    });

    if (existingRequest) {
      existingRequest.status = "pending";
      await existingRequest.save();
    }

    const requesterName = [req.user.firstName, req.user.lastName].filter(Boolean).join(" ").trim() || req.user.username;
    await Notification.create({
      recipient: publication.submittedBy,
      type: "publication_access_request",
      accessRequest: accessRequest._id,
      message: `${requesterName} demande l’accès au PDF « ${publication.title} »`,
    });

    res.status(201).json({ message: "Demande d’accès envoyée avec succès.", request: accessRequest });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Une demande d'accès existe déjà pour cette publication." });
    }
    next(err);
  }
});

// GET /api/publications/:id/access-status
router.get("/:id/access-status", validateObjectId("id"), protect, async (req, res, next) => {
  try {
    const publication = await Publication.findOne({ _id: req.params.id, status: "approved" })
      .select("isPrivate submittedBy authors.userId pdfAccessUsers");

    if (!publication) return res.status(404).json({ message: "Publication introuvable." });

    const requesterId = String(req.user._id);
    const isAuthor = String(publication.submittedBy || "") === requesterId
      || publication.authors?.some((a) => String(a.userId || "") === requesterId);
    const hasAccess = isAuthor
      || Number(req.user.role) === 0
      || publication.pdfAccessUsers?.some((uid) => String(uid) === requesterId);

    const request = await PublicationAccessRequest.findOne({ publication: publication._id, requester: req.user._id }).select("status");

    res.status(200).json({
      isPrivate: Boolean(publication.isPrivate),
      hasAccess: Boolean(hasAccess),
      requestStatus: request?.status || null,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/publications/:id (Admin delete)
router.delete("/:id", validateObjectId("id"), protect, async (req, res, next) => {
  if (Number(req.user.role) !== 0) {
    return res.status(403).json({ message: "Accès administrateur requis." });
  }

  try {
    const publication = await Publication.findById(req.params.id);
    if (!publication) {
      return res.status(404).json({ message: "Publication introuvable." });
    }

    publication.status = "deleted";
    publication.deletedBy = req.user._id;
    publication.deletedAt = new Date();
    await publication.save();

    // Critical fix: Ensure user profile publications are immediately desynchronized/purged!
    await syncPublicationUserProfiles(publication);

    res.status(200).json({ message: "Publication supprimée avec succès." });
  } catch (err) {
    next(err);
  }
});

export default router;
