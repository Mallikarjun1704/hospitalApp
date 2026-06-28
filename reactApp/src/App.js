import React, { useState } from "react";
import { HashRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Login from "./auth/login";
import ResetPassword from "./auth/resetPassword";
import ManageUsers from "./auth/manageUsers";
import Dashboard from "./common/dashboard";
// import Card from "./common/cards"
import CashBill from "./details/cashbill";
import CashBillTable from "./details/cashBillTable";
import Medical from "./details/medicalbill";
import MedicalBillTable from "./details/medicalBillTable";
import DischargeForm from "./details/dischargeform";
import DischargeSummaryTable from "./details/dischargeSummaryTable";
import AddPatient from "./details/AddPatient";
import MedicineInventory from "./details/MedicineInventory";
import AddMedicine from "./details/AddMedicine";
import LabDiagnostics from "./details/labdiagnostics";
import AddLabTest from "./details/addLabTest";
import Patientdetails from "./details/patientdetails";
import LabBillTable from "./details/labBillTable";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const isLoggedIn = !!localStorage.getItem('userId');
  const userType = localStorage.getItem('userType');

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userType)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return !!localStorage.getItem('userId');
    } catch (e) {
      return false;
    }
  });

  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          isLoggedIn ? (
            <Navigate to="/dashboard" replace />
          ) : (
            showForgotPassword ? (
              <ResetPassword onBackToLogin={() => setShowForgotPassword(false)} />
            ) : (
              <Login onLogin={handleLogin} onForgotPassword={() => setShowForgotPassword(true)} />
            )
          )
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        {/* User Management (Admin only) */}
        <Route path="/manage-users" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <ManageUsers />
          </ProtectedRoute>
        } />

        {/* Hospital Features */}
        <Route path="/details/patient-details" element={
          <ProtectedRoute allowedRoles={["admin", "hospital"]}>
            <Patientdetails />
          </ProtectedRoute>
        } />
        <Route path="/details/ipd-patients" element={
          <ProtectedRoute allowedRoles={["admin", "hospital"]}>
            <Patientdetails type="IPD" />
          </ProtectedRoute>
        } />
        <Route path="/details/opd-patients" element={
          <ProtectedRoute allowedRoles={["admin", "hospital"]}>
            <Patientdetails type="OPD" />
          </ProtectedRoute>
        } />
        <Route path="/details/cash-bill" element={
          <ProtectedRoute allowedRoles={["admin", "hospital"]}>
            <CashBill />
          </ProtectedRoute>
        } />
        <Route path="/details/cash-bill/table" element={
          <ProtectedRoute allowedRoles={["admin", "hospital"]}>
            <CashBillTable />
          </ProtectedRoute>
        } />
        <Route path="/details/discharge-form" element={
          <ProtectedRoute allowedRoles={["admin", "hospital"]}>
            <DischargeForm />
          </ProtectedRoute>
        } />
        <Route path="/details/discharge-summary/table" element={
          <ProtectedRoute allowedRoles={["admin", "hospital"]}>
            <DischargeSummaryTable />
          </ProtectedRoute>
        } />
        <Route path="/details/add-patient" element={
          <ProtectedRoute allowedRoles={["admin", "hospital"]}>
            <AddPatient />
          </ProtectedRoute>
        } />
        <Route path="/details/add-ipd" element={
          <ProtectedRoute allowedRoles={["admin", "hospital"]}>
            <AddPatient />
          </ProtectedRoute>
        } />
        <Route path="/details/add-opd" element={
          <ProtectedRoute allowedRoles={["admin", "hospital"]}>
            <AddPatient />
          </ProtectedRoute>
        } />

        {/* Medicine Shop Features */}
        <Route path="/medicine-inventory" element={
          <ProtectedRoute allowedRoles={["admin", "medicine", "medicine_shop"]}>
            <MedicineInventory />
          </ProtectedRoute>
        } />
        <Route path="/add-medicine" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AddMedicine />
          </ProtectedRoute>
        } />
        <Route path="/edit-medicine/:id" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AddMedicine />
          </ProtectedRoute>
        } />
        <Route path="/details/Medical-bill" element={
          <ProtectedRoute allowedRoles={["admin", "medicine", "medicine_shop"]}>
            <Medical />
          </ProtectedRoute>
        } />
        <Route path="/details/medical-bill" element={
          <ProtectedRoute allowedRoles={["admin", "medicine", "medicine_shop"]}>
            <Medical />
          </ProtectedRoute>
        } />
        <Route path="/details/medical-bill/table" element={
          <ProtectedRoute allowedRoles={["admin", "medicine", "medicine_shop"]}>
            <MedicalBillTable />
          </ProtectedRoute>
        } />

        {/* Lab Features */}
        <Route path="/details/lab-diagnostics" element={
          <ProtectedRoute allowedRoles={["admin", "lab"]}>
            <LabDiagnostics />
          </ProtectedRoute>
        } />
        <Route path="/details/lab-bill/table" element={
          <ProtectedRoute allowedRoles={["admin", "lab"]}>
            <LabBillTable />
          </ProtectedRoute>
        } />
        <Route path="/details/add-lab-test" element={
          <ProtectedRoute allowedRoles={["admin", "lab"]}>
            <AddLabTest />
          </ProtectedRoute>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
