import React, { useState, useEffect } from 'react';
import { generateBillPDF } from '../utils/pdfGenerator';
import 'tailwindcss/tailwind.css';
import Header from '../common/header';
import { useNavigate, useLocation } from "react-router-dom";
import { getAuthHeaders, getApiBaseUrl } from '../utils/api';

const Labdiagonstics = () => {
  const API_URL = getApiBaseUrl();
  const [data, setData] = useState({
    name: '',
    contact: '',
    age: '',
    admissionDate: new Date().toLocaleDateString(),
    place: 'Koppal',
    ipdNumber: '',
    dischargeDate: new Date().toLocaleDateString(),
    services: [{ no: 1, service: '', price: '', quantity: '', cgst: 0, sgst: 0, total: '', testCode: '', testName: '' }],
    total: '',
    totalCgst: 0,
    totalSgst: 0,
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
        const res = await fetch(`${API_URL}/api/v1/labtests`, { headers: getAuthHeaders() });
        if (!res.ok) return;
        const list = await res.json();
        setTests(list || []);
      } catch (err) { }
    };
    fetchTests();
  }, [API_URL]);

  const loadBill = React.useCallback(async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/labbills/${id}`, { headers: getAuthHeaders() });
      if (!res.ok) return;
      const bill = await res.json();
      const patientResp = bill.contact ? await fetch(`${API_URL}/api/v1/patients/filter?contact=${encodeURIComponent(bill.contact)}`, { headers: getAuthHeaders() }) : null;
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
          service: s.service || '',
          testId: s.testId || undefined,
          price: s.price || '',
          quantity: s.quantity || '',
          cgst: s.cgst || s.gst || 0,
          sgst: s.sgst || 0,
          total: s.total || '',
          testCode: s.testCode || '',
          testName: s.testName || ''
        })) : [{ no: 1, service: '', price: '', quantity: '', cgst: 0, sgst: 0, total: '', testCode: '', testName: '' }],
        total: bill.total || 0,
        totalCgst: (bill.services || []).reduce((sum, s) => sum + (s.cgst || s.gst || 0), 0),
        totalSgst: (bill.services || []).reduce((sum, s) => sum + (s.sgst || 0), 0),
        advancePayment: bill.advancePayment || 0,
        netPayable: bill.netPayable || 0,
      });
    } catch (err) { }
  }, [API_URL]);

  useEffect(() => {
    if (location?.state?.editId) {
      loadBill(location.state.editId);
    }
  }, [location, loadBill]);

  // when contact changes, try to auto-fill patient details (debounced)
  useEffect(() => {
    const val = data.contact;
    if (!val) return;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/patients/filter?contact=${encodeURIComponent(val)}`, { headers: getAuthHeaders() });
        if (!res.ok) return;
        const p = await res.json();
        if (p) setData(prev => ({ ...prev, name: p.name || prev.name, age: p.age || prev.age, ipdNumber: p.ipdNumber || prev.ipdNumber }));
      } catch (e) { /* ignore */ }
    }, 400);
    return () => clearTimeout(t);
  }, [data.contact, API_URL]);

  const handleInputChange = (field, value) => {
    setData({ ...data, [field]: value });
  };

  const handleServiceChange = (index, field, value) => {
    const updatedServices = [...data.services];
    updatedServices[index][field] = value;

    if (field === 'price' || field === 'quantity' || field === 'cgst' || field === 'sgst') {
      const price = parseFloat(updatedServices[index].price) || 0;
      const quantity = parseInt(updatedServices[index].quantity) || 0;
      const cgstPct = parseFloat(updatedServices[index].cgst) || 0;
      const sgstPct = parseFloat(updatedServices[index].sgst) || 0;
      const base = price * quantity;
      const cgstAmt = base * cgstPct / 100;
      const sgstAmt = base * sgstPct / 100;
      updatedServices[index].total = base + cgstAmt + sgstAmt || 0;
    }

    const updatedTotal = updatedServices.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const updatedTotalCgst = updatedServices.reduce((sum, item) => {
      const base = (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0);
      return sum + (base * (parseFloat(item.cgst) || 0) / 100);
    }, 0);
    const updatedTotalSgst = updatedServices.reduce((sum, item) => {
      const base = (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0);
      return sum + (base * (parseFloat(item.sgst) || 0) / 100);
    }, 0);
    setData({ ...data, services: updatedServices, total: updatedTotal, totalCgst: updatedTotalCgst, totalSgst: updatedTotalSgst, netPayable: updatedTotal });
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
      updatedServices[index].cgst = 0;
      updatedServices[index].sgst = 0;
      updatedServices[index].total = (Number(updatedServices[index].price) || 0) * (Number(updatedServices[index].quantity) || 1);
      updatedServices[index].service = t._id;
    }

    const updatedTotal = updatedServices.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const updatedTotalCgst = updatedServices.reduce((sum, item) => {
      const base = (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0);
      return sum + (base * (parseFloat(item.cgst) || 0) / 100);
    }, 0);
    const updatedTotalSgst = updatedServices.reduce((sum, item) => {
      const base = (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0);
      return sum + (base * (parseFloat(item.sgst) || 0) / 100);
    }, 0);
    setData({ ...data, services: updatedServices, total: updatedTotal, totalCgst: updatedTotalCgst, totalSgst: updatedTotalSgst, netPayable: updatedTotal });
  };


  const saveBill = async () => {
    try {
      if (!data.contact || !data.name) return alert('Name and contact required');

      if (!window.confirm(isEdit ? 'Are you sure you want to update this lab bill and download the PDF?' : 'Are you sure you want to save this lab bill and download the PDF?')) {
        return;
      }

      const toISODate = (val) => {
        if (!val) return undefined;
        // if already ISO
        if (String(val).match(/^\d{4}-\d{2}-\d{2}$/)) return val;
        // convert DD/MM/YYYY to ISO YYYY-MM-DD
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
        services: data.services.filter(s => (s.service && s.service.trim() !== '') || (s.testCode && s.testCode.trim() !== '')).map(s => ({
          testId: s.testId,
          service: s.service,
          testCode: s.testCode || '',
          testName: s.testName || '',
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

      // if editing an existing bill, perform PUT
      if (location && location.state && location.state.editId) {
        const id = location.state.editId;
        const res = await fetch(`${API_URL}/api/v1/labbills/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(payload) });
        if (!res.ok) { const e = await res.json(); return alert('Failed to update: ' + (e.error || res.statusText)); }
        
        // Immediately generate and download the PDF
        await generatePDF();

        alert('Updated lab bill successfully');
        navigate('/details/lab-bill/table');
        return;
      }

      const res = await fetch(`${API_URL}/api/v1/labbills`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload) });
      if (!res.ok) { const e = await res.json(); return alert('Failed to save: ' + (e.error || res.statusText)); }

      // Immediately generate and download the PDF
      await generatePDF();

      alert('Saved lab bill successfully');
      navigate('/details/lab-bill/table');
    } catch (err) { alert('Error saving: ' + err.message); }
  };

  const isAdmin = localStorage.getItem('userType') === 'admin';
  const isEdit = !!(location && location.state && location.state.editId);
  // addByTestCode removed: selection now via per-row Test Code input with datalist

  const addNewRow = () => {
    const newRow = {
      no: data.services.length + 1,
      service: '',
      price: '',
      quantity: 1,
      cgst: 0,
      sgst: 0,
      total: '',
      testCode: '',
      testName: ''
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
      const updatedTotalGst = updatedServices.reduce((sum, item) => sum + (parseFloat(item.gst) || 0), 0);
      const updatedTotalSgst = updatedServices.reduce((sum, item) => sum + (parseFloat(item.sgst) || 0), 0);

      setData({ ...data, services: updatedServices, total: updatedTotal, totalGst: updatedTotalGst, totalSgst: updatedTotalSgst, netPayable: updatedTotal });
    }
  }

  const generatePDF = async () => {
    const validServices = data.services.filter(s => (s.service && s.service.trim() !== '') || (s.testCode && s.testCode.trim() !== ''));

    await generateBillPDF({
      title: 'Lab Cash Bill',
      fileName: 'lab-bill',
      patientFields: [
        { label: 'Name', value: data.name },
        { label: 'Contact', value: data.contact },
        { label: 'Age', value: data.age },
        { label: 'Date of Admission', value: data.admissionDate },
        { label: 'Place', value: data.place },
        { label: 'Patient ID', value: data.ipdNumber || patientIdCounter },
        { label: 'Date of Discharge', value: data.dischargeDate },
      ],
      columns: [
        { header: 'No', key: 'no', width: 12 },
        { header: 'Test Code', key: 'testCode', width: 28 },
        { header: 'Test Name', key: 'testName' },
        { header: 'Price', key: 'price', width: 22 },
        { header: 'Qty', key: 'quantity', width: 15 },
        { header: 'CGST(%)', key: 'cgst', width: 18 },
        { header: 'SGST(%)', key: 'sgst', width: 18 },
        { header: 'Total', key: 'total', width: 25 },
      ],
      rows: validServices.map(s => ({
        no: String(s.no),
        testCode: s.testCode || '',
        testName: s.testName || '',
        price: String(s.price),
        quantity: String(s.quantity),
        cgst: String(s.cgst || 0),
        sgst: String(s.sgst || 0),
        total: String(s.total),
      })),
      totals: [
        { label: 'Total CGST:', value: `Rs. ${Number(data.totalCgst || 0).toFixed(2)}` },
        { label: 'Total SGST:', value: `Rs. ${Number(data.totalSgst || 0).toFixed(2)}` },
        { label: 'Total:', value: `Rs. ${data.total || '0'}` },
        { label: 'Advance Payment:', value: data.advancePayment || 'nil' },
        { label: 'Net Amount Payable:', value: `Rs. ${data.netPayable || '0'}` },
      ],
      copies: ['PATIENT COPY', 'HOSPITAL COPY'],
    });

    const newPatientId = patientIdCounter + 1;
    setPatientIdCounter(newPatientId);
    localStorage.setItem('patientIdCounter', newPatientId.toString());

    setData({ ...data, ipdNumber: newPatientId });
  };

  const navigate = useNavigate();
  const handleGoBack = (event) => {
    navigate('/details/lab-bill/table');
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
                <th className="p-2 border text-white">Price</th>
                <th className="p-2 border text-white">Qty</th>
                <th className="p-2 border text-white">CGST (%)</th>
                <th className="p-2 border text-white">SGST (%)</th>
                <th className="p-2 border text-white">Total</th>
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
                  <td className="p-2 border">
                    <input type="number" value={service.price} onChange={(e) => handleServiceChange(index, 'price', e.target.value)} className="w-full p-1 border-gray-300 rounded" />
                  </td>
                  <td className="p-2 border">
                    <input type="number" value={service.quantity} onChange={(e) => handleServiceChange(index, 'quantity', e.target.value)} className="w-full p-1 border-gray-300 rounded" />
                  </td>
                  <td className="p-2 border">
                    <input type="number" value={service.cgst} onChange={(e) => handleServiceChange(index, 'cgst', e.target.value)} className="w-full p-1 border-gray-300 rounded" />
                  </td>
                  <td className="p-2 border">
                    <input type="number" value={service.sgst} onChange={(e) => handleServiceChange(index, 'sgst', e.target.value)} className="w-full p-1 border-gray-300 rounded" />
                  </td>
                  <td className="p-2 border">{formatCurrency(service.total || 0)}</td>
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

export default Labdiagonstics;
