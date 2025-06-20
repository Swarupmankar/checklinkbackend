const UrlService = require("../services/url.service");
const { toIST } = require("../utils/date.helper");
const { getBaseDomain } = require("../utils/url.helper");
const fs = require("fs/promises");
const path = require("path");

exports.list = async (req, res) => {
  const urls = await UrlService.listByUser(req.user.id);
  const formatted = urls.map((link) => ({
    ...link.toObject(),
    addedOnIST: toIST(link.date),
  }));
  res.json(formatted);
};

exports.stats = async (req, res) => {
  try {
    const [stats, links, linksAddedData, domainsBreakdown] = await Promise.all([
      UrlService.statsByUser(req.user.id),
      UrlService.listByUser(req.user.id),
      UrlService.linksAddedOverTime(req.user.id),
      UrlService.domainsBreakdownByUser(req.user.id),
    ]);

    const formattedLinks = links.map((link) => ({
      ...link.toObject(),
      addedOnIST: toIST(link.date),
      baseDomain: getBaseDomain(link.url),
    }));
    const formattedLinksAdded = linksAddedData.map(({ _id, count }) => ({
      date: _id,
      dateIST: toIST(_id),
      count,
    }));

    const formattedDomains = domainsBreakdown.map((domain) => ({
      ...domain,
      firstAddedIST: toIST(domain.firstAdded),
      lastAddedIST: toIST(domain.lastAdded),
    }));

    res.json({
      stats,
      links: formattedLinks,
      linksAddedData: formattedLinksAdded,
      domainsBreakdown: formattedDomains,
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
  const { id, action } = req.params;
  const map = { download: "downloaded", scrap: "scraped" };

  if (action === "delete") await UrlService.remove(id, req.user.id);
  else if (map[action])
    await UrlService.changeStatus(id, req.user.id, map[action]);
  else return res.status(400).send("Invalid action");

  res.send("Action performed successfully!");
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
