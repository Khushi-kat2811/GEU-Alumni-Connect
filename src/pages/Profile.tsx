import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { User, Upload } from "lucide-react";
import { toast } from "sonner";

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({ full_name: "", headline: "", bio: "", graduation_year: "", avatar_url: "", resume_url: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).single().then(({ data }) => {
      if (data) setProfile({
        full_name: data.full_name || "",
        headline: data.headline || "",
        bio: data.bio || "",
        graduation_year: data.graduation_year?.toString() || "",
        avatar_url: data.avatar_url || "",
        resume_url: data.resume_url || "",
      });
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name,
      headline: profile.headline,
      bio: profile.bio,
      graduation_year: profile.graduation_year ? parseInt(profile.graduation_year) : null,
    }).eq("user_id", user.id);
    setLoading(false);
    if (error) toast.error("Failed to update profile");
    else toast.success("Profile updated!");
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const path = `${user.id}/${file.name}`;
    const { error } = await supabase.storage.from("resumes").upload(path, file, { upsert: true });
    if (error) { toast.error("Upload failed"); return; }
    const { data: { publicUrl } } = supabase.storage.from("resumes").getPublicUrl(path);
    await supabase.from("profiles").update({ resume_url: publicUrl }).eq("user_id", user.id);
    setProfile((p) => ({ ...p, resume_url: publicUrl }));
    toast.success("Resume uploaded!");
  };

  const inputClass = "w-full px-4 py-2.5 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="bg-card rounded-xl shadow p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} className="w-20 h-20 rounded-full object-cover" alt="" />
              ) : (
                <User className="w-10 h-10 text-primary" />
              )}
            </div>
            <div>
              <h2 className="font-heading font-bold text-xl text-foreground">{profile.full_name || "Your Name"}</h2>
              <p className="text-sm text-muted-foreground">{profile.headline || "Add a headline"}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
              <input value={profile.full_name} onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Headline</label>
              <input value={profile.headline} onChange={(e) => setProfile((p) => ({ ...p, headline: e.target.value }))} placeholder="e.g. Software Engineer at Google" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Bio</label>
              <textarea value={profile.bio} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} rows={3} className={inputClass + " resize-none"} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Graduation Year</label>
              <input type="number" value={profile.graduation_year} onChange={(e) => setProfile((p) => ({ ...p, graduation_year: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Resume / CV</label>
              {profile.resume_url && (
                <a href={profile.resume_url} target="_blank" rel="noopener noreferrer" className="text-sm text-secondary hover:underline mb-2 block">View current resume</a>
              )}
              <label className="flex items-center gap-2 bg-muted text-foreground px-4 py-2.5 rounded-md text-sm cursor-pointer hover:bg-muted/80">
                <Upload className="w-4 h-4" /> Upload Resume (PDF)
                <input type="file" accept=".pdf" onChange={handleResumeUpload} className="hidden" />
              </label>
            </div>
            <button onClick={handleSave} disabled={loading} className="w-full bg-primary text-primary-foreground py-2.5 rounded-md font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity">
              {loading ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
