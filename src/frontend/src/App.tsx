import {
  Loader2,
  MapPin,
  Wifi,
  Volume2,
  Coffee,
  Library,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useActor } from "./hooks/useActor";
import { useProfile } from "./hooks/useQueries";
import { MapView } from "./components/MapView";
import { ProfileSetupDialog } from "./components/ProfileSetupDialog";

export default function App() {
  const { identity, isInitializing, login, isLoggingIn } =
    useInternetIdentity();
  const { isFetching, actor } = useActor();

  const isAuthenticated = !!identity;

  // Loading state
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Landing page (not authenticated)
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="container mx-auto px-4 lg:px-0 py-8 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-5 h-5 text-primary" />
            <span className="text-lg font-semibold tracking-tight text-foreground font-sans">
              HushMap
            </span>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 lg:px-0 flex-1 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-16 lg:gap-24 py-12 lg:py-0">
          {/* Left Section */}
          <div className="flex-1 max-w-xl">
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-light text-foreground mb-8 leading-[1.15] tracking-tight font-sans">
              Find your
              <br />
              <span className="font-semibold text-primary">quiet corner.</span>
            </h1>

            <p className="text-base text-muted-foreground mb-12 leading-relaxed max-w-md font-sans">
              Discover cafes, libraries, and co-working spaces rated by remote
              workers for noise levels and WiFi reliability. Work productively,
              anywhere.
            </p>

            {/* Key Features */}
            <div className="flex flex-wrap gap-x-6 gap-y-4 mb-12 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <Volume2 className="w-4 h-4 text-primary" />
                </div>
                <span className="text-foreground font-sans">Noise Levels</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <Wifi className="w-4 h-4 text-primary" />
                </div>
                <span className="text-foreground font-sans">WiFi Speeds</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <span className="text-foreground font-sans">
                  Real Locations
                </span>
              </div>
            </div>

            {/* CTA Button */}
            <Button
              size="lg"
              onClick={login}
              disabled={isLoggingIn}
              className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto font-medium py-6 px-8 text-sm tracking-wide rounded-full transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Connecting...
                </>
              ) : (
                "Get Started with Internet Identity"
              )}
            </Button>
          </div>

          {/* Right Section - Preview Cards */}
          <div className="w-full lg:flex-1 lg:max-w-md">
            <div className="space-y-3">
              <LocationPreviewCard
                type="cafe"
                name="The Daily Grind"
                address="123 Oak Street"
                noise="Quiet"
                wifi="Fast"
              />
              <LocationPreviewCard
                type="library"
                name="Central Public Library"
                address="456 Main Ave"
                noise="Quiet"
                wifi="Okay"
              />
              <LocationPreviewCard
                type="coworking"
                name="The Hive Workspace"
                address="789 Tech Blvd"
                noise="Moderate"
                wifi="Fast"
              />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Loading actor
  if (!actor || isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Main app (authenticated)
  return <AuthenticatedApp />;
}

function AuthenticatedApp() {
  const { data: profile, isLoading: isLoadingProfile } = useProfile();

  const hasProfile = profile && profile.name;

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <ProfileSetupDialog open={!hasProfile} />
      {hasProfile && <MapView userName={profile.name} />}
    </>
  );
}

// Preview card component for landing page
function LocationPreviewCard({
  type,
  name,
  address,
  noise,
  wifi,
}: {
  type: "cafe" | "library" | "coworking";
  name: string;
  address: string;
  noise: "Quiet" | "Moderate" | "Buzzing";
  wifi: "Slow" | "Okay" | "Fast";
}) {
  const icons = {
    cafe: Coffee,
    library: Library,
    coworking: Briefcase,
  };
  const Icon = icons[type];

  const noiseColors = {
    Quiet: "text-primary bg-secondary",
    Moderate: "text-yellow-700 bg-yellow-100",
    Buzzing: "text-orange-700 bg-orange-100",
  };

  const wifiColors = {
    Slow: "text-orange-700 bg-orange-100",
    Okay: "text-yellow-700 bg-yellow-100",
    Fast: "text-primary bg-secondary",
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground truncate font-sans">
            {name}
          </h3>
          <p className="text-sm text-muted-foreground truncate font-sans">
            {address}
          </p>
          <div className="flex gap-2 mt-2">
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${noiseColors[noise]}`}
            >
              {noise}
            </span>
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${wifiColors[wifi]}`}
            >
              WiFi: {wifi}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
