import React, { useState } from "react";

const Login = ({ onLogin, onForgotPassword }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8889";

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

  return (
    <div
      className="flex justify-center items-center min-h-screen bg-cover bg-center w-full h-full"
      style={{ backgroundImage: "url('/images/backImage.jpg')" }}
    >
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h1 className="text-xl font-bold mb-4 text-center">Login</h1>
        {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
        <label className="text-sm font-medium self-start">Email</label>
        <input
          type="email"
          placeholder="Enter Gmail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-2 mb-4 w-full border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <label className="text-sm font-medium self-start">Password</label>
        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-2 mb-4 w-full border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleLogin}
          disabled={loading}
          className={`bg-green-400 text-white py-2 px-4 rounded mb-4 transition w-full ${loading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-green-500'}`}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        <p className="text-center">
          <button
            onClick={onForgotPassword}
            className="text-blue-500 underline hover:text-blue-700 transition"
          >
            Forgot Password?
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
