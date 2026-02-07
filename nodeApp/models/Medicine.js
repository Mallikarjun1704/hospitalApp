const mongoose = require('mongoose');
  
  const MedicineSchema = new mongoose.Schema({
    code: { type: String, unique: true, index: true, required: true },
    name: { type: String, required: true },
    stock: { type: Number, default: 0 },
    purchasePrice: { type: Number, default: 0 },
    salePrice: { type: Number, default: 0 },
    purchaseDate: { type: Date },
    expiryDate: { type: Date },
    manufacturer: { type: String },
    description: { type: String },
  }, { timestamps: true });
  
  const Medicine = mongoose.model('Medicine', MedicineSchema);
  module.exports = Medicine;