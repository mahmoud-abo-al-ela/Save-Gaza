import React, { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const location = useLocation();

  // Close mobile menu when navigating
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  // Handle scroll for sticky effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle clicking outside of user menu to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  return (
    <nav
      className={`${
        isScrolled
          ? "bg-white shadow-md py-1 sticky top-0 z-50"
          : "bg-white py-2"
      } transition-all duration-300 ease-in-out h-screen`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <NavLink to="/" className="flex items-center group">
                <img
                  src="support-gaza-logo.png"
                  alt="Support Gaza"
                  className="h-10 w-auto transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.target.src =
                      "https://via.placeholder.com/120x40?text=Support+Gaza";
                  }}
                />
                <span className="ml-2 text-xl font-bold text-emerald-700 group-hover:text-emerald-600 transition-colors duration-300">
                  Support Gaza
                </span>
              </NavLink>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? "border-emerald-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-emerald-300 hover:text-gray-700"
                  }`
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/donate"
                className={({ isActive }) =>
                  `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? "border-emerald-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-emerald-300 hover:text-gray-700"
                  }`
                }
              >
                Donate
              </NavLink>
              <NavLink
                to="/campaigns"
                className={({ isActive }) =>
                  `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? "border-emerald-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-emerald-300 hover:text-gray-700"
                  }`
                }
              >
                Campaigns
              </NavLink>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md transition-colors duration-200 ${
                      isActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
                    }`
                  }
                >
                  Dashboard
                </NavLink>

                {/* User menu dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={toggleUserMenu}
                    className="flex items-center text-sm font-medium text-gray-700 rounded-full hover:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200"
                  >
                    <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-medium">
                      {user?.email?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <span className="ml-2 truncate max-w-[140px]">
                      {user?.email}
                    </span>
                    <svg
                      className={`ml-1 h-4 w-4 transition-transform duration-200 ${
                        isUserMenuOpen ? "rotate-180" : "rotate-0"
                      }`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {/* Dropdown menu */}
                  <div
                    className={`${
                      isUserMenuOpen
                        ? "transform opacity-100 scale-100"
                        : "transform opacity-0 scale-95 pointer-events-none"
                    } transition-all duration-200 origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-50`}
                  >
                    <NavLink
                      to="/profile"
                      className={({ isActive }) =>
                        `block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                          isActive ? "bg-gray-100" : ""
                        }`
                      }
                    >
                      Your Profile
                    </NavLink>
                    <NavLink
                      to="/donations"
                      className={({ isActive }) =>
                        `block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                          isActive ? "bg-gray-100" : ""
                        }`
                      }
                    >
                      Donations
                    </NavLink>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <NavLink
                  to="/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-emerald-700 bg-white hover:bg-emerald-50 hover:text-emerald-800 transition-all duration-200 hover:shadow-sm"
                >
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm hover:shadow transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Register
                </NavLink>
              </div>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={toggleMobileMenu}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${isMobileMenuOpen ? "hidden" : "block"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${isMobileMenuOpen ? "block" : "hidden"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu - slide down animation */}
      <div
        className={`sm:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="pt-2 pb-3 space-y-1">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200 ${
                isActive
                  ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                  : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-emerald-300 hover:text-gray-700"
              }`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/donate"
            className={({ isActive }) =>
              `block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200 ${
                isActive
                  ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                  : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-emerald-300 hover:text-gray-700"
              }`
            }
          >
            Donate
          </NavLink>
          <NavLink
            to="/campaigns"
            className={({ isActive }) =>
              `block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200 ${
                isActive
                  ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                  : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-emerald-300 hover:text-gray-700"
              }`
            }
          >
            Campaigns
          </NavLink>
        </div>
        <div className="pt-4 pb-3 border-t border-gray-200">
          {isAuthenticated ? (
            <div className="space-y-1">
              <div className="px-4 py-2">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-medium">
                      {user?.email?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  </div>
                  <div className="ml-3 truncate">
                    <div className="text-sm font-medium text-gray-800">
                      {user?.email}
                    </div>
                  </div>
                </div>
              </div>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive
                      ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                      : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-emerald-300 hover:text-gray-700"
                  }`
                }
              >
                Your Profile
              </NavLink>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive
                      ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                      : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-emerald-300 hover:text-gray-700"
                  }`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/donations"
                className={({ isActive }) =>
                  `block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive
                      ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                      : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-emerald-300 hover:text-gray-700"
                  }`
                }
              >
                Donations
              </NavLink>
              <button
                onClick={logout}
                className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-red-600 hover:bg-gray-50 hover:border-red-300 transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="space-y-1 px-4 flex flex-col">
              <NavLink
                to="/login"
                className="py-2 text-base font-medium text-center text-emerald-700 hover:text-emerald-800 transition-colors duration-200"
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className="mt-2 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Register
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
