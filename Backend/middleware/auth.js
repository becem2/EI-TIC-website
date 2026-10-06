import User from "../models/User.js";
import RevokedToken from "../models/RevokedToken.js";
import jwt from "jsonwebtoken";

const activeUsers = new Map();

const getToken = (req) => {
  const cookieHeader = req.headers.cookie;
  if (typeof cookieHeader !== "string") return null;
  const authCookie = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith("authToken="));
  return authCookie ? authCookie.slice("authToken=".length) : null;
};

export const revokeToken = async (token) => {
  const decoded = jwt.decode(token);
  if (!decoded || typeof decoded !== "object" || typeof decoded.jti !== "string" || typeof decoded.exp !== "number") {
    return false;
  }

  await RevokedToken.updateOne(
    { jti: decoded.jti },
    { $set: { expiresAt: new Date(decoded.exp * 1000) } },
    { upsert: true }
  );
  await RevokedToken.deleteMany({ expiresAt: { $lte: new Date() } });
  return true;
};

export const isTokenRevoked = async (decoded) => {
  if (typeof decoded?.jti !== "string") return false;
  return Boolean(await RevokedToken.exists({
    jti: decoded.jti,
    expiresAt: { $gt: new Date() },
  }));
};

export const recordActiveUser = (userId) => {
  if (!userId) return;
  activeUsers.set(String(userId), Date.now());
};

export const getActiveUsersCount = (maxAgeMs = 5 * 60 * 1000) => {
  const now = Date.now();
  for (const [userId, lastSeen] of activeUsers.entries()) {
    if (now - lastSeen > maxAgeMs) {
      activeUsers.delete(userId);
    }
  }
  return activeUsers.size;
};

export const protect = async (req, res, next) => {
  const token = getToken(req);
  if (!token) {
    return res.status(401).json({ message: "Not authorized, token failed" });
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not configured");
    return res.status(500).json({ message: "Server misconfiguration" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (await isTokenRevoked(decoded)) {
      return res.status(401).json({ message: "Not authorized, token revoked" });
    }

    if (!decoded.id || !User.db.base.isValidObjectId(decoded.id)) {
      return res.status(401).json({ message: "Not authorized, token invalid" });
    }

    req.token = token;
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "Not authorized, user not found" });
    }

    if (req.user.isDisabled) {
      return res.status(403).json({ message: "Account disabled" });
    }

    if ((decoded.ver ?? 0) !== (req.user.authVersion ?? 0)) {
      return res.status(401).json({ message: "Not authorized, credentials changed" });
    }

    recordActiveUser(req.user._id);
    return next();
  } catch (err) {
    console.error("Token verification failed: ", err.message);
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

export const optionalProtect = async (req, res, next) => {
  const token = getToken(req);
  if (!token || !process.env.JWT_SECRET) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (await isTokenRevoked(decoded)) return next();
    if (!decoded.id || !User.db.base.isValidObjectId(decoded.id)) return next();
    const user = await User.findById(decoded.id).select("-password");
    if (!user || user.isDisabled) return next();
    if ((decoded.ver ?? 0) !== (user.authVersion ?? 0)) return next();

    req.token = token;
    req.user = user;
    recordActiveUser(user._id);
    return next();
  } catch {
    // Stale/expired token: ignore and treat as unauthenticated guest
    return next();
  }
};
