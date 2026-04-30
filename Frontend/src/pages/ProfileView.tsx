import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { profilesApi } from "@/lib/api";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { User, Briefcase, GraduationCap, FileText, ArrowLeft, MessageSquare } from "lucide-react";

const ProfileView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    profilesApi.get(id).then((data) => {
      setProfile(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[400px]">
          <div className="animate-pulse text-muted-foreground">Loading profile...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <h2 className="text-xl font-bold">Profile not found</h2>
          <button onClick={() => navigate(-1)} className="text-primary hover:underline mt-4">Go back</button>
        </div>
      </DashboardLayout>
    );
  }

  const initials = (profile.full_name || "A")
    .split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="glass-card rounded-2xl overflow-hidden mb-6 animate-fade-up">
          <div className="h-36 md:h-44 gradient-primary relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,hsla(0,0%,100%,0.1),transparent_60%)]" />
          </div>

          <div className="relative px-6 pb-5">
            <div className="absolute -top-12 left-6">
              <div className="w-24 h-24 rounded-2xl bg-card border-4 border-card flex items-center justify-center overflow-hidden shadow-xl">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} className="w-24 h-24 rounded-xl object-cover" alt="avatar" />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-2xl">{initials}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-14 flex items-start justify-between">
              <div>
                <h2 className="font-heading font-bold text-2xl text-foreground">
                  {profile.full_name || "Alumni"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {profile.headline || "GEU Alumni"}
                </p>
              </div>
              <button 
                onClick={() => navigate("/dashboard/messages")}
                className="bg-primary text-white p-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-md flex items-center gap-2 text-sm font-medium"
              >
                <MessageSquare className="w-4 h-4" /> Message
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 animate-fade-up delay-100">
          <div className="md:col-span-2 space-y-6">
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-heading font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" /> About
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {profile.bio || "No bio provided yet."}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-heading font-semibold text-base text-foreground mb-4 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-secondary" /> Education
              </h3>
              <div className="space-y-1">
                <p className="text-sm font-medium">Graphic Era University</p>
                {profile.graduation_year && (
                  <p className="text-xs text-muted-foreground">Class of {profile.graduation_year}</p>
                )}
              </div>
            </div>

            {profile.resume_url && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-heading font-semibold text-base text-foreground mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Resume
                </h3>
                <a 
                  href={profile.resume_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-muted/50 hover:bg-muted text-foreground py-2.5 rounded-xl text-sm font-medium transition-colors border border-border"
                >
                  View Resume ↗
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfileView;
