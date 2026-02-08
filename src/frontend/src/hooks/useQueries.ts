import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";
import {
  NoiseLevel,
  WifiSpeed,
  LocationType,
  LocationInput,
  Location,
  Rating,
} from "../backend";

// Query keys
export const locationKeys = {
  all: ["locations"] as const,
  myRating: (osmNodeId: string) => ["myRating", osmNodeId] as const,
  osmPlaces: (lat: number, lng: number, radius: number) =>
    ["osmPlaces", lat, lng, radius] as const,
};

// OSM Place type
export type OsmPlace = {
  id: number;
  lat: number;
  lon: number;
  tags?: {
    name?: string;
    amenity?: string;
    "addr:street"?: string;
    "addr:housenumber"?: string;
    opening_hours?: string;
  };
};

// Round coordinates for cache key stability (~100m precision)
function roundCoord(coord: number): number {
  return Math.round(coord * 1000) / 1000;
}

// localStorage cache helpers for OSM data
const OSM_CACHE_TTL = 8 * 60 * 60 * 1000; // 8 hours

function getOsmCacheKey(lat: number, lng: number, radius: number): string {
  return `osm_places_${lat}_${lng}_${radius}`;
}

function getCachedOsmPlaces(key: string): OsmPlace[] | null {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > OSM_CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setCachedOsmPlaces(key: string, data: OsmPlace[]): void {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // localStorage full or unavailable - ignore
  }
}

// Fetch nearby places from OpenStreetMap Overpass API
export function useGetOsmPlaces(
  lat: number | null,
  lng: number | null,
  radius: number,
) {
  const roundedLat = lat ? roundCoord(lat) : 0;
  const roundedLng = lng ? roundCoord(lng) : 0;

  return useQuery<OsmPlace[]>({
    queryKey: locationKeys.osmPlaces(roundedLat, roundedLng, radius),
    queryFn: async () => {
      if (!lat || !lng) return [];

      const cacheKey = getOsmCacheKey(roundedLat, roundedLng, radius);

      // Check localStorage first
      const cached = getCachedOsmPlaces(cacheKey);
      if (cached) return cached;

      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="cafe"](around:${radius},${lat},${lng});
          node["amenity"="library"](around:${radius},${lat},${lng});
          node["amenity"="coworking_space"](around:${radius},${lat},${lng});
        );
        out body;
      `;

      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
      });
      const data = await response.json();
      const places = data.elements || [];

      // Save to localStorage
      setCachedOsmPlaces(cacheKey, places);

      return places;
    },
    enabled: !!lat && !!lng,
    staleTime: 8 * 60 * 60 * 1000, // 8 hours - OSM data doesn't change often
    gcTime: 8 * 60 * 60 * 1000, // Keep in cache for 8 hours
  });
}

// Fetch all locations with ratings
export function useGetAllLocations() {
  const { actor, isFetching } = useActor();
  return useQuery<Location[]>({
    queryKey: locationKeys.all,
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllLocations();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
  });
}

// Fetch user's rating for a specific location
export function useGetMyRating(osmNodeId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Rating | null>({
    queryKey: locationKeys.myRating(osmNodeId || ""),
    queryFn: async () => {
      if (!actor || !osmNodeId) return null;
      return actor.getMyRating(osmNodeId);
    },
    enabled: !!actor && !isFetching && !!osmNodeId,
  });
}

// Check in mutation (create new rating)
export function useCheckIn() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      locationInput,
      noiseLevel,
      wifiSpeed,
      description,
    }: {
      locationInput: LocationInput;
      noiseLevel: NoiseLevel;
      wifiSpeed: WifiSpeed;
      description: string | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.checkIn(locationInput, noiseLevel, wifiSpeed, description);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: locationKeys.all });
      queryClient.invalidateQueries({
        queryKey: locationKeys.myRating(variables.locationInput.osmNodeId),
      });
    },
  });
}

// Update rating mutation
export function useUpdateRating() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      osmNodeId,
      noiseLevel,
      wifiSpeed,
      description,
    }: {
      osmNodeId: string;
      noiseLevel: NoiseLevel;
      wifiSpeed: WifiSpeed;
      description: string | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateRating(osmNodeId, noiseLevel, wifiSpeed, description);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: locationKeys.all });
      queryClient.invalidateQueries({
        queryKey: locationKeys.myRating(variables.osmNodeId),
      });
    },
  });
}

// Fetch user profile
export function useProfile() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["profile", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.getProfile();
      return result ?? null;
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

// Set user profile
export function useSetProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.setProfile(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["profile", identity?.getPrincipal().toString()],
      });
    },
  });
}
