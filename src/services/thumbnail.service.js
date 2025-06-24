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
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36",
  };

  let finalUrl = url;

  if (useProxy && process.env.PROXY_URL) {
    finalUrl = `${process.env.PROXY_URL}?url=${encodeURIComponent(url)}`;
  }

  const res = await axios.get(finalUrl, { headers });
  const $ = cheerio.load(res.data);

  let title = $("title").text().trim();
  let thumbnail = null;

  // Pornhub
  if (url.includes("pornhub.com")) {
    thumbnail =
      $("meta[property='og:image']").attr("content") ||
      $("meta[name='twitter:image']").attr("content");
  }

  // SpankBang
  if (url.includes("spankbang.com")) {
    thumbnail =
      $("meta[property='og:image']").attr("content") ||
      $("video").attr("poster") ||
      $("meta[itemprop='thumbnailUrl']").attr("content");
  }

  return {
    title,
    thumbnail,
  };
}

module.exports = { fetchThumbnail };
