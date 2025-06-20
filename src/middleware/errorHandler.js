module.exports = function errorHandler(err, req, res, next) {
  // Duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0]; // e.g. "name" (or "id")
    return res.status(409).json({
      message: `Duplicate value for "${field}". A record with that ${field} already exists.`,
    });
  }

  // Validation or other Mongoose errors
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }

  // Everything else
  console.error(err);
  res.status(500).json({ message: "Server error" });
};
