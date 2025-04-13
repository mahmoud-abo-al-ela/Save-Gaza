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
  fileData: {
    type: Buffer, // Store file as binary data
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
