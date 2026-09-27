import React, { useEffect, useState } from 'react';
import Header from '../common/header';
import { getAuthHeaders, getApiBaseUrl } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const formatDate = (date) => {
  try {
    return new Date(date).toLocaleDateString('en-GB');
  } catch (e) {
    return '-';
  }
};

const DischargeSummaryTable = () => {
  const navigate = useNavigate();
  const API_URL = getApiBaseUrl();
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [contactFilter, setContactFilter] = useState('');
  const [expanded, setExpanded] = useState({});
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const isAdmin = localStorage.getItem('userType') === 'admin';

  const totalPages = Math.max(1, Math.ceil(summaries.length / pageSize));
  const start = (currentPage - 1) * pageSize;
  const slicedData = summaries.slice(start, start + pageSize);

  // Ensure minimum 10 rows
  const currentData = [...slicedData];
  while (currentData.length < 10) {
    currentData.push({ _id: `placeholder-${currentData.length}`, isPlaceholder: true });
  }

  const fetchSummaries = async (contact) => {
    setLoading(true);
    try {
      const q = contact ? `?contact=${encodeURIComponent(contact)}` : '';
      const res = await fetch(`${API_URL}/api/v1/dischargesummaries${q}`, { headers: getAuthHeaders() });
      if (!res.ok) return;
      const list = await res.json();
      setSummaries(list || []);
    } catch (err) {
      console.error('Failed to fetch discharge summaries', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const editSummary = (summary) => {
    // Navigate to discharge form and pass data via state so it can be pre-filled
    navigate('/details/discharge-form', { state: { editData: summary } });
  };

  const deleteSummary = async (id) => {
    if (!window.confirm('Delete this discharge summary?')) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/dischargesummaries/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (!res.ok) return alert('Failed to delete discharge summary');
      await fetchSummaries();
      alert('Discharge summary deleted');
    } catch (err) {
      alert('Error deleting discharge summary: ' + err.message);
    }
  };

  return (
    <div>
      <Header />
      <div className="p-4">
        <h2 className="font-bold text-lg text-center">Discharge Summaries</h2>

        <div className="flex justify-between mt-4 mb-2">
          <div>
            <button className="px-4 py-2 bg-slate-500 text-white rounded btn-tactile hover:bg-slate-600 mr-2" onClick={() => navigate('/dashboard')}>Back</button>
            <button className="px-4 py-2 bg-emerald-600 text-white rounded btn-tactile hover:bg-emerald-700 font-medium shadow-md" onClick={() => navigate('/details/discharge-form')}>New Discharge Summary</button>
          </div>
          <div className="flex items-center space-x-2">
            <input placeholder="Filter by contact" value={contactFilter} onChange={(e) => setContactFilter(e.target.value)} className="p-2 border" />
            <button className="px-3 py-1 bg-indigo-500 text-white rounded btn-tactile hover:bg-indigo-600 shadow-sm" onClick={() => fetchSummaries(contactFilter)}>Filter</button>
            <button className="px-3 py-1 bg-slate-200 text-slate-700 rounded btn-tactile hover:bg-slate-300" onClick={() => { setContactFilter(''); fetchSummaries(''); }}>Clear</button>
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
                <th className="p-2 border">Patient Name</th>
                <th className="p-2 border">Contact</th>
                <th className="p-2 border">IPD No.</th>
                <th className="p-2 border">Consultant</th>
                <th className="p-2 border">Admission Date</th>
                <th className="p-2 border">Discharge Date</th>
                <th className="p-2 border">Final Diagnosis</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={9} className="p-4">Loading...</td></tr>
              )}
              {!loading && currentData.length === 0 && (
                <tr><td colSpan={9} className="p-4">No discharge summaries found</td></tr>
              )}
              {currentData.map((s, i) => (
                <React.Fragment key={s._id}>
                  <tr className={`border-t hover:bg-gray-50 transition-colors ${s.isPlaceholder ? 'h-10' : ''}`}>
                    <td className="p-2 border">{!s.isPlaceholder ? start + i + 1 : ''}</td>
                    <td className="p-2 border">{!s.isPlaceholder ? s.patientName : ''}</td>
                    <td className="p-2 border">{!s.isPlaceholder ? s.contactNumber : ''}</td>
                    <td className="p-2 border">{!s.isPlaceholder ? (s.ipdNumber || '-') : ''}</td>
                    <td className="p-2 border">{!s.isPlaceholder ? (s.consultantName || '-') : ''}</td>
                    <td className="p-2 border">{!s.isPlaceholder ? (s.admissionDate ? formatDate(new Date(s.admissionDate)) : '-') : ''}</td>
                    <td className="p-2 border">{!s.isPlaceholder ? (s.dischargeDate ? formatDate(new Date(s.dischargeDate)) : '-') : ''}</td>
                    <td className="p-2 border max-w-[200px] truncate">{!s.isPlaceholder ? (s.finalDiagnosis || '-') : ''}</td>
                    <td className="p-2 border space-x-2 whitespace-nowrap">
                      {!s.isPlaceholder && (
                        <>
                          {isAdmin && (
                            <>
                              <button className="px-2 py-1 bg-amber-500 text-white rounded btn-tactile hover:bg-amber-600 shadow-sm font-medium" onClick={() => editSummary(s)}>Edit</button>
                              <button className="px-2 py-1 bg-rose-600 text-white rounded btn-tactile hover:bg-rose-700 shadow-sm font-medium" onClick={() => deleteSummary(s._id)}>Delete</button>
                            </>
                          )}
                          <button className="px-2 py-1 bg-blue-500 text-white rounded btn-tactile hover:bg-blue-600 shadow-sm" onClick={() => setExpanded({ ...expanded, [s._id]: !expanded[s._id] })}>{expanded[s._id] ? 'Hide' : 'View'}</button>
                        </>
                      )}
                    </td>
                  </tr>
                  {!s.isPlaceholder && expanded[s._id] && (
                    <tr>
                      <td colSpan={9} className="p-4 bg-gray-50 border">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p><span className="font-bold">Admission No.:</span> {s.admissionNumber || '-'}</p>
                            <p><span className="font-bold">Admission Time:</span> {s.admissionTime || '-'}</p>
                            <p><span className="font-bold">Discharge Time:</span> {s.dischargeTime || '-'}</p>
                            <p><span className="font-bold">ICD Code:</span> {s.icdCode || '-'}</p>
                            <p><span className="font-bold">MLC Number:</span> {s.mlcNumber || '-'}</p>
                            <p className="mt-2"><span className="font-bold">Provisional Diagnosis:</span> {s.provisionalDiagnosis || '-'}</p>
                            <p className="mt-2"><span className="font-bold">Final Diagnosis:</span> {s.finalDiagnosis || '-'}</p>
                          </div>
                          <div>
                            <p><span className="font-bold">Presenting Complaints:</span> {s.presentingComplaints || '-'}</p>
                            <p className="mt-2"><span className="font-bold">Summary of Illness:</span> {s.illnessSummary || '-'}</p>
                            <p className="mt-2"><span className="font-bold">Key Findings:</span> {s.keyFindings || '-'}</p>
                            <p className="mt-2"><span className="font-bold">Substance History:</span> {s.substanceHistory || '-'}</p>
                          </div>
                          <div>
                            <p><span className="font-bold">Past History:</span> {s.pastHistory || '-'}</p>
                            <p className="mt-2"><span className="font-bold">Family History:</span> {s.familyHistory || '-'}</p>
                          </div>
                          <div>
                            <p><span className="font-bold">Investigations:</span> {s.investigations || '-'}</p>
                            <p className="mt-2"><span className="font-bold">Hospital Course:</span> {s.hospitalCourse || '-'}</p>
                            <p className="mt-2"><span className="font-bold">Discharge Advice:</span> {s.dischargeAdvice || '-'}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {!loading && summaries.length > 0 && (
            <div className="p-4 flex items-center justify-between border-t border-gray-200 no-print">
              <div className="text-sm text-gray-600">
                Showing {start + 1} to {Math.min(start + pageSize, summaries.length)} of {summaries.length} entries
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

export default DischargeSummaryTable;
