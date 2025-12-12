require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contactRoutes');
const blogRoutes = require("./routes/blogRoutes");
const otpRoutes = require("./routes/otpRoutes");

const instantPayRoutes = require("./routes/instantPay");

const path = require('path');
const topup = require('./routes/topuproute');
const startWalletAutoFailCron = require('./service/cronjob');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();
startWalletAutoFailCron()
// Middlewares
app.use(cors());
app.use(express.json());
// Serve uploads folder statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/topup', topup);
app.use("/api/instantpay", instantPayRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/blogs", blogRoutes);
// app.use("/api/otp", otpRoutes);





app.get('/', (req, res) => {
  res.send({ success: true, message: 'Backend boilerplate running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
