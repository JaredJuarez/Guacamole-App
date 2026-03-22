import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Home, ScanLine, LogOut } from "lucide-react";
import { useApp } from "../context/AppContext";
import { GuacamoleIcon } from "../components/common/GuacamoleLogo";

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { dispatch } = useApp();

  const handleLogout = () => {
    dispatch({ type: "CLEAR_SESSION" });
    navigate("/");
  };

  const navItems = [
    { path: "/app/dashboard", label: "Dashboard", icon: Home },
    { path: "/app/qr-scanner", label: "Recepción", icon: ScanLine },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/app/dashboard" className="flex items-center gap-2">
            <GuacamoleIcon size={28} />
            <span className="text-lg font-bold text-slate-900">Guacamole</span>
          </Link>

          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  location.pathname === item.path
                    ? "bg-green-50 text-primary"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition cursor-pointer ml-1"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6 pb-24">
        <Outlet />
      </main>
    </div>
  );
}
