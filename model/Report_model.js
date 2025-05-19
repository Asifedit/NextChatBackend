const mongoose = require("mongoose");
const ReportSchema = new mongoose.Schema({
    username: {
        type:String,
        required: true,
    },
    topic: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    attachment: {
        type: String,
        default: null,
    },
    priority: {
        type: String,
        enum: ["Low", "Medium", "High"],
        default: "low",
    },
    status: {
        type: String,
        enum: ["pending", "resolved", "rejected"],
        default: "pending",
    },
    isNotificationNeeded: {
        type: Boolean,
        default: false,
    },
},{timestamps: true});

const Report = mongoose.model("Report", ReportSchema);
module.exports = Report;