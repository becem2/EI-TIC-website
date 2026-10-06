import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./Backend/models/User.js";

dotenv.config({ path: new URL("./.env", import.meta.url) });

try {
  await mongoose.connect(process.env.MONGO_URI);
  const result = await User.updateMany(
    { "strongPoints.0": { $exists: true }, "researchAxes.0": { $exists: false } },
    [{ $set: { researchAxes: "$strongPoints" } }],
  );
  console.log(`Migrated ${result.modifiedCount} user profile(s) to researchAxes.`);
} finally {
  await mongoose.disconnect();
}
