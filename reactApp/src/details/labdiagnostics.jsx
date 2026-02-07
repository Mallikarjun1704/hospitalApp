import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import 'tailwindcss/tailwind.css';
import Header from '../common/header';
import { useNavigate, useLocation } from "react-router-dom";
import { getAuthHeaders } from '../utils/api';

const  Labdiagonstics= () => {
  const [data, setData] = useState({
    name: '',
    contact: '',
    age: '',
    admissionDate: new Date().toLocaleDateString(),
    place: 'Koppal',
    ipdNumber: '',
    dischargeDate: new Date().toLocaleDateString(),
    services: [
      { no: 1, service: 'Consultation', price: 150, quantity: 1, total: 150 },
    ],
    total: '',
    advancePayment: 'nil',
    netPayable: '',
  });

  const [patientIdCounter, setPatientIdCounter] = useState(1);
  const [tests, setTests] = useState([]);
  const location = useLocation();

  useEffect(() => {
    const storedCounter = localStorage.getItem('patientIdCounter');
    if (storedCounter) {
      setPatientIdCounter(Number(storedCounter));
    }
    const fetchTests = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8889'}/api/v1/labtests`, { headers: getAuthHeaders() });
        if (!res.ok) return;
        const list = await res.json();
        setTests(list || []);
      } catch (err) { }
    };
    fetchTests();
  }, []);

  useEffect(() => {
    if (location && location.state && location.state.editId) {
      loadBill(location.state.editId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location && location.state]);

  // when contact changes, try to auto-fill patient details (debounced)
  useEffect(() => {
    const val = data.contact;
    if (!val) return;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8889'}/api/v1/patients/filter?contact=${encodeURIComponent(val)}`, { headers: getAuthHeaders() });
        if (!res.ok) return;
        const p = await res.json();
        if (p) setData(prev => ({ ...prev, name: p.name || prev.name, age: p.age || prev.age, ipdNumber: p.ipdNumber || prev.ipdNumber }));
      } catch (e) { /* ignore */ }
    }, 400);
    return () => clearTimeout(t);
  }, [data.contact]);

  const handleInputChange = (field, value) => {
    setData({ ...data, [field]: value });
  };

  const handleSelectTestByCode = (index, val) => {
    const updatedServices = [...data.services];
    updatedServices[index].testCode = val;
    const t = tests.find(x => x.code === val || x.name === val || `${x.code} - ${x.name}` === val);
    if (t) {
      updatedServices[index].testId = t._id;
      updatedServices[index].testName = t.name || '';
      updatedServices[index].price = t.price || 0;
      updatedServices[index].quantity = updatedServices[index].quantity || 1;
      updatedServices[index].total = (Number(updatedServices[index].price) || 0) * (Number(updatedServices[index].quantity) || 1);
      updatedServices[index].service = t._id;
    }

    const updatedTotal = updatedServices.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    setData({ ...data, services: updatedServices, total: updatedTotal, netPayable: updatedTotal });
  };

  const loadBill = async (id) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8889'}/api/v1/labbills/${id}`, { headers: getAuthHeaders() });
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
        services: (bill.services && bill.services.length) ? bill.services.map((s, i) => ({ no: i+1, service: s.service || '', testId: s.testId || undefined, price: s.price || '', quantity: s.quantity || '', total: s.total || '', testCode: s.testCode || '', testName: s.testName || '' })) : data.services,
        total: bill.total || 0,
        advancePayment: bill.advancePayment || 0,
        netPayable: bill.netPayable || 0,
      });
    } catch (err) {}
  };

  const saveBill = async () => {
    try {
      if (!data.contact || !data.name) return alert('Name and contact required');
      const payload = {
        contact: data.contact,
        name: data.name,
        ipdNumber: data.ipdNumber,
        admissionDate: data.admissionDate,
        dischargeDate: data.dischargeDate,
        services: data.services.map(s => ({ testId: s.testId, service: s.service, testCode: s.testCode || '', testName: s.testName || '', price: Number(s.price) || 0, quantity: Number(s.quantity) || 0, total: Number(s.total) || 0 })),
        total: Number(data.total) || 0,
        netPayable: Number(data.netPayable) || Number(data.total) || 0,
        advancePayment: Number(data.advancePayment) || 0,
      };

      // if editing an existing bill, perform PUT
      if (location && location.state && location.state.editId) {
        const id = location.state.editId;
        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8889'}/api/v1/labbills/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(payload) });
        if (!res.ok) { const e = await res.json(); return alert('Failed to update: ' + (e.error || res.statusText)); }
        alert('Updated lab bill');
        navigate('/details/lab-bill/table');
        return;
      }

      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8889'}/api/v1/labbills`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload) });
      if (!res.ok) { const e = await res.json(); return alert('Failed to save: ' + (e.error || res.statusText)); }
      alert('Saved lab bill');
      navigate('/details/lab-bill/table');
    } catch (err) { alert('Error saving: ' + err.message); }
  };

  const isEdit = !!(location && location.state && location.state.editId);
  // addByTestCode removed: selection now via per-row Test Code input with datalist

  const addNewRow = () => {
    const newRow = {
      no: data.services.length + 1,
      service: '',
      price: '',
      quantity: '',
      total: '',
      testCode: '',
      testName: ''
    };
  
    setData({ ...data, services: [...data.services, newRow] });
  };
  
  const removeLastRow = () => {
    if (data.services.length >0) {
      const updatedServices = data.services.slice(0, -1);

      const updatedTotal = updatedServices.reduce(
        (sum, item) => (item.total !== '-' ? sum + parseFloat(item.total || 0) : sum),
        0
      );

      setData({ ...data, services: updatedServices, total: updatedTotal, netPayable: updatedTotal });
    }
  }
  
  const generatePDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: 'a2',
    });

    const billContent = document.querySelector('#bill');
    const noPrintElements = document.querySelectorAll('.no-print');

    noPrintElements.forEach((el) => {
      el.style.display = 'none';
    });

    const inputs = billContent.querySelectorAll('input');
    inputs.forEach((input) => {
    const span = document.createElement('span');
    span.textContent = input.value;
    input.parentNode.replaceChild(span, input);
  });

    const selects = billContent.querySelectorAll('select');
    selects.forEach((select) => {
    const span = document.createElement('span');
    span.textContent = select.options[select.selectedIndex].text;
    select.parentNode.replaceChild(span, select);
  });

    doc.html(billContent, {
      callback: (doc) => {
        // finalize and save PDF
        try {
          doc.save(`lab-bill-${Date.now()}.pdf`);
        } catch (e) {
          console.error('Failed to save PDF', e);
        }
      },
      x: 10,
      y: 10,
    });

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

  const formatCurrency = (value) => {
    try { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value || 0); } catch (e) { return (value || 0).toString(); }
  };

  return (
    <div>
      <div id="bill" className="w-full items-center">
        <Header />
        <div className="flex flex-col space-y-5 px-2">
          <h2 className="font-bold text-lg text-center">Lab Cash Bill</h2>
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
          <datalist id="test-list">
            {tests.map(t => (<option key={t._id} value={t.code}>{t.name}</option>))}
          </datalist>
          {/* Add New Lab Test button moved to Lab Bill Table page */}
          <table className="w-full mt-6 text-left border border-gray-300">
            <thead className="bg-sky-700">
              <tr>
                <th className="p-2 border text-white">No</th>
                <th className="p-2 border text-white">Test Code</th>
                <th className="p-2 border text-white">Test Name</th>
                <th className="p-2 border text-white">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.services.map((service, index) => (
                <tr key={service.no}>
                  <td className="p-2 border">{service.no}</td>
                  <td className="p-2 border">
                    <input list="test-list" placeholder="Test Code" value={service.testCode || ''} onChange={(e) => handleSelectTestByCode(index, e.target.value)} className="w-full p-1 border-gray-300 rounded" />
                  </td>
                  <td className="p-2 border">{service.testName || ''}</td>
                  <td className="p-2 border">{formatCurrency(service.total || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4">
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
      <div className="flex justify-center">
         <button
          onClick={addNewRow}
          className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 no-print"
          >
            Add New Row
         </button>
         <button 
         onClick={removeLastRow}
         className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 no-print ml-4"
         >
           Remove Last Row
         </button>
         <button 
         onClick={generatePDF}
         className="px-6 py-2 bg-blue-500 rounded hover:bg-blue-600 no-print ml-4"
         >
           Download PDF
         </button>
         <button 
         onClick={handleGoBack}
         className="px-6 py-2 bg-blue-500 rounded hover:bg-blue-600 no-print ml-4"
         >
           Back
         </button>
            <button 
         onClick={saveBill}
         className="px-6 py-2 bg-blue-600 rounded text-white hover:bg-blue-700 no-print ml-4"
         >
           {isEdit ? 'Update Bill' : 'Save Bill'}
         </button>
      </div>
    </div>
  );
};

export default Labdiagonstics;
