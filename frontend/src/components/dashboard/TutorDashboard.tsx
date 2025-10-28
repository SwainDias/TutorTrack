import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Clock, CheckCircle, XCircle, User, Star } from "lucide-react";
import SessionCard from "@/components/SessionCard";
import { toast } from "sonner";
import { tutorProfileSchema } from "@/lib/validation";
import { sanitizeError } from "@/lib/errorHandler";
import { apiUsers, apiSessions, apiRatings } from "@/lib/api";

interface Props {
  userId?: string;
}

const TutorDashboard = ({ userId }: Props) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [profileData, setProfileData] = useState({
    name: "",
    department: "",
    subject_expertise: "",
    availability_status: "available",
  });

  useEffect(() => {
    fetchProfile();
    fetchSessions();
    fetchRatings();
  }, [userId]);

  const fetchProfile = async () => {
    if (!userId) return;
    const data = (await apiUsers.tutors()).find((t) => (t._id || t.id) === userId) || null;
    if (data) {
      setProfile(data);
      setProfileData({
        name: data.name || "",
        department: data.department || "",
        subject_expertise: data.subject_expertise || "",
        availability_status: data.availability_status || "available",
      });
    }
  };

  const fetchSessions = async () => {
    if (!userId) return;
    const data = await apiSessions.list();
    setSessions(data.filter((s: any) => s.tutor_id === userId));
  };

  const fetchRatings = async () => {
    if (!userId) return;
    try {
      const ratings = await apiRatings.list({ tutor_id: userId });
      if (ratings.length > 0) {
        const avg = ratings.reduce((acc, r) => acc + (r.value || 0), 0) / ratings.length;
        setAvgRating(avg);
      } else {
        setAvgRating(0);
      }
    } catch (error) {
      console.error("Error fetching ratings:", error);
    }
  };
  
  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    // Validate input
    const validationResult = tutorProfileSchema.safeParse(profileData);
    
    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors[0]?.message || "Invalid input";
      toast.error(errorMessage);
      return;
    }

    try {
      await apiUsers.update(userId, profileData);
      toast.success("Profile updated successfully");
      setEditMode(false);
      fetchProfile();
    } catch (error) {
      toast.error(sanitizeError(error));
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter((s) => s.status === "pending").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter((s) => s.status === "accepted").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter((s) => s.status === "completed").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRating.toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sessions" className="w-full">
        <TabsList>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Session Requests</CardTitle>
              <CardDescription>Manage your tutoring sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.length === 0 ? (
                  <p className="text-muted-foreground">No sessions yet</p>
                ) : (
                  sessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      userRole="tutor"
                      onUpdate={fetchSessions}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Update your tutor information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={updateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    disabled={!editMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={profileData.department}
                    onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                    disabled={!editMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subjects">Subject Expertise</Label>
                  <Textarea
                    id="subjects"
                    value={profileData.subject_expertise}
                    onChange={(e) => setProfileData({ ...profileData, subject_expertise: e.target.value })}
                    disabled={!editMode}
                    placeholder="e.g., Mathematics, Physics, Chemistry"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="availability">Availability Status</Label>
                  <Input
                    id="availability"
                    value={profileData.availability_status}
                    onChange={(e) => setProfileData({ ...profileData, availability_status: e.target.value })}
                    disabled={!editMode}
                    placeholder="e.g., Available weekdays 2-6 PM"
                  />
                </div>
                <div className="flex gap-2">
                  {editMode ? (
                    <>
                      <Button type="submit">Save Changes</Button>
                      <Button type="button" variant="outline" onClick={() => setEditMode(false)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button type="button" onClick={() => setEditMode(true)}>
                      Edit Profile
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TutorDashboard;