import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Login from "./auth/login";
import Dashboard from "./common/dashboard";
import Card from "./common/cards"
import CashBill from "./details/cashbill";
import CashBillTable from "./details/cashBillTable";
import Medical from "./details/medicalbill";
import MedicalBillTable from "./details/medicalBillTable";
import DischargeForm from "./details/dischargeform";
import AddPatient from "./details/AddPatient";
import MedicineInventory from "./details/MedicineInventory";
import AddMedicine from "./details/AddMedicine";
import LabDiagnostics from "./details/labdiagnostics";
import AddLabTest from "./details/addLabTest";
import Patientdetails from "./details/patientdetails";
import LabBillTable from "./details/labBillTable";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return !!localStorage.getItem('userId');
    } catch (e) {
      return false;
    }
  });

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleForgotPassword = () => {
    alert("Forgot Password functionality not implemented yet.");
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={isLoggedIn ? ( <Navigate to="/dashboard" replace />) : (
              <Login onLogin={handleLogin} onForgotPassword={handleForgotPassword} />
            )
          }
        />
        <Route path="/dashboard" element={ isLoggedIn ? (<Dashboard />) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="/details/patient-details" element={ isLoggedIn ? (<Patientdetails /> ) : (
              <Navigate to="/" replace />
            )
          }
        />
          <Route path="/medicine-inventory" element={ isLoggedIn ? (<MedicineInventory />) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route path="/add-medicine" element={ isLoggedIn ? (<AddMedicine />) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route path="/edit-medicine/:id" element={ isLoggedIn ? (<AddMedicine />) : (
                <Navigate to="/" replace />
              )
            }
          />
        <Route path="/cards" element={ isLoggedIn ? (<Card /> ) : (
              <Navigate to="/" replace />
            )
          }
        />
         <Route path="/details/cash-bill"element={ isLoggedIn ? (<CashBill /> ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="/details/cash-bill/table" element={ isLoggedIn ? (<CashBillTable /> ) : (
              <Navigate to="/" replace />
            )
          }
        />
         <Route path="/details/Medical-bill"element={ isLoggedIn ? (<Medical /> ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="/details/medical-bill" element={ isLoggedIn ? (<Medical />) : (<Navigate to="/" replace />)} />
        <Route path="/details/medical-bill/table" element={ isLoggedIn ? (<MedicalBillTable /> ) : (
              <Navigate to="/" replace />
            )
          }
        />
         <Route path="/details/discharge-form"element={ isLoggedIn ? (<DischargeForm /> ) : (
              <Navigate to="/" replace />
            )
          }
        />
         <Route path="/details/add-patient" element={ isLoggedIn ? (<AddPatient /> ) : (
              <Navigate to="/" replace />
            )
          }
        />
         <Route path="/details/lab-diagnostics"element={ isLoggedIn ? (<LabDiagnostics /> ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="/details/lab-bill/table" element={ isLoggedIn ? (<LabBillTable /> ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="/details/add-lab-test" element={ isLoggedIn ? (<AddLabTest /> ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
