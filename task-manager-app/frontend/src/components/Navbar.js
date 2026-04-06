
import { useContext, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";

export default function Navbar() {

  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return "";
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0][0];
    return parts[0][0] + parts[1][0];
  };

  return (
    <div className="bg-white shadow-sm">

      {/* TOP BAR */}
      <div className="bg-blue-600 text-white px-6 py-3 flex justify-between items-center">

        <h1 className="font-bold text-base tracking-wide">
          Enterprise Task Manager
        </h1>

        {/* USER AVATAR */}
        <div className="relative">

          <div
            onClick={() => setOpen(!open)}
            className="w-11 h-11 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold cursor-pointer border-2 border-white shadow-md"
          >
            {getInitials(user?.name).toUpperCase()}
          </div>

          {/* DROPDOWN */}
          {open && (
            <div className="absolute right-0 top-14 bg-white text-gray-700 shadow-lg rounded-lg w-56 border">

              {/* EMAIL */}
              <div className="px-4 py-3 border-b text-sm text-gray-600">
                {user?.email}
              </div>

              {/* LOGOUT */}
              <button
                onClick={logout}
                className="block w-full text-left px-4 py-2 hover:bg-red-100 text-red-500 text-sm"
              >
                Logout
              </button>

            </div>
          )}

        </div>

      </div>

      {/* TAB BAR */}
      <div className="px-6 flex gap-1 bg-white border-b border-gray-200">

        <Link
          to="/dashboard"
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            isActive("/dashboard")
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          Board
        </Link>

        <Link
          to="/analytics"
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            isActive("/analytics")
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          Analytics
        </Link>

      </div>

    </div>
  );
}