import mongoose from 'mongoose';

let cached = global.mongoose || { conn: null, promise: null };

async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const uri = 'mongodb+srv://Zaransoftline:Nazik_15.03@conecteer.dgvosao.mongodb.net/?retryWrites=true&w=majority&appName=Conecteer';
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
