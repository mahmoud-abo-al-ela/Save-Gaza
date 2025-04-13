// connectDb.js
import mongoose from "mongoose";

const connectDb = async () => {
  try {
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      // Removed deprecated options
    });
    console.log(`MongoDB connected: ${db.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDb;
