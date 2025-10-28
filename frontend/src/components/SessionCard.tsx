import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Star } from "lucide-react";
import { toast } from "sonner";
import RatingDialog from "./RatingDialog";
import { apiSessions } from "@/lib/api";

interface Props {
  session: any;
  userRole: "student" | "tutor" | "admin";
  onUpdate: () => void;
}

const SessionCard = ({ session, userRole, onUpdate }: Props) => {
  const [showRating, setShowRating] = useState(false);

  const updateSessionStatus = async (status: "pending" | "accepted" | "rejected" | "completed" | "cancelled") => {
    try {
      await apiSessions.update(session.id, { status });
      toast.success(`Session ${status}`);
      onUpdate();
    } catch (e) {
      toast.error("Failed to update session");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300";
      case "accepted": return "bg-green-500/20 text-green-700 dark:text-green-300";
      case "rejected": return "bg-red-500/20 text-red-700 dark:text-red-300";
      case "completed": return "bg-blue-500/20 text-blue-700 dark:text-blue-300";
      case "cancelled": return "bg-gray-500/20 text-gray-700 dark:text-gray-300";
      default: return "";
    }
  };

  const hasRating = session.ratings && session.ratings.length > 0;
  const canRate = userRole === "student" && session.status === "completed" && !hasRating;

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold">{session.subject_name}</h3>
                <Badge className={getStatusColor(session.status)}>
                  {session.status}
                </Badge>
              </div>
              
              <div className="space-y-1 text-sm text-muted-foreground">
                {userRole === "student" && session.tutor && (
                  <p>Tutor: {session.tutor.name}</p>
                )}
                {userRole === "tutor" && session.student && (
                  <p>Student: {session.student.name}</p>
                )}
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {session.session_date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {session.session_time} ({session.duration} min)
                  </span>
                  {session.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {session.location}
                    </span>
                  )}
                </div>
              </div>

              {hasRating && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < session.ratings[0].value
                            ? "fill-primary text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  {session.ratings[0].feedback && (
                    <span className="text-sm text-muted-foreground">
                      "{session.ratings[0].feedback}"
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              {userRole === "tutor" && session.status === "pending" && (
                <>
                  <Button size="sm" onClick={() => updateSessionStatus("accepted")}>
                    Accept
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => updateSessionStatus("rejected")}>
                    Reject
                  </Button>
                </>
              )}
              {userRole === "tutor" && session.status === "accepted" && (
                <Button size="sm" onClick={() => updateSessionStatus("completed")}>
                  Mark Complete
                </Button>
              )}
              {canRate && (
                <Button size="sm" onClick={() => setShowRating(true)}>
                  <Star className="w-4 h-4 mr-1" />
                  Rate
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <RatingDialog
        open={showRating}
        onOpenChange={setShowRating}
        sessionId={session.id}
        tutorId={session.tutor_id}
        studentId={session.student_id}
        onSuccess={() => {
          setShowRating(false);
          onUpdate();
        }}
      />
    </>
  );
};

export default SessionCard;