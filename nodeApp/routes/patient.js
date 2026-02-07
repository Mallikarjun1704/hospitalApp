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

    // Compute revenue totals by amount using UTC day boundaries to ensure consistent 'today' definition
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const endOfDay = new Date(startOfDay);
    endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(startOfYear);
    endOfYear.setFullYear(endOfYear.getFullYear() + 1);

    const revenueFacets = await Patient.aggregate([
      {
        $facet: {
          daily: [
            { $match: { date: { $gte: startOfDay, $lt: endOfDay } } },
            { $group: { _id: null, total: { $sum: { $toDouble: { $ifNull: ["$amount", 0] } } } } }
          ],
          monthly: [
            { $match: { date: { $gte: startOfMonth, $lt: endOfMonth } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
          ],
          yearly: [
            { $match: { date: { $gte: startOfYear, $lt: endOfYear } } },
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
    // Use timezone-aware date truncation when available to ensure correct 'today' semantics
    // Default to UTC so daily refers to UTC-day boundaries and dates are reported as ISO Z timestamps.
    const timezone = req.query.tz || process.env.STATS_TZ || 'UTC';

    let daily = 0, monthly = 0, yearly = 0;
    let dailyCount = 0, monthlyCount = 0, yearlyCount = 0, yearlyTotalPatients = 0;
    let todaysPatients = [];

    // Try using $dateTrunc aggregation (better timezone handling)
    try {
      const facets = await Patient.aggregate([
        {
          $facet: {
            daily: [
              { $match: { $expr: { $eq: [ { $dateTrunc: { date: "$date", unit: "day", timezone } }, { $dateTrunc: { date: "$$NOW", unit: "day", timezone } } ] } } },
              { $group: { _id: null, totalAmount: { $sum: { $toDouble: { $ifNull: ["$amount", 0] } } }, count: { $sum: 1 } } }
            ],
            monthly: [
              { $match: { $expr: { $eq: [ { $dateTrunc: { date: "$date", unit: "month", timezone } }, { $dateTrunc: { date: "$$NOW", unit: "month", timezone } } ] } } },
              { $group: { _id: null, totalAmount: { $sum: { $toDouble: { $ifNull: ["$amount", 0] } } }, count: { $sum: 1 } } }
            ],
            yearly: [
              { $match: { $expr: { $eq: [ { $dateTrunc: { date: "$date", unit: "year", timezone } }, { $dateTrunc: { date: "$$NOW", unit: "year", timezone } } ] } } },
              { $group: { _id: null, totalAmount: { $sum: { $toDouble: { $ifNull: ["$amount", 0] } } }, count: { $sum: 1 } } }
            ],
            yearlyTotalPatients: [
              { $match: { $expr: { $eq: [ { $dateTrunc: { date: "$date", unit: "year", timezone } }, { $dateTrunc: { date: "$$NOW", unit: "year", timezone } } ] } } },
              { $group: { _id: null, totalPatients: { $sum: 1 } } }
            ]
          }
        }
      ]);

      daily = (facets[0].daily[0] && facets[0].daily[0].totalAmount) || 0;
      monthly = (facets[0].monthly[0] && facets[0].monthly[0].totalAmount) || 0;
      yearly = (facets[0].yearly[0] && facets[0].yearly[0].totalAmount) || 0;

      dailyCount = (facets[0].daily[0] && facets[0].daily[0].count) || 0;
      monthlyCount = (facets[0].monthly[0] && facets[0].monthly[0].count) || 0;
      yearlyCount = (facets[0].yearly[0] && facets[0].yearly[0].count) || 0;

      yearlyTotalPatients = (facets[0].yearlyTotalPatients[0] && facets[0].yearlyTotalPatients[0].totalPatients) || 0;

      // Get today's patients using the same truncation logic
      todaysPatients = await Patient.aggregate([
        { $match: { $expr: { $eq: [ { $dateTrunc: { date: "$date", unit: "day", timezone } }, { $dateTrunc: { date: "$$NOW", unit: "day", timezone } } ] } } },
        { $project: { name: 1, ipdNumber: 1, amount: 1, date: 1, contact: 1, consultDoctor: 1 } },
        { $sort: { date: 1, createdAt: 1 } }
      ]);
    } catch (err) {
      // If $dateTrunc is not supported (older MongoDB), fall back to start/end range calculation
      // Use UTC start/end so daily refers consistently to 00:00:00.000Z - 23:59:59.999Z
      console.warn('Stats: $dateTrunc unavailable or failed, falling back to start/end ranges', err.message);
      const now = new Date();
      const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const endOfDay = new Date(startOfDay);
      endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);

      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(startOfYear);
      endOfYear.setFullYear(endOfYear.getFullYear() + 1);

      const facets = await Patient.aggregate([
        {
          $facet: {
            daily: [
              { $match: { date: { $gte: startOfDay, $lt: endOfDay } } },
              { $group: { _id: null, totalAmount: { $sum: { $toDouble: { $ifNull: ["$amount", 0] } } }, count: { $sum: 1 } } }
            ],
            monthly: [
              { $match: { date: { $gte: startOfMonth, $lt: endOfMonth } } },
              { $group: { _id: null, totalAmount: { $sum: "$amount" }, count: { $sum: 1 } } }
            ],
            yearly: [
              { $match: { date: { $gte: startOfYear, $lt: endOfYear } } },
              { $group: { _id: null, totalAmount: { $sum: "$amount" }, count: { $sum: 1 } } }
            ],
            yearlyTotalPatients: [
              { $match: { date: { $gte: startOfYear, $lt: endOfYear } } },
              { $group: { _id: null, totalPatients: { $sum: 1 } } }
            ]
          }
        }
      ]);

      daily = (facets[0].daily[0] && facets[0].daily[0].totalAmount) || 0;
      monthly = (facets[0].monthly[0] && facets[0].monthly[0].totalAmount) || 0;
      yearly = (facets[0].yearly[0] && facets[0].yearly[0].totalAmount) || 0;

      dailyCount = (facets[0].daily[0] && facets[0].daily[0].count) || 0;
      monthlyCount = (facets[0].monthly[0] && facets[0].monthly[0].count) || 0;
      yearlyCount = (facets[0].yearly[0] && facets[0].yearly[0].count) || 0;

      yearlyTotalPatients = (facets[0].yearlyTotalPatients[0] && facets[0].yearlyTotalPatients[0].totalPatients) || 0;

      todaysPatients = await Patient.find({ date: { $gte: startOfDay, $lt: endOfDay } })
        .select('name ipdNumber amount date contact consultDoctor')
        .sort({ date: 1, createdAt: 1 })
        .lean();
    }

    // Convert patient dates to ISO strings (Z) for consistent client consumption
    if (Array.isArray(todaysPatients)) {
      todaysPatients = todaysPatients.map(p => ({
        ...p,
        date: p.date ? new Date(p.date).toISOString() : null,
        amount: typeof p.amount === 'number' ? p.amount : Number(p.amount) || 0
      }));
    }

    // Sanity-check: if daily sum is zero but we have today's patients (from the aggregation), log sample rows
    if (daily === 0 && Array.isArray(todaysPatients) && todaysPatients.length) {
      const sampleToday = todaysPatients.slice(0, 5).map(p => ({ date: p.date, amount: p.amount }));
      //console.warn('Stats: daily sum is 0 but found patient records for today:', sampleToday);
    }

    // dailyDetails already uses the todaysPatients collected above (either via $dateTrunc or fallback)
    const dailyDetails = { totalAmount: daily, count: dailyCount, patients: todaysPatients, dailyStart: (new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()))).toISOString() };

    res.json({
      revenue: { daily, monthly, yearly },
      counts: { daily: dailyCount, monthly: monthlyCount, yearly: yearlyCount },
      dailyDetails,
      yearlyTotalPatients
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
