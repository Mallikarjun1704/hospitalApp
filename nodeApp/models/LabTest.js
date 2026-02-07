const mongoose = require('mongoose');

const LabTestSchema = new mongoose.Schema({
  code: String,
  name: String,
  price: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('LabTest', LabTestSchema);
