// const { generateOtp, verifyOtp } = require("../service/otpService");
// const { sendOtp } = require("../service/sendOtp");

// exports.sendOtpController = async (req, res) => {
//   try {
//     const { mobileNumber } = req.body;

//     if (!mobileNumber) {
//       return res.status(400).json({
//         success: false,
//         message: "Mobile number is required",
//       });
//     }

//     // Generate OTP
//     const otp = await generateOtp(mobileNumber);

//     // Send OTP via MSG91
//     const result = await sendOtp(mobileNumber, otp);

//     if (!result.success) {
//       return res.status(500).json({
//         success: false,
//         message: result.message || "Failed to send OTP",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "OTP sent successfully",
//     });

//   } catch (error) {
//     console.error("Send OTP Controller Error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to send OTP",
//     });
//   }
// };

// exports.verifyOtpController = async (req, res) => {
//   try {
//     const { mobileNumber, otp } = req.body;

//     if (!mobileNumber || !otp) {
//       return res.status(400).json({
//         success: false,
//         message: "Mobile number and OTP are required",
//       });
//     }

//     const result = await verifyOtp(mobileNumber, otp);

//     if (!result.success) {
//       return res.status(400).json({
//         success: false,
//         message: result.message,
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "OTP verified successfully",
//     });

//   } catch (error) {
//     console.error("Verify OTP Controller Error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to verify OTP",
//     });
//   }
// };
