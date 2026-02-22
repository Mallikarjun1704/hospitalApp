const express = require('express');
const router = express.Router();
const LabBill = require('../models/LabBill');
const LabTest = require('../models/LabTest');
// Optional LabStock model could be added; for now we support saving lab bills and revenue

// Create lab bill
router.post('/', async (req, res) => {
  try {
    const { contact, name, ipdNumber, admissionDate, dischargeDate, services, total, netPayable, advancePayment } = req.body;
    if (!contact || !name) return res.status(400).json({ error: 'contact and name are required' });

    // Lab tests do not track stock — simply validate referenced tests exist
    if (Array.isArray(services)) {
      for (const s of services) {
        if (s.testId) {
          const t = await LabTest.findById(s.testId);
          if (!t) return res.status(400).json({ error: `Lab test not found: ${s.testId}` });
        }
      }
    }

    const bill = new LabBill({ contact, name, ipdNumber, admissionDate: admissionDate ? new Date(admissionDate) : undefined, dischargeDate: dischargeDate ? new Date(dischargeDate) : undefined, services, total, netPayable, advancePayment: Number(advancePayment) || 0 });
    await bill.save();
    res.status(201).json(bill);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// list with optional contact filter
router.get('/', async (req, res) => {
  try {
    const { contact } = req.query;
    const q = {};
    if (contact) q.contact = { $regex: contact, $options: 'i' };
    const bills = await LabBill.find(q).sort({ createdAt: -1 }).limit(500);
    res.json(bills);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// get single
router.get('/:id', async (req, res) => {
  try { const bill = await LabBill.findById(req.params.id); if (!bill) return res.status(404).json({ error: 'Bill not found' }); res.json(bill); } catch (err) { res.status(500).json({ error: err.message }); }
});

// update
router.put('/:id', async (req, res) => { try { const update = req.body; const bill = await LabBill.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }); if (!bill) return res.status(404).json({ error: 'Bill not found' }); res.json(bill); } catch (err) { res.status(500).json({ error: err.message }); } });

// delete
router.delete('/:id', async (req, res) => { try { const b = await LabBill.findByIdAndDelete(req.params.id); if (!b) return res.status(404).json({ error: 'Bill not found' }); res.json({ message: 'Bill deleted' }); } catch (err) { res.status(500).json({ error: err.message }); } });

// revenue stats
router.get('/revenue/stats', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0);
    const startOfYear = new Date(today.getFullYear(), 0, 1, 0, 0, 0);

    const [agg] = await LabBill.aggregate([
      {
        $facet: {
          totals: [{ $group: { _id: null, total: { $sum: '$total' } } }],
          daily: [{ $match: { date: { $gte: startOfDay } } }, { $group: { _id: null, daily: { $sum: '$total' }, count: { $sum: 1 } } }],
          monthly: [{ $match: { date: { $gte: startOfMonth } } }, { $group: { _id: null, monthly: { $sum: '$total' }, count: { $sum: 1 } } }],
          yearly: [{ $match: { date: { $gte: startOfYear } } }, { $group: { _id: null, yearly: { $sum: '$total' }, count: { $sum: 1 } } }],
          todayList: [{ $match: { date: { $gte: startOfDay } } }, { $project: { _id: 0, date: 1, name: 1, contact: 1, total: 1 } }, { $sort: { date: -1 } }]
        }
      }
    ]);

    const revenue = {
      daily: (agg.daily[0] && agg.daily[0].daily) || 0,
      monthly: (agg.monthly[0] && agg.monthly[0].monthly) || 0,
      yearly: (agg.yearly[0] && agg.yearly[0].yearly) || 0,
      total: (agg.totals[0] && agg.totals[0].total) || 0,
      monthlyCount: (agg.monthly[0] && agg.monthly[0].count) || 0,
      yearlyCount: (agg.yearly[0] && agg.yearly[0].count) || 0
    };

    const dailyDetails = {
      totalAmount: (agg.daily[0] && agg.daily[0].daily) || 0,
      count: (agg.daily[0] && agg.daily[0].count) || 0,
      items: agg.todayList || []
    };

    res.json({ revenue, dailyDetails });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
