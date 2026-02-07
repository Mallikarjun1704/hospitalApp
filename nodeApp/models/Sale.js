const mongoose = require('mongoose');
  
  const SaleSchema = new mongoose.Schema({
    items: [
      {
        medicineId: mongoose.Schema.Types.ObjectId,
        uniqueCode: String,
        name: String,
        unitPrice: Number,
        quantity: Number,
        amount: Number,
      }
    ],
    totalAmount: { type: Number },
    date: { type: Date, default: Date.now }
  });
  
  const Sale = mongoose.model('sale', SaleSchema);
  module.exports = Sale;