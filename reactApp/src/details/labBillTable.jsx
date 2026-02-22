import React, { useEffect, useState } from 'react';
import Header from '../common/header';
import { getAuthHeaders } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8889';

const LabBillTable = () => {
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
      const res = await fetch(`${API_URL}/api/v1/labbills${q}`, { headers: getAuthHeaders() });
      if (!res.ok) return;
      const list = await res.json();
      setBills(list || []);
    } catch (err) {
      console.error('Failed to fetch lab bills', err);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchBills(); }, []);

  const editBill = (id) => { navigate('/details/lab-diagnostics', { state: { editId: id } }); };

  const del = async (id) => {
    if (!window.confirm('Delete this bill?')) return;
    try { const res = await fetch(`${API_URL}/api/v1/labbills/${id}`, { method: 'DELETE', headers: getAuthHeaders() }); if (!res.ok) return alert('Failed to delete'); await fetchBills(contactFilter); alert('Deleted'); } catch (e) { alert('Error deleting: ' + e.message); }
  };

  return (
    <div>
      <Header />
      <div className="p-4">
        <h2 className="font-bold text-lg text-center">Lab Bills</h2>
        <div className="flex justify-between mt-4 mb-2">
          <div>
            <button className="px-4 py-2 bg-slate-500 text-white rounded btn-tactile hover:bg-slate-600 mr-2" onClick={() => navigate(-1)}>Back</button>
            <button className="px-4 py-2 bg-emerald-600 text-white rounded btn-tactile hover:bg-emerald-700 font-medium shadow-md" onClick={() => navigate('/details/lab-diagnostics')}>Generate Lab Bill</button>
          </div>
          <div className="flex items-center space-x-2">
            <input placeholder="Filter by contact" value={contactFilter} onChange={(e) => setContactFilter(e.target.value)} className="p-2 border" />
            <button className="px-3 py-1 bg-indigo-500 text-white rounded btn-tactile hover:bg-indigo-600 shadow-sm" onClick={() => fetchBills(contactFilter)}>Filter</button>
            <button className="px-3 py-1 bg-slate-200 text-slate-700 rounded btn-tactile hover:bg-slate-300" onClick={() => { setContactFilter(''); fetchBills(''); }}>Clear</button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded btn-tactile hover:bg-blue-700 font-medium shadow-sm" onClick={() => navigate('/details/add-lab-test')}>+ Add Lab Test</button>
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
                <th className="p-2 border">Total</th>
                <th className="p-2 border">CGST</th>
                <th className="p-2 border">SGST</th>
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="p-4">Loading...</td></tr>}
              {!loading && currentData.length === 0 && <tr><td colSpan={8} className="p-4">No bills found</td></tr>}
              {currentData.map((b, i) => (
                <React.Fragment key={b._id}>
                  <tr className={`border-t hover:bg-gray-50 transition-colors ${b.isPlaceholder ? 'h-10' : ''}`}>
                    <td className="p-2 border">{!b.isPlaceholder ? start + i + 1 : ''}</td>
                    <td className="p-2 border">{!b.isPlaceholder ? b.name : ''}</td>
                    <td className="p-2 border">{!b.isPlaceholder ? b.contact : ''}</td>
                    <td className="p-2 border">{!b.isPlaceholder ? b.total : ''}</td>
                    <td className="p-2 border">{!b.isPlaceholder ? (b.services || []).reduce((sum, s) => sum + (s.cgst || s.gst || 0), 0) : ''}</td>
                    <td className="p-2 border">{!b.isPlaceholder ? (b.services || []).reduce((sum, s) => sum + (s.sgst || 0), 0) : ''}</td>
                    <td className="p-2 border">{!b.isPlaceholder ? (b.date ? new Date(b.date).toLocaleDateString() : '-') : ''}</td>
                    <td className="p-2 border space-x-2 whitespace-nowrap">
                      {!b.isPlaceholder && (
                        <>
                          {isAdmin && (
                            <>
                              <button className="px-2 py-1 bg-amber-500 text-white rounded btn-tactile hover:bg-amber-600 shadow-sm font-medium" onClick={() => editBill(b._id)}>Edit</button>
                              <button className="px-2 py-1 bg-rose-600 text-white rounded btn-tactile hover:bg-rose-700 shadow-sm font-medium" onClick={() => del(b._id)}>Delete</button>
                            </>
                          )}
                          <button className="px-2 py-1 bg-blue-500 text-white rounded btn-tactile hover:bg-blue-600 shadow-sm" onClick={() => setExpanded({ ...expanded, [b._id]: !expanded[b._id] })}>{expanded[b._id] ? 'Hide' : 'View'}</button>
                        </>
                      )}
                    </td>
                  </tr>
                  {!b.isPlaceholder && expanded[b._id] && (
                    <tr key={`${b._id}-details`} className="bg-gray-50">
                      <td colSpan={8} className="p-2">
                        <div className="overflow-auto animate-in fade-in slide-in-from-top-2 duration-300">
                          <table className="w-full text-left border border-gray-200 bg-white">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="p-2 border">#</th>
                                <th className="p-2 border">Test Code</th>
                                <th className="p-2 border">Test Name</th>
                                <th className="p-2 border">Price</th>
                                <th className="p-2 border">Qty</th>
                                <th className="p-2 border">CGST</th>
                                <th className="p-2 border">SGST</th>
                                <th className="p-2 border">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(b.services || []).map((s, idx) => (
                                <tr key={`${b._id}-s-${idx}`}>
                                  <td className="p-2 border">{idx + 1}</td>
                                  <td className="p-2 border">{s.testCode || ''}</td>
                                  <td className="p-2 border">{s.testName || ''}</td>
                                  <td className="p-2 border">{s.price}</td>
                                  <td className="p-2 border">{s.quantity}</td>
                                  <td className="p-2 border">{s.cgst || s.gst || 0}</td>
                                  <td className="p-2 border">{s.sgst || 0}</td>
                                  <td className="p-2 border">{s.total}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
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

export default LabBillTable;
