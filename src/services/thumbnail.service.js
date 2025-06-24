// const axios = require("axios");
// const cheerio = require("cheerio");
// const puppeteer = require("puppeteer");

// const BLOCKED_DOMAINS = ["pornhub.com", "spankbang.com"];

// async function fetchWithCheerio(url) {
//   console.log("📸 fetchThumbnail called for:", url);
//   const useProxy = BLOCKED_DOMAINS.some((d) => url.includes(d));
//   const headers = {
//     "User-Agent":
//       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36",
//     Referer: "",
//   };

//   let finalUrl = url;
//   if (useProxy) {
//     console.log("🛡 Using proxy for:", url);
//     finalUrl = `https://quintessential-koo-checklink-3c39587f.koyeb.app/api/video/proxy?url=${encodeURIComponent(
//       url
//     )}`;
//   }

//   const response = await axios.get(finalUrl, { headers, timeout: 10000 });
//   const $ = cheerio.load(response.data);

//   const title =
//     $("meta[property='og:title']").attr("content") ||
//     $("meta[name='twitter:title']").attr("content") ||
//     $("title").first().text().trim();

//   let thumbnail =
//     $("meta[property='og:image']").attr("content") ||
//     $("meta[name='twitter:image']").attr("content") ||
//     $("link[rel='image_src']").attr("href") ||
//     $("video").attr("poster") ||
//     $("img.lazy").attr("data-src") ||
//     $("meta[itemprop='thumbnailUrl']").attr("content");

//   return { title, thumbnail };
// }

// async function fetchWithPuppeteer(url) {
//   const browser = await puppeteer.launch({
//     headless: "new",
//     args: ["--no-sandbox", "--disable-setuid-sandbox"],
//   });

//   try {
//     const page = await browser.newPage();
//     await page.setUserAgent(
//       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36"
//     );
//     await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

//     const data = await page.evaluate(() => {
//       const get = (sel) => document.querySelector(sel)?.content || "";
//       const getAttr = (sel, attr) =>
//         document.querySelector(sel)?.getAttribute(attr) || "";

//       return {
//         title:
//           get("meta[property='og:title']") ||
//           get("meta[name='twitter:title']") ||
//           document.title,
//         thumbnail:
//           get("meta[property='og:image']") ||
//           get("meta[name='twitter:image']") ||
//           getAttr("video", "poster") ||
//           getAttr("img.lazy", "data-src") ||
//           get("meta[itemprop='thumbnailUrl']"),
//       };
//     });

//     return {
//       title: title || null,
//       thumbnail: thumbnail || null,
//     };
//   } catch (err) {
//     console.error("❌ Puppeteer fetch error:", err.message);
//     return { title: null, thumbnail: null };
//   } finally {
//     await browser.close();
//   }
// }

// async function fetchThumbnail(url) {
//   console.log("📸 fetchThumbnail called for:", url); // <- test log
//   console.log("🌐 Trying Cheerio for:", url);
//   let result = await fetchWithCheerio(url);

//   if (!result.title || !result.thumbnail) {
//     console.warn("⚠️ Cheerio failed, falling back to Puppeteer...");
//     result = await fetchWithPuppeteer(url);
//   }

//   console.log("✅ Final Title:", result.title || "N/A");
//   console.log("✅ Final Thumbnail:", result.thumbnail || "N/A");

//   return result;
// }

// module.exports = { fetchThumbnail };

const puppeteer = require("puppeteer-core");
const chromium = require("chrome-aws-lambda");

async function fetchThumbnail(url) {
  console.log("📸 fetchThumbnail called for:", url);

  let browser;

  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      defaultViewport: { width: 1280, height: 720 },
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });

    const title = await page.title();

    const thumbnail = await page.$$eval(
      "meta[property='og:image'], meta[name='og:image']",
      (tags) => tags[0]?.getAttribute("content") || null
    );

    console.log("✅ Title:", title);
    console.log("🖼️ Thumbnail:", thumbnail);

    return { title, thumbnail };
  } catch (err) {
    console.error("❌ fetchThumbnail error:", err.message);
    return { title: null, thumbnail: null };
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { fetchThumbnail };
