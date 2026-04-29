import { ReactNode, useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { profilesApi, type Profile } from "@/lib/api";
import {
  Home, User, Users, MessageSquare, FileText, LogOut, Briefcase,
  Menu, X, ChevronRight, Sparkles, Shield, Lock, ChevronDown,
} from "lucide-react";
import geuLogo from "@/assets/geu-logo.png";

const baseNav = [
  { icon: Home, label: "Feed", path: "/dashboard", description: "Your alumni feed" },
  { icon: User, label: "Profile", path: "/dashboard/profile", description: "Edit your profile" },
  { icon: Users, label: "Network", path: "/dashboard/network", description: "Find alumni" },
  { icon: MessageSquare, label: "Messages", path: "/dashboard/messages", description: "Chat with peers" },
  { icon: FileText, label: "Resumes", path: "/dashboard/resumes", description: "Browse resumes" },
  { icon: Users, label: "Communities", path: "/dashboard/communities", description: "Join groups" },
  { icon: Briefcase, label: "Jobs", path: "/dashboard/jobs", description: "Job board" },
];

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const navItems = user?.is_admin
    ? [...baseNav, { icon: Shield, label: "Admin", path: "/dashboard/admin", description: "Admin tools" }]
    : baseNav;

  useEffect(() => {
    if (user) profilesApi.get(user.id).then(setProfile).catch(() => {});
  }, [user]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleSignOut = () => { signOut(); navigate("/"); };

  const displayName = profile?.full_name || user?.username || user?.email?.split("@")[0] || "Alumni";
  const initials = displayName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen gradient-mesh flex flex-col">
      <header className="sticky top-0 z-50 gradient-primary shadow-lg shadow-primary/10 animate-fade-down">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between px-4 lg:px-6 h-16">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center backdrop-blur-sm group-hover:bg-white/25 transition-colors">
              <img src={geuLogo} alt="GEU" className="w-6 h-6" />
            </div>
            <div className="hidden sm:block">
              <span className="font-heading font-bold text-white text-base tracking-tight">GEU Alumni</span>
              <span className="text-white/60 text-[10px] block leading-none -mt-0.5">Connect</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive ? "bg-white/20 text-white shadow-inner" : "text-white/75 hover:text-white hover:bg-white/10"
                  }`}>
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {isActive && <span className="absolute -bottom-[17px] left-1/2 -translate-x-1/2 w-8 h-0.5 bg-white rounded-full" />}
                </Link>
              );
            })}
          </nav>

          {/* User menu */}
          <div className="flex items-center gap-2">
            <div className="relative" ref={menuRef}>
              <button onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2.5 pl-2 hover:bg-white/10 px-2 py-1.5 rounded-lg transition-colors">
                <div className="hidden md:block text-right">
                  <p className="text-white text-sm font-medium leading-tight">{displayName}</p>
                  <p className="text-white/50 text-[11px] leading-tight">
                    {user?.is_admin ? (user.is_super_admin ? "Super Admin" : "Admin") : (profile?.headline?.slice(0, 30) || "Alumni")}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center overflow-hidden ring-2 ring-white/25">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} className="w-9 h-9 rounded-full object-cover" alt="" />
                  ) : (
                    <span className="text-white text-xs font-bold">{initials}</span>
                  )}
                </div>
                <ChevronDown className="hidden md:block w-3.5 h-3.5 text-white/70" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-card text-foreground rounded-xl shadow-xl border border-border overflow-hidden z-50 animate-fade-up">
                  <Link to="/dashboard/profile" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors">
                    <User className="w-4 h-4 text-primary" /> My Profile
                  </Link>
                  <Link to="/dashboard/change-password" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors">
                    <Lock className="w-4 h-4 text-secondary" /> Change Password
                  </Link>
                  {user?.is_admin && (
                    <Link to="/dashboard/admin" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors">
                      <Shield className="w-4 h-4 text-amber-600" /> Admin Dashboard
                    </Link>
                  )}
                  <button onClick={() => { setMenuOpen(false); handleSignOut(); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors border-t border-border">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
            <button className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t border-white/10 animate-fade-down">
            <nav className="px-3 py-3 space-y-0.5">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all ${
                      isActive ? "bg-white/15 text-white font-semibold" : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}>
                    <div className="flex items-center gap-3">
                      <item.icon className="w-[18px] h-[18px]" />
                      <div>
                        <span className="block">{item.label}</span>
                        <span className="text-[11px] opacity-60">{item.description}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-40" />
                  </Link>
                );
              })}
              <Link to="/dashboard/change-password" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all">
                <Lock className="w-[18px] h-[18px]" /> Change Password
              </Link>
              <button onClick={() => { handleSignOut(); setMobileOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all">
                <LogOut className="w-[18px] h-[18px]" /><span>Sign Out</span>
              </button>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 lg:px-6 py-6">{children}</main>

      <footer className="border-t border-border/50 mt-auto">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} GEU Alumni Connect — Graphic Era University</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Sparkles className="w-3 h-3 text-secondary" /><span>Connecting futures</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DashboardLayout;
