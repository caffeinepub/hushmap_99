import { Volume2, Wifi } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Rating } from "../backend";

interface ReviewsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationName: string;
  ratings: Rating[];
}

// Rating score mappings (1-3 scale) - higher is always better
// Noise: Quiet=3 (best), Moderate=2, Buzzing=1 (worst)
// WiFi: Fast=3 (best), Okay=2, Slow=1 (worst)
const NOISE_SCORES: Record<string, number> = {
  Quiet: 3,
  Moderate: 2,
  Buzzing: 1,
};
const WIFI_SCORES: Record<string, number> = { Slow: 1, Okay: 2, Fast: 3 };

// For both: higher = better (green)
function getScoreColor(score: number): string {
  if (score >= 2.5) return "text-green-600";
  if (score >= 1.5) return "text-yellow-600";
  return "text-orange-600";
}

function getScoreBg(score: number): string {
  if (score >= 2.5) return "bg-green-50";
  if (score >= 1.5) return "bg-yellow-50";
  return "bg-orange-50";
}

function formatDate(timestamp: bigint): string {
  const date = new Date(Number(timestamp) / 1_000_000); // Convert nanoseconds to milliseconds
  return format(date, "MMM d, yyyy");
}

export function ReviewsDialog({
  open,
  onOpenChange,
  locationName,
  ratings,
}: ReviewsDialogProps) {
  // Sort ratings by createdAt descending (newest first)
  const sortedRatings = [...ratings].sort(
    (a, b) => Number(b.createdAt) - Number(a.createdAt),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Reviews</DialogTitle>
          <DialogDescription>{locationName}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 py-2">
          {sortedRatings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No reviews yet
            </p>
          ) : (
            sortedRatings.map((rating, index) => {
              const noiseScore = NOISE_SCORES[rating.noiseLevel] || 2;
              const wifiScore = WIFI_SCORES[rating.wifiSpeed] || 2;

              return (
                <div
                  key={index}
                  className="border border-border rounded-lg p-3 space-y-2"
                >
                  {/* Scores */}
                  <div className="flex gap-3">
                    <div
                      className={`flex items-center gap-1.5 px-2 py-1 rounded ${getScoreBg(noiseScore)}`}
                    >
                      <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
                      <span
                        className={`text-sm font-medium ${getScoreColor(noiseScore)}`}
                      >
                        {noiseScore}/3
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({rating.noiseLevel})
                      </span>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 px-2 py-1 rounded ${getScoreBg(wifiScore)}`}
                    >
                      <Wifi className="w-3.5 h-3.5 text-muted-foreground" />
                      <span
                        className={`text-sm font-medium ${getScoreColor(wifiScore)}`}
                      >
                        {wifiScore}/3
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({rating.wifiSpeed})
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {rating.description && (
                    <p className="text-sm text-foreground">
                      "{rating.description}"
                    </p>
                  )}

                  {/* Date */}
                  <p className="text-xs text-muted-foreground">
                    {formatDate(rating.createdAt)}
                    {rating.editCount > 0 && " (edited)"}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
