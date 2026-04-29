import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Lock, KeyRound, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type Step = "request" | "verify";

const ChangePassword = () => {
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const [step, setStep] = useState<Step>("request");
  const [currentPwd, setCurrentPwd] = useState("");
  const [otp, setOtp] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPwd) return;
    setBusy(true);
    try {
      const { message } = await authApi.requestChangePassword(currentPwd);
      toast.success(message);
      setStep("verify");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send OTP");
    } finally { setBusy(false); }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd.length < 8)         return toast.error("New password must be at least 8 characters");
    if (newPwd !== confirm)        return toast.error("Passwords don't match");
    if (!/^\d{4,8}$/.test(otp))    return toast.error("Enter the OTP from your email");
    setBusy(true);
    try {
      await authApi.verifyChangePassword(otp, newPwd);
      toast.success("Password updated successfully!");
      await refresh();
      navigate("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update password");
    } finally { setBusy(false); }
  };

  const mustChange = user?.must_change_password;

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto animate-fade-up">
        <h2 className="font-heading font-bold text-2xl text-foreground flex items-center gap-2 mb-1">
          <Lock className="w-6 h-6 text-primary" /> Change Password
        </h2>
        <p className="text-sm text-muted-foreground mb-5">
          {mustChange
            ? "You're using a temporary password. Please set a new one to continue."
            : "Confirm your current password, then verify a 6-digit code emailed to you."}
        </p>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-6">
          {["Confirm password", "Enter OTP & new password"].map((label, idx) => {
            const active = (step === "request" && idx === 0) || (step === "verify" && idx === 1);
            const done = step === "verify" && idx === 0;
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  done ? "bg-emerald-500 text-white"
                       : active ? "gradient-primary text-white" : "bg-muted text-muted-foreground"
                }`}>
                  {done ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <span className={`text-xs font-medium ${active || done ? "text-foreground" : "text-muted-foreground"}`}>
                  {label}
                </span>
                {idx === 0 && <span className="mx-2 text-muted-foreground">→</span>}
              </div>
            );
          })}
        </div>

        {step === "request" ? (
          <form onSubmit={requestOtp} className="glass-card rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Current Password</label>
              <input
                type="password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                required
                placeholder="Enter your current password"
                className="w-full px-4 py-2.5 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> A 6-digit OTP will be emailed to <span className="font-medium">{user?.email}</span>.
              </p>
            </div>
            <button type="submit" disabled={busy || !currentPwd}
              className="w-full gradient-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
              {busy ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="glass-card rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">OTP Code</label>
              <input
                type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} required
                placeholder="123456"
                className="w-full px-4 py-2.5 rounded-md border border-input bg-background text-lg tracking-widest font-mono text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">New Password</label>
              <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} required minLength={8}
                placeholder="At least 8 characters"
                className="w-full px-4 py-2.5 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Confirm New Password</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8}
                className="w-full px-4 py-2.5 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setStep("request"); setOtp(""); }}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
                Back
              </button>
              <button type="submit" disabled={busy}
                className="flex-1 gradient-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2">
                <KeyRound className="w-4 h-4" /> {busy ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ChangePassword;
