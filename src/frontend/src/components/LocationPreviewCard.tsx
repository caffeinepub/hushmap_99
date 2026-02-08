// Rating score mappings (1-3 scale) - higher is always better
const NOISE_SCORES: Record<string, number> = {
  Quiet: 3,
  Moderate: 2,
  Buzzing: 1,
};
const WIFI_SCORES: Record<string, number> = { Slow: 1, Okay: 2, Fast: 3 };

function getNoiseLabel(score: number): string {
  if (score >= 2.5) return "Quiet";
  if (score >= 1.5) return "Moderate";
  return "Buzzing";
}

function getWifiLabel(score: number): string {
  if (score >= 2.5) return "Fast";
  if (score >= 1.5) return "Okay";
  return "Slow";
}

function getScoreColor(score: number): string {
  if (score >= 2.5) return "#2e7d32"; // Green - good
  if (score >= 1.5) return "#f9a825"; // Yellow - okay
  return "#e65100"; // Orange - poor
}

function getStars(score: number): string {
  const rounded = Math.round(score);
  return "★".repeat(rounded) + "☆".repeat(3 - rounded);
}

export interface LocationRating {
  noiseLevel: string;
  wifiSpeed: string;
  description?: string | null;
}

export interface LocationPreviewData {
  osmNodeId: string;
  name: string;
  amenity: string;
  lat: number;
  lng: number;
  address?: string;
  openingHours?: string;
  ratings: LocationRating[];
}

export function calculateAverages(ratings: LocationRating[]): {
  avgNoise: number;
  avgWifi: number;
  avgOverall: number;
  noiseLabel: string;
  wifiLabel: string;
} | null {
  if (ratings.length === 0) return null;

  const totalNoise = ratings.reduce(
    (sum, r) => sum + (NOISE_SCORES[r.noiseLevel] || 2),
    0,
  );
  const totalWifi = ratings.reduce(
    (sum, r) => sum + (WIFI_SCORES[r.wifiSpeed] || 2),
    0,
  );

  const avgNoise = Math.round((totalNoise / ratings.length) * 10) / 10;
  const avgWifi = Math.round((totalWifi / ratings.length) * 10) / 10;
  const avgOverall = Math.round(((avgNoise + avgWifi) / 2) * 10) / 10;

  return {
    avgNoise,
    avgWifi,
    avgOverall,
    noiseLabel: getNoiseLabel(avgNoise),
    wifiLabel: getWifiLabel(avgWifi),
  };
}

export function getMarkerStars(
  ratings: LocationRating[],
): { stars: string; color: string } | null {
  const averages = calculateAverages(ratings);
  if (!averages) return null;
  return {
    stars: getStars(averages.avgOverall),
    color: getScoreColor(averages.avgOverall),
  };
}

