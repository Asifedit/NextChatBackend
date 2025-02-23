const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    postId: {
        type: String,
        required: true,
    },
    commentUserId: {
        type: String,
        require: true,
    },
    commentText: {
        type: String,
        require: true,
    },
    IsComment: {
        type: Boolean,
        default: true,
    },
});
module.exports = mongoose.model("Comment", CommentSchema);
