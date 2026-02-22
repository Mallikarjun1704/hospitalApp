import React, { useState, useEffect } from "react";
import { getAuthHeaders } from "../utils/api";
import { Link } from "react-router-dom";

const Header = ({ isSticky = true }) => {
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
    <header className={`${isSticky ? "sticky top-0 z-50" : "relative"} w-full`}>
      {/* Top Gradient Bar */}
      <div className="bg-gradient-to-r from-[#049746] to-[#00CED1] h-1 w-full"></div>

      {/* Main Header Content */}
      <div className="bg-white border-b border-gray-100 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center gap-4">

          {/* Left: Logo Section */}
          <div className="flex items-center gap-4">
            <div className="bg-white p-1 rounded-xl shadow-sm border border-teal-50">
              <img
                src="/images/medicallogo.jpg"
                alt="Doctor Logo"
                className="w-20 h-20 object-contain rounded-lg"
              />
            </div>
            <div className="hidden lg:block">
              <span className="text-xs font-bold text-teal-600 uppercase tracking-widest block">Quality Healthcare</span>
              <span className="text-sm font-medium text-gray-500 italic">Excellence in Service</span>
            </div>
          </div>

          {/* Center: Branding Section */}
          <div className="flex-grow flex flex-col items-center text-center px-4">
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-[#049746]">
              PRASHANTH GENERAL HOSPITAL
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-1">
              <p className="text-gray-600 text-xs md:text-sm font-medium flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-[#049746]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                SRS complex, Bhagyanagar circle, Kinnal road Koppal
              </p>
              <span className="hidden md:inline w-1 h-1 bg-gray-300 rounded-full"></span>
              <p className="text-[#049746] text-xs md:text-sm font-bold flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                7204158789
              </p>
            </div>
          </div>

          {/* Right: User Section */}
          <div className="relative flex-shrink-0 group no-print">
            <button
              onClick={toggleProfileCard}
              className="flex items-center gap-2 p-1.5 rounded-full hover:bg-teal-50 transition-all duration-300 ring-2 ring-transparent hover:ring-[#00CED1]"
            >
              <div className="relative">
                <img
                  src="/images/m_002.png"
                  alt="User Avatar"
                  className="w-10 h-10 md:w-11 md:h-11 rounded-full border-2 border-white shadow-sm bg-gradient-to-br from-[#049746] to-[#00CED1] p-0.5"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm"></span>
              </div>
              <div className="hidden lg:flex flex-col items-start leading-tight">
                <span className="text-xs font-bold text-gray-800 truncate max-w-[100px]">
                  {user ? user.userName : (loading ? '...' : 'Guest')}
                </span>
                <span className="text-[10px] text-teal-600 font-semibold uppercase tracking-tighter">
                  {user ? user.userType : 'Offline'}
                </span>
              </div>
            </button>

            {/* Glassmorphic Dropdown */}
            {isOpen && (
              <div
                className="absolute right-0 mt-3 w-72 rounded-2xl shadow-2xl border border-white/40 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300"
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(16px)',
                  webkitBackdropFilter: 'blur(16px)',
                }}
              >
                {/* Dropdown Header */}
                <div className="bg-gradient-to-br from-[#049746] to-[#008080] p-6 text-white text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <img
                      src="/images/m_002.png"
                      alt="User Avatar"
                      className="w-20 h-20 rounded-full border-4 border-white/20 shadow-xl mb-3"
                    />
                    <h4 className="text-xl font-bold truncate w-full px-2">
                      {user ? user.userName : (loading ? 'Loading...' : 'Welcome')}
                    </h4>
                    <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest mt-1">
                      {user ? user.userType : 'Authenticated User'}
                    </span>
                  </div>
                </div>

                {/* Dropdown Body */}
                <div className="p-4 space-y-3">
                  {user && user.email && (
                    <div className="flex items-center gap-3 px-3 py-2 text-gray-600">
                      <svg className="w-5 h-5 text-[#049746]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium truncate">{user.email}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Link to="/dashboard" onClick={() => setIsOpen(false)} className="group">
                      <div className="bg-teal-50 hover:bg-teal-600 text-teal-700 hover:text-white p-3 rounded-xl text-center transition-all duration-300 border border-teal-100 flex flex-col items-center gap-1">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span className="text-xs font-black uppercase tracking-tighter">Dashboard</span>
                      </div>
                    </Link>
                    <button onClick={handleSignOut} className="group">
                      <div className="bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white p-3 rounded-xl text-center transition-all duration-300 border border-rose-100 flex flex-col items-center gap-1 w-full">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="text-xs font-black uppercase tracking-tighter">Sign Out</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Dropdown Footer */}
                <div className="bg-gray-50/50 p-3 text-center border-t border-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                  Hospital Management v2.1
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
