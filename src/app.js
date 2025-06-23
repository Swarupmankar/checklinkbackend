require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const cookieParser = require("cookie-parser");

const app = express();
connectDB();

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} – ${ms} ms`);
  });
  next();
});

// global middleware
app.use(express.json());
app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:8080",
  "https://checklinkfun.vercel.app",
  "capacitor://localhost",
  "http://localhost",
  "https://localhost",
  "https://preview--linkvault-bloom-nexus.lovable.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: true }));

// mounted routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/urls", require("./routes/url.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/notebook", require("./routes/notebook.routes"));
app.use("/api/video", require("./routes/thumbnail.routes"));
app.use(errorHandler);

// default 404 handler
app.use((_req, res) => res.status(404).send("Route not found"));

// start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
