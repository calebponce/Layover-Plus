// Each interest declares the OSM tag selectors that produce sensible POIs.
// Selectors are `{ key, value }` pairs that map directly to Overpass queries.
// `categoryLabel` lets us show human-readable labels in the UI for any tag we surface.
const INTEREST_CONFIG = {
  food: {
    label: "Food",
    selectors: [
      { key: "amenity", value: "restaurant" },
      { key: "amenity", value: "cafe" },
      { key: "amenity", value: "fast_food" },
      { key: "amenity", value: "food_court" },
      { key: "amenity", value: "bar" },
      { key: "amenity", value: "biergarten" },
      { key: "amenity", value: "pub" },
    ],
  },
  culture: {
    label: "Culture",
    selectors: [
      { key: "tourism", value: "museum" },
      { key: "tourism", value: "gallery" },
      { key: "amenity", value: "arts_centre" },
      { key: "amenity", value: "theatre" },
      { key: "amenity", value: "cinema" },
      { key: "historic", value: "monument" },
      { key: "historic", value: "memorial" },
      { key: "historic", value: "castle" },
      { key: "historic", value: "ruins" },
    ],
  },
  sightseeing: {
    label: "Sightseeing",
    selectors: [
      { key: "tourism", value: "attraction" },
      { key: "tourism", value: "viewpoint" },
      { key: "tourism", value: "artwork" },
      { key: "tourism", value: "theme_park" },
      { key: "tourism", value: "zoo" },
      { key: "tourism", value: "aquarium" },
      { key: "historic", value: "monument" },
      { key: "historic", value: "memorial" },
    ],
  },
  outdoors: {
    label: "Outdoors",
    selectors: [
      { key: "natural", value: "beach" },
      { key: "leisure", value: "park" },
      { key: "leisure", value: "nature_reserve" },
      { key: "leisure", value: "garden" },
      { key: "tourism", value: "viewpoint" },
      { key: "tourism", value: "picnic_site" },
      { key: "boundary", value: "national_park", element: "relation" },
      { key: "boundary", value: "protected_area", element: "relation" },
      { key: "route", value: "hiking", element: "relation" },
    ],
  },
  shopping: {
    label: "Shopping",
    selectors: [
      { key: "shop", value: "mall" },
      { key: "shop", value: "department_store" },
      { key: "shop", value: "supermarket" },
      { key: "shop", value: "marketplace" },
      { key: "shop", value: "gift" },
      { key: "shop", value: "books" },
      { key: "amenity", value: "marketplace" },
    ],
  },
};

// OSM categories we never want to surface even if a broader selector would catch them.
const POI_DENYLIST_CATEGORIES = new Set([
  "playground",
  "fitness_station",
  "fast_food", // surfaces only when food is selected; otherwise treat as low-signal
  "parking",
  "fuel",
  "atm",
  "bank",
  "bench",
  "toilets",
]);

// Human-readable labels for OSM category strings we expose to the UI.
const CATEGORY_LABEL_OVERRIDES = {
  beach: "Beach",
  peak: "Peak",
  cliff: "Cliff",
  viewpoint: "Viewpoint",
  nature_reserve: "Nature reserve",
  garden: "Garden",
  dog_park: "Dog park",
  park: "Park",
  picnic_site: "Picnic site",
  museum: "Museum",
  gallery: "Gallery",
  arts_centre: "Arts centre",
  theatre: "Theatre",
  cinema: "Cinema",
  monument: "Monument",
  memorial: "Memorial",
  castle: "Castle",
  ruins: "Historic ruins",
  attraction: "Attraction",
  artwork: "Artwork",
  theme_park: "Theme park",
  zoo: "Zoo",
  aquarium: "Aquarium",
  hiking: "Hiking route",
  restaurant: "Restaurant",
  cafe: "Café",
  fast_food: "Fast food",
  food_court: "Food court",
  bar: "Bar",
  biergarten: "Beer garden",
  pub: "Pub",
  mall: "Shopping mall",
  department_store: "Department store",
  supermarket: "Supermarket",
  marketplace: "Marketplace",
  gift: "Gift shop",
  books: "Bookstore",
};

