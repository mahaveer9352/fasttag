const express = require('express');
const router = express.Router();

const { register, login, getProfile, updateProfile, getAllUsers, getUserById } = require('../controllers/authController');

const upload = require('../middleware/upload');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { generatePayment, callbackPayIn, getWalletTransactions, getAdminDashboard } = require('../controllers/topupController');

router.get('/wallet/report', auth, getWalletTransactions);
router.get('/dashboard', auth, getAdminDashboard);
router.post('/wallet', auth, generatePayment);
router.post('/wallet/callback', callbackPayIn);



module.exports = router;
