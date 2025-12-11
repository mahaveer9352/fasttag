const express = require("express");
const router = express.Router();

const { 
  createContact,
  getAllContacts,
  getContactById,
  updateContact,
  deleteContact
} = require("../controllers/contactController");

const auth = require("../middleware/auth");   // user verify
const admin = require("../middleware/admin"); // admin check

// CREATE (Anyone can submit contact form)
router.post("/create", createContact);

// GET ALL CONTACTS (Admin only)
router.get("/all", auth, admin, getAllContacts);

// GET SINGLE CONTACT (Admin only)
router.get("/:id", auth, admin, getContactById);

// UPDATE CONTACT (Admin only)
router.put("/:id", auth, admin, updateContact);

// DELETE CONTACT (Admin only)
router.delete("/:id", auth, admin, deleteContact);

module.exports = router;
