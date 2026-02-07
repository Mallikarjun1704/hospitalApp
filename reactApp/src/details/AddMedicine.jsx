import React, { useState, useEffect } from 'react';
import Header from "../common/header";
import { getAuthHeaders } from "../utils/api";
import { useNavigate, useParams } from 'react-router-dom';

export default function AddMedicine() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    uniqueCode: '',
    name: '',
    stock: '',
    purchasePrice: '',
    salePrice: '',
    purchaseDate: '',
    expiryDate: '',
    manufacturer: '',
    description: ''
  });

  useEffect(() => {
    if (isEditing) {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8889';
      const fetchMed = async () => {
        try {
          const res = await fetch(`${API_URL}/api/v1/medicine/medicines/${id}`, { headers: getAuthHeaders() });
          if (!res.ok) {
            let err;
            try { err = await res.json(); } catch (e) { err = null; }
            alert(err?.error || `Failed to load medicine (status ${res.status})`);
            return;
          }
          const data = await res.json();
          setFormData({
            uniqueCode: data.code,
            name: data.name,
            stock: data.stock,
            purchasePrice: data.purchasePrice,
            salePrice: data.salePrice,
            purchaseDate: data.purchaseDate ? data.purchaseDate.slice(0,10) : '',
            expiryDate: data.expiryDate ? data.expiryDate.slice(0,10) : '',
            manufacturer: data.manufacturer || '',
            description: data.description || ''
          });
        } catch (err) { console.error(err); }
      };
      fetchMed();
    } else {
      // Generate new unique code for new medicines
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8889';
      const fetchMedicinesAndGenCode = async () => {
        try {
          const res = await fetch(`${API_URL}/api/v1/medicine/medicines`, { headers: getAuthHeaders() });
          if (!res.ok) {
            const txt = await res.text().catch(() => '');
            console.error('Failed to fetch medicines for code generation', res.status, txt);
            return;
          }
          const meds = await res.json();
          const codes = meds.map(m => m.code).filter(Boolean).map(c => parseInt(c.split('-')[1] || '0'));
          const lastCode = codes.length ? Math.max(...codes) : 0;
          setFormData(prev => ({ ...prev, uniqueCode: `MED-${String(lastCode + 1).padStart(4, '0')}` }));
        } catch (err) {
          console.error(err);
        }
      };
      fetchMedicinesAndGenCode();
    }
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8889';
    const payload = {
      code: formData.uniqueCode,
      name: formData.name,
      stock: parseInt(formData.stock || '0', 10),
      purchasePrice: parseFloat(formData.purchasePrice || '0'),
      salePrice: parseFloat(formData.salePrice || '0'),
      purchaseDate: formData.purchaseDate || undefined,
      expiryDate: formData.expiryDate || undefined,
      manufacturer: formData.manufacturer,
      description: formData.description
    };
    // client-side validation
    const missing = [];
    if (!payload.code) missing.push('Unique Code');
    if (!payload.name) missing.push('Name');
    if (!payload.purchasePrice) missing.push('Purchase Price');
    if (!payload.salePrice) missing.push('Sale Price');
    if (!payload.purchaseDate) missing.push('Purchase Date');
    if (!payload.expiryDate) missing.push('Expiry Date');
    if (missing.length) return alert('Please provide: ' + missing.join(', '));

    (async () => {
      try {
        let res;
        if (isEditing) {
          res = await fetch(`${API_URL}/api/v1/medicine/medicines/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(payload) });
        } else {
          res = await fetch(`${API_URL}/api/v1/medicine/medicines`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload) });
        }
        if (!res.ok) {
          let err;
          try { err = await res.json(); } catch(e) { err = { error: await res.text() } }
          return alert(err.error || 'Failed to save');
        }
        navigate('/medicine-inventory');
      } catch (err) {
        console.error(err);
        alert('Failed to save');
      }
    })();
  };

  return (
    <div>
      <Header />
      <div className="max-w-2xl mx-auto mt-8 px-4">
        <h2 className="text-2xl font-semibold mb-6">
          {isEditing ? 'Edit Medicine' : 'Add New Medicine'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-gray-700 mb-2">Unique Code</label>
            <input
              type="text"
              name="uniqueCode"
              value={formData.uniqueCode}
              onChange={handleChange}
              className="w-full border p-2 rounded bg-white"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Medicine Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border p-2 rounded"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Stock Quantity</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                required
                min="0"
                className="w-full border p-2 rounded"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Purchase Price (₹)</label>
              <input
                type="number"
                name="purchasePrice"
                value={formData.purchasePrice}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full border p-2 rounded"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Sale Price (₹)</label>
              <input
                type="number"
                name="salePrice"
                value={formData.salePrice}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full border p-2 rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Purchase Date</label>
              <input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleChange}
                required
                className="w-full border p-2 rounded"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Expiry Date</label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                required
                className="w-full border p-2 rounded"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Manufacturer</label>
            <input
              type="text"
              name="manufacturer"
              value={formData.manufacturer}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full border p-2 rounded"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/medicine-inventory')}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {isEditing ? 'Update Medicine' : 'Add Medicine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}