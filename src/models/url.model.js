// const { Schema, model } = require("mongoose");

// const urlSchema = new Schema(
//   {
//     url: { type: String, unique: true },
//     date: { type: Date, default: Date.now },
//     status: {
//       type: String,
//       enum: ["pending", "downloaded", "scraped"],
//       default: "pending",
//     },
//     user: { type: Schema.Types.ObjectId, ref: "User", required: true },
//   },
//   { timestamps: true }
// );

// urlSchema.index({ url: 1, user: 1 }, { unique: true });

// module.exports = model("URL", urlSchema);

const { Schema, model } = require("mongoose");

const urlSchema = new Schema(
  {
    url: {
      type: String,
      unique: true,
      required: true,
      validate: {
        validator: function (v) {
          try {
            new URL(v);
            return true;
          } catch {
            return false;
          }
        },
        message: (props) => `${props.value} is not a valid URL!`,
      },
    },
    domain: {
      type: String,
      required: true,
      index: true, // Add index for faster domain queries
    },
    title: { type: String },
    thumbnail: {
      data: Buffer, // actual image binary
      contentType: String, // e.g., "image/jpeg"
    },
    date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "downloaded", "scraped"],
      default: "pending",
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add pre-save hook to automatically extract domain
// urlSchema.pre("save", function (next) {
//   if (!this.domain || this.domain === "invalid-domain") {
//     try {
//       let urlToParse = this.url;
//       if (!urlToParse.startsWith("http")) {
//         urlToParse = "http://" + urlToParse;
//       }
//       const parsed = new URL(urlToParse);
//       this.domain = parsed.hostname.replace("www.", "");
//     } catch (err) {
//       this.domain = "invalid-domain";
//     }
//   }
//   next();
// });

urlSchema.pre("save", function (next) {
  if (!this.domain || this.domain === "invalid-domain") {
    this.domain = getBaseDomain(this.url);
  }
  next();
});

// Compound indexes for better query performance
urlSchema.index({ url: 1, user: 1 }, { unique: true });
urlSchema.index({ domain: 1, user: 1 });
urlSchema.index({ status: 1, user: 1 });
urlSchema.index({ date: -1, user: 1 });

module.exports = model("URL", urlSchema);
