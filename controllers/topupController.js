const User = require("../models/User");


const merchant_identifier = process.env.ZAAKPAY_MERCHANT_CODE || "b19e8f103bce406cbd3476431b6b7973"
const secretKey = process.env.ZAAKPAY_SECRET_KEY || "0678056d96914a8583fb518caf42828a";


function generateZaakpayChecksum(params, secretKey) {
  // 1️⃣ Filter out null, undefined, or empty values
  const filteredParams = Object.keys(params)
    .filter((key) => params[key] !== null && params[key] !== undefined && params[key] !== "")
    .sort() // 2️⃣ Sort alphabetically
    .map((key) => `${key}=${params[key]}`) // 3️⃣ Combine key=value
    .join("&") + "&"; // 4️⃣ Append & at end

  console.log("✅ String used for checksum:", filteredParams);

  // 5️⃣ Generate HMAC SHA256
  const checksum = crypto
    .createHmac("sha256", secretKey)
    .update(filteredParams)
    .digest("hex");

  console.log("✅ Generated Checksum:", checksum);
  return checksum;
}


exports.generatePayment = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    let transactionCompleted = false;

    try {

        // const tokenResponse = await axios.post(
        //   "https://admin.finuniques.in/api/v1.1/t1/oauth/token",

        //   new URLSearchParams({
        //     authKey: "UTI6tamscw",
        //     authSecret: "4jtudpz0ri1x2t@y",
        //   }),
        //   {
        //     headers: { "Content-Type": "application/x-www-form-urlencoded" },
        //   }
        // );

        // const accessToken = tokenResponse?.data?.data?.access_token;

        // if (!accessToken) {
        //   return res
        //     .status(400)
        //     .json({ success: false, message: "Failed to fetch token" });
        // }

        const { userId, amount, category = "69098858833bc4bd990d6e22", reference, name, mobile, email } = req.body;

        if (!amount || !email) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        const user = await User.findOne({
            _id: req?.user?.id || userId,
            status: true,
        }).session(session);

        const service = await servicesModal.findOne({ _id: category });
        if (!service) {
            return res.status(400).json({ success: false, message: "Service not found" });
        }

        if (!user) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: "User not found or inactive" });
        }


        const referenceId = `ZAAK${ Date.now()
    }${ Math.floor(1000 + Math.random() * 9000) }`;


// 🔹 Prepare Zaakpay payload
const payload = {
    amount: (amount * 100).toString(),
    buyerEmail: email,
    currency: "INR",
    merchantIdentifier: merchant_identifier,
    orderId: reference || referenceId,
    returnUrl: "https://server.finuniques.in/api/v1/payment/payin/callback"
    // returnUrl: "https://gkns438l-8080.inc1.devtunnels.ms/api/v1/payment/payin/callback"
};
const checksum = generateZaakpayChecksum(payload, secretKey);

const payload2 = {
    ...payload,
    checksum,
};
// return
payIn.remark = "Redirect to Zaakpay for payment";
transaction.description = "Redirect to Zaakpay for payment";

await user.save({ session });
await session.commitTransaction();
transactionCompleted = true;

} catch (error) {
   
    console.error("❌ PayIn Error:", error);
    return res.status(500).json({
        success: false,
        message: error.message || "Something went wrong while processing payment",
    });
} finally {
    session.endSession();
}
};