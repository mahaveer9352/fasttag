const cron = require("node-cron");
const Transaction = require("../models/walletTranstion");
function startWalletAutoFailCron() {
    cron.schedule("* * * * *", async () => {
        console.log("⏱️ [CRON] Checking for expired pending wallet transactions...");

        try {
            const cutoff = new Date(Date.now() - 5 * 60 * 1000);
            const expired = await Transaction.find({
                status: "Pending",
                createdAt: { $lte: cutoff },
                pgTransId: { $exists: false }, // optional PG flag
                type: "Top-up",                // ensure only top-up auto-fail
            });
            if (expired.length === 0) return;

            for (const trx of expired) {
                trx.status = "Failed";
                trx.description =
                    "User left payment page without completing transaction";

                await trx.save();

                console.log(
                    `❌ [AUTO-FAIL] Wallet Topup ${trx.transaction_reference_id} marked as FAILED (timeout)`
                );
            }
        } catch (err) {
            console.error("❌ [ERROR] Auto-fail Wallet CRON:", err.message);
        }
    })
}
module.exports = startWalletAutoFailCron