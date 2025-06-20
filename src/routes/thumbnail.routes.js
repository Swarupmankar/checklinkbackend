const express = require("express");
const router = express.Router();
const thumbnailController = require("../controllers/thumbnail.controller");
const auth = require("../middleware/auth.middleware"); // if needed

router.use(auth);

router.post("/thumbnail", thumbnailController.getThumbnail);

module.exports = router;
