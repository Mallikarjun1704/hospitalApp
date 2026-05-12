const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function dropIndex() {
  try {
    await mongoose.connect(process.env.MONGO_BD);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('medicines');

    // List indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);

    if (indexes.find(idx => idx.name === 'name_1')) {
      await collection.dropIndex('name_1');
      console.log('Successfully dropped name_1 unique index');
    } else {
      console.log('name_1 index not found');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

dropIndex();
