const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        transaction_type: {
            type: String,
            enum: ["credit", "debit"],
            required: true,
        },
        type: {
            type: String,
            default: "Recharge"
        },
        amount: {
            type: Number,
            required: true,
        },
        gst: {
            type: Number,
            default: 0,
        },
        tds: {
            type: Number,
            default: 0,
        },
        charge: {
            type: Number,
            default: 0,
        },
        totalDebit: {
            type: Number,
            default: 0,
        },
        totalCredit: {
            type: Number,
            default: 0,
        },
        balance_after: {
            type: Number,
        },
        status: {
            type: String,
            enum: ["Success", "Pending", "Failed"],
            default: "Pending",
        },
        payment_mode: {
            type: String,
            default: "wallet"
        },
        transaction_reference_id: {
            type: String,
        },
        description: {
            type: String,
            default: "",
        },
        enquiryReferenceId: {
            type: String,
            default: ""
        },
        initChannel: {
            type: String,
            default: ""
        },
        inputParameters: {
            type: Object,
            default: ""
        },
        meta: {
            type: Map,
            of: mongoose.Schema.Types.Mixed,
            default: {},
        },
        fastagMeta: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        fastagPaymentResponse: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        }


    },
    {
        timestamps: true,
    }
);

const Transaction = mongoose.model("Transaction", TransactionSchema);

module.exports = Transaction;
