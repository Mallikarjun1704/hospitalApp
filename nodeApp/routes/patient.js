const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');

// Create patient
router.post('/', async (req, res) => {
  try {
    const { name, address, age, gender, ipdNumber, contact, date, consultDoctor, personalHistory, chiefComplaints, historyPresenting, previousHistory, allergicHistory, gcs, temp, pulse, bp, spo2, rbs, generalPhysicalExam, cvs, rs, pa, cns, provisionalDiagnosis, pallor, icterus, clubbing, cyanosis, edema, formType, amount } = req.body;

    if (!contact) return res.status(400).json({ error: 'Contact (phone) is required' });
    if (!name) return res.status(400).json({ error: 'Name is required' });

    // Do not enforce unique contact — same patient may visit multiple times

    const parsedAmount = (amount !== undefined && amount !== null) ? Number(amount) : 0;
    if (parsedAmount !== undefined && isNaN(parsedAmount)) {
      return res.status(400).json({ error: 'amount must be a number' });
    }

    const patient = new Patient({
      name,
      address,
      age,
      gender,
      ipdNumber,
      contact,
      date,
      consultDoctor,
      personalHistory,
      chiefComplaints,
      historyPresenting,
      previousHistory,
      allergicHistory,
      gcs,
      temp,
      pulse,
      bp,
      spo2,
      rbs,
      generalPhysicalExam,
      cvs,
      rs,
      pa,
      cns,
      provisionalDiagnosis,
      pallor,
      icterus,
      clubbing,
      cyanosis,
      edema,
      formType: formType || 'IPD',
      amount: parsedAmount
    });

    await patient.save();
    res.status(201).json(patient);
  } catch (err) {
    console.error(err);
    // Handle duplicate key error for ipdNumber uniqueness
    if (err.code === 11000 && err.keyPattern && err.keyPattern.ipdNumber) {
      return res.status(409).json({ error: 'ipdNumber already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Get all patients (+ revenue totals)
router.get('/', async (req, res) => {
  try {
    // For listing patients
    const patients = await Patient.find().sort({ createdAt: -1 });

    // Compute revenue totals by amount using local day boundaries
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0);
    const startOfYear = new Date(today.getFullYear(), 0, 1, 0, 0, 0);

    const revenueFacets = await Patient.aggregate([
      {
        $facet: {
          daily: [
            { $match: { date: { $gte: startOfDay } } },
            { $group: { _id: null, total: { $sum: { $toDouble: { $ifNull: ["$amount", 0] } } } } }
          ],
          monthly: [
            { $match: { date: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
          ],
          yearly: [
            { $match: { date: { $gte: startOfYear } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
          ]
        }
      }
    ]);

    const daily = (revenueFacets[0].daily[0] && revenueFacets[0].daily[0].total) || 0;
    const monthly = (revenueFacets[0].monthly[0] && revenueFacets[0].monthly[0].total) || 0;
    const yearly = (revenueFacets[0].yearly[0] && revenueFacets[0].yearly[0].total) || 0;

    res.json({ patients, revenue: { daily, monthly, yearly } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stats for revenue and patient counts (daily/monthly/yearly)
// GET /stats
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0);
    const startOfYear = new Date(today.getFullYear(), 0, 1, 0, 0, 0);

    const facets = await Patient.aggregate([
      {
        $facet: {
          ipdDaily: [
            {
              $match: {
                date: { $gte: startOfDay },
                $or: [{ formType: 'IPD' }, { ipdNumber: { $regex: /^IPD-/i } }]
              }
            },
            { $group: { _id: null, totalAmount: { $sum: { $toDouble: { $ifNull: ["$amount", 0] } } }, count: { $sum: 1 } } }
          ],
          opdDaily: [
            {
              $match: {
                date: { $gte: startOfDay },
                $or: [{ formType: 'OPD' }, { ipdNumber: { $regex: /^OPD-/i } }]
              }
            },
            { $group: { _id: null, totalAmount: { $sum: { $toDouble: { $ifNull: ["$amount", 0] } } }, count: { $sum: 1 } } }
          ],
          ipdMonthly: [
            {
              $match: {
                date: { $gte: startOfMonth },
                $or: [{ formType: 'IPD' }, { ipdNumber: { $regex: /^IPD-/i } }]
              }
            },
            { $group: { _id: null, totalAmount: { $sum: { $toDouble: { $ifNull: ["$amount", 0] } } }, count: { $sum: 1 } } }
          ],
          opdMonthly: [
            {
              $match: {
                date: { $gte: startOfMonth },
                $or: [{ formType: 'OPD' }, { ipdNumber: { $regex: /^OPD-/i } }]
              }
            },
            { $group: { _id: null, totalAmount: { $sum: { $toDouble: { $ifNull: ["$amount", 0] } } }, count: { $sum: 1 } } }
          ],
          ipdYearly: [
            {
              $match: {
                date: { $gte: startOfYear },
                $or: [{ formType: 'IPD' }, { ipdNumber: { $regex: /^IPD-/i } }]
              }
            },
            { $group: { _id: null, totalAmount: { $sum: { $toDouble: { $ifNull: ["$amount", 0] } } }, count: { $sum: 1 } } }
          ],
          opdYearly: [
            {
              $match: {
                date: { $gte: startOfYear },
                $or: [{ formType: 'OPD' }, { ipdNumber: { $regex: /^OPD-/i } }]
              }
            },
            { $group: { _id: null, totalAmount: { $sum: { $toDouble: { $ifNull: ["$amount", 0] } } }, count: { $sum: 1 } } }
          ],
          yearlyTotalPatients: [
            { $match: { date: { $gte: startOfYear } } },
            { $group: { _id: null, totalPatients: { $sum: 1 } } }
          ],
          ipdYearlyTotal: [
            {
              $match: {
                date: { $gte: startOfYear },
                $or: [{ formType: 'IPD' }, { ipdNumber: { $regex: /^IPD-/i } }]
              }
            },
            { $group: { _id: null, count: { $sum: 1 } } }
          ],
          opdYearlyTotal: [
            {
              $match: {
                date: { $gte: startOfYear },
                $or: [{ formType: 'OPD' }, { ipdNumber: { $regex: /^OPD-/i } }]
              }
            },
            { $group: { _id: null, count: { $sum: 1 } } }
          ]
        }
      }
    ]);

    const getStat = (arr) => ({
      amount: (arr[0] && arr[0].totalAmount) || 0,
      count: (arr[0] && arr[0].count) || 0
    });

    const ipdDaily = getStat(facets[0].ipdDaily);
    const opdDaily = getStat(facets[0].opdDaily);
    const ipdMonthly = getStat(facets[0].ipdMonthly);
    const opdMonthly = getStat(facets[0].opdMonthly);
    const ipdYearly = getStat(facets[0].ipdYearly);
    const opdYearly = getStat(facets[0].opdYearly);

    const yearlyTotalPatients = (facets[0].yearlyTotalPatients[0] && facets[0].yearlyTotalPatients[0].totalPatients) || 0;
    const ipdYearlyTotal = (facets[0].ipdYearlyTotal[0] && facets[0].ipdYearlyTotal[0].count) || 0;
    const opdYearlyTotal = (facets[0].opdYearlyTotal[0] && facets[0].opdYearlyTotal[0].count) || 0;

    let todaysPatients = await Patient.find({ date: { $gte: startOfDay } })
      .select('name ipdNumber amount date contact consultDoctor formType')
      .sort({ date: 1, createdAt: 1 })
      .lean();

    if (Array.isArray(todaysPatients)) {
      todaysPatients = todaysPatients.map(p => {
        let ft = p.formType;
        if (!ft && p.ipdNumber) {
          if (/^OPD-/i.test(p.ipdNumber)) ft = 'OPD';
          else if (/^IPD-/i.test(p.ipdNumber)) ft = 'IPD';
        }
        return {
          ...p,
          formType: ft || 'IPD',
          date: p.date ? new Date(p.date).toISOString() : null,
          amount: typeof p.amount === 'number' ? p.amount : Number(p.amount) || 0
        };
      });
    }

    res.json({
      revenue: {
        ipd: { daily: ipdDaily.amount, monthly: ipdMonthly.amount, yearly: ipdYearly.amount },
        opd: { daily: opdDaily.amount, monthly: opdMonthly.amount, yearly: opdYearly.amount }
      },
      counts: {
        ipd: { daily: ipdDaily.count, monthly: ipdMonthly.count, yearly: ipdYearly.count },
        opd: { daily: opdDaily.count, monthly: opdMonthly.count, yearly: opdYearly.count }
      },
      dailyDetails: {
        totalAmount: ipdDaily.amount + opdDaily.amount,
        count: ipdDaily.count + opdDaily.count,
        patients: todaysPatients
      },
      yearlyTotalPatients,
      ipdYearlyTotal,
      opdYearlyTotal
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Filter by contact (mobile number) — return the very first/earliest patient for that contact
// Example: GET /filter/by-contact?contact=1234567890
// Generic filter endpoint – search by ipd, contact, or a general query `q`. Returns the earliest match.
// Examples:
// GET /filter?ipd=IPD-1001
// GET /filter?contact=1234567890
// GET /filter?q=1234567890  (searches ipd and contact)
router.get('/filter', async (req, res) => {
  try {
    const { contact, ipd, q } = req.query;
    if (!contact && !ipd && !q) return res.status(400).json({ error: 'ipd, contact or q query parameter is required' });

    let query = null;
    if (ipd) {
      query = { ipdNumber: ipd };
    } else if (contact) {
      query = { contact: { $regex: contact, $options: 'i' } };
    } else if (q) {
      // If q looks like an IPD (e.g., 'IPD-'), check ipdNumber exactly else search contact
      if (/^IPD[-_]?\d+$/i.test(q)) {
        query = { ipdNumber: q };
      } else {
        query = { $or: [{ contact: { $regex: q, $options: 'i' } }, { ipdNumber: q }] };
      }
    }

    // Return the earliest matching record
    const patient = await Patient.findOne(query).sort({ date: 1, createdAt: 1 });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get patient by id
router.get('/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update patient
router.put('/:id', async (req, res) => {
  try {
    const update = req.body;

    // Allow contacting the same number — do not enforce uniqueness

    // Parse amount to number if provided
    if (update.amount !== undefined) {
      const parsed = Number(update.amount);
      if (isNaN(parsed)) return res.status(400).json({ error: 'amount must be a number' });
      update.amount = parsed;
    }

    // Prevent IPD number duplication on update — if ipdNumber changed, check for existing other patient
    if (update.ipdNumber) {
      const existing = await Patient.findOne({ ipdNumber: update.ipdNumber });
      if (existing && existing._id.toString() !== req.params.id) {
        return res.status(409).json({ error: 'ipdNumber already exists' });
      }
    }

    const patient = await Patient.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete patient
router.delete('/:id', async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json({ message: 'Patient deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
