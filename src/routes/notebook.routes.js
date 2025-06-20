const express = require("express");
const router = express.Router();
const notebookController = require("../controllers/notebook.controller");
const auth = require("../middleware/auth.middleware");

router.use(auth);

router.get("/folders", notebookController.getFolders);
router.post("/folders/create", notebookController.createFolder);
router.delete("/folders/delete/:id", notebookController.deleteFolder);

router.post("/folders/:folderId/add-notes", notebookController.addNote);
router.put("/folders/:folderId/notes/update/:noteId", notebookController.updateNote);
router.delete(
  "/folders/:folderId/notes/delete/:noteId",
  notebookController.deleteNote
);

module.exports = router;
