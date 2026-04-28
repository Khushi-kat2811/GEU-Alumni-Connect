// import { ReactNode, useState } from "react";
// import { Link, useLocation } from "react-router-dom";
// import { useAuth } from "@/contexts/AuthContext";
// import { Home, User, Users, MessageSquare, FileText, LogOut, Menu, X } from "lucide-react";

// const navItems = [
//   { icon: Home, label: "Feed", path: "/dashboard" },
//   { icon: User, label: "Profile", path: "/dashboard/profile" },
//   { icon: Users, label: "Network", path: "/dashboard/network" },
//   { icon: MessageSquare, label: "Messages", path: "/dashboard/messages" },
//   { icon: FileText, label: "Resumes", path: "/dashboard/resumes" },
// ];

// const DashboardLayout = ({ children }: { children: ReactNode }) => {
//   const { user, signOut } = useAuth();
//   const location = useLocation();
//   const [mobileOpen, setMobileOpen] = useState(false);

//   return (
//     <div className="min-h-screen bg-background">
//       {/* Top bar */}
//       <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-md">
//         <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
//           <Link to="/dashboard" className="font-heading font-bold text-lg">GEU Alumni</Link>
//           <nav className="hidden md:flex items-center gap-1">
//             {navItems.map((item) => (
//               <Link
//                 key={item.path}
//                 to={item.path}
//                 className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm transition-colors ${
//                   location.pathname === item.path
//                     ? "bg-primary-foreground/20 font-semibold"
//                     : "hover:bg-primary-foreground/10"
//                 }`}
//               >
//                 <item.icon className="w-4 h-4" />
//                 {item.label}
//               </Link>
//             ))}
//           </nav>
//           <div className="flex items-center gap-2">
//             <span className="hidden md:inline text-sm">{user?.email}</span>
//             <button onClick={signOut} className="p-2 hover:bg-primary-foreground/10 rounded-md" title="Sign out">
//               <LogOut className="w-4 h-4" />
//             </button>
//             <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
//               {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
//             </button>
//           </div>
//         </div>
//         {mobileOpen && (
//           <nav className="md:hidden border-t border-primary-foreground/20 px-4 py-2 space-y-1">
//             {navItems.map((item) => (
//               <Link
//                 key={item.path}
//                 to={item.path}
//                 onClick={() => setMobileOpen(false)}
//                 className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
//                   location.pathname === item.path ? "bg-primary-foreground/20 font-semibold" : ""
//                 }`}
//               >
//                 <item.icon className="w-4 h-4" />
//                 {item.label}
//               </Link>
//             ))}
//           </nav>
//         )}
//       </header>

//       {/* Content */}
//       <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
//     </div>
//   );
// };

// export default DashboardLayout;
import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { profilesApi, type Profile } from "@/lib/api";
import {
  Home, User, Users, MessageSquare, FileText, LogOut,
  Menu, X, ChevronRight, Bell, Sparkles, Shield,
} from "lucide-react";
import geuLogo from "@/assets/geu-logo.png";

const navItems = [
  { icon: Home, label: "Feed", path: "/dashboard", description: "Your alumni feed" },
  { icon: User, label: "Profile", path: "/dashboard/profile", description: "Edit your profile" },
  { icon: Users, label: "Network", path: "/dashboard/network", description: "Find alumni" },
  { icon: MessageSquare, label: "Messages", path: "/dashboard/messages", description: "Chat with peers" },
  { icon: FileText, label: "Resumes", path: "/dashboard/resumes", description: "Browse resumes" },
  { icon: Shield, label: "Communities", path: "/dashboard/communities", description: "Join groups" },
];

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (user) {
      profilesApi.get(user.id).then(setProfile).catch(() => {});
    }
  }, [user]);

  const handleSignOut = () => {
    signOut();
    navigate("/");
  };

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Alumni";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive ? "bg-white/20 text-white shadow-inner" : "text-white/75 hover:text-white hover:bg-white/10"
                  }`}>
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {isActive && <span className="absolute -bottom-[17px] left-1/2 -translate-x-1/2 w-8 h-0.5 bg-white rounded-full" />}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button className="relative p-2 text-white/75 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <Bell className="w-[18px] h-[18px]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary rounded-full ring-2 ring-[hsl(187,69%,28%)]" />
            </button>
            <div className="flex items-center gap-2.5 pl-2 border-l border-white/15">
              <div className="hidden md:block text-right">
                <p className="text-white text-sm font-medium leading-tight">{displayName}</p>
                <p className="text-white/50 text-[11px] leading-tight">
                  {profile?.headline ? profile.headline.slice(0, 30) : "Alumni"}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center overflow-hidden ring-2 ring-white/25">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} className="w-9 h-9 rounded-full object-cover" alt="" />
                ) : (
                  <span className="text-white text-xs font-bold">{initials}</span>
                )}
              </div>
            </div>
            <button onClick={handleSignOut} className="hidden md:flex items-center gap-1.5 text-white/60 hover:text-white text-xs px-2 py-1.5 rounded-md hover:bg-white/10 transition-colors" title="Sign out">
              <LogOut className="w-3.5 h-3.5" />
            </button>
            <button className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors" onClick={() => setMobileOpen(!mobileOpen)}>
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