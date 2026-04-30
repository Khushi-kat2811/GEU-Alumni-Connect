import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index           from "./pages/Index.tsx";
import Login           from "./pages/Login.tsx";
import Signup          from "./pages/Signup.tsx";
import Dashboard       from "./pages/Dashboard.tsx";
import Profile         from "./pages/Profile.tsx";
import ProfileView     from "./pages/ProfileView.tsx";
import Network         from "./pages/Network.tsx";
import Messages        from "./pages/Messages.tsx";
import Resumes         from "./pages/Resumes.tsx";
import NotFound        from "./pages/NotFound.tsx";
import Communities     from "./pages/Communities.tsx";
import Jobs            from "./pages/Jobs.tsx";
import Admin           from "./pages/Admin.tsx";
import ChangePassword  from "./pages/ChangePassword.tsx";

const queryClient = new QueryClient();

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center text-muted-foreground">
    Loading...
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;

  // Force first-time / admin-reset users to change their password before
  // accessing anything else inside the dashboard.
  if (user.must_change_password && location.pathname !== "/dashboard/change-password") {
    return <Navigate to="/dashboard/change-password" replace />;
  }
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_admin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/"        element={<Index />} />
            <Route path="/login"   element={<Login />} />
            <Route path="/signup"  element={<Signup />} />

            <Route path="/dashboard"                  element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/profile"          element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/dashboard/profile/:id"      element={<ProtectedRoute><ProfileView /></ProtectedRoute>} />
            <Route path="/dashboard/network"          element={<ProtectedRoute><Network /></ProtectedRoute>} />
            <Route path="/dashboard/messages"         element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/dashboard/resumes"          element={<ProtectedRoute><Resumes /></ProtectedRoute>} />
            <Route path="/dashboard/communities"      element={<ProtectedRoute><Communities /></ProtectedRoute>} />
            <Route path="/dashboard/jobs"             element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
            <Route path="/dashboard/change-password"  element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
            <Route path="/dashboard/admin"            element={<AdminRoute><Admin /></AdminRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