// Generate HTML string for Leaflet popup
export function generatePopupHtml(data: LocationPreviewData): string {
  const { osmNodeId, name, amenity, lat, lng, address, openingHours, ratings } =
    data;
  const hasRatings = ratings.length > 0;
  const averages = hasRatings ? calculateAverages(ratings) : null;
  const latestRating = hasRatings ? ratings[ratings.length - 1] : null;

  const escapedName = name.replace(/'/g, "\\'").replace(/"/g, "&quot;");
  const escapedAddress = address
    ? address.replace(/'/g, "\\'").replace(/"/g, "&quot;")
    : "";

  let ratingsHtml = "";
  if (hasRatings && averages) {
    const noiseColor = getScoreColor(averages.avgNoise);
    const wifiColor = getScoreColor(averages.avgWifi);
    // Convert 1-3 score to percentage (higher is better for both)
    const quietnessPercent = Math.round((averages.avgNoise / 3) * 100);
    const wifiPercent = Math.round((averages.avgWifi / 3) * 100);

    ratingsHtml = `
      <div style="margin: 8px 0; padding: 10px; background: #f8f9fa; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <span style="font-size: 11px; color: #666;">${ratings.length} review${ratings.length > 1 ? "s" : ""}</span>
          <button
            onclick="window.dispatchEvent(new CustomEvent('viewreviews', { detail: { osmNodeId: '${osmNodeId}', name: '${escapedName}' } }))"
            style="font-size: 10px; color: #1565c0; background: none; border: none; cursor: pointer; text-decoration: underline;"
          >
            View all
          </button>
        </div>

        <!-- Quietness -->
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 12px; color: #444; display: flex; align-items: center; gap: 6px;">
              <span style="color: ${noiseColor};">🔇</span> Quietness
            </span>
            <span style="font-size: 12px; font-weight: 600; color: ${noiseColor};">${averages.noiseLabel}</span>
          </div>
          <div style="height: 6px; background: #e0e0e0; border-radius: 3px; overflow: hidden;">
            <div style="height: 100%; width: ${quietnessPercent}%; background: ${noiseColor}; border-radius: 3px; transition: width 0.3s;"></div>
          </div>
        </div>

        <!-- WiFi -->
        <div style="margin-bottom: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 12px; color: #444; display: flex; align-items: center; gap: 6px;">
              <span style="color: ${wifiColor};">📶</span> WiFi
            </span>
            <span style="font-size: 12px; font-weight: 600; color: ${wifiColor};">${averages.wifiLabel}</span>
          </div>
          <div style="height: 6px; background: #e0e0e0; border-radius: 3px; overflow: hidden;">
            <div style="height: 100%; width: ${wifiPercent}%; background: ${wifiColor}; border-radius: 3px; transition: width 0.3s;"></div>
          </div>
        </div>

        ${latestRating?.description ? `<div style="font-size: 11px; color: #666; margin-top: 10px; font-style: italic; border-top: 1px solid #e0e0e0; padding-top: 8px;">"${latestRating.description}"</div>` : ""}
      </div>
    `;
  }

  return `
    <div style="min-width: 180px; font-family: Montserrat, sans-serif;">
      <strong>${name}</strong><br/>
      <span style="color: #666; font-size: 12px; text-transform: capitalize;">${amenity.replace("_", " ")}</span><br/>
      ${address ? `<span style="color: #888; font-size: 11px;">${address}</span><br/>` : ""}
      ${openingHours ? `<span style="color: #888; font-size: 11px;">🕐 ${openingHours}</span><br/>` : ""}
      ${ratingsHtml}
      <button
        onclick="window.dispatchEvent(new CustomEvent('checkin', { detail: { osmNodeId: '${osmNodeId}', lat: ${lat}, lng: ${lng}, name: '${escapedName}', type: '${amenity}', address: '${escapedAddress}' } }))"
        style="margin-top: 8px; padding: 4px 12px; background: #2e7d32; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; width: 100%;"
      >
        ${hasRatings ? "Add Rating" : "Check In"}
      </button>
    </div>
  `;
}

// Generate marker icon HTML
export function generateMarkerIconHtml(
  amenity: string,
  hasRatings: boolean,
  ratings: LocationRating[],
): { html: string; borderColor: string } {
  const borderColor = hasRatings ? "#1565c0" : "#2e7d32";
  const markerStars = hasRatings ? getMarkerStars(ratings) : null;

  const emoji = amenity === "cafe" ? "☕" : amenity === "library" ? "📚" : "💼";

  const html = `
    <div style="width: 32px; height: 32px; background: white; border: 2px solid ${borderColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2); position: relative; font-family: Montserrat, sans-serif;">
      <span style="font-size: 14px;">${emoji}</span>
      ${markerStars ? `<span style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); font-size: 8px; color: ${markerStars.color}; background: white; padding: 0 2px; border-radius: 2px; white-space: nowrap; box-shadow: 0 1px 2px rgba(0,0,0,0.2);">${markerStars.stars}</span>` : ""}
    </div>
  `;

  return { html, borderColor };
}
