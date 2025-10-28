import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Star } from "lucide-react";
import RequestSessionDialog from "./RequestSessionDialog";

interface Props {
  tutor: any;
  studentId?: string;
  onSessionCreated: () => void;
}

const TutorCard = ({ tutor, studentId, onSessionCreated }: Props) => {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-primary/10">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{tutor.name}</CardTitle>
              <CardDescription>{tutor.department}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {tutor.subject_expertise && (
            <div>
              <p className="text-sm font-medium mb-1">Subjects:</p>
              <p className="text-sm text-muted-foreground">{tutor.subject_expertise}</p>
            </div>
          )}
          {tutor.availability_status && (
            <Badge variant="secondary" className="text-xs">
              {tutor.availability_status}
            </Badge>
          )}
          <Button
            className="w-full"
            onClick={() => setShowDialog(true)}
            disabled={!studentId}
          >
            Request Session
          </Button>
        </CardContent>
      </Card>

      <RequestSessionDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        tutorId={tutor._id || tutor.id}
        tutorName={tutor.name}
        studentId={studentId}
        onSuccess={() => {
          setShowDialog(false);
          onSessionCreated();
        }}
      />
    </>
  );
};

export default TutorCard;