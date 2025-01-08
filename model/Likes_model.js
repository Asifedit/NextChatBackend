const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const likeSchema = new Schema({
    postId: {
        type: String,
        required: true,
    },
    likeUserid: {
        type: String,
        require: true,
    },
},{timestamps:true});

module.exports = mongoose.model("Like", likeSchema);
