const { Schema, model } = require("mongoose");

const urlSchema = new Schema(
  {
    url: { type: String, unique: true },
    date: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["pending", "downloaded", "scraped"],
      default: "pending",
    },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

urlSchema.index({ url: 1, user: 1 }, { unique: true });

module.exports = model("URL", urlSchema);
