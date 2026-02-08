import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";

actor {
  type NoiseLevel = {
    #Quiet;
    #Moderate;
    #Buzzing;
  };

  type WifiSpeed = {
    #Slow;
    #Okay;
    #Fast;
  };

  type LocationType = {
    #Cafe;
    #Library;
    #CoworkingSpace;
  };

  type Profile = {
    name : Text;
  };

  type Rating = {
    noiseLevel : NoiseLevel;
    wifiSpeed : WifiSpeed;
    description : ?Text;
    userId : Principal;
    createdAt : Time.Time;
    updatedAt : Time.Time;
    editCount : Nat; // 0 = never edited, 1 = edited once (max allowed)
  };

  // A workspace location (keyed by OSM node ID)
  type Location = {
    osmNodeId : Text;
    name : Text;
    locationType : LocationType;
    lat : Float;
    lng : Float;
    address : ?Text;
    ratings : [Rating];
  };

  type LocationInput = {
    osmNodeId : Text;
    name : Text;
    locationType : LocationType;
    lat : Float;
    lng : Float;
    address : ?Text;
  };

  var locations : Map.Map<Text, Location> = Map.empty();
  var userProfiles : Map.Map<Principal, Profile> = Map.empty();

  let MAX_RATINGS : Nat = 5;
  let MAX_NAME_LENGTH : Nat = 200;
  let MAX_ADDRESS_LENGTH : Nat = 500;
  let MAX_DESCRIPTION_LENGTH : Nat = 500;

  func requireAuth(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Not authenticated");
    };
  };

  func validateFieldLength(value : Text, fieldName : Text, maxLen : Nat) {
    if (value.size() > maxLen) {
      Runtime.trap(fieldName # " too long (max " # maxLen.toText() # " characters)");
    };
    if (value.size() == 0) {
      Runtime.trap(fieldName # " cannot be empty");
    };
  };

  func getUserRating(ratings : [Rating], userId : Principal) : ?Rating {
    for (r in ratings.vals()) {
      if (r.userId == userId) { return ?r };
    };
    null;
  };

  func appendRating(existingRatings : [Rating], newRating : Rating) : [Rating] {
    let updated = Array.tabulate(
      existingRatings.size() + 1,
      func(i) {
        if (i < existingRatings.size()) { existingRatings[i] } else {
          newRating;
        };
      },
    );
    if (updated.size() > MAX_RATINGS) {
      Array.tabulate(
        MAX_RATINGS,
        func(i) { updated[updated.size() - MAX_RATINGS + i] },
      );
    } else {
      updated;
    };
  };

  func replaceRating(existingRatings : [Rating], updatedRating : Rating) : [Rating] {
    Array.tabulate(
      existingRatings.size(),
      func(i) {
        if (existingRatings[i].userId == updatedRating.userId) {
          updatedRating;
        } else {
          existingRatings[i];
        };
      },
    );
  };

  public shared ({ caller }) func checkIn(
    locationInput : LocationInput,
    noiseLevel : NoiseLevel,
    wifiSpeed : WifiSpeed,
    description : ?Text,
  ) : async () {
    requireAuth(caller);
    validateFieldLength(locationInput.name, "Name", MAX_NAME_LENGTH);
    validateFieldLength(locationInput.osmNodeId, "OSM Node ID", 50);

    switch (locationInput.address) {
      case (?addr) {
        if (addr.size() > MAX_ADDRESS_LENGTH) {
          Runtime.trap("Address too long (max " # MAX_ADDRESS_LENGTH.toText() # " characters)");
        };
      };
      case (null) {};
    };

    switch (description) {
      case (?desc) {
        if (desc.size() > MAX_DESCRIPTION_LENGTH) {
          Runtime.trap("Description too long (max " # MAX_DESCRIPTION_LENGTH.toText() # " characters)");
        };
      };
      case (null) {};
    };

    switch (locations.get(locationInput.osmNodeId)) {
      case (?existing) {
        switch (getUserRating(existing.ratings, caller)) {
          case (?_) {
            Runtime.trap("You already have a rating at this location. Use updateRating to edit it.");
          };
          case (null) {};
        };
      };
      case (null) {};
    };

    let now = Time.now();
    let newRating : Rating = {
      noiseLevel;
      wifiSpeed;
      description;
      userId = caller;
      createdAt = now;
      updatedAt = now;
      editCount = 0;
    };

    switch (locations.get(locationInput.osmNodeId)) {
      case (?existing) {
        let updatedRatings = appendRating(existing.ratings, newRating);
        locations.add(
          locationInput.osmNodeId,
          { existing with ratings = updatedRatings },
        );
      };
      case (null) {
        locations.add(
          locationInput.osmNodeId,
          {
            osmNodeId = locationInput.osmNodeId;
            name = locationInput.name;
            locationType = locationInput.locationType;
            lat = locationInput.lat;
            lng = locationInput.lng;
            address = locationInput.address;
            ratings = [newRating];
          },
        );
      };
    };
  };

  public shared ({ caller }) func updateRating(
    osmNodeId : Text,
    noiseLevel : NoiseLevel,
    wifiSpeed : WifiSpeed,
    description : ?Text,
  ) : async () {
    requireAuth(caller);

    switch (description) {
      case (?desc) {
        if (desc.size() > MAX_DESCRIPTION_LENGTH) {
          Runtime.trap("Description too long (max " # MAX_DESCRIPTION_LENGTH.toText() # " characters)");
        };
      };
      case (null) {};
    };

    switch (locations.get(osmNodeId)) {
      case (null) {
        Runtime.trap("Location not found");
      };
      case (?location) {
        switch (getUserRating(location.ratings, caller)) {
          case (null) {
            Runtime.trap("You don't have a rating at this location. Use checkIn to create one.");
          };
          case (?existingRating) {
            if (existingRating.editCount >= 1) {
              Runtime.trap("You can only edit your rating once");
            };

            let updatedRating : Rating = {
              noiseLevel;
              wifiSpeed;
              description;
              userId = caller;
              createdAt = existingRating.createdAt;
              updatedAt = Time.now();
              editCount = existingRating.editCount + 1;
            };

            let updatedRatings = replaceRating(location.ratings, updatedRating);
            locations.add(osmNodeId, { location with ratings = updatedRatings });
          };
        };
      };
    };
  };

  public query func getLocation(osmNodeId : Text) : async ?Location {
    locations.get(osmNodeId);
  };

  public query ({ caller }) func getMyRating(osmNodeId : Text) : async ?Rating {
    switch (locations.get(osmNodeId)) {
      case (null) { null };
      case (?location) { getUserRating(location.ratings, caller) };
    };
  };

  public query func getAllLocations() : async [Location] {
    locations.values().toArray();
  };

  public query func getLocationsByNoise(noiseLevel : NoiseLevel) : async [Location] {
    locations.values().toArray().filter(
      func(loc) {
        if (loc.ratings.size() == 0) { return false };
        let latest = loc.ratings[loc.ratings.size() - 1];
        latest.noiseLevel == noiseLevel;
      }
    );
  };

  public query func getLocationsByType(locationType : LocationType) : async [Location] {
    locations.values().toArray().filter(
      func(loc) { loc.locationType == locationType }
    );
  };

  // Delete a user's own rating from a location
  public shared ({ caller }) func deleteMyRating(osmNodeId : Text) : async () {
    requireAuth(caller);

    switch (locations.get(osmNodeId)) {
      case (null) {
        Runtime.trap("Location not found");
      };
      case (?location) {
        let filtered = location.ratings.filter(func(r) { r.userId != caller });
        if (filtered.size() == location.ratings.size()) {
          Runtime.trap("No rating found for this user");
        };

        if (filtered.size() == 0) {
          // No ratings left - remove the location entirely
          locations.remove(osmNodeId);
        } else {
          locations.add(osmNodeId, { location with ratings = filtered });
        };
      };
    };
  };

  public query ({ caller }) func getProfile() : async ?Profile {
    userProfiles.get(caller);
  };

  public shared ({ caller }) func setProfile(name : Text) : async () {
    requireAuth(caller);
    if (name.size() == 0 or name.size() > 100) {
      Runtime.trap("Name must be between 1 and 100 characters");
    };
    userProfiles.add(caller, { name });
  };
};
