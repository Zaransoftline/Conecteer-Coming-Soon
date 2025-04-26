const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
require("dotenv").config();
const path = require("path");
const { signInWithEmailAndPassword } = require("firebase/auth");
const app = express();
const PORT = process.env.PORT || 3000;
const bcrypt = require('bcryptjs');
const saltRounds = 10;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

//Firebase
const admin = require("firebase-admin");

const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});


// MongoDB schema
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  uid: { type: String, required: true, unique: true },
  emailVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
});

const User = mongoose.model("User", userSchema);
const auth = admin.auth();

// Email setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true, // Adjust based on your provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const { v4: uuidv4 } = require("uuid");
const pendingVerifications = new Map();

app.post("/signup", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("Email and password are required");
  }

  try {
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
    });

    const token = uuidv4();
    pendingVerifications.set(token, {
      uid: userRecord.uid,
      firstName,
      lastName,
      password,
      email,
      createdAt: Date.now(), // Signup time
      lastResendAt: Date.now(), // Initialize resend cooldown immediately
    });

    const verificationLink = `https://conecteer.com/verify-email?token=${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: "Verify your email",
      html: `<p>Please confirm your email by clicking the link below:</p><a href="${verificationLink}">${verificationLink}</a>`,
    });

    res.redirect("/verify.html");
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).send("Error creating user");
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const user = await User.findOne({ email: email }); // Find the user by email

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    if (user.emailVerified === false) {
      console.log("Please verify your email.");
      return res.status(401).json({ error: "Please verify your email." });
    }

    // Compare the provided password with the stored hashed password
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (isPasswordMatch) {
      return res.status(200).json({
        message: `Login successful!`,
      });
    } else {
      return res.status(401).json({ error: "Invalid credentials." });
    }
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});
app.get("/verify-email", async (req, res) => {
  const { token } = req.query;

  if (!token || !pendingVerifications.has(token)) {
    return res.status(400).send("Invalid or expired token.");
  }

  const userData = pendingVerifications.get(token);

  const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
  if (Date.now() - userData.createdAt > oneHour) {
    pendingVerifications.delete(token);
    return res.status(400).send("Verification link has expired.");
  }

  const { uid, firstName, lastName, password } = userData;

  try {
    const userRecord = await admin.auth().getUser(uid);

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      email: userRecord.email,
      uid: userRecord.uid,
      firstName,
      lastName,
      password: hashedPassword,
      emailVerified: true,
    });

    await newUser.save();
    pendingVerifications.delete(token);

    res.sendFile(path.join(__dirname, "public", "verified.html"));
  } catch (error) {
    console.error("Error verifying user:", error);
    res.status(500).send("Failed to verify email.");
  }
});

app.post("/check-verification", async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: "Email is required." });

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }

  res.json({ verified: user.emailVerified });
});

app.post("/resend-verification", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  try {
    const pendingEntry = [...pendingVerifications.entries()].find(
      ([token, data]) => data && data.email === email
    );

    if (!pendingEntry) {
      return res.status(404).json({ error: "User not found or already verified." });
    }

    const [oldToken, userData] = pendingEntry;

    // Check 1-minute cooldown (based on lastResendAt from signup)
    const oneMinute = 60 * 1000;
    if (Date.now() - userData.lastResendAt < oneMinute) {
      return res.status(429).json({ error: "Please wait 1 minute before resending." });
    }

    pendingVerifications.delete(oldToken);

    const newToken = uuidv4();
    pendingVerifications.set(newToken, {
      ...userData,
      createdAt: userData.createdAt,
      lastResendAt: Date.now(), // Update to now after this resend
    });

    const verificationLink = `http://localhost:3000/verify-email?token=${newToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: "Verify your email - Resend",
      html: `<p>Please confirm your email by clicking the link below:</p><a href="${verificationLink}">${verificationLink}</a>`,
    });

    res.json({
      message: "Verification email resent. Please check your inbox.",
    });
  } catch (error) {
    console.error("Error resending verification email:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
