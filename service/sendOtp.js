const axios = require("axios");

const sendOtp = async (mobileNumber, otp) => {
  try {
    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;

    const payload = {
      template_id: templateId,
      recipients: [
        {
          mobiles: "91" + mobileNumber,
          OTP: otp,
        },
      ],
    };

    const response = await axios.post(
      "https://control.msg91.com/api/v5/flow",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          authkey: authKey,
        },
      }
    );

    return { success: true, message: "OTP sent successfully" };
  } catch (error) {
    return { success: false, message: "Failed to send OTP" };
  }
};

module.exports = { sendOtp };