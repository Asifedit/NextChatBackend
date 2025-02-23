const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ContainSchema = new Schema(
    {
        CreatBy: {
            type: String,
            required: true,
        },
        CreatedAt: {
            type: String,
        },
        ContainType: {
            type: String,
            required: true,
        },
        ContainTitle: {
            type: String,
            required: true,
        },
        Contain: {
            type: String,
            required: true,
        },
    },
    { timestamps:true }
);


module.exports = mongoose.model("Contain", ContainSchema);
