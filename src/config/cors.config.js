const cors = require("cors");

const allowedOrigins = [
  "http://localhost:8080",
  "https://checklink.fun",
  "https://www.checklink.fun",
  "capacitor://localhost",
  "http://localhost",
  "https://localhost",
  "https://preview--linkvault-bloom-nexus.lovable.app",
];

const corsConfig = cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("❌ Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
});

module.exports = corsConfig;
