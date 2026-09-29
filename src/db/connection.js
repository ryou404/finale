const mongoose = require('mongoose');
require('dotenv').config();

let isConnected = false;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn('[MongoDB] Warning: MONGO_URI is not set in environment.');
    return null;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    isConnected = true;
    console.log(`✅ [MongoDB Atlas] Connected successfully to database: "${conn.connection.name}" at host "${conn.connection.host}"`);
    return conn.connection;
  } catch (error) {
    console.error('❌ [MongoDB Atlas] Connection failed:', error.message);
    return null;
  }
}

module.exports = { connectDB, mongoose };
