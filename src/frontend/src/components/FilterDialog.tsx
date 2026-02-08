import { useState } from "react";
import { Filter, Volume2, Wifi, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  NOISE_FILTER_OPTIONS,
  WIFI_FILTER_OPTIONS,
  NoiseFilter,
  WifiFilter,
} from "../constants/filters";

interface FilterDialogProps {
  noiseFilter: NoiseFilter;
  onNoiseFilterChange: (filter: NoiseFilter) => void;
  wifiFilter: WifiFilter;
  onWifiFilterChange: (filter: WifiFilter) => void;
}

function FilterButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "py-2 px-3 rounded-lg border-2 transition-all text-center min-w-0",
        "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
        selected
          ? "border-primary bg-primary/10 text-primary font-medium"
          : "border-border bg-card hover:bg-accent/50",
      )}
    >
      <span className="text-xs sm:text-sm">{label}</span>
    </button>
  );
}

export function FilterDialog({
  noiseFilter,
  onNoiseFilterChange,
  wifiFilter,
  onWifiFilterChange,
}: FilterDialogProps) {
  const [open, setOpen] = useState(false);
  const [tempNoiseFilter, setTempNoiseFilter] =
    useState<NoiseFilter>(noiseFilter);
  const [tempWifiFilter, setTempWifiFilter] = useState<WifiFilter>(wifiFilter);

  const hasActiveFilters = noiseFilter !== "all" || wifiFilter !== "all";
  const activeFilterCount =
    (noiseFilter !== "all" ? 1 : 0) + (wifiFilter !== "all" ? 1 : 0);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setTempNoiseFilter(noiseFilter);
      setTempWifiFilter(wifiFilter);
    }
    setOpen(isOpen);
  };

  const handleApply = () => {
    onNoiseFilterChange(tempNoiseFilter);
    onWifiFilterChange(tempWifiFilter);
    setOpen(false);
  };

  const handleReset = () => {
    setTempNoiseFilter("all");
    setTempWifiFilter("all");
  };

  const handleClearFilters = () => {
    onNoiseFilterChange("all");
    onWifiFilterChange("all");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <div className="flex items-center gap-1">
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 relative",
              hasActiveFilters && "text-primary",
            )}
          >
            <Filter className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </DialogTrigger>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-8 w-8 p-0"
            title="Clear filters"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
            Filter Places
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
          {/* Quietness Filter */}
          <div className="space-y-2 sm:space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              Quietness
            </Label>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {NOISE_FILTER_OPTIONS.map((option) => (
                <FilterButton
                  key={option.value}
                  label={option.label}
                  selected={tempNoiseFilter === option.value}
                  onClick={() => setTempNoiseFilter(option.value)}
                />
              ))}
            </div>
          </div>

          {/* WiFi Filter */}
          <div className="space-y-2 sm:space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Wifi className="w-4 h-4 text-muted-foreground" />
              WiFi Speed
            </Label>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {WIFI_FILTER_OPTIONS.map((option) => (
                <FilterButton
                  key={option.value}
                  label={option.label}
                  selected={tempWifiFilter === option.value}
                  onClick={() => setTempWifiFilter(option.value)}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 pt-0 gap-2 sm:gap-2">
          <Button
            variant="ghost"
            onClick={handleReset}
            className="flex-1 sm:flex-none"
          >
            Reset
          </Button>
          <Button onClick={handleApply} className="flex-1 sm:flex-none">
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
