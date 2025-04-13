import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import Donation from "../models/Donation.js";
import Campaign from "../models/Campaign.js";
import User from "../models/User.js";
import Attachment from "../models/Attachments.js"; // Note the plural name

const router = express.Router();

// Setup multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedFileTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
    const extname = allowedFileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    if (extname) {
      return cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPEG, JPG, PNG, GIF, PDF, DOC, DOCX, XLS, XLSX files are allowed."
        )
      );
    }
  },
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Authentication token required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Token expired, please login again" });
    }
    return res.status(403).json({ message: "Invalid token" });
  }
};

// Admin middleware
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// ---------- DONATION ROUTES ----------

// Get all donations with filtering
router.get("/donations", authenticateToken, async (req, res) => {
  try {
    const {
      donor_name,
      donation_type,
      campaign_id,
      start_date,
      end_date,
      min_amount,
      max_amount,
    } = req.query;

    const filter = {};

    if (donor_name) {
      filter.donor_name = { $regex: donor_name, $options: "i" };
    }

    if (donation_type) {
      filter.donation_type = donation_type;
    }

    if (campaign_id) {
      filter.campaign_id = campaign_id;
    }

    if (start_date || end_date) {
      filter.date_received = {};
      if (start_date) {
        filter.date_received.$gte = new Date(start_date);
      }
      if (end_date) {
        filter.date_received.$lte = new Date(end_date);
      }
    }

    if (min_amount || max_amount) {
      filter.amount = {};
      if (min_amount) {
        filter.amount.$gte = Number(min_amount);
      }
      if (max_amount) {
        filter.amount.$lte = Number(max_amount);
      }
    }

    const donations = await Donation.find(filter)
      .populate("received_by", "username email")
      .populate("campaign_id", "title")
      .sort({ date_received: -1 });

    res.json({ donations });
  } catch (error) {
    console.error("Error getting donations:", error);
    res
      .status(500)
      .json({ message: "Failed to get donations", error: error.message });
  }
});

// Get donation by ID
router.get("/donations/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid donation ID" });
    }

    const donation = await Donation.findById(id)
      .populate("received_by", "username email")
      .populate("campaign_id", "title");

    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    res.json({ donation });
  } catch (error) {
    console.error("Error getting donation:", error);
    res
      .status(500)
      .json({ message: "Failed to get donation", error: error.message });
  }
});

