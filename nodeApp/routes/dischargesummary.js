const express = require('express');
const router = express.Router();
const DischargeSummary = require('../models/DischargeSummary');

// Create or update discharge summary
router.post('/', async (req, res) => {
  try {
    const { contactNumber, ipdNumber } = req.body;
    if (!contactNumber) {
      return res.status(400).json({ error: 'Contact number is required' });
    }

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
