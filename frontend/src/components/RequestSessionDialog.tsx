import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { sessionRequestSchema } from "@/lib/validation";
import { sanitizeError } from "@/lib/errorHandler";
import { apiSessions } from "@/lib/api";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tutorId: string;
  tutorName: string;
  studentId?: string;
  onSuccess: () => void;
}

const RequestSessionDialog = ({ open, onOpenChange, tutorId, tutorName, studentId, onSuccess }: Props) => {
  const [formData, setFormData] = useState({
    subject_name: "",
    session_date: "",
    session_time: "",
    duration: "60",
    location: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      toast.error("You must be logged in as a student");
      return;
    }

    setLoading(true);

    try {
      const validated = sessionRequestSchema.parse({
        subject: formData.subject_name,
        date: formData.session_date,
        time: formData.session_time,
        duration: parseInt(formData.duration),
        location: formData.location,
      });

      await apiSessions.create({
        tutor_id: tutorId,
        subject_name: validated.subject,
        date: validated.date,
        time: validated.time,
        duration: validated.duration,
        location: validated.location,
      });

      toast.success("Session request sent!");
      setFormData({
        subject_name: "",
        session_date: "",
        session_time: "",
        duration: "60",
        location: "",
      });
      onSuccess();
    } catch (error: any) {
      if (error.errors) {
        toast.error(error.errors[0]?.message || "Invalid input");
      } else {
        toast.error(sanitizeError(error));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Session with {tutorName}</DialogTitle>
          <DialogDescription>Fill in the session details</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="e.g., Calculus, Physics"
              value={formData.subject_name}
              onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.session_date}
                onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.session_time}
                onChange={(e) => setFormData({ ...formData, session_time: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min="15"
              step="15"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., Library Room 201"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Sending..." : "Send Request"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RequestSessionDialog;