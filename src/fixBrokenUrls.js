require("dotenv").config();
const mongoose = require("mongoose");
const URL = require("./models/url.model"); 

async function createUrlTextIndex() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    console.log("⚙️ Creating text index on url, title, and domain...");

    await URL.collection.createIndex(
      { url: "text", title: "text", domain: "text" },
      { name: "UrlTextSearchIndex" }
    );

    console.log("✅ Text index created successfully!");
  } catch (err) {
    console.error("❌ Failed to create index:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

createUrlTextIndex();
