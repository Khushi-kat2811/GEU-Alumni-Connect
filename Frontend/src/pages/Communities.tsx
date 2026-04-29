import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { communitiesApi, type CommunityPost, type PostComment } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Users, Plus, MessageSquare, Send, ArrowLeft, ImagePlus,
  LogIn, LogOut, Trash2, Search, MessageCircleOff, X, Crown,
  Pin, Heart, MessageCircle, Megaphone, Shield, UserMinus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

type Tab = "posts" | "chat" | "members";
type Role = "admin" | "moderator" | "member";

const Communities = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("posts");
  const [message, setMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ─── Communities list ──────────────────────────────────────
  const { data: communities = [], isLoading } = useQuery({
    queryKey: ["communities"],
    queryFn: () => communitiesApi.list(),
    enabled: !!user,
  });

  const selected = communities.find((c: any) => c.id === selectedId);

  // ─── Members ───────────────────────────────────────────────
  const { data: members = [] } = useQuery({
    queryKey: ["community-members", selectedId],
    queryFn: () => communitiesApi.members(selectedId!),
    enabled: !!selectedId,
  });

  // ─── Chat ──────────────────────────────────────────────────
  const { data: messages = [] } = useQuery({
    queryKey: ["community-messages", selectedId],
    queryFn: () => communitiesApi.messages(selectedId!),
    enabled: !!selectedId && !!selected?.is_member && tab === "chat",
    refetchInterval: 4000,
  });

  useEffect(() => {
    if (tab === "chat") chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, tab]);

  // ─── Posts ─────────────────────────────────────────────────
  const { data: posts = [] } = useQuery({
    queryKey: ["community-posts", selectedId],
    queryFn: () => communitiesApi.posts(selectedId!),
    enabled: !!selectedId && !!selected?.is_member && tab === "posts",
  });

  // ─── Mutations / handlers ──────────────────────────────────
  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await communitiesApi.create(newName.trim(), newDesc.trim());
      setNewName(""); setNewDesc(""); setShowCreate(false);
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      toast.success("Community created!");
    } catch { toast.error("Failed to create community"); }
    finally { setCreating(false); }
  };

  const handleJoin = async (id: string) => {
    try { await communitiesApi.join(id); queryClient.invalidateQueries({ queryKey: ["communities"] }); toast.success("Joined!"); }
    catch { toast.error("Failed to join"); }
  };
  const handleLeave = async (id: string) => {
    try { await communitiesApi.leave(id); queryClient.invalidateQueries({ queryKey: ["communities"] }); toast.success("Left"); }
    catch { toast.error("Failed to leave"); }
  };
  const handleToggleChat = async (id: string) => {
    try { await communitiesApi.toggleChat(id); queryClient.invalidateQueries({ queryKey: ["communities"] }); }
    catch { toast.error("Failed to update"); }
  };
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this community?")) return;
    try { await communitiesApi.delete(id); setSelectedId(null);
      queryClient.invalidateQueries({ queryKey: ["communities"] }); toast.success("Deleted"); }
    catch { toast.error("Failed to delete"); }
  };
  const handleSend = async () => {
    if (!message.trim() || !selectedId) return;
    try { await communitiesApi.sendMessage(selectedId, message.trim()); setMessage("");
      queryClient.invalidateQueries({ queryKey: ["community-messages", selectedId] }); }
    catch { toast.error("Failed to send"); }
  };
  const handleSetRole = async (userId: string, role: Role) => {
    if (!selectedId) return;
    try { await communitiesApi.setMemberRole(selectedId, userId, role);
      queryClient.invalidateQueries({ queryKey: ["community-members", selectedId] });
      toast.success(`Role updated to ${role}`); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
  };
  const handleRemoveMember = async (userId: string) => {
    if (!selectedId) return;
    if (!confirm("Remove this member from the community?")) return;
    try { await communitiesApi.removeMember(selectedId, userId);
      queryClient.invalidateQueries({ queryKey: ["community-members", selectedId] });
      toast.success("Member removed"); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
  };

  const filtered = communities.filter((c: any) =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) ||
              c.description?.toLowerCase().includes(search.toLowerCase())
  );

  const isStaff = selected?.my_role === "admin" || selected?.my_role === "moderator";

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 animate-fade-up">
          <div>
            <h2 className="font-heading font-bold text-2xl text-foreground flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" /> Communities
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {communities.length} communit{communities.length !== 1 ? "ies" : "y"}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 md:w-56">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search communities..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <button onClick={() => setShowCreate(true)}
              className="gradient-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 shadow-md shadow-primary/20 transition-opacity">
              <Plus className="w-4 h-4" /> Create
            </button>
          </div>
        </div>

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-up">
            <div className="glass-card rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-semibold text-lg">Create Community</h3>
                <button onClick={() => setShowCreate(false)} className="p-1.5 hover:bg-muted rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Community name"
                className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description (optional)" rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowCreate(false)}
                  className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted">Cancel</button>
                <button onClick={handleCreate} disabled={!newName.trim() || creating}
                  className="gradient-primary text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40">
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedId && selected ? (
          <div className="animate-fade-up">
            <button onClick={() => setSelectedId(null)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to communities
            </button>

            {/* Community header */}
            <div className="glass-card rounded-2xl p-5 mb-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="font-heading font-bold text-xl text-foreground flex items-center gap-2">
                    {selected.name}
                    {selected.my_role === "admin" && <Crown className="w-4 h-4 text-secondary" />}
                  </h3>
                  {selected.description && <p className="text-sm text-muted-foreground mt-1">{selected.description}</p>}
                  <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {selected.member_count} member{selected.member_count !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      {selected.chat_enabled
                        ? <><MessageSquare className="w-3.5 h-3.5 text-emerald-500" /> Chat On</>
                        : <><MessageCircleOff className="w-3.5 h-3.5 text-destructive" /> Chat Off</>}
                    </span>
                  </div>
                </div>

                {selected.my_role === "admin" && (
                  <div className="flex gap-2">
                    <button onClick={() => handleToggleChat(selected.id)}
                      className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium transition-all ${
                        selected.chat_enabled ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                                              : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      }`}>
                      {selected.chat_enabled
                        ? <><MessageCircleOff className="w-3.5 h-3.5" /> Disable Chat</>
                        : <><MessageSquare className="w-3.5 h-3.5" /> Enable Chat</>}
                    </button>
                    <button onClick={() => handleDelete(selected.id)}
                      className="p-2 rounded-xl text-destructive/60 hover:text-destructive hover:bg-destructive/5 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Tabs */}
              {selected.is_member && (
                <div className="flex gap-1 mt-4 border-b border-border/40 -mb-1">
                  {[
                    { k: "posts" as const, label: "Posts", icon: Megaphone },
                    { k: "chat" as const,  label: "Chat", icon: MessageSquare },
                    { k: "members" as const, label: "Members", icon: Users },
                  ].map(({ k, label, icon: Icon }) => (
                    <button key={k} onClick={() => setTab(k)}
                      className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-[2px] transition-colors ${
                        tab === k ? "border-primary text-primary"
                                  : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}>
                      <Icon className="w-3.5 h-3.5" /> {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!selected.is_member ? (
              <div className="glass-card rounded-2xl p-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <LogIn className="w-7 h-7 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-3">Join this community to participate</p>
                <button onClick={() => handleJoin(selected.id)}
                  className="gradient-primary text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
                  Join Community
                </button>
              </div>
            ) : tab === "posts" ? (
              <PostsPanel
                communityId={selected.id}
                isStaff={isStaff}
                isAdmin={selected.my_role === "admin"}
                userId={user?.id}
                posts={posts}
              />
            ) : tab === "chat" ? (
              <div className="glass-card rounded-2xl flex flex-col h-[440px] overflow-hidden">
                {!selected.chat_enabled && selected.my_role !== "admin" ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <MessageCircleOff className="w-7 h-7 text-muted-foreground/50 mb-2" />
                    <p className="font-heading font-semibold">Chat is disabled</p>
                    <p className="text-sm text-muted-foreground mt-1">The admin has turned off chat for this community</p>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                              isMine ? "gradient-primary text-white rounded-2xl rounded-br-md shadow-sm"
                                     : "bg-card text-foreground rounded-2xl rounded-bl-md border border-border/50"
                            }`}>
                              {!isMine && <p className="text-[11px] font-semibold mb-0.5 opacity-70">{msg.full_name || "Alumni"}</p>}
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
                        <input value={message} onChange={(e) => setMessage(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSend()}
                          placeholder="Type a message..."
                          className="flex-1 text-sm border border-input bg-background rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        <button onClick={handleSend} disabled={!message.trim()}
                          className="gradient-primary text-white p-2.5 rounded-xl hover:opacity-90 disabled:opacity-40">
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* MEMBERS TAB */
              <div className="glass-card rounded-2xl p-4">
                <h4 className="font-heading font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" /> Members ({members.length})
                </h4>
                <div className="space-y-2">
                  {members.map((m: any) => (
                    <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-colors">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {m.avatar_url ? (
                          <img src={m.avatar_url} className="w-9 h-9 rounded-full object-cover" alt="" />
                        ) : (
                          <span className="text-primary text-xs font-bold">
                            {(m.full_name || "A")[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{m.full_name || "Alumni"}</p>
                        {m.headline && <p className="text-[11px] text-muted-foreground truncate">{m.headline}</p>}
                      </div>

                      {/* Role badge / dropdown */}
                      {selected.my_role === "admin" && m.user_id !== user?.id ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleSetRole(m.user_id, e.target.value as Role)}
                          className="text-[11px] bg-card border border-input rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/30">
                          <option value="admin">Admin</option>
                          <option value="moderator">Moderator</option>
                          <option value="member">Member</option>
                        </select>
                      ) : (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          m.role === "admin" ? "bg-secondary/10 text-secondary"
                          : m.role === "moderator" ? "bg-amber-100 text-amber-700"
                          : "bg-muted text-muted-foreground"
                        }`}>
                          {m.role}
                        </span>
                      )}

                      {/* Mute toggle */}
                      {isStaff && m.role !== "admin" && m.user_id !== user?.id && (
                        <button onClick={() => communitiesApi.toggleMemberChat(selected.id, m.user_id)
                          .then(() => queryClient.invalidateQueries({ queryKey: ["community-members", selectedId] }))
                          .then(() => toast.success(m.can_chat ? "Member muted" : "Member unmuted"))
                          .catch(() => toast.error("Failed"))}
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-md transition-colors ${
                            m.can_chat ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                       : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                          }`}
                          title={m.can_chat ? "Click to mute" : "Click to unmute"}>
                          {m.can_chat ? "Can chat" : "Muted"}
                        </button>
                      )}

                      {/* Remove from community (admin only) */}
                      {selected.my_role === "admin" && m.role !== "admin" && m.user_id !== user?.id && (
                        <button onClick={() => handleRemoveMember(m.user_id)} title="Remove member"
                          className="p-1.5 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/5 rounded-md transition-colors">
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {selected.my_role !== "admin" && (
                  <button onClick={() => handleLeave(selected.id)}
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-destructive hover:bg-destructive/5 py-2 rounded-xl mt-3 transition-colors">
                    <LogOut className="w-3.5 h-3.5" /> Leave Community
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* List view */
          <div>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1,2,3,4].map((n) => (
                  <div key={n} className="glass-card rounded-2xl p-5 animate-pulse">
                    <div className="h-4 bg-muted rounded w-40 mb-2" />
                    <div className="h-3 bg-muted rounded w-60 mb-3" />
                    <div className="h-3 bg-muted rounded w-24" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center">
                <Users className="w-8 h-8 text-primary/50 mx-auto mb-3" />
                <h3 className="font-heading font-semibold text-lg text-foreground mb-1">
                  {search ? "No results" : "No communities yet"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  {search ? "Try a different search term" : "Be the first to create a community!"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map((c: any) => (
                  <div key={c.id} className="glass-card rounded-2xl p-5 hover-lift cursor-pointer"
                    onClick={() => { setSelectedId(c.id); setTab("posts"); }}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex items-center gap-2">
                        {c.chat_enabled
                          ? <span className="text-[10px] bg-emerald-50 text-emerald-600 font-medium px-2 py-0.5 rounded-md">Chat On</span>
                          : <span className="text-[10px] bg-muted text-muted-foreground font-medium px-2 py-0.5 rounded-md">Chat Off</span>}
                        {c.my_role === "admin" && <span className="text-[10px] bg-secondary/10 text-secondary font-semibold px-2 py-0.5 rounded-md">Admin</span>}
                        {c.my_role === "moderator" && <span className="text-[10px] bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-md">Mod</span>}
                      </div>
                    </div>
                    <h3 className="font-heading font-semibold text-base text-foreground mt-3">{c.name}</h3>
                    {c.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.description}</p>}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" /> {c.member_count} member{c.member_count !== 1 ? "s" : ""}
                      </span>
                      {c.is_member ? (
                        <span className="text-[11px] text-primary font-semibold">Joined</span>
                      ) : (
                        <button onClick={(e) => { e.stopPropagation(); handleJoin(c.id); }}
                          className="text-[11px] gradient-primary text-white px-3 py-1 rounded-lg font-medium hover:opacity-90 transition-opacity">
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

// ============================================================================
// Posts panel — admin/mod can author, all members can like + comment
// ============================================================================
const PostsPanel = ({
  communityId, isStaff, isAdmin, userId, posts,
}: {
  communityId: string;
  isStaff: boolean;
  isAdmin: boolean;
  userId?: string;
  posts: CommunityPost[];
}) => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);
  const [openComments, setOpenComments] = useState<string | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["community-posts", communityId] });

  const submit = async () => {
    if (!content.trim()) return;
    setPosting(true);
    try {
      await communitiesApi.createPost(communityId, { title, content, image });
      setTitle(""); setContent(""); setImage(null); setShowForm(false);
      refresh();
      toast.success("Posted!");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setPosting(false); }
  };

  const togglePin = async (postId: string) => {
    try { await communitiesApi.pinPost(communityId, postId); refresh(); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
  };
  const toggleLike = async (postId: string) => {
    try { await communitiesApi.likePost(communityId, postId); refresh(); }
    catch { /* ignore */ }
  };
  const deletePost = async (postId: string) => {
    if (!confirm("Delete this post?")) return;
    try { await communitiesApi.deletePost(communityId, postId); refresh(); toast.success("Deleted"); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
  };

  return (
    <div className="space-y-3">
      {isStaff && (
        showForm ? (
          <div className="glass-card rounded-2xl p-5 space-y-3 animate-fade-up">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4}
              placeholder="Share an announcement, update, or resource..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary cursor-pointer">
                <ImagePlus className="w-4 h-4" /> {image ? image.name.slice(0, 30) : "Add image"}
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => setImage(e.target.files?.[0] || null)} />
              </label>
              <div className="flex gap-2">
                <button onClick={() => { setShowForm(false); setContent(""); setTitle(""); setImage(null); }}
                  className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted/50">Cancel</button>
                <button onClick={submit} disabled={!content.trim() || posting}
                  className="gradient-primary text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                  {posting ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowForm(true)}
            className="w-full glass-card rounded-2xl p-4 flex items-center gap-3 text-left text-sm text-muted-foreground hover:bg-muted/20 transition-colors">
            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center">
              <Megaphone className="w-4 h-4 text-white" />
            </div>
            Share an announcement with the community...
          </button>
        )
      )}

      {posts.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <Megaphone className="w-7 h-7 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {isStaff ? "No announcements yet — be the first to post!" : "No announcements yet."}
          </p>
        </div>
      ) : (
        posts.map((p) => {
          const canDelete = isAdmin || p.author_id === userId;
          return (
            <div key={p.id} className="glass-card rounded-2xl p-5">
              {p.pinned && (
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-secondary font-bold mb-2">
                  <Pin className="w-3 h-3 fill-secondary" /> Pinned
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {p.author_avatar ? (
                    <img src={p.author_avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                  ) : (
                    <span className="text-primary text-xs font-bold">{(p.author_name || "A")[0].toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground">{p.author_name || "Alumni"}</span>
                    {p.author_role && p.author_role !== "member" && (
                      <span className={`text-[9px] uppercase font-bold tracking-wide px-1.5 py-0.5 rounded ${
                        p.author_role === "admin" ? "bg-secondary/15 text-secondary" : "bg-amber-100 text-amber-700"
                      }`}>
                        {p.author_role}
                      </span>
                    )}
                    <span className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {p.title && <h4 className="font-heading font-semibold text-base text-foreground mt-1.5">{p.title}</h4>}
                  <p className="text-sm text-foreground mt-1 whitespace-pre-wrap leading-relaxed">{p.content}</p>
                  {p.image_url && (
                    <img src={p.image_url} alt="" className="w-full rounded-xl mt-3 max-h-[420px] object-cover" />
                  )}

                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/40">
                    <button onClick={() => toggleLike(p.id)}
                      className={`flex items-center gap-1.5 text-xs transition-colors ${
                        p.liked_by_user ? "text-secondary" : "text-muted-foreground hover:text-secondary"
                      }`}>
                      <Heart className={`w-4 h-4 ${p.liked_by_user ? "fill-secondary" : ""}`} />
                      {p.likes_count}
                    </button>
                    <button onClick={() => setOpenComments(openComments === p.id ? null : p.id)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                      <MessageCircle className="w-4 h-4" /> {p.comments_count}
                    </button>
                    <div className="ml-auto flex items-center gap-1">
                      {isAdmin && (
                        <button onClick={() => togglePin(p.id)} title={p.pinned ? "Unpin" : "Pin"}
                          className={`p-1.5 rounded-lg transition-colors ${
                            p.pinned ? "text-secondary hover:bg-secondary/5" : "text-muted-foreground/50 hover:text-secondary hover:bg-secondary/5"
                          }`}>
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => deletePost(p.id)} title="Delete"
                          className="p-1.5 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/5 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {openComments === p.id && (
                    <CommentsThread communityId={communityId} postId={p.id} isAdmin={isAdmin} userId={userId} />
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

const CommentsThread = ({
  communityId, postId, isAdmin, userId,
}: { communityId: string; postId: string; isAdmin: boolean; userId?: string; }) => {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["community-post-comments", communityId, postId],
    queryFn: () => communitiesApi.postComments(communityId, postId),
  });

  const submit = async () => {
    if (!text.trim()) return;
    setPosting(true);
    try {
      await communitiesApi.addPostComment(communityId, postId, text.trim());
      setText("");
      queryClient.invalidateQueries({ queryKey: ["community-post-comments", communityId, postId] });
      queryClient.invalidateQueries({ queryKey: ["community-posts", communityId] });
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setPosting(false); }
  };
  const remove = async (cid: string) => {
    try {
      await communitiesApi.deletePostComment(communityId, postId, cid);
      queryClient.invalidateQueries({ queryKey: ["community-post-comments", communityId, postId] });
      queryClient.invalidateQueries({ queryKey: ["community-posts", communityId] });
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
  };

  return (
    <div className="mt-3 pt-3 border-t border-border/40 space-y-2.5">
      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading...</p>
      ) : (
        comments.map((c: PostComment) => {
          const canDelete = c.user_id === userId || isAdmin;
          return (
            <div key={c.id} className="flex gap-2 items-start">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {c.avatar_url ? (
                  <img src={c.avatar_url} className="w-7 h-7 rounded-full object-cover" alt="" />
                ) : (
                  <span className="text-primary text-[10px] font-bold">{(c.full_name || "A")[0].toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 bg-muted/40 rounded-2xl px-3 py-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold">{c.full_name || "Alumni"}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  </span>
                  {canDelete && (
                    <button onClick={() => remove(c.id)} className="ml-auto text-muted-foreground/40 hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-foreground">{c.content}</p>
              </div>
            </div>
          );
        })
      )}
      <div className="flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Add a comment..."
          className="flex-1 text-sm border border-input bg-background rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30" />
        <button onClick={submit} disabled={!text.trim() || posting}
          className="gradient-primary text-white px-3 py-2 rounded-xl text-xs font-medium hover:opacity-90 disabled:opacity-40">
          Post
        </button>
      </div>
    </div>
  );
};

export default Communities;
