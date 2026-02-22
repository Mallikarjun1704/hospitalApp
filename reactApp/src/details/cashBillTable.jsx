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
  const isAdmin = localStorage.getItem('userType') === 'admin';

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

        <div className="overflow-auto">
          <table className="w-full text-left border border-gray-300 mt-2">
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
              {!loading && bills.length === 0 && (
                <tr><td colSpan={isAdmin ? 11 : 10} className="p-4">No bills found</td></tr>
              )}
              {bills.map((b, i) => (
                <tr key={b._id} className="border-t">
                  <td className="p-2 border">{i + 1}</td>
                  <td className="p-2 border">{b.name}</td>
                  <td className="p-2 border">{b.contact}</td>
                  <td className="p-2 border">{(b.patientId && b.patientId.ipdNumber) || b.ipdNumber || '-'}</td>
                  <td className="p-2 border">{b.total || 0}</td>
                  <td className="p-2 border">{(b.services || []).reduce((sum, s) => sum + (s.cgst || s.gst || 0), 0)}</td>
                  <td className="p-2 border">{(b.services || []).reduce((sum, s) => sum + (s.sgst || 0), 0)}</td>
                  <td className="p-2 border">{b.advancePayment || 0}</td>
                  <td className="p-2 border">{b.netPayable || 0}</td>
                  <td className="p-2 border">{b.admissionDate ? formatDate(new Date(b.admissionDate)) : (b.date ? formatDate(new Date(b.date)) : '-')}</td>
                  {isAdmin && (
                    <td className="p-2 border space-x-2">
                      {isAdmin && (
                        <>
                          <button className="px-2 py-1 bg-amber-500 text-white rounded btn-tactile hover:bg-amber-600 shadow-sm font-medium" onClick={() => editBill(b._id)}>Edit</button>
                          <button className="px-2 py-1 bg-rose-600 text-white rounded btn-tactile hover:bg-rose-700 shadow-sm font-medium" onClick={() => deleteBill(b._id)}>Delete</button>
                        </>
                      )}
                      <button className="px-2 py-1 bg-blue-500 text-white rounded btn-tactile hover:bg-blue-600 shadow-sm" onClick={() => setExpanded({ ...expanded, [b._id]: !expanded[b._id] })}>{expanded[b._id] ? 'Hide' : 'View'}</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CashBillTable;
