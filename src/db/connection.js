const mongoose = require('mongoose');
const { enableOfflineDatabase, isOfflineActive } = require('./offlineAdapter');
require('dotenv').config();

let isConnected = false;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGO_URI;
  if (!uri || uri.includes('...')) {
    console.warn('[MongoDB] MONGO_URI is not configured (or masked). Switching to Local Offline Database Mode.');
    enableOfflineDatabase();
    return null;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`✅ [MongoDB Atlas] Connected successfully to database: "${conn.connection.name}" at host "${conn.connection.host}"`);
    return conn.connection;
  } catch (error) {
    console.error('❌ [MongoDB Atlas] Connection failed, activating Local Offline Database Fallback:', error.message);
    enableOfflineDatabase();
    return null;
  }
}

module.exports = { connectDB, mongoose, isOfflineActive };
