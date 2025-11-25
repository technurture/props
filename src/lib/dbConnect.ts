import mongoose from 'mongoose';
import '@/models';
import { migrateAttendanceIndexes } from './migrations/attendance-indexes';

const MONGODB_URI = process.env.MONGODB_URI;

interface CachedConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: CachedConnection | undefined;
}

let cached: CachedConnection = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function dbConnect(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    console.warn('⚠️  MONGODB_URI is not defined. Database operations will fail.');
    console.warn('   Please add MONGODB_URI to your .env.local file.');
    console.warn('   See .env.example for required environment variables.');
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
    
    // Run attendance index migration in the background without blocking
    Promise.resolve().then(() => migrateAttendanceIndexes()).catch((error) => {
      console.error('[DB Connect] Background migration error:', error);
    });
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
