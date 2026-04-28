import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { communitiesApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Users, Plus, MessageSquare, Send, ArrowLeft, Shield,
  LogIn, LogOut, Trash2, Search, MessageCircleOff, X, Crown,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";


const Communities = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: communities = [], isLoading } = useQuery({
    queryKey: ["communities"],
    queryFn: () => communitiesApi.list(),
    enabled: !!user,
  });

  const selected = communities.find((c: any) => c.id === selectedId);

  const { data: messages = [] } = useQuery({
    queryKey: ["community-messages", selectedId],
    queryFn: () => communitiesApi.messages(selectedId!),
    enabled: !!selectedId && !!selected?.is_member,
    refetchInterval: 4000,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["community-members", selectedId],
    queryFn: () => communitiesApi.members(selectedId!),
    enabled: !!selectedId,
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await communitiesApi.create(newName.trim(), newDesc.trim());
      setNewName("");
      setNewDesc("");
      setShowCreate(false);
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      toast.success("Community created!");
    } catch {
      toast.error("Failed to create community");
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (id: number) => {
    try {
      await communitiesApi.join(id);
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      toast.success("Joined community!");
    } catch {
      toast.error("Failed to join");
    }
  };

  const handleLeave = async (id: number) => {
    try {
      await communitiesApi.leave(id);
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      toast.success("Left community");
    } catch {
      toast.error("Failed to leave");
    }
  };

  const handleToggleChat = async (id: number) => {
    try {
      await communitiesApi.toggleChat(id);
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      toast.success("Chat setting updated");
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this community? This cannot be undone.")) return;
    try {
      await communitiesApi.delete(id);
      setSelectedId(null);
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      toast.success("Community deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !selectedId) return;
    try {
      await communitiesApi.sendMessage(selectedId, message.trim());
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["community-messages", selectedId] });
    } catch {
      toast.error("Failed to send message");
    }
  };

  const filtered = communities.filter(
    (c: any) =>
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 animate-fade-up">
          <div>
            <h2 className="font-heading font-bold text-2xl text-foreground flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Communities
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {communities.length} communit{communities.length !== 1 ? "ies" : "y"}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 md:w-56">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search communities..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
              />
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="gradient-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 shadow-md shadow-primary/20 transition-opacity"
            >
              <Plus className="w-4 h-4" /> Create
            </button>
          </div>
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-up">
            <div className="glass-card rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-semibold text-lg text-foreground">
                  Create Community
                </h3>
                <button onClick={() => setShowCreate(false)} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Community name"
                className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description (optional)"
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim() || creating}
                  className="gradient-primary text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        {selectedId && selected ? (
          /* Community Detail + Chat View */
          <div className="animate-fade-up">
            <button
              onClick={() => setSelectedId(null)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to communities
            </button>

            {/* Community Header Card */}
            <div className="glass-card rounded-2xl p-5 mb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-heading font-bold text-xl text-foreground flex items-center gap-2">
                    {selected.name}
                    {selected.my_role === "admin" && (
                      <Crown className="w-4 h-4 text-secondary" />
                    )}
                  </h3>
                  {selected.description && (
                    <p className="text-sm text-muted-foreground mt-1">{selected.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {selected.member_count} member{selected.member_count !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      {selected.chat_enabled ? (
                        <><MessageSquare className="w-3.5 h-3.5 text-emerald-500" /> Chat On</>
                      ) : (
                        <><MessageCircleOff className="w-3.5 h-3.5 text-destructive" /> Chat Off</>
                      )}
                    </span>
                  </div>
                </div>

                {/* Admin controls */}
                {selected.my_role === "admin" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleChat(selected.id)}
                      className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium transition-all ${
                        selected.chat_enabled
                          ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                          : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      }`}
                    >
                      {selected.chat_enabled ? (
                        <><MessageCircleOff className="w-3.5 h-3.5" /> Disable Chat</>
                      ) : (
                        <><MessageSquare className="w-3.5 h-3.5" /> Enable Chat</>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(selected.id)}
                      className="p-2 rounded-xl text-destructive/60 hover:text-destructive hover:bg-destructive/5 transition-colors"
                      title="Delete community"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
              {/* Chat area */}
              <div className="glass-card rounded-2xl flex flex-col h-[420px] overflow-hidden">
                {!selected.is_member ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                      <LogIn className="w-7 h-7 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">Join this community to participate in chat</p>
                    <button
                      onClick={() => handleJoin(selected.id)}
                      className="gradient-primary text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      Join Community
                    </button>
                  </div>
                ) : !selected.chat_enabled && selected.my_role !== "admin" ? (
  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
    <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
      <MessageCircleOff className="w-7 h-7 text-muted-foreground/50" />
    </div>
    <p className="font-heading font-semibold text-foreground">Chat is disabled</p>
    <p className="text-sm text-muted-foreground mt-1">The admin has turned off chat for this community</p>
  </div>
                ) : (
                  <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                      {messages.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                          <MessageSquare className="w-8 h-8 text-muted-foreground/30 mb-2" />
                          <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
                        </div>
                      )}
                      {messages.map((msg: any) => {
                        const isMine = msg.sender_id === user?.id;
                        return (
                          <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                            {!isMine && (
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2 flex-shrink-0 overflow-hidden">
                                {msg.avatar_url ? (
                                  <img src={msg.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                                ) : (
                                  <span className="text-primary text-xs font-bold">
                                    {(msg.full_name || "A")[0].toUpperCase()}
                                  </span>
                                )}
                              </div>
                            )}
                            <div className={`max-w-[70%] px-3.5 py-2.5 text-sm ${
                              isMine
                                ? "gradient-primary text-white rounded-2xl rounded-br-md shadow-sm"
                                : "bg-card text-foreground rounded-2xl rounded-bl-md border border-border/50"
                            }`}>
                              {!isMine && (
                                <p className="text-[11px] font-semibold mb-0.5 opacity-70">{msg.full_name || "Alumni"}</p>
                              )}
                              <p className="leading-relaxed">{msg.content}</p>
                              <p className={`text-[10px] mt-1 ${isMine ? "text-white/50" : "text-muted-foreground/50"}`}>
                                {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} />
                    </div>
                    <div className="border-t border-border/50 p-3">
                      <div className="flex gap-2">
                        <input
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSend()}
                          placeholder="Type a message..."
                          className="flex-1 text-sm border border-input bg-background rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                        />
                        <button
                          onClick={handleSend}
                          disabled={!message.trim()}
                          className="gradient-primary text-white p-2.5 rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity shadow-sm"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Members sidebar */}
              <div className="glass-card rounded-2xl p-4 h-fit">
                <h4 className="font-heading font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Members ({members.length})
                </h4>
                <div className="space-y-2 max-h-[340px] overflow-y-auto custom-scrollbar">
                  {members.map((m: any) => (
  <div key={m.id} className="flex items-center gap-2.5 py-1.5">
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
      {m.avatar_url ? (
        <img src={m.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
      ) : (
        <span className="text-primary text-xs font-bold">
          {(m.full_name || "A")[0].toUpperCase()}
        </span>
      )}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-foreground truncate">
        {m.full_name || "Alumni"}
      </p>
      {m.role !== "admin" && !m.can_chat && (
        <p className="text-[10px] text-destructive">Muted</p>
      )}
    </div>
    {m.role === "admin" ? (
      <span className="text-[10px] bg-secondary/10 text-secondary font-semibold px-2 py-0.5 rounded-md">
        Admin
      </span>
    ) : selected?.my_role === "admin" ? (
      <button
        onClick={(e) => {
          e.stopPropagation();
          communitiesApi.toggleMemberChat(selected.id, m.user_id).then(() => {
            queryClient.invalidateQueries({ queryKey: ["community-members", selectedId] });
            toast.success(m.can_chat ? "Member muted" : "Member unmuted");
          }).catch(() => toast.error("Failed to update"));
        }}
        className={`text-[10px] font-medium px-2 py-0.5 rounded-md transition-colors ${
          m.can_chat
            ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
            : "bg-destructive/10 text-destructive hover:bg-destructive/20"
        }`}
        title={m.can_chat ? "Click to mute" : "Click to unmute"}
      >
        {m.can_chat ? "Can Chat" : "Muted"}
      </button>
    ) : null}
  </div>
))}
                </div>
                {selected.is_member && selected.my_role !== "admin" && (
                  <button
                    onClick={() => handleLeave(selected.id)}
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-destructive hover:bg-destructive/5 py-2 rounded-xl mt-3 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Leave Community
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Community List Grid */
          <div>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="glass-card rounded-2xl p-5 animate-pulse">
                    <div className="h-4 bg-muted rounded w-40 mb-2" />
                    <div className="h-3 bg-muted rounded w-60 mb-3" />
                    <div className="h-3 bg-muted rounded w-24" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center animate-scale-in">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-primary/50" />
                </div>
                <h3 className="font-heading font-semibold text-lg text-foreground mb-1">
                  {search ? "No results" : "No communities yet"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  {search ? "Try a different search term" : "Be the first to create a community!"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map((c: any, i: number) => (
                  <div
                    key={c.id}
                    className="glass-card rounded-2xl p-5 hover-lift cursor-pointer animate-fade-up"
                    style={{ animationDelay: `${Math.min(i * 50, 400)}ms` }}
                    onClick={() => setSelectedId(c.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex items-center gap-2">
                        {c.chat_enabled ? (
                          <span className="text-[10px] bg-emerald-50 text-emerald-600 font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> Chat On
                          </span>
                        ) : (
                          <span className="text-[10px] bg-muted text-muted-foreground font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                            <MessageCircleOff className="w-3 h-3" /> Chat Off
                          </span>
                        )}
                        {c.my_role === "admin" && (
                          <span className="text-[10px] bg-secondary/10 text-secondary font-semibold px-2 py-0.5 rounded-md">
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 className="font-heading font-semibold text-base text-foreground mt-3">{c.name}</h3>
                    {c.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" /> {c.member_count} member{c.member_count !== 1 ? "s" : ""}
                      </span>
                      {c.is_member ? (
                        <span className="text-[11px] text-primary font-semibold">Joined</span>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleJoin(c.id); }}
                          className="text-[11px] gradient-primary text-white px-3 py-1 rounded-lg font-medium hover:opacity-90 transition-opacity"
                        >
                          Join
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Communities;