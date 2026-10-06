import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./Backend/models/User.js";

dotenv.config({ path: new URL("./.env", import.meta.url) });

try {
  await mongoose.connect(process.env.MONGO_URI);
  const result = await User.updateMany(
    { "publications.0": { $exists: true } },
    [{ $set: { publications: { $filter: { input: "$publications", as: "publication", cond: { $eq: ["$$publication.status", "published"] } } } } }],
  );
  console.log(`Removed draft profile publications from ${result.modifiedCount} user profile(s).`);
} finally {
  await mongoose.disconnect();
}