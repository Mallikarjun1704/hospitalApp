import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import 'tailwindcss/tailwind.css';
import Header from '../common/header';
import { useNavigate, useLocation } from "react-router-dom";
import { getAuthHeaders } from '../utils/api';

const Medical = () => {
  const [data, setData] = useState({
    name: '',
    contact: '',
    age: '',
    admissionDate: new Date().toLocaleDateString(),
    place: 'Koppal',
    ipdNumber: '',
    dischargeDate: new Date().toLocaleDateString(),
    services: Array.from({ length: 10 }).map((_, i) => ({ no: i + 1, service: '', uniqueCode: '', price: '', quantity: '', cgst: 0, sgst: 0, total: '' })),
    total: '',
    totalCgst: 0,
    totalSgst: 0,
    advancePayment: 'nil',
    netPayable: '',
  });

  const [patientIdCounter, setPatientIdCounter] = useState(1);
  const [medicines, setMedicines] = useState([]);

  const location = useLocation();
  const isAdmin = localStorage.getItem('userType') === 'admin';
  const isEdit = !!(location && location.state && location.state.editId);

  useEffect(() => {
    const storedCounter = localStorage.getItem('patientIdCounter');
    if (storedCounter) {
      setPatientIdCounter(Number(storedCounter));
    }
    // fetch medicines for select options
    const fetchMeds = async () => {
      try {
        // fetch list of medicines (use the explicit /medicines endpoint)
        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8889'}/api/v1/medicine/medicines`, { headers: getAuthHeaders() });
        if (!res.ok) {
          const txt = await res.text();
          console.error('Failed fetching medicines:', res.status, txt);
          return;
        }
        const list = await res.json();
        setMedicines(list || []);
      } catch (err) { console.error('Error fetching medicines', err); }
    };
    fetchMeds();
  }, []);

  useEffect(() => {
    // load for editing if editId present
    if (location && location.state && location.state.editId) {
      loadBill(location.state.editId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location && location.state]);

  // when contact changes, try to auto-fill patient details (debounced)
  useEffect(() => {
    const val = data.contact;
    if (!val) return; // don't lookup empty
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8889'}/api/v1/patients/filter?contact=${encodeURIComponent(val)}`, { headers: getAuthHeaders() });
        if (!res.ok) return;
        const p = await res.json();
        if (p) {
          setData(prev => ({ ...prev, name: p.name || prev.name, age: p.age || prev.age, ipdNumber: p.ipdNumber || prev.ipdNumber }));
        }
      } catch (e) { /* ignore */ }
    }, 400);
    return () => clearTimeout(t);
  }, [data.contact]);

  const handleInputChange = (field, value) => {
    setData({ ...data, [field]: value });
  };

  const handleServiceChange = (index, field, value) => {
    const updatedServices = [...data.services];
    updatedServices[index][field] = value;

    if (field === 'service' && value) {
      // value is medicineId
      const med = medicines.find(m => m._id === value);
      if (med) {
        updatedServices[index].medicineId = med._id;
        updatedServices[index].price = med.salePrice || med.purchasePrice || 0;
        updatedServices[index].uniqueCode = med.code || '';
        updatedServices[index].name = med.name || '';
      }
    }

    if (field === 'price' || field === 'quantity' || field === 'cgst' || field === 'sgst') {
      const price = parseFloat(updatedServices[index].price) || 0;
      const quantity = parseInt(updatedServices[index].quantity) || 0;
      const cgst = parseFloat(updatedServices[index].cgst) || 0;
      const sgst = parseFloat(updatedServices[index].sgst) || 0;
      updatedServices[index].total = (price * quantity) + cgst + sgst || 0;
    }

    // if uniqueCode manually entered, try to resolve medicine
    if (field === 'uniqueCode' && value) {
      const med = medicines.find(m => m.code === value || `${m.code} - ${m.name}` === value || m.name === value);
      if (med) {
        updatedServices[index].medicineId = med._id;
        updatedServices[index].name = med.name || '';
        updatedServices[index].uniqueCode = med.code || '';
        updatedServices[index].price = med.salePrice || med.purchasePrice || 0;
        const qty = parseInt(updatedServices[index].quantity) || 1;
        updatedServices[index].quantity = qty;
        updatedServices[index].cgst = updatedServices[index].cgst || 0;
        updatedServices[index].sgst = updatedServices[index].sgst || 0;
        updatedServices[index].total = (Number(updatedServices[index].price) || 0) * qty + (Number(updatedServices[index].cgst) || 0) + (Number(updatedServices[index].sgst) || 0);
      }
    }

    const updatedTotal = updatedServices.reduce(
      (sum, item) => (item.total !== '-' ? sum + parseFloat(item.total) : sum),
      0
    );
    const updatedTotalCgst = updatedServices.reduce((sum, item) => sum + (parseFloat(item.cgst) || 0), 0);
    const updatedTotalSgst = updatedServices.reduce((sum, item) => sum + (parseFloat(item.sgst) || 0), 0);

    setData({
      ...data,
      services: updatedServices,
      total: updatedTotal,
      totalCgst: updatedTotalCgst,
      totalSgst: updatedTotalSgst,
      netPayable: updatedTotal
    });
  };

  const addNewRow = () => {
    const newRow = {
      no: data.services.length + 1,
      service: '',
      price: '',
      quantity: '',
      cgst: 0,
      sgst: 0,
      total: '',
      uniqueCode: '',
      name: ''
    };

    setData({ ...data, services: [...data.services, newRow] });
  };

  const removeLastRow = () => {
    if (data.services.length > 0) {
      const updatedServices = data.services.slice(0, -1);

      const updatedTotal = updatedServices.reduce(
        (sum, item) => (item.total !== '-' ? sum + parseFloat(item.total || 0) : sum),
        0
      );

      setData({ ...data, services: updatedServices, total: updatedTotal, netPayable: updatedTotal });
    }
  }

  const loadBill = async (id) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8889'}/api/v1/medicalbills/${id}`, { headers: getAuthHeaders() });
      if (!res.ok) return;
      const bill = await res.json();
      const patientResp = bill.contact ? await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8889'}/api/v1/patients/filter?contact=${encodeURIComponent(bill.contact)}`, { headers: getAuthHeaders() }) : null;
      let patient = null;
      if (patientResp && patientResp.ok) patient = await patientResp.json();

      setData({
        name: bill.name || '',
        contact: bill.contact || '',
        age: bill.age || (patient && patient.age) || '',
        admissionDate: bill.admissionDate ? new Date(bill.admissionDate).toLocaleDateString() : new Date().toLocaleDateString(),
        place: bill.place || 'Koppal',
        ipdNumber: bill.ipdNumber || '',
        dischargeDate: bill.dischargeDate ? new Date(bill.dischargeDate).toLocaleDateString() : new Date().toLocaleDateString(),
        services: (bill.services && bill.services.length) ? bill.services.map((s, i) => ({
          no: i + 1,
          service: s.medicineId || s.service || '',
          medicineId: s.medicineId || undefined,
          price: s.price || '',
          quantity: s.quantity || '',
          cgst: s.cgst || s.gst || 0,
          sgst: s.sgst || 0,
          total: s.total || '',
          uniqueCode: s.uniqueCode || '',
          name: s.name || ''
        })) : data.services,
        total: bill.total || 0,
        totalCgst: (bill.services || []).reduce((sum, s) => sum + (s.cgst || s.gst || 0), 0),
        totalSgst: (bill.services || []).reduce((sum, s) => sum + (s.sgst || 0), 0),
        advancePayment: bill.advancePayment || 0,
        netPayable: bill.netPayable || 0,
      });
    } catch (err) { /* ignore */ }
  };

  const saveBill = async () => {
    try {
      if (!data.contact || !data.name) return alert('Name and contact are required');
      const payload = {
        contact: data.contact,
        name: data.name,
        ipdNumber: data.ipdNumber,
        admissionDate: data.admissionDate,
        dischargeDate: data.dischargeDate,
        services: data.services.filter(s => (s.service && s.service.trim() !== '') || (s.uniqueCode && s.uniqueCode.trim() !== '')).map(s => ({
          medicineId: s.medicineId,
          uniqueCode: s.uniqueCode || '',
          name: s.service || s.name || '',
          price: Number(s.price) || 0,
          quantity: Number(s.quantity) || 0,
          cgst: Number(s.cgst) || 0,
          sgst: Number(s.sgst) || 0,
          total: Number(s.total) || 0
        })),
        total: Number(data.total) || 0,
        netPayable: Number(data.netPayable) || Number(data.total) || 0,
        advancePayment: Number(data.advancePayment) || 0,
      };

      // If editing an existing bill, do PUT to update
      if (location && location.state && location.state.editId) {
        const id = location.state.editId;
        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8889'}/api/v1/medicalbills/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(payload) });
        if (!res.ok) { const err = await res.json(); return alert('Failed to update: ' + (err.error || res.statusText)); }
        alert('Updated medical bill');
        navigate('/details/medical-bill/table');
        return;
      }

      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8889'}/api/v1/medicalbills`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload) });
      if (!res.ok) { const err = await res.json(); return alert('Failed to save: ' + (err.error || res.statusText)); }
      alert('Saved medical bill');
      navigate('/details/medical-bill/table');
    } catch (err) { alert('Error saving: ' + err.message); }
  };



  // addByCode removed: selection now via per-row code input with datalist

  const handleSelectByCode = (index, val) => {
    const updatedServices = [...data.services];
    updatedServices[index].uniqueCode = val;
    // try to resolve med by code or by name
    const med = medicines.find(m => m.code === val || m.name === val || `${m.code} - ${m.name}` === val);
    if (med) {
      updatedServices[index].medicineId = med._id;
      updatedServices[index].name = med.name || '';
      updatedServices[index].price = med.salePrice || med.purchasePrice || 0;
      updatedServices[index].quantity = updatedServices[index].quantity || 1;
      updatedServices[index].cgst = updatedServices[index].cgst || 0;
      updatedServices[index].sgst = updatedServices[index].sgst || 0;
      updatedServices[index].total = (Number(updatedServices[index].price) || 0) * (Number(updatedServices[index].quantity) || 1) + (Number(updatedServices[index].cgst) || 0) + (Number(updatedServices[index].sgst) || 0);
      updatedServices[index].service = med._id;
    }

    const updatedTotal = updatedServices.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const updatedTotalCgst = updatedServices.reduce((sum, item) => sum + (Number(item.cgst) || 0), 0);
    const updatedTotalSgst = updatedServices.reduce((sum, item) => sum + (Number(item.sgst) || 0), 0);
    setData({
      ...data,
      services: updatedServices,
      total: updatedTotal,
      totalCgst: updatedTotalCgst,
      totalSgst: updatedTotalSgst,
      netPayable: updatedTotal
    });
  };


  const generatePDF = async () => {
    const billContent = document.querySelector('#bill');
    const noPrintElements = document.querySelectorAll('.no-print');
    const allInputs = billContent.querySelectorAll('textarea, input, select');

    // Create a temporary label for the copy type
    const copyLabel = document.createElement('div');
    copyLabel.style.textAlign = 'right';
    copyLabel.style.fontWeight = 'bold';
    copyLabel.style.padding = '5px 20px';
    copyLabel.style.fontSize = '16px';
    copyLabel.style.color = '#333';
    billContent.prepend(copyLabel);

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
      el.style.display = 'none';
    });

    try {
      // Expand inputs
      allInputs.forEach(el => {
        el.style.height = 'auto';
        el.style.height = (el.scrollHeight + 2) + 'px';
        el.style.overflow = 'visible';
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const captureCopy = async (label) => {
        copyLabel.textContent = label;
        const canvas = await html2canvas(billContent, {
          scale: 3,
          useCORS: true,
          logging: false,
          windowWidth: billContent.scrollWidth,
        });
        return canvas.toDataURL('image/png', 1.0);
      };

      // Patient Copy
      const imgData1 = await captureCopy('PATIENT COPY');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData1);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData1, 'PNG', 0, 0, pdfWidth, pdfHeight);

      // Hospital Copy
      pdf.addPage();
      const imgData2 = await captureCopy('HOSPITAL COPY');
      pdf.addImage(imgData2, 'PNG', 0, 0, pdfWidth, pdfHeight);

      pdf.save(`medical-bill-${Date.now()}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF');
    } finally {
      // Remove temporary label
      if (copyLabel.parentNode) {
        copyLabel.parentNode.removeChild(copyLabel);
      }

      // Restore styles
      originalStyles.forEach(item => {
        item.el.style.height = item.height;
        item.el.style.overflow = item.overflow;
      });

      // Restore no-print elements
      noPrintElements.forEach((el) => {
        el.style.display = el.dataset.origDisplay || '';
      });
    }

    const newPatientId = patientIdCounter + 1;
    setPatientIdCounter(newPatientId);
    localStorage.setItem('patientIdCounter', newPatientId.toString());

    setData({ ...data, ipdNumber: newPatientId });
  };

  const navigate = useNavigate();
  const handleGoBack = (event) => {
    // Prevent navigation
    navigate(-1); // Go to previous page
  };

  return (
    <div>
      <div id="bill" className="w-full items-center">
        <Header />
        <div className="flex flex-col space-y-5 px-2">
          <h2 className="font-bold text-lg text-center">Pharmacy Cash Bill</h2>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { label: 'Name', field: 'name', PlaceHolder: 'Enter The Name' },
              { label: 'Contact', field: 'contact', PlaceHolder: 'Enter Contact Number' },
              { label: 'Age', field: 'age', PlaceHolder: 'Enter The Age' },
              { label: 'Date of Admission', field: 'admissionDate', PlaceHolder: 'Enter The admissionDate' },
              { label: 'Place', field: 'place' },
              { label: 'Patient ID', field: 'ipdNumber', PlaceHolder: 'Enter IPD Number', value: data.ipdNumber || patientIdCounter },
              { label: 'Date of Discharge', field: 'dischargeDate', PlaceHolder: 'Enter The dischargeDate' },
            ].map((item, idx) => (
              <div key={idx} className="flex">
                <label className="font-bold whitespace-nowrap">{item.label}: </label>
                <input
                  type="text"
                  placeholder={item.PlaceHolder}
                  value={item.value || data[item.field]}
                  onChange={(e) => handleInputChange(item.field, e.target.value)}
                  className=""
                />
              </div>
            ))}
          </div>
          {/* selection is by per-row Code input (datalist below) */}

          {/* datalist used for searchable dropdown by code */}
          <datalist id="med-list">
            {medicines.map(m => (
              // show combined 'CODE - Name' so users can type either code or name to match
              // Also display the combined code-name text so suggestions show the unique code
              <option key={m._id} value={`${m.code} - ${m.name}`}>{`${m.code} - ${m.name}`}</option>
            ))}
          </datalist>

          <table className="w-full mt-6 text-left border border-gray-300">
            <thead className="bg-sky-700">
              <tr>
                <th className="p-2 border text-white">No</th>
                <th className="p-2 border text-white">Unique Code</th>
                <th className="p-2 border text-white">Name</th>

                <th className="p-2 border text-white">Price</th>
                <th className="p-2 border text-white">Quantity Days</th>
                <th className="p-2 border text-white">CGST</th>
                <th className="p-2 border text-white">SGST</th>
                <th className="p-2 border text-white">Total (Rupees)</th>
              </tr>
            </thead>
            <tbody>
              {data.services.map((service, index) => (
                <tr key={service.no}>
                  <td className="p-2 border">{service.no}</td>
                  <td className="p-2 border">
                    <input
                      list="med-list"
                      placeholder="Type code or name"
                      value={service.uniqueCode || ''}
                      onChange={(e) => handleSelectByCode(index, e.target.value)}
                      className="w-full p-1 border-gray-300 rounded"
                    />
                  </td>
                  <td className="p-2 border">{service.name || ''}</td>
                  <td className="p-2 border">
                    <input
                      type="number"
                      value={service.price}
                      onChange={(e) => handleServiceChange(index, 'price', e.target.value)}
                      className="w-full p-1 border-gray-300 rounded"
                    />
                  </td>
                  <td className="p-2 border">
                    <input
                      type="number"
                      value={service.quantity}
                      onChange={(e) => handleServiceChange(index, 'quantity', e.target.value)}
                      className="w-full p-1 border-gray-300 rounded"
                    />
                  </td>
                  <td className="p-2 border">
                    <input
                      type="number"
                      value={service.cgst}
                      onChange={(e) => handleServiceChange(index, 'cgst', e.target.value)}
                      className="w-full p-1 border-gray-300 rounded"
                    />
                  </td>
                  <td className="p-2 border">
                    <input
                      type="number"
                      value={service.sgst}
                      onChange={(e) => handleServiceChange(index, 'sgst', e.target.value)}
                      className="w-full p-1 border-gray-300 rounded"
                    />
                  </td>
                  <td className="p-2 border">
                    <input type="text" value={service.total} readOnly className="w-full p-1" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4">
            <p>
              <b>Total CGST:</b>
              <input type="number" value={data.totalCgst} readOnly className="ml-2 p-1 border-gray-300 rounded" />
            </p>
            <p>
              <b>Total SGST:</b>
              <input type="number" value={data.totalSgst} readOnly className="ml-2 p-1 border-gray-300 rounded" />
            </p>
            <p>
              <b>Total:</b>
              <input
                type="number"
                value={data.total}
                readOnly
                className="ml-2 p-1 border-gray-300 rounded"
              />
            </p>
            <p>
              <b>Advance Payment:</b>
              <input
                type="text"
                value={data.advancePayment}
                onChange={(e) => handleInputChange('advancePayment', e.target.value)}
                className="ml-2 p-1 border-gray-300 rounded"
              />
            </p>
            <p>
              <b>Net Amount Payable:</b>
              <input
                type="number"
                value={data.netPayable}
                readOnly
                className="ml-2 p-1 border-gray-300 rounded"
              />
            </p>
          </div>
        </div>
      </div>
      <div className="flex justify-center mt-6 pb-10">
        <button
          onClick={addNewRow}
          className="px-8 py-2 bg-emerald-600 text-white rounded btn-tactile hover:bg-emerald-700 font-medium shadow-md no-print"
        >
          Add New Row
        </button>
        <button
          onClick={removeLastRow}
          className="px-8 py-2 bg-rose-600 text-white rounded btn-tactile hover:bg-rose-700 font-medium shadow-md no-print ml-4"
        >
          Remove Last Row
        </button>
        <button
          onClick={generatePDF}
          className="px-8 py-2 bg-indigo-600 text-white rounded btn-tactile hover:bg-indigo-700 font-medium shadow-md no-print ml-4"
        >
          Download PDF
        </button>
        <button
          onClick={handleGoBack}
          className="px-8 py-2 bg-slate-500 text-white rounded btn-tactile hover:bg-slate-600 font-medium shadow-md no-print ml-4"
        >
          Back
        </button>
        <button
          onClick={saveBill}
          className="px-10 py-2 bg-blue-600 text-white rounded btn-tactile hover:bg-blue-700 font-bold shadow-lg no-print ml-4"
        >
          {isEdit ? (isAdmin ? 'Update Bill' : 'Save Bill') : 'Save Bill'}
        </button>
      </div>
    </div>
  );
};

export default Medical;
