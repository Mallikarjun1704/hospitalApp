import React, { useState, useEffect } from "react";
import { getAuthHeaders } from "../utils/api";
import Header from "../common/header";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import "tailwindcss/tailwind.css";
import { useNavigate, useLocation } from "react-router-dom";

export default function AddPatient() {
  const doctors = ["Dr. Channakeshava K B", "Dr. Mahesh Kumar", "Dr. Priya Singh", "Dr. Rajesh Verma", "Dr. Anita Desai"];

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    age: "",
    gender: "",
    ipdNumber: "",
    contact: "",
    consultDoctor: doctors[0],
    date: new Date().toISOString().slice(0, 10),
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
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8889";
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = localStorage.getItem('userType') === 'admin';

  const getNextNumber = (type) => {
    const key = type === 'IPD' ? "lastIpdNumber" : "lastOpdNumber";
    const lastNum = localStorage.getItem(key) || `${type}-1000`;
    const nextNumber = parseInt(lastNum.split("-")[1]) + 1;
    return `${type}-${nextNumber}`;
  };

  useEffect(() => {
    const newIpdNumber = getNextNumber('IPD');
    setFormData(prev => ({ ...prev, ipdNumber: newIpdNumber }));
    localStorage.setItem("lastIpdNumber", newIpdNumber);
  }, []);

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
    const from = location.state && location.state.from;
    if (from) return navigate(from);
    if (window.history.length > 1) return navigate(-1);
    return navigate("/dashboard");
  };

  const resetForm = () => {
    const newNumber = getNextNumber('IPD');
    localStorage.setItem("lastIpdNumber", newNumber);
    setFormData({ ...formData, name: '', address: '', age: '', gender: '', ipdNumber: newNumber, contact: '', chiefComplaints: '', historyPresenting: '', previousHistory: '', personalHistory: '', allergicHistory: '', gcs: '', temp: '', pulse: '', bp: '', spo2: '', rbs: '', generalPhysicalExam: '', cvs: '', rs: '', pa: '', cns: '', provisionalDiagnosis: '', pallor: '', icterus: '', clubbing: '', cyanosis: '', edema: '', formType: 'IPD', amount: 0 });
    setEditingId(null);
  };

  const savePatient = async () => {
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${API_URL}/api/v1/patients/${editingId}` : `${API_URL}/api/v1/patients`;
    try {
      const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(formData) });
      if (!res.ok) throw new Error('Failed to save');
      await res.json();
      resetForm();
      alert(editingId ? 'Patient updated' : 'Patient saved');
      navigate('/details/patient-details');
    } catch (err) { alert(err.message || 'Save failed'); }
  };

  useEffect(() => {
    const handleEditInEffect = (patient) => {
      setEditingId(patient._id);
      setFormData(prev => ({ ...prev, ...patient, date: patient.date ? new Date(patient.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10) }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const incomingPatient = location?.state?.patient;
    const incomingFormType = location?.state?.formType || (window.location.pathname.includes('add-opd') ? 'OPD' : 'IPD');

    if (incomingPatient) {
      handleEditInEffect(incomingPatient);
    } else {
      const newNumber = getNextNumber(incomingFormType);
      setFormData(prev => ({
        ...prev,
        formType: incomingFormType,
        ipdNumber: newNumber
      }));
      localStorage.setItem(incomingFormType === 'IPD' ? "lastIpdNumber" : "lastOpdNumber", newNumber);
    }
  }, [location]);

  const handleSubmit = (e) => {
    e.preventDefault();
    savePatient();
  };

  const generatePDF = async () => {
    const allInputs = document.querySelectorAll('#bill textarea, #bill input, #bill select');
    // Store original inline styles to revert later
    allInputs.forEach(el => {
      el.dataset.origHeight = el.style.height || '';
      el.dataset.origOverflow = el.style.overflow || '';
    });

    const pages = [document.getElementById("pdf-page-1")];
    if (formData.formType === 'IPD') {
      const p2 = document.getElementById("pdf-page-2");
      if (p2) {
        document.getElementById("letter-head-2").style.display = "block";
        pages.push(p2);
      }
    }

    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });

      for (let i = 0; i < pages.length; i++) {
        const element = pages[i];
        if (!element) continue;

        const originalWidth = element.style.width;
        // Lock width to standard A4 (prevents responsive grid shrinking issues later)
        element.style.width = '210mm';
        element.style.margin = '0 auto';

        // Crucial: Calculate height AFTER setting width. If width shrinks, text line-wraps down.
        // Expanding scrollHeight here prevents the text from cropping at the bottom.
        const pageElements = element.querySelectorAll('textarea, input, select');
        pageElements.forEach(el => {
          el.style.height = 'auto';
          el.style.height = (el.scrollHeight + 10) + 'px';
          el.style.overflow = 'visible';
        });

        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          windowWidth: element.scrollWidth,
          y: 0,
          x: 0,
          scrollY: 0
        });

        // Revert 
        element.style.width = originalWidth;
        element.style.margin = '';

        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save(`patient-${formData.name || 'unknown'}.pdf`);
    } catch (err) {
      alert('PDF generation failed: ' + err.message);
    } finally {
      // Revert text heights and layout styles
      allInputs.forEach(el => {
        el.style.height = el.dataset.origHeight;
        el.style.overflow = el.dataset.origOverflow;
      });

      if (formData.formType === 'IPD') {
        const lh2 = document.getElementById("letter-head-2");
        if (lh2) lh2.style.display = "none";
      }
    }
  };

  const HospitalLetterHead = () => (
    <div className="flex justify-between items-center border-b-2 border-green-800 pb-2 mb-4">
      <div className="flex-shrink-0">
        <img src="/images/medicallogo.jpg" alt="Doctor Logo" className="w-16" />
      </div>
      <div className="flex-grow text-center px-4">
        <h2 className="text-2xl font-bold">PRASHANTH GENERAL HOSPITAL</h2>
        <p className="text-sm">
          <b>SRS complex, Bhagyanagar circle, Kinnal road Koppal</b> Contact: 7204158789
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

          <h3 className="text-center font-semibold mb-3 text-lg mt-2 uppercase text-green-900 border-b pb-2">{formData.formType === 'OPD' ? 'OPD FILE' : 'ADMISSION FILE (IPD) - PAGE 1'}</h3>



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
              <div className="mb-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">{formData.formType === 'OPD' ? 'OPD Number :' : 'IPD Number :'}</label>
                <input name="ipdNumber" value={formData.ipdNumber} onChange={handleChange} className="w-full border border-gray-300 px-2 pt-2 pb-3 rounded" placeholder={formData.formType === 'OPD' ? 'OPD-1001' : 'IPD-1001'} />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Contact :</label>
                <input name="contact" value={formData.contact} onChange={handleChange} className="w-full border border-gray-300 px-2 pt-2 pb-3 rounded" type="tel" />
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Amount :</label>
                  <input name="amount" value={formData.amount} onChange={handleChange} className="w-full border border-gray-300 px-2 pt-2 pb-3 rounded" type="number" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date :</label>
                  <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full border border-gray-300 px-2 pt-2 pb-3 rounded" />
                </div>
              </div>
              <div className="mb-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Consultant Doctor :</label>
                <select name="consultDoctor" value={formData.consultDoctor} onChange={handleChange} className="w-full border border-gray-300 px-2 pt-2 pb-3 rounded">
                  {doctors.map((doctor) => (
                    <option key={doctor} value={doctor}>{doctor}</option>
                  ))}
                </select>
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