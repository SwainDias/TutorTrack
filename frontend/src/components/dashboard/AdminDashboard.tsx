import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, BookOpen, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiAdmin, apiSessions } from "@/lib/api";

interface Props {
  userId?: string;
}

const AdminDashboard = ({ userId }: Props) => {
  const [users, setUsers] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const userData = await apiAdmin.users();
    setUsers(userData);

    const sessionData = await apiSessions.list();
    setSessions(sessionData);

    const ratingData = await apiAdmin.ratings(); // now available
    setRatings(ratingData);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const { type, id } = deleteTarget;
    let error;

    try {
      if (type === "user") {
        await apiAdmin.deleteUser(id);
      } else if (type === "session") {
        await apiSessions.remove(id);
      } else if (type === "rating") {
        await apiAdmin.deleteRating(id);
      }
    } catch (e) {
      error = e as any;
    }

    if (error) {
      toast.error(`Failed to delete ${type}`);
    } else {
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);
      fetchData();
    }

    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ratings</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ratings.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="ratings">Ratings</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage Users</CardTitle>
              <CardDescription>View and manage all user accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        Role: {user.user_roles?.[0]?.role || "Unknown"}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteTarget({ type: "user", id: user.id })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monitor Sessions</CardTitle>
              <CardDescription>View and manage all tutoring sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{session.subject_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Student: {session.student?.name} | Tutor: {session.tutor?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.session_date} at {session.session_time} | Status: {session.status}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteTarget({ type: "session", id: session.id })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ratings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage Ratings</CardTitle>
              <CardDescription>View and manage all tutor ratings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ratings.map((rating) => (
                  <div key={rating.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < rating.value ? "fill-primary text-primary" : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Student: {rating.student?.name} | Tutor: {rating.tutor?.name}
                      </p>
                      {rating.feedback && (
                        <p className="text-sm mt-1">"{rating.feedback}"</p>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteTarget({ type: "rating", id: rating.id })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {deleteTarget?.type}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard;