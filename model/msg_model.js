const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const msgSchema = new Schema({
    From: {
        type: String,
        required: true,
    },
    For: {
        type: String,
        required: true,
    },
    Msg: {
        type: String,
        required: true,
    },
    isSend: {
        type: Boolean,
        default: false,
    },
    time: {
        type: String,
    },
});
msgSchema.pre("save", function (next) {
    const currentTime = new Date();
    let hours = currentTime.getHours();
    let minutes = currentTime.getMinutes();
    const period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; 
    minutes = minutes < 10 ? "0" + minutes : minutes;
    this.time = `${hours}:${minutes} ${period}`;
    next();
});

module.exports = mongoose.model("Message", msgSchema);
