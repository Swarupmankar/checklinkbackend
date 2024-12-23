const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// User Schema and Model
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

// URL Schema and Model
const urlSchema = new mongoose.Schema({
  url: { type: String, unique: true },
  date: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["pending", "downloaded", "scraped"],
    default: "pending",
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

urlSchema.index({ url: 1, user: 1 }, { unique: true });
const URL = mongoose.model("URL", urlSchema);

// Middleware for authenticating tokens
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).send("Access denied");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Store user info in the request
    next();
  } catch (err) {
    res.status(403).send("Invalid token");
  }
};

// Routes

// User Registration
app.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).send("All fields are required");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await User.create({ username, email, password: hashedPassword });
    res.status(201).send("User registered successfully");
  } catch (err) {
    res.status(400).send("Error: Username or email already exists");
  }
});

// User Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).send("User not found");

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) return res.status(400).send("Invalid credentials");

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  res.json({ token });
});

app.get("/api/auth/verify", authenticate, (req, res) => {
  res.status(200).send("Authenticated");
});

// Get All URLs (Protected)
app.get("/api/urls", authenticate, async (req, res) => {
  const urls = await URL.find({ user: req.user.id }).sort({ date: -1 });
  res.json(urls);
});

// Get URL Stats (Protected)
app.get("/api/stats", authenticate, async (req, res) => {
  const downloaded = await URL.countDocuments({
    status: "downloaded",
    user: req.user.id,
  });
  const scraped = await URL.countDocuments({
    status: "scraped",
    user: req.user.id,
  });
  const pending = await URL.countDocuments({
    status: "pending",
    user: req.user.id,
  });
  res.json({ downloaded, scraped, pending });
});

// Add URL (Protected)
app.post("/api/urls", authenticate, async (req, res) => {
  try {
    const { url } = req.body;
    const exists = await URL.findOne({ url, user: req.user.id });
    if (exists) {
      return res.status(400).send("URL already exists!");
    }

    const newUrl = new URL({ url, user: req.user.id });
    await newUrl.save();
    res.status(201).send("URL added successfully!");
  } catch (err) {
    res.status(400).send("Error: URL must be unique!");
  }
});

// Perform Actions on URLs (Protected)
app.post("/api/urls/:id/:action", authenticate, async (req, res) => {
  const { id, action } = req.params;
  const allowedActions = ["download", "scrap", "delete"];
  if (!allowedActions.includes(action)) {
    return res.status(400).send("Invalid action");
  }

  const url = await URL.findById(id);
  if (!url || !url.user.equals(req.user.id)) {
    return res.status(403).send("Access denied to modify this URL");
  }

  if (action === "delete") {
    await URL.findByIdAndDelete(id);
  } else {
    const status = action === "download" ? "downloaded" : "scraped";
    await URL.findByIdAndUpdate(id, { status });
  }

  res.send("Action performed successfully!");
});

// File Upload for .txt (Protected)
const upload = multer({ dest: "uploads/" });
app.post(
  "/api/upload",
  authenticate,
  upload.single("file"),
  async (req, res) => {
    const fs = require("fs");
    const links = fs
      .readFileSync(req.file.path, "utf-8")
      .split("\n")
      .filter(Boolean);
    for (let url of links) {
      try {
        await URL.create({ url, user: req.user.id });
      } catch (err) {
        continue; 
      }
    }
    fs.unlinkSync(req.file.path); 
    res.send("File processed successfully!");
  }
);

// Start server
app.listen(5000, () => {
  console.log("Server is running");
});
