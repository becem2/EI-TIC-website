import mongoose from "mongoose";

const publicationAccessRequestSchema = new mongoose.Schema(
  {
    publication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Publication",
      required: true,
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

publicationAccessRequestSchema.index({ publication: 1, requester: 1 }, { unique: true });
publicationAccessRequestSchema.index({ author: 1, status: 1, createdAt: -1 });

export default mongoose.model("PublicationAccessRequest", publicationAccessRequestSchema);
