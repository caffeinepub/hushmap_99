export const RADIUS_OPTIONS = [
  { value: 500, label: "500m" },
  { value: 1000, label: "1 km" },
  { value: 2000, label: "2 km" },
  { value: 5000, label: "5 km" },
] as const;

export type NoiseLevel = "Quiet" | "Moderate" | "Buzzing";
export type WifiSpeed = "Slow" | "Okay" | "Fast";

export const QUIETNESS_OPTIONS: { value: NoiseLevel; label: string }[] = [
  { value: "Buzzing", label: "Buzzing" },
  { value: "Moderate", label: "Moderate" },
  { value: "Quiet", label: "Quiet" },
];

export const WIFI_OPTIONS: { value: WifiSpeed; label: string }[] = [
  { value: "Slow", label: "Slow" },
  { value: "Okay", label: "Okay" },
  { value: "Fast", label: "Fast" },
];

export type NoiseFilter = "all" | "quiet" | "moderate" | "buzzing";
export type WifiFilter = "all" | "fast" | "okay" | "slow";

export const NOISE_FILTER_OPTIONS: { value: NoiseFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "quiet", label: "Quiet" },
  { value: "moderate", label: "Moderate" },
  { value: "buzzing", label: "Buzzing" },
];

export const WIFI_FILTER_OPTIONS: { value: WifiFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "fast", label: "Fast" },
  { value: "okay", label: "Okay" },
  { value: "slow", label: "Slow" },
];
