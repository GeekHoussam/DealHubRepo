import logo from "../../assets/logo.svg";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function TopBar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const initials = (() => {
    const email = user.email || "dealhub";
    const namePart = email.split("@")[0];
    const parts = namePart.split(/[._-]+/).filter(Boolean);
    const letters = parts
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    return letters || "DH";
  })();

  const activeClass = "bg-[#E6ECF5] text-[#0B1F3B]";
  const idleClass = "hover:bg-gray-100";

  return (
    <div className="h-[72px] bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      <div className="flex items-center space-x-6">
        <Link to="/dashboard" className="flex items-center gap-3">
          <img src={logo} alt="DealHub Logo" className="w-8 h-8" />
          <h1 className="text-2xl text-[#0B1F3B]">DealHub</h1>
        </Link>
        <span className="text-sm text-[#6B7280]">
          Facility Agreement → Structured Deal Dataset
        </span>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link
            to="/dashboard"
            className={`px-3 py-1 rounded-lg ${
              location.pathname.startsWith("/dashboard")
                ? activeClass
                : idleClass
            }`}
          >
            Dashboard
          </Link>

          {/* Lender Inbox (only LENDER) */}
          {String(user.role).toUpperCase() === "LENDER" && (
            <Link
              to="/lender/inbox"
              className={`px-3 py-1 rounded-lg ${
                location.pathname.startsWith("/lender/inbox")
                  ? activeClass
                  : idleClass
              }`}
            >
              Inbox
            </Link>
          )}

          {/* Only Admin/Agent can Extract */}
          {String(user.role).toUpperCase() !== "LENDER" && (
            <Link
              to="/extract"
              className={`px-3 py-1 rounded-lg ${
                location.pathname.startsWith("/extract")
                  ? activeClass
                  : idleClass
              }`}
            >
              Extract
            </Link>
          )}

          {/*  Admin menu (only ADMIN) */}
          {String(user.role).toUpperCase() === "ADMIN" && (
            <Link
              to="/admin/users"
              className={`px-3 py-1 rounded-lg ${
                location.pathname.startsWith("/admin") ? activeClass : idleClass
              }`}
            >
              Admin
            </Link>
          )}
        </div>

        <div className="text-sm text-gray-600">
          <span className="px-3 py-1.5 bg-[#E6ECF5] text-[#0B1F3B] rounded-lg">
            {user.role}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="px-3 py-1.5 rounded-lg text-sm text-[#0B1F3B] hover:bg-gray-100 border border-gray-200"
        >
          Logout
        </button>

        <div className="w-10 h-10 bg-[#E6ECF5] rounded-full flex items-center justify-center text-[#0B1F3B] uppercase font-semibold">
          {initials}
        </div>
      </div>
    </div>
  );
}
