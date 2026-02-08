import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useGeolocation } from "../hooks/useGeolocation";
import { useMap } from "../hooks/useMap";
import {
  useGetAllLocations,
  useGetMyRating,
  useCheckIn,
  useUpdateRating,
  useGetOsmPlaces,
  OsmPlace,
} from "../hooks/useQueries";
import { CheckInDialog, LocationData, ExistingRating } from "./CheckInDialog";
import { ReviewsDialog } from "./ReviewsDialog";
import { MapHeader } from "./MapHeader";
import { MapSearchBar, SearchResult } from "./MapSearchBar";
import { MapOverlays } from "./MapOverlays";
import { MapControls } from "./MapControls";
import {
  generatePopupHtml,
  generateMarkerIconHtml,
  calculateAverages,
} from "./LocationPreviewCard";
import {
  NoiseLevel,
  WifiSpeed,
  LocationType,
  Location as BackendLocation,
  Rating,
} from "../backend";
import { NoiseFilter, WifiFilter } from "../constants/filters";

interface MapViewProps {
  userName: string;
}

export function MapView({ userName }: MapViewProps) {
  const L = window.L;

  const [radius, setRadius] = useState<number>(1000);
  const [noiseFilter, setNoiseFilter] = useState<NoiseFilter>("all");
  const [wifiFilter, setWifiFilter] = useState<WifiFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRelocating, setIsRelocating] = useState(false);

  // Geolocation hook
  const {
    location: userLocation,
    hasSetLocation,
    isLocating,
    locateMe,
    setLocation,
  } = useGeolocation();

  // Map hook
  const {
    mapRef,
    markersRef,
    updateUserLocation,
    updateRadius,
    setRelocateMode,
    centerOnLocation,
  } = useMap({
    initialLocation: userLocation,
    initialRadius: radius,
    onMapClick: (newLocation) => {
      setLocation(newLocation);
      setIsRelocating(false);
    },
  });

  // Store markers by OSM node ID for search result selection
  const markersByIdRef = useRef<Map<number, any>>(new Map());

  // Update map when user location changes
  useEffect(() => {
    updateUserLocation(userLocation);
  }, [userLocation, updateUserLocation]);

  // Update map when radius changes
  useEffect(() => {
    updateRadius(radius);
  }, [radius, updateRadius]);

  // Update relocate mode
  useEffect(() => {
    setRelocateMode(isRelocating);
  }, [isRelocating, setRelocateMode]);

  // TanStack Query hooks
  const {
    data: backendLocations,
    refetch: refetchLocations,
    isError: isBackendError,
  } = useGetAllLocations();
  const { mutateAsync: checkIn, isPending: isCheckingIn } = useCheckIn();
  const { mutateAsync: updateRating, isPending: isUpdating } =
    useUpdateRating();

  // Fetch OSM places
  const {
    data: osmPlaces,
    isLoading: isLoadingPlaces,
    isError: isOsmError,
    refetch: refetchOsm,
  } = useGetOsmPlaces(userLocation[0], userLocation[1], radius);

  // Combined error state and refetch
  const hasError = isOsmError || isBackendError;
  const refetchAll = () => {
    refetchOsm();
    refetchLocations();
  };

  // Check-in dialog state
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    null,
  );

  // Fetch user's existing rating for selected location
  const { data: myRating, isLoading: isLoadingRating } = useGetMyRating(
    selectedLocation?.osmNodeId ?? null,
  );

  // Convert backend rating to ExistingRating format
  const existingRating: ExistingRating | null = useMemo(() => {
    if (!myRating) return null;
    return {
      noiseLevel: myRating.noiseLevel as "Quiet" | "Moderate" | "Buzzing",
      wifiSpeed: myRating.wifiSpeed as "Slow" | "Okay" | "Fast",
      description: myRating.description || undefined,
      editCount: Number(myRating.editCount),
    };
  }, [myRating]);

  // Backend locations map (derived from query)
  const ratedLocations = useMemo(() => {
    const map = new Map<string, BackendLocation>();
    backendLocations?.forEach((loc) => {
      map.set(loc.osmNodeId, loc);
    });
    return map;
  }, [backendLocations]);

  // Reviews dialog state
  const [reviewsDialogOpen, setReviewsDialogOpen] = useState(false);
  const [reviewsLocation, setReviewsLocation] = useState<{
    name: string;
    ratings: Rating[];
  } | null>(null);

  // Handle check-in from map popup
  const handleCheckIn = useCallback((locationData: LocationData) => {
    setSelectedLocation(locationData);
    setCheckInDialogOpen(true);
    // Rating is automatically fetched by useMyRating hook
  }, []);

  // Handle submit from dialog
  const handleSubmitRating = useCallback(
    async (data: {
      noiseLevel: "Quiet" | "Moderate" | "Buzzing";
      wifiSpeed: "Slow" | "Okay" | "Fast";
      description: string;
    }) => {
      if (!selectedLocation) {
        throw new Error("No location selected");
      }

      const noiseLevel = NoiseLevel[data.noiseLevel];
      const wifiSpeed = WifiSpeed[data.wifiSpeed];
      const description = data.description || null;

      if (existingRating) {
        // Update existing rating
        await updateRating({
          osmNodeId: selectedLocation.osmNodeId,
          noiseLevel,
          wifiSpeed,
          description,
        });
      } else {
        // Create new rating
        const locationType =
          selectedLocation.type === "cafe"
            ? LocationType.Cafe
            : selectedLocation.type === "library"
              ? LocationType.Library
              : LocationType.CoworkingSpace;

        await checkIn({
          locationInput: {
            osmNodeId: selectedLocation.osmNodeId,
            name: selectedLocation.name,
            locationType,
            lat: selectedLocation.lat,
            lng: selectedLocation.lng,
            address: selectedLocation.address,
          },
          noiseLevel,
          wifiSpeed,
          description,
        });
      }
    },
    [selectedLocation, existingRating, checkIn, updateRating],
  );

  // Listen for checkin events from map popups
  useEffect(() => {
    const handleCheckinEvent = (e: CustomEvent<LocationData>) => {
      handleCheckIn(e.detail);
    };

    window.addEventListener("checkin", handleCheckinEvent as EventListener);
    return () => {
      window.removeEventListener(
        "checkin",
        handleCheckinEvent as EventListener,
      );
    };
  }, [handleCheckIn]);

  // Listen for view reviews events from map popups
  useEffect(() => {
    const handleViewReviews = (
      e: CustomEvent<{ osmNodeId: string; name: string }>,
    ) => {
      const location = ratedLocations.get(e.detail.osmNodeId);
      if (location) {
        setReviewsLocation({ name: e.detail.name, ratings: location.ratings });
        setReviewsDialogOpen(true);
      }
    };

    window.addEventListener("viewreviews", handleViewReviews as EventListener);
    return () => {
      window.removeEventListener(
        "viewreviews",
        handleViewReviews as EventListener,
      );
    };
  }, [ratedLocations]);

  // Update markers when OSM places or ratings change
  useEffect(() => {
    if (!osmPlaces || !markersRef.current) return;

    markersRef.current.clearLayers();
    markersByIdRef.current.clear();

    osmPlaces.forEach((element: OsmPlace) => {
      const { id, lat, lon, tags } = element;
      const osmNodeId = `node/${id}`;
      const name = tags?.name || "Unknown";
      const amenity = tags?.amenity || "place";
      const address = tags?.["addr:street"]
        ? `${tags["addr:housenumber"] || ""} ${tags["addr:street"]}`.trim()
        : undefined;
      const openingHours = tags?.opening_hours;

      // Check if we have ratings for this location
      const backendLocation = ratedLocations.get(osmNodeId);
      const hasRatings = !!(
        backendLocation && backendLocation.ratings.length > 0
      );
      const ratings = hasRatings
        ? backendLocation.ratings.map((r) => ({
            noiseLevel: r.noiseLevel,
            wifiSpeed: r.wifiSpeed,
            description: r.description,
          }))
        : [];

      // Apply noise/wifi filters
      if (noiseFilter !== "all" || wifiFilter !== "all") {
        if (!hasRatings) return; // Skip unrated locations when filtering

        const averages = calculateAverages(ratings);
        if (!averages) return;

        // Apply noise filter
        if (noiseFilter !== "all") {
          const noiseLabel = averages.noiseLabel.toLowerCase();
          if (noiseFilter !== noiseLabel) return;
        }

        // Apply wifi filter
        if (wifiFilter !== "all") {
          const wifiLabel = averages.wifiLabel.toLowerCase();
          if (wifiFilter !== wifiLabel) return;
        }
      }

      // Generate marker icon
      const { html: iconHtml } = generateMarkerIconHtml(
        amenity,
        hasRatings,
        ratings,
      );
      const markerIcon = L.divIcon({
        className: "place-marker",
        html: iconHtml,
        iconSize: [32, 40],
        iconAnchor: [16, 20],
        popupAnchor: [0, -20],
      });

      // Generate popup HTML
      const popupHtml = generatePopupHtml({
        osmNodeId,
        name,
        amenity,
        lat,
        lng: lon,
        address,
        openingHours,
        ratings,
      });

      const marker = L.marker([lat, lon], { icon: markerIcon });
      marker.bindPopup(popupHtml);
      markersRef.current?.addLayer(marker);
      markersByIdRef.current.set(id, marker);
    });
  }, [osmPlaces, ratedLocations, L, noiseFilter, wifiFilter]);

  // Compute search results for dropdown
  const searchResults: SearchResult[] = useMemo(() => {
    if (!searchQuery || !osmPlaces) return [];
    const query = searchQuery.toLowerCase().trim();
    return osmPlaces
      .filter((p) => {
        const name = p.tags?.name?.toLowerCase() || "";
        const amenity = p.tags?.amenity?.toLowerCase().replace("_", " ") || "";
        const matchesQuery = name.includes(query) || amenity.includes(query);
        if (!matchesQuery) return false;

        // Apply noise/wifi filters if active
        if (noiseFilter !== "all" || wifiFilter !== "all") {
          const osmNodeId = `node/${p.id}`;
          const backendLocation = ratedLocations.get(osmNodeId);
          if (!backendLocation || backendLocation.ratings.length === 0) {
            return false; // Skip unrated when filtering
          }
          const ratings = backendLocation.ratings.map((r) => ({
            noiseLevel: r.noiseLevel,
            wifiSpeed: r.wifiSpeed,
          }));
          const averages = calculateAverages(ratings);
          if (!averages) return false;

          if (
            noiseFilter !== "all" &&
            noiseFilter !== averages.noiseLabel.toLowerCase()
          ) {
            return false;
          }
          if (
            wifiFilter !== "all" &&
            wifiFilter !== averages.wifiLabel.toLowerCase()
          ) {
            return false;
          }
        }

        return true;
      })
      .map((p) => ({
        id: p.id,
        name: p.tags?.name || "Unknown",
        amenity: p.tags?.amenity || "place",
        lat: p.lat,
        lon: p.lon,
      }));
  }, [searchQuery, osmPlaces, noiseFilter, wifiFilter, ratedLocations]);

  // Handle search result selection
  const handleSearchResultSelect = useCallback(
    (result: SearchResult) => {
      centerOnLocation([result.lat, result.lon]);
      const marker = markersByIdRef.current.get(result.id);
      if (marker) {
        marker.openPopup();
      }
    },
    [centerOnLocation],
  );

  // Map view
  return (
    <div className="h-screen flex flex-col">
      <MapHeader userName={userName} />

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="absolute inset-0" />

        {/* Floating search bar */}
        <MapSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          radius={radius}
          onRadiusChange={setRadius}
          noiseFilter={noiseFilter}
          onNoiseFilterChange={setNoiseFilter}
          wifiFilter={wifiFilter}
          onWifiFilterChange={setWifiFilter}
          searchResults={searchResults}
          onResultSelect={handleSearchResultSelect}
        />

        <MapOverlays
          isRelocating={isRelocating}
          isLoading={isLoadingPlaces}
          hasError={hasError}
          hasSetLocation={hasSetLocation}
          onRetry={refetchAll}
        />

        <MapControls
          isLocating={isLocating}
          isRelocating={isRelocating}
          onLocateMe={locateMe}
          onToggleRelocate={() => setIsRelocating(!isRelocating)}
        />
      </div>

      {/* Check-in Dialog */}
      <CheckInDialog
        open={checkInDialogOpen}
        onOpenChange={setCheckInDialogOpen}
        location={selectedLocation}
        existingRating={existingRating}
        isLoadingRating={isLoadingRating}
        onSubmit={handleSubmitRating}
      />

      {/* Reviews Dialog */}
      <ReviewsDialog
        open={reviewsDialogOpen}
        onOpenChange={setReviewsDialogOpen}
        locationName={reviewsLocation?.name || ""}
        ratings={reviewsLocation?.ratings || []}
      />
    </div>
  );
}
