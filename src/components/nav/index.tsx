import React from "react";
import { Link, useLocation } from "react-router";

export const Nav: React.FC = () => {
  const sessionId = localStorage.getItem("august-session-id");
  const location = useLocation();
  const path = location.pathname;

  const handleLogout = () => {
    localStorage.removeItem("august-session-id");
    localStorage.removeItem("august-temp-apology");
    localStorage.removeItem("august-temp-subject");
    window.location.reload();
  };

  const linkClass = (p: string) =>
    `text-lg font-medium transition ${
      path === p ? "text-[#DCC7FF] underline" : "text-white/90 hover:text-white"
    }`;

  const hideLogin = path === "/login";

  return (
    <div className="fixed top-3 left-0 right-0 flex justify-center z-50 pointer-events-auto">
      <div className="w-full max-w-4xl mx-4 flex items-center justify-between bg-slate-900/75 backdrop-blur-md px-4 py-2 rounded-xl shadow-xl border border-slate-800/30">
        <div className="flex items-center gap-4">
          <Link to="/" className={linkClass("/")}>
            <span className="font-semibold">August</span>
          </Link>
          <Link to="/apology" className={linkClass("/apology")}>
            Apology
          </Link>
        </div>

        <div>
          {!sessionId ? (
            !hideLogin ? (
              <Link
                to="/login"
                className="bg-[#8956FB] text-white px-3 py-1 rounded-md hover:bg-[#7741d5] transition-shadow shadow-sm"
              >
                Log in
              </Link>
            ) : null
          ) : (
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-shadow shadow-sm"
            >
              Log out
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
