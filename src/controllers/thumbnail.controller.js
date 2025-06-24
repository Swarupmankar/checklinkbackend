const { fetchThumbnail } = require("../services/thumbnail.service");
const asyncHandler = require("../utils/asyncHandler");

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