const AIRPORTS = [
  {
    code: "LAX",
    name: "Los Angeles International Airport",
    city: "Los Angeles",
    lat: 33.9416,
    lon: -118.4085,
    searchRadiusMeters: 14000,
    defaultTransportMode: "driving",
    processingMinutes: {
      domestic: 35,
      international: 60,
    },
    returnBufferMinutes: {
      domestic: 90,
      international: 150,
    },
    recommendedTripMinutes: {
      domestic: 75,
      international: 60,
    },
    maxTravelMinutesOneWay: {
      domestic: 30,
      international: 20,
    },
    fallbackPois: [
      {
        id: "curated-lax-proud-bird",
        name: "The Proud Bird",
        lat: 33.9459,
        lon: -118.3824,
        category: "restaurant",
        notability: 5,
        address: "Aviation Boulevard, Los Angeles",
      },
      {
        id: "curated-lax-manhattan-village",
        name: "Manhattan Village",
        lat: 33.9004,
        lon: -118.3942,
        category: "mall",
        notability: 5,
        address: "Sepulveda Boulevard, Manhattan Beach",
      },
      {
        id: "curated-lax-truxtons",
        name: "Truxton's American Bistro",
        lat: 33.9594,
        lon: -118.4183,
        category: "restaurant",
        notability: 4,
        address: "Truxton Avenue, Los Angeles",
      },
      {
        id: "curated-lax-manhattan-beach-pier",
        name: "Manhattan Beach Pier",
        lat: 33.8847,
        lon: -118.4109,
        category: "attraction",
        notability: 7,
        address: "Manhattan Beach Boulevard, Manhattan Beach",
      },
      {
        id: "curated-lax-automobile-museum",
        name: "Zimmerman Automobile Driving Museum",
        lat: 33.9166,
        lon: -118.4163,
        category: "museum",
        notability: 6,
        address: "Lairport Street, El Segundo",
      },
    ],
  },
  {
    code: "SFO",
    name: "San Francisco International Airport",
    city: "San Francisco",
    lat: 37.6213,
    lon: -122.379,
    searchRadiusMeters: 16000,
    defaultTransportMode: "driving",
    processingMinutes: {
      domestic: 30,
      international: 55,
    },
    returnBufferMinutes: {
      domestic: 85,
      international: 140,
    },
    recommendedTripMinutes: {
      domestic: 80,
      international: 60,
    },
    maxTravelMinutesOneWay: {
      domestic: 28,
      international: 18,
    },
    fallbackPois: [
      {
        id: "curated-sfo-millbrae-pancake-house",
        name: "Millbrae Pancake House",
        lat: 37.6001,
        lon: -122.3864,
        category: "restaurant",
        notability: 5,
        address: "El Camino Real, Millbrae",
      },
      {
        id: "curated-sfo-burlingame-avenue",
        name: "Burlingame Avenue",
        lat: 37.5778,
        lon: -122.3482,
        category: "marketplace",
        notability: 6,
        address: "Burlingame Avenue, Burlingame",
      },
      {
        id: "curated-sfo-lobster-market",
        name: "New England Lobster Market & Eatery",
        lat: 37.601,
        lon: -122.3762,
        category: "restaurant",
        notability: 5,
        address: "Cowan Road, Burlingame",
      },
      {
        id: "curated-sfo-bayfront-park",
        name: "Bayfront Park",
        lat: 37.5992,
        lon: -122.3711,
        category: "park",
        notability: 4,
        address: "Old Bayshore Highway, Millbrae",
      },
      {
        id: "curated-sfo-coyote-point",
        name: "Coyote Point Recreation Area",
        lat: 37.5906,
        lon: -122.3231,
        category: "park",
        notability: 6,
        address: "Coyote Point Drive, San Mateo",
      },
    ],
  },
  {
    code: "JFK",
    name: "John F. Kennedy International Airport",
    city: "New York City",
    lat: 40.6413,
    lon: -73.7781,
    searchRadiusMeters: 14000,
    defaultTransportMode: "driving",
    processingMinutes: {
      domestic: 40,
      international: 65,
    },
    returnBufferMinutes: {
      domestic: 95,
      international: 155,
    },
    recommendedTripMinutes: {
      domestic: 75,
      international: 55,
    },
    maxTravelMinutesOneWay: {
      domestic: 30,
      international: 18,
    },
    fallbackPois: [
      {
        id: "curated-jfk-new-park-pizza",
        name: "New Park Pizza",
        lat: 40.6617,
        lon: -73.8244,
        category: "restaurant",
        notability: 5,
        address: "Cross Bay Boulevard, Howard Beach",
      },
      {
        id: "curated-jfk-green-acres-mall",
        name: "Green Acres Mall",
        lat: 40.6622,
        lon: -73.7195,
        category: "mall",
        notability: 5,
        address: "Sunrise Highway, Valley Stream",
      },
      {
        id: "curated-jfk-lennys-clam-bar",
        name: "Lenny's Clam Bar",
        lat: 40.6597,
        lon: -73.8386,
        category: "restaurant",
        notability: 4,
        address: "Cross Bay Boulevard, Howard Beach",
      },
      {
        id: "curated-jfk-rockaway-beach",
        name: "Rockaway Beach Boardwalk",
        lat: 40.5832,
        lon: -73.8166,
        category: "attraction",
        notability: 7,
        address: "Shore Front Parkway, Queens",
      },
      {
        id: "curated-jfk-jamaica-bay",
        name: "Jamaica Bay Wildlife Refuge",
        lat: 40.6167,
        lon: -73.8243,
        category: "nature_reserve",
        notability: 7,
        address: "Cross Bay Boulevard, Queens",
      },
    ],
  },
];

function getAirportConfig(code) {
  return AIRPORTS.find((airport) => airport.code === code);
}

function getCategoryLabel(category) {
  if (!category) return "Point of interest";
  const key = String(category).trim().toLowerCase();
  if (CATEGORY_LABEL_OVERRIDES[key]) return CATEGORY_LABEL_OVERRIDES[key];
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

module.exports = {
  AIRPORTS,
  INTEREST_CONFIG,
  POI_DENYLIST_CATEGORIES,
  CATEGORY_LABEL_OVERRIDES,
  getAirportConfig,
  getCategoryLabel,
};
