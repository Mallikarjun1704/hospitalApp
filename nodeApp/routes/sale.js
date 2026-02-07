const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Medicine = require('../models/Medicine');


// Create Sale (Billing)
router.post("/sales", async (req, res) => {
    try {
        // Expect items: [{ medicineId, quantity, unitPrice? }]
        const { items } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'items are required' });

        const saleItems = [];
        let totalAmount = 0;

        for (const it of items) {
            const { medicineId, quantity, unitPrice } = it;
            const medicine = await Medicine.findById(medicineId);
            if (!medicine) return res.status(400).json({ message: `Medicine not found: ${medicineId}` });
            if (medicine.stock < quantity) return res.status(400).json({ message: `Insufficient stock for ${medicine.name}` });

            const price = unitPrice || medicine.salePrice || medicine.purchasePrice || 0;
            const amount = price * quantity;

            // decrement stock
            medicine.stock -= quantity;
            // update salePrice if unitPrice provided
            if (typeof unitPrice === 'number') {
                medicine.salePrice = unitPrice;
            }
            await medicine.save();

            saleItems.push({ medicineId: medicine._id, uniqueCode: medicine.code, name: medicine.name, unitPrice: price, quantity, amount });
            totalAmount += amount;
        }

        const sale = new Sale({ items: saleItems, totalAmount });
        await sale.save();

        res.status(201).json(sale);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Total Revenue
router.get("/sales/revenue", async (req, res) => {
    try {
        // We'll calculate daily/monthly/yearly revenue and return a dailyDetails list of today's sales
        const today = new Date();
        const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0));
        const startOfMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1, 0, 0, 0));
        const startOfYear = new Date(Date.UTC(today.getUTCFullYear(), 0, 1, 0, 0, 0));

        const [agg] = await Sale.aggregate([
            {
                $facet: {
                    totals: [
                        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
                    ],
                    daily: [
                        { $match: { date: { $gte: startOfDay } } },
                        { $group: { _id: null, daily: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
                    ],
                    monthly: [
                        { $match: { date: { $gte: startOfMonth } } },
                        { $group: { _id: null, monthly: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
                    ],
                    yearly: [
                        { $match: { date: { $gte: startOfYear } } },
                        { $group: { _id: null, yearly: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
                    ],
                    todayList: [
                        { $match: { date: { $gte: startOfDay } } },
                        { $unwind: '$items' },
                        { $project: { _id: 0, date: 1, item: '$items' } },
                        { $sort: { date: -1 } }
                    ]
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
            items: (agg.todayList || []).map(r => ({ ...r.item, date: r.date }))
        };

        res.json({ revenue, dailyDetails });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;