const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.DB_URI;  // Read connection string from .env file
const client = new MongoClient(uri);

async function connectDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    return client.db('your_database_name'); // Replace with your DB name
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    process.exit(1);
  }
}

module.exports = connectDB;
