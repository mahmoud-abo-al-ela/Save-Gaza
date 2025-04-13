import { Link, useLocation } from "react-router-dom";
import {
  XMarkIcon,
  HomeIcon,
  UsersIcon,
  CurrencyDollarIcon,
  FlagIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const { user } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
    { name: "Donations", href: "/donations", icon: CurrencyDollarIcon },
    { name: "Campaigns", href: "/campaigns", icon: FlagIcon },
    { name: "Users", href: "/users", icon: UsersIcon },
  ];

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 sm:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } sm:translate-x-0 sm:static sm:h-auto sm:z-0
      `}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between px-4 py-3 sm:hidden">
          <span className="text-emerald-600 font-bold text-xl">Save Gaza</span>
          <button
            className="text-gray-500 hover:text-gray-600 focus:outline-none"
            onClick={toggleSidebar}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* User info */}
        <div className="px-4 py-5 border-b border-gray-200 sm:hidden">
          {user && (
            <div className="flex items-center">
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {user.username}
                </p>
                <p className="text-xs font-medium text-gray-500">
                  {user.email}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  group flex items-center px-2 py-2 text-sm font-medium rounded-md
                  ${
                    active
                      ? "bg-emerald-50 text-emerald-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
                onClick={() => {
                  if (window.innerWidth < 640) {
                    toggleSidebar();
                  }
                }}
              >
                <item.icon
                  className={`
                    mr-3 flex-shrink-0 h-6 w-6
                    ${
                      active
                        ? "text-emerald-500"
                        : "text-gray-400 group-hover:text-gray-500"
                    }
                  `}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
