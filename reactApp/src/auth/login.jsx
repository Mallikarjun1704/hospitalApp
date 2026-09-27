import React, { useState, useEffect } from "react";
import { getApiBaseUrl, setApiBaseUrl, resetApiBaseUrl, testServerConnection } from "../utils/api";

const Login = ({ onLogin, onForgotPassword }) => {
  const [showRegister, setShowRegister] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Dynamic API URL State
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [ipInput, setIpInput] = useState(getApiBaseUrl().replace(/^https?:\/\//i, ''));
  const [pingStatus, setPingStatus] = useState(null); // { loading, success, latency, error }
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  // Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Saved email suggestions from previous logins
  const [savedEmails, setSavedEmails] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('loginEmailHistory');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setSavedEmails(parsed);
      }
    } catch (e) { /* ignore */ }
  }, []);

  // Registration State
  const [regUserName, setRegUserName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhoneNumber, setRegPhoneNumber] = useState("");
  const [regAge, setRegAge] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  const [adminExists, setAdminExists] = useState(true);

  // Check admin account existence on active API URL
  const checkAdmin = React.useCallback(async (targetUrl = apiUrl) => {
    try {
      const res = await fetch(`${targetUrl}/api/v1/check-admin`);
      if (res.ok) {
        const data = await res.json();
        setAdminExists(data.exists);
        // Auto-show registration form when no admin exists
        if (!data.exists) {
          setShowRegister(true);
        }
      }
    } catch (err) {
      console.warn("Failed to check if admin exists at", targetUrl, err);
    } finally {
      setInitialLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    checkAdmin(apiUrl);

    const handleUrlChange = (e) => {
      setApiUrl(e.detail);
      checkAdmin(e.detail);
    };

    window.addEventListener('hospital_api_url_changed', handleUrlChange);
    return () => window.removeEventListener('hospital_api_url_changed', handleUrlChange);
  }, [apiUrl, checkAdmin]);

  // Test Network Ping
  const handleTestConnection = async () => {
    setPingStatus({ loading: true });
    setSaveSuccessMsg("");
    const result = await testServerConnection(ipInput);
    setPingStatus({
      loading: false,
      success: result.success,
      latency: result.latency,
      error: result.error,
      url: result.url
    });
  };

  // Save and apply new Server IP
  const handleSaveNetworkSettings = async () => {
    setPingStatus({ loading: true });
    setSaveSuccessMsg("");
    
    const result = await testServerConnection(ipInput);
    if (!result.success) {
      setPingStatus({
        loading: false,
        success: false,
        error: result.error || "Connection failed. Please check the IP address."
      });
      return;
    }

    const savedUrl = setApiBaseUrl(ipInput);
    setApiUrl(savedUrl);
    setPingStatus({
      loading: false,
      success: true,
      latency: result.latency,
      url: savedUrl
    });
    setSaveSuccessMsg(`Connected & saved: ${savedUrl}`);
    setError("");
    checkAdmin(savedUrl);

    setTimeout(() => {
      setShowNetworkModal(false);
      setSaveSuccessMsg("");
    }, 1200);
  };

  // Reset to Localhost
  const handleResetToLocalhost = () => {
    const defaultUrl = resetApiBaseUrl();
    setApiUrl(defaultUrl);
    setIpInput(defaultUrl.replace(/^https?:\/\//i, ''));
    setPingStatus(null);
    setSaveSuccessMsg("Reverted to Localhost default.");
    checkAdmin(defaultUrl);
  };

  const handleLogin = async () => {
    setError("");
    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/v1/login`, {
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

      // Save email to login history for future suggestions
      try {
        const stored = localStorage.getItem('loginEmailHistory');
        let history = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(history)) history = [];
        // Add current email to top, remove duplicates, keep max 10
        history = [email, ...history.filter(e => e !== email)].slice(0, 10);
        localStorage.setItem('loginEmailHistory', JSON.stringify(history));
        setSavedEmails(history);
      } catch (e) { /* ignore */ }
      
      // Notify parent that login succeeded
      if (onLogin) onLogin();
    } catch (err) {
      setError(err.message || "Login failed. Check server connection.");
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
      const res = await fetch(`${apiUrl}/api/v1/register`, {
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

      {/* Top Bar Server IP Badge & Network Settings Trigger */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          onClick={() => {
            setIpInput(apiUrl.replace(/^https?:\/\//i, ''));
            setPingStatus(null);
            setSaveSuccessMsg("");
            setShowNetworkModal(true);
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/80 hover:bg-white text-gray-700 hover:text-[#049746] rounded-xl shadow-md border border-white/60 backdrop-blur-md transition-all text-xs font-semibold group"
          title="Configure Main System IP Address"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] font-mono font-medium truncate max-w-[160px]">
            {apiUrl.replace(/^https?:\/\//i, '')}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 text-gray-500 group-hover:rotate-90 transition-transform duration-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Network Settings Modal */}
      {showNetworkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full p-6 relative">
            {/* Close button */}
            <button
              onClick={() => setShowNetworkModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-50 text-[#049746] rounded-2xl border border-emerald-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Network & Server Settings</h3>
                <p className="text-xs text-gray-500">Configure Main System Backend connection</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-[#008080] block mb-1.5">
                  Main System IP Address / Port
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={ipInput}
                    onChange={(e) => setIpInput(e.target.value)}
                    placeholder="e.g. 192.168.1.50:8889 or localhost:8889"
                    className="w-full pl-4 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00CED1] focus:bg-white text-sm font-mono transition-all"
                  />
                </div>
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Tip: On the Second System, enter the Wi-Fi IP of the Main System.
                </span>
              </div>

              {/* Status Display */}
              {pingStatus && (
                <div className={`p-3 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                  pingStatus.loading
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : pingStatus.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {pingStatus.loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Testing connection to {ipInput}...</span>
                    </>
                  ) : pingStatus.success ? (
                    <>
                      <span className="text-base">✓</span>
                      <span>Connected successfully! Response time: <strong>{pingStatus.latency}ms</strong></span>
                    </>
                  ) : (
                    <>
                      <span className="text-base">⚠️</span>
                      <span className="truncate">{pingStatus.error}</span>
                    </>
                  )}
                </div>
              )}

              {saveSuccessMsg && (
                <div className="p-2.5 bg-green-50 text-green-700 border border-green-200 rounded-xl text-xs font-semibold text-center">
                  {saveSuccessMsg}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={pingStatus?.loading}
                    className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                  >
                    Test Ping
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNetworkSettings}
                    disabled={pingStatus?.loading}
                    className="py-2.5 px-4 bg-gradient-to-r from-[#049746] to-[#00CED1] hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
                  >
                    Save & Connect
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleResetToLocalhost}
                  className="py-2 text-center text-xs text-gray-500 hover:text-gray-800 underline font-medium"
                >
                  Reset to Localhost (Default)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-[420px] p-1 animate-in fade-in zoom-in duration-500">
        <div className="bg-white/90 backdrop-blur-2xl p-8 md:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/40">
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
            {/* First-time setup banner */}
            {!adminExists && !initialLoading && (
              <div className="mt-4 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-2xl text-center">
                <p className="text-amber-800 text-xs font-bold">🔧 First-Time Setup</p>
                <p className="text-amber-600 text-[10px] mt-0.5">Create an admin account to get started</p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-r-lg text-xs font-bold mb-6 animate-pulse">
              <span className="block">{error}</span>
            </div>
          )}

          {showRegister ? (
            <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[#008080] ml-1 mb-1 block">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Mallikarjun"
                  value={regUserName}
                  onChange={(e) => setRegUserName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRegister(); }}
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
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRegister(); }}
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
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRegister(); }}
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
                    onKeyDown={(e) => { if (e.key === 'Enter') handleRegister(); }}
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
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRegister(); }}
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
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRegister(); }}
                  className="w-full pl-4 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#00CED1] focus:bg-white transition-all duration-300 placeholder:text-gray-300 font-medium text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`relative overflow-hidden group w-full bg-gradient-to-r from-[#049746] to-[#00CED1] text-white py-3.5 rounded-2xl transition-all duration-300 btn-tactile font-black uppercase tracking-widest shadow-lg hover:shadow-[#00CED1]/30 text-xs ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
              >
                <span className="relative z-10 flex justify-center items-center gap-2">
                  {loading ? 'Creating Account...' : 'Create Admin Account'}
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
              </button>

              {/* Only show "Back to Sign In" if admin already exists (manual toggle) */}
              {adminExists && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => { setShowRegister(false); setError(""); }}
                    className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#049746] transition-colors duration-300"
                  >
                    Back to Sign In
                  </button>
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[#008080] ml-1 mb-1.5 block">Email ID / Username</label>
                <div className="relative group">
                  <input
                    type="text"
                    list="login-email-suggestions"
                    autoComplete="email"
                    placeholder="admin or user@hospital.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
                    className="w-full pl-4 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#00CED1] focus:bg-white transition-all duration-300 placeholder:text-gray-300 font-medium"
                  />
                  <datalist id="login-email-suggestions">
                    {savedEmails.map((e, i) => <option key={i} value={e} />)}
                  </datalist>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center ml-1 mb-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#008080] block">Password</label>
                </div>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
                  className="w-full pl-4 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#00CED1] focus:bg-white transition-all duration-300 placeholder:text-gray-300 font-medium"
                />
              </div>

              <button
                type="submit"
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
                  type="button"
                  onClick={onForgotPassword}
                  className="text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-[#049746] transition-colors duration-300"
                >
                  Forgot your credentials?
                </button>
              </div>
            </form>
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
