const express = require('express');
const router = express.Router();

const { register, login, getProfile, updateProfile, getAllUsers, getUserById } = require('../controllers/authController');

const upload = require('../middleware/upload');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// REGISTER (with image upload)
router.post('/register', upload.single('profileImage'), register);

// LOGIN
router.post('/login', login);

// GET USER PROFILE (protected)
router.get('/profile', auth, getProfile);

router.put('/update-profile', auth , upload.single("profileImage"), updateProfile);


// GET ALL USERS (admin only)
router.get('/all-users', auth, admin, getAllUsers);

// GET SINGLE USER
router.get('/user/:id', auth, getUserById);


module.exports = router;
