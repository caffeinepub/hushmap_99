import { useState, useEffect } from "react";
import { Loader2, Volume2, Wifi, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  NoiseLevel,
  WifiSpeed,
  QUIETNESS_OPTIONS,
  WIFI_OPTIONS,
} from "../constants/filters";

export interface LocationData {
  osmNodeId: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  address?: string;
}

export interface ExistingRating {
  noiseLevel: NoiseLevel;
  wifiSpeed: WifiSpeed;
  description?: string;
  editCount: number;
}

interface CheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: LocationData | null;
  existingRating: ExistingRating | null;
  isLoadingRating?: boolean;
  isSubmitting?: boolean;
  onSubmit: (data: {
    noiseLevel: NoiseLevel;
    wifiSpeed: WifiSpeed;
    description: string;
  }) => Promise<void>;
}

function SelectionButton<T extends string>({
  value,
  label,
  selected,
  onSelect,
  disabled,
  colorClass,
}: {
  value: T;
  label: string;
  selected: boolean;
  onSelect: (value: T) => void;
  disabled?: boolean;
  colorClass: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      disabled={disabled}
      className={cn(
        "flex-1 py-2.5 px-4 rounded-lg border-2 transition-all text-center",
        "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
        selected ? colorClass : "border-border bg-card hover:bg-accent/50",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <span
        className={cn("font-medium text-sm", selected && "text-foreground")}
      >
        {label}
      </span>
    </button>
  );
}

export function CheckInDialog({
  open,
  onOpenChange,
  location,
  existingRating,
  isLoadingRating = false,
  isSubmitting = false,
  onSubmit,
}: CheckInDialogProps) {
  const [noiseLevel, setNoiseLevel] = useState<NoiseLevel | "">("");
  const [wifiSpeed, setWifiSpeed] = useState<WifiSpeed | "">("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!existingRating;
  const canEdit = !existingRating || existingRating.editCount < 1;

  // Reset form when location changes or existingRating changes
  useEffect(() => {
    if (existingRating) {
      setNoiseLevel(existingRating.noiseLevel);
      setWifiSpeed(existingRating.wifiSpeed);
      setDescription(existingRating.description || "");
    } else {
      setNoiseLevel("");
      setWifiSpeed("");
      setDescription("");
    }
    setError(null);
  }, [existingRating, location?.osmNodeId]);

  const handleSubmit = async () => {
    if (!noiseLevel || !wifiSpeed) {
      setError("Please select both quietness and WiFi speed");
      return;
    }

    setError(null);

    try {
      await onSubmit({
        noiseLevel: noiseLevel as NoiseLevel,
        wifiSpeed: wifiSpeed as WifiSpeed,
        description,
      });
      onOpenChange(false);
      setNoiseLevel("");
      setWifiSpeed("");
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit rating");
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setNoiseLevel("");
      setWifiSpeed("");
      setDescription("");
      setError(null);
    }
    onOpenChange(newOpen);
  };

  if (!location) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg leading-tight">
                {isEditing ? "Edit Your Rating" : "Rate This Place"}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1 truncate">
                {location.name}
              </p>
              {!canEdit && (
                <p className="text-xs text-destructive mt-1">
                  You've already edited this rating once.
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        {isLoadingRating ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="px-6 pb-6 space-y-6">
            {/* Quietness */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Volume2 className="w-4 h-4 text-muted-foreground" />
                Quietness
              </Label>
              <div className="flex gap-2">
                {QUIETNESS_OPTIONS.map((option) => (
                  <SelectionButton
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    selected={noiseLevel === option.value}
                    onSelect={setNoiseLevel}
                    disabled={!canEdit}
                    colorClass={
                      option.value === "Quiet"
                        ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                        : option.value === "Moderate"
                          ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30"
                          : "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                    }
                  />
                ))}
              </div>
            </div>

            {/* WiFi */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Wifi className="w-4 h-4 text-muted-foreground" />
                WiFi Speed
              </Label>
              <div className="flex gap-2">
                {WIFI_OPTIONS.map((option) => (
                  <SelectionButton
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    selected={wifiSpeed === option.value}
                    onSelect={setWifiSpeed}
                    disabled={!canEdit}
                    colorClass={
                      option.value === "Fast"
                        ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                        : option.value === "Okay"
                          ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30"
                          : "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                    }
                  />
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-3">
              <Label htmlFor="description" className="text-sm font-medium">
                Notes{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="description"
                placeholder="Share tips: outlets, best seating, busy hours..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                disabled={!canEdit}
                className="resize-none min-h-[80px] bg-muted/30 border-muted"
                rows={3}
              />
              <p className="text-xs text-muted-foreground text-right">
                {description.length}/500
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="p-4 pt-0 gap-2 sm:gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !canEdit || isLoadingRating}
            className="flex-1 sm:flex-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : isEditing ? (
              "Update"
            ) : (
              "Submit"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
