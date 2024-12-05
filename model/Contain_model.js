const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ContainSchema = new Schema({
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
});
ContainSchema.pre("save", function (next) {
    const currentTime = new Date();
    let hours = currentTime.getHours();
    let minutes = currentTime.getMinutes();
    const period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    this.CreatedAt = `${hours}:${minutes} ${period}`;
    next();
});

module.exports = mongoose.model("Contain", ContainSchema);
