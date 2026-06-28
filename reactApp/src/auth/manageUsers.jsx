import React, { useState, useEffect } from "react";
import Header from "../common/header";
import { getAuthHeaders } from "../utils/api";
import { useNavigate } from "react-router-dom";

const ManageUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [age, setAge] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("hospital");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8889";

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/getUserAllUsers`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!userName || !email || !phoneNumber || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/v1/register`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userName,
          email,
          phoneNumber,
          age: Number(age) || undefined,
          password,
          userType,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || "Failed to create profile");
      }

      setSuccess("User profile created successfully!");
      // Reset form
      setUserName("");
      setEmail("");
      setPhoneNumber("");
      setAge("");
      setPassword("");
      setUserType("hospital");
      // Refresh list
      fetchUsers();
    } catch (err) {
      setError(err.message || "Failed to create user profile");
    }
  };

  const handleDeleteUser = async (userId) => {
    const currentAdminId = localStorage.getItem("userId");
    if (userId === currentAdminId) {
      alert("You cannot delete your own logged-in admin account.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this user profile?")) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/v1/deleteUser/${userId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to delete user profile");
      }

      alert("User deleted successfully!");
      fetchUsers();
    } catch (err) {
      alert(err.message || "Failed to delete user profile");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div>
            <h2 className="text-2xl font-black text-gray-800">User Profile Management</h2>
            <p className="text-sm text-gray-500">Create and manage access levels for admin and workers.</p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-xl font-bold shadow-md transition-all uppercase tracking-wider text-xs btn-tactile"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create User Profile Column */}
          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 h-fit">
            <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">Create New Profile</h3>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-r-lg text-xs font-bold mb-4">
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-3 rounded-r-lg text-xs font-bold mb-4">
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[#008080] ml-1 mb-1 block">Full Name *</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
                  placeholder="e.g. Dr. Mallikarjun"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[#008080] ml-1 mb-1 block">Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
                  placeholder="e.g. dr@gmail.com"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[#008080] ml-1 mb-1 block">Phone Number *</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
                  placeholder="e.g. 9876543210"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#008080] ml-1 mb-1 block">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
                    placeholder="e.g. 35"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#008080] ml-1 mb-1 block">Role Profile *</label>
                  <select
                    value={userType}
                    onChange={(e) => setUserType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-semibold"
                  >
                    <option value="admin">Admin (All Access)</option>
                    <option value="hospital">Hospital Worker</option>
                    <option value="lab">Lab Worker</option>
                    <option value="medicine">Medicine Shop Worker</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[#008080] ml-1 mb-1 block">Password *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-[#049746] to-[#00CED1] hover:scale-[1.01] active:scale-[0.99] text-white rounded-xl transition-all shadow-md font-bold uppercase tracking-widest text-xs btn-tactile"
              >
                Create Profile
              </button>
            </form>
          </div>

          {/* Existing Profiles List Column */}
          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 lg:col-span-2">
            <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">Active User Profiles</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-3 text-xs font-bold uppercase text-gray-500">Name</th>
                    <th className="p-3 text-xs font-bold uppercase text-gray-500">Email</th>
                    <th className="p-3 text-xs font-bold uppercase text-gray-500">Phone</th>
                    <th className="p-3 text-xs font-bold uppercase text-gray-500">Role</th>
                    <th className="p-3 text-xs font-bold uppercase text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading && (
                    <tr>
                      <td colSpan="5" className="p-4 text-center text-gray-500 font-medium">Loading user profiles...</td>
                    </tr>
                  )}
                  {!loading && users.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-4 text-center text-gray-500 font-medium">No user profiles found</td>
                    </tr>
                  )}
                  {!loading &&
                    users.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 font-semibold text-gray-900">{u.userName}</td>
                        <td className="p-3 text-gray-600 font-medium">{u.email}</td>
                        <td className="p-3 text-gray-600 font-medium">{u.phoneNumber}</td>
                        <td className="p-3">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              u.userType === "admin"
                                ? "bg-red-50 text-red-600 border border-red-100"
                                : u.userType === "hospital"
                                ? "bg-blue-50 text-blue-600 border border-blue-100"
                                : u.userType === "lab"
                                ? "bg-green-50 text-green-600 border border-green-100"
                                : "bg-orange-50 text-orange-600 border border-orange-100"
                            }`}
                          >
                            {u.userType === "medicine" ? "medicine shop" : u.userType}
                          </span>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white px-3 py-1 rounded-xl transition-all border border-rose-100 text-xs font-bold"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;
