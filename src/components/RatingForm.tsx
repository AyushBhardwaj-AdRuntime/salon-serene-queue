import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RatingFormProps {
  onSubmit: (rating: number, customerName?: string, feedback?: string) => Promise<boolean>;
  customerName?: string;
}

export function RatingForm({ onSubmit, customerName: initialName }: RatingFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [customerName, setCustomerName] = useState(initialName || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);
    const success = await onSubmit(rating, customerName, feedback);
    setIsSubmitting(false);

    if (success) {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="flex justify-center mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-8 h-8 ${
                  star <= rating ? "text-yellow-400 fill-yellow-400" : "text-muted"
                }`}
              />
            ))}
          </div>
          <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
          <p className="text-muted-foreground">Your feedback helps us improve.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Rate Your Experience</CardTitle>
        <CardDescription>How was your visit today?</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star Rating */}
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-10 h-10 transition-colors ${
                    star <= (hoveredRating || rating)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>

          {!initialName && (
            <div className="space-y-2">
              <Label htmlFor="name">Your Name (optional)</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                maxLength={100}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback (optional)</Label>
            <Textarea
              id="feedback"
              placeholder="Tell us about your experience..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={rating === 0 || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Rating"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
