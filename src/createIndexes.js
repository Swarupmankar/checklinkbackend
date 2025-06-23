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

// require("dotenv").config();
// const mongoose = require("mongoose");
// const URL = require("./models/url.model");

// (async () => {
//   try {
//     await mongoose.connect(process.env.MONGODB_URI);
//     console.log("✅ Connected to MongoDB");
//     await Folder.dropIndex("notes.id_1"); // Name might differ
//     console.log("✅ Removed notes.id_1 index");
//   } catch (err) {
//     console.error("❌ Failed to create indexes", err);
//   } finally {
//     mongoose.disconnect();
//   }
// })();

// Migration script (run once)

require("dotenv").config();
const mongoose = require("mongoose");
const { URL } = require("url"); // Using Node's built-in URL module
const URLModel = require("./models/url.model");

async function migrateDomains() {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ Connected to MongoDB");

    // 2. Find all URLs without domain or with invalid domain
    const urls = await URLModel.find({
      $or: [{ domain: { $exists: false } }, { domain: "invalid-domain" }],
    });
    console.log(`Found ${urls.length} URLs to process`);

    // 3. Process each URL
    let successCount = 0;
    let failCount = 0;

    for (const url of urls) {
      try {
        // Ensure URL has protocol if missing
        let urlToParse = url.url;
        if (
          !urlToParse.startsWith("http://") &&
          !urlToParse.startsWith("https://")
        ) {
          urlToParse = "http://" + urlToParse;
        }

        const parsedUrl = new URL(urlToParse);
        let domain = parsedUrl.hostname;

        // Remove www. if present
        if (domain.startsWith("www.")) {
          domain = domain.substring(4);
        }

        // Special handling for IP addresses
        if (/^\d+\.\d+\.\d+\.\d+$/.test(domain)) {
          domain = `ip-${domain}`;
        }

        url.domain = domain;
        await url.save();
        successCount++;
        console.log(`✅ Updated ${url._id} with domain ${domain}`);
      } catch (err) {
        url.domain = "invalid-domain";
        await url.save();
        failCount++;
        console.log(
          `⚠️  Could not parse ${url.url} - marked as invalid-domain`
        );
      }
    }

    console.log("\nMigration results:");
    console.log(`✅ Successfully updated: ${successCount}`);
    console.log(`⚠️  Failed to parse: ${failCount}`);
    console.log("🎉 Migration complete");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

migrateDomains();
