import { useState, useCallback, useEffect, useRef } from "react";

// Default location (DFINITY Stiftung, Zürich) - used until user sets their location
const DEFAULT_LOCATION: [number, number] = [
  47.36450050601848, 8.534532028862294,
];

interface UseGeolocationOptions {
  onLocationChange?: (location: [number, number]) => void;
}

interface UseGeolocationReturn {
  location: [number, number];
  hasSetLocation: boolean;
  isLocating: boolean;
  locateMe: () => void;
  setLocation: (location: [number, number]) => void;
}

export function useGeolocation(
  options?: UseGeolocationOptions,
): UseGeolocationReturn {
  const { onLocationChange } = options || {};

  const [location, setLocationState] =
    useState<[number, number]>(DEFAULT_LOCATION);
  const [hasSetLocation, setHasSetLocation] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Keep callback ref stable
  const onLocationChangeRef = useRef(onLocationChange);
  onLocationChangeRef.current = onLocationChange;

  // Set location manually (e.g., from map click)
  const setLocation = useCallback((newLocation: [number, number]) => {
    setLocationState(newLocation);
    setHasSetLocation(true);
    onLocationChangeRef.current?.(newLocation);
  }, []);

  // Get current GPS location
  const locateMe = useCallback(() => {
    if (!navigator.geolocation) {
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        setLocationState(newLocation);
        setHasSetLocation(true);
        onLocationChangeRef.current?.(newLocation);
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  // Try to get user location on mount (non-blocking, no timeout - waits for user to accept/deny)
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        setLocationState(newLocation);
        setHasSetLocation(true);
        onLocationChangeRef.current?.(newLocation);
      },
      (error) => {
        console.error("Geolocation not available:", error);
        // User can manually set location - no blocking
      },
      { enableHighAccuracy: true },
    );
  }, []);

  return {
    location,
    hasSetLocation,
    isLocating,
    locateMe,
    setLocation,
  };
}
