const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    mobileNumber: { type: String, required: true },
    otp: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now, expires: 300 },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },

    email: { type: String, sparse: true, lowercase: true },
    mobile: { type: String, required: true },

    profileImage: { type: String },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    wallet: {
      balance: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now },
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
const OTP = mongoose.model("OTP", otpSchema);

module.exports = { User, OTP };
