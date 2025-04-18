import dbConnect from '../lib/db';
import mongoose from 'mongoose';

const EmailSchema = new mongoose.Schema({
  address: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now },
});
const Email = mongoose.models.Email || mongoose.model('Email', EmailSchema);

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    try {
      const existing = await Email.findOne({ address: email });
      if (existing) {
        return res.status(200).json({ error: "You're already subscribed!" });
      }

      await Email.create({ address: email });
      res.status(200).json({ message: 'Subscribed!' });
    } catch (err) {
      console.error(err);  // Log the error for debugging
      res.status(500).json({ error: 'Server error: ' + err.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
