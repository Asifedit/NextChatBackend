const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MessageSchema = new Schema(
    {
        GroupId: {
            type: String,
            required: true,
        },
        Msg: {
            type: String,
            required: true,
        },
        Sender: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

MessageSchema.virtual("Time").get(function () {
    return this.createdAt.toLocaleString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
});

MessageSchema.set("toJSON", {
    virtuals: true,
});

MessageSchema.set("toObject", {
    virtuals: true,
});

module.exports = mongoose.model("GroupMessage", MessageSchema);
