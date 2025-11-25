import mongoose from 'mongoose';

let migrationRun = false;

export async function migrateAttendanceIndexes() {
  if (migrationRun) return;
  
  try {
    const db = mongoose.connection.db;
    if (!db) {
      console.log('[Attendance Migration] Database not connected yet, skipping...');
      return;
    }

    const collection = db.collection('attendances');
    const indexes = await collection.indexes();
    
    const oldIndexExists = indexes.some(index => index.name === 'user_1_date_1');
    
    if (oldIndexExists) {
      console.log('[Attendance Migration] Dropping old index: user_1_date_1');
      await collection.dropIndex('user_1_date_1');
      console.log('[Attendance Migration] ✅ Old index dropped successfully');
    } else {
      console.log('[Attendance Migration] Old index not found, skipping drop');
    }
    
    console.log('[Attendance Migration] Ensuring new index: user_1_date_1_sessionNumber_1');
    await collection.createIndex(
      { user: 1, date: 1, sessionNumber: 1 },
      { unique: true, name: 'user_1_date_1_sessionNumber_1' }
    );
    console.log('[Attendance Migration] ✅ New index created successfully');
    
    migrationRun = true;
  } catch (error: any) {
    if (error.code === 85) {
      console.log('[Attendance Migration] Index already exists, skipping');
      migrationRun = true;
    } else {
      console.error('[Attendance Migration] Error:', error.message);
    }
  }
}
