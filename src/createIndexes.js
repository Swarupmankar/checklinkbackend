// // scripts/createIndexes.js
// require("dotenv").config();
// const mongoose = require("mongoose");
// const Folder = require("../models/folder.model");

// (async () => {
//   try {
//     await mongoose.connect(process.env.MONGODB_URI);
//     console.log("✅ Connected to MongoDB");
//     await Folder.createIndexes();
//     console.log("✅ Indexes ensured");
//   } catch (err) {
//     console.error("❌ Failed to create indexes", err);
//   } finally {
//     mongoose.disconnect();
//   }
// })();

require("dotenv").config();
const mongoose = require("mongoose");
const Folder = require("./models/folder.model");

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");
    await Folder.dropIndex("notes.id_1"); // Name might differ
    console.log("✅ Removed notes.id_1 index");
  } catch (err) {
    console.error("❌ Failed to create indexes", err);
  } finally {
    mongoose.disconnect();
  }
})();
