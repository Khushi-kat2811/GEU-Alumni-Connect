// import { useQuery, useQueryClient } from "@tanstack/react-query";
// import { profilesApi, connectionsApi } from "@/lib/api";
// import { useAuth } from "@/contexts/AuthContext";
// import DashboardLayout from "@/components/dashboard/DashboardLayout";
// import { User, UserPlus, UserCheck, Clock } from "lucide-react";
// import { toast } from "sonner";

// const Network = () => {
//   const { user }       = useAuth();
//   const queryClient    = useQueryClient();

//   const { data: allUsers = [] } = useQuery({
//     queryKey: ["all-users"],
//     queryFn:  () => profilesApi.all(),
//     enabled:  !!user,
//   });

//   const { data: connections = [] } = useQuery({
//     queryKey: ["connections"],
//     queryFn:  () => connectionsApi.list(),
//     enabled:  !!user,
//   });

//   const getStatus = (userId: string) => {
//     const conn = connections.find(
//       (c) =>
//         (c.requester_id === user!.id && c.addressee_id === userId) ||
//         (c.addressee_id === user!.id && c.requester_id === userId)
//     );
//     if (!conn) return "none";
//     if (conn.status === "accepted") return "connected";
//     if (conn.requester_id === user!.id) return "sent";
//     return "received";
//   };

//   const sendRequest = async (userId: string) => {
//     try {
//       await connectionsApi.send(userId);
//       toast.success("Connection request sent!");
//       queryClient.invalidateQueries({ queryKey: ["connections"] });
//     } catch (err: unknown) {
//       toast.error(err instanceof Error ? err.message : "Failed to send request");
//     }
//   };

//   const acceptRequest = async (userId: string) => {
//     try {
//       await connectionsApi.accept(userId);
//       toast.success("Connection accepted!");
//       queryClient.invalidateQueries({ queryKey: ["connections"] });
//     } catch {
//       toast.error("Failed to accept request");
//     }
//   };

//   return (
//     <DashboardLayout>
//       <div className="max-w-2xl mx-auto">
//         <h2 className="font-heading font-bold text-xl text-foreground mb-4">Alumni Network</h2>
//         <div className="grid gap-3">
//           {allUsers.map((profile) => {
//             const status = getStatus(profile.user_id);
//             return (
//               <div key={profile.id} className="bg-card rounded-xl shadow p-4 flex items-center gap-4">
//                 <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
//                   {profile.avatar_url ? (
//                     <img
//                       src={profile.avatar_url}
//                       className="w-12 h-12 rounded-full object-cover"
//                       alt=""
//                     />
//                   ) : (
//                     <User className="w-6 h-6 text-primary" />
//                   )}
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <p className="font-semibold text-sm text-foreground truncate">
//                     {profile.full_name || "Alumni"}
//                   </p>
//                   <p className="text-xs text-muted-foreground truncate">
//                     {profile.headline || ""}
//                   </p>
//                   {profile.graduation_year && (
//                     <p className="text-xs text-muted-foreground">Class of {profile.graduation_year}</p>
//                   )}
//                   {profile.resume_url && (
//                     <a
//                       href={profile.resume_url}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="text-xs text-secondary hover:underline"
//                     >
//                       View Resume
//                     </a>
//                   )}
//                 </div>
//                 <div>
//                   {status === "none" && (
//                     <button
//                       onClick={() => sendRequest(profile.user_id)}
//                       className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90"
//                     >
//                       <UserPlus className="w-3.5 h-3.5" /> Connect
//                     </button>
//                   )}
//                   {status === "sent" && (
//                     <span className="flex items-center gap-1 text-xs text-muted-foreground">
//                       <Clock className="w-3.5 h-3.5" /> Pending
//                     </span>
//                   )}
//                   {status === "received" && (
//                     <button
//                       onClick={() => acceptRequest(profile.user_id)}
//                       className="flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md hover:opacity-90"
//                     >
//                       <UserCheck className="w-3.5 h-3.5" /> Accept
//                     </button>
//                   )}
//                   {status === "connected" && (
//                     <span className="flex items-center gap-1 text-xs text-primary font-semibold">
//                       <UserCheck className="w-3.5 h-3.5" /> Connected
//                     </span>
//                   )}
//                 </div>
//               </div>
//             );
//           })}

//           {allUsers.length === 0 && (
//             <div className="bg-card rounded-xl shadow p-8 text-center">
//               <p className="text-muted-foreground">No other alumni found yet. Invite your friends!</p>
//             </div>
//           )}
//         </div>
//       </div>
//     </DashboardLayout>
//   );
// };

// export default Network;
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { profilesApi, connectionsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Link } from "react-router-dom";
import { User, UserPlus, UserCheck, Clock, Search, GraduationCap, Filter, Users as UsersIcon } from "lucide-react";
import { toast } from "sonner";

