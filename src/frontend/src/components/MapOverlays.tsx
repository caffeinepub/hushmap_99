import { Loader2, MapPin, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MapOverlaysProps {
  isRelocating: boolean;
  isLoading: boolean;
  hasError: boolean;
  hasSetLocation: boolean;
  onRetry: () => void;
}

export function MapOverlays({
  isRelocating,
  isLoading,
  hasError,
  hasSetLocation,
  onRetry,
}: MapOverlaysProps) {
  return (
    <>
      {/* Relocate mode overlay */}
      {isRelocating && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-primary text-primary-foreground rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span className="text-sm font-medium">
            Tap anywhere to pin your location
          </span>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && !isRelocating && !hasError && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-card border border-border rounded-full px-4 py-2 shadow-md flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">
            Loading places...
          </span>
        </div>
      )}

      {/* Error overlay */}
      {hasError && !isRelocating && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-2 shadow-md flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-destructive" />
          <span className="text-sm text-destructive">
            Failed to load places
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="h-7 px-2 text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        </div>
      )}

      {/* Location hint overlay - shown when user hasn't set their location */}
      {!hasSetLocation && !isRelocating && !isLoading && !hasError && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-card border border-border rounded-lg px-4 py-3 shadow-lg flex items-center gap-3">
          <MapPin className="w-5 h-5 text-primary" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Set your location</span>
            <span className="text-xs text-muted-foreground">
              Use the location button or tap the pin icon to set manually
            </span>
          </div>
        </div>
      )}
    </>
  );
}
