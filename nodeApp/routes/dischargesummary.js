const express = require('express');
const router = express.Router();
const DischargeSummary = require('../models/DischargeSummary');

// helper to parse date strings safely. Accepts ISO, JS date strings, timestamps
// and also common `DD/MM/YYYY` format used by the frontend.
const parseDateSafe = (val) => {
  if (!val) return undefined;
  if (val instanceof Date) return isNaN(val.getTime()) ? undefined : val;
  if (typeof val === 'string') {
    const dmY = val.trim();
    const ddmmyyyy = dmY.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyy) {
      const d = ddmmyyyy[1].padStart(2, '0');
      const m = ddmmyyyy[2].padStart(2, '0');
      const y = ddmmyyyy[3];
      const iso = `${y}-${m}-${d}`;
      const dateObj = new Date(iso);
      return isNaN(dateObj.getTime()) ? undefined : dateObj;
    }
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? undefined : d;
};

// Sanitize date fields in a body object before saving
const sanitizeDates = (body) => {
  if (body.admissionDate !== undefined) {
    const parsed = parseDateSafe(body.admissionDate);
    if (parsed === undefined) delete body.admissionDate;
    else body.admissionDate = parsed;
  }
  if (body.dischargeDate !== undefined) {
    const parsed = parseDateSafe(body.dischargeDate);
    if (parsed === undefined) delete body.dischargeDate;
    else body.dischargeDate = parsed;
  }
  return body;
};

// Create or update discharge summary
router.post('/', async (req, res) => {
  try {
    const { contactNumber, ipdNumber } = req.body;
    if (!contactNumber) {
      return res.status(400).json({ error: 'Contact number is required' });
    }

    // Sanitize date fields
    sanitizeDates(req.body);

    // Attempt to find an existing summary to update, otherwise create a new one
    let summary = null;
    if (ipdNumber) {
      summary = await DischargeSummary.findOne({ ipdNumber });
    } else {
      summary = await DischargeSummary.findOne({ contactNumber });
    }

    if (summary) {
      // Update existing
      Object.assign(summary, req.body);
      await summary.save();
      return res.json({ message: 'Discharge summary saved successfully', summary });
    } else {
      // Create new
      summary = new DischargeSummary(req.body);
      await summary.save();
      return res.status(201).json({ message: 'Discharge summary saved successfully', summary });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List all discharge summaries (with optional contact filter)
router.get('/', async (req, res) => {
  try {
    const { contact, ipdNumber } = req.query;
    let query = {};
    if (contact) query.contactNumber = contact;
    if (ipdNumber) query.ipdNumber = ipdNumber;
    const summaries = await DischargeSummary.find(query).sort({ updatedAt: -1 });
    res.json(summaries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Find discharge summary by contact or IPD number
router.get('/find', async (req, res) => {
  try {
    const { contact, ipdNumber } = req.query;
    if (!contact && !ipdNumber) {
      return res.status(400).json({ error: 'contact or ipdNumber query parameter is required' });
    }

    let query = {};
    if (ipdNumber) {
      query.ipdNumber = ipdNumber;
    } else {
      query.contactNumber = contact;
    }

    const summary = await DischargeSummary.findOne(query).sort({ updatedAt: -1 });
    if (!summary) {
      return res.status(404).json({ error: 'Discharge summary not found' });
    }
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single discharge summary by ID
router.get('/:id', async (req, res) => {
  try {
    const summary = await DischargeSummary.findById(req.params.id);
    if (!summary) {
      return res.status(404).json({ error: 'Discharge summary not found' });
    }
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a discharge summary
router.delete('/:id', async (req, res) => {
  try {
    const summary = await DischargeSummary.findByIdAndDelete(req.params.id);
    if (!summary) {
      return res.status(404).json({ error: 'Discharge summary not found' });
    }
    res.json({ message: 'Discharge summary deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
