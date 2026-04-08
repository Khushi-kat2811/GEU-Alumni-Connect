import { useQuery, useQueryClient } from "@tanstack/react-query";
import { profilesApi, connectionsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { User, UserPlus, UserCheck, Clock } from "lucide-react";
import { toast } from "sonner";

const Network = () => {
  const { user }       = useAuth();
  const queryClient    = useQueryClient();

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

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <h2 className="font-heading font-bold text-xl text-foreground mb-4">Alumni Network</h2>
        <div className="grid gap-3">
          {allUsers.map((profile) => {
            const status = getStatus(profile.user_id);
            return (
              <div key={profile.id} className="bg-card rounded-xl shadow p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      className="w-12 h-12 rounded-full object-cover"
                      alt=""
                    />
                  ) : (
                    <User className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">
                    {profile.full_name || "Alumni"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {profile.headline || ""}
                  </p>
                  {profile.graduation_year && (
                    <p className="text-xs text-muted-foreground">Class of {profile.graduation_year}</p>
                  )}
                  {profile.resume_url && (
                    <a
                      href={profile.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-secondary hover:underline"
                    >
                      View Resume
                    </a>
                  )}
                </div>
                <div>
                  {status === "none" && (
                    <button
                      onClick={() => sendRequest(profile.user_id)}
                      className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Connect
                    </button>
                  )}
                  {status === "sent" && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" /> Pending
                    </span>
                  )}
                  {status === "received" && (
                    <button
                      onClick={() => acceptRequest(profile.user_id)}
                      className="flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md hover:opacity-90"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Accept
                    </button>
                  )}
                  {status === "connected" && (
                    <span className="flex items-center gap-1 text-xs text-primary font-semibold">
                      <UserCheck className="w-3.5 h-3.5" /> Connected
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {allUsers.length === 0 && (
            <div className="bg-card rounded-xl shadow p-8 text-center">
              <p className="text-muted-foreground">No other alumni found yet. Invite your friends!</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Network;
