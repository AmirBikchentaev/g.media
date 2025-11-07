import mongoose from 'mongoose';

let isConnected = false;

export async function connectMongo() {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI ||"mongodb+srv://familygames1985_db_user:OWYLnUOtW2q7XZTR@cluster0.xwmnn1v.mongodb.net/?appName=Cluster0" ;
  if (!uri) throw new Error('MONGODB_URI not set');

  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(uri);
    isConnected = true;
    console.log('[mongo] connected');
  } catch (err) {
    console.error('[mongo] connection error:', err);
    throw err;
  }
}
