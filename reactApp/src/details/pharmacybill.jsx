import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import 'tailwindcss/tailwind.css';
import Header from '../common/header';
import { getAuthHeaders } from '../utils/api';
import { useNavigate } from "react-router-dom";

const Medical = () => {
  const [data, setData] = useState({
    name: '',
    contact: '',
    age: '',
    admissionDate: new Date().toLocaleDateString(),
    place: 'Koppal',
    ipdNumber: '',
    dischargeDate: new Date().toLocaleDateString(),
    services: [
      { no: 1, service: 'Consultation', price: 150, quantity: 1, cgst: 0, sgst: 0, total: 150 },
    ],
    total: '',
    totalCgst: 0,
    totalSgst: 0,
    advancePayment: 'nil',
    netPayable: '',
  });

  const [patientIdCounter, setPatientIdCounter] = useState(1);
  const [medicines, setMedicines] = useState([]);
  const isAdmin = localStorage.getItem('userType') === 'admin';
  const isEdit = false; // Pharmacy bill currently doesn't support editing existing bills

  useEffect(() => {
    const storedCounter = localStorage.getItem('patientIdCounter');
    if (storedCounter) {
      setPatientIdCounter(Number(storedCounter));
    }
    // fetch medicines (use explicit /medicines endpoint)
    const fetchMeds = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8889'}/api/v1/medicine/medicines`, { headers: getAuthHeaders() });
        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          console.error('Failed fetching medicines (pharmacy):', res.status, txt);
          return;
        }
        const list = await res.json();
        setMedicines(list || []);
      } catch (e) { console.error('Error fetching medicines (pharmacy)', e); }
    };
    fetchMeds();
  }, []);

  const handleInputChange = (field, value) => {
    setData({ ...data, [field]: value });
  };

  const handleServiceChange = (index, field, value) => {
    const updatedServices = [...data.services];
    updatedServices[index][field] = value;

    if (field === 'price' || field === 'quantity' || field === 'cgst' || field === 'sgst') {
      const price = parseFloat(updatedServices[index].price) || 0;
      const quantity = parseInt(updatedServices[index].quantity) || 0;
      const cgst = parseFloat(updatedServices[index].cgst) || 0;
      const sgst = parseFloat(updatedServices[index].sgst) || 0;
      updatedServices[index].total = (price * quantity) + cgst + sgst || 0;
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

  const handleSelectByCode = (index, val) => {
    const updatedServices = [...data.services];
    updatedServices[index].uniqueCode = val;
    const med = medicines.find(m => m.code === val || m.name === val || `${m.code} - ${m.name}` === val);
    if (med) {
      updatedServices[index].medicineId = med._id;
      updatedServices[index].service = med._id;
      updatedServices[index].name = med.name || '';
      updatedServices[index].price = med.salePrice || med.purchasePrice || 0;
      updatedServices[index].quantity = updatedServices[index].quantity || 1;
      updatedServices[index].total = (Number(updatedServices[index].price) || 0) * (Number(updatedServices[index].quantity) || 1);
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

  const saveBill = async () => {
    try {
      if (!data.name) return alert('Name is required');

      // First create a Sale to register pharmacy sale and decrement stock
      const items = data.services.map(s => ({ medicineId: s.medicineId, quantity: Number(s.quantity) || 0, unitPrice: Number(s.price) || 0 }));
      const saleRes = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8889'}/api/v1/sale/sales`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ items }) });
      if (!saleRes.ok) { const e = await saleRes.json(); return alert('Failed to record sale: ' + (e.error || e.message || saleRes.statusText)); }

      // Then create a medical bill record but skip stock decrement there (since sale already decremented)
      const payload = {
        contact: data.contact,
        name: data.name,
        ipdNumber: data.ipdNumber,
        admissionDate: data.admissionDate,
        dischargeDate: data.dischargeDate,
        services: data.services.map(s => ({
          medicineId: s.medicineId,
          service: s.service,
          uniqueCode: s.uniqueCode || '',
          name: s.name || '',
          price: Number(s.price) || 0,
          quantity: Number(s.quantity) || 0,
          cgst: Number(s.cgst) || 0,
          sgst: Number(s.sgst) || 0,
          total: Number(s.total) || 0
        })),
        total: Number(data.total) || 0,
        netPayable: Number(data.netPayable) || Number(data.total) || 0,
        advancePayment: Number(data.advancePayment) || 0,
        skipStock: true
      };

      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8889'}/api/v1/medicalbills`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload) });
      if (!res.ok) { const e = await res.json(); return alert('Failed to save bill: ' + (e.error || e.message || res.statusText)); }
      alert('Saved pharmacy bill and sale');
      // navigate to medical bill table for records
      window.location.href = '/details/medical-bill/table';
    } catch (err) { alert('Error saving: ' + err.message); }
  };

  const addNewRow = () => {
    const newRow = {
      no: data.services.length + 1,
      service: '',
      price: '',
      quantity: '',
      total: '',
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
            doc.save('Medi-Mallikarjun-92.pdf');
          },
          width: pageWidth - 20,
          windowWidth: pageWidth,
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
          <h2 className="font-bold text-lg text-center">Cash Bill</h2>
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
          <table className="w-full mt-6 text-left border border-gray-300">
            <thead className="bg-sky-700">
              <tr>
                <th className="p-2 border text-white">No</th>
                <th className="p-2 border text-white">Unique Code</th>
                <th className="p-2 border text-white">Name</th>
                <th className="p-2 border text-white">Price</th>
                <th className="p-2 border text-white">Quantity</th>
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
                      list="pharm-med-list"
                      placeholder="Type code or name"
                      value={service.uniqueCode || ''}
                      onChange={(e) => handleSelectByCode(index, e.target.value)}
                      className="w-full p-1 border-gray-300 rounded"
                    />
                    <datalist id="pharm-med-list">
                      {medicines.map(m => (<option key={m._id} value={`${m.code} - ${m.name}`}>{`${m.code} - ${m.name}`}</option>))}
                    </datalist>
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
          onClick={saveBill}
          className="px-10 py-2 bg-blue-600 text-white rounded btn-tactile hover:bg-blue-700 font-bold shadow-lg no-print ml-4"
        >
          Save Bill
        </button>
        <button
          onClick={handleGoBack}
          className="px-8 py-2 bg-slate-500 text-white rounded btn-tactile hover:bg-slate-600 font-medium shadow-md no-print ml-4"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default Medical;
