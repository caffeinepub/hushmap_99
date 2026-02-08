import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Location {
    lat: number;
    lng: number;
    osmNodeId: string;
    name: string;
    ratings: Array<Rating>;
    address?: string;
    locationType: LocationType;
}
export type Time = bigint;
export interface Rating {
    wifiSpeed: WifiSpeed;
    userId: Principal;
    createdAt: Time;
    description?: string;
    updatedAt: Time;
    noiseLevel: NoiseLevel;
    editCount: bigint;
}
export interface LocationInput {
    lat: number;
    lng: number;
    osmNodeId: string;
    name: string;
    address?: string;
    locationType: LocationType;
}
export interface Profile {
    name: string;
}
export enum LocationType {
    CoworkingSpace = "CoworkingSpace",
    Library = "Library",
    Cafe = "Cafe"
}
export enum NoiseLevel {
    Buzzing = "Buzzing",
    Moderate = "Moderate",
    Quiet = "Quiet"
}
export enum WifiSpeed {
    Fast = "Fast",
    Okay = "Okay",
    Slow = "Slow"
}
export interface backendInterface {
    checkIn(locationInput: LocationInput, noiseLevel: NoiseLevel, wifiSpeed: WifiSpeed, description: string | null): Promise<void>;
    deleteMyRating(osmNodeId: string): Promise<void>;
    getAllLocations(): Promise<Array<Location>>;
    getLocation(osmNodeId: string): Promise<Location | null>;
    getLocationsByNoise(noiseLevel: NoiseLevel): Promise<Array<Location>>;
    getLocationsByType(locationType: LocationType): Promise<Array<Location>>;
    getMyRating(osmNodeId: string): Promise<Rating | null>;
    getProfile(): Promise<Profile | null>;
    setProfile(name: string): Promise<void>;
    updateRating(osmNodeId: string, noiseLevel: NoiseLevel, wifiSpeed: WifiSpeed, description: string | null): Promise<void>;
}
