const mongoose = require('mongoose');
const Patient = require('../models/Patient');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/hospitalApp';

async function run() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to', MONGO_URI);

    const timezone = process.env.STATS_TZ || 'UTC';

    let daily = 0, dailyCount = 0, todaysPatients = [];
    try {
      const facets = await Patient.aggregate([
        {
          $facet: {
            daily: [
              { $match: { $expr: { $eq: [ { $dateTrunc: { date: "$date", unit: "day", timezone } }, { $dateTrunc: { date: "$$NOW", unit: "day", timezone } } ] } } },
              { $group: { _id: null, totalAmount: { $sum: { $toDouble: { $ifNull: ["$amount", 0] } } }, count: { $sum: 1 } } }
            ]
          }
        }
      ]);

      daily = (facets[0].daily[0] && facets[0].daily[0].totalAmount) || 0;
      dailyCount = (facets[0].daily[0] && facets[0].daily[0].count) || 0;

      todaysPatients = await Patient.aggregate([
        { $match: { $expr: { $eq: [ { $dateTrunc: { date: "$date", unit: "day", timezone } }, { $dateTrunc: { date: "$$NOW", unit: "day", timezone } } ] } } },
        { $project: { name: 1, ipdNumber: 1, amount: 1, date: 1, contact: 1, consultDoctor: 1 } },
        { $sort: { date: 1, createdAt: 1 } }
      ]);
    } catch (err) {
      // fallback to start/end ranges
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      const facets = await Patient.aggregate([
        {
          $facet: {
            daily: [
              { $match: { date: { $gte: startOfDay, $lt: endOfDay } } },
              { $group: { _id: null, totalAmount: { $sum: { $toDouble: { $ifNull: ["$amount", 0] } } }, count: { $sum: 1 } } }
            ]
          }
        }
      ]);

      daily = (facets[0].daily[0] && facets[0].daily[0].totalAmount) || 0;
      dailyCount = (facets[0].daily[0] && facets[0].daily[0].count) || 0;

      todaysPatients = await Patient.find({ date: { $gte: startOfDay, $lt: endOfDay } })
        .select('name ipdNumber amount date contact consultDoctor')
        .sort({ date: 1, createdAt: 1 })
        .lean()
        .exec();
    }

    const dailyStart = (new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()))).toISOString();
    console.log('Today details:', { totalAmount: daily, count: dailyCount, dailyStart, patients: todaysPatients.map(p => ({...p, date: p.date ? new Date(p.date).toISOString() : null, amount: typeof p.amount === 'number' ? p.amount : Number(p.amount) || 0 })) });

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
