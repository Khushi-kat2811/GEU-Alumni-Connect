import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { messagesApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Send, User, Check, CheckCheck } from "lucide-react";
import { format } from "date-fns";

const Messages = () => {
  const { user }      = useAuth();
  const queryClient   = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [message, setMessage]           = useState("");

  // Connected users (contacts)
  const { data: connectedUsers = [] } = useQuery({
    queryKey: ["connected-users"],
    queryFn:  () => messagesApi.contacts(),
    enabled:  !!user,
  });

  // Messages for selected conversation
  const { data: messages = [] } = useQuery({
    queryKey: ["messages", selectedUser],
    queryFn:  () => messagesApi.conversation(selectedUser!),
    enabled:  !!user && !!selectedUser,
    refetchInterval: 5000, // poll every 5 s
  });

  const sendMessage = async () => {
    if (!message.trim() || !selectedUser || !user) return;
    try {
      await messagesApi.send(selectedUser, message.trim());
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["messages", selectedUser] });
    } catch {
      // silent fail — user sees no response
    }
  };

  const selectedProfile = connectedUsers.find((u) => u.user_id === selectedUser);

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "h:mm a");
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <h2 className="font-heading font-bold text-xl text-foreground mb-4">Messages</h2>

        <div className="bg-card rounded-xl shadow flex h-[500px] overflow-hidden">
          {/* Contacts sidebar */}
          <div className="w-1/3 border-r border-border overflow-y-auto">
            {connectedUsers.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                Connect with alumni to start messaging
              </p>
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
                      <img
                        src={profile.avatar_url}
                        className="w-9 h-9 rounded-full object-cover"
                        alt=""
                      />
                    ) : (
                      <User className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {profile.full_name || "Alumni"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {profile.headline || ""}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Chat area */}
          <div className="flex-1 flex flex-col">
            {selectedUser ? (
              <>
                {/* Chat header */}
                <div className="border-b border-border p-3 flex justify-between items-center">
                  <p className="font-semibold text-sm">
                    {selectedProfile?.full_name || "Alumni"}
                  </p>
                  {selectedUser && (
                    <Link 
                      to={`/dashboard/profile/${selectedUser}`}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      View Profile
                    </Link>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {messages.map((msg) => {
                    const isMine = msg.sender_id === user!.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${
                            isMine
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          <p>{msg.content}</p>
                          <div className={`flex items-center gap-1 mt-1 text-[10px] ${isMine ? "text-primary-foreground/70 justify-end" : "text-muted-foreground"}`}>
                            <span>{formatMessageTime(msg.created_at)}</span>
                            {isMine && (
                              msg.read ? (
                                <CheckCheck className="w-3 h-3 text-blue-200" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {messages.length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-8">
                      No messages yet. Say hello!
                    </p>
                  )}
                </div>

                {/* Input */}
                <div className="border-t border-border p-3 flex gap-2">
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 text-sm border border-input bg-background rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    onClick={sendMessage}
                    className="bg-primary text-primary-foreground p-2 rounded-md hover:opacity-90"
                  >
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
