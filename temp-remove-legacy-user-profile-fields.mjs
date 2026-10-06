import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./Backend/models/User.js";

dotenv.config({ path: new URL("./.env", import.meta.url) });

const legacyFields = [
  "strongPoints",
  "prefix",
  "timezone",
  "isVerified",
  "availabilityBadge",
  "boostProfile",
  "citationsCount",
  "hoursPerWeek",
  "availabilityNote",
  "hasVideoIntro",
  "videoIntroUrl",
  "idStatus",
  "militaryVeteran",
];

try {
  await mongoose.connect(process.env.MONGO_URI);
  const result = await User.updateMany({}, { $unset: Object.fromEntries(legacyFields.map((field) => [field, 1])) });
  console.log(`Removed legacy profile fields from ${result.modifiedCount} user profile(s).`);
} finally {
  await mongoose.disconnect();
}