import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Send, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const Messages = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  // Get connected users
  const { data: connectedUsers = [] } = useQuery({
    queryKey: ["connected-users"],
    queryFn: async () => {
      const { data: conns } = await supabase
        .from("connections")
        .select("requester_id, addressee_id")
        .eq("status", "accepted");
      if (!conns) return [];
      const userIds = conns.map((c) => (c.requester_id === user!.id ? c.addressee_id : c.requester_id));
      if (userIds.length === 0) return [];
      const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", userIds);
      return profiles || [];
    },
    enabled: !!user,
  });

  // Get messages for selected conversation
  const { data: messages = [] } = useQuery({
    queryKey: ["messages", selectedUser],
    queryFn: async () => {
      if (!selectedUser) return [];
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user!.id},receiver_id.eq.${selectedUser}),and(sender_id.eq.${selectedUser},receiver_id.eq.${user!.id})`)
        .order("created_at", { ascending: true });
      return data || [];
    },
    enabled: !!user && !!selectedUser,
    refetchInterval: 5000,
  });

  const sendMessage = async () => {
    if (!message.trim() || !selectedUser || !user) return;
    await supabase.from("messages").insert({ sender_id: user.id, receiver_id: selectedUser, content: message.trim() });
    setMessage("");
    queryClient.invalidateQueries({ queryKey: ["messages", selectedUser] });
  };

  const selectedProfile = connectedUsers.find((u) => u.user_id === selectedUser);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <h2 className="font-heading font-bold text-xl text-foreground mb-4">Messages</h2>
        <div className="bg-card rounded-xl shadow flex h-[500px] overflow-hidden">
          {/* Contacts */}
          <div className="w-1/3 border-r border-border overflow-y-auto">
            {connectedUsers.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Connect with alumni to start messaging</p>
            ) : (
              connectedUsers.map((profile) => (
                <button
                  key={profile.user_id}
                  onClick={() => setSelectedUser(profile.user_id)}
                  className={`w-full flex items-center gap-3 p-3 text-left hover:bg-muted transition-colors ${
                    selectedUser === profile.user_id ? "bg-muted" : ""
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} className="w-9 h-9 rounded-full object-cover" alt="" />
                    ) : (
                      <User className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{profile.full_name || "Alumni"}</p>
                    <p className="text-xs text-muted-foreground truncate">{profile.headline || ""}</p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Chat */}
          <div className="flex-1 flex flex-col">
            {selectedUser ? (
              <>
                <div className="border-b border-border p-3">
                  <p className="font-semibold text-sm">{selectedProfile?.full_name || "Alumni"}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender_id === user!.id ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${
                        msg.sender_id === user!.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}>
                        <p>{msg.content}</p>
                        <p className="text-[10px] opacity-70 mt-1">{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border p-3 flex gap-2">
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 text-sm border border-input bg-background rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button onClick={sendMessage} className="bg-primary text-primary-foreground p-2 rounded-md hover:opacity-90">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                Select a connection to start chatting
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Messages;
