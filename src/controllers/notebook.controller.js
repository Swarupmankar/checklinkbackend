// controllers/notebook.controller.js
const svc = require("../services/notebook.service");
const asyncHandler = require("../utils/asyncHandler");

exports.getFolders = asyncHandler(async (req, res) => {
  const folders = await svc.getAllFolders(req.user.id);
  res.json(folders);
});

exports.createFolder = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const folder = await svc.createFolder(req.user.id, name);
  res.status(201).json(folder);
});

exports.deleteFolder = asyncHandler(async (req, res) => {
  await svc.deleteFolder(req.user.id, Number(req.params.id));
  res.status(204).send();
});

exports.addNote = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  const folder = await svc.addNoteToFolder(
    req.user.id,
    Number(req.params.folderId),
    title,
    content
  );
  res.json(folder);
});

exports.updateNote = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  const folderId = Number(req.params.folderId);
  const noteId = Number(req.params.noteId);
  const folder = await svc.updateNote(
    req.user.id,
    Number(req.params.folderId),
    Number(req.params.noteId),
    title,
    content
  );
  res.json(folder);
});

exports.deleteNote = asyncHandler(async (req, res) => {
  const folder = await svc.deleteNote(
    req.user.id,
    Number(req.params.folderId),
    Number(req.params.noteId)
  );
  res.json(folder);
});
