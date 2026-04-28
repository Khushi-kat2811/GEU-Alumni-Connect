// import { useState } from "react";
// import { useQuery, useQueryClient } from "@tanstack/react-query";
// import { messagesApi } from "@/lib/api";
// import { useAuth } from "@/contexts/AuthContext";
// import DashboardLayout from "@/components/dashboard/DashboardLayout";
// import { Send, User } from "lucide-react";
// import { formatDistanceToNow } from "date-fns";

// const Messages = () => {
//   const { user }      = useAuth();
//   const queryClient   = useQueryClient();
//   const [selectedUser, setSelectedUser] = useState<string | null>(null);
//   const [message, setMessage]           = useState("");

//   // Connected users (contacts)
//   const { data: connectedUsers = [] } = useQuery({
//     queryKey: ["connected-users"],
//     queryFn:  () => messagesApi.contacts(),
//     enabled:  !!user,
//   });

//   // Messages for selected conversation
//   const { data: messages = [] } = useQuery({
//     queryKey: ["messages", selectedUser],
//     queryFn:  () => messagesApi.conversation(selectedUser!),
//     enabled:  !!user && !!selectedUser,
//     refetchInterval: 5000, // poll every 5 s
//   });

//   const sendMessage = async () => {
//     if (!message.trim() || !selectedUser || !user) return;
//     try {
//       await messagesApi.send(selectedUser, message.trim());
//       setMessage("");
//       queryClient.invalidateQueries({ queryKey: ["messages", selectedUser] });
//     } catch {
//       // silent fail — user sees no response
//     }
//   };

//   const selectedProfile = connectedUsers.find((u) => u.user_id === selectedUser);

//   return (
//     <DashboardLayout>
//       <div className="max-w-4xl mx-auto">
//         <h2 className="font-heading font-bold text-xl text-foreground mb-4">Messages</h2>

//         <div className="bg-card rounded-xl shadow flex h-[500px] overflow-hidden">
//           {/* Contacts sidebar */}
//           <div className="w-1/3 border-r border-border overflow-y-auto">
//             {connectedUsers.length === 0 ? (
//               <p className="p-4 text-sm text-muted-foreground">
//                 Connect with alumni to start messaging
//               </p>
//             ) : (
//               connectedUsers.map((profile) => (
//                 <button
//                   key={profile.user_id}
//                   onClick={() => setSelectedUser(profile.user_id)}
//                   className={`w-full flex items-center gap-3 p-3 text-left hover:bg-muted transition-colors ${
//                     selectedUser === profile.user_id ? "bg-muted" : ""
//                   }`}
//                 >
//                   <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
//                     {profile.avatar_url ? (
//                       <img
//                         src={profile.avatar_url}
//                         className="w-9 h-9 rounded-full object-cover"
//                         alt=""
//                       />
//                     ) : (
//                       <User className="w-4 h-4 text-primary" />
//                     )}
//                   </div>
//                   <div className="min-w-0">
//                     <p className="text-sm font-semibold text-foreground truncate">
//                       {profile.full_name || "Alumni"}
//                     </p>
//                     <p className="text-xs text-muted-foreground truncate">
//                       {profile.headline || ""}
//                     </p>
//                   </div>
//                 </button>
//               ))
//             )}
//           </div>

//           {/* Chat area */}
//           <div className="flex-1 flex flex-col">
//             {selectedUser ? (
//               <>
//                 {/* Chat header */}
//                 <div className="border-b border-border p-3">
//                   <p className="font-semibold text-sm">
//                     {selectedProfile?.full_name || "Alumni"}
//                   </p>
//                 </div>

//                 {/* Messages */}
//                 <div className="flex-1 overflow-y-auto p-4 space-y-2">
//                   {messages.map((msg) => (
//                     <div
//                       key={msg.id}
//                       className={`flex ${msg.sender_id === user!.id ? "justify-end" : "justify-start"}`}
//                     >
//                       <div
//                         className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${
//                           msg.sender_id === user!.id
//                             ? "bg-primary text-primary-foreground"
//                             : "bg-muted text-foreground"
//                         }`}
//                       >
//                         <p>{msg.content}</p>
//                         <p className="text-[10px] opacity-70 mt-1">
//                           {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
//                         </p>
//                       </div>
//                     </div>
//                   ))}
//                   {messages.length === 0 && (
//                     <p className="text-center text-muted-foreground text-sm py-8">
//                       No messages yet. Say hello!
//                     </p>
//                   )}
//                 </div>

//                 {/* Input */}
//                 <div className="border-t border-border p-3 flex gap-2">
//                   <input
//                     value={message}
//                     onChange={(e) => setMessage(e.target.value)}
//                     onKeyDown={(e) => e.key === "Enter" && sendMessage()}
//                     placeholder="Type a message..."
//                     className="flex-1 text-sm border border-input bg-background rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
//                   />
//                   <button
//                     onClick={sendMessage}
//                     className="bg-primary text-primary-foreground p-2 rounded-md hover:opacity-90"
//                   >
//                     <Send className="w-4 h-4" />
//                   </button>
//                 </div>
//               </>
//             ) : (
//               <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
//                 Select a connection to start chatting
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </DashboardLayout>
//   );
// };

