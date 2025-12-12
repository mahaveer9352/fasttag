const router = require("express").Router();
const controller = require("../controllers/authController");

// OTP
router.post("/send-otp", controller.sendOtp);
router.post("/verify-otp", controller.verifyOtp);

// USERS
router.get("/", controller.getUsers);
router.get("/:id", controller.getUserById);
router.put("/:id", controller.updateUser);

module.exports = router;
