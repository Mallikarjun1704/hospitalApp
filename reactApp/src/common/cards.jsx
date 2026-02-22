import React, { useState, useEffect } from "react";
import { getAuthHeaders } from "../utils/api";
import { Link } from "react-router-dom";
import GroupsIcon from "@mui/icons-material/Groups";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import LocalPharmacyIcon from "@mui/icons-material/LocalPharmacy";
import ScienceIcon from "@mui/icons-material/Science";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";

const Card = () => {
  const [selectedCard, setSelectedCard] = useState(null);

  const cards = [
    {
      id: 1,
      title: "Patient Detail",
      // larger card
      sizeClass: "w-56 sm:w-56 md:w-60 lg:w-64",
      // count will be replaced dynamically with yearTotalPatients when available
      count: 0,
      bgColor: "#4795e8",
      borderColor: "#2e83dd",
      link: "/details/patient-details",
    },
    {
      id: 6,
      title: "Medicine Inventory",
      // medium card
      sizeClass: "w-56 sm:w-56 md:w-60 lg:w-64",
      count: 0,
      bgColor: "#ff9f43",
      borderColor: "#ff9f43",
      link: "/medicine-inventory",
    },
    {
      id: 2,
      title: "Hospital Cash Bill",
      // small card
      sizeClass: "w-56 sm:w-56 md:w-60 lg:w-64",
      count: 57,
      bgColor: "#673b77ff",
      borderColor: "#2eddb1ff",
      // open the table listing when clicking the card
      link: "/details/cash-bill/table",
    },
    {
      id: 3,
      title: "Pharmacy Bill",
      sizeClass: "w-56 sm:w-56 md:w-60 lg:w-64",
      count: 9,
      bgColor: "#edc651",
      borderColor: "#ffc107",
      link: "/details/medical-bill/table",
    },
    {
      id: 4,
      title: "LAB Bill",
      sizeClass: "w-56 sm:w-56 md:w-60 lg:w-64",
      count: 2,
      bgColor: "#4abe65",
      borderColor: "#28a745",
      link: "/details/lab-bill/table",
    },
    {
      id: 5,
      title: "Discharge Form",
      sizeClass: "w-56 sm:w-56 md:w-60 lg:w-64",
      count: 3,
      bgColor: "#7fd8f8",
      borderColor: "#7fd8f8",
      link: "/details/discharge-form",
    },
  ];

  const [revenue, setRevenue] = useState({ daily: 0, monthly: 0, yearly: 0 });
  const [counts, setCounts] = useState({ daily: 0, monthly: 0, yearly: 0 });
  const [yearTotalPatients, setYearTotalPatients] = useState(0);
  const [dailyDetails, setDailyDetails] = useState({ totalAmount: 0, count: 0, patients: [], dailyStart: null });
  const [pharmacyRevenue, setPharmacyRevenue] = useState({ daily: 0, monthly: 0, yearly: 0, total: 0 });
  const [pharmacyDailyDetails, setPharmacyDailyDetails] = useState({ totalAmount: 0, count: 0, items: [] });
  const [medicalRevenue, setMedicalRevenue] = useState({ daily: 0, monthly: 0, yearly: 0, total: 0 });
  const [medicalDailyDetails, setMedicalDailyDetails] = useState({ totalAmount: 0, count: 0, items: [] });
  const [cashRevenue, setCashRevenue] = useState({ daily: 0, monthly: 0, yearly: 0, total: 0 });
  const [cashDailyDetails, setCashDailyDetails] = useState({ totalAmount: 0, count: 0, items: [] });
  const [labRevenue, setLabRevenue] = useState({ daily: 0, monthly: 0, yearly: 0, total: 0 });
  const [labDailyDetails, setLabDailyDetails] = useState({ totalAmount: 0, count: 0, items: [] });
  const [medicineStats, setMedicineStats] = useState({ totalStock: 0, lowStockCount: 0, lowStockItems: [], totalValue: 0 });
  const [showDailyModal, setShowDailyModal] = useState(false);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8889";

  // Ensure pharmacy revenue is available early (pre-populate on mount)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/sale/sales/revenue`, { headers: getAuthHeaders() });
        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          console.error('Failed to prefetch pharmacy sales:', res.status, txt);
          return;
        }
        const data = await res.json();
        if (data.revenue) setPharmacyRevenue({ daily: data.revenue.daily || 0, monthly: data.revenue.monthly || 0, yearly: data.revenue.yearly || 0, total: data.revenue.total || 0 });
        if (data.dailyDetails) setPharmacyDailyDetails({ totalAmount: data.dailyDetails.totalAmount || 0, count: data.dailyDetails.count || 0, items: data.dailyDetails.items || [] });
      } catch (err) {
        console.error('Error prefetching pharmacy sales', err);
      }
    })();
  }, [API_URL]);

  const formatCurrency = (value) => {
    try {
      return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value || 0);
    } catch (err) {
      return (value || 0).toString();
    }
  };

  useEffect(() => {
    // when the Patient Detail card is selected, fetch revenue totals
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/patients/stats`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data = await res.json();
        if (data.revenue) setRevenue({ daily: data.revenue.daily || 0, monthly: data.revenue.monthly || 0, yearly: data.revenue.yearly || 0 });
        if (data.counts) setCounts({ daily: data.counts.daily || 0, monthly: data.counts.monthly || 0, yearly: data.counts.yearly || 0 });
        if (data.dailyDetails) setDailyDetails({ totalAmount: data.dailyDetails.totalAmount || 0, count: data.dailyDetails.count || 0, patients: data.dailyDetails.patients || [], dailyStart: data.dailyDetails.dailyStart || null });
        if (typeof data.yearlyTotalPatients === "number") setYearTotalPatients(data.yearlyTotalPatients);
      } catch (err) {
        console.error("Could not fetch stats", err);
      }
    };

    const fetchSales = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/sale/sales/revenue`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Failed to fetch sales');
        const data = await res.json();
        if (data.revenue) setPharmacyRevenue({ daily: data.revenue.daily || 0, monthly: data.revenue.monthly || 0, yearly: data.revenue.yearly || 0, total: data.revenue.total || 0 });
        if (data.dailyDetails) setPharmacyDailyDetails({ totalAmount: data.dailyDetails.totalAmount || 0, count: data.dailyDetails.count || 0, items: data.dailyDetails.items || [] });
      } catch (err) { console.error('Could not fetch sales', err); }
    };

    const fetchPharmaSales = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/medicalbills/revenue/stats`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Failed to fetch sales');
        const data = await res.json();
        if (data.revenue) setMedicalRevenue({ daily: data.revenue.daily || 0, monthly: data.revenue.monthly || 0, yearly: data.revenue.yearly || 0, total: data.revenue.total || 0 });
        if (data.dailyDetails) setMedicalDailyDetails({ totalAmount: data.dailyDetails.totalAmount || 0, count: data.dailyDetails.count || 0, items: data.dailyDetails.items || [] });
      } catch (err) { console.error('Could not fetch sales', err); }
    };

    const fetchCashRevenue = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/cashbills/revenue/stats`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Failed to fetch cash revenue');
        const data = await res.json();
        if (data.revenue) setCashRevenue({ daily: data.revenue.daily || 0, monthly: data.revenue.monthly || 0, yearly: data.revenue.yearly || 0, total: data.revenue.total || 0 });
        if (data.dailyDetails) setCashDailyDetails({ totalAmount: data.dailyDetails.totalAmount || 0, count: data.dailyDetails.count || 0, items: data.dailyDetails.items || [] });
      } catch (err) { console.error('Could not fetch cash revenue', err); }
    };

    const fetchLabRevenue = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/labbills/revenue/stats`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Failed to fetch lab revenue');
        const data = await res.json();
        if (data.revenue) setLabRevenue({ daily: data.revenue.daily || 0, monthly: data.revenue.monthly || 0, yearly: data.revenue.yearly || 0, total: data.revenue.total || 0 });
        if (data.dailyDetails) setLabDailyDetails({ totalAmount: data.dailyDetails.totalAmount || 0, count: data.dailyDetails.count || 0, items: data.dailyDetails.items || [] });
      } catch (err) { console.error('Could not fetch lab revenue', err); }
    };

    if (selectedCard) {
      if (selectedCard.title === "Patient Detail") fetchStats();
      if (selectedCard.title === "Hospital Cash Bill") fetchCashRevenue();
      if (selectedCard.title === "Pharmacy Bill") fetchPharmaSales();
      if (selectedCard.title === "Medicine Inventory") fetchSales();
      // when Medicine Inventory is selected, fetch medicine stock data
      if (selectedCard.title === 'Medicine Inventory') {
        (async () => {
          try {
            const mres = await fetch(`${API_URL}/api/v1/medicine/medicines`, { headers: getAuthHeaders() });
            if (!mres.ok) {
              const txt = await mres.text().catch(() => '');
              console.error('Failed to fetch medicines for stats', mres.status, txt);
            } else {
              const meds = await mres.json();
              const totalStock = (meds || []).reduce((sum, m) => sum + (Number(m.stock) || 0), 0);
              const totalValue = (meds || []).reduce((sum, m) => sum + ((Number(m.stock) || 0) * (Number(m.salePrice) || 0)), 0);
              const lowStockItems = (meds || []).filter(m => (Number(m.stock) || 0) <= 10);
              setMedicineStats({ totalStock, lowStockCount: lowStockItems.length, lowStockItems, totalValue });
            }
          } catch (err) { console.error('Error fetching medicine stats', err); }
        })();
      }
      if (selectedCard.title === "LAB Bill") fetchLabRevenue();
    }
  }, [selectedCard, API_URL]);

  const handleInputChange = (cardValue) => {
    setSelectedCard(cardValue);
  };

  const getIcon = (title) => {
    switch (title) {
      case "Patient Detail":
        return <GroupsIcon fontSize="large" sx={{ color: "white" }} />;
      case "Hospital Cash Bill":
        return <ReceiptLongIcon fontSize="large" sx={{ color: "white" }} />;
      case "Pharmacy Bill":
        return <LocalPharmacyIcon fontSize="large" sx={{ color: "white" }} />;
      case "LAB Bill":
        return <ScienceIcon fontSize="large" sx={{ color: "white" }} />;
      case "Discharge Form":
        return <AssignmentTurnedInIcon fontSize="large" sx={{ color: "white" }} />;
      case "Medicine Inventory":
        return <Inventory2Icon fontSize="large" sx={{ color: "white" }} />;
      default:
        return <LocalHospitalIcon fontSize="large" sx={{ color: "white" }} />;
    }
  };

  return (
    <div className="flex flex-col p-8 gap-6">
      {/* Row of Cards */}
      <div className="flex flex-row gap-6">
        {cards.map((card) => (
          <div
            key={card.id}
            className={`flex flex-col items-center bg-white border rounded-lg shadow-md text-black relative overflow-hidden cursor-pointer ${card.sizeClass} hover:scale-105 active:scale-95 transition-all duration-150`}
            style={{ borderColor: card.borderColor }}
            onClick={() => handleInputChange(card)}
          >
            {/* colored header */}
            <div className="absolute top-0 left-0 right-0 h-20" style={{ backgroundColor: card.bgColor }}></div>

            {/* content - push down to avoid overlap with header */}
            <div className="w-full pt-20 pb-4 px-3 flex flex-col items-center z-10">
              <div className="flex items-center w-full justify-between">
                <div className="flex items-center space-x-3">
                  {getIcon(card.title)}
                  <h1 className="text-xl font-bold text-white">{card.title === "Patient Detail" ? yearTotalPatients : card.count}</h1>
                </div>
              </div>
              <h3 className="text-sm mt-3 z-10 text-gray-800 text-center w-full">{card.title}</h3>
              <Link to={card.link} className="text-sm mt-2 text-blue-500 cursor-pointer">View details</Link>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Card */}
      <div className="w-full flex justify-center mt-6">
        {selectedCard && selectedCard.title !== "Discharge Form" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl px-4">
            {['Daily', 'Monthly', 'Yearly'].map((label) => {
              const isPatient = selectedCard.title === 'Patient Detail';
              // choose correct revenue source depending on selected card
              const revenueSource = isPatient
                ? revenue
                : selectedCard.title === 'Hospital Cash Bill'
                  ? cashRevenue
                  : selectedCard.title === 'LAB Bill'
                    ? labRevenue
                    : selectedCard.title === 'Pharmacy Bill'
                      ? medicalRevenue
                      : pharmacyRevenue;

              const amount = label === 'Daily' ? revenueSource.daily : label === 'Monthly' ? revenueSource.monthly : revenueSource.yearly;

              // choose correct count / daily details depending on selected card
              let count = 0;
              if (isPatient) {
                count = label === 'Daily' ? (dailyDetails.count || counts.daily) : label === 'Monthly' ? counts.monthly : counts.yearly;
              } else if (selectedCard.title === 'Pharmacy Bill') {
                count = label === 'Daily' ? (medicalDailyDetails.count || 0) : (label === 'Monthly' ? medicalRevenue.monthlyCount : medicalRevenue.yearlyCount);
              } else if (selectedCard.title === 'Medicine Inventory') {
                count = label === 'Daily' ? (pharmacyDailyDetails.count || 0) : (label === 'Monthly' ? pharmacyRevenue.monthlyCount : pharmacyRevenue.yearlyCount);
              } else if (selectedCard.title === 'Hospital Cash Bill') {
                count = label === 'Daily' ? (cashDailyDetails.count || 0) : (label === 'Monthly' ? cashRevenue.monthlyCount : cashRevenue.yearlyCount);
              } else if (selectedCard.title === 'LAB Bill') {
                count = label === 'Daily' ? (labDailyDetails.count || 0) : (label === 'Monthly' ? labRevenue.monthlyCount : labRevenue.yearlyCount);
              }
              // determine subtitle text depending on selected card
              let subText = '';
              if (selectedCard.title === 'Medicine Inventory') {
                subText = `Stock: ${medicineStats.totalStock || 0} (Low: ${medicineStats.lowStockCount || 0})`;
              } else if (selectedCard.title === 'Pharmacy Bill') {
                subText = label === 'Daily' ? `Bills: ${medicalDailyDetails.count || 0}` : `Bills: -`;
              } else if (isPatient) {
                subText = `Patients: ${count}`;
              } else if (selectedCard.title === 'Hospital Cash Bill') {
                subText = `Bills: ${count}`;
              } else if (selectedCard.title === 'LAB Bill') {
                subText = `Tests: ${count}`;
              }
              return (
                <div
                  key={label}
                  className={`bg-white rounded-lg shadow hover:shadow-lg transition-all duration-150 cursor-pointer overflow-hidden border-b-4 btn-tactile ${label === 'Daily' ? 'border-blue-500 active:scale-95' :
                      label === 'Monthly' ? 'border-emerald-500 active:scale-95' :
                        'border-purple-500 active:scale-95'
                    }`}
                  onClick={() => {
                    if (label !== 'Daily') return;
                    // Open daily modal only when there's data for the selected card
                    if (selectedCard.title === 'Patient Detail' && dailyDetails && dailyDetails.patients && dailyDetails.patients.length) setShowDailyModal(true);
                    else if (selectedCard.title === 'Pharmacy Bill' && medicalDailyDetails && medicalDailyDetails.items && medicalDailyDetails.items.length) setShowDailyModal(true);
                    else if (selectedCard.title === 'Medicine Inventory' && ((medicineStats && medicineStats.lowStockItems && medicineStats.lowStockItems.length) || (pharmacyDailyDetails && pharmacyDailyDetails.items && pharmacyDailyDetails.items.length))) setShowDailyModal(true);
                    else if (selectedCard.title === 'Hospital Cash Bill' && cashDailyDetails && cashDailyDetails.items && cashDailyDetails.items.length) setShowDailyModal(true);
                    else if (selectedCard.title === 'LAB Bill' && labDailyDetails && labDailyDetails.items && labDailyDetails.items.length) setShowDailyModal(true);
                  }}
                >
                  <div className="flex flex-col items-center justify-center p-4">
                    <p className={`text-xl font-bold ${label === 'Daily' ? 'text-blue-600' : label === 'Monthly' ? 'text-emerald-600' : 'text-purple-600'}`}>{formatCurrency(amount)}</p>
                    <div className="text-gray-500 text-sm mt-1">{subText}</div>
                  </div>
                  <div className={`text-center py-2 text-white text-xs font-semibold ${label === 'Daily' ? 'bg-blue-500' : label === 'Monthly' ? 'bg-emerald-500' : 'bg-purple-500'}`}>
                    {label.toUpperCase()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Daily modal */}
      {showDailyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-11/12 md:w-3/4 lg:w-1/2 p-6 rounded shadow-lg">
            <div className="flex justify-between items-center mb-4">
              {selectedCard && selectedCard.title === 'Patient Detail' ? (
                <h3 className="text-lg font-semibold">Today's Patients ({dailyDetails.count}) - {formatCurrency(dailyDetails.totalAmount)}</h3>
              ) : selectedCard && selectedCard.title === 'Pharmacy Bill' ? (
                <h3 className="text-lg font-semibold">Today's Medical Bills ({medicalDailyDetails.count}) - {formatCurrency(medicalDailyDetails.totalAmount)}</h3>
              ) : selectedCard && selectedCard.title === 'Hospital Cash Bill' ? (
                <h3 className="text-lg font-semibold">Today's Cash Bills ({cashDailyDetails.count}) - {formatCurrency(cashDailyDetails.totalAmount)}</h3>
              ) : selectedCard && selectedCard.title === 'LAB Bill' ? (
                <h3 className="text-lg font-semibold">Today's Lab Bills ({labDailyDetails.count}) - {formatCurrency(labDailyDetails.totalAmount)}</h3>
              ) : selectedCard && selectedCard.title === 'Medicine Inventory' ? (
                <h3 className="text-lg font-semibold">Medicine Inventory - Low Stock ({medicineStats.lowStockCount}) - Total Stock: {medicineStats.totalStock}</h3>
              ) : null}
              <button className="px-4 py-1 bg-red-500 text-white rounded btn-tactile hover:bg-red-600" onClick={() => setShowDailyModal(false)}>Close</button>
            </div>
            <div className="overflow-auto max-h-80">
              {selectedCard && selectedCard.title === 'Patient Detail' ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b"><th className="pb-2">Time</th><th className="pb-2">Name</th><th className="pb-2">IPD</th><th className="pb-2">Contact</th><th className="pb-2">Amount</th></tr>
                  </thead>
                  <tbody>
                    {dailyDetails.patients.map((p) => (
                      <tr key={p._id || `${p.ipdNumber}-${p.date}`} className="border-b">
                        <td className="py-2">{new Date(p.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="py-2">{p.name}</td>
                        <td className="py-2">{p.ipdNumber}</td>
                        <td className="py-2">{p.contact}</td>
                        <td className="py-2">{formatCurrency(p.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : selectedCard && selectedCard.title === 'Pharmacy Bill' ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b"><th className="pb-2">Time</th><th className="pb-2">Patient Name</th><th className="pb-2">Contact</th><th className="pb-2">Amount</th></tr>
                  </thead>
                  <tbody>
                    {medicalDailyDetails.items.map((it, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="py-2">{new Date(it.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="py-2">{it.name}</td>
                        <td className="py-2">{it.contact}</td>
                        <td className="py-2">{formatCurrency(it.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : selectedCard && selectedCard.title === 'Medicine Inventory' ? (
                <div>
                  {/* Show today's pharmacy sales if present */}
                  {pharmacyDailyDetails && pharmacyDailyDetails.items && pharmacyDailyDetails.items.length ? (
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Today's Pharmacy Sales</h4>
                      <table className="w-full text-sm mb-4">
                        <thead>
                          <tr className="text-left border-b"><th className="pb-2">Time</th><th className="pb-2">Code</th><th className="pb-2">Name</th><th className="pb-2">Qty</th><th className="pb-2">Unit Price</th><th className="pb-2">Amount</th></tr>
                        </thead>
                        <tbody>
                          {pharmacyDailyDetails.items.map((it, idx) => (
                            <tr key={`${it.medicineId}-${idx}`} className="border-b">
                              <td className="py-2">{new Date(it.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                              <td className="py-2">{it.uniqueCode}</td>
                              <td className="py-2">{it.name}</td>
                              <td className="py-2">{it.quantity}</td>
                              <td className="py-2">{formatCurrency(it.unitPrice)}</td>
                              <td className="py-2">{formatCurrency(it.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}

                  {/* Show low stock items */}
                  <h4 className="font-semibold mb-2">Low Stock Items ({medicineStats.lowStockCount})</h4>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b"><th className="pb-2">Code</th><th className="pb-2">Name</th><th className="pb-2">Stock</th><th className="pb-2">Sale Price</th><th className="pb-2">Value</th></tr>
                    </thead>
                    <tbody>
                      {(medicineStats.lowStockItems || []).map((m, i) => (
                        <tr key={m._id || `${m.code}-${i}`} className="border-b">
                          <td className="py-2">{m.code}</td>
                          <td className="py-2">{m.name}</td>
                          <td className="py-2">{m.stock}</td>
                          <td className="py-2">{formatCurrency(m.salePrice)}</td>
                          <td className="py-2">{formatCurrency((Number(m.stock) || 0) * (Number(m.salePrice) || 0))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : selectedCard && selectedCard.title === 'Hospital Cash Bill' ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b"><th className="pb-2">Time</th><th className="pb-2">Name</th><th className="pb-2">Contact</th><th className="pb-2">Amount</th></tr>
                  </thead>
                  <tbody>
                    {cashDailyDetails.items.map((p, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-2">{new Date(p.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="py-2">{p.name}</td>
                        <td className="py-2">{p.contact}</td>
                        <td className="py-2">{formatCurrency(p.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : selectedCard && selectedCard.title === 'LAB Bill' ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b"><th className="pb-2">Time</th><th className="pb-2">Name</th><th className="pb-2">Contact</th><th className="pb-2">Amount</th></tr>
                  </thead>
                  <tbody>
                    {labDailyDetails.items.map((p, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-2">{new Date(p.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="py-2">{p.name}</td>
                        <td className="py-2">{p.contact}</td>
                        <td className="py-2">{formatCurrency(p.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Card;
