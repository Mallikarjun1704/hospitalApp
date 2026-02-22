const mongoose = require('mongoose');

const LabBillSchema = new mongoose.Schema({
  contact: String,
  name: String,
  ipdNumber: String,
  admissionDate: Date,
  dischargeDate: Date,
  services: [
    {
      service: String,
      testId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabTest' },
      testCode: String,
      testName: String,
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

module.exports = mongoose.model('LabBill', LabBillSchema);
