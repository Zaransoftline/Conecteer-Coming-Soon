const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
require('dotenv').config();
const path = require("path");
const initializeApp = require("firebase/app");
const getAnalytics = require("firebase/analytics");

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

const server = express();
const PORT = process.env.PORT || 3000;
const firebaseApp = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const admin = require('firebase-admin');

const serviceAccount = require('./path/to/your/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


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


server.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

//Sign up route

// server.get("/", (req, res) => {
//   res.sendFile(path.join(__dirname, "public", "index.html"));
// });

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
