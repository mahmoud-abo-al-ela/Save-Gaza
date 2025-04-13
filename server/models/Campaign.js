// server/models/Campaign.js
import mongoose from "mongoose";

const CampaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Description is required"],
  },
  start_date: {
    type: Date,
    required: [true, "Start date is required"],
  },
  end_date: {
    type: Date,
  },
  goal_amount: {
    type: Number,
    required: [true, "Goal amount is required"],
    min: 0,
  },
  current_amount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["active", "completed"],
    default: "active",
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  attachments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attachment",
    },
  ],
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Campaign", CampaignSchema);
