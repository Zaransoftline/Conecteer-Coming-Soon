const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
require('dotenv').config();
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

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
app.post('/subscribe', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    // Save to database
    const newUser = new User({ email });
    await newUser.save();

    // Send notification email to you
    await transporter.sendMail({
      from: `"Notifier" <${process.env.EMAIL_USERNAME}>`,
      to: process.env.EMAIL_USERNAME,
      subject: '🎉 New Subscriber!',
      text: `A new user has subscribed with email: ${email}`,
    });

    res.status(201).json({ message: 'User subscribed and email sent!' });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Email already exists' });
    } else {
      res.status(500).json({ message: 'Something went wrong' });
    }
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
