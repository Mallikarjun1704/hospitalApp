
import React, { useState, useEffect, useCallback } from 'react';
import Header from "../common/header";
import PatientTable from "../helper/patientTable";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuthHeaders } from "../utils/api";

const PatientDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8889";
  const [patients, setPatients] = useState([]);
  const [querySearch, setQuerySearch] = useState('');

  const fetchPatients = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/patients`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to load patients');
      const data = await res.json();
      setPatients(data.patients || data || []);
    } catch (err) {
      console.error(err);
    }
  }, [API_URL]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);
  const handleGoBack = (event) => {
    // Prevent navigation
    navigate("/dashboard"); // Go to previous page
  };

  const handleAddPatient = () => {
    // Navigate to the new Add Patient page and pass the current location so the form
    // can return here when the user clicks Back.
    navigate("/details/add-patient", { state: { from: location.pathname } });
  };

  const handleSearch = async () => {
    if (!querySearch) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/patients/filter?q=${encodeURIComponent(querySearch)}`, { headers: getAuthHeaders() });
      if (!res.ok) {
        if (res.status === 404) { setPatients([]); alert('No patient found'); return; }
        throw new Error('Search failed');
      }
      const patient = await res.json();
      setPatients([patient]);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Search failed');
    }
  };

  const handleEdit = (patient) => {
    // navigate to AddPatient page with the patient data so the form can populate
    navigate("/details/add-patient", { state: { patient, from: location.pathname } });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete patient?')) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/patients/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Delete failed');
      await fetchPatients();
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  };

  return (
    <div>
      <Header />
      {/* Container matches typical table width so the button aligns with the table's right edge */}
      {/* Add top margin so there is a gap between Header and the table for the button */}
      <div className="max-w-6xl mx-auto relative mt-12">
        {/* Back button positioned above the table within the gap */}
        <div className="absolute right-4 -top-10 no-print z-10 flex space-x-3 items-center">
          <input
            type="text"
            value={querySearch}
            onChange={(e) => setQuerySearch(e.target.value)}
            placeholder="Search by IPD or contact"
            className="border p-2 rounded mr-2"
          />
          <button onClick={handleSearch} className="px-3 py-1 bg-indigo-500 text-white rounded btn-tactile hover:bg-indigo-600 shadow-sm font-medium">Search</button>
          <button onClick={fetchPatients} className="px-3 py-1 bg-slate-200 text-slate-700 rounded btn-tactile hover:bg-slate-300 font-medium">Refresh</button>
          <button
            onClick={handleAddPatient}
            className="px-6 py-2 bg-emerald-600 text-white rounded btn-tactile hover:bg-emerald-700 font-medium shadow-md"
          >
            + Add Patient
          </button>
          <button
            type="button"
            onClick={handleGoBack}
            className="px-6 py-2 bg-slate-500 text-white rounded btn-tactile hover:bg-slate-600 font-medium shadow-sm"
          >
            Back
          </button>
        </div>

        <PatientTable data={patients} onEdit={handleEdit} onDelete={handleDelete} />
      </div>

    </div>);
}

export default PatientDetail;