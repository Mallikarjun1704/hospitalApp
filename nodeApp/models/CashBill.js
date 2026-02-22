const mongoose = require('mongoose');

const CashBillSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  contact: String,
  name: String,
  ipdNumber: String,
  admissionDate: Date,
  dischargeDate: Date,
  services: [
    {
      no: Number,
      service: String,
      price: Number,
      quantity: Number,
      cgst: Number,
      sgst: Number,
      total: Number,
    }
  ],
  total: Number,
  advancePayment: { type: Number, default: 0 },
  netPayable: Number,
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('CashBill', CashBillSchema);
