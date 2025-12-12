const { default: axios } = require("axios");
const User = require("../models/User");
const Transaction = require("../models/walletTranstion");
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

    const loginUser = req.userId;
    const user = await User.findById(loginUser);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found!" });
    }

    if (user.wallet.balance < transactionAmount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance!"
      });
    }

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

    const response = await client.post("/payment", payload, {
      headers: {
        "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MTg0M2E4ZWZmNzA0ZjUwOWVlNzkyZSIsInJvbGUiOiJSZXRhaWxlciIsIm1vYmlsZU51bWJlciI6IjgwMDM3Njc3MzIiLCJpYXQiOjE3NjUzNjI3MjUsImV4cCI6MTc2Nzk1NDcyNX0.jCgTJTxbX3wQXri3YEpwV21lmVTQ-1BKWij491IQ_oo"
      }
    });
    const apiData = response.data;


    const isSuccess = apiData.statuscode === "TXN";


    let newBalance = user.wallet.balance;


    if (isSuccess) {
      newBalance = user.wallet.balance - Number(transactionAmount);

      await User.findByIdAndUpdate(loginUser, {
        $set: { "wallet.balance": newBalance }
      });
    }


    await Transaction.create({
      user_id: loginUser,
      transaction_type: "debit",
      type: billerId.categoryName || "FASTag",
      amount: Number(transactionAmount),
      charge: 0,
      gst: 0,
      tds: 0,
      totalDebit: Number(transactionAmount),
      totalCredit: 0,
      balance_after: newBalance,
      status: isSuccess ? "Success" : "Failed",
      payment_mode: paymentMode,
      transaction_reference_id: apiData?.data?.txnReferenceId || externalRef,
      description: isSuccess
        ? `Recharge Successful (${apiData?.data?.billerDetails?.name})`
        : "Recharge Failed",
      meta: {
        api_raw: apiData,
        billerId,
        enquiryReferenceId,
        vehicle: apiData?.data?.billerDetails?.account,
        customerName: apiData?.data?.billDetails?.CustomerName
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


// direct pay without wallet
exports.startFastagPayment = async (req, res) => {
  try {
    const { amount, email, billerId, enquiryReferenceId, inputParameters, userId, initChannel } = req.body;

    if (!amount || !email || !billerId || !enquiryReferenceId || !initChannel) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    // console.log("bodyyyyyy", req.body)
    // console.log("billerId", billerId)
    const referenceId = `FTG${Date.now()}`;
    // Save transaction (Pending)
    const txn = await Transaction.create({
      user_id: userId || "69391335a77694961cfc623b",
      transaction_reference_id: referenceId,
      amount,
      status: "Pending",
      transaction_type: "debit",
      type: "FASTAG",
      balance_after: 0,
      fastagMeta: billerId,
      enquiryReferenceId: enquiryReferenceId,
      inputParameters: inputParameters,
      initChannel: initChannel
    });
    console.log("txn", txn)
    // PAYMENT GATEWAY CALL
    const payload = {
      amount,
      email,
      reference: referenceId
    };

    const pgRes = await axios.post("https://server.finuniques.in/api/v1/payment/payin",
      payload, {
      headers: { "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MTg0M2E4ZWZmNzA0ZjUwOWVlNzkyZSIsInJvbGUiOiJSZXRhaWxlciIsIm1vYmlsZU51bWJlciI6IjgwMDM3Njc3MzIiLCJpYXQiOjE3NjUzNjI3MjUsImV4cCI6MTc2Nzk1NDcyNX0.jCgTJTxbX3wQXri3YEpwV21lmVTQ-1BKWij491IQ_oo" }
    }
    )

    return res.json({
      success: true,
      redirectURL: pgRes.data?.data?.redirectURL,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Payment init failed" });
  }
};

exports.callbackPayIn = async (req, res) => {
  try {
    console.log("xxxxxxxxxxxxxxxxxxxxx")
    const data = req.body;
    const orderId = data.orderId;
    const isSuccess = data.responseCode?.toString() == "100";

    const txn = await Transaction.findOne({ transaction_reference_id: orderId });
    console.log("txn", txn)
    if (!txn) return res.send("Transaction Not Found");

    // Update transaction status
    txn.status = isSuccess ? "Success" : "Failed";
    txn.meta = data;
    await txn.save();

    if (!isSuccess) {
      return res.send("Payment Failed");
    }

    // -------------------------------------
    // FASTAG PAYMENT API TRIGGER AFTER CALLBACK
    // -------------------------------------
    const generateExternalRef = () => {
      const timestamp = Date.now();
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      return `EXT${timestamp}${randomNum}`;
    };

    const fastagPayload = {
      user_id: "691843a8eff704f509ee792e",
      billerId: txn.fastagMeta,
      externalRef: generateExternalRef(),
      enquiryReferenceId: txn.enquiryReferenceId,
      inputParameters: txn.inputParameters,
      transactionAmount: txn.amount,
      paymentMode: "Cash",
      initChannel: txn.initChannel,
      mpin: "111111",
      category: "6900ac095c8974d579180b2c"
    };
    console.log(fastagPayload)

    const fastagRes = await client.post("/payment", fastagPayload, {
      headers: {
        "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MTg0M2E4ZWZmNzA0ZjUwOWVlNzkyZSIsInJvbGUiOiJSZXRhaWxlciIsIm1vYmlsZU51bWJlciI6IjgwMDM3Njc3MzIiLCJpYXQiOjE3NjUzNjI3MjUsImV4cCI6MTc2Nzk1NDcyNX0.jCgTJTxbX3wQXri3YEpwV21lmVTQ-1BKWij491IQ_oo"
      }
    });

    console.log("FASTag Payment Done", fastagRes.data);

    // update description
    txn.fastagPaymentResponse = fastagRes.data;
    await txn.save();

    return res.send("Payment Successful & FASTag Recharge Done");

  } catch (error) {
    console.error("Callback Error:", error);
    res.status(500).send("Internal callback error");
  }
};
