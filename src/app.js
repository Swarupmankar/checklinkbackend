// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");
// const connectDB = require("./config/db");
// const errorHandler = require("./middleware/errorHandler");
// const cookieParser = require("cookie-parser");

// const app = express();
// connectDB();

// app.use((req, res, next) => {
//   const start = Date.now();
//   res.on("finish", () => {
//     const ms = Date.now() - start;
//     console.log(`${req.method} ${req.originalUrl} – ${ms} ms`);
//   });
//   next();
// });

// // global middleware
// app.use(express.json());
// app.use(cookieParser());

// const allowedOrigins = [
//   "http://localhost:8080",
//   "https://checklinkfun.vercel.app",
//   "capacitor://localhost",
//   "http://localhost",
//   "https://localhost",
//   "https://preview--linkvault-bloom-nexus.lovable.app",
// ];

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         console.log("❌ Blocked by CORS:", origin);
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//     credentials: true,
//   })
// );
// app.use(express.urlencoded({ extended: true }));

// app.use("/api/proxy", require("./routes/proxy.routes"));
// app.use("/api/auth", require("./routes/auth.routes"));

// // 🔒 Then mount auth for all remaining routes
// const authMiddleware = require("./middleware/auth.middleware");
// app.use(authMiddleware);

// // mounted routes
// app.use("/api/urls", require("./routes/url.routes"));
// app.use("/api/users", require("./routes/user.routes"));
// app.use("/api/notebook", require("./routes/notebook.routes"));
// app.use("/api/video", require("./routes/thumbnail.routes"));
// app.use(errorHandler);

// // default 404 handler
// app.use((_req, res) => res.status(404).send("Route not found"));

// // start server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on ${PORT}`));

require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/db");
const corsConfig = require("./config/cors.config");
const logger = require("./middleware/logger.middleware");
const errorHandler = require("./middleware/errorHandler");

const { publicRoutes, protectedRoutes } = require("./routes");

// Initialize app
const app = express();
connectDB();

// Middleware
app.use(logger);
app.use(express.json());
app.use(cookieParser());
app.use(corsConfig);
app.use(express.urlencoded({ extended: true }));

// Public routes
app.use("/api/auth", publicRoutes.auth);
app.use("/api/proxy", publicRoutes.proxy);

// Auth middleware
app.use(require("./middleware/auth.middleware"));

// Protected routes
app.use("/api/urls", protectedRoutes.urls);
app.use("/api/users", protectedRoutes.users);
app.use("/api/notebook", protectedRoutes.notebook);
app.use("/api/video", protectedRoutes.thumbnail);

// Error + 404
app.use(errorHandler);
app.use((_req, res) => res.status(404).send("Route not found"));

// Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));
