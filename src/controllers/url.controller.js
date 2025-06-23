const UrlService = require("../services/url.service");
const { toIST } = require("../utils/date.helper");
const { getBaseDomain } = require("../utils/url.helper");
const fs = require("fs/promises");
const path = require("path");

exports.list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;

    const result = await UrlService.listByUser(req.user.id, page, limit);

    const formatted = result.data.map((link) => ({
      ...link.toObject(),
      addedOnIST: toIST(link.date),
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

    const formattedLinksAdded = linksAddedData.map(({ _id, count }) => ({
      date: _id,
      dateIST: toIST(_id),
      count,
    }));

    res.json({
      stats,
      linksAddedData: formattedLinksAdded,
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

exports.add = async (req, res) => {
  try {
    const { url } = req.body;
    await UrlService.add(url, req.user.id);
    res.status(201).send("URL added successfully!");
  } catch {
    res.status(400).send("URL already exists or invalid");
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
