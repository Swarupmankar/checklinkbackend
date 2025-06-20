const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const ctrl = require("../controllers/user.controller");

// All routes below require a valid JWT
router.use(auth);

router.get("/me", ctrl.getProfile);
router.put("/me", ctrl.updateProfile);
router.put("/me/password", ctrl.changePassword);
router.delete("/me", ctrl.deleteAccount);

module.exports = router;
