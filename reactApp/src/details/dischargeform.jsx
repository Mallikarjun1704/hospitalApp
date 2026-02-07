import React, { useState, useEffect } from "react";
import Header from "../common/header";
import { jsPDF } from "jspdf";
import "tailwindcss/tailwind.css";
import { useNavigate } from "react-router-dom";

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generatePDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: "a2",
    });

    const billContent = document.querySelector("#bill");
    if (!billContent) {
      alert("No content available to generate the PDF.");
      return;
    }

    const noPrintElements = document.querySelectorAll(".no-print");
    noPrintElements.forEach((el) => {
      el.style.display = "none";
    });

    doc.html(billContent, {
      callback: (doc) => {
        noPrintElements.forEach((el) => {
          el.style.display = "";
        });
        doc.save("patientforms.pdf");
      },
      x: 10,
      y: 10,
      width: 800,
      windowWidth: 900,
    });

    const newPatientId = patientIdCounter + 1;
    setPatientIdCounter(newPatientId);
    localStorage.setItem("patientIdCounter", newPatientId.toString());
    setFormData({ ...formData, patientId: newPatientId });
  };

  const navigate = useNavigate();
  const handleGoBack = () => {
    // Prevent navigation
     navigate("/details/patient-details"); // Go to previous page
  };

  return (
    <div>
      <Header />
      <div>
        <form
          id="bill"
          className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md space-y-6"
        >
          <h1 className="text-xl font-bold text-gray-700 mb-4">
            Patient Information Form
          </h1>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-600 mb-2">Name of Patient:</label>
              <input
                type="text"
                name="patientName"
                value={formData.patientName}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-2">Tel No. Mobile No.:</label>
              <input
                type="text"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-600 mb-2">IPD No.:</label>
              <input
                type="text"
                name="ipdNumber"
                value={formData.ipdNumber}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-2">Admission No.:</label>
              <input
                type="text"
                name="admissionNumber"
                value={formData.admissionNumber}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-600 mb-2">Treating Consultant/s:</label>
            <input
              type="text"
              name="consultantName"
              value={formData.consultantName}
              onChange={handleChange}
              className="w-full border rounded-md p-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-600 mb-2">Date of Admission:</label>
              <input
                type="date"
                name="admissionDate"
                value={formData.admissionDate}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-2">Time of Admission:</label>
              <input
                type="time"
                name="admissionTime"
                value={formData.admissionTime}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-600 mb-2">Date of Discharge:</label>
              <input
                type="date"
                name="dischargeDate"
                value={formData.dischargeDate}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-2">Time of Discharge:</label>
              <input
                type="time"
                name="dischargeTime"
                value={formData.dischargeTime}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-600 mb-2">Final Diagnosis:</label>
            <textarea
              name="provisionalDiagnosis"
              value={formData.provisionalDiagnosis}
              onChange={handleChange}
              className="w-full border rounded-md p-2"
            ></textarea>
          </div>

          <div>
            <label className="block text-gray-600 mb-2">Treatment Given:</label>
            <textarea
              name="finalDiagnosis"
              value={formData.finalDiagnosis}
              onChange={handleChange}
              className="w-full border rounded-md p-2"
            ></textarea>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={generatePDF}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 no-print"
            >
              Download PDF
            </button>
            <button
              type="button"
              onClick={handleGoBack}
              className="px-6 py-2 bg-blue-500 rounded hover:bg-blue-600 no-print ml-4"
            >
              Back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientForm;
