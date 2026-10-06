import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import authRoutes from "./routes/auth.js";
import { connectDB } from "./config/db.js";
import helmet from "helmet";
dotenv.config();

const PORT = process.env.PORT || 5000;

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '5mb' }));
app.use('/uploads/actualites', (req, res, next) => {
  const publicImageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  if (!publicImageExtensions.includes(path.extname(req.path).toLowerCase())) {
    return res.sendStatus(404);
  }
  return next();
}, express.static(path.join(process.cwd(), 'Backend', 'uploads', 'actualites')));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

const trustedAppOrigin = new URL(process.env.APP_URL || "http://localhost:5173").origin;
app.use("/api/users", (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();

  const origin = req.get("origin");
  if (origin && origin !== trustedAppOrigin) {
    return res.status(403).json({ message: "Request origin is not allowed" });
  }
  return next();
}, authRoutes);

const startServer = async () => {
  try {
    await connectDB();

    // Remove legacy publication collections so submissions always use the main publications collection.
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);
    const legacyPublicationCollections = collectionNames.filter((name) =>
      name === 'pendingpublication' || name === 'pendingpublications' || name === 'deletedpublications'
    );

    if (!collectionNames.includes('actualites')) {
      await db.createCollection('actualites');
      console.log("Created 'actualites' collection.");
    }

    if (legacyPublicationCollections.length > 0) {
      console.warn(`Legacy publication collections detected: ${legacyPublicationCollections.join(', ')}. They were left untouched.`);
    }

    app.listen(PORT, () => {
      console.log(`Server started at port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
