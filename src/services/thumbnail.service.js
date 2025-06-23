// const axios = require("axios");
// const cheerio = require("cheerio");

// async function fetchThumbnail(url) {
//   const response = await axios.get(url, {
//     headers: {
//       "User-Agent":
//         "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114 Safari/537.36",
//       Referer: "",
//     },
//   });

//   const html = response.data;
//   const $ = cheerio.load(html);

//   const thumbnail =
//     $('meta[property="og:image"]').attr("content") ||
//     $('meta[name="twitter:image"]').attr("content") ||
//     $('link[rel="image_src"]').attr("href");

//   const title =
//     $('meta[property="og:title"]').attr("content") ||
//     $("title").first().text().trim();

//   if (!thumbnail) {
//     throw new Error("Thumbnail not found");
//   }

//   // If image needs proxy, rewrite to use your own /proxy endpoint
//   const isProxyRequired = !thumbnail.startsWith("http"); // relative image
//   const imageUrl = isProxyRequired
//     ? `https://your-domain.com/api/video/proxy?url=${encodeURIComponent(
//         new URL(thumbnail, url).href
//       )}`
//     : thumbnail;

//   return { thumbnail: imageUrl, title };
// }

// module.exports = { fetchThumbnail };

const axios = require("axios");
const cheerio = require("cheerio");

async function fetchThumbnail(url, useProxy = false) {
  try {
    const targetUrl = useProxy
      ? `${process.env.THUMBNAIL_PROXY_URL}?url=${encodeURIComponent(url)}`
      : url;

    const response = await axios.get(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114 Safari/537.36",
        Referer: "",
      },
      timeout: 10000, // 10 seconds timeout
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const thumbnail =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      $('link[rel="image_src"]').attr("href");

    const title =
      $('meta[property="og:title"]').attr("content") ||
      $("title").first().text().trim();

    if (!thumbnail) throw new Error("Thumbnail not found");

    return { thumbnail, title };
  } catch (err) {
    console.error("❌ fetchThumbnail failed:", {
      url,
      proxy: useProxy,
      message: err.message,
      code: err.code,
      status: err.response?.status,
    });
    throw err;
  }
}
module.exports = { fetchThumbnail };
