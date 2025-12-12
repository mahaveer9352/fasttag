const express = require("express");
const router = express.Router();
const {
  getBillerList,
  getBillerDetails,
  preEnquiry,
  fastagPayment,
  startFastagPayment,
  callbackPayIn
} = require("../controllers/instantPayController");
const auth = require("../middleware/auth");

// FASTag Routes
router.post("/billers", getBillerList);
router.post("/biller-details", getBillerDetails);
router.post("/pre-enquiry", preEnquiry);
router.post("/start-fastag-payment", startFastagPayment);
router.post("/start-fastag-payment/callback", callbackPayIn);
router.post("/payment", auth, fastagPayment);


module.exports = router;
