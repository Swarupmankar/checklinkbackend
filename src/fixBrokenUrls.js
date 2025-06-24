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

// require("dotenv").config();
// const mongoose = require("mongoose");
// const { URL } = require("url"); // Using Node's built-in URL module
// const URLModel = require("./models/url.model");

// async function migrateDomains() {
//   try {
//     // 1. Connect to MongoDB
//     await mongoose.connect(process.env.MONGO_URI, {
//       serverSelectionTimeoutMS: 5000,
//       socketTimeoutMS: 45000,
//     });
//     console.log("✅ Connected to MongoDB");

//     // 2. Find all URLs without domain or with invalid domain
//     const urls = await URLModel.find({
//       $or: [{ domain: { $exists: false } }, { domain: "invalid-domain" }],
//     });
//     console.log(`Found ${urls.length} URLs to process`);

//     // 3. Process each URL
//     let successCount = 0;
//     let failCount = 0;

//     for (const url of urls) {
//       try {
//         // Ensure URL has protocol if missing
//         let urlToParse = url.url;
//         if (
//           !urlToParse.startsWith("http://") &&
//           !urlToParse.startsWith("https://")
//         ) {
//           urlToParse = "http://" + urlToParse;
//         }

//         const parsedUrl = new URL(urlToParse);
//         let domain = parsedUrl.hostname;

//         // Remove www. if present
//         if (domain.startsWith("www.")) {
//           domain = domain.substring(4);
//         }

//         // Special handling for IP addresses
//         if (/^\d+\.\d+\.\d+\.\d+$/.test(domain)) {
//           domain = `ip-${domain}`;
//         }

//         url.domain = domain;
//         await url.save();
//         successCount++;
//         console.log(`✅ Updated ${url._id} with domain ${domain}`);
//       } catch (err) {
//         url.domain = "invalid-domain";
//         await url.save();
//         failCount++;
//         console.log(
//           `⚠️  Could not parse ${url.url} - marked as invalid-domain`
//         );
//       }
//     }

//     console.log("\nMigration results:");
//     console.log(`✅ Successfully updated: ${successCount}`);
//     console.log(`⚠️  Failed to parse: ${failCount}`);
//     console.log("🎉 Migration complete");
//   } catch (err) {
//     console.error("❌ Migration failed:", err.message);
//   } finally {
//     await mongoose.disconnect();
//     process.exit(0);
//   }
// }

// migrateDomains();

// scripts/fixThumbnails.js
// require("dotenv").config();
// const mongoose = require("mongoose");
// const URL = require("../src/models/url.model");
// const { fetchThumbnail } = require("../src/services/thumbnail.service");
// const axios = require("axios");

// async function runFix() {
//   try {
//     console.log("🔌 Connecting to MongoDB...");
//     await mongoose.connect(process.env.MONGO_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     console.log("✅ MongoDB connected");

//     const links = await URL.find({
//       $or: [
//         { "thumbnail.data": { $exists: false } },
//         { "thumbnail.data": null },
//       ],
//     });

//     console.log(`🔍 Found ${links.length} links missing thumbnails.`);

//     for (const link of links) {
//       try {
//         const { thumbnail: thumbUrl, title } = await fetchThumbnail(link.url);

//         // Fetch thumbnail image as buffer
//         const imgRes = await axios.get(thumbUrl, {
//           responseType: "arraybuffer",
//         });
//         const buffer = Buffer.from(imgRes.data);

//         // Save both thumbnail and title
//         link.thumbnail = {
//           data: buffer,
//           contentType: imgRes.headers["content-type"] || "image/jpeg",
//         };
//         link.title = title;

//         await link.save();
//         console.log(`✅  Saved thumbnail for ${link.url}`);
//       } catch (err) {
//         console.warn(`⚠️  Skipped: ${link.url} — ${err.message}`);
//       }
//     }

//     await mongoose.disconnect();
//     console.log("✅ Finished processing.");
//   } catch (err) {
//     console.error("❌ Script failed:", err.message);
//     await mongoose.disconnect();
//   }
// }

// runFix();

// require("dotenv").config();
// const mongoose = require("mongoose");
// const URL = require("./models/url.model");
// const { fetchThumbnail } = require("./services/thumbnail.service");

// const TARGET_DOMAINS = ["pornhub.com", "spankbang.com"];

// exports.fixBrokenUrls = async (log = console.log) => {
//   console.log("🔌 Connecting to MongoDB...");
//   await mongoose.connect(process.env.MONGO_URI);
//   console.log("✅ MongoDB connected");

//   const broken = await URL.find({
//     domain: { $in: TARGET_DOMAINS },
//     $or: [
//       { "thumbnail.data": { $exists: false } },
//       { "thumbnail.data": null },
//       { title: { $exists: false } },
//       { title: null },
//     ],
//   });

//   console.log(`🔍 Found ${broken.length} broken URLs`);

//   for (const doc of broken) {
//     try {
//       console.log(`🛠️ Fixing: ${doc.url}`);
//       const { thumbnail, title } = await fetchThumbnail(doc.url, true); // Use proxy

//       if (thumbnail?.startsWith("http")) {
//         doc.thumbnail = undefined;
//         doc.thumbnailUrl = thumbnail;
//       }

//       doc.title = title;
//       await doc.save();
//       console.log(`✅ Fixed: ${doc.url}`);
//     } catch (err) {
//       console.error(
//         `❌ Failed for ${doc.url}: ${
//           err.message || err.response?.status || err.code || "Unknown error"
//         }`
//       );
//     }
//   }

//   await mongoose.disconnect();
//   console.log("🔌 Disconnected from DB");
// };

// fixBrokenUrls();

require("dotenv").config();
const URL = require("./models/url.model");
const { fetchThumbnail } = require("./services/thumbnail.service");

const TARGET_DOMAINS = ["pornhub.com", "spankbang.com"];

async function fixBrokenUrls(log = console.log) {
  log("🔍 Starting to check broken URLs...");

  const broken = await URL.find({
    domain: { $in: TARGET_DOMAINS },
    $or: [
      { "thumbnail.data": { $exists: false } },
      { "thumbnail.data": null },
      { title: { $exists: false } },
      { title: null },
    ],
  });

  log(`🔍 Found ${broken.length} broken URLs`);

  for (const doc of broken) {
    try {
      log(`🛠️ Fixing: ${doc.url}`);
      const { thumbnail, title } = await fetchThumbnail(doc.url, true); // Use proxy

      if (thumbnail?.startsWith("http")) {
        doc.thumbnail = undefined;
        doc.thumbnailUrl = thumbnail;
      }

      doc.title = title;
      await doc.save();
      log(`✅ Fixed: ${doc.url}`);
    } catch (err) {
      log(`❌ Failed for ${doc.url}: ${err.message}`);
      console.error(err);
    }
  }

  log("✅ Finished fixing broken URLs");
}

// Export for controller use
module.exports = { fixBrokenUrls };
