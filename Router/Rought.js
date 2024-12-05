const express = require("express");
const router = express.Router();
const {
    explore,
    follow,
    Contacets,
    HandelFile,
    HandelText,
    FindUser,
    myprofile,
} = require("../Controller/requses");

const { UpdateProfile, profileimageUpload } = require("../Controller/profile");
const { authentication, authenticationVerify } = require("../Controller/TwoFA");
const {
    Login,
    Resistor,
    logout,
    SetUp2fa,
    Verifi2fa,
    AddPin,
} = require("../Controller/Auth");
const { Verify } = require("../config/verify");
const upload = require("../config/Multer");
const {userprofile} =require("../Controller/Read");
router.get("/contact", Verify, Contacets);


router.post("/login", Login);
router.post("/register", Resistor);
router.post("/follow", Verify, follow);
router.post("/logout", Verify, logout);
router.post("/add/pin",  AddPin);
router.post("/findbyusername", FindUser);
router.post("/explore", Verify, explore);
router.post("/setup-2fa", Verify, SetUp2fa);
router.post("/myprofile", Verify, myprofile);
router.post("/verify-2fa", Verify, Verifi2fa);
router.post("/authentication", authentication);
router.post("/upload/text", Verify, HandelText);
router.post("/userprofile", Verify, userprofile);
router.post("/authenticationVerify", authenticationVerify);
router.post("/upload/file", Verify, upload.single("Data"), HandelFile);
router.post("/updateprofile", Verify, upload.single("file"), UpdateProfile);

module.exports = router;