const Network = () => {
  const { user }       = useAuth();
  const queryClient    = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "connected" | "pending">("all");

  const { data: allUsers = [] } = useQuery({
    queryKey: ["all-users"],
    queryFn:  () => profilesApi.all(),
    enabled:  !!user,
  });

  const { data: connections = [] } = useQuery({
    queryKey: ["connections"],
    queryFn:  () => connectionsApi.list(),
    enabled:  !!user,
  });

  const getStatus = (userId: string) => {
    const conn = connections.find(
      (c) =>
        (c.requester_id === user!.id && c.addressee_id === userId) ||
        (c.addressee_id === user!.id && c.requester_id === userId)
    );
    if (!conn) return "none";
    if (conn.status === "accepted") return "connected";
    if (conn.requester_id === user!.id) return "sent";
    return "received";
  };

  const sendRequest = async (userId: string) => {
    try {
      await connectionsApi.send(userId);
      toast.success("Connection request sent!");
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send request");
    }
  };

  const acceptRequest = async (userId: string) => {
    try {
      await connectionsApi.accept(userId);
      toast.success("Connection accepted!");
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    } catch {
      toast.error("Failed to accept request");
    }
  };

  const filteredUsers = allUsers.filter((p) => {
    const matchesSearch =
      !search ||
      p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.headline?.toLowerCase().includes(search.toLowerCase()) ||
      p.graduation_year?.toString().includes(search);

    if (filter === "all") return matchesSearch;
    const status = getStatus(p.user_id);
    if (filter === "connected") return matchesSearch && status === "connected";
    if (filter === "pending") return matchesSearch && (status === "sent" || status === "received");
    return matchesSearch;
  });

  const connectedCount = allUsers.filter((p) => getStatus(p.user_id) === "connected").length;
  const pendingCount = allUsers.filter((p) => {
    const s = getStatus(p.user_id);
    return s === "sent" || s === "received";
  }).length;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* ── Header ────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 animate-fade-up">
          <div>
            <h2 className="font-heading font-bold text-2xl text-foreground flex items-center gap-2">
              <UsersIcon className="w-6 h-6 text-primary" />
              Alumni Network
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {allUsers.length} alumni • {connectedCount} connected
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, role, year..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
            />
          </div>
        </div>

        {/* ── Filter Tabs ───────────────────────────────── */}
        <div className="flex gap-2 mb-5 animate-fade-up delay-100">
          {([
            { key: "all", label: "All", count: allUsers.length },
            { key: "connected", label: "Connected", count: connectedCount },
            { key: "pending", label: "Pending", count: pendingCount },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === tab.key
                  ? "gradient-primary text-white shadow-md shadow-primary/15"
                  : "glass-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                filter === tab.key ? "bg-white/20" : "bg-muted"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* ── Alumni Grid ───────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredUsers.map((profile, i) => {
            const status = getStatus(profile.user_id);
            const initials = (profile.full_name || "A")
              .split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

            return (
              <div
                key={profile.id}
                className={`glass-card rounded-2xl p-5 hover-lift animate-fade-up`}
                style={{ animationDelay: `${Math.min(i * 50, 400)}ms` }}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/10 flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-border/50">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} className="w-14 h-14 rounded-lg object-cover" alt="" />
                    ) : (
                      <span className="text-primary font-bold text-lg">{initials}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link to={`/dashboard/profile/${profile.user_id}`} className="hover:underline">
                      <p className="font-semibold text-sm text-foreground">{profile.full_name || "Alumni"}</p>
                    </Link>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {profile.headline || "GEU Alumni"}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {profile.graduation_year && (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-primary/8 text-primary font-medium px-2 py-0.5 rounded-md">
                          <GraduationCap className="w-3 h-3" /> {profile.graduation_year}
                        </span>
                      )}
                      {profile.resume_url && (
                        <a href={profile.resume_url} target="_blank" rel="noopener noreferrer"
                          className="text-[11px] text-secondary font-medium hover:underline">
                          Resume ↗
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex-shrink-0 pt-1">
                    {status === "none" && (
                      <button
                        onClick={() => sendRequest(profile.user_id)}
                        className="flex items-center gap-1.5 text-xs gradient-primary text-white px-3.5 py-2 rounded-xl hover:opacity-90 transition-opacity shadow-sm font-medium"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Connect
                      </button>
                    )}
                    {status === "sent" && (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3.5 py-2 rounded-xl font-medium">
                        <Clock className="w-3.5 h-3.5" /> Pending
                      </span>
                    )}
                    {status === "received" && (
                      <button
                        onClick={() => acceptRequest(profile.user_id)}
                        className="flex items-center gap-1.5 text-xs bg-secondary text-white px-3.5 py-2 rounded-xl hover:opacity-90 transition-opacity shadow-sm font-medium"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Accept
                      </button>
                    )}
                    {status === "connected" && (
                      <span className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 px-3.5 py-2 rounded-xl font-semibold">
                        <UserCheck className="w-3.5 h-3.5" /> Connected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredUsers.length === 0 && (
          <div className="glass-card rounded-2xl p-12 text-center animate-scale-in">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="font-heading font-semibold text-lg text-foreground mb-1">No results found</h3>
            <p className="text-sm text-muted-foreground">
              {search ? "Try a different search term" : "No alumni found yet. Invite your friends!"}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Network;