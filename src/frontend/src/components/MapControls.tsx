import { Loader2, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MapControlsProps {
  isLocating: boolean;
  isRelocating: boolean;
  onLocateMe: () => void;
  onToggleRelocate: () => void;
}

export function MapControls({
  isLocating,
  isRelocating,
  onLocateMe,
  onToggleRelocate,
}: MapControlsProps) {
  return (
    <div className="absolute bottom-6 right-4 z-[1000] flex flex-col gap-2">
      {/* My Location button */}
      <Button
        variant="outline"
        size="icon"
        onClick={onLocateMe}
        disabled={isLocating}
        className="h-10 w-10 rounded-full bg-card shadow-lg border-border"
        title="My Location"
      >
        {isLocating ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Navigation className="w-5 h-5" />
        )}
      </Button>
      {/* Relocate button */}
      <Button
        variant={isRelocating ? "default" : "outline"}
        size="icon"
        onClick={onToggleRelocate}
        className="h-10 w-10 rounded-full bg-card shadow-lg border-border"
        title={isRelocating ? "Cancel" : "Set Location"}
      >
        <MapPin className="w-5 h-5" />
      </Button>
    </div>
  );
}
