// import { useState, useEffect } from "react";
// import { useAuth } from "@/contexts/AuthContext";
// import { profilesApi } from "@/lib/api";
// import DashboardLayout from "@/components/dashboard/DashboardLayout";
// import { User, Upload, Camera } from "lucide-react";
// import { toast } from "sonner";

// const Profile = () => {
//   const { user } = useAuth();
//   const [profile, setProfile] = useState({
//     full_name:       "",
//     headline:        "",
//     bio:             "",
//     graduation_year: "",
//     avatar_url:      "",
//     resume_url:      "",
//   });
//   const [saving, setSaving]   = useState(false);

//   // Load profile on mount
//   useEffect(() => {
//     if (!user) return;
//     profilesApi.get(user.id).then((data) => {
//       if (data) {
//         setProfile({
//           full_name:       data.full_name       || "",
//           headline:        data.headline        || "",
//           bio:             data.bio             || "",
//           graduation_year: data.graduation_year?.toString() || "",
//           avatar_url:      data.avatar_url      || "",
//           resume_url:      data.resume_url      || "",
//         });
//       }
//     });
//   }, [user]);

//   const handleSave = async () => {
//     if (!user) return;
//     setSaving(true);
//     try {
//       await profilesApi.update(user.id, {
//         full_name:       profile.full_name,
//         headline:        profile.headline,
//         bio:             profile.bio,
//         graduation_year: profile.graduation_year ? parseInt(profile.graduation_year) : "",
//       });
//       toast.success("Profile updated!");
//     } catch {
//       toast.error("Failed to update profile");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file || !user) return;
//     try {
//       const { resume_url } = await profilesApi.uploadResume(user.id, file);
//       setProfile((p) => ({ ...p, resume_url }));
//       toast.success("Resume uploaded!");
//     } catch {
//       toast.error("Resume upload failed");
//     }
//   };

//   const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file || !user) return;
//     try {
//       const { avatar_url } = await profilesApi.uploadAvatar(user.id, file);
//       setProfile((p) => ({ ...p, avatar_url }));
//       toast.success("Avatar updated!");
//     } catch {
//       toast.error("Avatar upload failed");
//     }
//   };

//   const inputClass =
//     "w-full px-4 py-2.5 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring";

//   return (
//     <DashboardLayout>
//       <div className="max-w-2xl mx-auto">
//         <div className="bg-card rounded-xl shadow p-6">

//           {/* Avatar + name header */}
//           <div className="flex items-center gap-4 mb-6">
//             <div className="relative">
//               <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
//                 {profile.avatar_url ? (
//                   <img
//                     src={profile.avatar_url}
//                     className="w-20 h-20 rounded-full object-cover"
//                     alt="avatar"
//                   />
//                 ) : (
//                   <User className="w-10 h-10 text-primary" />
//                 )}
//               </div>
//               {/* Avatar upload button */}
//               <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 cursor-pointer hover:opacity-90 transition-opacity">
//                 <Camera className="w-3.5 h-3.5" />
//                 <input
//                   type="file"
//                   accept="image/*"
//                   onChange={handleAvatarUpload}
//                   className="hidden"
//                 />
//               </label>
//             </div>
//             <div>
//               <h2 className="font-heading font-bold text-xl text-foreground">
//                 {profile.full_name || "Your Name"}
//               </h2>
//               <p className="text-sm text-muted-foreground">
//                 {profile.headline || "Add a headline"}
//               </p>
//             </div>
//           </div>

//           {/* Form fields */}
//           <div className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
//               <input
//                 value={profile.full_name}
//                 onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
//                 className={inputClass}
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-foreground mb-1">Headline</label>
//               <input
//                 value={profile.headline}
//                 onChange={(e) => setProfile((p) => ({ ...p, headline: e.target.value }))}
//                 placeholder="e.g. Software Engineer at Google"
//                 className={inputClass}
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-foreground mb-1">Bio</label>
//               <textarea
//                 value={profile.bio}
//                 onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
//                 rows={3}
//                 className={inputClass + " resize-none"}
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-foreground mb-1">
//                 Graduation Year
//               </label>
//               <input
//                 type="number"
//                 value={profile.graduation_year}
//                 onChange={(e) => setProfile((p) => ({ ...p, graduation_year: e.target.value }))}
//                 placeholder="2020"
//                 className={inputClass}
//               />
//             </div>

//             {/* Resume */}
//             <div>
//               <label className="block text-sm font-medium text-foreground mb-1">Resume / CV</label>
//               {profile.resume_url && (
//                 <a
//                   href={profile.resume_url}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="text-sm text-secondary hover:underline mb-2 block"
//                 >
//                   View current resume ↗
//                 </a>
//               )}
//               <label className="flex items-center gap-2 bg-muted text-foreground px-4 py-2.5 rounded-md text-sm cursor-pointer hover:bg-muted/80 w-fit">
//                 <Upload className="w-4 h-4" />
//                 {profile.resume_url ? "Replace Resume (PDF)" : "Upload Resume (PDF)"}
//                 <input
//                   type="file"
//                   accept=".pdf"
//                   onChange={handleResumeUpload}
//                   className="hidden"
//                 />
//               </label>
//             </div>

//             <button
//               onClick={handleSave}
//               disabled={saving}
//               className="w-full bg-primary text-primary-foreground py-2.5 rounded-md font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
//             >
//               {saving ? "Saving..." : "Save Profile"}
//             </button>
//           </div>
//         </div>
//       </div>
//     </DashboardLayout>
//   );
// };

