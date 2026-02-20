import React, { useState, useEffect } from "react";
import { getAuthHeaders } from "../utils/api";
import { Link } from "react-router-dom";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || "http://172.20.10.2:8889";

  const toggleProfileCard = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    const controller = new AbortController();
    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/v1/getUser/${userId}`, {
          method: "GET",
          headers: getAuthHeaders(),
          signal: controller.signal,
        });
        console.log(res)
        if (!res.ok) {
          // unauthorized or other error — clear credentials
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("userId");
            setUser(null);
            return;
          }
          throw new Error("Failed to load user");
        }

        const data = await res.json();
        console.log(data);
        setUser(data);
      } catch (err) {
        // ignore abort errors
        if (err.name !== "AbortError") console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
    return () => controller.abort();
  }, [API_URL]);

  const handleSignOut = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    const accessToken = localStorage.getItem('accessToken');
    try {
      if (refreshToken || accessToken) {
        await fetch(`${API_URL}/api/v1/logout`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ token: refreshToken, accessToken })
        });
      }
    } catch (err) {
      console.error('Logout call failed', err);
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    setUser(null);
    setIsOpen(false);
    window.location.href = '/';
  };

  return (
    <div className="py-2 bg-white border-b-8 border-green-800 w-full">
      <div className="flex justify-between items-center px-8 w-full max-w-full">
        {/* Left Logo */}
        <div className="flex-shrink-0">
          <img src="/images/medicallogo.jpg" alt="Doctor Logo" className="w-20" />
        </div>

        {/* Center Title */}
        <div className="flex-grow text-center px-4">
          <h2 className="text-4xl font-bold">PRASHANTH GENERAL HOSPITAL</h2>
          <p className="text-xl">
            <b>SRS complex, Bhagyanagar circle, Kinnal road Koppal</b> Contact: 7204158789
          </p>
        </div>

        {/* Right Profile Menu */}
        <div className="flex-shrink-0 relative z-10" data-html2canvas-ignore="true">
          <div className="cursor-pointer" onClick={toggleProfileCard}>
            <img
              src="/images/m_002.png"
              alt="User Avatar"
              className="w-16 rounded-full border bg-green-800"
            />
          </div>
          {isOpen && (
            <div className="absolute right-0 border border-black rounded-lg shadow-lg w-64 mt-2">
              <div className="bg-green-800 text-white py-4 px-2 rounded-t-lg flex flex-col items-center">
                <img
                  src="/images/m_002.png"
                  alt="User Avatar"
                  className="w-16 rounded-full border"
                />
                <div className="flex flex-col items-center mb-4">
                  <h4 className="text-lg font-semibold">{user ? `${user.userName}${user.userType ? ` (${user.userType})` : ''}` : (loading ? 'Loading...' : 'Guest')}</h4>
                  <p className="text-sm ">{user ? user.email : ''}</p>
                </div>
              </div>

              <div className="bg-white text-black py-2 px-2 rounded-b-lg">
                <div className="flex gap-2 items-center justify-between px-2">
                  <Link to="/dashboard">
                    <button className="bg-gray-300 py-2 px-4 rounded-full hover:bg-gray-400">
                      Home
                    </button>
                  </Link>
                  <button onClick={handleSignOut} className="bg-gray-300 py-2 px-4 rounded-full hover:bg-gray-400">
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
