import React, { useState } from 'react';
import Header from '../common/header';
import { getAuthHeaders } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const AddLabTest = () => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  
  const navigate = useNavigate();

  const save = async () => {
    if (!code || !name) return alert('Code and name required');
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8889'}/api/v1/labtests`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ code, name, price: Number(price) || 0 }) });
      if (!res.ok) { const e = await res.json(); return alert('Failed: ' + (e.error || res.statusText)); }
      alert('Saved');
      navigate('/details/lab-bill/table');
    } catch (err) { alert('Error: ' + err.message); }
  };

  return (
    <div>
      <Header />
      <div className="p-4 max-w-md mx-auto">
        <h2 className="font-bold text-lg mb-4">Add Lab Test</h2>
        <div className="flex flex-col space-y-2">
          <input placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} className="p-2 border" />
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="p-2 border" />
          <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} className="p-2 border" />
          <div className="flex space-x-2 mt-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={save}>Save</button>
            <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => navigate(-1)}>Back</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddLabTest;
