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
      // userData.profileImage = req.file.path.replace(/\\/g, "/");
      userData.profileImage = "/uploads/" + req.file.filename;

    }

    const user = await User.create(userData);

    // Create token
    // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    //   expiresIn: "7d",
    // });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
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

    // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    //   expiresIn: "7d",
    // });


    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
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

/**
 * UPDATE USER PROFILE
 */
// exports.updateProfile = async (req, res) => {
//   try {
//     const { firstName, lastName, mobile } = req.body;

//     const updateData = {};

//     if (firstName) updateData.firstName = firstName;
//     if (lastName) updateData.lastName = lastName;
//     if (mobile) updateData.mobile = mobile;

//     // If new profile image uploaded
//     if (req.file) {
//       // updateData.profileImage = req.file.path.replace(/\\/g, "/");
//   updateData.profileImage = "/uploads/" + req.file.filename;

//     }

//     const updatedUser = await User.findByIdAndUpdate(
//       req.userId,
//       updateData,
//       { new: true }
//     ).select("-password");

//     res.json({
//       success: true,
//       message: "Profile updated successfully",
//       data: updatedUser
//     });

//   } catch (error) {
//     console.error("Update Profile Error:", error);
//     res.status(500).json({ success: false, message: "Server Error" });
//   }
// };


// exports.getAllUsers = async (req, res) => {
//   try {
//     const users = await User.find().select("-password");
//     res.json({ success: true, total: users.length, data: users });
//   } catch (error) {
//     console.error("Get Users Error:", error);
//     res.status(500).json({ success: false, message: "Server Error" });
//   }
// };


exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, mobile, userId , role,email } = req.body;

    let targetUserId;

    // Admin can update any user by sending userId
    if (req.userRole === "admin" && userId) {
      targetUserId = userId;
    } else {
      // Normal user can update only self
      targetUserId = req.userId;
    }

    const updateData = {};

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (mobile) updateData.mobile = mobile;
    if (role) updateData.role = role;
    if (email) updateData.email = email;

    // If new profile image uploaded
    if (req.file) {
      updateData.profileImage = "/uploads/" + req.file.filename;
    }

    const updatedUser = await User.findByIdAndUpdate(
      targetUserId,
      updateData,
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser
    });

  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


exports.getAllUsers = async (req, res) => {
  try {
    let { page = 1, limit = 10, role, search } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const query = {};

    // Filter by role (admin/user)
    if (role) {
      query.role = role;
    }

    // Search by name or email or mobile
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } }
      ];
    }

    const totalUsers = await User.countDocuments(query);

    const users = await User.find(query)
      .select("-password")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      total: totalUsers,
      page,
      totalPages: Math.ceil(totalUsers / limit),
      data: users
    });
  } catch (error) {
    console.error("Get Users Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    // If user is not admin, they can view only their own data
    if (req.userRole !== "admin" && req.userId !== userId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, data: user });
  } catch (error) {
    console.error("Get Single User Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
