// server/models/Attachments.js
import mongoose from "mongoose";

const AttachmentSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Campaign",
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String, // Store Cloudinary URL
    required: true,
  },
  publicId: {
    type: String, // Store Cloudinary public ID
    required: true,
  },
  contentType: {
    type: String, // e.g., 'image/jpeg', 'application/pdf'
    required: true,
  },
  size: {
    type: Number, // File size in bytes
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Attachment", AttachmentSchema);
