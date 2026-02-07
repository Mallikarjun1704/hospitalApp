const express = require('express');
const router = express.Router();
const CashBill = require('../models/CashBill');
const Patient = require('../models/Patient');

// Create a cash bill and upsert patient amount/details
router.post('/', async (req, res) => {
  try {
    const { contact, name, ipdNumber, admissionDate: admissionDateRaw, dischargeDate: dischargeDateRaw, services, total, netPayable, advancePayment } = req.body;

    // helper to parse date strings safely. Accepts ISO, JS date strings, timestamps
    // and also common `DD/MM/YYYY` format used by the frontend.
    const parseDateSafe = (val) => {
      if (!val) return undefined;
      // If already a Date
      if (val instanceof Date) {
        return isNaN(val.getTime()) ? undefined : val;
      }
      // Accept `DD/MM/YYYY` from the frontend
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

    const admissionDate = parseDateSafe(admissionDateRaw);
    const dischargeDate = parseDateSafe(dischargeDateRaw);

    if (!contact) return res.status(400).json({ error: 'contact is required' });
    if (!name) return res.status(400).json({ error: 'name is required' });

    // find or create patient by contact
    let patient = await Patient.findOne({ contact });
    if (!patient) {
      patient = new Patient({ name, contact, ipdNumber, date: admissionDate || new Date(), amount: total || 0, address: '', age: null });
      await patient.save();
    } else {
      // update patient amount and fields if provided
      patient.name = name || patient.name;
      patient.ipdNumber = ipdNumber || patient.ipdNumber;
      patient.date = admissionDate || patient.date;
      patient.amount = total || patient.amount;
      await patient.save();
    }

    const bill = new CashBill({
      patientId: patient._id,
      contact,
      name,
      ipdNumber,
      admissionDate: admissionDate,
      dischargeDate: dischargeDate,
      services,
      total,
      netPayable,
      advancePayment: Number(advancePayment) || 0,
    });
    await bill.save();

    res.status(201).json({ bill, patient });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// List cash bills
router.get('/', async (req, res) => {
  try {
    // populate patient details for convenience in the frontend
    const { contact } = req.query;
    const q = {};
    if (contact) q.contact = { $regex: contact, $options: 'i' };
    const bills = await CashBill.find(q).sort({ createdAt: -1 }).limit(200).populate('patientId');
    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// revenue stats
router.get('/revenue/stats', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0);
    const startOfYear = new Date(today.getFullYear(), 0, 1, 0, 0, 0);

    const [agg] = await CashBill.aggregate([
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
      total: (agg.totals[0] && agg.totals[0].total) || 0
    };

    const dailyDetails = {
      totalAmount: (agg.daily[0] && agg.daily[0].daily) || 0,
      count: (agg.daily[0] && agg.daily[0].count) || 0,
      items: agg.todayList || []
    };

    res.json({ revenue, dailyDetails });
  } catch (err) { res.status(500).json({ error: err.message }); }
});


// Get a single cash bill by id
router.get('/:id', async (req, res) => {
  try {
    const bill = await CashBill.findById(req.params.id).populate('patientId');
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    res.json(bill);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a cash bill and optionally update patient details
router.put('/:id', async (req, res) => {
  try {
    const update = req.body;
    // helper to robustly parse dates
    const parseDateSafe = (val) => {
      if (val === undefined || val === null || val === '') return undefined;
      if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
      if (typeof val === 'string') {
        const dmY = val.trim();
        const ddmmyyyy = dmY.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (ddmmyyyy) {
          const d = ddmmyyyy[1].padStart(2, '0');
          const m = ddmmyyyy[2].padStart(2, '0');
          const y = ddmmyyyy[3];
          const iso = `${y}-${m}-${d}`;
          const dateObj = new Date(iso);
          return isNaN(dateObj.getTime()) ? null : dateObj;
        }
      }
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    };

    // Normalize incoming date fields: remove invalid dates, convert valid strings to Date
    if (update.admissionDate !== undefined) {
      const parsed = parseDateSafe(update.admissionDate);
      if (parsed === null) {
        // invalid date - remove to avoid Mongoose casting errors
        delete update.admissionDate;
      } else if (parsed !== undefined) {
        update.admissionDate = parsed;
      }
    }

    if (update.dischargeDate !== undefined) {
      const parsed = parseDateSafe(update.dischargeDate);
      if (parsed === null) {
        delete update.dischargeDate;
      } else if (parsed !== undefined) {
        update.dischargeDate = parsed;
      }
    }
    // Ensure numeric fields
    if (update.total !== undefined) update.total = Number(update.total) || 0;
    if (update.netPayable !== undefined) update.netPayable = Number(update.netPayable) || 0;
    if (update.advancePayment !== undefined) update.advancePayment = Number(update.advancePayment) || 0;

    const bill = await CashBill.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!bill) return res.status(404).json({ error: 'Bill not found' });

    // If contact/name/amount info present, sync patient
    try {
      if (update.contact) {
        let patient = await Patient.findOne({ contact: update.contact });
        if (!patient) {
          patient = new Patient({ name: update.name || '', contact: update.contact, ipdNumber: update.ipdNumber || '', date: update.admissionDate ? update.admissionDate : new Date(), amount: update.total || 0 });
          await patient.save();
        } else {
          patient.name = update.name || patient.name;
          patient.ipdNumber = update.ipdNumber || patient.ipdNumber;
          patient.date = update.admissionDate ? update.admissionDate : patient.date;
          patient.amount = update.total || patient.amount;
          await patient.save();
        }
      }
    } catch (e) {
      console.warn('Failed to sync patient on bill update', e.message);
    }

    res.json(bill);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a cash bill
router.delete('/:id', async (req, res) => {
  try {
    const bill = await CashBill.findByIdAndDelete(req.params.id);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    res.json({ message: 'Bill deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
