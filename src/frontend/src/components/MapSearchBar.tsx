import { useState, useRef, useEffect } from "react";
import { Search, X, Coffee, Library, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RADIUS_OPTIONS, NoiseFilter, WifiFilter } from "../constants/filters";
import { FilterDialog } from "./FilterDialog";

export interface SearchResult {
  id: number;
  name: string;
  amenity: string;
  lat: number;
  lon: number;
}

interface MapSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  radius: number;
  onRadiusChange: (radius: number) => void;
  noiseFilter: NoiseFilter;
  onNoiseFilterChange: (filter: NoiseFilter) => void;
  wifiFilter: WifiFilter;
  onWifiFilterChange: (filter: WifiFilter) => void;
  searchResults?: SearchResult[];
  onResultSelect?: (result: SearchResult) => void;
}

function getAmenityIcon(amenity: string) {
  if (amenity === "cafe") return Coffee;
  if (amenity === "library") return Library;
  return Briefcase;
}

export function MapSearchBar({
  searchQuery,
  onSearchChange,
  radius,
  onRadiusChange,
  noiseFilter,
  onNoiseFilterChange,
  wifiFilter,
  onWifiFilterChange,
  searchResults = [],
  onResultSelect,
}: MapSearchBarProps) {
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResultClick = (result: SearchResult) => {
    onResultSelect?.(result);
    setShowResults(false);
  };

  return (
    <div
      ref={containerRef}
      className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]"
    >
      <div className="flex items-center gap-2 bg-card border border-border rounded-full shadow-lg px-2 py-1.5">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search places..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setShowResults(true)}
            className="pl-9 pr-8 h-8 w-44 sm:w-56 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {searchQuery && (
            <button
              onClick={() => {
                onSearchChange("");
                setShowResults(false);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="w-px h-6 bg-border" />

        {/* Filter button */}
        <FilterDialog
          noiseFilter={noiseFilter}
          onNoiseFilterChange={onNoiseFilterChange}
          wifiFilter={wifiFilter}
          onWifiFilterChange={onWifiFilterChange}
        />

        <div className="w-px h-6 bg-border" />

        {/* Radius selector */}
        <Select
          value={radius.toString()}
          onValueChange={(value) => onRadiusChange(parseInt(value))}
        >
          <SelectTrigger className="w-20 h-8 border-0 bg-transparent focus:ring-0 focus:ring-offset-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[1001]">
            {RADIUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Search results dropdown */}
      {showResults && searchQuery && searchResults.length > 0 && (
        <div className="mt-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden max-h-64 overflow-y-auto">
          {searchResults.slice(0, 5).map((result) => {
            const Icon = getAmenityIcon(result.amenity);
            return (
              <button
                key={result.id}
                onClick={() => handleResultClick(result)}
                className="w-full px-3 py-2 flex items-center gap-3 hover:bg-accent/50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{result.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {result.amenity.replace("_", " ")}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
