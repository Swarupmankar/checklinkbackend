// models/folder.model.js
const { Schema, model } = require("mongoose");

const NoteSchema = new Schema(
  {
    id: Number,
    title: String,
    content: String,
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const FolderSchema = new Schema(
  {
    id: Number,
    name: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true }, // 👈🏽 owner
    notes: [NoteSchema],
  },
  { timestamps: true }
);

// Helpful index for fast “load my folders” queries
FolderSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = model("Folder", FolderSchema);
