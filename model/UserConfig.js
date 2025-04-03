const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userconfigSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
        },
        TwoFa_App_Token: {
            type: String,
        },
        Two_Step_Verification_Coad: {
            type: String,
        },
        PassKey_Token: {
            type: String,
        },
        Backup_codes: {
            type: [String],
        },
        Backup_Email: {
            type: String,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("UserConfig", userconfigSchema);