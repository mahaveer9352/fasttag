const express = require("express");
const router = express.Router();

const {
  createBlog,
  getAllBlogs,
  getBlogBySlug,
  updateBlog,
  deleteBlog
} = require("../controllers/blogController");

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const upload = require("../middleware/upload");

// CREATE BLOG (Admin)
router.post("/create", auth,admin, upload.single("thumbnail"), createBlog);


// UPDATE BLOG (Admin)
router.put("/:slug", auth, admin, upload.single("thumbnail"), updateBlog);

// DELETE BLOG (Admin)
router.delete("/:slug", auth, admin, deleteBlog);

// PUBLIC ROUTES
router.get("/all", getAllBlogs);
router.get("/:slug", getBlogBySlug);

module.exports = router;
