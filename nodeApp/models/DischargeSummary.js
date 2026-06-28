const mongoose = require('mongoose');

const DischargeSummarySchema = new mongoose.Schema({
  patientName: { type: String, required: true },
  contactNumber: { type: String, required: true },
  ipdNumber: { type: String },
  admissionNumber: { type: String },
  consultantName: { type: String },
  admissionDate: { type: Date },
  admissionTime: { type: String },
  dischargeDate: { type: Date },
  dischargeTime: { type: String },
  provisionalDiagnosis: { type: String },
  finalDiagnosis: { type: String },
  icdCode: { type: String },
  presentingComplaints: { type: String },
  illnessSummary: { type: String },
  keyFindings: { type: String },
  substanceHistory: { type: String },
  pastHistory: { type: String },
  familyHistory: { type: String },
  investigations: { type: String },
  hospitalCourse: { type: String },
  dischargeAdvice: { type: String },
  mlcNumber: { type: String },
  date: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('DischargeSummary', DischargeSummarySchema);
