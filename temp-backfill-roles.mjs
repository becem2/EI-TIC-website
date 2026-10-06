import User from './Backend/models/User.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

const result = await User.updateMany({ role: { $exists: false } }, { $set: { role: 2 } });
console.log(JSON.stringify({ matched: result.matchedCount, modified: result.modifiedCount }, null, 2));

const users = await User.find({}, { username: 1, email: 1, role: 1, _id: 0 }).lean();
console.log(JSON.stringify(users, null, 2));

await mongoose.disconnect();
