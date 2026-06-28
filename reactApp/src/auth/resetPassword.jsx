import React, { useState } from "react";

const ResetPassword = ({ onBackToLogin }) => {
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8889";

  const handleReset = async () => {
    setError("");
    setMessage("");

    if (!email || !phoneNumber || !newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phoneNumber, newPassword })
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "Failed to reset password. Please check your details.");
      }

      setMessage("Password reset successfully. You can now login with your new password.");
      // Clear inputs
      setEmail("");
      setPhoneNumber("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex justify-center items-center min-h-screen bg-cover bg-center w-full h-full relative"
      style={{ backgroundImage: "url('images/backImage.jpg')" }}
    >
      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#049746]/40 to-[#00CED1]/30 backdrop-blur-[2px]"></div>

      <div className="relative z-10 w-full max-w-[420px] p-1 animate-in fade-in zoom-in duration-500">
        <div className="bg-white/90 backdrop-blur-2xl p-8 md:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/40">
          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="bg-white p-2 rounded-2xl shadow-inner border border-teal-50 mb-3">
              <img
                src="images/medicallogo.jpg"
                alt="Hospital Logo"
                className="w-16 h-16 object-contain rounded-xl"
              />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight text-center leading-tight">
              Reset Password
            </h1>
            <p className="text-[#049746] text-[10px] font-bold uppercase tracking-[0.2em] mt-1">
              Prashanth General Hospital
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-r-lg text-xs font-bold mb-4 animate-pulse">
              <span className="block">{error}</span>
            </div>
          )}

          {message && (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-3 rounded-r-lg text-xs font-bold mb-4">
              <span className="block">{message}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[#008080] ml-1 mb-1 block">Email ID</label>
              <input
                type="email"
                placeholder="name@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-4 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#00CED1] focus:bg-white transition-all duration-300 placeholder:text-gray-300 font-medium text-sm"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[#008080] ml-1 mb-1 block">Phone Number</label>
              <input
                type="text"
                placeholder="Enter registered mobile no."
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full pl-4 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#00CED1] focus:bg-white transition-all duration-300 placeholder:text-gray-300 font-medium text-sm"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[#008080] ml-1 mb-1 block">New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-4 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#00CED1] focus:bg-white transition-all duration-300 placeholder:text-gray-300 font-medium text-sm"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[#008080] ml-1 mb-1 block">Confirm New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-4 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#00CED1] focus:bg-white transition-all duration-300 placeholder:text-gray-300 font-medium text-sm"
              />
            </div>

            <button
              onClick={handleReset}
              disabled={loading}
              className={`relative overflow-hidden group w-full bg-gradient-to-r from-[#049746] to-[#00CED1] text-white py-3.5 rounded-2xl transition-all duration-300 btn-tactile font-black uppercase tracking-widest shadow-lg hover:shadow-[#00CED1]/30 text-xs ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
            >
              <span className="relative z-10 flex justify-center items-center gap-2">
                {loading ? 'Processing...' : 'Reset Password'}
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            </button>

            <div className="pt-2 text-center">
              <button
                onClick={onBackToLogin}
                className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#049746] transition-colors duration-300"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-6 text-center text-white/60 text-[9px] font-black uppercase tracking-[0.3em]">
          Secure Healthcare Management Systems
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
