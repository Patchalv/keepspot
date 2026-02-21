export const FREE_TIER = {
  maxMaps: 1,
  maxPlaces: 50,
} as const;

export const ENTITLEMENTS = {
  free: 'free',
  premium: 'premium',
} as const;

export const PLACES_SEARCH = {
  debounceMs: 300,
  locationBiasRadius: 10_000,
} as const;

export const APP_SCHEME = 'keepspot';
