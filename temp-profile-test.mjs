import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { connectDB } from './Backend/config/db.js';
import User from './Backend/models/User.js';

if (process.env.NODE_ENV === 'production' || process.env.ALLOW_PROFILE_TEST !== 'true') {
  throw new Error('Set ALLOW_PROFILE_TEST=true in a non-production environment to run this test.');
}

const mongoHost = new URL(process.env.MONGO_URI || '').hostname;
if (!['localhost', '127.0.0.1', '::1'].includes(mongoHost)) {
  throw new Error('Profile tests are restricted to a local MongoDB instance.');
}

await connectDB();
const email = process.env.PROFILE_TEST_EMAIL;
if (!email) throw new Error('Set PROFILE_TEST_EMAIL to a local test account.');
const user = await User.findOne({ email });
if (!user) throw new Error('The configured local test account was not found.');
const token = jwt.sign({ id: user._id, jti: randomUUID(), ver: user.authVersion ?? 0 }, process.env.JWT_SECRET, { expiresIn: '30d' });
const res = await fetch('http://localhost:5000/api/users/me', {
  method: 'GET',
  headers: {
    Cookie: `authToken=${token}`,
  },
});
console.log('Profile endpoint status:', res.status);
await mongoose.disconnect();