// Create donation
router.post("/donations", authenticateToken, async (req, res) => {
  try {
    const {
      donor_name,
      donation_type,
      amount,
      description,
      date_received,
      campaign_id,
    } = req.body;

    if (!donor_name || !donation_type || !date_received) {
      return res.status(400).json({
        message: "Donor name, donation type and date received are required",
        fields: {
          donor_name: !donor_name,
          donation_type: !donation_type,
          date_received: !date_received,
        },
      });
    }

    // Additional validation for cash donations
    if (donation_type === "cash" && (!amount || amount <= 0)) {
      return res.status(400).json({
        message: "Cash donations must have an amount greater than 0",
        field: "amount",
      });
    }

    // Additional validation for goods donations
    if (donation_type === "goods" && !description) {
      return res.status(400).json({
        message: "Goods donations must have a description",
        field: "description",
      });
    }

    // Check if campaign exists if campaign_id is provided and not empty
    let validCampaignId = null;
    if (campaign_id && campaign_id.trim() !== "") {
      if (!mongoose.Types.ObjectId.isValid(campaign_id)) {
        return res.status(400).json({ message: "Invalid campaign ID" });
      }

      const campaign = await Campaign.findById(campaign_id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      validCampaignId = campaign_id;
    }

    const newDonation = await Donation.create({
      donor_name,
      donation_type,
      amount: amount || 0,
      description,
      received_by: req.user.id,
      date_received: new Date(date_received),
      campaign_id:
        donation_type === "cash" && validCampaignId
          ? validCampaignId
          : undefined,
    });

    // If this is a cash donation and has a campaign, update campaign stats
    if (donation_type === "cash" && validCampaignId) {
      await Campaign.findByIdAndUpdate(validCampaignId, {
        $inc: { current_amount: Number(amount) },
      });
    }

    res.status(201).json({
      message: "Donation created successfully",
      donation: newDonation,
    });
  } catch (error) {
    console.error("Error creating donation:", error);
    res
      .status(500)
      .json({ message: "Failed to create donation", error: error.message });
  }
});

// Update donation
router.put("/donations/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      donor_name,
      donation_type,
      amount,
      description,
      date_received,
      campaign_id,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid donation ID" });
    }

    // Check if donation exists
    const donation = await Donation.findById(id);
    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    // Additional validation for cash donations
    if (donation_type === "cash" && (!amount || amount <= 0)) {
      return res.status(400).json({
        message: "Cash donations must have an amount greater than 0",
        field: "amount",
      });
    }

    // Additional validation for goods donations
    if (donation_type === "goods" && !description) {
      return res.status(400).json({
        message: "Goods donations must have a description",
        field: "description",
      });
    }

    // Check if campaign exists if campaign_id is provided and not empty
    let validCampaignId = null;
    if (campaign_id && campaign_id.trim() !== "") {
      if (!mongoose.Types.ObjectId.isValid(campaign_id)) {
        return res.status(400).json({ message: "Invalid campaign ID" });
      }

      const campaign = await Campaign.findById(campaign_id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      validCampaignId = campaign_id;
    }

    // Handle campaign amounts for cash donations
    if (donation_type === "cash") {
      // If campaign changed
      if (
        donation.campaign_id &&
        validCampaignId &&
        donation.campaign_id.toString() !== validCampaignId
      ) {
        // Subtract from old campaign
        await Campaign.findByIdAndUpdate(donation.campaign_id, {
          $inc: { current_amount: -donation.amount },
        });
        // Add to new campaign
        await Campaign.findByIdAndUpdate(validCampaignId, {
          $inc: { current_amount: Number(amount) },
        });
      }
      // If campaign added
      else if (!donation.campaign_id && validCampaignId) {
        await Campaign.findByIdAndUpdate(validCampaignId, {
          $inc: { current_amount: Number(amount) },
        });
      }
      // If campaign removed
      else if (donation.campaign_id && !validCampaignId) {
        await Campaign.findByIdAndUpdate(donation.campaign_id, {
          $inc: { current_amount: -donation.amount },
        });
      }
      // If amount changed but same campaign
      else if (
        donation.campaign_id &&
        validCampaignId &&
        donation.campaign_id.toString() === validCampaignId &&
        donation.amount !== Number(amount)
      ) {
        const amountDiff = Number(amount) - donation.amount;
        await Campaign.findByIdAndUpdate(donation.campaign_id, {
          $inc: { current_amount: amountDiff },
        });
      }
    }

    // Update donation
    const updatedDonation = await Donation.findByIdAndUpdate(
      id,
      {
        donor_name,
        donation_type,
        amount: amount || 0,
        description,
        date_received: date_received
          ? new Date(date_received)
          : donation.date_received,
        campaign_id:
          donation_type === "cash" && validCampaignId
            ? validCampaignId
            : undefined,
      },
      { new: true, runValidators: true }
    );

    res.json({
      message: "Donation updated successfully",
      donation: updatedDonation,
    });
  } catch (error) {
    console.error("Error updating donation:", error);
    res
      .status(500)
      .json({ message: "Failed to update donation", error: error.message });
  }
});

// Delete donation (admin only)
router.delete("/donations/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid donation ID" });
    }

    // Get donation before deletion to handle campaign amounts
    const donation = await Donation.findById(id);
    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    // Update campaign amount if this was a cash donation
    if (donation.donation_type === "cash" && donation.campaign_id) {
      await Campaign.findByIdAndUpdate(donation.campaign_id, {
        $inc: { current_amount: -donation.amount },
      });
    }

    // Delete donation
    await Donation.findByIdAndDelete(id);

    res.json({ message: "Donation deleted successfully" });
  } catch (error) {
    console.error("Error deleting donation:", error);
    res
      .status(500)
      .json({ message: "Failed to delete donation", error: error.message });
  }
});

