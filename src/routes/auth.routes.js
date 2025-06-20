const express = require("express");
const router = require("express").Router();
const ctrl = require("../controllers/auth.controller");
const TokenController = require("../controllers/token.controller");

router.post("/register", ctrl.register);
router.post("/login", ctrl.login);
router.post("/refresh", TokenController.refreshToken);
router.post("/logout", TokenController.logout);

module.exports = router;
