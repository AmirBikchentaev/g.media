// db/mongoose.ts
import mongoose from 'mongoose';

let isConnected = false;

export async function connectMongo(retries = 10, delayMs = 1500) {
  if (isConnected) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');

  mongoose.set('strictQuery', true);

  const safe = uri.replace(/(\/\/[^:]+:)[^@]+@/, '$1***@');
  console.log('[mongo] connecting to', safe);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(uri);
      isConnected = true;
      console.log('[mongo] connected');
      return;
    } catch (err) {
      console.error(`[mongo] connect attempt ${attempt}/${retries} failed:`, (err as Error).message);
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}
