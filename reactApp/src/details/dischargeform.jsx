import React, { useState, useEffect } from "react";
import Header from "../common/header";
import { generateDischargePDF } from "../utils/pdfGenerator";
import "tailwindcss/tailwind.css";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuthHeaders, getApiBaseUrl } from "../utils/api";

const PatientForm = () => {
  const apiUrl = getApiBaseUrl();
  const [formData, setFormData] = useState({
    patientName: "",
    contactNumber: "",
    ipdNumber: "",
    admissionNumber: "",
    consultantName: "",
    admissionDate: "",
    admissionTime: "",
    dischargeDate: "",
    dischargeTime: "",
    provisionalDiagnosis: "",
    finalDiagnosis: "",
    icdCode: "",
    presentingComplaints: "",
    illnessSummary: "",
    keyFindings: "",
    substanceHistory: "",
    pastHistory: "",
    familyHistory: "",
    investigations: "",
    hospitalCourse: "",
    dischargeAdvice: "",
    mlcNumber: "",
  });

  const [patientIdCounter, setPatientIdCounter] = useState(1);

  useEffect(() => {
    const storedCounter = localStorage.getItem("patientIdCounter");
    if (storedCounter) {
      setPatientIdCounter(Number(storedCounter));
    }
  }, []);

  // Pre-fill form when editing from table
  const location = useLocation();
  useEffect(() => {
    if (location.state && location.state.editData) {
      const ds = location.state.editData;
      setFormData({
        patientName: ds.patientName || "",
        contactNumber: ds.contactNumber || "",
        ipdNumber: ds.ipdNumber || "",
        admissionNumber: ds.admissionNumber || "",
        consultantName: ds.consultantName || "",
        admissionDate: ds.admissionDate ? ds.admissionDate.split('T')[0] : "",
        admissionTime: ds.admissionTime || "",
        dischargeDate: ds.dischargeDate ? ds.dischargeDate.split('T')[0] : "",
        dischargeTime: ds.dischargeTime || "",
        provisionalDiagnosis: ds.provisionalDiagnosis || "",
        finalDiagnosis: ds.finalDiagnosis || "",
        icdCode: ds.icdCode || "",
        presentingComplaints: ds.presentingComplaints || "",
        illnessSummary: ds.illnessSummary || "",
        keyFindings: ds.keyFindings || "",
        substanceHistory: ds.substanceHistory || "",
        pastHistory: ds.pastHistory || "",
        familyHistory: ds.familyHistory || "",
        investigations: ds.investigations || "",
        hospitalCourse: ds.hospitalCourse || "",
        dischargeAdvice: ds.dischargeAdvice || "",
        mlcNumber: ds.mlcNumber || ""
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-populate patient details or saved discharge summary by contact number
  useEffect(() => {
    const val = formData.contactNumber;
    if (!val || val.length < 10) return;
    const t = setTimeout(async () => {
      try {
        // 1. Try to find a saved discharge summary first
        const dsRes = await fetch(`${apiUrl}/api/v1/dischargesummaries/find?contact=${encodeURIComponent(val)}`, { headers: getAuthHeaders() });
        if (dsRes.ok) {
          const ds = await dsRes.json();
          if (ds) {
            setFormData({
              patientName: ds.patientName || "",
              contactNumber: ds.contactNumber || val,
              ipdNumber: ds.ipdNumber || "",
              admissionNumber: ds.admissionNumber || "",
              consultantName: ds.consultantName || "",
              admissionDate: ds.admissionDate ? ds.admissionDate.split('T')[0] : "",
              admissionTime: ds.admissionTime || "",
              dischargeDate: ds.dischargeDate ? ds.dischargeDate.split('T')[0] : "",
              dischargeTime: ds.dischargeTime || "",
              provisionalDiagnosis: ds.provisionalDiagnosis || "",
              finalDiagnosis: ds.finalDiagnosis || "",
              icdCode: ds.icdCode || "",
              presentingComplaints: ds.presentingComplaints || "",
              illnessSummary: ds.illnessSummary || "",
              keyFindings: ds.keyFindings || "",
              substanceHistory: ds.substanceHistory || "",
              pastHistory: ds.pastHistory || "",
              familyHistory: ds.familyHistory || "",
              investigations: ds.investigations || "",
              hospitalCourse: ds.hospitalCourse || "",
              dischargeAdvice: ds.dischargeAdvice || "",
              mlcNumber: ds.mlcNumber || ""
            });
            return; // Found saved summary, stop and don't overwrite with default patient info
          }
        }

        // 2. Otherwise fall back to the default patient details
        const res = await fetch(`${apiUrl}/api/v1/patients/filter?contact=${encodeURIComponent(val)}`, { headers: getAuthHeaders() });
        if (!res.ok) return;
        const p = await res.json();
        if (p) {
          setFormData(prev => ({
            ...prev,
            patientName: p.name || prev.patientName,
            ipdNumber: p.ipdNumber || prev.ipdNumber,
            admissionNumber: p.opdNumber || prev.admissionNumber,
            consultantName: p.consultDoctor || prev.consultantName,
            admissionDate: p.date ? p.date.split('T')[0] : prev.admissionDate,
            presentingComplaints: p.chiefComplaints || prev.presentingComplaints,
            illnessSummary: p.historyPresenting || prev.illnessSummary,
            pastHistory: p.previousHistory || prev.pastHistory,
            provisionalDiagnosis: p.provisionalDiagnosis || prev.provisionalDiagnosis
          }));
        }
      } catch (e) { /* ignore */ }
    }, 500);
    return () => clearTimeout(t);
  }, [formData.contactNumber, apiUrl]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generatePDF = async () => {
    try {
      await generateDischargePDF({
        formData,
        fileName: 'discharge-summary',
      });

      const newPatientId = patientIdCounter + 1;
      setPatientIdCounter(newPatientId);
      localStorage.setItem("patientIdCounter", newPatientId.toString());
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF');
    }
  };

  const navigate = useNavigate();
  const handleGoBack = () => {
    navigate("/dashboard");
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/dischargesummaries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        alert('Discharge summary saved successfully!');
      } else {
        alert('Failed to save discharge summary: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Error saving discharge summary');
    }
  };

  return (
    <div>
      <div id="bill" className="max-w-4xl mx-auto space-y-8">
        {/* Page 1 */}
        <div id="pdf-page-1" className="bg-white p-8 rounded-lg shadow-md">
          <Header isSticky={false} />
          <form className="space-y-6 mt-4">
            <h1 className="text-xl font-bold text-gray-800 text-center mb-4 uppercase">
              Discharge Summary
            </h1>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-600 mb-2 font-semibold">Name of Patient:</label>
                <input
                  type="text"
                  name="patientName"
                  value={formData.patientName}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2 bg-gray-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-2 font-semibold">Tel No. Mobile No.:</label>
                <input
                  type="text"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2 bg-gray-50 focus:bg-white placeholder-gray-400"
                  placeholder="Type contact to auto-fill"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-600 mb-2 font-semibold">IPD No.:</label>
                <input
                  type="text"
                  name="ipdNumber"
                  value={formData.ipdNumber}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2 bg-gray-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-2 font-semibold">Admission No.:</label>
                <input
                  type="text"
                  name="admissionNumber"
                  value={formData.admissionNumber}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2 bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-600 mb-2 font-semibold">Treating Consultant/s:</label>
              <input
                type="text"
                name="consultantName"
                value={formData.consultantName}
                onChange={handleChange}
                className="w-full border rounded-md p-2 bg-gray-50 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-600 mb-2 font-semibold">Date of Admission:</label>
                <input
                  type="date"
                  name="admissionDate"
                  value={formData.admissionDate}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2 bg-gray-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-2 font-semibold">Time of Admission:</label>
                <input
                  type="time"
                  name="admissionTime"
                  value={formData.admissionTime}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2 bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-600 mb-2 font-semibold">Date of Discharge:</label>
                <input
                  type="date"
                  name="dischargeDate"
                  value={formData.dischargeDate}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2 bg-gray-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-2 font-semibold">Time of Discharge:</label>
                <input
                  type="time"
                  name="dischargeTime"
                  value={formData.dischargeTime}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2 bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            <hr className="border-gray-200" />

            <div>
              <label className="block text-gray-600 mb-2 font-semibold">Presenting Complaints:</label>
              <textarea
                name="presentingComplaints"
                value={formData.presentingComplaints}
                onChange={handleChange}
                className="w-full border rounded-md p-2 bg-gray-50 focus:bg-white min-h-[80px]"
              ></textarea>
            </div>

            <div>
              <label className="block text-gray-600 mb-2 font-semibold">Summary of Illness:</label>
              <textarea
                name="illnessSummary"
                value={formData.illnessSummary}
                onChange={handleChange}
                className="w-full border rounded-md p-2 bg-gray-50 focus:bg-white min-h-[100px]"
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-600 mb-2 font-semibold">Key Findings (Vitals/Physical):</label>
                <textarea
                  name="keyFindings"
                  value={formData.keyFindings}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2 bg-gray-50 focus:bg-white min-h-[80px]"
                ></textarea>
              </div>
              <div>
                <label className="block text-gray-600 mb-2 font-semibold">Past History:</label>
                <textarea
                  name="pastHistory"
                  value={formData.pastHistory}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2 bg-gray-50 focus:bg-white min-h-[80px]"
                ></textarea>
              </div>
            </div>
          </form>
        </div>

        {/* Page 2 */}
        <div id="pdf-page-2" className="bg-white p-8 rounded-lg shadow-md">

          <form className="space-y-6 mt-4">
            <div>
              <label className="block text-gray-600 mb-2 font-semibold">Provisional Diagnosis:</label>
              <textarea
                name="provisionalDiagnosis"
                value={formData.provisionalDiagnosis}
                onChange={handleChange}
                className="w-full border rounded-md p-2 bg-gray-50 focus:bg-white"
              ></textarea>
            </div>

            <div>
              <label className="block text-gray-600 mb-2 font-semibold">Investigations:</label>
              <textarea
                name="investigations"
                value={formData.investigations}
                onChange={handleChange}
                className="w-full border rounded-md p-2 bg-gray-50 focus:bg-white min-h-[100px]"
              ></textarea>
            </div>

            <div>
              <label className="block text-gray-600 mb-2 font-semibold">Course in the Hospital/Treatment Given:</label>
              <textarea
                name="hospitalCourse"
                value={formData.hospitalCourse}
                onChange={handleChange}
                className="w-full border rounded-md p-2 bg-gray-50 focus:bg-white min-h-[100px]"
                placeholder="Summary of hospital stay and procedures..."
              ></textarea>
            </div>

            <div>
              <label className="block text-gray-600 mb-2 font-semibold">Final Diagnosis:</label>
              <textarea
                name="finalDiagnosis"
                value={formData.finalDiagnosis}
                onChange={handleChange}
                className="w-full border rounded-md p-2 bg-gray-50 focus:bg-white"
              ></textarea>
            </div>

            <div>
              <label className="block text-gray-600 mb-2 font-semibold">Discharge Advice/Medications:</label>
              <textarea
                name="dischargeAdvice"
                value={formData.dischargeAdvice}
                onChange={handleChange}
                className="w-full border rounded-md p-2 bg-gray-50 focus:bg-white min-h-[100px]"
              ></textarea>
            </div>

            <div className="flex justify-center pt-6 no-print">
              <button
                type="button"
                onClick={handleSave}
                className="px-8 py-3 bg-green-600 text-white font-bold rounded btn-tactile shadow-lg hover:bg-green-700 font-medium mr-4"
              >
                Save Summary
              </button>
              <button
                type="button"
                onClick={generatePDF}
                className="px-8 py-3 bg-indigo-600 text-white font-bold rounded btn-tactile shadow-lg hover:bg-indigo-700 font-medium"
              >
                Download PDF
              </button>
              <button
                type="button"
                onClick={handleGoBack}
                className="px-8 py-3 bg-slate-500 text-white font-bold rounded btn-tactile shadow-lg hover:bg-slate-600 font-medium ml-4"
              >
                Back
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PatientForm;
