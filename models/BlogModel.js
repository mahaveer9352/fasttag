const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    shortDescription: { type: String, required: true },
    content: { type: String, required: true },
    thumbnail: { type: String }, // image
    author: { type: String, default: "Admin" }
  },
  { timestamps: true ,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

blogSchema.virtual("thumbnailUrl").get(function () {
  if (!this.thumbnail) return null;
  return `${BASE_URL}${this.thumbnail}`;
});
module.exports = mongoose.model("Blog", blogSchema);
