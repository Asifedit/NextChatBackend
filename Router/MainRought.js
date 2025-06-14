const express = require("express");
const router = express.Router();
exports.router = router;

const upload = require("../config/Multer");
const explore = require("../Controller/Explore");
const Ratelimit = require("../config/rate_limit");
const myprofile = require("../Controller/Settings");
const Newlogin = require("../Controller/NewLogin");
const JoinGroup = require("../Controller/JoinGroup");

const { UpdateProfile } = require("../Controller/profile");
const { Like, comment, GetComment } = require("../Controller/PostAction");
const { CreateGroup, CreatePool } = require("../Controller/Create/Group");
const { decryptData } = require("../config/Crtipto");
const { HandelFile, HandelText } = require("../Controller/Uplode");
const { follow, Contacets } = require("../Controller/requses");
const { Search } = require("../Controller/Serch");
const { Verify } = require("../config/verify");
const { userprofile } = require("../Controller/Read/UserProfile");
const { ViweSinglePOst } = require("../Controller/Read/SinglePost");
const { report } = require("../Controller/Report");
const AuthRought = require("./AuthRought");
const setup = require("../Controller/SetupConnection");
const UserInfo = require("../Controller/UserInfo");
const ResetPass = require("../Controller/Auth/ResetPass");
const UnseenMsg = require("../Controller/Read/UnseenMsg");
const ConfigConnection = require("../Controller/ConfigureConnection")
const ChackUpdatedProfile = require("../Controller/ChackUpdatedProfile")
const {
    OtpRateLimiter,
    RsendOtpLimiter,
} = require("../Redis/Middleware/RateLimiter");
const {
    ResetpassEmail,
    VerifyAndUpdate,
} = require("../Controller/Auth/resetPassEmail");

router.use(decryptData);
router.use(AuthRought);

router.post("/getkey", decryptData);

router.post("/user/setup", Verify, setup);



router.get("/contact", Verify, Contacets);

router.get("/reset/password", ResetPass);
router.post("/reset/pass/email", RsendOtpLimiter, ResetpassEmail);
router.post("/reset/passemail/verify", OtpRateLimiter, VerifyAndUpdate);

router.post("/find", Verify, Search);
router.post("/chackupdate", Verify, ChackUpdatedProfile);
router.post("/config", Verify, ConfigConnection);
router.post("/msg/new", Verify, UnseenMsg);
router.post("/info/user", Verify, UserInfo);
router.post("/follow", Verify, follow);
router.post("/post/get", ViweSinglePOst);
router.post("/explore", Verify, explore);
router.post("/action/like", Verify, Like);
router.post("/myprofile", Verify, myprofile);
router.post("/join/group", Verify, JoinGroup);
router.post("/all/data/get", Verify, Newlogin);
router.post("/create/pool", Verify, CreatePool);
router.post("/action/comment", Verify, comment);
router.post("/upload/text", Verify, HandelText);
router.post("/userprofile", Verify, userprofile);
router.post("/create/group", Verify, CreateGroup);
router.post("/get/comment", Verify, GetComment);
router.post("/report", Verify, upload.single("File"), report);
router.post("/upload/file", Verify, upload.single("Data"), HandelFile);
router.post("/updateprofile", Verify, upload.single("file"), UpdateProfile);

module.exports = router;
