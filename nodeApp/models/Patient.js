const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String },
  age: { type: Number },
  gender: { type: String },
  ipdNumber: { type: String, unique: true, index: true },
  contact: { type: String, required: true },
  // Amount for billing — used to compute revenue totals
  amount: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
  consultDoctor: { type: String },
  personalHistory: { type: String },
  chiefComplaints: { type: String },
  historyPresenting: { type: String },
  previousHistory: { type: String },
  allergicHistory: { type: String },
  gcs: { type: String },
  temp: { type: String },
  pulse: { type: String },
  bp: { type: String },
  spo2: { type: String },
  rbs: { type: String },

  // IPD-specific physical exam fields
  generalPhysicalExam: { type: String },
  cvs: { type: String },
  rs: { type: String },
  pa: { type: String },
  cns: { type: String },
  provisionalDiagnosis: { type: String },

  // Right side observations
  pallor: { type: String },
  icterus: { type: String },
  clubbing: { type: String },
  cyanosis: { type: String },
  edema: { type: String },

  // Form type: 'IPD' or 'OPD'
  formType: { type: String, enum: ['IPD', 'OPD'], default: 'IPD' }
}, {
  timestamps: true
});

const Patient = mongoose.model('Patient', patientSchema);
module.exports = Patient;
