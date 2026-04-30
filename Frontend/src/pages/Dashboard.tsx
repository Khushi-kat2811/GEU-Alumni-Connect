// import { useQuery } from "@tanstack/react-query";
// import { postsApi } from "@/lib/api";
// import { useAuth } from "@/contexts/AuthContext";
// import DashboardLayout from "@/components/dashboard/DashboardLayout";
// import CreatePost from "@/components/dashboard/CreatePost";
// import PostCard from "@/components/dashboard/PostCard";

// const Dashboard = () => {
//   const { user } = useAuth();

//   const { data: posts = [], isLoading } = useQuery({
//     queryKey: ["posts"],
//     queryFn: () => postsApi.list(),
//     enabled: !!user,
//   });

//   return (
//     <DashboardLayout>
//       <div className="max-w-2xl mx-auto">
//         <CreatePost />
//         {isLoading ? (
//           <p className="text-center text-muted-foreground py-8">Loading posts...</p>
//         ) : posts.length === 0 ? (
//           <div className="bg-card rounded-xl shadow p-8 text-center">
//             <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
//           </div>
//         ) : (
//           posts.map((post) => <PostCard key={post.id} post={post} />)
//         )}
//       </div>
//     </DashboardLayout>
//   );
// };

// export default Dashboard;
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { postsApi, profilesApi, connectionsApi, type Profile } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import CreatePost from "@/components/dashboard/CreatePost";
import PostCard from "@/components/dashboard/PostCard";
import {
  Users, FileText, MessageSquare, TrendingUp,
  ArrowRight, Sparkles, GraduationCap, Zap, Globe,
} from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (user) profilesApi.get(user.id).then(setProfile).catch(() => {});
  }, [user]);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: () => postsApi.list(),
    enabled: !!user,
  });

  const { data: connections = [] } = useQuery({
    queryKey: ["connections"],
    queryFn: () => connectionsApi.list(),
    enabled: !!user,
  });

  const { data: allProfiles = [] } = useQuery({
    queryKey: ["all-users"],
    queryFn: () => profilesApi.all(),
    enabled: !!user,
  });

  const acceptedConnections = connections.filter((c) => c.status === "accepted").length;
  const displayName = profile?.full_name?.split(" ")[0] || "there";

  const stats = [
    { icon: Users, label: "Connections", value: acceptedConnections, color: "text-primary", bg: "bg-primary/10", link: "/dashboard/network" },
    { icon: FileText, label: "Posts", value: posts.filter((p) => p.user_id === user?.id).length, color: "text-secondary", bg: "bg-secondary/10", link: "/dashboard" },
    { icon: Globe, label: "Alumni", value: allProfiles.length, color: "text-accent", bg: "bg-accent/10", link: "/dashboard/network" },
    { icon: TrendingUp, label: "Engagement", value: posts.reduce((a, p) => a + p.likes_count, 0), color: "text-emerald-600", bg: "bg-emerald-50", link: "/dashboard" },
  ];

  return (
    <DashboardLayout>
      {/* ── Welcome Banner ──────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl gradient-primary p-6 md:p-8 mb-6 animate-fade-up shadow-xl shadow-primary/10">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <div className="absolute top-4 right-8 animate-float">
          <GraduationCap className="w-12 h-12 text-white/10" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-secondary" />
            <span className="text-secondary text-xs font-semibold uppercase tracking-wider">Welcome Back</span>
          </div>
          <h1 className="font-heading font-bold text-2xl md:text-3xl text-white mb-1">
            Hey {displayName}! 👋
          </h1>
          <p className="text-white/70 text-sm md:text-base max-w-lg">
            Stay connected with your GEU community. Share updates, explore opportunities, and grow your network.
          </p>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mt-5">
            <Link
              to="/dashboard/network"
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-medium px-4 py-2 rounded-lg backdrop-blur-sm transition-colors"
            >
              <Users className="w-3.5 h-3.5" /> Explore Network
            </Link>
            <Link
              to="/dashboard/profile"
              className="flex items-center gap-1.5 bg-secondary/90 hover:bg-secondary text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Zap className="w-3.5 h-3.5" /> Update Profile
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map((stat, i) => (
          <Link
            key={stat.label}
            to={stat.link}
            className={`glass-card rounded-xl p-4 hover-lift cursor-pointer animate-fade-up delay-${(i + 1) * 100}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40" />
            </div>
            <p className="font-heading font-bold text-2xl text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* ── Main Content Grid ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Feed Column */}
        <div className="animate-fade-up delay-200">
          <CreatePost />
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="glass-card rounded-xl p-6 animate-pulse">
                  <div className="flex gap-3 mb-4">
                    <div className="w-11 h-11 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-muted rounded w-32" />
                      <div className="h-2.5 bg-muted rounded w-20" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-3 bg-muted rounded w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="glass-card rounded-2xl p-10 text-center animate-scale-in">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                No posts yet
              </h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                Be the first to share something with the alumni community!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post, i) => (
                <div key={post.id} className={`animate-fade-up delay-${Math.min(i * 75, 500)}`}>
                  <PostCard post={post} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <aside className="hidden lg:block space-y-4 animate-slide-right delay-300">
          {/* Profile Quick Card */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="h-20 gradient-primary relative">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                <div className="w-16 h-16 rounded-full bg-card border-4 border-card flex items-center justify-center overflow-hidden shadow-lg">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} className="w-16 h-16 rounded-full object-cover" alt="" />
                  ) : (
                    <span className="text-primary font-bold text-lg">
                      {(profile?.full_name || "A")[0].toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="pt-10 pb-4 px-4 text-center">
              <h3 className="font-heading font-semibold text-foreground">
                {profile?.full_name || "Alumni"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {profile?.headline || "Complete your profile"}
              </p>
              {profile?.graduation_year && (
                <span className="inline-flex items-center gap-1 mt-2 text-[11px] bg-primary/10 text-primary font-medium px-2.5 py-1 rounded-full">
                  <GraduationCap className="w-3 h-3" />
                  Class of {profile.graduation_year}
                </span>
              )}
              <Link
                to="/dashboard/profile"
                className="block mt-3 text-xs text-secondary font-semibold hover:underline"
              >
                Edit Profile →
              </Link>
            </div>
          </div>

          {/* Suggested Connections */}
          <div className="glass-card rounded-2xl p-4">
            <h3 className="font-heading font-semibold text-sm text-foreground flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-primary" />
              People You May Know
            </h3>
            {allProfiles.slice(0, 4).map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} className="w-9 h-9 rounded-full object-cover" alt="" />
                  ) : (
                    <span className="text-primary text-xs font-bold">
                      {(p.full_name || "A")[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.full_name || "Alumni"}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{p.headline || ""}</p>
                </div>
              </div>
            ))}
            {allProfiles.length > 4 && (
              <Link
                to="/dashboard/network"
                className="flex items-center justify-center gap-1 text-xs text-secondary font-semibold mt-3 hover:underline"
              >
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            )}
            {allProfiles.length === 0 && (
              <p className="text-xs text-muted-foreground py-2">No alumni found yet.</p>
            )}
          </div>

          {/* Quick Links */}
          <div className="glass-card rounded-2xl p-4">
            <h3 className="font-heading font-semibold text-sm text-foreground mb-3">
              Quick Links
            </h3>
            <div className="space-y-1">
              {[
                { label: "Browse Resumes", icon: FileText, path: "/dashboard/resumes", color: "text-secondary" },
                { label: "Messages", icon: MessageSquare, path: "/dashboard/messages", color: "text-primary" },
                { label: "My Profile", icon: Zap, path: "/dashboard/profile", color: "text-accent" },
              ].map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted/60 transition-colors group"
                >
                  <link.icon className={`w-4 h-4 ${link.color}`} />
                  <span>{link.label}</span>
                  <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-60 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;