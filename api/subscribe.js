import { MongoClient } from 'mongodb';
import nodemailer from 'nodemailer';

let cachedDb = null;

// Connect to MongoDB
async function connectDb() {
  if (cachedDb) {
    return cachedDb; // Reuse cached DB connection
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  const db = await client.connect();
  cachedDb = db.db('Conecteer'); // Specify your database name
  return cachedDb;
}

// Nodemailer setup for your SMTP server (Example: Gmail SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can change this to another email service
  auth: {
    user: process.env.EMAIL_USERNAME, // Your email address (e.g., 'your-email@gmail.com')
    pass: process.env.EMAIL_PASSWORD, // Your email password or app-specific password
  },
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email } = req.body; // Only handling email

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    try {
      console.log('Connecting to DB...');
      const database = await connectDb();
      console.log('DB connected');

      const usersCollection = database.collection('users');
      console.log('Checking for existing email...');
      const existingUser = await usersCollection.findOne({ email });

      if (existingUser) {
        console.log('Email already exists, redirecting...');
        return res.redirect(302, '/error.html');
      }

      console.log('Inserting new email...');
      await usersCollection.insertOne({ email });

      // Prepare the email content
      const mailOptions = {
        from: process.env.EMAIL_USERNAME, // Sender email
        to: process.env.EMAIL_USERNAME, // Recipient email
        subject: 'Thank you for subscribing!',
        text: `Hello,\n\nThank you for your subscription. We've added your email to our list.`,
      };

      console.log('Sending email...');
      await transporter.sendMail(mailOptions);

      console.log('Redirecting to success page...');
      return res.redirect(302, '/subscribed.html');
    } catch (error) {
      console.error('Error occurred:', error);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
