import mongoose from "mongoose";
import PublicationAccessRequest from "../models/PublicationAccessRequest.js";
import Publication from "../models/Publication.js";

export const requirePublicationPdfAccess = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Publication not found" });
    }

    const publication = await Publication.findById(req.params.id).select("status isDisabled isPrivate submittedBy authors.userId pdfPath pdfAccessUsers");

    if (!publication || publication.isDisabled || (publication.status !== "approved" && req.user?.role !== 0)) {
      return res.status(404).json({ message: "Publication not found" });
    }

    req.publication = publication;

    if (!publication.isPrivate) return next();
    if (!req.user) return res.status(403).json({ message: "Accès au PDF privé requis" });

    const requesterId = String(req.user._id);
    const isAuthor = String(publication.submittedBy || "") === requesterId
      || publication.authors?.some((author) => String(author.userId || "") === requesterId);
    const isAdmin = Number(req.user.role) === 0;
    const hasExplicitAccess = publication.pdfAccessUsers?.some((userId) => String(userId) === String(req.user._id));
    if (isAuthor || isAdmin || hasExplicitAccess) return next();

    const hasApprovedRequest = await PublicationAccessRequest.exists({
      publication: publication._id,
      requester: req.user._id,
      status: "approved",
    });

    if (!hasApprovedRequest) {
      return res.status(403).json({ message: "Accès au PDF privé non autorisé" });
    }

    return next();
  } catch (error) {
    console.error("Failed to authorize publication PDF access", error);
    return res.status(500).json({ message: "Impossible de vérifier l’accès au PDF" });
  }
};
