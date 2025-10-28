import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import StudentDashboard from "@/components/dashboard/StudentDashboard";
import TutorDashboard from "@/components/dashboard/TutorDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import { LogOut, GraduationCap } from "lucide-react";
import { apiAuth } from "@/lib/api";

const Dashboard = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, [navigate]);

  const checkAuth = async () => {
    try {
      const { user } = await apiAuth.me();
      if (!user) {
        navigate("/auth");
        return;
      }

      setUserId(user._id || user.id);
      setRole(user.role || null);
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await apiAuth.logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">TutorTrack</h1>
              <p className="text-sm text-muted-foreground capitalize">{role} Dashboard</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {role === "student" && <StudentDashboard userId={userId || undefined} />}
        {role === "tutor" && <TutorDashboard userId={userId || undefined} />}
        {role === "admin" && <AdminDashboard userId={userId || undefined} />}
      </main>
    </div>
  );
};

export default Dashboard;