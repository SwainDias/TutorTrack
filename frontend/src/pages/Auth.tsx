import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { GraduationCap } from "lucide-react";
import { loginSchema, signupSchema } from "@/lib/validation";
import { sanitizeError } from "@/lib/errorHandler";
import { apiAuth, apiUsers } from "@/lib/api";

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student" as "student" | "tutor",
    department: "",
    year_of_study: "",
    subject_expertise: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validated = loginSchema.parse(loginData);
      await apiAuth.login({
        email: validated.email,
        password: validated.password,
      });

      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (error: any) {
      if (error.errors) {
        toast.error(error.errors[0]?.message || "Invalid input");
      } else {
        toast.error(sanitizeError(error));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validated = signupSchema.parse({
        ...signupData,
        year_of_study: signupData.year_of_study ? parseInt(signupData.year_of_study) : undefined,
      });

      await apiAuth.signup({
        email: validated.email,
        password: validated.password,
        name: validated.name,
        role: validated.role,
        department: validated.department,
        year_of_study: validated.year_of_study,
        subject_expertise: validated.subject_expertise,
      });

      toast.success("Account created! Redirecting...");
      navigate("/dashboard");
    } catch (error: any) {
      if (error.errors) {
        toast.error(error.errors[0]?.message || "Invalid input");
      } else {
        toast.error(sanitizeError(error));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--gradient-hero)" }}>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <GraduationCap className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">TutorTrack</CardTitle>
          <CardDescription>Peer tutoring and progress tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your.email@college.edu"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    value={signupData.name}
                    onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your.email@college.edu"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-role">I am a</Label>
                  <Select value={signupData.role} onValueChange={(value: any) => setSignupData({ ...signupData, role: value })}>
                    <SelectTrigger id="signup-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="tutor">Tutor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-department">Department</Label>
                  <Input
                    id="signup-department"
                    placeholder="e.g., Computer Science"
                    value={signupData.department}
                    onChange={(e) => setSignupData({ ...signupData, department: e.target.value })}
                  />
                </div>
                {signupData.role === "student" && (
                  <div className="space-y-2">
                    <Label htmlFor="signup-year">Year of Study</Label>
                    <Select value={signupData.year_of_study} onValueChange={(value) => setSignupData({ ...signupData, year_of_study: value })}>
                      <SelectTrigger id="signup-year">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1st Year</SelectItem>
                        <SelectItem value="2">2nd Year</SelectItem>
                        <SelectItem value="3">3rd Year</SelectItem>
                        <SelectItem value="4">4th Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {signupData.role === "tutor" && (
                  <div className="space-y-2">
                    <Label htmlFor="signup-subjects">Subject Expertise</Label>
                    <Input
                      id="signup-subjects"
                      placeholder="e.g., Mathematics, Physics"
                      value={signupData.subject_expertise}
                      onChange={(e) => setSignupData({ ...signupData, subject_expertise: e.target.value })}
                    />
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;