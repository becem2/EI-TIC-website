import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const languageSchema = new mongoose.Schema({
  id: String,
  name: String,
  level: String,
}, { _id: false });

const educationSchema = new mongoose.Schema({
  id: String,
  institution: String,
  degree: String,
  field: String,
  period: String,
}, { _id: false });

const workHistorySchema = new mongoose.Schema({
  id: String,
  role: String,
  organization: String,
  period: String,
  description: String,
}, { _id: false });

const publicationSchema = new mongoose.Schema({
  id: String,
  title: String,
  status: { type: String, enum: ["published"] },
  image: String,
  journal: String,
  year: Number,
  citations: Number,
  doi: String,
  abstract: String,
  authors: [String],
  linkedAuthors: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
  }],
  authorUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  keywords: [String],
  pdfUrl: String,
}, { _id: false });

const linkedAccountSchema = new mongoose.Schema({
  id: String,
  type: { type: String, enum: ["github", "email", "orcid", "scholar", "linkedin"] },
  name: String,
  handle: String,
  meta: String,
  avatar: String,
  url: String,
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      select: false,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    authVersion: { type: Number, default: 0 },
    emailVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: { type: String, default: "", select: false },
    emailVerificationExpiresAt: { type: Date, select: false },
    emailVerificationCodeHash: { type: String, default: "", select: false },
    emailVerificationCodeExpiresAt: { type: Date, select: false },
    passwordResetTokenHash: { type: String, default: "", select: false },
    passwordResetExpiresAt: { type: Date, select: false },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    name: { type: String, trim: true, default: "" },
    titleTag: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    avatar: { type: String, trim: true, default: "" },
    researchImage: { type: String, trim: true, default: "" },
    summaryText: { type: String, trim: true, default: "" },
    researchAxes: { type: [String], default: [] },
    skills: { type: [String], default: [] },
    education: { type: [educationSchema], default: [] },
    workHistory: { type: [workHistorySchema], default: [] },
    publications: { type: [publicationSchema], default: [] },
    linkedAccounts: { type: [linkedAccountSchema], default: [] },
    languages: { type: [languageSchema], default: [] },
    role: {
      type: Number,
      enum: [0, 1, 2],
      default: 2,
      required: true,
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, isDisabled: 1, createdAt: -1 });
userSchema.index({ emailVerificationCodeHash: 1 }, { sparse: true });
userSchema.index({ emailVerificationTokenHash: 1 }, { sparse: true });
userSchema.index({ passwordResetTokenHash: 1 }, { sparse: true });
userSchema.index({ "publications.id": 1 }, { sparse: true });

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
