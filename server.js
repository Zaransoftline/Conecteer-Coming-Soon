const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
require('dotenv').config();
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// MongoDB schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
});
const User = mongoose.model('User', userSchema);

// Email setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// POST endpoint to save email and notify
// POST endpoint
app.post('/subscribe', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const newUser = new User({ email });
    await newUser.save();

    await transporter.sendMail({
      from: `"Notifier" <${process.env.EMAIL_USERNAME}>`,
      to: process.env.EMAIL_USERNAME,
      subject: '🎉 New Subscriber!',
      text: `A new user has subscribed with email: ${email}`,
    });

    return res.status(201).json({ redirect: "/subscribed" });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ redirect: "/error", message: "Email already subscribed" });
    }

    console.error("Error processing subscription:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});



app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/subscribed", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "subscribed.html"));
});

app.get("/error", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "error.html"));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
