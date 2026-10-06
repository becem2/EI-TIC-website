import mongoose from "mongoose";

const actualiteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["Événement", "Découverte", "Distinction", "Partenariat", "Conférence"],
      default: "Événement",
    },
    date: { type: String, default: "" },
    author: { type: String, default: "" },
    readTime: { type: String, default: "" },
    excerpt: { type: String, default: "" },
    content: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    isImportant: { type: Boolean, default: false },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "deleted"],
      default: "pending",
    },
  },
  { timestamps: true }
);

actualiteSchema.index({ status: 1, createdAt: -1 });
actualiteSchema.index({ category: 1, status: 1 });
actualiteSchema.index({ isImportant: 1, status: 1 });
actualiteSchema.index({ submittedBy: 1, status: 1 });

export default mongoose.model("Actualite", actualiteSchema, "actualites");
