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
      title: "IPD Detail",
      sizeClass: "w-44 sm:w-48 md:w-52 lg:w-56",
      count: 0,
      gradient: "from-[#049746] to-teal-800",
      link: "/details/ipd-patients",
    },
    {
      id: 7,
      title: "OPD Detail",
      sizeClass: "w-44 sm:w-48 md:w-52 lg:w-56",
      count: 0,
      gradient: "from-[#00CED1] to-cyan-700",
      link: "/details/opd-patients",
    },
    {
      id: 6,
      title: "Medicine Inventory",
      sizeClass: "w-44 sm:w-48 md:w-52 lg:w-56",
      count: 0,
      gradient: "from-orange-400 to-red-600",
      link: "/medicine-inventory",
    },
    {
      id: 2,
      title: "Hospital Cash Bill",
      sizeClass: "w-44 sm:w-48 md:w-52 lg:w-56",
      count: 57,
      gradient: "from-purple-600 to-fuchsia-800",
      link: "/details/cash-bill/table",
    },
    {
      id: 3,
      title: "Pharmacy Bill",
      sizeClass: "w-44 sm:w-48 md:w-52 lg:w-56",
      count: 9,
      gradient: "from-amber-400 to-yellow-600",
      link: "/details/medical-bill/table",
    },
    {
      id: 4,
      title: "LAB Bill",
      sizeClass: "w-44 sm:w-48 md:w-52 lg:w-56",
      count: 2,
      gradient: "from-green-500 to-lime-700",
      link: "/details/lab-bill/table",
    },
    {
      id: 5,
      title: "Discharge Form",
      sizeClass: "w-44 sm:w-48 md:w-52 lg:w-56",
      count: 3,
      gradient: "from-sky-400 to-blue-600",
      link: "/details/discharge-form",
    },
  ];

  const [ipdRevenue, setIpdRevenue] = useState({ daily: 0, monthly: 0, yearly: 0 });
  const [ipdCounts, setIpdCounts] = useState({ daily: 0, monthly: 0, yearly: 0 });
  const [opdRevenue, setOpdRevenue] = useState({ daily: 0, monthly: 0, yearly: 0 });
  const [opdCounts, setOpdCounts] = useState({ daily: 0, monthly: 0, yearly: 0 });
  const [ipdYearlyTotal, setIpdYearlyTotal] = useState(0);
  const [opdYearlyTotal, setOpdYearlyTotal] = useState(0);
  const [cashYearlyTotal, setCashYearlyTotal] = useState(0);
  const [medicalYearlyTotal, setMedicalYearlyTotal] = useState(0);
  const [labYearlyTotal, setLabYearlyTotal] = useState(0);
  const [medicineCount, setMedicineCount] = useState(0);
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

  // Prefetch all counts on mount to avoid hardcoded values
  useEffect(() => {
    const prefetchStats = async () => {
      try {
        // Patient Stats
        const pRes = await fetch(`${API_URL}/api/v1/patients/stats`, { headers: getAuthHeaders() });
        if (pRes.ok) {
          const pData = await pRes.json();
          setIpdYearlyTotal(pData.ipdYearlyTotal || 0);
          setOpdYearlyTotal(pData.opdYearlyTotal || 0);
        }

        // Cash Bills
        const cRes = await fetch(`${API_URL}/api/v1/cashbills/revenue/stats`, { headers: getAuthHeaders() });
        if (cRes.ok) {
          const cData = await cRes.json();
          setCashYearlyTotal(cData.revenue?.yearlyCount || 0);
        }

        // Medical Bills
        const mRes = await fetch(`${API_URL}/api/v1/medicalbills/revenue/stats`, { headers: getAuthHeaders() });
        if (mRes.ok) {
          const mData = await mRes.json();
          setMedicalYearlyTotal(mData.revenue?.yearlyCount || 0);
        }

        // Lab Bills
        const lRes = await fetch(`${API_URL}/api/v1/labbills/revenue/stats`, { headers: getAuthHeaders() });
        if (lRes.ok) {
          const lData = await lRes.json();
          setLabYearlyTotal(lData.revenue?.yearlyCount || 0);
        }

        // Medicine Inventory Count
        const medRes = await fetch(`${API_URL}/api/v1/medicine/medicines`, { headers: getAuthHeaders() });
        if (medRes.ok) {
          const meds = await medRes.json();
          setMedicineCount(meds?.length || 0);
        }

        // Pharmacy Sales Prefetch (for Medicine Inventory selected view)
        const sRes = await fetch(`${API_URL}/api/v1/sale/sales/revenue`, { headers: getAuthHeaders() });
        if (sRes.ok) {
          const sData = await sRes.json();
          if (sData.revenue) setPharmacyRevenue({ daily: sData.revenue.daily || 0, monthly: sData.revenue.monthly || 0, yearly: sData.revenue.yearly || 0, total: sData.revenue.total || 0 });
          if (sData.dailyDetails) setPharmacyDailyDetails({ totalAmount: sData.dailyDetails.totalAmount || 0, count: sData.dailyDetails.count || 0, items: sData.dailyDetails.items || [] });
        }
      } catch (err) {
        console.error("Error prefetching dashboard stats", err);
      }
    };
    prefetchStats();
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
        if (data.revenue) {
          setIpdRevenue(data.revenue.ipd || { daily: 0, monthly: 0, yearly: 0 });
          setOpdRevenue(data.revenue.opd || { daily: 0, monthly: 0, yearly: 0 });
        }
        if (data.counts) {
          setIpdCounts(data.counts.ipd || { daily: 0, monthly: 0, yearly: 0 });
          setOpdCounts(data.counts.opd || { daily: 0, monthly: 0, yearly: 0 });
        }
        if (data.dailyDetails) setDailyDetails(data.dailyDetails);
        setIpdYearlyTotal(data.ipdYearlyTotal || 0);
        setOpdYearlyTotal(data.opdYearlyTotal || 0);
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
      if (selectedCard.title === "IPD Detail" || selectedCard.title === "OPD Detail") fetchStats();
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
      case "IPD Detail":
        return <GroupsIcon fontSize="large" sx={{ color: "white" }} />;
      case "OPD Detail":
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
    <div className="flex flex-col p-4 sm:p-6 lg:p-8 gap-8 bg-gradient-to-br from-[#f8fafb] to-[#f0fdff] min-h-screen">
      {/* Row of Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 xl:gap-5 justify-items-center max-w-7xl mx-auto w-full">
        {cards.map((card) => (
          <div
            key={card.id}
            className={`flex flex-col items-center bg-white rounded-2xl shadow-lg hover:shadow-2xl text-white relative overflow-hidden cursor-pointer w-full max-w-[160px] hover:-translate-y-2 transition-all duration-300 group btn-tactile`}
            onClick={() => handleInputChange(card)}
          >
            {/* Gradient background layer */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-90 group-hover:opacity-100 transition-opacity duration-300`}></div>

            {/* Glassmorphism accent */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-white opacity-10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>

            {/* Content */}
            <div className="w-full py-5 px-2 flex flex-col items-center z-10 text-center relative">
              <div className="mb-2 p-2 bg-white/20 rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                {getIcon(card.title)}
              </div>

              <div className="text-xl font-black mb-1 drop-shadow-md">
                {card.title === "IPD Detail" ? ipdYearlyTotal :
                  card.title === "OPD Detail" ? opdYearlyTotal :
                    card.title === "Hospital Cash Bill" ? cashYearlyTotal :
                      card.title === "Pharmacy Bill" ? medicalYearlyTotal :
                        card.title === "LAB Bill" ? labYearlyTotal :
                          card.title === "Medicine Inventory" ? medicineCount :
                            card.count}
              </div>

              <h3 className="text-[11px] font-extrabold uppercase tracking-tight opacity-95 mb-2 h-8 flex items-center">{card.title}</h3>

              <Link
                to={card.link}
                className="text-[9px] font-black bg-white/20 hover:bg-white/40 backdrop-blur-md px-3 py-1 rounded-full transition-all border border-white/30 uppercase tracking-widest"
                onClick={(e) => e.stopPropagation()}
              >
                Enter
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Card Revenue Summary */}
      <div className="w-full mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {selectedCard && selectedCard.title !== "Discharge Form" && (
          <div className="max-w-5xl mx-auto w-full px-4">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
              <div className={`p-4 bg-gradient-to-r ${selectedCard.gradient} text-white flex justify-between items-center`}>
                <div className="flex items-center space-x-3">
                  {getIcon(selectedCard.title)}
                  <div>
                    <h2 className="text-lg font-bold">Revenue & Analytics</h2>
                    <p className="text-xs opacity-80 uppercase tracking-wider">{selectedCard.title} Overview</p>
                  </div>
                </div>
                <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                  LIVE STATS
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                {['Daily', 'Monthly', 'Yearly'].map((label) => {
                  const isIpd = selectedCard.title === 'IPD Detail';
                  const isOpd = selectedCard.title === 'OPD Detail';
                  const revenueSource = isIpd ? ipdRevenue : isOpd ? opdRevenue : selectedCard.title === 'Hospital Cash Bill' ? cashRevenue : selectedCard.title === 'LAB Bill' ? labRevenue : selectedCard.title === 'Pharmacy Bill' ? medicalRevenue : pharmacyRevenue;
                  const amount = label === 'Daily' ? revenueSource.daily : label === 'Monthly' ? revenueSource.monthly : revenueSource.yearly;

                  let count = 0;
                  if (isIpd) count = label === 'Daily' ? ipdCounts.daily : label === 'Monthly' ? ipdCounts.monthly : ipdCounts.yearly;
                  else if (isOpd) count = label === 'Daily' ? opdCounts.daily : label === 'Monthly' ? opdCounts.monthly : opdCounts.yearly;
                  else if (selectedCard.title === 'Pharmacy Bill') count = label === 'Daily' ? (medicalDailyDetails.count || 0) : (label === 'Monthly' ? medicalRevenue.monthlyCount : medicalRevenue.yearlyCount);
                  else if (selectedCard.title === 'Medicine Inventory') count = label === 'Daily' ? (pharmacyDailyDetails.count || 0) : (label === 'Monthly' ? pharmacyRevenue.monthlyCount : pharmacyRevenue.yearlyCount);
                  else if (selectedCard.title === 'Hospital Cash Bill') count = label === 'Daily' ? (cashDailyDetails.count || 0) : (label === 'Monthly' ? cashRevenue.monthlyCount : cashRevenue.yearlyCount);
                  else if (selectedCard.title === 'LAB Bill') count = label === 'Daily' ? (labDailyDetails.count || 0) : (label === 'Monthly' ? labRevenue.monthlyCount : labRevenue.yearlyCount);

                  let subText = '';
                  if (selectedCard.title === 'Medicine Inventory') subText = `Stock: ${medicineStats.totalStock || 0}`;
                  else if (selectedCard.title === 'Pharmacy Bill') subText = `Bills: ${count}`;
                  else if (isIpd || isOpd) subText = `Patients: ${count}`;
                  else subText = `Count: ${count}`;

                  const colorClass = label === 'Daily' ? 'from-blue-50 to-blue-100 text-blue-700 border-blue-200' : label === 'Monthly' ? 'from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200' : 'from-purple-50 to-purple-100 text-purple-700 border-purple-200';

                  return (
                    <div
                      key={label}
                      className={`relative group h-32 rounded-2xl border-2 p-5 flex flex-col justify-between transition-all duration-300 hover:scale-105 btn-tactile overflow-hidden bg-gradient-to-br ${colorClass}`}
                      onClick={() => {
                        if (label !== 'Daily') return;
                        if ((isIpd || isOpd) && dailyDetails?.patients?.length) setShowDailyModal(true);
                        else if (selectedCard.title === 'Pharmacy Bill' && medicalDailyDetails?.items?.length) setShowDailyModal(true);
                        else if (selectedCard.title === 'Medicine Inventory' && (medicineStats?.lowStockItems?.length || pharmacyDailyDetails?.items?.length)) setShowDailyModal(true);
                        else if (selectedCard.title === 'Hospital Cash Bill' && cashDailyDetails?.items?.length) setShowDailyModal(true);
                        else if (selectedCard.title === 'LAB Bill' && labDailyDetails?.items?.length) setShowDailyModal(true);
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-black uppercase tracking-widest opacity-60">{label}</span>
                        {label === 'Daily' && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>}
                      </div>
                      <div>
                        <div className="text-2xl font-black tracking-tight">{formatCurrency(amount)}</div>
                        <div className="text-[10px] font-bold uppercase opacity-70 mt-1">{subText}</div>
                      </div>
                      {label === 'Daily' && <div className="absolute top-1 right-1 text-[8px] font-bold text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase px-2 py-1">Click for Details</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Daily modal */}
      {showDailyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-11/12 md:w-3/4 lg:w-1/2 p-6 rounded shadow-lg">
            <div className="flex justify-between items-center mb-4">
              {selectedCard && (selectedCard.title === 'IPD Detail' || selectedCard.title === 'OPD Detail') ? (
                <h3 className="text-lg font-semibold">Today's {selectedCard.title.split(' ')[0]} Patients ({dailyDetails.patients.filter(p => p.formType === selectedCard.title.split(' ')[0]).length}) - {formatCurrency(dailyDetails.patients.filter(p => p.formType === selectedCard.title.split(' ')[0]).reduce((s, p) => s + p.amount, 0))}</h3>
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
              {selectedCard && (selectedCard.title === 'IPD Detail' || selectedCard.title === 'OPD Detail') ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b"><th className="pb-2">Time</th><th className="pb-2">Name</th><th className="pb-2">{selectedCard.title.split(' ')[0] === 'IPD' ? 'IPD' : 'OPD'} No</th><th className="pb-2">Contact</th><th className="pb-2">Amount</th></tr>
                  </thead>
                  <tbody>
                    {dailyDetails.patients.filter(p => p.formType === selectedCard.title.split(' ')[0]).map((p) => (
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
