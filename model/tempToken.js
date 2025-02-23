const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the schema for username, token, and createdAt
const TokenSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true, // Ensure the username is unique
    },
    token: {
        type: String,
    },
});



const Token = mongoose.model("Token", TokenSchema);

module.exports = Token;