// Get donation statistics
router.get("/donations/stats/summary", authenticateToken, async (req, res) => {
  try {
    const totalDonations = await Donation.countDocuments();
    const totalCashAmount = await Donation.aggregate([
      { $match: { donation_type: "cash" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalGoods = await Donation.countDocuments({
      donation_type: "goods",
    });
    const recentDonations = await Donation.find()
      .populate("received_by", "username")
      .populate("campaign_id", "title")
      .sort({ date_received: -1 })
      .limit(5);

    res.json({
      totalDonations,
      totalCashAmount:
        totalCashAmount.length > 0 ? totalCashAmount[0].total : 0,
      totalGoods,
      recentDonations,
    });
  } catch (error) {
    console.error("Error getting donation stats:", error);
    res.status(500).json({
      message: "Failed to get donation statistics",
      error: error.message,
    });
  }
});

// ---------- CAMPAIGN ROUTES ----------

// Get all campaigns with filtering
router.get("/campaigns", authenticateToken, async (req, res) => {
  try {
    const { title, status, start_date, end_date, created_by } = req.query;
    const filter = {};

    if (title) filter.title = { $regex: title, $options: "i" };
    if (status) filter.status = status;
    if (created_by) filter.created_by = created_by;
    if (start_date) filter.start_date = { $gte: new Date(start_date) };
    if (end_date) filter.end_date = { $lte: new Date(end_date) };

    const campaigns = await Campaign.find(filter)
      .populate("created_by", "username email")
      .populate("attachments") // Populate attachment details
      .sort({ start_date: -1 });

    const campaignsWithStats = await Promise.all(
      campaigns.map(async (campaign) => {
        const campaignObj = campaign.toObject();
        const donationCount = await Donation.countDocuments({
          campaign_id: campaign._id,
        });
        campaignObj.donation_count = donationCount;
        return campaignObj;
      })
    );

    res.json({ campaigns: campaignsWithStats });
  } catch (error) {
    console.error("Error getting campaigns:", error);
    res
      .status(500)
      .json({ message: "Failed to get campaigns", error: error.message });
  }
});

// Get campaign by ID
router.get("/campaigns/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid campaign ID" });
    }

    const campaign = await Campaign.findById(id)
      .populate("created_by", "username email")
      .populate("attachments");

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    const donations = await Donation.find({ campaign_id: id })
      .populate("received_by", "username")
      .sort({ date_received: -1 });

    const campaignObj = campaign.toObject();
    campaignObj.donations = donations;
    campaignObj.donation_count = donations.length;

    res.json({ campaign: campaignObj });
  } catch (error) {
    console.error("Error getting campaign:", error);
    res
      .status(500)
      .json({ message: "Failed to get campaign", error: error.message });
  }
});

// Create campaign with file upload
router.post(
  "/campaigns",
  authenticateToken,
  upload.array("attachments", 5),
  async (req, res) => {
    try {
      const { title, description, start_date, end_date, goal_amount, status } =
        req.body;

      if (!title || !description || !start_date || !goal_amount) {
        return res.status(400).json({
          message:
            "Title, description, start date, and goal amount are required",
          fields: {
            title: !title,
            description: !description,
            start_date: !start_date,
            goal_amount: !goal_amount,
          },
        });
      }

      // Create campaign first (without attachments)
      const newCampaign = await Campaign.create({
        title,
        description,
        start_date: new Date(start_date),
        end_date: end_date ? new Date(end_date) : null,
        created_by: req.user.id,
        goal_amount: Number(goal_amount) || 0,
        status: status || "active",
        attachments: [],
        current_amount: 0,
      });

      // Save attachments to MongoDB with the campaign ID
      const attachmentIds = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const attachment = new Attachment({
            campaignId: newCampaign._id, // Use the new campaign ID
            fileName: file.originalname,
            fileData: file.buffer,
            contentType: file.mimetype,
            size: file.size,
          });
          await attachment.save();
          attachmentIds.push(attachment._id);
        }

        // Update campaign with attachment IDs
        if (attachmentIds.length > 0) {
          await Campaign.findByIdAndUpdate(newCampaign._id, {
            attachments: attachmentIds,
          });
        }
      }

      const populatedCampaign = await Campaign.findById(newCampaign._id)
        .populate("attachments")
        .populate("created_by", "username email");

      res.status(201).json({
        message: "Campaign created successfully",
        campaign: populatedCampaign,
      });
    } catch (error) {
      console.error("Error creating campaign:", error);
      res
        .status(500)
        .json({ message: "Failed to create campaign", error: error.message });
    }
  }
);

