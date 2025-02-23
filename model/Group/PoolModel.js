const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const PoolSchma = new Schema(
    {
        GroupId: {
            type: String,
            required: true,
        },
        Options: {
            type: Array,
            required: true,
        },
        Question: {
            type: String,
            required: true,
        },
        Explanation: {
            type: String,
        },
        CreatedBy: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);
PoolSchma.virtual("Time").get(function () {
    return this.createdAt.toLocaleString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
});

PoolSchma.set("toJSON", {
    virtuals: true,
});
PoolSchma.set("toObject", {
    virtuals: true,
});

module.exports = mongoose.model("GroupPool", PoolSchma);
