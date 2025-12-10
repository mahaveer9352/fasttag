const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * REGISTER USER
 */
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, mobile, password } = req.body;

    if (!firstName || !lastName || !email || !mobile || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // Check existing email
    const existEmail = await User.findOne({ email });
    if (existEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    const userData = {
      firstName,
      lastName,
      email,
      mobile,
      password: hash,
      wallet: { balance: 0 }
    };

    // Add Profile Image
    if (req.file) {
      userData.profileImage = req.file.path.replace(/\\/g, "/");
    }

    const user = await User.create(userData);

    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobile: user.mobile,
        profileImage: user.profileImage || null,
        wallet: user.wallet,
        token,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * LOGIN USER
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      success: true,
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobile: user.mobile,
        profileImage: user.profileImage,
        wallet: user.wallet,
        token,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * GET USER PROFILE
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user)
      return res.status(404).json({
        success: false,
        message: "User not found"
      });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
