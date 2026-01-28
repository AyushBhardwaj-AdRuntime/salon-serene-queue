import { Star } from "lucide-react";

interface RatingDisplayProps {
  rating: number;
  count?: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
}

export function RatingDisplay({ rating, count, size = "sm", showCount = true }: RatingDisplayProps) {
  const starSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  if (rating === 0 && !count) {
    return (
      <div className={`flex items-center gap-1 text-muted-foreground ${textSizes[size]}`}>
        <Star className={`${starSizes[size]} text-muted-foreground`} />
        <span>No ratings yet</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${textSizes[size]}`}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSizes[size]} ${
              star <= Math.round(rating)
                ? "text-yellow-400 fill-yellow-400"
                : "text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
      <span className="font-medium">{rating.toFixed(1)}</span>
      {showCount && count !== undefined && count > 0 && (
        <span className="text-muted-foreground">({count})</span>
      )}
    </div>
  );
}
