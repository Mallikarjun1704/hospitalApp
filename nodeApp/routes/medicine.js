const express = require('express');
const router = express.Router();
const Medicine = require('../models/Medicine');
const multer = require('multer');
const upload = multer();
const { parse } = require('csv-parse/sync');

// Add Medicine                                                                                    c                                                                                        
router.post("/medicines", async (req, res) => {
    try {
        // require code and name
        const { code, name } = req.body;
        if (!code || !name) return res.status(400).json({ error: 'code and name are required' });
        const medicine = new Medicine(req.body);
        await medicine.save();
        res.status(201).json(medicine);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Sample CSV download
router.get('/medicines/sample-csv', (req, res) => {
    const headers = ['code', 'name', 'stock', 'purchasePrice', 'salePrice', 'purchaseDate', 'expiryDate', 'manufacturer', 'description'];
    const sampleRow = ['MED-0001', 'Paracetamol', '100', '10.00', '12.00', '2025-01-01', '2026-01-01', 'Acme', 'Pain relief'].join(',');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="medicine-sample.csv"');
    res.send(headers.join(',') + '\n' + sampleRow + '\n');
});

// CSV upload - accepts multipart/form-data (file field name: file)
router.post('/medicines/upload-csv', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'file is required' });
        const text = req.file.buffer.toString('utf8');
        const records = parse(text, { columns: true, skip_empty_lines: true });
        const results = [];
        for (const r of records) {
            const code = r.code || r.uniqueCode || r.id;
            if (!code || !r.name) {
                results.push({ row: r, error: 'missing code or name' });
                continue;
            }
            const doc = {
                code: code,
                name: r.name,
                stock: parseInt(r.stock || '0', 10) || 0,
                purchasePrice: parseFloat(r.purchasePrice || r.purchase_price || '0') || 0,
                salePrice: parseFloat(r.salePrice || r.sale_price || '0') || 0,
                purchaseDate: r.purchaseDate ? new Date(r.purchaseDate) : undefined,
                expiryDate: r.expiryDate ? new Date(r.expiryDate) : undefined,
                manufacturer: r.manufacturer || r.Manufacturer || '',
                description: r.description || ''
            };

            const existing = await Medicine.findOne({ code });
            if (existing) {
                await Medicine.findByIdAndUpdate(existing._id, { $set: doc });
                results.push({ code, status: 'updated' });
            } else {
                const created = new Medicine(doc);
                await created.save();
                results.push({ code, status: 'created' });
            }
        }
        res.json({ message: 'Processed CSV', results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Medicines
router.get("/medicines", async (req, res) => {
    try {
        const medicines = await Medicine.find();
        res.json(medicines);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get medicine by id
router.get('/medicines/:id', async (req, res) => {
    try {
        const med = await Medicine.findById(req.params.id);
        if (!med) return res.status(404).json({ error: 'Medicine not found' });
        res.json(med);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Medicine
router.put("/medicines/:id", async (req, res) => {
    try {
        const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(medicine);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Medicine
router.delete("/medicines/:id", async (req, res) => {
    try {
        await Medicine.findByIdAndDelete(req.params.id);
        res.json({ message: "Medicine deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Stock
router.put("/medicines/:id/stock", async (req, res) => {
    try {
        const medicine = await Medicine.findByIdAndUpdate(req.params.id, { stock: req.body.stock }, { new: true });
        res.json(medicine);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Stock for Multiple Medicines
router.put("/medicines/stock/bulk", async (req, res) => {
    try {
        // Expecting req.body to be an array: [{ id: '...', stock: 10 }, ...]
        const updates = req.body.map(item => ({
            updateOne: {
                filter: { _id: item.id },
                update: { $set: { stock: item.stock } }
            }
        }));

        const result = await Medicine.bulkWrite(updates);
        res.json({ message: "Stock updated for multiple medicines", result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;