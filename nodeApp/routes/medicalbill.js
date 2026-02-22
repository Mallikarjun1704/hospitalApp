const express = require('express');
const router = express.Router();
const MedicalBill = require('../models/MedicalBill');
const Medicine = require('../models/Medicine');

// Create medical bill and decrement medicine stock
router.post('/', async (req, res) => {
  try {
    const { contact, name, ipdNumber, admissionDate, dischargeDate, services, total, netPayable, advancePayment } = req.body;
    if (!contact || !name) return res.status(400).json({ error: 'contact and name are required' });

    // For sale flows (non-pharmacy-bill) decrement stock unless caller sets skipStock
    if (!req.body.skipStock && Array.isArray(services)) {
      for (const s of services) {
        if (s.medicineId) {
          const med = await Medicine.findById(s.medicineId);
          if (!med) return res.status(400).json({ error: `Medicine not found: ${s.medicineId}` });
          const qty = Number(s.quantity) || 0;
          if (med.stock < qty) return res.status(400).json({ error: `Insufficient stock for ${med.name}` });
          med.stock -= qty;
          await med.save();
        }
      }
    }

    // (stock decrement already handled above per-service)

    const bill = new MedicalBill({ contact, name, ipdNumber, admissionDate: admissionDate ? new Date(admissionDate) : undefined, dischargeDate: dischargeDate ? new Date(dischargeDate) : undefined, services, total, netPayable, advancePayment: Number(advancePayment) || 0 });
    await bill.save();
    res.status(201).json(bill);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// list medical bills with optional contact filter and limit
router.get('/', async (req, res) => {
  try {
    const { contact } = req.query;
    const q = {};
    if (contact) q.contact = { $regex: contact, $options: 'i' };
    const bills = await MedicalBill.find(q).sort({ createdAt: -1 }).limit(500);
    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get single
router.get('/:id', async (req, res) => {
  try {
    const bill = await MedicalBill.findById(req.params.id);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    res.json(bill);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// update
router.put('/:id', async (req, res) => {
  try {
    const update = req.body;
    const bill = await MedicalBill.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    res.json(bill);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// delete
router.delete('/:id', async (req, res) => {
  try {
    const b = await MedicalBill.findByIdAndDelete(req.params.id);
    if (!b) return res.status(404).json({ error: 'Bill not found' });
    res.json({ message: 'Bill deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// revenue
router.get('/revenue/stats', async (req, res) => {
  try {
    const today = new Date();
    // Set to start of day/month/year in local timezone
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0);
    const startOfYear = new Date(today.getFullYear(), 0, 1, 0, 0, 0);

    const [agg] = await MedicalBill.aggregate([
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
