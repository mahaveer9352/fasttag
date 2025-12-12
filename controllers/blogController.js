const Blog = require("../models/BlogModel");
const slugify = require("slugify");

/**
 * CREATE BLOG (Admin)
 */
exports.createBlog = async (req, res) => {
  try {
    const { title, shortDescription, content, author } = req.body;

    if (!title || !shortDescription || !content) {
      return res.status(400).json({
        success: false,
        message: "Title, short description and content are required",
      });
    }

    const slug = slugify(title, { lower: true, strict: true });

    // Check duplicate slug
    const exist = await Blog.findOne({ slug });
    if (exist) {
      return res.status(400).json({
        success: false,
        message: "Blog with this title already exists",
      });
    }

    const blogData = {
      title,
      slug,
      shortDescription,
      content,
      author: author || "Admin",
    };

    // Add image if uploaded
    if (req.file) {
      blogData.thumbnail = "/uploads/" + req.file.filename;
    }

    const blog = await Blog.create(blogData);

    res.status(201).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    console.error("Create Blog Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


/**
 * GET ALL BLOGS (Public)
 */
exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json({ success: true, total: blogs.length, data: blogs });
  } catch (error) {
    console.error("Get Blogs Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


/**
 * GET SINGLE BLOG BY SLUG (Public)
 */
exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });

    if (!blog)
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });

    res.json({ success: true, data: blog });
  } catch (error) {
    console.error("Get Blog Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


/**
 * UPDATE BLOG (Admin)
 */
exports.updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog)
      return res.status(404).json({ success: false, message: "Blog not found" });

    // If new image
    if (req.file) {
      req.body.thumbnail = "/uploads/" + req.file.filename;
    }

    // If title updated → update slug too
    if (req.body.title) {
      req.body.slug = slugify(req.body.title, { lower: true, strict: true });
    }

    const updated = await Blog.findByIdAndUpdate(blog._id, req.body, { new: true });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update Blog Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


/**
 * DELETE BLOG (Admin)
 */
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog)
      return res.status(404).json({ success: false, message: "Blog not found" });

    await Blog.findByIdAndDelete(blog._id);

    res.json({ success: true, message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Delete Blog Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
