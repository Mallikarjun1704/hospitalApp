import React, { useState, useEffect, useRef } from "react";
import { getAuthHeaders, getApiBaseUrl } from "../utils/api";
import Header from "../common/header";
import { generatePatientPDF } from "../utils/pdfGenerator";
import "tailwindcss/tailwind.css";
import { useNavigate, useLocation } from "react-router-dom";

const DEFAULT_DOCTORS = [
  "Dr. Channakeshava K B",
  "Dr. Mahesh Kumar",
  "Dr. Priya Singh",
  "Dr. Rajesh Verma",
  "Dr. Anita Desai"
];

const getCurrentTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

export default function AddPatient() {
  const [doctorList, setDoctorList] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("hospital_custom_doctors") || "[]");
      return Array.from(new Set([...DEFAULT_DOCTORS, ...stored]));
    } catch (e) {
      return DEFAULT_DOCTORS;
    }
  });

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    age: "",
    gender: "",
    ipdNumber: "",
    contact: "",
    consultDoctor: DEFAULT_DOCTORS[0],
    date: new Date().toISOString().slice(0, 10),
    time: getCurrentTime(),
    modeOfPayment: "CASH",
    chiefComplaints: "",
    historyPresenting: "",
    previousHistory: "",
    personalHistory: "",
    allergicHistory: "",
    gcs: "",
    temp: "",
    pulse: "",
    bp: "",
    spo2: "",
    rbs: "",
    generalPhysicalExam: "",
    cvs: "",
    rs: "",
    pa: "",
    cns: "",
    provisionalDiagnosis: "",
    pallor: "",
    icterus: "",
    clubbing: "",
    cyanosis: "",
    edema: "",
    formType: 'IPD',
    amount: 0
  });

  const [editingId, setEditingId] = useState(null);
  const API_URL = getApiBaseUrl();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = localStorage.getItem('userType') === 'admin';

  // Helper to extract numeric sequence from string like "IPD-001" or "1001"
  const parseSeqNumber = (str) => {
    if (!str) return 0;
    const match = str.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const formatSeqNumber = (type, seq) => {
    return `${type}-${String(seq).padStart(3, '0')}`;
  };

  const getNextNumber = (type, existingList = []) => {
    let maxSeq = 0;
    if (Array.isArray(existingList)) {
      existingList.forEach(p => {
        const pType = p.formType || (p.ipdNumber && p.ipdNumber.startsWith('OPD-') ? 'OPD' : 'IPD');
        if (pType === type && p.ipdNumber) {
          const n = parseSeqNumber(p.ipdNumber);
          if (n > maxSeq) maxSeq = n;
        }
      });
    }

    const key = type === 'IPD' ? "lastIpdNumber" : "lastOpdNumber";
    const lastStored = localStorage.getItem(key);
    if (lastStored) {
      const n = parseSeqNumber(lastStored);
      if (n > maxSeq) maxSeq = n;
    }

    const nextSeq = maxSeq === 0 ? 1 : maxSeq + 1;
    return formatSeqNumber(type, nextSeq);
  };

  // Fetch doctors and sequence from backend on mount
  useEffect(() => {
    const fetchExisting = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/patients`, { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          const patients = data.patients || data || [];

          // Collect unique doctors
          const fetchedDoctors = patients
            .map(p => p.consultDoctor)
            .filter(d => typeof d === 'string' && d.trim().length > 0);

          if (fetchedDoctors.length > 0) {
            setDoctorList(prev => Array.from(new Set([...prev, ...fetchedDoctors])));
          }

          // If adding new, calculate next number
          if (!editingId && !location.state?.patient) {
            const isOpdRoute = window.location.pathname.includes('add-opd') || window.location.hash.includes('add-opd');
            const targetType = location?.state?.formType || (isOpdRoute ? 'OPD' : 'IPD');
            const newNum = getNextNumber(targetType, patients);
            setFormData(prev => ({
              ...prev,
              formType: targetType,
              ipdNumber: newNum
            }));
            localStorage.setItem(targetType === 'IPD' ? "lastIpdNumber" : "lastOpdNumber", newNum);
          }
        }
      } catch (e) {
        console.warn("Failed to fetch existing patients for sequence/doctors", e);
      }
    };
    fetchExisting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_URL]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "formType") {
      setFormData(prev => {
        let newNumber = prev.ipdNumber;
        if (value === "IPD" && newNumber.startsWith("OPD-")) {
          newNumber = newNumber.replace("OPD-", "IPD-");
        } else if (value === "OPD" && newNumber.startsWith("IPD-")) {
          newNumber = newNumber.replace("IPD-", "OPD-");
        }
        return { ...prev, formType: value, ipdNumber: newNumber };
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleGoBack = () => {
    navigate("/dashboard");
  };

  const resetForm = () => {
    const newNumber = getNextNumber('IPD');
    localStorage.setItem("lastIpdNumber", newNumber);
    setFormData({
      name: '',
      address: '',
      age: '',
      gender: '',
      ipdNumber: newNumber,
      contact: '',
      chiefComplaints: '',
      historyPresenting: '',
      previousHistory: '',
      personalHistory: '',
      allergicHistory: '',
      gcs: '',
      temp: '',
      pulse: '',
      bp: '',
      spo2: '',
      rbs: '',
      generalPhysicalExam: '',
      cvs: '',
      rs: '',
      pa: '',
      cns: '',
      provisionalDiagnosis: '',
      pallor: '',
      icterus: '',
      clubbing: '',
      cyanosis: '',
      edema: '',
      formType: 'IPD',
      amount: 0,
      modeOfPayment: 'CASH',
      date: new Date().toISOString().slice(0, 10),
      time: getCurrentTime(),
      consultDoctor: doctorList[0] || DEFAULT_DOCTORS[0]
    });
    setEditingId(null);
  };

  const savePatient = async () => {
    const trimmedDoctor = formData.consultDoctor ? formData.consultDoctor.trim() : "";
    
    // Dynamically append new custom doctor name if not in list
    if (trimmedDoctor && !doctorList.includes(trimmedDoctor)) {
      const updatedList = Array.from(new Set([...doctorList, trimmedDoctor]));
      setDoctorList(updatedList);
      try {
        const customOnly = updatedList.filter(d => !DEFAULT_DOCTORS.includes(d));
        localStorage.setItem("hospital_custom_doctors", JSON.stringify(customOnly));
      } catch (e) {
        console.warn("Failed to persist custom doctors", e);
      }
    }

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${API_URL}/api/v1/patients/${editingId}` : `${API_URL}/api/v1/patients`;
    try {
      const payload = {
        ...formData,
        consultDoctor: trimmedDoctor
      };
      const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(payload) });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || 'Failed to save');
      }
      await res.json();
      
      // Update stored last sequence
      if (formData.ipdNumber) {
        const key = formData.formType === 'OPD' ? "lastOpdNumber" : "lastIpdNumber";
        localStorage.setItem(key, formData.ipdNumber);
      }

      resetForm();
      alert(editingId ? 'Patient updated successfully' : 'Patient saved successfully');
      navigate(formData.formType === 'OPD' ? '/details/opd-patients' : '/details/patient-details');
    } catch (err) {
      alert(err.message || 'Save failed');
    }
  };

  const initializedPathRef = useRef("");

  useEffect(() => {
    const currentPath = location.pathname + location.search + (location.state?.patient?._id || "");
    if (initializedPathRef.current === currentPath) {
      return;
    }
    initializedPathRef.current = currentPath;

    const handleEditInEffect = (patient) => {
      setEditingId(patient._id);
      setFormData(prev => ({
        ...prev,
        ...patient,
        date: patient.date ? new Date(patient.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        time: patient.time || getCurrentTime(),
        modeOfPayment: patient.modeOfPayment || "CASH"
      }));

      // Add doctor to list if not already present
      if (patient.consultDoctor && !doctorList.includes(patient.consultDoctor)) {
        setDoctorList(prevDocs => Array.from(new Set([...prevDocs, patient.consultDoctor])));
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const incomingPatient = location?.state?.patient;
    const isOpdRoute = window.location.pathname.includes('add-opd') || window.location.hash.includes('add-opd');
    const incomingFormType = location?.state?.formType || (isOpdRoute ? 'OPD' : 'IPD');

    if (incomingPatient) {
      handleEditInEffect(incomingPatient);
    } else {
      const newNumber = getNextNumber(incomingFormType);
      setFormData(prev => ({
        ...prev,
        formType: incomingFormType,
        ipdNumber: newNumber,
        time: getCurrentTime(),
        date: new Date().toISOString().slice(0, 10)
      }));
      localStorage.setItem(incomingFormType === 'IPD' ? "lastIpdNumber" : "lastOpdNumber", newNumber);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const handleSubmit = (e) => {
    e.preventDefault();
    savePatient();
  };

  const generatePDF = async () => {
    try {
      await generatePatientPDF({
        formData,
        fileName: `patient-${formData.name || 'details'}`,
      });
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('PDF generation failed: ' + err.message);
    }
  };

  const HospitalLetterHead = () => (
    <div className="flex justify-between items-center border-b-2 border-green-800 pb-2 mb-4">
      <div className="flex-shrink-0">
        <img src="images/medicallogo.jpg" alt="Doctor Logo" className="w-16" />
      </div>
      <div className="flex-grow text-center px-4">
        <h2 className="text-2xl font-bold">PRASHANTH GENERAL HOSPITAL</h2>
        <p className="text-sm">
          <b>SRS complex, Bhagyanagar circle, Kinnal road Koppal</b> Contact: 8861464789
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* APP NAVBAR (Rendered strictly once at the top of the entire screen) */}
      <div className="no-print">
        <Header />
      </div>

      <div id="bill" className="mx-auto bg-white mt-8 mb-8 shadow-lg print:shadow-none border" style={{ maxWidth: '210mm', width: '100%' }}>
        {/* --- PAGE 1 --- */}
        <div id="pdf-page-1" className="p-8 pb-4">
          {/* This letterhead belongs to the printed document */}
          <HospitalLetterHead />

          <h3 className="text-center font-semibold mb-3 text-lg mt-2 uppercase text-green-900 border-b pb-2">
            {formData.formType === 'OPD' ? 'OPD FILE' : 'ADMISSION FILE (IPD) - PAGE 1'}
          </h3>

          <div className="grid grid-cols-3 gap-4">
            {/* Left Column Page 1 */}
            <div className="col-span-2">
              <div className="mb-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Name :</label>
                <input name="name" value={formData.name} onChange={handleChange} className="w-full border border-gray-300 px-2 pt-2 pb-3 rounded" />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Address :</label>
                <textarea name="address" value={formData.address} onChange={handleChange} className="w-full border border-gray-300 px-2 pt-2 pb-3 rounded h-16" />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Chief Complaints :</label>
                <textarea name="chiefComplaints" value={formData.chiefComplaints} onChange={handleChange} className="w-full border border-gray-300 px-2 pt-2 pb-3 rounded h-16" />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">{formData.formType === 'OPD' ? 'Positive Findings' : 'History of Presenting Illness'} :</label>
                <textarea name="historyPresenting" value={formData.historyPresenting} onChange={handleChange} className="w-full border border-gray-300 px-2 pt-2 pb-3 rounded h-20" />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">{formData.formType === 'OPD' ? 'Provisional Diagnosis :' : 'Previous History :'}</label>
                <textarea name="previousHistory" value={formData.previousHistory} onChange={handleChange} className="w-full border border-gray-300 px-2 pt-2 pb-3 rounded h-16" />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">{formData.formType === 'OPD' ? 'Investigation :' : 'Personal History :'}</label>
                <textarea name="personalHistory" value={formData.personalHistory} onChange={handleChange} className="w-full border border-gray-300 px-2 pt-2 pb-3 rounded h-16" />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">{formData.formType === 'OPD' ? 'Advice :' : 'Allergic History :'}</label>
                <textarea name="allergicHistory" value={formData.allergicHistory} onChange={handleChange} className="w-full border border-gray-300 px-2 pt-2 pb-3 rounded h-16" />
              </div>
            </div>

            {/* Right Column Page 1 */}
            <div>
              {/* Row 1: Repositioned IPD/OPD Number to the very first line */}
              <div className="mb-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {formData.formType === 'OPD' ? 'OPD Number :' : 'IPD Number :'}
                </label>
                <input
                  name="ipdNumber"
                  value={formData.ipdNumber}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-2 pt-2 pb-3 rounded font-medium"
                  placeholder={formData.formType === 'OPD' ? 'OPD-001' : 'IPD-001'}
                />
              </div>

              {/* Row 2: Swapped Age & Gender */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Age :</label>
                  <input name="age" value={formData.age} onChange={handleChange} className="w-full border border-gray-300 px-2 pt-2 pb-3 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Gender :</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="w-full border border-gray-300 px-2 pt-2 pb-3 rounded">
                    <option value="">Sel</option>
                    <option value="Male">M</option>
                    <option value="Female">F</option>
                    <option value="Other">O</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Contact */}
              <div className="mb-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Contact :</label>
                <input name="contact" value={formData.contact} onChange={handleChange} className="w-full border border-gray-300 px-2 pt-2 pb-3 rounded" type="tel" />
              </div>

              {/* Row 4: Amount and Mode of Payment */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Amount :</label>
                  <input
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-2 pt-2 pb-3 rounded no-spinner"
                    type="number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Mode of Payment :</label>
                  <select
                    name="modeOfPayment"
                    value={formData.modeOfPayment || "CASH"}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-2 pt-2 pb-3 rounded"
                  >
                    <option value="CASH">CASH</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Row 5: Date and Time */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date :</label>
                  <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full border border-gray-300 px-2 pt-2 pb-3 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Time :</label>
                  <input type="time" name="time" value={formData.time || ""} onChange={handleChange} className="w-full border border-gray-300 px-2 pt-2 pb-3 rounded" />
                </div>
              </div>

              {/* Row 6: Consultant Doctor - Editable Combobox */}
              <div className="mb-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Consultant Doctor :</label>
                <input
                  list="doctor-options-list"
                  name="consultDoctor"
                  value={formData.consultDoctor || ""}
                  onChange={handleChange}
                  placeholder="Select or enter doctor name"
                  className="w-full border border-gray-300 px-2 pt-2 pb-3 rounded"
                />
                <datalist id="doctor-options-list">
                  {doctorList.map((doctor) => (
                    <option key={doctor} value={doctor}>
                      {doctor}
                    </option>
                  ))}
                </datalist>
              </div>

              <div className="border-t pt-2 mt-2">
                <h4 className="font-semibold mb-2 text-sm text-center">Vital Signs</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="mb-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">GCS :</label>
                    <input name="gcs" value={formData.gcs} onChange={handleChange} className="w-full border border-gray-300 px-1 pt-1 pb-2 rounded text-sm" />
                  </div>
                  <div className="mb-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Temp :</label>
                    <input name="temp" value={formData.temp} onChange={handleChange} className="w-full border border-gray-300 px-1 pt-1 pb-2 rounded text-sm" />
                  </div>
                  <div className="mb-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Pulse :</label>
                    <input name="pulse" value={formData.pulse} onChange={handleChange} className="w-full border border-gray-300 px-1 pt-1 pb-2 rounded text-sm" />
                  </div>
                  <div className="mb-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">BP :</label>
                    <input name="bp" value={formData.bp} onChange={handleChange} className="w-full border border-gray-300 px-1 pt-1 pb-2 rounded text-sm" />
                  </div>
                  <div className="mb-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Spo2 :</label>
                    <input name="spo2" value={formData.spo2} onChange={handleChange} className="w-full border border-gray-300 px-1 pt-1 pb-2 rounded text-sm" />
                  </div>
                  <div className="mb-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">RBS :</label>
                    <input name="rbs" value={formData.rbs} onChange={handleChange} className="w-full border border-gray-300 px-1 pt-1 pb-2 rounded text-sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- PAGE 2 FOR IPD ONLY --- */}
        {formData.formType === 'IPD' && (
          <div id="pdf-page-2" className="px-8 pb-8 pt-2">

            {/* Hidden on frontend, only displays inside PDF generation */}
            <div id="letter-head-2" style={{ display: 'none' }}>
              <div className="mt-8 pt-8"></div> {/* Blank space for clean cut before letterhead */}
              <HospitalLetterHead />
              <h3 className="text-center font-semibold mb-3 text-lg mt-2 uppercase text-green-900 border-b pb-2">ADMISSION FILE (IPD) - CONTINUED</h3>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Left Column Page 2 */}
              <div className="col-span-2">
                <div>
                  <h4 className="font-semibold mb-3">Physical Examination (Left)</h4>
                  <div className="mb-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-3 pb-1 leading-relaxed">General Physical Examination :</label>
                    <textarea name="generalPhysicalExam" value={formData.generalPhysicalExam} onChange={handleChange} className="w-full border border-gray-300 px-2 pt-2 pb-3 rounded h-16" />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-3 pb-1 leading-relaxed">CVS :</label>
                    <textarea name="cvs" value={formData.cvs} onChange={handleChange} className="w-full border border-gray-300 px-2 pt-2 pb-3 rounded h-14" />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-3 pb-1 leading-relaxed">RS :</label>
                    <textarea name="rs" value={formData.rs} onChange={handleChange} className="w-full border border-gray-300 px-2 pt-2 pb-3 rounded h-14" />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-3 pb-1 leading-relaxed">PA :</label>
                    <textarea name="pa" value={formData.pa} onChange={handleChange} className="w-full border border-gray-300 px-2 pt-2 pb-3 rounded h-14" />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-3 pb-1 leading-relaxed">CNS :</label>
                    <textarea name="cns" value={formData.cns} onChange={handleChange} className="w-full border border-gray-300 px-2 pt-2 pb-3 rounded h-14" />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-3 pb-1 leading-relaxed">Provisional Diagnosis :</label>
                    <textarea name="provisionalDiagnosis" value={formData.provisionalDiagnosis} onChange={handleChange} className="w-full border border-gray-300 px-2 pt-2 pb-3 rounded h-16" />
                  </div>
                </div>
              </div>

              {/* Right Column Page 2 */}
              <div>
                <div className="mt-4">
                  <h4 className="font-semibold mb-3 text-sm text-center">Physical Examination (Right)</h4>
                  <div className="mb-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1 pb-1 leading-relaxed">Pallor :</label>
                    <input name="pallor" value={formData.pallor} onChange={handleChange} className="w-full border border-gray-300 px-1 pt-1 pb-2 rounded text-sm" />
                  </div>
                  <div className="mb-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1 pb-1 leading-relaxed">Icterus :</label>
                    <input name="icterus" value={formData.icterus} onChange={handleChange} className="w-full border border-gray-300 px-1 pt-1 pb-2 rounded text-sm" />
                  </div>
                  <div className="mb-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1 pb-1 leading-relaxed">Clubbing :</label>
                    <input name="clubbing" value={formData.clubbing} onChange={handleChange} className="w-full border border-gray-300 px-1 pt-1 pb-2 rounded text-sm" />
                  </div>
                  <div className="mb-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1 pb-1 leading-relaxed">Cyanosis :</label>
                    <input name="cyanosis" value={formData.cyanosis} onChange={handleChange} className="w-full border border-gray-300 px-1 pt-1 pb-2 rounded text-sm" />
                  </div>
                  <div className="mb-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1 pb-1 leading-relaxed">Edema :</label>
                    <input name="edema" value={formData.edema} onChange={handleChange} className="w-full border border-gray-300 px-1 pt-1 pb-2 rounded text-sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Action Buttons */}
        <div className="flex justify-center gap-4 mt-8 pb-8 no-print" data-html2canvas-ignore="true">
          <button type="submit" onClick={handleSubmit} className="px-8 py-3 bg-emerald-600 font-bold shadow-md text-white rounded btn-tactile hover:bg-emerald-700">
            {editingId ? (isAdmin ? 'Update Record' : 'Save Record') : 'Save Record'}
          </button>
          <button type="button" onClick={generatePDF} className="px-8 py-3 bg-indigo-600 font-bold shadow-md text-white rounded btn-tactile hover:bg-indigo-700">Download PDF</button>
          <button type="button" onClick={handleGoBack} className="px-8 py-3 bg-slate-500 font-bold shadow-md text-white rounded btn-tactile hover:bg-slate-600">Back</button>
        </div>

      </div>
    </div>
  );
}