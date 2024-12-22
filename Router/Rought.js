const express = require("express");
const router = express.Router();
const { UpdateProfile, profileimageUpload } = require("../Controller/profile");
const {
    Like,
    share,
    comment,
    GetComment,
} = require("../Controller/PostAction");
const {
    explore,
    follow,
    Contacets,
    HandelFile,
    HandelText,
    FindUser,
    myprofile,
} = require("../Controller/requses");

const {
    Login,
    Resistor,
    logout,
    SetUp2fa,
    Verifi2fa,
    PinOpration,
} = require("../Controller/Auth");
const { Verify } = require("../config/verify");
const upload = require("../config/Multer");
const { userprofile, ViweSinglePOst } = require("../Controller/Read");
const {report} =require("../Controller/Report")
router.get("/contact", Verify, Contacets);


router.post("/login", Login);
router.post("/register", Resistor);
router.post("/follow", Verify, follow);
router.post("/logout", Verify, logout);
router.post("/findbyusername", FindUser);
router.post("/post/get", ViweSinglePOst);
router.post("/explore", Verify, explore);
router.post("/action/like", Verify, Like);
router.post("/action/comment", Verify, comment);
router.post("/get/comment", Verify, GetComment);
router.post("/setup-2fa", Verify, SetUp2fa);
router.post("/add/pin", Verify, PinOpration);
router.post("/myprofile", Verify, myprofile);
router.post("/verify-2fa", Verify, Verifi2fa);
router.post("/upload/text", Verify, HandelText);
router.post("/userprofile", Verify, userprofile);
router.post("/upload/file", Verify, upload.single("Data"), HandelFile);
router.post("/updateprofile", Verify, upload.single("file"), UpdateProfile);
router.post("/report", Verify, upload.single("File"), report);





///test 
module.exports = router;
