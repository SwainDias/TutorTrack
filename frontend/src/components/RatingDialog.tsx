import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { ratingSchema } from "@/lib/validation";
import { sanitizeError } from "@/lib/errorHandler";
import { apiRatings } from "@/lib/api";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  tutorId: string;
  studentId: string;
  onSuccess: () => void;
}

const RatingDialog = ({ open, onOpenChange, sessionId, tutorId, studentId, onSuccess }: Props) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      const validated = ratingSchema.parse({
        rating,
        feedback: feedback.trim() || undefined,
      });

      await apiRatings.create({
        session_id: sessionId,
        tutor_id: tutorId,
        value: validated.rating,
        feedback: validated.feedback || undefined,
      });

      toast.success("Rating submitted!");
      setRating(0);
      setFeedback("");
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
          <DialogTitle>Rate This Session</DialogTitle>
          <DialogDescription>Share your experience with the tutor</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      value <= rating
                        ? "fill-primary text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback (Optional)</Label>
            <Textarea
              id="feedback"
              placeholder="Share your thoughts about the session..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Submitting..." : "Submit Rating"}
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

export default RatingDialog;