import clientPromise from '../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
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

    return res.redirect(302, '/subscribed.html');
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
