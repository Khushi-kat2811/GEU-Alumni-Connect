import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { FileText, User } from "lucide-react";

const Resumes = () => {
  const { user } = useAuth();

  const { data: profiles = [] } = useQuery({
    queryKey: ["resumes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .neq("resume_url", "")
        .not("resume_url", "is", null);
      return data || [];
    },
    enabled: !!user,
  });

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <h2 className="font-heading font-bold text-xl text-foreground mb-4">Alumni Resumes</h2>
        <div className="grid gap-3">
          {profiles.map((profile) => (
            <div key={profile.id} className="bg-card rounded-xl shadow p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} className="w-12 h-12 rounded-full object-cover" alt="" />
                ) : (
                  <User className="w-6 h-6 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground">{profile.full_name || "Alumni"}</p>
                <p className="text-xs text-muted-foreground">{profile.headline || ""}</p>
                {profile.graduation_year && <p className="text-xs text-muted-foreground">Class of {profile.graduation_year}</p>}
              </div>
              <a
                href={profile.resume_url!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md hover:opacity-90"
              >
                <FileText className="w-3.5 h-3.5" /> View Resume
              </a>
            </div>
          ))}
          {profiles.length === 0 && (
            <div className="bg-card rounded-xl shadow p-8 text-center">
              <p className="text-muted-foreground">No resumes uploaded yet. Upload yours from your profile!</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Resumes;
