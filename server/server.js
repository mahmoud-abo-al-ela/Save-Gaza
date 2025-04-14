// server.js
import express from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDb from "./config/db.js"; // Import connectDb
import authRoutes from "./routes/auth.js";
import dataRoutes from "./routes/data.js";

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
const allowedOrigins = [
  process.env.CORS_ORIGIN,
  "http://localhost:3000",
  "https://save-gaza-fehz.onrender.com", // Add frontend URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to the Save Gaza API");
});

app.use("/api/auth", authRoutes);
app.use("/api/data", dataRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Start server and connect to MongoDB
const PORT = process.env.PORT || 5100;
const startServer = async () => {
  try {
    await connectDb(); // Use connectDb
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
