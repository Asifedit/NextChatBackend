const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const GroupSchma = new Schema({
    GroupName: {
        type: String,
        required: true,
    },

    Admin: {
        type: String,
        required: true,
    },
    MaxMembers: {
        type: Number,
        required: true,
    },
    GroupDescription: {
        type: String,
        required:true,
    },
    GroupPicture: {
        type:String,
    }
});
module.exports = mongoose.model("Group", GroupSchma);
