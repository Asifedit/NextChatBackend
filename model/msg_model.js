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
    
},{timestamps:true});
module.exports = mongoose.model("Message", msgSchema);
