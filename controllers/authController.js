const { User } = require("../models/User");
const { generateOtp, verifyOtp } = require("../service/otpService");
const { sendOtp } = require("../service/sendOtp");
const jwt = require("jsonwebtoken");

exports.sendOtp = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile)
      return res.status(400).json({ message: "Mobile is required" });

    const otp = await generateOtp(mobile);

    const response = await sendOtp(mobile, otp);

    if (!response.success) {
      return res.status(400).json(response);
    }

    res.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    const result = await verifyOtp(mobile, otp);

    if (!result.success)
      return res.status(400).json(result);

    let user = await User.findOne({ mobile });

    if (!user) {
      user = await User.create({
        mobile,
        wallet: { balance: 0 },
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ success: true, user, token });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user)
      return res.status(404).json({ message: "User not found" });

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const data = req.body;
    data["wallet.lastUpdated"] = Date.now();

    const updated = await User.findByIdAndUpdate(req.params.id, data, {
      new: true,
    });

    return res.json({ success: true, updated });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
