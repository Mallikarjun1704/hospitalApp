import React, { useState, useEffect } from 'react';
import Header from "../common/header";
import { getAuthHeaders } from "../utils/api";
import { useNavigate } from 'react-router-dom';

export default function MedicineInventory() {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const isAdmin = localStorage.getItem('userType') === 'admin';

  useEffect(() => {
    // fetch medicines from backend
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8889';
    const fetchMedicines = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/medicine/medicines`, { headers: getAuthHeaders() });
        const data = await res.json();
        setMedicines(data || []);
      } catch (err) {
        console.error('Could not fetch medicines', err);
      }
    };
    fetchMedicines();
  }, []); // fetch once on mount; avoids repeated fetching loop

  const handleAddMedicine = () => {
    navigate('/add-medicine');
  };

  const handleEdit = (medicineId) => {
    navigate(`/edit-medicine/${medicineId}`);
  };

  const handleDelete = (medicineId) => {
    if (!window.confirm('Are you sure you want to delete this medicine?')) return;
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8889';
    fetch(`${API_URL}/api/v1/medicine/medicines/${medicineId}`, { method: 'DELETE', headers: getAuthHeaders() }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json();
        return alert(err.error || 'Failed to delete');
      }
      // refresh list
      const list = medicines.filter(m => m._id !== medicineId);
      setMedicines(list);
    }).catch(err => console.error(err));
  };

  const filteredMedicines = medicines.filter((medicine) =>
    medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (medicine.code || medicine.uniqueCode || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredMedicines.length / pageSize));
  const start = (currentPage - 1) * pageSize;
  const currentData = filteredMedicines.slice(start, start + pageSize);

  return (
    <div>
      <Header />
      <div className="max-w-7xl mx-auto mt-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Medicine Inventory</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-slate-500 text-white rounded btn-tactile hover:bg-slate-600"
            >
              Back to Dashboard
            </button>
            <button
              onClick={handleAddMedicine}
              className="px-4 py-2 bg-emerald-600 text-white rounded btn-tactile hover:bg-emerald-700 font-medium shadow-md"
            >
              + Add Medicine
            </button>
          </div>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search medicines..."
            className="w-full md:w-1/3 px-4 py-2 border rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <div className="flex justify-end p-2 items-center gap-3 no-print">
            <label className="text-sm text-gray-600 font-medium">Rows:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {[10, 15, 20, 50].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <table className="min-w-full bg-white border rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unique Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                {isAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentData.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="px-6 py-4 text-center text-gray-500">No medicines found</td>
                </tr>
              )}
              {currentData.map((medicine) => (
                <tr key={medicine.uniqueCode || medicine._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">{medicine.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{medicine.name}</td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap ${Number(medicine.stock) <= 10 ? 'bg-yellow-100 text-yellow-800' : ''}`}
                    title={Number(medicine.stock) <= 10 ? "Inventory stock is low" : ""}
                  >
                    {medicine.stock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">₹{medicine.purchasePrice}</td>
                  <td className="px-6 py-4 whitespace-nowrap">₹{medicine.salePrice}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{medicine.purchaseDate ? new Date(medicine.purchaseDate).toISOString().slice(0, 10) : ''}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{medicine.expiryDate ? new Date(medicine.expiryDate).toISOString().slice(0, 10) : ''}</td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap space-x-3">
                      <button
                        onClick={() => handleEdit(medicine._id)}
                        className="bg-amber-500 text-white px-3 py-1 rounded btn-tactile hover:bg-amber-600 font-medium shadow-sm transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(medicine._id)}
                        className="bg-rose-600 text-white px-3 py-1 rounded btn-tactile hover:bg-rose-700 font-medium shadow-sm transition-all"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {filteredMedicines.length > 0 && (
            <div className="p-4 flex items-center justify-between border-t border-gray-200 no-print">
              <div className="text-sm text-gray-600 font-medium">
                Showing {start + 1} to {Math.min(start + pageSize, filteredMedicines.length)} of {filteredMedicines.length} entries
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded border bg-white disabled:opacity-50 btn-tactile hover:bg-gray-50 transition-all font-medium text-sm"
                >
                  Prev
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`px-3 py-1 rounded border transition-all text-sm font-semibold ${p === currentPage ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white hover:bg-gray-50 text-gray-700"}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded border bg-white disabled:opacity-50 btn-tactile hover:bg-gray-50 transition-all font-medium text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="mt-6 flex items-center space-x-3">
          <button
            className="px-4 py-2 bg-emerald-600 text-white rounded btn-tactile hover:bg-emerald-700 font-medium shadow-sm"
            onClick={() => {
              try {
                const headers = ['code', 'name', 'stock', 'purchasePrice', 'salePrice', 'purchaseDate', 'expiryDate', 'manufacturer', 'description'];
                const sampleRow = ['MED-0001', 'Paracetamol', '100', '10.00', '12.00', '2025-01-01', '2026-01-01', 'Acme', 'Pain relief'];
                const csv = headers.join(',') + '\n' + sampleRow.join(',') + '\n';
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.setAttribute('download', 'medicine-sample.csv');
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
              } catch (err) {
                console.error('Failed to generate sample CSV', err);
                alert('Failed to generate sample CSV');
              }
            }}
          >
            Download Sample CSV
          </button>
          <label className="px-4 py-2 bg-gray-200 rounded cursor-pointer">
            Upload CSV
            <input type="file" accept="text/csv" className="hidden" onChange={async (e) => {
              const el = e.target;
              const file = el.files && el.files[0];
              if (!file) return;
              const form = new FormData();
              form.append('file', file);
              const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8889';
              try {
                const headers = getAuthHeaders();
                // remove content-type to allow browser to set the correct multipart boundary
                delete headers['Content-Type'];
                const res = await fetch(`${API_URL}/api/v1/medicine/medicines/upload-csv`, { method: 'POST', body: form, headers });
                const data = await res.json();
                if (!res.ok) return alert(data.error || 'Upload failed');
                alert('Upload complete');
                // refresh list
                const listRes = await fetch(`${API_URL}/api/v1/medicine/medicines`, { headers: getAuthHeaders() });
                const list = await listRes.json();
                setMedicines(list);
              } catch (err) {
                console.error(err);
                alert('Upload failed');
              } finally {
                // reset input so the same file can be selected again
                el.value = null;
              }
            }} />
          </label>
        </div>
      </div>
    </div>
  );
}