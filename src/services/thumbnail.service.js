const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");

const BLOCKED_DOMAINS = ["pornhub.com", "spankbang.com"];

async function fetchWithCheerio(url) {
  console.log("📸 fetchThumbnail called for:", url);
  const useProxy = BLOCKED_DOMAINS.some((d) => url.includes(d));
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36",
    Referer: "",
  };

  let finalUrl = url;
  if (useProxy) {
    console.log("🛡 Using proxy for:", url);
    finalUrl = `https://quintessential-koo-checklink-3c39587f.koyeb.app/api/video/proxy?url=${encodeURIComponent(
      url
    )}`;
  }

  try {
    const response = await axios.get(finalUrl, { headers, timeout: 10000 });
    const $ = cheerio.load(response.data);

    const title =
      $("meta[property='og:title']").attr("content") ||
      $("meta[name='twitter:title']").attr("content") ||
      $("title").first().text().trim();

    let thumbnail =
      $("meta[property='og:image']").attr("content") ||
      $("meta[name='twitter:image']").attr("content") ||
      $("link[rel='image_src']").attr("href") ||
      $("video").attr("poster") ||
      $("img.lazy").attr("data-src") ||
      $("img.ipsImage").attr("data-src") ||
      $("img.img-responsive").attr("data-src") ||
      $("meta[itemprop='thumbnailUrl']").attr("content");

    if (thumbnail?.includes("spacer.png")) {
      console.warn("⚠️ Ignoring placeholder thumbnail (spacer.png)");
      thumbnail = null;
    }

    // 💡 Patch for Pornhub JSON-LD
    if (!thumbnail || !title) {
      console.log("🔍 Trying JSON-LD parsing...");

      const jsonLdScript = $("script[type='application/ld+json']").html();

      if (jsonLdScript) {
        try {
          const json = JSON.parse(jsonLdScript.trim());
          title = title || json.name;
          thumbnail =
            thumbnail ||
            json.thumbnailUrl ||
            $("img[data-src]").first().attr("data-src");
          console.log("✅ Extracted from JSON-LD");
        } catch (err) {
          console.warn("❌ Failed to parse JSON-LD:", err.message);
        }
      }
    }

    return { title, thumbnail };
  } catch (err) {
    console.error("❌ Cheerio fetch error:", err.message);
    return { title: null, thumbnail: null };
  }
}

async function fetchWithPuppeteer(url) {
  console.log("🧪 Falling back to Puppeteer for:", url);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36"
    );

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    const data = await page.evaluate(() => {
      const get = (sel) => document.querySelector(sel)?.content || "";
      const getAttr = (sel, attr) =>
        document.querySelector(sel)?.getAttribute(attr) || "";

      const title =
        get("meta[property='og:title']") ||
        get("meta[name='twitter:title']") ||
        document.title;

      const thumbnail =
        get("meta[property='og:image']") ||
        get("meta[name='twitter:image']") ||
        getAttr("video", "poster") ||
        getAttr("img.lazy", "data-src") ||
        get("meta[itemprop='thumbnailUrl']");

      return { title, thumbnail };
    });

    return {
      title: data.title || null,
      thumbnail: data.thumbnail || null,
    };
  } catch (err) {
    console.error("❌ Puppeteer fetch error:", err.message);
    return { title: null, thumbnail: null };
  } finally {
    if (browser) await browser.close();
  }
}

async function fetchThumbnail(url) {
  console.log("📥 add() called with URL:", url);
  console.log("🌐 Trying Cheerio for:", url);

  let result = await fetchWithCheerio(url);

  if (!result.title || !result.thumbnail) {
    console.warn("⚠️ Cheerio failed, falling back to Puppeteer...");
    result = await fetchWithPuppeteer(url);
  }

  console.log("✅ Final Title:", result.title || "N/A");
  console.log("✅ Final Thumbnail:", result.thumbnail || "N/A");

  if (!result.thumbnail) {
    throw new Error("Thumbnail fetch failed: No valid thumbnail found");
  }

  return result;
}

module.exports = { fetchThumbnail };