// Update campaign with file upload
router.put(
  "/campaigns/:id",
  authenticateToken,
  upload.array("attachments", 5),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        title,
        description,
        start_date,
        end_date,
        goal_amount,
        status,
        remove_attachments,
      } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid campaign ID" });
      }

      const campaign = await Campaign.findById(id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      if (
        req.user.role !== "admin" &&
        campaign.created_by.toString() !== req.user.id
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this campaign" });
      }

      // Handle attachment removal
      let attachments = [...campaign.attachments];
      if (remove_attachments && remove_attachments.trim() !== "") {
        try {
          const removeList = JSON.parse(remove_attachments); // Expecting array of attachment IDs
          attachments = attachments.filter(
            (attachmentId) => !removeList.includes(attachmentId.toString())
          );
          await Attachment.deleteMany({ _id: { $in: removeList } });
        } catch (err) {
          console.error("Error removing attachments:", err);
        }
      }

      // Add new attachments
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const attachment = new Attachment({
            campaignId: id,
            fileName: file.originalname,
            fileData: file.buffer,
            contentType: file.mimetype,
            size: file.size,
          });
          await attachment.save();
          attachments.push(attachment._id);
        }
      }

      // Update campaign
      const updatedCampaign = await Campaign.findByIdAndUpdate(
        id,
        {
          ...(title && { title }),
          ...(description && { description }),
          ...(start_date && { start_date: new Date(start_date) }),
          ...(end_date && { end_date: end_date ? new Date(end_date) : null }),
          ...(goal_amount && { goal_amount: Number(goal_amount) }),
          ...(status && { status }),
          attachments,
        },
        { new: true, runValidators: true }
      ).populate("attachments");

      res.json({
        message: "Campaign updated successfully",
        campaign: updatedCampaign,
      });
    } catch (error) {
      console.error("Error updating campaign:", error);
      res
        .status(500)
        .json({ message: "Failed to update campaign", error: error.message });
    }
  }
);

// Delete campaign (admin only)
router.delete("/campaigns/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid campaign ID" });
    }

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // Delete attachments from MongoDB
    if (campaign.attachments && campaign.attachments.length > 0) {
      await Attachment.deleteMany({ _id: { $in: campaign.attachments } });
    }

    // Delete campaign
    await Campaign.findByIdAndDelete(id);

    // Update donations to remove campaign reference
    await Donation.updateMany(
      { campaign_id: id },
      { $unset: { campaign_id: 1 } }
    );

    res.json({ message: "Campaign deleted successfully" });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    res
      .status(500)
      .json({ message: "Failed to delete campaign", error: error.message });
  }
});

// Serve attachment
router.get("/attachments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    // Verify token if provided in query parameter
    let isAuthenticated = false;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        isAuthenticated = true;
      } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }
    } else if (req.headers.authorization) {
      // Also check for token in Authorization header
      const authHeader = req.headers.authorization;
      const headerToken = authHeader && authHeader.split(" ")[1];
      if (headerToken) {
        try {
          const decoded = jwt.verify(headerToken, process.env.JWT_SECRET);
          req.user = decoded;
          isAuthenticated = true;
        } catch (err) {
          return res.status(401).json({ message: "Invalid or expired token" });
        }
      }
    }

    if (!isAuthenticated) {
      return res.status(401).json({ message: "Authentication token required" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid attachment ID" });
    }

    const attachment = await Attachment.findById(id);
    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    res.set({
      "Content-Type": attachment.contentType,
      "Content-Disposition": `attachment; filename="${attachment.fileName}"`,
    });
    res.send(attachment.fileData);
  } catch (error) {
    console.error("Error retrieving attachment:", error);
    res
      .status(500)
      .json({ message: "Failed to retrieve attachment", error: error.message });
  }
});

