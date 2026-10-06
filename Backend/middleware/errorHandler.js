import mongoose from "mongoose";

export const validateObjectId = (paramName = "id") => (req, res, next) => {
  const id = req.params[paramName];
  if (!id || !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: `Identifiant invalide: ${id}` });
  }
  return next();
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({ message: `Route introuvable: ${req.method} ${req.originalUrl}` });
};

export const errorHandler = (err, req, res, _next) => {
  console.error("Unhandled API Error:", err);

  // Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      message: `Valeur invalide pour le champ ${err.path}: ${err.value}`,
    });
  }

  // Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "champ";
    return res.status(409).json({
      message: `Cette valeur existe déjà pour le champ: ${field}`,
    });
  }

  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      message: messages.join(", "),
    });
  }

  // Multer Errors
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Le fichier dépasse la taille maximale autorisée." });
    }
    return res.status(400).json({ message: `Erreur lors de l’envoi du fichier: ${err.message}` });
  }

  // JWT Errors
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({ message: "Session expirée ou jeton d’authentification invalide." });
  }

  const statusCode = Number.isInteger(err.status) ? err.status : 500;
  return res.status(statusCode).json({
    message: err.message || "Une erreur interne est survenue sur le serveur.",
  });
};
