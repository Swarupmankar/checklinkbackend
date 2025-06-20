const axios = require("axios");
const cheerio = require("cheerio");

async function fetchThumbnail(url) {
  const response = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114 Safari/537.36",
    },
    timeout: 7000,
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

  if (!thumbnail) {
    throw new Error("Thumbnail not found");
  }

  return { thumbnail, title };
}

module.exports = { fetchThumbnail };
