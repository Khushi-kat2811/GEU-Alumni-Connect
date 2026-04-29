import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "@/lib/api";
import { toast } from "sonner";
import { Upload, FileText, CheckCircle2, GraduationCap } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const ACCEPTED = ".pdf,.png,.jpg,.jpeg,.webp";

const Signup = () => {
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [course, setCourse] = useState("");
  const [studentId, setStudentId] = useState("");
  const [reason, setReason] = useState("");
  const [doc, setDoc] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10 MB)");
      return;
    }
    setDoc(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doc) {
      toast.error("Please attach a verification document");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("full_name", fullName);
      fd.append("email", email);
      if (graduationYear) fd.append("graduation_year", graduationYear);
      if (course) fd.append("course", course);
      if (studentId) fd.append("student_id", studentId);
      if (reason) fd.append("reason", reason);
      fd.append("verification_doc", doc);
      await authApi.register(fd);
      setSubmitted(true);
      toast.success("Application submitted!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-cover bg-center flex items-center justify-center px-4"
           style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-secondary/60" />
        <div className="relative z-10 w-full max-w-md">
          <div className="glass-card rounded-2xl p-8 text-center animate-fade-up">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-9 h-9 text-emerald-600" />
            </div>
            <h2 className="font-heading font-bold text-xl text-foreground mb-2">
              Application received!
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              An administrator will review your verification document and email
              your login credentials to <span className="font-semibold text-foreground">{email}</span> once approved.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="gradient-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center px-4 py-8"
         style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-secondary/60" />
      <div className="relative z-10 w-full max-w-lg">
        <div className="bg-card rounded-2xl shadow-xl p-7">
          <div className="flex items-center gap-2 justify-center mb-1">
            <GraduationCap className="w-5 h-5 text-secondary" />
            <h2 className="text-secondary font-heading font-bold text-2xl">GEU Alumni Connect</h2>
          </div>
          <p className="text-muted-foreground text-sm text-center mb-5">
            Apply for an account — verified by GEU administrators
          </p>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Full Name *</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} required
                  className="w-full px-3.5 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Email *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full px-3.5 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Graduation Year</label>
                <input type="number" min="1990" max="2030" value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Student ID</label>
                <input value={studentId} onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Course / Degree</label>
              <input value={course} onChange={(e) => setCourse(e.target.value)}
                placeholder="B.Tech CSE, MBA, etc."
                className="w-full px-3.5 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Why do you want to join? (optional)</label>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
                className="w-full px-3.5 py-2 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Verification Document * <span className="text-muted-foreground">(degree, ID card, marksheet — PDF/PNG/JPG, max 10 MB)</span>
              </label>
              <input ref={fileInput} type="file" accept={ACCEPTED} onChange={handleFile} className="hidden" />
              <button type="button" onClick={() => fileInput.current?.click()}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-md border border-dashed border-input bg-background hover:bg-muted/40 text-sm text-foreground transition-colors">
                {doc ? <FileText className="w-4 h-4 text-primary" /> : <Upload className="w-4 h-4 text-muted-foreground" />}
                <span className={doc ? "text-foreground" : "text-muted-foreground"}>
                  {doc ? doc.name : "Click to upload your verification document"}
                </span>
              </button>
            </div>

            <button type="submit" disabled={loading}
              className="w-full gradient-primary text-white py-2.5 rounded-md font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity">
              {loading ? "Submitting..." : "Submit application"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-5">
            Already have an account?{" "}
            <Link to="/login" className="text-secondary font-semibold hover:underline">Log In</Link>
          </p>
          <p className="text-center mt-1">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              ← Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
