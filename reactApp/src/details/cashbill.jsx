import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import 'tailwindcss/tailwind.css';
import Header from '../common/header';
import { getAuthHeaders } from '../utils/api';
import { useNavigate, useLocation } from "react-router-dom";

const Cashbill = () => {
  const navigate = useNavigate();

  const handleGoBack = (event) => {
    // Prevent navigation
    navigate(-1); // Go to previous page
  };

  const fixedServices = [
    'Consultation', 'Doctor Visit', 'Day care nursing','procedure done', 'Bed Charge',
  ];

  const initialServices = fixedServices.map((service, index) => ({
    no: index + 1, service, price: '', quantity: '', total: ''
  }));

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-GB"); 
  };
  
  const [data, setData] = useState({
    name: '',
    contact: '',
    age: '',
    admissionDate: formatDate(new Date()),
    place: 'Koppal',
    patientId: '',
    dischargeDate: formatDate(new Date()),
    services: initialServices,
    total: '',
    advancePayment: 0,
    netPayable: '',
  });

  const [editingId, setEditingId] = useState(null);

  const [patientIdCounter, setPatientIdCounter] = useState(1);

  useEffect(() => {
    const storedCounter = localStorage.getItem('patientIdCounter');
    if (storedCounter) {
      setPatientIdCounter(Number(storedCounter));
    }
  }, []);

  const location = useLocation();

  useEffect(() => {
    // If navigated here to edit a bill, the table sends { editId }
    if (location && location.state && location.state.editId) {
      editBill(location.state.editId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location && location.state]);

  const handleInputChange = (field, value) => {
    // If advancePayment change, ensure numeric and update netPayable
    if (field === 'advancePayment') {
      const adv = Number(value) || 0;
      const total = Number(data.total) || 0;
      setData({ ...data, [field]: adv, netPayable: total - adv });
    } else {
      setData({ ...data, [field]: value });
    }
    // if patientId changed, try to populate patient details
    if (field === 'patientId') {
      populatePatientById(value);
    }
    // If contact changed, try to populate by contact from server
    if (field === 'contact') {
      populatePatientByContact(value);
    }
  };

  const populatePatientById = (patientIdValue) => {
    if (!patientIdValue) return;

    // Try to get patients from localStorage (key: 'patients') if app stores them there
    let patients = [];
    try {
      const stored = localStorage.getItem('patients');
      if (stored) patients = JSON.parse(stored);
    } catch (e) {
      // ignore parse errors
    }

    // If no stored patients, generate the same dummy data pattern used in PatientTable
    if (!patients || patients.length === 0) {
      patients = Array.from({ length: 15 }).map((_, i) => ({
        id: i + 1,
        patientName: `Patient ${i + 1}`,
        age: 20 + (i % 30),
        contactNumber: `90000${10000 + i}`,
        ipdNumber: `IPD-${1000 + i}`,
        admissionDate: `${2025}-${String(10).padStart(2, '0')}-${String(((i % 28) + 1)).padStart(2,'0')}`,
        consultantName: `Dr. Consultant ${(i % 5) + 1}`,
      }));
    }

    // Find by ipdNumber or numeric id
    const pid = String(patientIdValue).trim();
    let found = patients.find(p => p.ipdNumber === pid || String(p.id) === pid);

    if (found) {
      setData(prev => ({
        ...prev,
        name: found.patientName || prev.name,
        age: found.age || prev.age,
        admissionDate: found.admissionDate || prev.admissionDate,
        place: prev.place,
      }));
    }
  };

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8889';

  const populatePatientByContact = async (contactValue) => {
    if (!contactValue || String(contactValue).trim().length < 3) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/patients/filter?contact=${encodeURIComponent(contactValue)}`, { headers: getAuthHeaders() });
      if (!res.ok) return;
      const found = await res.json();
      if (found) {
        setData(prev => ({
          ...prev,
          contact: found.contact || prev.contact,
          name: found.name || prev.name,
          age: found.age || prev.age,
          admissionDate: found.date ? formatDate(new Date(found.date)) : prev.admissionDate,
          patientId: found.ipdNumber || prev.ipdNumber,
          place: prev.place,
          // if ipdNumber exists, set it
          ipdNumber: found.ipdNumber || prev.ipdNumber,
        }));
      }
    } catch (err) {
      // ignore
    }
  };

  const handleServiceChange = (index, field, value) => {
    const updatedServices = [...data.services];
    updatedServices[index][field] = value;

    if (field === 'price' || field === 'quantity') {
      const price = parseFloat(updatedServices[index].price) || 0;
      const quantity = parseInt(updatedServices[index].quantity) || 0;
      updatedServices[index].total = price * quantity || 0;
    }

    const updatedTotal = updatedServices.reduce(
      (sum, item) => (item.total !== '-' ? sum + parseFloat(item.total) : sum),
      0
    );

    const advance = Number(data.advancePayment) || 0;
    setData({ ...data, services: updatedServices, total: updatedTotal, netPayable: updatedTotal - advance });
  };

  const addRow = () => {
    const newServices = [...data.services];
    const nextNo = newServices.length > 0 ? (newServices[newServices.length - 1].no + 1) : 1;
    newServices.push({ no: nextNo, service: '', price: '', quantity: '', total: '' });
    setData({ ...data, services: newServices });
  };

  const removeRow = (index) => {
    const newServices = [...data.services];
    newServices.splice(index, 1);
    // re-number
    const renumbered = newServices.map((s, i) => ({ ...s, no: i + 1 }));
    const updatedTotal = renumbered.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
    setData({ ...data, services: renumbered, total: updatedTotal, netPayable: updatedTotal });
  };

  const saveBill = async () => {
    try {
      // Basic validation
      if (!data.contact || String(data.contact).trim().length < 3) return alert('Contact number is required');
      if (!data.name || String(data.name).trim().length < 1) return alert('Patient name is required');
      const toISODate = (val) => {
        if (!val) return undefined;
        // convert DD/MM/YYYY to ISO YYYY-MM-DD which the server can parse reliably
        const m = String(val).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
        return val;
      };

      const payload = {
        contact: data.contact,
        name: data.name,
        ipdNumber: data.ipdNumber,
        admissionDate: toISODate(data.admissionDate),
        dischargeDate: toISODate(data.dischargeDate),
        services: data.services.map(s => ({ service: s.service, price: Number(s.price) || 0, quantity: Number(s.quantity) || 0, total: Number(s.total) || 0 })),
        total: Number(data.total) || 0,
        netPayable: Number(data.netPayable) || Number(data.total) || 0,
        advancePayment: Number(data.advancePayment) || 0,
      };

      let res;
      if (editingId) {
        res = await fetch(`${API_URL}/api/v1/cashbills/${editingId}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(payload) });
      } else {
        res = await fetch(`${API_URL}/api/v1/cashbills`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload) });
      }
      if (!res.ok) {
        const err = await res.json();
        alert('Failed to save bill: ' + (err.error || res.statusText));
        return;
      }
      const json = await res.json();
      alert(editingId ? 'Updated cash bill successfully' : 'Saved cash bill successfully');
      // Reset form slightly: advance patient id counter and clear services
      setData({ ...data, services: initialServices, total: '', netPayable: '', advancePayment: 0 });
      setEditingId(null);
      // after saving/updating, redirect to table page
      navigate('/details/cash-bill/table');
      return json;
    } catch (err) {
      alert('Error saving bill: ' + err.message);
    }
  };

  // Note: list fetching and table rendering are moved to `cashBillTable.jsx`.

  const editBill = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/cashbills/${id}`, { headers: getAuthHeaders() });
      if (!res.ok) return alert('Failed to load bill');
      const bill = await res.json();
      // prepopulate form
      setData({
        name: bill.name || '',
        contact: bill.contact || '',
        age: bill.age || (bill.patientId && bill.patientId.age) || '',
        admissionDate: bill.admissionDate ? formatDate(new Date(bill.admissionDate)) : formatDate(new Date()),
        place: bill.place || 'Koppal',
        patientId: bill.patientId && bill.patientId._id ? (bill.patientId.ipdNumber || '') : (bill.ipdNumber || ''),
        dischargeDate: bill.dischargeDate ? formatDate(new Date(bill.dischargeDate)) : formatDate(new Date()),
        services: (bill.services && bill.services.length) ? bill.services.map((s, i) => ({ no: i + 1, service: s.service || '', price: s.price || '', quantity: s.quantity || '', total: s.total || '' })) : initialServices,
        total: bill.total || 0,
        advancePayment: bill.advancePayment || 0,
        netPayable: bill.netPayable || (bill.total - (bill.advancePayment || 0)) || 0,
        ipdNumber: bill.ipdNumber || '',
      });
      setEditingId(id);
    } catch (err) {
      alert('Error loading bill: ' + err.message);
    }
  };

  // note: delete is handled from the table view in `cashBillTable.jsx`.



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
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
    
            doc.html(billContent, {
              x: 10,
              y: pageHeight / 2,
              callback: () => {
                noPrintElements.forEach((el) => {
                  el.style.display = '';
                });
                doc.save('Hosp-Mallikarjun-87.pdf');
              },
              width:  pageWidth - 20,
              windowWidth:  pageWidth,
            });
          },
          x: 10,
          y: 10,
          width: doc.internal.pageSize.width - 20,
          windowWidth: doc.internal.pageSize.width,
        });
    
        const newPatientId = patientIdCounter + 1;
        setPatientIdCounter(newPatientId);
        localStorage.setItem('patientIdCounter', newPatientId.toString());
    
        setData({ ...data, patientId: newPatientId });
      };

  return (
    <div>
      <div id="bill" className="w-full items-center">
        <Header />
        <div className="flex flex-col space-y-5 px-2">
          <h2 className="font-bold text-lg text-center">Hospital Cash Bill</h2>
          {/* Saved bills list moved to `cashBillTable.jsx` */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[ 
              { label: 'Name', field: 'name', PlaceHolder: 'Enter The Name' },
              { label: 'Contact', field: 'contact', PlaceHolder: 'Enter Contact Number' },
              { label: 'Age', field: 'age', PlaceHolder: 'Enter The Age' },
              { label: 'Date of Admission', field: 'admissionDate', PlaceHolder: 'Enter The admissionDate' },
              { label: 'Place', field: 'place' },
              { label: 'Patient ID', field: 'patientId', PlaceHolder: 'Enter The patientId', value: data.patientId || patientIdCounter },
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
          <table className="w-full mt-6 text-left border border-gray-300">
            <thead className="bg-sky-700">
              <tr>
                <th className="p-2 border text-white">No</th>
                <th className="p-2 border text-white">Service Provided</th>
                <th className="p-2 border text-white">Price</th>
                <th className="p-2 border text-white">Quantity Days</th>
                <th className="p-2 border text-white">Total (Rupees)</th>
              </tr>
            </thead>
            <tbody>
              {data.services.map((service, index) => (
                <tr key={service.no}>
                  <td className="p-2 border">{service.no}</td>
                  <td className="p-2 border">
                    <input
                      type="text"
                      value={service.service}
                      onChange={(e) => {
                        const updated = [...data.services];
                        updated[index].service = e.target.value;
                        setData({ ...data, services: updated });
                      }}
                      className="w-full p-1 border-gray-300 rounded"
                    />
                  </td>
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
                    <input type="text" value={service.total} readOnly className="w-full p-1" />
                  </td>
                  <td className="p-2 border">
                    <button aria-label={`Remove row ${index + 1}`} title="Remove" className="px-2 py-1 bg-red-500 text-white rounded" onClick={() => removeRow(index)}>×</button>
                  </td>
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
                type="number"
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
          <div className="flex justify-center space-x-2 mt-4 no-print">
            <button 
              onClick={handleGoBack}
              className="px-6 py-2 bg-blue-500 rounded hover:bg-blue-600"
            >
              Back
            </button>

            <button 
              onClick={generatePDF}
              className="px-6 py-2 bg-blue-500 rounded hover:bg-blue-600"
            >
              Download PDF
            </button>

            <button className="px-4 py-2 bg-green-500 text-white rounded" onClick={addRow}>Add Row</button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={saveBill}>{editingId ? 'Update Bill' : 'Save Bill'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cashbill;
