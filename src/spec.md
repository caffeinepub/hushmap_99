# HushMap

## Overview

A crowdsourced workspace discovery application for the Internet Computer. Users can find nearby cafes, libraries, and coworking spaces, then view and contribute noise level and WiFi speed ratings to help others find the perfect spot to work. All data is stored on-chain with full user ownership through Internet Identity authentication.

## Authentication

- Internet Identity required for all rating operations
- Anonymous access permitted for viewing map and ratings
- User data is isolated by principal - users can only edit their own ratings
- Display name can be set for personalization

## Core Features

### Profile Management

- User profile setup with customizable display name on first login
- Edit name functionality accessible from header dropdown
- Profile names limited to 100 characters

### Location Discovery

- Interactive map centered on user's location
- Automatic geolocation detection on app load (non-blocking)
- Manual location selection via map click when geolocation is denied
- Relocate button to change search center by clicking on map
- My Location button to re-center on current GPS position
- Configurable search radius: 500m, 1km, 2km, 5km
- Default location: DFINITY Stiftung, Zürich when geolocation unavailable

### Workspace Mapping

- Displays cafes, libraries, and coworking spaces from OpenStreetMap
- Custom markers with emoji icons by venue type (coffee, book, briefcase)
- Mini star ratings displayed below markers for rated locations
- Blue marker border for rated locations, green for unrated
- Popup cards with venue details, progress bar ratings, and check-in button
- Venue details include name, type, address, and opening hours when available

### Rating System

- Rate locations on quietness: Quiet, Moderate, Buzzing
- Rate locations on WiFi speed: Slow, Okay, Fast
- Optional text notes for tips (max 500 characters)
- One rating per user per location
- One edit allowed per rating
- Aggregated averages displayed as progress bars with color coding
- Last 5 ratings kept per location (sliding window)

### Search & Filtering

- Client-side search filtering places by name
- Filter by quietness: All, Quiet, Moderate, Buzzing
- Filter by WiFi speed: All, Fast, Okay, Slow
- Filters only show locations with ratings matching criteria
- Floating search bar with search input, filter button, and radius selector
- Filter modal for quietness and WiFi selection
- Active filter count displayed as badge on filter button
- Clear filters button when filters are active

### Reviews

- View all reviews for a location in a dialog
- Reviews sorted by date (newest first)
- Shows individual quietness/WiFi ratings and optional notes

## Map Integration

### Leaflet Setup

- Leaflet library loaded via CDN (version 1.9.4)
- Accessed globally via window.L
- TypeScript type declarations provided in src/types/leaflet.d.ts
- Zoom controls positioned at bottom left

### OpenStreetMap Data

- Place data fetched from Overpass API
- Queries for amenity types: cafe, library, coworking_space
- Searches within specified radius around user location
- Returns place ID, coordinates, name, address, and opening hours

### OSM Data Caching

- OSM responses cached in localStorage
- 8-hour cache TTL to reduce API calls
- Coordinates rounded to ~100m precision for cache key stability

### Marker Rendering

- Custom HTML markers using L.divIcon
- Markers display emoji icon based on venue type
- Star rating shown below marker for rated locations
- Popups generated as HTML strings with event handlers
- Custom events (checkin, viewreviews) dispatch to React components

## Backend Data Storage

- **Profiles**: User display names keyed by principal
- **Locations**: Workspace locations keyed by OSM node ID
- **Ratings**: User ratings stored within location records
- Maintains state across canister upgrades

## Backend Operations

### Profile Functions

- `getProfile()`: Retrieves current user's profile
- `setProfile(name)`: Creates or updates user profile name

### Location Functions

- `checkIn(location, noiseLevel, wifiSpeed, description)`: Creates location if needed and adds user's rating
- `updateRating(osmNodeId, noiseLevel, wifiSpeed, description)`: Updates existing rating (one edit allowed)
- `getLocation(osmNodeId)`: Gets single location by OSM node ID
- `getMyRating(osmNodeId)`: Gets user's rating for a location
- `getAllLocations()`: Gets all locations with ratings
- `getLocationsByNoise(noiseLevel)`: Filters locations by noise level
- `getLocationsByType(locationType)`: Filters locations by type
- `deleteMyRating(osmNodeId)`: Deletes user's own rating

### Data Types

- **LocationType**: Cafe, Library, CoworkingSpace
- **NoiseLevel**: Quiet, Moderate, Buzzing
- **WifiSpeed**: Slow, Okay, Fast
- **Location**: osmNodeId, name, locationType, lat, lng, address, ratings
- **Rating**: noiseLevel, wifiSpeed, description, userId, createdAt, updatedAt, editCount

### Validation Limits

- Location name: max 200 characters
- Address: max 500 characters
- Description: max 500 characters
- Ratings per location: max 5 (sliding window)

## User Interface

### Component Structure

- **App**: Authentication flow, landing page, profile check
- **MapView**: Main map interface with state orchestration
- **MapHeader**: Logo and profile avatar dropdown
- **MapSearchBar**: Floating search, filter, and radius controls
- **MapControls**: Bottom-right location buttons
- **MapOverlays**: Status overlays for loading, errors, and hints
- **CheckInDialog**: Rating submission form with selection buttons
- **ReviewsDialog**: All reviews for a location
- **FilterDialog**: Quietness and WiFi filter modal
- **ProfileSetupDialog**: First-time name prompt
- **EditNameDialog**: Edit profile name
- **LocationPreviewCard**: Popup HTML generation and scoring utilities

### State Management

- TanStack Query for server state (locations, ratings, profile, OSM data)
- React useState for UI state (dialogs, filters, search, relocate mode)
- Refs for Leaflet instances to avoid unnecessary re-renders
- Automatic cache invalidation on mutations

## Scoring System

Both quietness and WiFi use a 1-3 scale where higher is better:

| Quietness | Score | Meaning               |
| --------- | ----- | --------------------- |
| Quiet     | 3     | Best for focus work   |
| Moderate  | 2     | Some background noise |
| Buzzing   | 1     | Loud/busy environment |

| WiFi Speed | Score | Meaning                 |
| ---------- | ----- | ----------------------- |
| Fast       | 3     | Great for video calls   |
| Okay       | 2     | Browsing and light work |
| Slow       | 1     | Basic connectivity only |

### Color Coding

- Green (score >= 2.5): Good
- Yellow (score 1.5-2.4): Okay
- Orange (score < 1.5): Poor

### Star Ratings

- Average score rounded and displayed as filled/empty stars (1-3)
- Shown below marker icons on map

## Design System

- Clean, minimal interface with light and dark mode support
- Floating controls positioned above map
- z-index layering: map < overlays (1000) < dropdown menus (1001)
- Responsive filter dialog for mobile screens
- Loading spinners during geolocation and data fetching
- Progress bars for rating visualization

## Error Handling

- Authentication required errors for anonymous rating operations
- Geolocation fallback to default location when denied
- Hint overlay prompting manual location selection
- OSM API error overlay with retry button
- Cached OSM data used when available
- Edit limit enforcement (one edit per rating)
- Input validation with descriptive error messages via Debug.trap
