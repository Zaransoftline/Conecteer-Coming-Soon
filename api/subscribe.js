import { MongoClient } from "mongodb";
import nodemailer from "nodemailer";

const client = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
let db;

const transporter = nodemailer.createTransport({
  service: 'gmail', // Replace with your preferred service
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function connectDb() {
  if (!db) {
    await client.connect();
    db = client.db('Conecteer'); // Replace with your database name
  }
  return db;
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, name, message } = req.body;

    try {
      // Connect to the database
      const database = await connectDb();
      const usersCollection = database.collection('users'); // Replace with your collection name

      // Check if the email already exists
      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) {
        // Redirect to another page if the email exists
        return res.redirect(302, '/error.html'); // Adjust with your redirect path
      }

      // Save the new email to the database
      await usersCollection.insertOne({ email, name, message });

      // Send the email (using Nodemailer)
      const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: process.env.EMAIL_USERNAME,
        subject: 'New User',
        text: `${email}`,
      };

      await transporter.sendMail(mailOptions);

      // Redirect to the success page
      return res.redirect(302, '/subscribed.html'); // Adjust with your redirect path
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
