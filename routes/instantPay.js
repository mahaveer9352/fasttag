const express = require("express");
const router = express.Router();
const {
  getBillerList,
  getBillerDetails,
  preEnquiry,
  fastagPayment
} = require("../controllers/instantPayController");
const auth = require("../middleware/auth");

// FASTag Routes
router.post("/billers", getBillerList);
router.post("/biller-details", getBillerDetails);
router.post("/pre-enquiry", preEnquiry);
router.post("/payment",auth, fastagPayment);


module.exports = router;
