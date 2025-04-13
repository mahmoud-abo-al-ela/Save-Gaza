import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  HomeIcon,
  CurrencyDollarIcon,
  FlagIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [navMenuOpen, setNavMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const dropdownRef = useRef(null);
  const navMenuRef = useRef(null);

  const mainNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
    { name: "Donations", href: "/donations", icon: CurrencyDollarIcon },
    { name: "Campaigns", href: "/campaigns", icon: FlagIcon },
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (navMenuRef.current && !navMenuRef.current.contains(event.target)) {
        setNavMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Optimize scroll effect for performance
  useEffect(() => {
    let animationFrameId;
    const handleScroll = () => {
      animationFrameId = requestAnimationFrame(() => {
        const scrollPosition = window.scrollY;
        const windowHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const progress = Math.min(
          100,
          windowHeight > 0 ? (scrollPosition / windowHeight) * 100 : 0
        );
        setScrollProgress(progress);
      });
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Compute styles based on scroll progress
  const isScrolled = scrollProgress > 2;
  const blurAmount = isScrolled ? "backdrop-blur-md" : "backdrop-blur-none";
  const bgOpacity = Math.min(95, 85 + scrollProgress * 0.1);
  const shadowSize = isScrolled
    ? scrollProgress > 10
      ? "shadow-md"
      : "shadow-sm"
    : "";

  // Handle mobile navigation link clicks
  const handleMobileNavClick = (href) => {
    // Close the mobile menu
    setNavMenuOpen(false);
    // Use setTimeout to ensure the menu closing animation completes before navigation
    setTimeout(() => {
      navigate(href);
    }, 50);
  };

  return (
    <nav
      className={`
        sticky 
        top-0 
        z-30 
        transition-all 
        duration-300 
        ${blurAmount} 
        ${shadowSize} 
        border-b 
        border-gray-200
      `}
      style={{
        background: isScrolled
          ? `linear-gradient(180deg, rgba(255, 255, 255, ${
              bgOpacity / 100
            }) 0%, rgba(249, 250, 251, ${(bgOpacity - 5) / 100}) 100%)`
          : "white",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16 md:h-18">
          <div className="flex items-center flex-1 min-w-0">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center mr-2 xs:mr-3 sm:mr-4 md:mr-6">
              <span className="text-emerald-600 font-bold text-base xs:text-lg sm:text-xl">
                Save Gaza
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:justify-center md:flex-1">
              <div className="flex space-x-2 lg:space-x-4 xl:space-x-6">
                {mainNavigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      px-2 
                      lg:px-3 
                      py-2 
                      rounded-md 
                      text-sm 
                      font-medium 
                      flex 
                      items-center 
                      transition-colors 
                      duration-200 
                      ease-in-out
                      ${
                        isActive(item.href)
                          ? "bg-emerald-100 text-emerald-700 shadow-sm"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }
                    `}
                  >
                    <item.icon
                      className={`
                        mr-1.5 
                        lg:mr-2 
                        h-4.5 
                        w-4.5 
                        lg:h-5 
                        lg:w-5 
                        transition-colors 
                        duration-200
                        ${
                          isActive(item.href)
                            ? "text-emerald-600"
                            : "text-gray-400 group-hover:text-gray-500"
                        }
                      `}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden" ref={navMenuRef}>
              <button
                type="button"
                className="
                  inline-flex 
                  items-center 
                  justify-center 
                  p-1.5
                  xs:p-2 
                  rounded-md 
                  text-gray-500 
                  hover:text-gray-600 
                  hover:bg-gray-100 
                  focus:outline-none 
                  focus:ring-2 
                  focus:ring-inset 
                  focus:ring-emerald-500 
                  transition-colors 
                  duration-200
                  h-9
                  w-9
                  xs:h-10 
                  xs:w-10
                "
                onClick={() => setNavMenuOpen(!navMenuOpen)}
                aria-expanded={navMenuOpen}
                aria-controls="mobile-menu"
              >
                <span className="sr-only">
                  {navMenuOpen ? "Close menu" : "Open menu"}
                </span>
                {navMenuOpen ? (
                  <XMarkIcon
                    className="h-5 w-5 xs:h-6 xs:w-6"
                    aria-hidden="true"
                  />
                ) : (
                  <Bars3Icon
                    className="h-5 w-5 xs:h-6 xs:w-6"
                    aria-hidden="true"
                  />
                )}
              </button>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-1 xs:space-x-2 sm:space-x-3">
            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  className="
                    flex 
                    items-center 
                    text-sm 
                    rounded-full 
                    focus:outline-none 
                    focus:ring-2 
                    focus:ring-offset-2 
                    focus:ring-emerald-500 
                    transition 
                    duration-200
                    p-1
                  "
                  id="user-menu"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <span className="sr-only">Open user menu</span>
                  <span className="hidden sm:block md:block mr-2 text-gray-700 font-medium text-sm">
                    {user.username}
                  </span>
                  <div
                    className="
                      h-7
                      w-7
                      xs:h-8 
                      xs:w-8 
                      rounded-full 
                      bg-emerald-100 
                      flex 
                      items-center 
                      justify-center 
                      text-emerald-600 
                      font-bold 
                      shadow-sm 
                      hover:bg-emerald-200 
                      transition-colors 
                      duration-200
                    "
                  >
                    {user.username?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                </button>
                {userMenuOpen && (
                  <div
                    className="
                      origin-top-right 
                      absolute 
                      right-0 
                      mt-2 
                      w-52
                      xs:w-56 
                      rounded-md 
                      shadow-lg 
                      py-1 
                      bg-white 
                      ring-1 
                      ring-black 
                      ring-opacity-5 
                      focus:outline-none 
                      z-50 
                      animate-fadeIn
                      max-h-[300px] 
                      overflow-y-auto
                    "
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu"
                  >
                    <div className="block px-4 py-3 text-sm text-gray-700 border-b">
                      <p className="font-medium">{user.username}</p>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {user.email}
                      </p>
                    </div>
                    <button
                      onClick={logout}
                      className="
                        flex 
                        w-full 
                        items-center 
                        text-left 
                        px-4 
                        py-2 
                        text-sm 
                        text-gray-700 
                        hover:bg-gray-100 
                        transition-colors 
                        duration-200
                      "
                      role="menuitem"
                    >
                      <ArrowRightOnRectangleIcon
                        className="mr-3 h-4 w-4 text-gray-400"
                        aria-hidden="true"
                      />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {navMenuOpen && (
        <div
          className="
            md:hidden 
            border-t 
            border-gray-200 
            bg-gray-50 
            shadow-inner 
            animate-fadeIn 
            z-20 
            relative
          "
          id="mobile-menu"
        >
          <div className="px-3 xs:px-4 pt-2 pb-3 space-y-1.5 mx-auto max-w-7xl">
            {mainNavigation.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  setNavMenuOpen(false);
                  navigate(item.href);
                }}
                className={`
                  w-full
                  block 
                  px-3
                  xs:px-4 
                  py-2.5 
                  rounded-md 
                  text-sm
                  xs:text-base 
                  font-medium 
                  flex 
                  items-center 
                  transition-colors 
                  duration-200
                  ${
                    isActive(item.href)
                      ? "bg-emerald-100 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }
                `}
              >
                <item.icon
                  className={`
                    mr-2
                    xs:mr-3 
                    h-5
                    w-5
                    xs:h-6 
                    xs:w-6 
                    ${
                      isActive(item.href) ? "text-emerald-600" : "text-gray-400"
                    }
                  `}
                  aria-hidden="true"
                />
                {item.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
