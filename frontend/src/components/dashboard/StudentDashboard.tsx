import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, BookOpen, History, Star } from "lucide-react";
import TutorCard from "@/components/TutorCard";
import SessionCard from "@/components/SessionCard";
import RatingDialog from "@/components/RatingDialog";
import RequestSessionDialog from "@/components/RequestSessionDialog";
import { apiUsers, apiSessions } from "@/lib/api";

interface Props {
  userId?: string;
}

const StudentDashboard = ({ userId }: Props) => {
  const [tutors, setTutors] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTutors();
    fetchSessions();
  }, [userId]);

  const fetchTutors = async () => {
    const data = await apiUsers.tutors();
    setTutors(data);
    setLoading(false);
  };

  const fetchSessions = async () => {
    if (!userId) return;
    const data = await apiSessions.list();
    setSessions(data);
  };

  const filteredTutors = tutors.filter(
    (tutor) =>
      tutor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tutor.subject_expertise?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tutor.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Tutors</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tutors.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter((s) => s.status === "completed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList>
          <TabsTrigger value="browse">Browse Tutors</TabsTrigger>
          <TabsTrigger value="sessions">My Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Find a Tutor</CardTitle>
              <CardDescription>Search by name, subject, or department</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tutors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : filteredTutors.length === 0 ? (
                  <p className="text-muted-foreground">No tutors found</p>
                ) : (
                  filteredTutors.map((tutor) => (
                    <TutorCard key={tutor.id} tutor={tutor} studentId={userId} onSessionCreated={fetchSessions} />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Session History</CardTitle>
              <CardDescription>View and manage your tutoring sessions</CardDescription>
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
                      userRole="student"
                      onUpdate={fetchSessions}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentDashboard;