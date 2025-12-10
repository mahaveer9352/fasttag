const client = require("../utils/instantPayClient");

// ---------------------------------------------------
// 1️⃣ GET BILLERS LIST (categoryKey = C10)
// ---------------------------------------------------
exports.getBillerList = async (req, res) => {
  try {
    const { filters } = req.body;

    if (!filters) {
      return res.status(400).json({ success: false, message: "categoryKey is required" });
    }

    const response = await client.post("/billers", { filters });
    console.log("sdfsdfsdf", response);

    res.json({
      success: true,
      message: "Biller list fetched",
      data: response.data
    });

  } catch (error) {
    console.error("Biller List Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


// ---------------------------------------------------
// 2️⃣ GET BILLER DETAILS (billerId required)
// ---------------------------------------------------
exports.getBillerDetails = async (req, res) => {
  try {
    const { billerId } = req.body;

    if (!billerId) {
      return res.status(400).json({ success: false, message: "billerId is required" });
    }

    const response = await client.post("/biller-details", { billerId });

    res.json({
      success: true,
      message: "Biller details fetched",
      data: response.data
    });

  } catch (error) {
    console.error("Biller Details Error:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


// ---------------------------------------------------
// 3️⃣ PRE-ENQUIRY (FASTag Validation)
// ---------------------------------------------------
exports.preEnquiry = async (req, res) => {
  try {
    const { billerId, externalRef, initChannel, param1 } = req.body;

    if (!billerId || !externalRef || !initChannel || !param1) {
      return res.status(400).json({
        success: false,
        message: "billerId, externalRef, initChannel & param1 required"
      });
    }

    const payload = {
      billerId,
      externalRef,
      initChannel,
      inputParameters: {
        param1
      }
    };

    const response = await client.post("/pre-enquiry", payload);

    res.json({
      success: true,
      message: "Pre Enquiry successful",
      data: response.data
    });

  } catch (error) {
    console.error("Pre Enquiry Error:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};



// ---------------------------------------------------
// 4️⃣ FASTag PAYMENT API
// ---------------------------------------------------
exports.fastagPayment = async (req, res) => {
  try {
    const {
      billerId,
      externalRef,
      enquiryReferenceId,
      inputParameters,
      transactionAmount,
      paymentMode,
      initChannel,
      mpin,
      category
    } = req.body;

    // Basic validation
    if (
      !billerId ||
      !externalRef ||
      !enquiryReferenceId ||
      !transactionAmount ||
      !paymentMode ||
      !initChannel ||
      !mpin ||
      !category
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing!"
      });
    }

    // Fixed user_id (as you said)
    const user_id = "691843a8eff704f509ee792e";

    const payload = {
      user_id,
      billerId,
      externalRef,
      enquiryReferenceId: String(enquiryReferenceId),
      inputParameters,
      transactionAmount: Number(transactionAmount),
      paymentMode,
      initChannel,
      mpin,
      category
    };

    const response = await client.post("/payment", payload,{
        headers:{
            "authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MTg0M2E4ZWZmNzA0ZjUwOWVlNzkyZSIsInJvbGUiOiJSZXRhaWxlciIsIm1vYmlsZU51bWJlciI6IjgwMDM3Njc3MzIiLCJpYXQiOjE3NjUzNjI3MjUsImV4cCI6MTc2Nzk1NDcyNX0.jCgTJTxbX3wQXri3YEpwV21lmVTQ-1BKWij491IQ_oo"
        }
    });

    res.json({
      success: true,
      message: "FASTag Payment Successful",
      data: response.data
    });

  } catch (error) {
    console.error("FASTag Payment Error:", error || error.message);
    res.status(500).json({
      success: false,
      message: "Payment Failed",
      error: error?.response?.data || error.message
    });
  }
};