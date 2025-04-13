import mongoose from "mongoose";

const DonationSchema = new mongoose.Schema(
  {
    donor_name: {
      type: String,
      trim: true,
      required: [true, "Donor name is required"],
    },
    donation_type: {
      type: String,
      required: [true, "Donation type is required"],
      enum: {
        values: ["cash", "goods"],
        message: "Donation type must be either 'cash' or 'goods'",
      },
    },
    amount: {
      type: Number,
      min: [0, "Amount cannot be negative"],
      default: 0,
      validate: {
        validator: function (value) {
          // If donation type is cash, amount should be greater than 0
          return this.donation_type !== "cash" || value > 0;
        },
        message: "Cash donations must have an amount greater than 0",
      },
    },
    description: {
      type: String,
      trim: true,
      required: function () {
        // Description is required for goods donations
        return this.donation_type === "goods";
      },
    },
    received_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User who received the donation is required"],
    },
    date_received: {
      type: Date,
      required: [true, "Date received is required"],
      default: Date.now,
    },
    campaign_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Pre-save middleware to validate campaign donations
DonationSchema.pre("save", async function (next) {
  if (this.campaign_id && this.donation_type !== "cash") {
    this.campaign_id = undefined;
  }
  next();
});

// Index for efficient querying by campaign
DonationSchema.index({ campaign_id: 1 });
DonationSchema.index({ donation_type: 1 });
DonationSchema.index({ date_received: 1 });

const Donation = mongoose.model("Donation", DonationSchema);

export default Donation;
