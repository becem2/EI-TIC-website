import mongoose from "mongoose";

const publicationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    author: { type: String, default: "" },
    authors: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: { type: String, default: "" },
    }],
    summary: { type: String, default: "" },
    abstract: { type: String, default: "" },
    introduction: { type: String, default: "" },
    methodology: { type: String, default: "" },
    conclusion: { type: String, default: "" },
    journal: { type: String, default: "" },
    keywords: [{ type: String }],
    citationsCount: { type: Number, default: 0 },
    downloadsCount: { type: Number, default: 0 },
    doi: { type: String, default: "" },
    department: { type: String, default: "" },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    pdfPath: { type: String, default: "" },
    isPrivate: { type: Boolean, default: false },
    pdfAccessUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    year: { type: Number },
    type: {
      type: String,
      enum: [
        "Communication",
        "Article scientifique",
        "Chapitre d'ouvrage",
        "Ouvrage scientifique",
      ],
      default: "Article scientifique",
    },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    conferenceTitle: { type: String, default: "" },
    conferenceLocation: { type: String, default: "" },
    country: { type: String, default: "" },
    pages: { type: String, default: "" },
    dates: { type: String, default: "" },
    conferenceSite: { type: String, default: "" },
    volume: { type: String, default: "" },
    firstPublicationDate: { type: String, default: "" },
    journalTitle: { type: String, default: "" },
    journalIssn: { type: String, default: "" },
    journalQuartile2025: { type: String, default: "" },
    publicationQuartile: { type: String, default: "" },
    impactFactor2025: { type: String, default: "" },
    publicationImpactFactor: { type: String, default: "" },
    indexation: { type: String, default: "" },
    journalSite: { type: String, default: "" },
    paperLink: { type: String, default: "" },
    publisher: { type: String, default: "" },
    publisherLink: { type: String, default: "" },
    edition: { type: String, default: "" },
    isbnIssn: { type: String, default: "" },
    publicationDate: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "deleted"],
      default: "pending",
    },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    deletedAt: { type: Date },
    isDisabled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

publicationSchema.index({ status: 1, isDisabled: 1, createdAt: -1 });
publicationSchema.index({ status: 1, isDisabled: 1, year: -1, createdAt: -1 });
publicationSchema.index({ submittedBy: 1, status: 1, isDisabled: 1 });
publicationSchema.index({ "authors.userId": 1, status: 1, isDisabled: 1 });
publicationSchema.index({ isPrivate: 1, status: 1 });

export default mongoose.model("Publication", publicationSchema, "publications");
