const URL = require("../models/url.model");
const mongoose = require("mongoose");
const axios = require("axios");
const { fetchThumbnail } = require("./thumbnail.service");
const { getBaseDomain } = require("../utils/url.helper");

function normaliseUrl(raw) {
  // prepend protocol if missing
  return raw.startsWith("http") ? raw.trim() : `https://${raw.trim()}`;
}

async function enrichWithThumbnail(rawUrl) {
  try {
    const { thumbnail: thumbUrl, title } = await fetchThumbnail(rawUrl);

    const imgRes = await axios.get(thumbUrl, { responseType: "arraybuffer" });
    return {
      title,
      thumbnail: {
        data: Buffer.from(imgRes.data),
        contentType: imgRes.headers["content-type"] || "image/jpeg",
      },
    };
  } catch (err) {
    console.warn("Thumbnail fetch failed:", err.message);
    return { title: null, thumbnail: null };
  }
}

class UrlService {
  static async listByUser(userId, page = 1, limit = 12) {
    const skip = (page - 1) * limit;

    const [urls, total] = await Promise.all([
      URL.find({ user: userId }).sort({ date: -1 }).skip(skip).limit(limit),
      URL.countDocuments({ user: userId }),
    ]);

    return {
      data: urls,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  static async add(rawUrl, userId) {
    const url = normaliseUrl(rawUrl);

    /* 1. Basic URL validity --------------------------------------- */
    let validDomain;
    try {
      validDomain = getBaseDomain(url);
      // Will throw if URL constructor can’t parse it
      // eslint-disable-next-line no-new
      new URL(url);
    } catch {
      const err = new Error("Invalid URL format");
      err.code = "INVALID_URL";
      throw err;
    }

    /* 2. Duplicate check (per-user) ------------------------------- */
    const exists = await URLModel.findOne({ url, user: userId });
    if (exists) {
      const err = new Error("URL already exists");
      err.code = "DUPLICATE_URL";
      throw err;
    }

    /* 3. Enrich ---------------------------------------------------- */
    let title = "";
    let thumbnail = null;

    try {
      const res = await fetchThumbnail(url); // { title, thumbnail }
      title = res.title || "";
      if (res.thumbnail) {
        // fetch raw bytes & build buffer
        const img = await axios.get(res.thumbnail, {
          responseType: "arraybuffer",
        });
        thumbnail = {
          data: Buffer.from(img.data, "binary"),
          contentType: img.headers["content-type"] || "image/jpeg",
        };
      }
    } catch (e) {
      // enrichment is *best effort*; log & continue
      console.warn("🔎 Enrich failed:", e.message);
    }

    /* 4. Create ---------------------------------------------------- */
    return URLModel.create({
      url,
      domain: validDomain,
      title,
      thumbnail,
      user: userId,
      status: "pending",
      date: new Date(),
    });
  }

  static async statsByUser(userId) {
    const statuses = ["downloaded", "scraped", "pending"];
    const counts = await Promise.all(
      statuses.map((s) => URL.countDocuments({ status: s, user: userId }))
    );

    const [downloaded, scraped, pending] = counts;

    return {
      total: downloaded + scraped + pending,
      downloaded,
      scraped,
      pending,
    };
  }

  static async linksAddedOverTime(userId) {
    // Group URLs by date and count how many were added per day
    return URL.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$date",
              timezone: "Asia/Kolkata",
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } }, // Sort by date ascending
    ]);
  }

  static async add(url, userId) {
    const domain = getBaseDomain(url);
    const { thumbnail, title } = await enrichWithThumbnail(url);

    return URL.create({
      url,
      domain,
      title,
      thumbnail,
      user: userId,
      status: "pending",
      date: new Date(),
    });
  }

  static async changeStatus(id, userId, status) {
    return URL.findOneAndUpdate({ _id: id, user: userId }, { status });
  }

  static async remove(id, userId) {
    return URL.findOneAndDelete({ _id: id, user: userId });
  }

  static async domainsBreakdownByUser(userId) {
    const links = await URL.find({ user: userId });
    const domainMap = {};
    links.forEach((link) => {
      const domain = getBaseDomain(link.url);
      if (!domainMap[domain]) {
        domainMap[domain] = {
          domain,
          total: 0,
          downloaded: 0,
          scraped: 0,
          pending: 0,
          firstAdded: link.date,
          lastAdded: link.date,
        };
      }

      const entry = domainMap[domain];
      entry.total++;
      entry[link.status]++;

      if (link.date < entry.firstAdded) entry.firstAdded = link.date;
      if (link.date > entry.lastAdded) entry.lastAdded = link.date;
    });

    return Object.values(domainMap);
  }
  static async listByDomain(userId, domain, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [urls, total] = await Promise.all([
      URL.find({ user: userId, domain })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      URL.countDocuments({ user: userId, domain }),
    ]);

    return {
      data: urls,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  static async bulkAdd(urls, userId) {
    let added = 0;
    let skipped = 0;

    for (const rawUrl of urls) {
      const url = rawUrl.trim();
      if (!url) continue;

      try {
        const exists = await URL.findOne({ url, user: userId });
        if (exists) {
          skipped++;
          continue;
        }

        const domain = getBaseDomain(url);
        const { thumbnail, title } = await enrichWithThumbnail(url);

        await URL.create({
          url,
          domain,
          title,
          thumbnail,
          user: userId,
          status: "pending",
          date: new Date(),
        });

        added++;
      } catch (err) {
        skipped++;
        console.warn(`Skipping bad URL: ${url}`, err.message);
      }
    }

    return { added, skipped };
  }
  static async getDomainsAggregate(userId) {
    return URL.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$domain",
          count: { $sum: 1 },
          downloaded: {
            $sum: { $cond: [{ $eq: ["$status", "downloaded"] }, 1, 0] },
          },
          scraped: {
            $sum: { $cond: [{ $eq: ["$status", "scraped"] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          firstAdded: { $min: "$date" },
          lastAdded: { $max: "$date" },
        },
      },
      { $sort: { count: -1 } },
    ]);
  }

  static async search(query, userId) {
    const regex = new RegExp(query, "i");

    const results = await URL.find({
      user: userId,
      $or: [{ url: regex }, { title: regex }, { domain: regex }],
    }).sort({ date: -1 });

    return results.map((doc) => {
      const obj = doc.toObject();

      if (obj.thumbnail?.data) {
        obj.thumbnail = {
          data: obj.thumbnail.data.toString("base64"),
          contentType: obj.thumbnail.contentType,
        };
      }
      return obj;
    });
  }
}

module.exports = UrlService;
