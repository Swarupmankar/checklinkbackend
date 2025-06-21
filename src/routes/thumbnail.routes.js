const express = require("express");
const router = express.Router();
const thumbnailController = require("../controllers/thumbnail.controller");
const auth = require("../middleware/auth.middleware");

router.use(auth);

router.post("/thumbnail", thumbnailController.getThumbnail);

// 🔽 Public proxy route to serve thumbnail images
router.get("/proxy", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send("Missing URL");

  try {
    const response = await axios.get(url, {
      responseType: "stream",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114 Safari/537.36",
        Referer: "", // simulate no referrer
      },
    });

    // Stream image
    res.set(response.headers);
    response.data.pipe(res);
  } catch (err) {
    console.error("❌ Proxy error:", err.message);
    res.status(500).send("Failed to fetch image");
  }
});

module.exports = router;
