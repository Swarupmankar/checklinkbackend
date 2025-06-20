const Folder = require("../models/folder.model");
const getNextId = require("../utils/getNextId");

const getAllFolders = (userId) =>
  Folder.find({ user: userId }).sort({ name: 1 }).lean();

const createFolder = async (userId, name) => {
  console.log("👉 Creating folder with:", { userId, name });

  const existing = await Folder.findOne({ user: userId, name });
  if (existing) {
    const err = new Error("Folder name already exists for this user.");
    err.code = 11000; // So it’s caught by error handler
    err.keyPattern = { name: 1 }; // Used for dynamic message
    throw err;
  }

  const nextId = await getNextId("folders");
  return Folder.create({ id: nextId, name, user: userId });
};

const deleteFolder = (userId, folderId) =>
  Folder.deleteOne({ id: folderId, user: userId });

const addNoteToFolder = async (userId, folderId, title, content) => {
  const folder = await Folder.findOne({ id: folderId, user: userId });
  if (!folder) throw new Error("Folder not found");

  const noteId = await getNextId("notes");
  folder.notes.push({ id: noteId, title, content });
  await folder.save(); // Don't forget this!
  return folder;
};

const updateNote = async (userId, folderId, noteId, title, content) => {
  const folder = await Folder.findOne({ id: folderId, user: userId });
  if (!folder) throw new Error("Folder not found");

  const note = folder.notes.find((n) => n.id === parseInt(noteId));
  if (!note) throw new Error("Note not found");

  note.title = title;
  note.content = content;
  note.updatedAt = Date.now();
  await folder.save(); // Don't forget this!
  return folder;
};

const deleteNote = async (userId, folderId, noteId) => {
  const folder = await Folder.findOne({ id: folderId, user: userId });
  if (!folder) throw new Error("Folder not found");

  folder.notes = folder.notes.filter((n) => n.id !== parseInt(noteId));
  await folder.save(); // Don't forget this!
  return folder;
};

module.exports = {
  getAllFolders,
  createFolder,
  deleteFolder,
  addNoteToFolder,
  updateNote,
  deleteNote,
};
