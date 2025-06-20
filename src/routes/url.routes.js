const fs = require("fs");
const router = require("express").Router();
const ctrl = require("../controllers/url.controller");
const auth = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");

router.use(auth);

router.get("/", ctrl.list);
router.get("/stats", ctrl.stats);
router.post("/add", ctrl.add);
router.post("/:id/:action(download|scrap|delete)", ctrl.action);
router.post("/upload", upload.single("file"), ctrl.uploadLinks);

module.exports = router;
