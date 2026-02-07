import React, { useState } from "react";

const ResetPassword = ({ onBackToLogin }) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleReset = () => {
    if (email) {
      setMessage(`A password reset link has been sent to ${email}`);
    } else {
      alert("Please enter your email");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-cover bg-center w-full h-full"
     style={{ backgroundImage: "url('/images/backImage.jpg')" }}>
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Reset Password</h1>
        <div className="flex flex-col items-center">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-2 mb-4 w-full border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleReset}
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-400 w-full"
          >
            Reset Password
          </button>
          {message && <p className="text-green-500 mt-4">{message}</p>}
          <button
            onClick={onBackToLogin}
            className="text-blue-500 underline hover:text-blue-700 transition mt-4"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
