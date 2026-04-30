import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { jobsApi, type Job } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Briefcase, Plus, Search, MapPin, Building2, X, ExternalLink, Mail,
  Trash2, Edit3, Power, Clock, DollarSign, Shield,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const TYPES = ["full-time", "part-time", "contract", "internship", "remote"] as const;

type FormState = {
  id?: string;
  title: string;
  company: string;
  location: string;
  job_type: string;
  experience: string;
  salary: string;
  description: string;
  apply_url: string;
  apply_email: string;
};

const emptyForm: FormState = {
  title: "", company: "", location: "", job_type: "full-time",
  experience: "", salary: "", description: "", apply_url: "", apply_email: "",
};

const Jobs = () => {
  const { user } = useAuth();
  const isAdmin = !!user?.is_admin;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [showMine, setShowMine] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expandedJobs, setExpandedJobs] = useState<Record<string, boolean>>({});

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs", { search, filterType, showMine }],
    queryFn: () => jobsApi.list({
      search: search || undefined,
      type: filterType || undefined,
      mine: showMine,
    }),
    enabled: !!user,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["jobs"] });

  const openCreate = () => { setForm(emptyForm); setShowForm(true); };
  const openEdit = (j: Job) => {
    setForm({
      id: j.id, title: j.title, company: j.company,
      location: j.location || "", job_type: j.job_type || "full-time",
      experience: j.experience || "", salary: j.salary || "",
      description: j.description, apply_url: j.apply_url || "",
      apply_email: j.apply_email || "",
    });
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.company.trim() || !form.description.trim()) {
      return toast.error("Title, company and description are required");
    }
    if (!form.apply_url && !form.apply_email) {
      return toast.error("Provide an apply URL or apply email");
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title, company: form.company, location: form.location,
        job_type: form.job_type, experience: form.experience, salary: form.salary,
        description: form.description, apply_url: form.apply_url, apply_email: form.apply_email,
      };
      if (form.id) await jobsApi.update(form.id, payload);
      else await jobsApi.create(payload);
      toast.success(form.id ? "Job updated" : "Job posted");
      setShowForm(false);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally { setSaving(false); }
  };

  const del = async (j: Job, asAdmin: boolean) => {
    const msg = asAdmin
      ? `Delete "${j.title}" at ${j.company} as admin?`
      : `Delete "${j.title}" at ${j.company}?`;
    if (!confirm(msg)) return;
    try {
      await jobsApi.delete(j.id);
      toast.success(asAdmin ? "Removed by admin" : "Deleted");
      refresh();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
  };

  const toggleOpen = async (j: Job) => {
    try { await jobsApi.toggle(j.id); refresh(); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
  };

  const toggleExpand = (id: string) => {
    setExpandedJobs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 animate-fade-up">
          <div>
            <h2 className="font-heading font-bold text-2xl text-foreground flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-primary" /> Job Board
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Opportunities shared by fellow alumni
            </p>
          </div>
          <button onClick={openCreate}
            className="gradient-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 shadow-md shadow-primary/20 transition-opacity">
            <Plus className="w-4 h-4" /> Post a Job
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-2 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search jobs..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">All types</option>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={() => setShowMine((v) => !v)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              showMine ? "bg-primary text-white" : "bg-card border border-input text-foreground hover:bg-muted/40"
            }`}>
            My Postings
          </button>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map((n) => (
              <div key={n} className="glass-card rounded-2xl p-5 animate-pulse">
                <div className="h-4 bg-muted rounded w-48 mb-2" />
                <div className="h-3 bg-muted rounded w-32 mb-3" />
                <div className="h-3 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center animate-scale-in">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-primary/50" />
            </div>
            <h3 className="font-heading font-semibold text-lg text-foreground mb-1">No jobs found</h3>
            <p className="text-sm text-muted-foreground">
              {showMine ? "You haven't posted any jobs yet." : "Try a different search or post the first one."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((j: Job, i: number) => {
              const mine = j.posted_by === user?.id;
              const canManage = mine || isAdmin;
              return (
                <div key={j.id}
                  className="glass-card rounded-2xl p-5 hover-lift animate-fade-up"
                  style={{ animationDelay: `${Math.min(i * 50, 400)}ms` }}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-heading font-semibold text-lg text-foreground">{j.title}</h3>
                        {!j.is_open && (
                          <span className="text-[10px] bg-muted text-muted-foreground font-medium px-2 py-0.5 rounded-md">Closed</span>
                        )}
                        {j.job_type && (
                          <span className="text-[10px] bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-md uppercase tracking-wide">
                            {j.job_type}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {j.company}</span>
                        {j.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {j.location}</span>}
                        {j.experience && <span>· {j.experience}</span>}
                        {j.salary && <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> {j.salary}</span>}
                      </div>
                      <p 
                        onClick={() => toggleExpand(j.id)}
                        className={`text-sm text-foreground mt-3 whitespace-pre-wrap leading-relaxed cursor-pointer ${
                          expandedJobs[j.id] ? "" : "line-clamp-3"
                        }`}
                        title={expandedJobs[j.id] ? "Click to show less" : "Click to read more"}
                      >
                        {j.description}
                      </p>
                      {j.description.length > 150 && (
                        <button 
                          onClick={() => toggleExpand(j.id)}
                          className="text-xs text-primary font-semibold mt-1 hover:underline focus:outline-none"
                        >
                          {expandedJobs[j.id] ? "Show less" : "Read more..."}
                        </button>
                      )}
                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatDistanceToNow(new Date(j.created_at), { addSuffix: true })}</span>
                        {j.poster_name && <span>· Posted by {j.poster_name}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {j.apply_url && (
                        <a href={j.apply_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs gradient-primary text-white px-3 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
                          <ExternalLink className="w-3.5 h-3.5" /> Apply
                        </a>
                      )}
                      {!j.apply_url && j.apply_email && (
                        <a href={`mailto:${j.apply_email}?subject=Application: ${encodeURIComponent(j.title)}`}
                          className="flex items-center gap-1.5 text-xs gradient-primary text-white px-3 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
                          <Mail className="w-3.5 h-3.5" /> Apply
                        </a>
                      )}
                      {canManage && (
                        <>
                          <button onClick={() => toggleOpen(j)} title={j.is_open ? "Close listing" : "Reopen listing"}
                            className="p-2 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                            <Power className="w-4 h-4" />
                          </button>
                          {mine && (
                            <button onClick={() => openEdit(j)} title="Edit"
                              className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => del(j, !mine)}
                            title={mine ? "Delete" : "Remove as admin"}
                            className={`p-2 rounded-lg transition-colors ${
                              mine
                                ? "text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                                : "text-amber-600/70 hover:text-amber-700 hover:bg-amber-50"
                            }`}
                          >
                            {mine ? <Trash2 className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Create / Edit modal ──────────────────────── */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-up overflow-y-auto">
            <div className="glass-card rounded-2xl p-6 w-full max-w-2xl my-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-semibold text-lg text-foreground">
                  {form.id ? "Edit job" : "Post a new job"}
                </h3>
                <button onClick={() => setShowForm(false)}
                  className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={submit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Title *</label>
                    <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required
                      className="w-full px-3.5 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Company *</label>
                    <input value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} required
                      className="w-full px-3.5 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Location</label>
                    <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Type</label>
                    <select value={form.job_type} onChange={(e) => setForm((f) => ({ ...f, job_type: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                      {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Experience</label>
                    <input value={form.experience} onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}
                      placeholder="e.g. 2-4 years"
                      className="w-full px-3.5 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Salary</label>
                    <input value={form.salary} onChange={(e) => setForm((f) => ({ ...f, salary: e.target.value }))}
                      placeholder="optional"
                      className="w-full px-3.5 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Description *</label>
                  <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required rows={5}
                    className="w-full px-3.5 py-2 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Apply URL</label>
                    <input value={form.apply_url} onChange={(e) => setForm((f) => ({ ...f, apply_url: e.target.value }))}
                      placeholder="https://..."
                      className="w-full px-3.5 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">…or Apply Email</label>
                    <input value={form.apply_email} onChange={(e) => setForm((f) => ({ ...f, apply_email: e.target.value }))}
                      placeholder="hr@example.com"
                      className="w-full px-3.5 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Provide at least one of Apply URL or Apply Email.</p>
                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="gradient-primary text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
                    {saving ? "Saving..." : form.id ? "Update job" : "Post job"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Jobs;
