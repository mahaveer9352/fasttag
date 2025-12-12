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
  { timestamps: true }
);

module.exports = mongoose.model("Blog", blogSchema);
