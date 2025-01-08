const express = require("express");
const router = express.Router();
const { UpdateProfile, profileimageUpload } = require("../Controller/profile");
const { Like, comment, GetComment } = require("../Controller/PostAction");
const { CreateGroup, CreatePool } = require("../Controller/Create/Group");
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
    VerifiResistor,
    Verifi2faToken
} = require("../Controller/Auth");
const { Verify } = require("../config/verify");
const upload = require("../config/Multer");
const { userprofile } = require("../Controller/Read/UserProfile");
const { ViweSinglePOst } = require("../Controller/Read/SinglePost");
const { report } = require("../Controller/Report");

router.get("/contact", Verify, Contacets);
router.get("/mygroup", Verify, Contacets);

router.post("/login", Login);
router.post("/register", Resistor);
router.post("/register/verifi", VerifiResistor);
router.post("/follow", Verify, follow);
router.post("/logout", Verify, logout);
router.post("/findbyusername", FindUser);
router.post("/post/get", ViweSinglePOst);
router.post("/explore", Verify, explore);
router.post("/action/like", Verify, Like);
router.post("/setup-2fa", Verify, SetUp2fa);
router.post("/add/pin", Verify, PinOpration);
router.post("/myprofile", Verify, myprofile);
router.post("/verify-2fa", Verify, Verifi2fa);
router.post("/verifi/tf/token", Verifi2faToken);
router.post("/get/comment", Verify, GetComment);
router.post("/action/comment", Verify, comment);
router.post("/upload/text", Verify, HandelText);
router.post("/userprofile", Verify, userprofile);
router.post("/create/group", Verify, CreateGroup);
router.post("/create/pool", Verify, CreatePool);
router.post("/upload/file", Verify, upload.single("Data"), HandelFile);
router.post("/updateprofile", Verify, upload.single("file"), UpdateProfile);
router.post("/report", Verify, upload.single("File"), report);

module.exports = router;
