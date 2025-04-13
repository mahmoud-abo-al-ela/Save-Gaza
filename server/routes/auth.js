// server/routes/auth.js
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const router = express.Router();

// User login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Please provide both username and password",
        field: !username ? "username" : "password",
      });
    }

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({
        message: "Invalid username or password",
        field: "username",
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      const lockTime = new Date(user.locked_until);
      const now = new Date();
      const minutesLeft = Math.ceil((lockTime - now) / (1000 * 60));

      return res.status(403).json({
        message: `Account is temporarily locked. Please try again in ${minutesLeft} minutes.`,
        field: "username",
        locked: true,
        lockTime: user.locked_until,
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Record failed login attempt
      await user.recordFailedLogin();

      // Check if now locked after this attempt
      if (user.isLocked()) {
        return res.status(403).json({
          message:
            "Too many failed login attempts. Account locked for 30 minutes.",
          field: "password",
          locked: true,
          lockTime: user.locked_until,
        });
      }

      return res.status(400).json({
        message: "Invalid username or password",
        field: "password",
        attempts: user.login_attempts,
        remaining: 5 - user.login_attempts,
      });
    }

    // Record successful login
    await user.recordLogin();

    // Create JWT token with improved payload and security
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        username: user.username,
        timestamp: Date.now(),
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(500)
      .json({ message: "Server error during login", error: error.message });
  }
});

// User registration
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, role = "editor" } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
        fields: {
          username: !username,
          email: !email,
          password: !password,
        },
      });
    }

    // Validate password strength
    if (!User.validatePasswordStrength(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number and special character",
        field: "password",
      });
    }

    // Check if username or email already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({
          message: "Username already exists",
          field: "username",
        });
      }
      if (existingUser.email === email) {
        return res.status(400).json({
          message: "Email already exists",
          field: "email",
        });
      }
    }

    // Create new user
    const newUser = await User.create({
      username,
      email,
      password_hash: password, // Don't pre-hash, let the mongoose middleware handle it
      role,
    });

    // Create JWT token
    const token = jwt.sign(
      {
        id: newUser._id,
        role: newUser.role,
        username: newUser.username,
        timestamp: Date.now(),
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      message: "Server error during registration",
      error: error.message,
    });
  }
});

// Get current user
router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Authorization token required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        last_login: user.last_login,
      },
    });
  } catch (error) {
    console.error("Auth verification error:", error);
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Token expired, please log in again" });
    }
    if (error.name === "JsonWebTokenError") {
      return res
        .status(401)
        .json({ message: "Invalid token, please log in again" });
    }
    res
      .status(401)
      .json({ message: "Authentication failed", error: error.message });
  }
});

export default router;
