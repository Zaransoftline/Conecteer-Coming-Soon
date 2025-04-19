import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

let cached = global.mongoose || { conn: null, promise: null };

async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
