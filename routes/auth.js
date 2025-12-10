const express = require('express');
const router = express.Router();

const { register, login, getProfile } = require('../controllers/authController');

const upload = require('../middleware/upload');
const auth = require('../middleware/auth');

// REGISTER (with image upload)
router.post('/register', upload.single('profileImage'), register);

// LOGIN
router.post('/login', login);

// GET USER PROFILE (protected)
router.get('/profile', auth, getProfile);

module.exports = router;
