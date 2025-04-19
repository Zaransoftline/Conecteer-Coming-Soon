import clientPromise from '../lib/mongodb';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function sendEmail(email) {
  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: process.env.EMAIL_USERNAME,
    subject: 'Thank you for subscribing!',
    text: `Hello,\n\nThank you for subscribing: ${email}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent!');
  } catch (error) {
    console.error('Failed to send email:', error.message);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('Conecteer');
    const users = db.collection('users');

    const existingUser = await users.findOne({ email });

    if (existingUser) {
      return res.redirect(302, '/error.html');
    }

    await users.insertOne({ email });
    await sendEmail(email); // await BEFORE response
    res.redirect(302, '/subscribed.html');

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
