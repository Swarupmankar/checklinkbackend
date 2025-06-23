const URL = require("../models/url.model");
const mongoose = require("mongoose");

function getBaseDomain(url) {
  try {
    const hostname = new URL(url).hostname;
    const parts = hostname.split(".");
    const len = parts.length;
    if (len >= 2) return parts[len - 2] + "." + parts[len - 1]; // e.g., eporner.com
    return hostname;
  } catch {
    return "invalid-domain";
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

  static async statsByUser(userId) {
    const statuses = ["downloaded", "scraped", "pending"];
    const counts = await Promise.all(
      statuses.map((s) => URL.countDocuments({ status: s, user: userId }))
    );

    const [downloaded, scraped, pending] = counts;
    const total = downloaded + scraped + pending;

    return {
      total,
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
    return URL.create({ url, user: userId });
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

        await URL.create({
          url,
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
}

module.exports = UrlService;
