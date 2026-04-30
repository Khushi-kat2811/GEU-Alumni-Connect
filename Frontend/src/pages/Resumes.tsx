// import { useQuery } from "@tanstack/react-query";
// import { resumesApi } from "@/lib/api";
// import { useAuth } from "@/contexts/AuthContext";
// import DashboardLayout from "@/components/dashboard/DashboardLayout";
// import { FileText, User } from "lucide-react";

// const Resumes = () => {
//   const { user } = useAuth();

//   const { data: profiles = [], isLoading } = useQuery({
//     queryKey: ["resumes"],
//     queryFn:  () => resumesApi.list(),
//     enabled:  !!user,
//   });

//   return (
//     <DashboardLayout>
//       <div className="max-w-2xl mx-auto">
//         <h2 className="font-heading font-bold text-xl text-foreground mb-4">Alumni Resumes</h2>
//         <div className="grid gap-3">
//           {isLoading && (
//             <p className="text-center text-muted-foreground py-8">Loading resumes...</p>
//           )}

//           {!isLoading && profiles.map((profile) => (
//             <div key={profile.id} className="bg-card rounded-xl shadow p-4 flex items-center gap-4">
//               <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
//                 {profile.avatar_url ? (
//                   <img
//                     src={profile.avatar_url}
//                     className="w-12 h-12 rounded-full object-cover"
//                     alt=""
//                   />
//                 ) : (
//                   <User className="w-6 h-6 text-primary" />
//                 )}
//               </div>
//               <div className="flex-1 min-w-0">
//                 <p className="font-semibold text-sm text-foreground">
//                   {profile.full_name || "Alumni"}
//                 </p>
//                 <p className="text-xs text-muted-foreground">{profile.headline || ""}</p>
//                 {profile.graduation_year && (
//                   <p className="text-xs text-muted-foreground">Class of {profile.graduation_year}</p>
//                 )}
//               </div>
//               <a
//                 href={profile.resume_url!}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="flex items-center gap-1.5 text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md hover:opacity-90"
//               >
//                 <FileText className="w-3.5 h-3.5" /> View Resume
//               </a>
//             </div>
//           ))}

//           {!isLoading && profiles.length === 0 && (
//             <div className="bg-card rounded-xl shadow p-8 text-center">
//               <p className="text-muted-foreground">
//                 No resumes uploaded yet. Upload yours from your profile!
//               </p>
//             </div>
//           )}
//         </div>
//       </div>
//     </DashboardLayout>
//   );
// };

// export default Resumes;
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { resumesApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { FileText, User, ExternalLink, Search, Download, GraduationCap, Briefcase } from "lucide-react";

const Resumes = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["resumes"],
    queryFn:  () => resumesApi.list(),
    enabled:  !!user,
  });

  const filtered = profiles.filter((p) =>
    !search ||
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.headline?.toLowerCase().includes(search.toLowerCase()) ||
    p.graduation_year?.toString().includes(search)
  );

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* ── Header ────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 animate-fade-up">
          <div>
            <h2 className="font-heading font-bold text-2xl text-foreground flex items-center gap-2">
              <FileText className="w-6 h-6 text-secondary" />
              Alumni Resumes
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {profiles.length} resume{profiles.length !== 1 ? "s" : ""} shared by the community
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, role..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
            />
          </div>
        </div>

        {/* ── Resume Grid ───────────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="glass-card rounded-2xl p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-32" />
                    <div className="h-3 bg-muted rounded w-48" />
                    <div className="h-3 bg-muted rounded w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center animate-scale-in">
            <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-secondary/50" />
            </div>
            <h3 className="font-heading font-semibold text-lg text-foreground mb-1">
              {search ? "No results found" : "No resumes available"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {search
                ? "Try a different search term"
                : "Resumes are private — only your accepted connections share theirs with you. Connect with alumni from the Network page to view their resumes here."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((profile, i) => {
              const initials = (profile.full_name || "A")
                .split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

              return (
                <div
                  key={profile.id}
                  className="glass-card rounded-2xl p-5 hover-lift group animate-fade-up"
                  style={{ animationDelay: `${Math.min(i * 50, 400)}ms` }}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary/15 to-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-border/50">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} className="w-14 h-14 rounded-lg object-cover" alt="" />
                      ) : (
                        <span className="text-secondary font-bold text-lg">{initials}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground">{profile.full_name || "Alumni"}</p>
                      {profile.headline && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                          <Briefcase className="w-3 h-3 flex-shrink-0" /> {profile.headline}
                        </p>
                      )}
                      {profile.graduation_year && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <GraduationCap className="w-3 h-3" /> Class of {profile.graduation_year}
                        </p>
                      )}

                      {/* Action */}
                      <a
                        href={profile.resume_url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-white gradient-warm px-4 py-2 rounded-xl hover:opacity-90 transition-opacity shadow-sm"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> View Resume
                      </a>
                    </div>

                    {/* Download icon */}
                    <a
                      href={profile.resume_url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg text-muted-foreground/40 hover:text-secondary hover:bg-secondary/5 transition-colors opacity-0 group-hover:opacity-100"
                      title="Open resume"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Resumes;