// export default Messages;
import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { messagesApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Send, User, Search, MessageSquare, ArrowLeft, Circle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const Messages = () => {
  const { user }      = useAuth();
  const queryClient   = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [message, setMessage]           = useState("");
  const [searchTerm, setSearchTerm]     = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: connectedUsers = [] } = useQuery({
    queryKey: ["connected-users"],
    queryFn:  () => messagesApi.contacts(),
    enabled:  !!user,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", selectedUser],
    queryFn:  () => messagesApi.conversation(selectedUser!),
    enabled:  !!user && !!selectedUser,
    refetchInterval: 5000,
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim() || !selectedUser || !user) return;
    try {
      await messagesApi.send(selectedUser, message.trim());
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["messages", selectedUser] });
    } catch { /* silent */ }
  };

  const selectedProfile = connectedUsers.find((u) => u.user_id === selectedUser);
  const filteredContacts = connectedUsers.filter((p) =>
    !searchTerm || p.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto animate-fade-up">
        <h2 className="font-heading font-bold text-2xl text-foreground flex items-center gap-2 mb-5">
          <MessageSquare className="w-6 h-6 text-primary" />
          Messages
        </h2>

        <div className="glass-card rounded-2xl flex h-[580px] overflow-hidden shadow-xl shadow-black/5">
          {/* ── Contacts Sidebar ──────────────────────── */}
          <div className={`w-full md:w-[320px] border-r border-border/50 flex flex-col bg-card/50 ${
            selectedUser ? "hidden md:flex" : "flex"
          }`}>
            {/* Search */}
            <div className="p-3 border-b border-border/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:bg-muted transition-colors"
                />
              </div>
            </div>

            {/* Contact List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredContacts.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {connectedUsers.length === 0
                      ? "Connect with alumni to start messaging"
                      : "No results found"}
                  </p>
                </div>
              ) : (
                filteredContacts.map((profile) => {
                  const isSelected = selectedUser === profile.user_id;
                  const initials = getInitials(profile.full_name || "A");
                  return (
                    <button
                      key={profile.user_id}
                      onClick={() => setSelectedUser(profile.user_id)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all border-b border-border/30 ${
                        isSelected
                          ? "bg-primary/5 border-l-2 border-l-primary"
                          : "hover:bg-muted/40"
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/15 to-secondary/10 flex items-center justify-center overflow-hidden">
                          {profile.avatar_url ? (
                            <img src={profile.avatar_url} className="w-11 h-11 rounded-full object-cover" alt="" />
                          ) : (
                            <span className="text-primary text-sm font-bold">{initials}</span>
                          )}
                        </div>
                        <Circle className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm truncate ${isSelected ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>
                          {profile.full_name || "Alumni"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {profile.headline || "Tap to chat"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Chat Area ─────────────────────────────── */}
          <div className={`flex-1 flex flex-col ${!selectedUser ? "hidden md:flex" : "flex"}`}>
            {selectedUser ? (
              <>
                {/* Chat header */}
                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border/50 bg-card/30">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="md:hidden p-1.5 hover:bg-muted rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/15 to-secondary/10 flex items-center justify-center overflow-hidden">
                    {selectedProfile?.avatar_url ? (
                      <img src={selectedProfile.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                    ) : (
                      <User className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">
                      {selectedProfile?.full_name || "Alumni"}
                    </p>
                    <p className="text-[11px] text-emerald-500 flex items-center gap-1">
                      <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400" /> Online
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar bg-gradient-to-b from-muted/10 to-transparent">
                  {messages.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                        <Send className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-muted-foreground text-sm">No messages yet. Say hello!</p>
                    </div>
                  )}
                  {messages.map((msg) => {
                    const isMine = msg.sender_id === user!.id;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed ${
                            isMine
                              ? "gradient-primary text-white rounded-2xl rounded-br-md shadow-md shadow-primary/15"
                              : "bg-card text-foreground rounded-2xl rounded-bl-md shadow-sm border border-border/50"
                          }`}
                        >
                          <p>{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${isMine ? "text-white/60" : "text-muted-foreground/60"}`}>
                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-border/50 p-4 bg-card/30">
                  <div className="flex gap-2">
                    <input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 text-sm border border-input bg-background rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!message.trim()}
                      className="gradient-primary text-white p-2.5 rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity shadow-md shadow-primary/20"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-4 animate-float">
                  <MessageSquare className="w-10 h-10 text-primary/50" />
                </div>
                <h3 className="font-heading font-semibold text-lg text-foreground mb-1">
                  Your Messages
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Select a connection from the sidebar to start chatting
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Messages;