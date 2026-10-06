import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

export const uploadsDir = path.join(process.cwd(), "Backend", "uploads");
export const actualiteUploadsDir = path.join(uploadsDir, "actualites");

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(actualiteUploadsDir)) fs.mkdirSync(actualiteUploadsDir, { recursive: true });

export const safeUnlink = async (filePath) => {
  if (!filePath) return;
  try {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
    }
  } catch (error) {
    console.error(`Failed to delete file at ${filePath}:`, error.message);
  }
};

const pdfStorage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (_req, _file, cb) {
    cb(null, `${crypto.randomUUID()}.pdf`);
  },
});

export const pdfUpload = multer({
  storage: pdfStorage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Seuls les fichiers PDF sont acceptés."));
    }
    cb(null, true);
  },
});

const imageStorage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, actualiteUploadsDir);
  },
  filename: function (_req, file, cb) {
    const extensions = {
      "image/jpeg": ".jpg",
      "image/jpg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "image/gif": ".gif",
    };
    const extension = extensions[file.mimetype] || path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `${crypto.randomUUID()}${extension}`);
  },
});

export const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/gif"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Seules les images (JPEG, PNG, WebP, GIF) sont autorisées."));
    }
    cb(null, true);
  },
});

export const validateUploadSignature = (kind) => async (req, res, next) => {
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
    console.error("Failed to validate uploaded file signature", error);
    await safeUnlink(req.file.path);
    return res.status(500).json({ message: "Impossible de valider le fichier téléversé." });
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
    await safeUnlink(req.file.path);
    return res.status(400).json({ message: "Le contenu du fichier ne correspond pas au format autorisé." });
  }

  return next();
};
