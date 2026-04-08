import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Home, User, Users, MessageSquare, FileText, LogOut, Menu, X } from "lucide-react";

const navItems = [
  { icon: Home, label: "Feed", path: "/dashboard" },
  { icon: User, label: "Profile", path: "/dashboard/profile" },
  { icon: Users, label: "Network", path: "/dashboard/network" },
  { icon: MessageSquare, label: "Messages", path: "/dashboard/messages" },
  { icon: FileText, label: "Resumes", path: "/dashboard/resumes" },
];

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
          <Link to="/dashboard" className="font-heading font-bold text-lg">GEU Alumni</Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  location.pathname === item.path
                    ? "bg-primary-foreground/20 font-semibold"
                    : "hover:bg-primary-foreground/10"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden md:inline text-sm">{user?.email}</span>
            <button onClick={signOut} className="p-2 hover:bg-primary-foreground/10 rounded-md" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
            <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <nav className="md:hidden border-t border-primary-foreground/20 px-4 py-2 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                  location.pathname === item.path ? "bg-primary-foreground/20 font-semibold" : ""
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
};

export default DashboardLayout;
