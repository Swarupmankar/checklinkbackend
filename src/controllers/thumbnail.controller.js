const { fetchThumbnail } = require("../services/thumbnail.service");
const asyncHandler = require("../utils/asyncHandler");
const { fixBrokenUrls } = require("../fixBrokenUrls");

exports.getThumbnail = asyncHandler(async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ message: "url is required" });

  try {
    const data = await fetchThumbnail(url);
    res.json(data);
  } catch (err) {
    console.error("❌ Thumbnail Error:", err.message);
    res
      .status(422)
      .json({ message: "Could not extract thumbnail from the provided URL." });
  }
});

exports.fixBrokenUrls = async (req, res) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");

  const write = (msg) => res.write(msg + "\n");

  try {
    await fixBrokenUrls(write); // Pass a log function
    res.end("✅ Done.\n");
  } catch (err) {
    console.error("❌ Error:", err);
    write("❌ Script crashed: " + err.message);
    res.end();
  }
};
