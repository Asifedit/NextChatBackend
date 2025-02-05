const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const GroupJoindedModelSchma = new Schema({
    GroupName: {
        type: String,
        required: true,
    },
    Member: {
        type: String,
        require: true,
    },
    Role: {
        type: String,
    },
});
module.exports = mongoose.model("groupjoindedmodel", GroupJoindedModelSchma);
