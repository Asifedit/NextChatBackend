const express = require("express");
const router = express.Router();
const Login = require("../Controller/Auth/Login");
const logout = require("../Controller/Auth/logout");
const Resistor = require("../Controller/Auth/Resistor");
const SetUp2fa = require("../Controller/Auth/SetUp2fa");
const Verifi2fa = require("../Controller/Auth/Verifi2fa");
const Disable2fa = require("../Controller/Auth/Disable2fa");
const DisablePin = require("../Controller/Auth/DisablePin");
const PinOpration = require("../Controller/Auth/PinOpration");
const VerifiResistor = require("../Controller/Auth/VerifiResistor");
const Verifi2faToken = require("../Controller/Auth/Verifi2faToken");
const BackupCode = require("../Controller/Auth/BackupCode")
const { Verify } = require("../config/verify");


router.get("/backup/code", BackupCode);
router.post("/login", Login);
router.post("/register", Resistor);
router.post("/register/verifi", VerifiResistor);
router.post("/verifi/tf/token", Verifi2faToken);

router.post("/logout", Verify, logout);
router.post("/setup-2fa", Verify, SetUp2fa);
router.post("/add/pin", Verify, PinOpration);
router.post("/verify-2fa", Verify, Verifi2fa);
router.post("/disable-2fa", Verify, Disable2fa);
router.post("/disable/pin", Verify, DisablePin);

module.exports = router;
