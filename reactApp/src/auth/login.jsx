import React, { useState, useEffect } from "react";

const Login = ({ onLogin, onForgotPassword }) => {
  const [showRegister, setShowRegister] = useState(false);

  // Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Registration State
  const [regUserName, setRegUserName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhoneNumber, setRegPhoneNumber] = useState("");
  const [regAge, setRegAge] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  const [adminExists, setAdminExists] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8889";

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/check-admin`);
        if (res.ok) {
          const data = await res.json();
          setAdminExists(data.exists);
        }
      } catch (err) {
        console.error("Failed to check if admin exists", err);
      }
    };
    checkAdmin();
  }, [API_URL]);

  const handleLogin = async () => {
    setError("");
    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || errBody.message || "Invalid credentials");
      }

      const data = await res.json();
      // Save tokens and userId
      if (data.accessToken) localStorage.setItem("accessToken", data.accessToken);
      if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
      if (data.userId) localStorage.setItem("userId", data.userId);
      if (data.userName) localStorage.setItem("userName", data.userName);
      if (data.userType) localStorage.setItem("userType", data.userType);
      // Notify parent that login succeeded
      if (onLogin) onLogin();
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError("");
    if (!regUserName || !regEmail || !regPhoneNumber || !regPassword || !regConfirmPassword) {
      setError("Please fill in all required fields.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: regUserName,
          email: regEmail,
          phoneNumber: regPhoneNumber,
          age: regAge ? Number(regAge) : undefined,
          password: regPassword,
          userType: "admin"
        })
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || errBody.error || "Registration failed");
      }

      alert("Admin account created successfully! Please sign in.");
      setShowRegister(false);
      setAdminExists(true);
      setEmail(regEmail);
      setPassword("");
      setRegUserName("");
      setRegEmail("");
      setRegPhoneNumber("");
      setRegAge("");
      setRegPassword("");
      setRegConfirmPassword("");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex justify-center items-center min-h-screen bg-cover bg-center w-full h-full relative"
      style={{ backgroundImage: "url('images/backImage.jpg')" }}
    >
      {/* Dark Gradient Overlay for focus */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#049746]/40 to-[#00CED1]/30 backdrop-blur-[2px]"></div>

      <div
        className="relative z-10 w-full max-w-[420px] p-1 animate-in fade-in zoom-in duration-500"
      >
        <div
          className="bg-white/90 backdrop-blur-2xl p-8 md:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/40"
        >
          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="bg-white p-2 rounded-2xl shadow-inner border border-teal-50 mb-4">
              <img
                src="images/medicallogo.jpg"
                alt="Hospital Logo"
                className="w-20 h-20 object-contain rounded-xl"
              />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight text-center leading-tight">
              Hospital Portal
            </h1>
            <p className="text-[#049746] text-xs font-bold uppercase tracking-[0.2em] mt-2">
              Prashanth General Hospital
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-r-lg text-xs font-bold mb-6 animate-pulse">
              <span className="block">{error}</span>
            </div>
          )}

          {showRegister ? (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[#008080] ml-1 mb-1 block">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Mallikarjun"
                  value={regUserName}
                  onChange={(e) => setRegUserName(e.target.value)}
                  className="w-full pl-4 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#00CED1] focus:bg-white transition-all duration-300 placeholder:text-gray-300 font-medium text-sm"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[#008080] ml-1 mb-1 block">Email ID *</label>
                <input
                  type="email"
                  placeholder="name@gmail.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full pl-4 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#00CED1] focus:bg-white transition-all duration-300 placeholder:text-gray-300 font-medium text-sm"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[#008080] ml-1 mb-1 block">Phone Number *</label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={regPhoneNumber}
                  onChange={(e) => setRegPhoneNumber(e.target.value)}
                  className="w-full pl-4 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#00CED1] focus:bg-white transition-all duration-300 placeholder:text-gray-300 font-medium text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#008080] ml-1 mb-1 block">Age</label>
                  <input
                    type="number"
                    placeholder="e.g. 35"
                    value={regAge}
                    onChange={(e) => setRegAge(e.target.value)}
                    className="w-full pl-4 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#00CED1] focus:bg-white transition-all duration-300 placeholder:text-gray-300 font-medium text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#008080] ml-1 mb-1 block">Role</label>
                  <input
                    type="text"
                    value="Admin"
                    disabled
                    className="w-full pl-4 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-2xl font-bold text-gray-500 text-sm cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[#008080] ml-1 mb-1 block">Password *</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full pl-4 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#00CED1] focus:bg-white transition-all duration-300 placeholder:text-gray-300 font-medium text-sm"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[#008080] ml-1 mb-1 block">Confirm Password *</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className="w-full pl-4 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#00CED1] focus:bg-white transition-all duration-300 placeholder:text-gray-300 font-medium text-sm"
                />
              </div>

              <button
                onClick={handleRegister}
                disabled={loading}
                className={`relative overflow-hidden group w-full bg-gradient-to-r from-[#049746] to-[#00CED1] text-white py-3.5 rounded-2xl transition-all duration-300 btn-tactile font-black uppercase tracking-widest shadow-lg hover:shadow-[#00CED1]/30 text-xs ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
              >
                <span className="relative z-10 flex justify-center items-center gap-2">
                  {loading ? 'Creating Account...' : 'Create Admin Account'}
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
              </button>

              <div className="pt-2 text-center">
                <button
                  onClick={() => { setShowRegister(false); setError(""); }}
                  className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#049746] transition-colors duration-300"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[#008080] ml-1 mb-1.5 block">Email ID</label>
                <div className="relative group">
                  <input
                    type="email"
                    placeholder="name@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-4 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#00CED1] focus:bg-white transition-all duration-300 placeholder:text-gray-300 font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center ml-1 mb-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#008080] block">Password</label>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#00CED1] focus:bg-white transition-all duration-300 placeholder:text-gray-300 font-medium"
                />
              </div>

              <button
                onClick={handleLogin}
                disabled={loading}
                className={`relative overflow-hidden group w-full bg-gradient-to-r from-[#049746] to-[#00CED1] text-white py-4 rounded-2xl transition-all duration-300 btn-tactile font-black uppercase tracking-widest shadow-lg hover:shadow-[#00CED1]/30 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
              >
                <span className="relative z-10 flex justify-center items-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Validating...
                    </>
                  ) : 'Sign In To Account'}
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
              </button>

              <div className="pt-4 text-center flex flex-col space-y-2">
                <button
                  onClick={onForgotPassword}
                  className="text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-[#049746] transition-colors duration-300"
                >
                  Forgot your credentials?
                </button>
                {!adminExists && (
                  <button
                    onClick={() => { setShowRegister(true); setError(""); }}
                    className="text-[11px] font-black uppercase tracking-widest text-[#049746] hover:text-[#00CED1] transition-colors duration-300"
                  >
                    Create Admin Account
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <p className="mt-8 text-center text-white/60 text-[10px] font-black uppercase tracking-[0.3em]">
          Secure Healthcare Management Systems
        </p>
      </div>
    </div>
  );
};

export default Login;
