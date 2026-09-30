const mongoose = require("mongoose");

async function connectDB() {
  try {
    const mongoURI =
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/rxchain";

    await mongoose.connect(mongoURI);

    console.log("[db] MongoDB connected ->", mongoURI);
  } catch (error) {
    console.error("[db] MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

module.exports = connectDB;