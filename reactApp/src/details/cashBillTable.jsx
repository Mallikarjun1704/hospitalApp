import React, { useEffect, useState } from 'react';
import Header from '../common/header';
import { getAuthHeaders } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8889';

const formatDate = (date) => {
  try {
    return new Date(date).toLocaleDateString('en-GB');
  } catch (e) {
    return '-';
  }
};

const CashBillTable = () => {
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [contactFilter, setContactFilter] = useState('');
  const [expanded, setExpanded] = useState({});
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const isAdmin = localStorage.getItem('userType') === 'admin';

  const totalPages = Math.max(1, Math.ceil(bills.length / pageSize));
  const start = (currentPage - 1) * pageSize;
  const slicedData = bills.slice(start, start + pageSize);

  // Ensure minimum 10 rows
  const currentData = [...slicedData];
  while (currentData.length < 10) {
    currentData.push({ _id: `placeholder-${currentData.length}`, isPlaceholder: true });
  }

  const fetchBills = async (contact) => {
    setLoading(true);
    try {
      const q = contact ? `?contact=${encodeURIComponent(contact)}` : '';
      const res = await fetch(`${API_URL}/api/v1/cashbills${q}`, { headers: getAuthHeaders() });
      if (!res.ok) return;
      const list = await res.json();
      setBills(list || []);
    } catch (err) {
      console.error('Failed to fetch cash bills', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const editBill = (id) => {
    // Navigate to cash bill form and pass the edit id in state
    navigate('/details/cash-bill', { state: { editId: id } });
  };

  const deleteBill = async (id) => {
    if (!window.confirm('Delete this bill?')) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/cashbills/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (!res.ok) return alert('Failed to delete bill');
      await fetchBills();
      alert('Bill deleted');
    } catch (err) {
      alert('Error deleting bill: ' + err.message);
    }
  };

  return (
    <div>
      <Header />
      <div className="p-4">
        <h2 className="font-bold text-lg text-center">Saved Cash Bills</h2>

        <div className="flex justify-between mt-4 mb-2">
          <div>
            <button className="px-4 py-2 bg-slate-500 text-white rounded btn-tactile hover:bg-slate-600 mr-2" onClick={() => navigate(-1)}>Back</button>
            <button className="px-4 py-2 bg-emerald-600 text-white rounded btn-tactile hover:bg-emerald-700 font-medium shadow-md" onClick={() => navigate('/details/medical-bill')}>Generate Medical Bill</button>
          </div>
          <div className="flex items-center space-x-2">
            <input placeholder="Filter by contact" value={contactFilter} onChange={(e) => setContactFilter(e.target.value)} className="p-2 border" />
            <button className="px-3 py-1 bg-indigo-500 text-white rounded btn-tactile hover:bg-indigo-600 shadow-sm" onClick={() => fetchBills(contactFilter)}>Filter</button>
            <button className="px-3 py-1 bg-slate-200 text-slate-700 rounded btn-tactile hover:bg-slate-300" onClick={() => { setContactFilter(''); fetchBills(''); }}>Clear</button>
          </div>
        </div>

        <div className="overflow-auto mt-2">
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
          <table className="w-full text-left border border-gray-300">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 border">#</th>
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Contact</th>
                <th className="p-2 border">IPD</th>
                <th className="p-2 border">Total</th>
                <th className="p-2 border">CGST</th>
                <th className="p-2 border">SGST</th>
                <th className="p-2 border">Advance</th>
                <th className="p-2 border">Net Payable</th>
                <th className="p-2 border">Date</th>
                {isAdmin && <th className="p-2 border">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={isAdmin ? 11 : 10} className="p-4">Loading...</td></tr>
              )}
              {!loading && currentData.length === 0 && (
                <tr><td colSpan={isAdmin ? 11 : 10} className="p-4">No bills found</td></tr>
              )}
              {currentData.map((b, i) => (
                <tr key={b._id} className={`border-t hover:bg-gray-50 transition-colors ${b.isPlaceholder ? 'h-10' : ''}`}>
                  <td className="p-2 border">{!b.isPlaceholder ? start + i + 1 : ''}</td>
                  <td className="p-2 border">{!b.isPlaceholder ? b.name : ''}</td>
                  <td className="p-2 border">{!b.isPlaceholder ? b.contact : ''}</td>
                  <td className="p-2 border">{!b.isPlaceholder ? ((b.patientId && b.patientId.ipdNumber) || b.ipdNumber || '-') : ''}</td>
                  <td className="p-2 border">{!b.isPlaceholder ? (b.total || 0) : ''}</td>
                  <td className="p-2 border">{!b.isPlaceholder ? (b.services || []).reduce((sum, s) => sum + (s.cgst || s.gst || 0), 0) : ''}</td>
                  <td className="p-2 border">{!b.isPlaceholder ? (b.services || []).reduce((sum, s) => sum + (s.sgst || 0), 0) : ''}</td>
                  <td className="p-2 border">{!b.isPlaceholder ? (b.advancePayment || 0) : ''}</td>
                  <td className="p-2 border">{!b.isPlaceholder ? (b.netPayable || 0) : ''}</td>
                  <td className="p-2 border">{!b.isPlaceholder ? (b.admissionDate ? formatDate(new Date(b.admissionDate)) : (b.date ? formatDate(new Date(b.date)) : '-')) : ''}</td>
                  {isAdmin && (
                    <td className="p-2 border space-x-2 whitespace-nowrap">
                      {!b.isPlaceholder && (
                        <>
                          <button className="px-2 py-1 bg-amber-500 text-white rounded btn-tactile hover:bg-amber-600 shadow-sm font-medium" onClick={() => editBill(b._id)}>Edit</button>
                          <button className="px-2 py-1 bg-rose-600 text-white rounded btn-tactile hover:bg-rose-700 shadow-sm font-medium" onClick={() => deleteBill(b._id)}>Delete</button>
                          <button className="px-2 py-1 bg-blue-500 text-white rounded btn-tactile hover:bg-blue-600 shadow-sm" onClick={() => setExpanded({ ...expanded, [b._id]: !expanded[b._id] })}>{expanded[b._id] ? 'Hide' : 'View'}</button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {!loading && bills.length > 0 && (
            <div className="p-4 flex items-center justify-between border-t border-gray-200 no-print">
              <div className="text-sm text-gray-600">
                Showing {start + 1} to {Math.min(start + pageSize, bills.length)} of {bills.length} entries
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded border bg-white disabled:opacity-50 btn-tactile"
                >
                  Prev
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`px-3 py-1 rounded border transition-colors ${p === currentPage ? "bg-blue-600 text-white border-blue-600" : "bg-white hover:bg-gray-50"}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded border bg-white disabled:opacity-50 btn-tactile"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CashBillTable;
