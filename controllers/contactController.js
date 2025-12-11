const Contact = require("../models/contactModel");

/**
 * CREATE CONTACT MESSAGE
 */
exports.createContact = async (req, res) => {
  try {
    const { fullName, email, mobile, message } = req.body;

    if (!fullName || !email || !mobile || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const contact = await Contact.create({
      fullName,
      email,
      mobile,
      message
    });

    res.status(201).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error("Create Contact Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


/**
 * GET ALL CONTACT MESSAGES
 */
exports.getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({ success: true, total: contacts.length, data: contacts });
  } catch (error) {
    console.error("Get Contacts Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


/**
 * GET SINGLE CONTACT MESSAGE BY ID
 */
exports.getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact)
      return res.status(404).json({ success: false, message: "Contact not found" });

    res.json({ success: true, data: contact });
  } catch (error) {
    console.error("Get Contact By ID Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


/**
 * UPDATE CONTACT MESSAGE
 */
exports.updateContact = async (req, res) => {
  try {
    const updated = await Contact.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ success: false, message: "Contact not found" });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update Contact Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


/**
 * DELETE CONTACT MESSAGE
 */
exports.deleteContact = async (req, res) => {
  try {
    const deleted = await Contact.findByIdAndDelete(req.params.id);

    if (!deleted)
      return res.status(404).json({ success: false, message: "Contact not found" });

    res.json({ success: true, message: "Contact deleted successfully" });
  } catch (error) {
    console.error("Delete Contact Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
