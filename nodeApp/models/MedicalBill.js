const mongoose = require('mongoose');

const MedicalBillSchema = new mongoose.Schema({
  contact: String,
  name: String,
  ipdNumber: String,
  admissionDate: Date,
  dischargeDate: Date,
  services: [
    {
      service: String,
      price: Number,
      quantity: Number,
      total: Number,
      medicineId: mongoose.Schema.Types.ObjectId,
      uniqueCode: String,
      name: String,
    }
  ],
  total: Number,
  advancePayment: { type: Number, default: 0 },
  netPayable: Number,
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('MedicalBill', MedicalBillSchema);
