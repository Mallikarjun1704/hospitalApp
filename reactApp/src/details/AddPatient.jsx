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
    date: new Date().toISOString().slice(0,10),
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

  useEffect(() => {
    const lastIpd = localStorage.getItem("lastIpdNumber") || "IPD-1000";
    const nextNumber = parseInt(lastIpd.split("-")[1]) + 1;
    const newIpdNumber = `IPD-${nextNumber}`;
    setFormData(prev => ({ ...prev, ipdNumber: newIpdNumber }));
    localStorage.setItem("lastIpdNumber", newIpdNumber);
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleGoBack = () => {
    const from = location.state && location.state.from;
    if (from) return navigate(from);
    if (window.history.length > 1) return navigate(-1);
    return navigate("/dashboard");
  };

  const resetForm = () => {
    const lastIpd = localStorage.getItem("lastIpdNumber") || "IPD-1000";
    const nextNumber = parseInt(lastIpd.split("-")[1]) + 1;
    const newIpdNumber = `IPD-${nextNumber}`;
    localStorage.setItem("lastIpdNumber", newIpdNumber);
    setFormData({ ...formData, name:'', address:'', age:'', gender:'', ipdNumber: newIpdNumber, contact:'', chiefComplaints:'', historyPresenting:'', previousHistory:'', personalHistory:'', allergicHistory:'', gcs:'', temp:'', pulse:'', bp:'', spo2:'', rbs:'', generalPhysicalExam:'', cvs:'', rs:'', pa:'', cns:'', provisionalDiagnosis:'', pallor:'', icterus:'', clubbing:'', cyanosis:'', edema:'', formType:'IPD', amount:0 });
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
      setFormData(prev => ({ ...prev, ...patient, date: patient.date ? new Date(patient.date).toISOString().slice(0,10) : new Date().toISOString().slice(0,10) }));
      window.scrollTo({top:0, behavior:'smooth'});
    };

    const incomingPatient = location?.state?.patient;
    const incomingFormType = location?.state?.formType;
    if (incomingPatient) handleEditInEffect(incomingPatient);
    if (incomingFormType) setFormData(prev => ({ ...prev, formType: incomingFormType }));
  }, [location]);

  const handleSubmit = (e) => {
    e.preventDefault();
    savePatient();
  };

  const generatePDF = () => {
    try {
      const element = document.getElementById("bill");
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      
      canvas.width = width * 2;
      canvas.height = height * 2;
      ctx.scale(2, 2);
      
      const images = element.getElementsByTagName('img');
      for (let img of images) {
        img.style.display = 'none';
      }
      
      html2canvas(element, {
        canvas: canvas,
        scale: 2,
        logging: false
      }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`patient-${formData.name || 'unknown'}.pdf`);
        
        for (let img of images) {
          img.style.display = '';
        }
      });
    } catch (err) {
      alert('PDF generation failed: ' + err.message);
    }
  };

  return (
    <div id="bill">
      <Header />
      <div className="max-w-6xl mx-auto bg-white mt-8 p-6 rounded shadow">
        <h3 className="text-center font-semibold mb-3 text-lg">{formData.formType === 'OPD' ? 'OPD FILE' : 'ADMISSION FILE (IPD)'}</h3>
        
        <div className="flex justify-center mb-4">
          <label className="mr-2 font-semibold">Form Type:</label>
          <select name="formType" value={formData.formType} onChange={handleChange} className="border p-2 rounded bg-white">
            <option value="IPD">IPD</option>
            <option value="OPD">OPD</option>
          </select>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Left Column */}
          <div className="col-span-2">
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Name :</label>
              <input name="name" value={formData.name} onChange={handleChange} className="w-full border p-3 rounded" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Address :</label>
              <textarea name="address" value={formData.address} onChange={handleChange} className="w-full border p-3 rounded h-20" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Chief Complaints :</label>
              <textarea name="chiefComplaints" value={formData.chiefComplaints} onChange={handleChange} className="w-full border p-3 rounded h-20" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">{formData.formType === 'OPD' ? 'Positive Findings' : 'History of Presenting Illness'} :</label>
              <textarea name="historyPresenting" value={formData.historyPresenting} onChange={handleChange} className="w-full border p-3 rounded h-24" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">{formData.formType === 'OPD' ? 'Provisional Diagnosis' : 'Previous History'} :</label>
              <textarea name="previousHistory" value={formData.previousHistory} onChange={handleChange} className="w-full border p-3 rounded h-20" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">{formData.formType === 'OPD' ? 'Investigation' : 'Personal History'} :</label>
              <textarea name="personalHistory" value={formData.personalHistory} onChange={handleChange} className="w-full border p-3 rounded h-20" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">{formData.formType === 'OPD' ? 'Advice' : 'Allergic History'} :</label>
              <textarea name="allergicHistory" value={formData.allergicHistory} onChange={handleChange} className="w-full border p-3 rounded h-20" />
            </div>

            {/* IPD-only left fields */}
            {formData.formType === 'IPD' && (
              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold mb-3">Physical Examination (Left)</h4>
                <div className="mb-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">General Physical Examination :</label>
                  <textarea name="generalPhysicalExam" value={formData.generalPhysicalExam} onChange={handleChange} className="w-full border p-2 rounded h-16" />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">CVS :</label>
                  <textarea name="cvs" value={formData.cvs} onChange={handleChange} className="w-full border p-2 rounded h-14" />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">RS :</label>
                  <textarea name="rs" value={formData.rs} onChange={handleChange} className="w-full border p-2 rounded h-14" />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">PA :</label>
                  <textarea name="pa" value={formData.pa} onChange={handleChange} className="w-full border p-2 rounded h-14" />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">CNS :</label>
                  <textarea name="cns" value={formData.cns} onChange={handleChange} className="w-full border p-2 rounded h-14" />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Provisional Diagnosis :</label>
                  <textarea name="provisionalDiagnosis" value={formData.provisionalDiagnosis} onChange={handleChange} className="w-full border p-2 rounded h-16" />
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div>
            <div className="mb-3">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Age :</label>
              <input name="age" value={formData.age} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Gender :</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="w-full border p-2 rounded">
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-semibold text-gray-700 mb-1">IPD Number :</label>
              <input name="ipdNumber" value={formData.ipdNumber} onChange={handleChange} className="w-full border p-2 rounded" placeholder="IPD-1001" />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Contact :</label>
              <input name="contact" value={formData.contact} onChange={handleChange} className="w-full border p-2 rounded" type="tel" />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Amount :</label>
              <input name="amount" value={formData.amount} onChange={handleChange} className="w-full border p-2 rounded" type="number" />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Consultant Doctor :</label>
              <select name="consultDoctor" value={formData.consultDoctor} onChange={handleChange} className="w-full border p-2 rounded">
                {doctors.map((doctor) => (
                  <option key={doctor} value={doctor}>{doctor}</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Date :</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>

            <div className="border-t pt-3 mt-4">
              <h4 className="font-semibold mb-3 text-sm">Vital Signs</h4>
              <div className="mb-2">
                <label className="text-xs font-semibold text-gray-700">GCS :</label>
                <input name="gcs" value={formData.gcs} onChange={handleChange} className="w-full border p-1 rounded text-sm" />
              </div>
              <div className="mb-2">
                <label className="text-xs font-semibold text-gray-700">Temp :</label>
                <input name="temp" value={formData.temp} onChange={handleChange} className="w-full border p-1 rounded text-sm" />
              </div>
              <div className="mb-2">
                <label className="text-xs font-semibold text-gray-700">Pulse :</label>
                <input name="pulse" value={formData.pulse} onChange={handleChange} className="w-full border p-1 rounded text-sm" />
              </div>
              <div className="mb-2">
                <label className="text-xs font-semibold text-gray-700">BP :</label>
                <input name="bp" value={formData.bp} onChange={handleChange} className="w-full border p-1 rounded text-sm" />
              </div>
              <div className="mb-2">
                <label className="text-xs font-semibold text-gray-700">Spo2 :</label>
                <input name="spo2" value={formData.spo2} onChange={handleChange} className="w-full border p-1 rounded text-sm" />
              </div>
              <div className="mb-2">
                <label className="text-xs font-semibold text-gray-700">RBS :</label>
                <input name="rbs" value={formData.rbs} onChange={handleChange} className="w-full border p-1 rounded text-sm" />
              </div>
            </div>

            {/* IPD-only right fields */}
            {formData.formType === 'IPD' && (
              <div className="border-t pt-3 mt-4">
                <h4 className="font-semibold mb-3 text-sm">Physical Examination (Right)</h4>
                <div className="mb-2">
                  <label className="text-xs font-semibold text-gray-700">Pallor :</label>
                  <input name="pallor" value={formData.pallor} onChange={handleChange} className="w-full border p-1 rounded text-sm" />
                </div>
                <div className="mb-2">
                  <label className="text-xs font-semibold text-gray-700">Icterus :</label>
                  <input name="icterus" value={formData.icterus} onChange={handleChange} className="w-full border p-1 rounded text-sm" />
                </div>
                <div className="mb-2">
                  <label className="text-xs font-semibold text-gray-700">Clubbing :</label>
                  <input name="clubbing" value={formData.clubbing} onChange={handleChange} className="w-full border p-1 rounded text-sm" />
                </div>
                <div className="mb-2">
                  <label className="text-xs font-semibold text-gray-700">Cyanosis :</label>
                  <input name="cyanosis" value={formData.cyanosis} onChange={handleChange} className="w-full border p-1 rounded text-sm" />
                </div>
                <div className="mb-2">
                  <label className="text-xs font-semibold text-gray-700">Edema :</label>
                  <input name="edema" value={formData.edema} onChange={handleChange} className="w-full border p-1 rounded text-sm" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center gap-3 mt-6 no-print">
          <button type="submit" onClick={handleSubmit} className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600">{editingId ? 'Update' : 'Save'}</button>
          <button type="button" onClick={generatePDF} className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Download PDF</button>
          <button type="button" onClick={handleGoBack} className="px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500">Back</button>
        </div>
      </div>
    </div>
  );
}