const express = require("express");
const router = express.Router();
const axios = require("axios");
const thumbnailController = require("../controllers/thumbnail.controller");
const auth = require("../middleware/auth.middleware");

router.use(auth);

router.post("/thumbnail", thumbnailController.getThumbnail);

module.exports = router;
