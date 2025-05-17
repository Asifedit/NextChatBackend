const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");
const { GrtValue, SetValue } = require("../Redis/redis");
const {getTempUrlWithSignature} =require("../Middleware/imagekit")
const UserSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        refToken: {
            type: String,
        },
        profile: {
            type: String,
            default: "",
        },
        bio: {
            type: String,
            default: "I am using NexChat",
        },
        BirthDay: {
            type: String,
        },
        userAbout: [
            {
                Topic: { type: String },
                Data: { type: String },
            },
        ],
        TwoFAToken: {
            type: String,
            default: "",
            select: false,
        },
    },
    { timestamps: true }
);

UserSchema.pre("save", async function (next) {
    const USER = this;
    if (!USER.isModified("password")) {
        return next();
    }
    try {
        const slat = await bcrypt.genSalt(10);
        USER.password = await bcrypt.hash(USER.password, slat);
        next();
    } catch (error) {
        next(error);
    }
});

UserSchema.methods.isPasswordVerified = async function (inputvalue) {
    try {
        return await bcrypt.compare(inputvalue, this.password);
    } catch (error) {
        console.log(error);
        return false;
    }
};
module.exports = mongoose.model("User", UserSchema);
