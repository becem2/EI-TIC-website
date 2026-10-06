import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["publication_access_request", "publication_access_decision"],
      required: true,
    },
    accessRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PublicationAccessRequest",
      required: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
