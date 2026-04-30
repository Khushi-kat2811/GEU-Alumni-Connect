import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, fileUrl, type AdminUser, type PendingRegistration } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Shield, Users, FileText, Briefcase, Clock, ExternalLink,
  Check, X, Search, Trash2, KeyRound, ShieldCheck, ShieldOff, Mail,
  GraduationCap, IdCard, AlertTriangle, BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type Tab = "pending" | "users" | "moderation";

const Admin = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("pending");
  const [pendingStatus, setPendingStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [search, setSearch] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // ─── Stats ──────────────────────────────────────────────
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminApi.stats(),
    refetchInterval: 30_000,
  });

  // ─── Pending registrations ──────────────────────────────
  const { data: pending = [], isLoading: loadingPending } = useQuery({
    queryKey: ["admin-pending", pendingStatus],
    queryFn: () => adminApi.pending(pendingStatus),
    enabled: tab === "pending",
  });

  // ─── Users ──────────────────────────────────────────────
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: () => adminApi.users(search),
    enabled: tab === "users",
  });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    queryClient.invalidateQueries({ queryKey: ["admin-pending"] });
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  };

  const approve = async (id: string) => {
    try {
      const r = await adminApi.approve(id);
      toast.success(`Approved as ${r.username}.`);
      if (r.email_mode === "console") {
        toast.message("SMTP not configured — credentials were logged to the server console.");
      }
      refreshAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const reject = async () => {
    if (!rejectingId) return;
    try {
      await adminApi.reject(rejectingId, rejectReason);
      toast.success("Application rejected.");
      setRejectingId(null);
      setRejectReason("");
      refreshAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const setAdminFlag = async (u: AdminUser, makeAdmin: boolean) => {
    try {
      await adminApi.setAdmin(u.id, makeAdmin);
      toast.success(makeAdmin ? `${u.full_name || u.username} promoted to admin.` : `Admin removed from ${u.full_name || u.username}.`);
      refreshAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const resetPwd = async (u: AdminUser) => {
    if (!confirm(`Generate a new temporary password for ${u.full_name || u.username} and email it?`)) return;
    try {
      await adminApi.resetUserPassword(u.id);
      toast.success("Password reset and emailed.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const removeUser = async (u: AdminUser) => {
    if (!confirm(`Permanently delete ${u.full_name || u.email}? This cannot be undone.`)) return;
    try {
      await adminApi.deleteUser(u.id);
      toast.success("User deleted.");
      refreshAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* ── Header ───────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 mb-6 animate-fade-up">
          <div>
            <h2 className="font-heading font-bold text-2xl text-foreground flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" /> Admin Dashboard
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {user?.is_super_admin ? "Super Admin" : "Admin"} controls
            </p>
          </div>
        </div>

        {/* ── Stats cards ──────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { icon: Users, label: "Users", value: stats?.total_users ?? "—", color: "text-primary", bg: "bg-primary/10" },
            { icon: Clock, label: "Pending", value: stats?.pending_signups ?? "—", color: "text-amber-600", bg: "bg-amber-50" },
            { icon: FileText, label: "Posts", value: stats?.total_posts ?? "—", color: "text-secondary", bg: "bg-secondary/10" },
            { icon: Briefcase, label: "Open jobs", value: stats?.open_jobs ?? "—", color: "text-emerald-600", bg: "bg-emerald-50" },
            { icon: Users, label: "Communities", value: stats?.total_communities ?? "—", color: "text-accent", bg: "bg-accent/10" },
          ].map((s, i) => (
            <div key={s.label} className={`glass-card rounded-xl p-4 animate-fade-up delay-${(i + 1) * 100}`}>
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="font-heading font-bold text-2xl text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ─────────────────────────────────────── */}
        <div className="flex gap-1 border-b border-border mb-4">
          {[
            { k: "pending" as const, label: "Sign-up Approvals" },
            { k: "users" as const, label: "Users" },
          ].map((t) => (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-[2px] transition-colors ${
                tab === t.k ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Pending tab ──────────────────────────────── */}
        {tab === "pending" && (
          <>
            <div className="flex items-center gap-2 mb-3">
              {(["pending", "approved", "rejected"] as const).map((s) => (
                <button key={s} onClick={() => setPendingStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                    pendingStatus === s ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}>
                  {s}
                </button>
              ))}
            </div>

            {loadingPending ? (
              <p className="text-center text-muted-foreground py-8">Loading...</p>
            ) : pending.length === 0 ? (
              <div className="glass-card rounded-2xl p-10 text-center">
                <p className="text-sm text-muted-foreground">No {pendingStatus} applications.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map((p: PendingRegistration) => (
                  <div key={p.id} className="glass-card rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
                          {p.full_name}
                          <span className="text-xs text-muted-foreground font-normal">{p.email}</span>
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                          {p.graduation_year && <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> Class of {p.graduation_year}</span>}
                          {p.course && <span className="flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5" /> {p.course}</span>}
                          {p.student_id && <span className="flex items-center gap-1"><IdCard className="w-3.5 h-3.5" /> {p.student_id}</span>}
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                        </div>
                        {p.reason && (
                          <p className="text-sm text-muted-foreground mt-3 bg-muted/30 rounded-lg p-3">
                            <span className="font-medium text-foreground">Reason: </span>{p.reason}
                          </p>
                        )}
                        {p.rejection_reason && (
                          <p className="text-sm text-destructive mt-3 bg-destructive/5 rounded-lg p-3">
                            <span className="font-medium">Rejection note: </span>{p.rejection_reason}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <a href={fileUrl(p.verification_doc_url) || "#"} target="_blank" rel="noopener noreferrer"
                           className="flex items-center gap-1.5 text-xs bg-secondary/10 text-secondary px-3 py-2 rounded-lg font-medium hover:bg-secondary/20 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" /> View document
                        </a>
                        {p.status === "pending" && (
                          <>
                            <button onClick={() => approve(p.id)}
                              className="flex items-center gap-1.5 text-xs bg-emerald-600 text-white px-3 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button onClick={() => { setRejectingId(p.id); setRejectReason(""); }}
                              className="flex items-center gap-1.5 text-xs bg-destructive/10 text-destructive px-3 py-2 rounded-lg font-medium hover:bg-destructive/20 transition-colors">
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Users tab ────────────────────────────────── */}
        {tab === "users" && (
          <>
            <div className="relative mb-3">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, username, or email..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            {loadingUsers ? (
              <p className="text-center text-muted-foreground py-8">Loading...</p>
            ) : users.length === 0 ? (
              <div className="glass-card rounded-2xl p-10 text-center">
                <p className="text-sm text-muted-foreground">No users found.</p>
              </div>
            ) : (
              <div className="glass-card rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Username</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u: AdminUser) => (
                      <tr key={u.id} className="border-t border-border/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {u.avatar_url ? (
                                <img src={u.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                              ) : (
                                <span className="text-primary text-xs font-bold">
                                  {(u.full_name || u.username || "A")[0].toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{u.full_name || "—"}</p>
                              {u.graduation_year && <p className="text-[11px] text-muted-foreground">{u.graduation_year}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{u.username}</td>
                        <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                        <td className="px-4 py-3">
                          {u.is_super_admin ? (
                            <span className="text-[11px] bg-amber-100 text-amber-700 font-semibold px-2 py-1 rounded-md">Super Admin</span>
                          ) : u.is_admin ? (
                            <span className="text-[11px] bg-secondary/10 text-secondary font-semibold px-2 py-1 rounded-md">Admin</span>
                          ) : (
                            <span className="text-[11px] bg-muted text-muted-foreground font-medium px-2 py-1 rounded-md">User</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {user?.is_super_admin && !u.is_super_admin && (
                              u.is_admin ? (
                                <button onClick={() => setAdminFlag(u, false)} title="Demote"
                                  className="p-2 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                                  <ShieldOff className="w-4 h-4" />
                                </button>
                              ) : (
                                <button onClick={() => setAdminFlag(u, true)} title="Promote to admin"
                                  className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                                  <ShieldCheck className="w-4 h-4" />
                                </button>
                              )
                            )}
                            <button onClick={() => resetPwd(u)} title="Reset password"
                              className="p-2 text-muted-foreground hover:text-secondary hover:bg-secondary/5 rounded-lg transition-colors">
                              <KeyRound className="w-4 h-4" />
                            </button>
                            {user?.is_super_admin && !u.is_super_admin && (
                              <button onClick={() => removeUser(u)} title="Delete user"
                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── Reject modal ─────────────────────────────── */}
        {rejectingId && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-up">
            <div className="glass-card rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground">Reject application</h3>
                  <p className="text-xs text-muted-foreground">The user will be emailed with the reason below.</p>
                </div>
              </div>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3}
                placeholder="Reason for rejection (optional but recommended)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-destructive/30 mb-4" />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setRejectingId(null)}
                  className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
                  Cancel
                </button>
                <button onClick={reject}
                  className="bg-destructive text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
                  Reject application
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Admin;
