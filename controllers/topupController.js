const { default: mongoose } = require("mongoose");
const Transaction = require("../models/walletTranstion");
const crypto = require("crypto");
const qs = require("qs");
const logApiCall = require("./logs");
const { default: axios } = require("axios");
const { User } = require("../models/User");


exports.generatePayment = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    let transactionCompleted = false;

    try {

        const { userId, amount, reference, email } = req.body;
        if (amount > 100000) {
            return res.status(400).json({
                message: "maximum amount only 100000",
                success: false
            })
        }

        if (!amount || !email || !userId) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        const user = await User.findOne({
            _id: req?.user?.id || userId,
        }).session(session);

        if (!user) {
            await session.abortTransaction();
            // session.endSession();
            return res.status(404).json({ success: false, message: "User not found or inactive" });
        }


        const referenceId = `ZAAK${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;

        const [transaction] = await Transaction.create(
            [
                {
                    user_id: user._id,
                    transaction_type: "credit",
                    amount: Number(amount),
                    type: "Top-up",
                    balance_after: user.wallet.balance,
                    payment_mode: "wallet",
                    transaction_reference_id: reference || referenceId,
                    description: `Top-up initiated for ${user.name}`,
                    status: "Pending",
                },
            ],
            { session }
        );

        // 🔹 Prepare Zaakpay payload
        const payload = {
            amount: (amount).toString(),
            email: email,
            reference: referenceId
        };
        console.log("payload", payload)
        transaction.description = "Redirect to Zaakpay for payment";
        const Response = await axios.post("https://server.finuniques.in/api/v1/payment/payin",
            payload, {
            headers: { "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MTg0M2E4ZWZmNzA0ZjUwOWVlNzkyZSIsInJvbGUiOiJSZXRhaWxlciIsIm1vYmlsZU51bWJlciI6IjgwMDM3Njc3MzIiLCJpYXQiOjE3NjUzNjI3MjUsImV4cCI6MTc2Nzk1NDcyNX0.jCgTJTxbX3wQXri3YEpwV21lmVTQ-1BKWij491IQ_oo" }
        }
        )

        await user.save({ session });
        await transaction.save({ session });
        await session.commitTransaction();
        return res.status(200).json({
            success: true,
            message: "PayIn initiated. Redirect user to complete payment.",
            ress: Response.data
        });
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



exports.callbackPayIn = async (req, res) => {
    try {
        const data = req.body;
        logApiCall({ url: "/api/topup/wallet", requestData: "", responseData: data });
        const responseCode = data?.responseCode?.toString();
        const isSuccess = responseCode === "100";
        console.log("call back", data)
        // 👤 Find the related user
        const transaction = await Transaction.findOne({
            transaction_reference_id: data?.orderId
        });

        if (!transaction) {
            return res.send("Transaction not found");
        }
        const userr = await User.findById(transaction.user_id);

        if (!userr) {
            return res.send("User not found");
        }

        // 💳 Update Transaction report
        transaction.status = isSuccess ? "Success" : "Failed";
        transaction.payment_mode = data?.paymentMode || transaction.payment_mode;
        transaction.description = data?.responseDescription || transaction.description;
        transaction.meta = data;
        transaction.balance_after = userr.wallet.balance;

        await transaction.save();

        // 4️⃣ If success → Add amount to wallet
        if (isSuccess) {
            const amount = Number(data?.amount) / 100;

            userr.wallet.balance += amount;
            userr.wallet.lastUpdated = new Date();
            await userr.save();
            // Update transaction with final balance
            transaction.balance_after = userr.wallet.balance;
            await transaction.save();
        }
        const successHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Payment Successful</title>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f6fffa; padding: 40px; color: #333; }
          .container { max-width: 500px; margin: 40px auto; background: #fff; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); text-align: center; padding: 30px; }
          .icon { font-size: 70px; color: #4CAF50; }
          h1 { color: #4CAF50; margin-top: 20px; }
          .details { text-align: left; margin-top: 20px; background: #f8f9fa; padding: 15px; border-radius: 8px; font-size: 14px; }
          .footer { text-align: center; margin-top: 25px; font-size: 13px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">✅</div>
          <h1>Payment Successful</h1>
          <p>${data?.responseDescription || "Transaction completed successfully."}</p>
          <div class="details">
            <strong>Order ID:</strong> ${data?.orderId || "N/A"}<br/>
            <strong>Amount:</strong> ₹${(data?.amount / 100).toFixed(2) || "0"}<br/>
            <strong>Bank:</strong> ${data?.bank || "N/A"}<br/>
            <strong>Transaction ID:</strong> ${data?.pgTransId || "N/A"}<br/>
            <strong>Payment Mode:</strong> ${data?.paymentMode || "N/A"}<br/>
            <strong>Time:</strong> ${data?.pgTransTime || "N/A"}<br/>
          </div>
          <div class="footer">© ${new Date().getFullYear()} FINUNIQUE SMALL PRIVATE LIMITED</div>
        </div>
      </body>
      </html>
    `;

        const failureHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Payment Failed</title>
        <style>
          body { font-family: Arial, sans-serif; background-color: #fff6f6; padding: 40px; color: #333; }
          .container { max-width: 500px; margin: 40px auto; background: #fff; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); text-align: center; padding: 30px; }
          .icon { font-size: 70px; color: #f44336; }
          h1 { color: #f44336; margin-top: 20px; }
          .details { text-align: left; margin-top: 20px; background: #f8f9fa; padding: 15px; border-radius: 8px; font-size: 14px; }
          .footer { text-align: center; margin-top: 25px; font-size: 13px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">❌</div>
          <h1>Payment Failed</h1>
          <p>${data?.responseDescription || "Transaction failed. Please try again."}</p>
          <div class="details">
            <strong>Order ID:</strong> ${data?.orderId || "N/A"}<br/>
            <strong>Amount:</strong> ₹${(data?.amount / 100).toFixed(2) || "0"}<br/>
            <strong>Bank:</strong> ${data?.bank || "N/A"}<br/>
            <strong>Transaction ID:</strong> ${data?.pgTransId || "N/A"}<br/>
            <strong>Payment Mode:</strong> ${data?.paymentMode || "N/A"}<br/>
            <strong>Time:</strong> ${data?.pgTransTime || "N/A"}<br/>
          </div>
          <div class="footer">© ${new Date().getFullYear()} FINUNIQUE SMALL PRIVATE LIMITED </div>
        </div>
      </body>
      </html>
    `;


        return res.status(200).send(isSuccess ? successHTML : failureHTML);

    } catch (error) {
        console.error("🔥 Error in callback handler:", error.message);
        res.status(500).send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 40px;">
          <h1>500 - Internal Server Error</h1>
          <p>${error.message}</p> 
        </body>
      </html>
    `);
    }
};



exports.getWalletTransactions = async (req, res) => {
    try {
        const { userRole, userId } = req;

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search || "";
        const status = req.query.status || "";
        const type = req.query.type || "";
        const skip = (page - 1) * limit;

        const matchStage = {};

        // User-wise filter
        if (userRole !== "admin" && userRole !== "super_admin") {
            matchStage.user_id = new mongoose.Types.ObjectId(userId);
        }
        if (status) {
            matchStage.status = status;
        }
        if (type) {
            matchStage.type = type;
        }
        console.log(matchStage)
        // Search filter
        if (search) {
            matchStage.$or = [
                { transaction_reference_id: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },

                // 🔥 USER FIELDS SEARCH SUPPORT
                { "user.firstName": { $regex: search, $options: "i" } },
                { "user.lastName": { $regex: search, $options: "i" } },
                { "user.email": { $regex: search, $options: "i" } },
                { "user.mobile": { $regex: search, $options: "i" } }
            ];
        }

        // Aggregation pipeline
        const pipeline = [
            {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            { $match: matchStage },

            // Sort newest first
            { $sort: { createdAt: -1 } },

            // Pagination
            { $skip: skip },
            { $limit: limit },

            // Remove password etc.
            {
                $project: {
                    "user.password": 0,
                    "user.__v": 0,
                }
            }
        ];

        // Count Pipeline
        const countPipeline = [
            {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            { $match: matchStage },
            { $count: "total" }
        ];

        const transactions = await Transaction.aggregate(pipeline);
        const totalCount = await Transaction.aggregate(countPipeline);
        const total = totalCount[0]?.total || 0;

        return res.status(200).json({
            success: true,
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            nextPage: page * limit < total ? page + 1 : null,
            prevPage: page > 1 ? page - 1 : null,
            data: transactions,
        });

    } catch (error) {
        console.log("❌ Wallet Report Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getAdminDashboard = async (req, res) => {
    try {
        // Allow only admin & super admin
        if (req.userRole !== "admin" && req.userRole !== "super_admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin only."
            });
        }

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // --------------------------------------
        // 1️⃣ TOTAL USERS
        // --------------------------------------
        const totalUsers = await User.countDocuments();

        // --------------------------------------
        // 2️⃣ TOTAL FASTAG RECHARGES (all-time)
        // Replace Recharge with your FASTag recharge model
        // --------------------------------------
        const totalFastagRecharges = await Transaction.countDocuments({
            type: "FASTag Recharge",
        });

        // --------------------------------------
        // 3️⃣ TOTAL WALLET TOP-UPS (Credit transactions)
        // --------------------------------------
        const totalEchalan = await Transaction.countDocuments({
            type: "eChallan",
            status: "Success"
        });

        // --------------------------------------
        // 4️⃣ Recharge Volume (Last 30 Days)
        // --------------------------------------
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);

        const rechargeVolume = await Transaction.aggregate([
            {
                $match: {
                    createdAt: { $gte: last30Days },
                    transaction_type: "debit",
                    status: "Success"
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$amount" }
                }
            }
        ]);
        console.log(rechargeVolume)

        const volume = rechargeVolume[0]?.totalAmount || 0;

        // --------------------------------------
        // 5️⃣ Today’s Recharge Summary
        // --------------------------------------
        const todaySummary = await Transaction.aggregate([
            {
                $match: {
                    createdAt: { $gte: todayStart, $lte: todayEnd },
                    transaction_type: "debit"
                }
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        let pending = 0, success = 0, failed = 0, refund = 0;

        todaySummary.forEach(item => {
            if (item._id === "Pending") pending = item.count;
            if (item._id === "Success") success = item.count;
            if (item._id === "Failed") failed = item.count;
            if (item._id === "Refund") refund = item.count;
        });

        // --------------------------------------
        // 6️⃣ Success Rate (%)
        // --------------------------------------
        const totalToday = pending + success + failed + refund;
        const successRate = totalToday ? ((success / totalToday) * 100).toFixed(1) : 0;

        // --------------------------------------
        // Final API Response
        // --------------------------------------
        return res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalFastagRecharges: totalFastagRecharges,
                totalEchalan,
                rechargeVolume: volume,
                today: {
                    pending,
                    success,
                    failed,
                    refund,
                },
                successRate
            }
        });

    } catch (error) {
        console.error("Dashboard API Error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message
        });
    }
};