// ---------- USER ROUTES ----------

// Get all users (admin only)
router.get("/users", authenticateToken, async (req, res) => {
  try {
    const users = await User.find({}, "-password_hash -__v");
    res.json({ users });
  } catch (error) {
    console.error("Error getting users:", error);
    res
      .status(500)
      .json({ message: "Failed to get users", error: error.message });
  }
});

// Get user by ID (admin only or own user)
router.get("/users/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Only allow admins or the user themselves to access user data
    if (req.user.role !== "admin" && req.user.id !== id) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this user data" });
    }

    const user = await User.findById(id, "-password_hash -__v");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Error getting user:", error);
    res
      .status(500)
      .json({ message: "Failed to get user", error: error.message });
  }
});

// ---------- DASHBOARD ROUTES ----------

// Get dashboard overview data
router.get("/dashboard/overview", authenticateToken, async (req, res) => {
  try {
    // Donation statistics
    const totalDonations = await Donation.countDocuments();
    const totalCashAmount = await Donation.aggregate([
      { $match: { donation_type: "cash" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalGoods = await Donation.countDocuments({
      donation_type: "goods",
    });

    // Recent donations
    const recentDonations = await Donation.find()
      .populate("received_by", "username")
      .populate("campaign_id", "title")
      .sort({ date_received: -1 })
      .limit(5);

    // Campaign statistics
    const totalCampaigns = await Campaign.countDocuments();
    const activeCampaigns = await Campaign.countDocuments({ status: "active" });
    const completedCampaigns = await Campaign.countDocuments({
      status: "completed",
    });

    // Campaign aggregates
    const campaignStats = await Campaign.aggregate([
      {
        $group: {
          _id: null,
          totalGoal: { $sum: "$goal_amount" },
          totalCurrent: { $sum: "$current_amount" },
        },
      },
    ]);

    // Top campaigns
    const topCampaigns = await Campaign.find()
      .sort({ current_amount: -1 })
      .limit(3)
      .populate("created_by", "username");

    // Monthly donation trends (for the last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyDonations = await Donation.aggregate([
      {
        $match: {
          date_received: { $gte: sixMonthsAgo },
          donation_type: "cash",
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date_received" },
            month: { $month: "$date_received" },
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Format monthly data
    const monthlyData = monthlyDonations.map((item) => ({
      month: `${item._id.year}-${item._id.month.toString().padStart(2, "0")}`,
      total: item.total,
      count: item.count,
    }));

    // Recent users
    let recentUsers = [];
    if (req.user.role === "admin") {
      recentUsers = await User.find()
        .select("-password_hash")
        .sort({ created_at: -1 })
        .limit(5);
    }

    res.json({
      stats: {
        donations: {
          total: totalDonations,
          totalCashAmount:
            totalCashAmount.length > 0 ? totalCashAmount[0].total : 0,
          totalGoods,
        },
        campaigns: {
          total: totalCampaigns,
          active: activeCampaigns,
          completed: completedCampaigns,
          totalGoalAmount:
            campaignStats.length > 0 ? campaignStats[0].totalGoal : 0,
          totalRaisedAmount:
            campaignStats.length > 0 ? campaignStats[0].totalCurrent : 0,
          progressPercentage:
            campaignStats.length > 0 && campaignStats[0].totalGoal > 0
              ? Math.round(
                  (campaignStats[0].totalCurrent / campaignStats[0].totalGoal) *
                    100
                )
              : 0,
        },
      },
      recentDonations,
      topCampaigns,
      monthlyData,
      recentUsers,
    });
  } catch (error) {
    console.error("Error getting dashboard overview:", error);
    res.status(500).json({
      message: "Failed to get dashboard overview",
      error: error.message,
    });
  }
});

// Simple test route
router.get("/", (req, res) => {
  res.json({ message: "Data API is working" });
});

export default router;
