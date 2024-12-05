const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const contactSchema = new Schema(
    {
        FllowBy: {
            type: String,
        },
        Fllower: {
            type: String,
        },
    },
    { timeseries: true }
);
module.exports = mongoose.model("Fllow", contactSchema);
