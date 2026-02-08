import { useEffect, useRef, useCallback } from "react";

interface UseMapOptions {
  initialLocation: [number, number];
  initialRadius: number;
  onMapClick?: (location: [number, number]) => void;
}

interface UseMapReturn {
  mapRef: React.RefObject<HTMLDivElement | null>;
  markersRef: React.MutableRefObject<any | null>;
  updateUserLocation: (location: [number, number]) => void;
  updateRadius: (radius: number) => void;
  setRelocateMode: (enabled: boolean) => void;
  centerOnLocation: (location: [number, number]) => void;
}

export function useMap({
  initialLocation,
  initialRadius,
  onMapClick,
}: UseMapOptions): UseMapReturn {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any | null>(null);
  const markersRef = useRef<any | null>(null);
  const circleRef = useRef<any | null>(null);
  const userMarkerRef = useRef<any | null>(null);
  const relocateModeRef = useRef(false);
  const onMapClickRef = useRef(onMapClick);

  // Keep callback ref updated
  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  const L = window.L;

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    // Prevent double initialization (React StrictMode)
    if (mapInstanceRef.current) return;

    // Check if container already has a map (Leaflet adds _leaflet_id)
    if ((mapRef.current as any)._leaflet_id) return;

    const map = L.map(mapRef.current, {
      zoomControl: false, // Disable default position
    }).setView(initialLocation, 15);

    // Add zoom control at bottom left
    L.control.zoom({ position: "bottomleft" }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Add user location marker
    const userIcon = L.divIcon({
      className: "user-location-marker",
      html: `<div style="width: 16px; height: 16px; background: #2e7d32; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    const userMarker = L.marker(initialLocation, { icon: userIcon })
      .addTo(map)
      .bindPopup("You are here");
    userMarkerRef.current = userMarker;

    // Add radius circle
    const circle = L.circle(initialLocation, {
      radius: initialRadius,
      color: "#2e7d32",
      fillColor: "#2e7d32",
      fillOpacity: 0.1,
      weight: 2,
    }).addTo(map);
    circleRef.current = circle;

    // Create layer group for location markers
    markersRef.current = L.layerGroup().addTo(map);

    // Handle map clicks for relocate modes
    const handleClick = (e: any) => {
      if (relocateModeRef.current && onMapClickRef.current) {
        const newLocation: [number, number] = [e.latlng.lat, e.latlng.lng];
        onMapClickRef.current(newLocation);
      }
    };
    map.on("click", handleClick);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {
          // Map may have already been removed
        }
        mapInstanceRef.current = null;
      }
    };
  }, [L]); // Only initialize once

  // Update user location on map
  const updateUserLocation = useCallback((location: [number, number]) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(
        location,
        mapInstanceRef.current.getZoom() || 15,
      );
    }
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(location);
    }
    if (circleRef.current) {
      circleRef.current.setLatLng(location);
    }
  }, []);

  // Update radius
  const updateRadius = useCallback((radius: number) => {
    if (!circleRef.current || !mapInstanceRef.current) return;

    circleRef.current.setRadius(radius);

    // Adjust map zoom to fit the circle
    const bounds = circleRef.current.getBounds();
    mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] });
  }, []);

  // Set relocate mode
  const setRelocateMode = useCallback((enabled: boolean) => {
    relocateModeRef.current = enabled;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.getContainer().style.cursor = enabled
        ? "crosshair"
        : "";
    }
  }, []);

  // Center on location without updating user marker
  const centerOnLocation = useCallback((location: [number, number]) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(
        location,
        mapInstanceRef.current.getZoom() || 15,
      );
    }
  }, []);

  return {
    mapRef,
    markersRef,
    updateUserLocation,
    updateRadius,
    setRelocateMode,
    centerOnLocation,
  };
}
