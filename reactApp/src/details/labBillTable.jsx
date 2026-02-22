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
  const isAdmin = localStorage.getItem('userType') === 'admin';

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
            <button className="px-4 py-2 bg-blue-600 text-white rounded mr-2" onClick={() => navigate(-1)}>Back</button>
            <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={() => navigate('/details/lab-diagnostics')}>Generate Lab Bill</button>
          </div>
          <div className="flex items-center space-x-2">
            <input placeholder="Filter by contact" value={contactFilter} onChange={(e) => setContactFilter(e.target.value)} className="p-2 border" />
            <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => fetchBills(contactFilter)}>Filter</button>
            <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => { setContactFilter(''); fetchBills(''); }}>Clear</button>
            <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => navigate('/details/add-lab-test')}>Add New Lab Test</button>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-left border border-gray-300 mt-2">
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
              {!loading && bills.length === 0 && <tr><td colSpan={8} className="p-4">No bills found</td></tr>}
              {bills.map((b, i) => (
                <>
                  <tr key={b._id} className="border-t">
                    <td className="p-2 border">{i + 1}</td>
                    <td className="p-2 border">{b.name}</td>
                    <td className="p-2 border">{b.contact}</td>
                    <td className="p-2 border">{b.total}</td>
                    <td className="p-2 border">{(b.services || []).reduce((sum, s) => sum + (s.cgst || s.gst || 0), 0)}</td>
                    <td className="p-2 border">{(b.services || []).reduce((sum, s) => sum + (s.sgst || 0), 0)}</td>
                    <td className="p-2 border">{b.date ? new Date(b.date).toLocaleDateString() : '-'}</td>
                    <td className="p-2 border space-x-2">
                      {isAdmin && <button className="px-2 py-1 bg-yellow-500 text-white rounded" onClick={() => editBill(b._id)}>Edit</button>}
                      <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={() => del(b._id)}>Delete</button>
                      <button className="px-2 py-1 bg-gray-300 rounded" onClick={() => setExpanded({ ...expanded, [b._id]: !expanded[b._id] })}>{expanded[b._id] ? 'Hide' : 'View'}</button>
                    </td>
                  </tr>
                  {expanded[b._id] && (
                    <tr key={`${b._id}-details`} className="bg-gray-50">
                      <td colSpan={8} className="p-2">
                        <div className="overflow-auto">
                          <table className="w-full text-left border border-gray-200">
                            <thead>
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
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LabBillTable;
