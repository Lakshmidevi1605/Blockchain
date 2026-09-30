const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    registrationId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["doctor", "patient", "pharmacy", "admin"],
      required: true,
    },

    specialization: {
      type: String,
      default: "",
    },

    licenseNumber: {
      type: String,
      default: "",
    },

    dateOfBirth: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);