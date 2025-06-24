const UrlService = require("../services/url.service");
const { toIST } = require("../utils/date.helper");
const { getBaseDomain } = require("../utils/url.helper");
const fs = require("fs/promises");
const path = require("path");

function thumbToDataURI(link) {
  if (!link.thumbnail?.data) return null;
  const base64 = link.thumbnail.data.toString("base64");
  return `data:${link.thumbnail.contentType};base64,${base64}`;
}

exports.list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;

    const result = await UrlService.listByUser(req.user.id, page, limit);

    const formatted = result.data.map((link) => ({
      ...link.toObject(),
      addedOnIST: toIST(link.date),
      thumbnail: thumbToDataURI(link),
      title: link.title || "No title found", // Add this line
    }));
    res.json({
      data: formatted,
      meta: result.meta,
    });
  } catch (err) {
    console.error("List error:", err);
    res.status(500).json({ error: "Failed to fetch URLs" });
  }
};

exports.stats = async (req, res) => {
  try {
    const [stats, linksAddedData] = await Promise.all([
      UrlService.statsByUser(req.user.id),
      UrlService.linksAddedOverTime(req.user.id),
    ]);

    // const formattedLinksAdded = linksAddedData.map(({ _id, count }) => ({
    //   date: _id,
    //   dateIST: toIST(_id),
    //   count,
    // }));

    res.json({
      stats,
      linksAddedData: linksAddedData.map(({ _id, count }) => ({
        date: _id,
        dateIST: toIST(_id),
        count,
      })),
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

// exports.add = async (req, res) => {
//   try {
//     const { url } = req.body;
//     await UrlService.add(url, req.user.id);
//     res.status(201).send("URL added successfully!");
//   } catch {
//     res.status(400).send("URL already exists or invalid");
//   }
// };

exports.add = async (req, res) => {
  console.log("📥 add() called with URL:", req.body.url);
  const { url } = req.body;
  if (!url) return res.status(400).json({ message: "url is required" });

  try {
    await UrlService.add(url, req.user.id);
    return res.status(201).json({ message: "URL added successfully" });
  } catch (err) {
    /* user-friendly errors */
    if (err.code === "DUPLICATE_URL")
      return res.status(409).json({ message: "URL already exists" });
    if (err.code === "INVALID_URL")
      return res.status(422).json({ message: "Provided URL is invalid" });

    console.error("Add URL error:", err);
    return res.status(500).json({ message: "Failed to add URL" });
  }
};

exports.action = async (req, res) => {
  try {
    const { id, action } = req.params;
    const map = { download: "downloaded", scrap: "scraped" };

    if (action === "delete") await UrlService.remove(id, req.user.id);
    else if (map[action])
      await UrlService.changeStatus(id, req.user.id, map[action]);
    else return res.status(400).send("Invalid action");

    res.send("Action performed successfully!");
  } catch (err) {
    console.error("Action error:", err);
    res.status(500).json({ error: "Failed to perform action" });
  }
};

exports.uploadLinks = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = path.resolve(req.file.path);
    const fileContent = await fs.readFile(filePath, "utf-8");

    const urls = fileContent
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized or user not found" });
    }

    const result = await UrlService.bulkAdd(urls, req.user.id);

    await fs.unlink(filePath);

    return res.json({
      message: `Upload complete: ${result.added} new link(s) added, ${result.skipped} duplicate(s) skipped.`,
      added: result.added,
      skipped: result.skipped,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: err.message || "Upload failed" });
  }
};

exports.listByDomain = async (req, res) => {
  try {
    const { domain } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await UrlService.listByDomain(
      req.user.id,
      domain,
      page,
      limit
    );

    const formatted = result.data.map((link) => ({
      ...link.toObject(),
      addedOnIST: toIST(link.date),
      baseDomain: getBaseDomain(link.url),
      thumbnail: thumbToDataURI(link),
      title: link.title || "No title found", // Add this line
    }));

    res.json({
      data: formatted,
      meta: result.meta,
    });
  } catch (err) {
    console.error("Domain list error:", err);
    res.status(500).json({ error: "Failed to fetch domain URLs" });
  }
};

exports.getDomains = async (req, res) => {
  try {
    const domains = await UrlService.getDomainsAggregate(req.user.id);

    const formatted = domains.map((d) => ({
      domain: d._id,
      count: d.count,
      downloaded: d.downloaded,
      scraped: d.scraped,
      pending: d.pending,
      firstAdded: d.firstAdded,
      lastAdded: d.lastAdded,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Domain aggregation failed:", err);
    res.status(500).json({
      error: "Failed to fetch domains",
      details: err.message,
    });
  }
};

// exports.search = async (req, res) => {
//   try {
//     const { q = "", page = 1, limit = 12 } = req.query;
//     const result = await UrlService.search(req.user.id, q, +page, +limit);
//     const formatted = result.data.map((l) => ({
//       ...l.toObject(),
//       addedOnIST: toIST(l.date),
//       baseDomain: getBaseDomain(l.url),
//     }));

//     return res.json({ data: formatted, meta: result.meta });
//   } catch (err) {
//     console.error("Search error:", err);
//     return res.status(500).json({ message: "Failed to search URLs" });
//   }
// };

exports.search = async (req, res) => {
  try {
    const { q } = req.query;
    const results = await UrlService.search(q, req.user.id);
    res.json(results);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).send("Search failed");
  }
};
