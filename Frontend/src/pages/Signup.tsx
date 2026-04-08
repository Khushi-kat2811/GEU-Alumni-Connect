import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import heroBg from "@/assets/hero-bg.jpg";

const Signup = () => {
  const navigate      = useNavigate();
  const { loginUser } = useAuth();
  const [fullName, setFullName]             = useState("");
  const [email, setEmail]                   = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [password, setPassword]             = useState("");
  const [loading, setLoading]               = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { token, user } = await authApi.register(
        email,
        password,
        fullName,
        graduationYear ? parseInt(graduationYear) : undefined
      );
      loginUser(token, user);
      toast.success("Account created! Welcome to GEU Alumni Connect.");
      navigate("/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center px-4"
      style={{ backgroundImage: `url(${heroBg})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-secondary/60" />
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-card rounded-xl shadow-lg p-8">
          <h2 className="text-secondary font-heading font-bold text-2xl text-center mb-1">
            GEU Alumni Connect
          </h2>
          <p className="text-muted-foreground text-sm text-center mb-6">
            Create your account and join the network.
          </p>

          <form className="space-y-4" onSubmit={handleSignup}>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
                className="w-full px-4 py-2.5 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-2.5 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Graduation Year
              </label>
              <input
                type="number"
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                placeholder="2020"
                min="1990"
                max="2030"
                className="w-full px-4 py-2.5 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-4 py-2.5 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-md font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? "Creating account..." : "SIGN UP"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-secondary font-semibold hover:underline">
              Log In
            </Link>
          </p>
          <p className="text-center mt-2">
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
