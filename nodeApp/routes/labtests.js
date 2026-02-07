const express = require('express');
const router = express.Router();
const LabTest = require('../models/LabTest');

// list lab tests
router.get('/', async (req, res) => {
  try {
    const q = req.query.q ? { $or: [ { code: new RegExp(req.query.q, 'i') }, { name: new RegExp(req.query.q, 'i') } ] } : {};
    const tests = await LabTest.find(q).sort({ name: 1 }).limit(500);
    res.json(tests);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// add lab test (no stock maintained for lab tests)
router.post('/', async (req, res) => {
  try {
    const { code, name, price } = req.body;
    if (!code || !name) return res.status(400).json({ error: 'Code and name required' });
    const existing = await LabTest.findOne({ code });
    if (existing) return res.status(400).json({ error: 'Code already exists' });
    const t = new LabTest({ code, name, price: Number(price) || 0 });
    await t.save();
    res.json(t);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
