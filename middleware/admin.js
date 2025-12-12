// module.exports = function (req, res, next) {
//   if (req.userRole !== "admin") {
//     return res.status(403).json({
//       success: false,
//       message: "Access denied. Admin only"
//     });
//   }
//   next();
// };



const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.id;
    req.userRole = decoded.role;   // 🔥 YEH LINE ZARURI HAI
    next();
  } catch (error) {
    res.status(400).json({ success: false, message: "Invalid token" });
  }
};