// export default Profile;
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { profilesApi } from "@/lib/api";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { User, Upload, Camera, Briefcase, GraduationCap, FileText, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    full_name: "", headline: "", bio: "", graduation_year: "",
    avatar_url: "", resume_url: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    profilesApi.get(user.id).then((data) => {
      if (data) {
        setProfile({
          full_name: data.full_name || "", headline: data.headline || "",
          bio: data.bio || "", graduation_year: data.graduation_year?.toString() || "",
          avatar_url: data.avatar_url || "", resume_url: data.resume_url || "",
        });
      }
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await profilesApi.update(user.id, {
        full_name: profile.full_name, headline: profile.headline,
        bio: profile.bio,
        graduation_year: profile.graduation_year ? parseInt(profile.graduation_year) : "",
      });
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      const { resume_url } = await profilesApi.uploadResume(user.id, file);
      setProfile((p) => ({ ...p, resume_url }));
      toast.success("Resume uploaded!");
    } catch { toast.error("Resume upload failed"); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      const { avatar_url } = await profilesApi.uploadAvatar(user.id, file);
      setProfile((p) => ({ ...p, avatar_url }));
      toast.success("Avatar updated!");
    } catch { toast.error("Avatar upload failed"); }
  };

  const completeness = [
    !!profile.full_name, !!profile.headline, !!profile.bio,
    !!profile.graduation_year, !!profile.avatar_url, !!profile.resume_url,
  ].filter(Boolean).length;
  const completionPct = Math.round((completeness / 6) * 100);

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        {/* ── Cover + Avatar Section ──────────────────── */}
        <div className="glass-card rounded-2xl overflow-hidden mb-6 animate-fade-up">
          {/* Cover banner */}
          <div className="h-36 md:h-44 gradient-primary relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,hsla(0,0%,100%,0.1),transparent_60%)]" />
            <div className="absolute top-4 right-4 animate-float">
              <GraduationCap className="w-16 h-16 text-white/10" />
            </div>
          </div>

          {/* Avatar overlay */}
          <div className="relative px-6 pb-5">
            <div className="absolute -top-12 left-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl bg-card border-4 border-card flex items-center justify-center overflow-hidden shadow-xl">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} className="w-24 h-24 rounded-xl object-cover" alt="avatar" />
                  ) : (
                    <User className="w-12 h-12 text-primary/40" />
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 bg-primary text-white rounded-lg p-1.5 cursor-pointer hover:opacity-90 transition-opacity shadow-md group-hover:scale-110 transition-transform">
                  <Camera className="w-3.5 h-3.5" />
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div className="pt-14 flex items-start justify-between">
              <div>
                <h2 className="font-heading font-bold text-xl text-foreground">
                  {profile.full_name || "Your Name"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {profile.headline || "Add a headline to stand out"}
                </p>
              </div>
              <div className="hidden md:block">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Profile</span>
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full gradient-primary rounded-full transition-all duration-500"
                      style={{ width: `${completionPct}%` }}
                    />
                  </div>
                  <span className="font-semibold text-primary">{completionPct}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Completion Prompt ────────────────────────── */}
        {completionPct < 100 && (
          <div className="glass-card rounded-2xl p-4 mb-6 flex items-center gap-3 animate-fade-up delay-100 border-l-4 border-secondary">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Complete your profile</p>
              <p className="text-xs text-muted-foreground">
                Profiles with all fields filled get 3× more views from fellow alumni.
              </p>
            </div>
          </div>
        )}

        {/* ── Edit Form ───────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-6 animate-fade-up delay-200">
          {/* Left Column - Basic Info */}
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <h3 className="font-heading font-semibold text-base text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Basic Information
            </h3>

            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Full Name</label>
              <input
                value={profile.full_name}
                onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Headline</label>
              <input
                value={profile.headline}
                onChange={(e) => setProfile((p) => ({ ...p, headline: e.target.value }))}
                placeholder="e.g. Software Engineer at Google"
                className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                <div className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> Graduation Year</div>
              </label>
              <input
                type="number"
                value={profile.graduation_year}
                onChange={(e) => setProfile((p) => ({ ...p, graduation_year: e.target.value }))}
                placeholder="2020" min="1990" max="2030"
                className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
              />
            </div>
          </div>

          {/* Right Column - Bio & Docs */}
          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-6 space-y-5">
              <h3 className="font-heading font-semibold text-base text-foreground flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-secondary" /> About & Documents
              </h3>
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Bio</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                  rows={4} placeholder="Tell fellow alumni about yourself..."
                  className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-shadow"
                />
              </div>

              {/* Resume */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                  <div className="flex items-center gap-1"><FileText className="w-3 h-3" /> Resume / CV</div>
                </label>
                {profile.resume_url && (
                  <a href={profile.resume_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-secondary hover:underline mb-2">
                    <Check className="w-3.5 h-3.5" /> View current resume ↗
                  </a>
                )}
                <label className="flex items-center gap-2 bg-muted/60 hover:bg-muted text-foreground px-4 py-3 rounded-xl text-sm cursor-pointer transition-colors w-full justify-center border border-dashed border-border">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {profile.resume_url ? "Replace Resume (PDF)" : "Upload Resume (PDF)"}
                  </span>
                  <input type="file" accept=".pdf" onChange={handleResumeUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ── Save Button ─────────────────────────────── */}
        <div className="mt-6 animate-fade-up delay-300">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full gradient-primary text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>Saving...</>
            ) : (
              <><Check className="w-4 h-4" /> Save Profile</>
            )}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;