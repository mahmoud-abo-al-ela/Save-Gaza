import mongoose from "mongoose";
import bcrypt from "bcrypt";

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      trim: true,
      required: [true, "Username is required"],
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [30, "Username cannot exceed 30 characters"],
    },
    password_hash: {
      type: String,
      required: [true, "Password is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    role: {
      type: String,
      required: [true, "Role is required"],
      enum: {
        values: ["admin", "editor"],
        message: "Role must be either 'admin' or 'editor'",
      },
      default: "editor",
    },
    last_login: {
      type: Date,
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
    },
    login_attempts: {
      type: Number,
      default: 0,
    },
    locked_until: {
      type: Date,
      default: null,
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
      transform: function (doc, ret) {
        delete ret.password_hash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for efficient queries
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ role: 1 });

// Middleware to hash password before saving
UserSchema.pre("save", async function (next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified("password_hash")) return next();

  try {
    // Generate a salt with 12 rounds (stronger than 10)
    const salt = await bcrypt.genSalt(12);
    // Hash the password
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update timestamp on update
UserSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updated_at: Date.now() });
  next();
});

// Static method to validate password strength
UserSchema.statics.validatePasswordStrength = function (password) {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Method to compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password_hash);
};

// Method to record login
UserSchema.methods.recordLogin = async function () {
  this.last_login = Date.now();
  this.login_attempts = 0;
  this.locked_until = null;
  await this.save();
};

// Method to record failed login
UserSchema.methods.recordFailedLogin = async function () {
  this.login_attempts += 1;

  // Lock account after 5 failed attempts
  if (this.login_attempts >= 5) {
    // Lock for 30 minutes
    this.locked_until = new Date(Date.now() + 30 * 60 * 1000);
  }

  await this.save();
};

// Method to check if account is locked
UserSchema.methods.isLocked = function () {
  if (!this.locked_until) return false;
  return new Date(this.locked_until) > new Date();
};

const User = mongoose.model("User", UserSchema);

export default User;
