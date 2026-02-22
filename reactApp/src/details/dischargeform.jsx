import React, { useState, useEffect } from "react";
import Header from "../common/header";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import "tailwindcss/tailwind.css";
import { useNavigate } from "react-router-dom";
import { getAuthHeaders } from "../utils/api";

const PatientForm = () => {
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

  // Auto-populate patient details by contact number
  useEffect(() => {
    const val = formData.contactNumber;
    if (!val || val.length < 10) return;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8889'}/api/v1/patients/filter?contact=${encodeURIComponent(val)}`, { headers: getAuthHeaders() });
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
  }, [formData.contactNumber]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generatePDF = async () => {
    const pages = [document.getElementById("pdf-page-1"), document.getElementById("pdf-page-2")];
    const noPrintElements = document.querySelectorAll(".no-print");
    const allInputs = document.querySelectorAll('#bill textarea, #bill input, #bill select');

    // Store original styles
    const originalStyles = [];
    allInputs.forEach(el => {
      originalStyles.push({
        el,
        height: el.style.height,
        overflow: el.style.overflow
      });
    });

    // Hide no-print elements
    noPrintElements.forEach((el) => {
      el.dataset.origDisplay = el.style.display;
      el.style.display = "none";
    });

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      for (let i = 0; i < pages.length; i++) {
        const element = pages[i];
        if (!element) continue;

        // Expand inputs for THIS page
        const pageInputs = element.querySelectorAll('textarea, input, select');
        pageInputs.forEach(el => {
          el.style.height = 'auto';
          el.style.height = (el.scrollHeight + 5) + 'px';
          el.style.overflow = 'visible';
        });

        // Brief wait
        await new Promise(resolve => setTimeout(resolve, 100));

        const canvas = await html2canvas(element, {
          scale: 3,
          useCORS: true,
          logging: false,
          windowWidth: element.scrollWidth,
        });

        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save(`discharge-summary-${Date.now()}.pdf`);

    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF');
    } finally {
      // Restore styles
      originalStyles.forEach(item => {
        item.el.style.height = item.height;
        item.el.style.overflow = item.overflow;
      });

      // Restore no-print elements
      noPrintElements.forEach((el) => {
        el.style.display = el.dataset.origDisplay || "";
      });
    }

    const newPatientId = patientIdCounter + 1;
    setPatientIdCounter(newPatientId);
    localStorage.setItem("patientIdCounter", newPatientId.toString());
  };

  const navigate = useNavigate();
  const handleGoBack = () => {
    // Prevent navigation
    navigate("/details/patient-details"); // Go to previous page
  };

  return (
    <div>
      <div id="bill" className="max-w-4xl mx-auto space-y-8">
        {/* Page 1 */}
        <div id="pdf-page-1" className="bg-white p-8 rounded-lg shadow-md">
          <Header />
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
                onClick={generatePDF}
                className="px-8 py-3 bg-blue-600 text-white font-bold rounded shadow-lg hover:bg-blue-700"
              >
                Download PDF
              </button>
              <button
                type="button"
                onClick={handleGoBack}
                className="px-8 py-3 bg-gray-500 text-white font-bold rounded shadow-lg hover:bg-gray-600 ml-4"
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
