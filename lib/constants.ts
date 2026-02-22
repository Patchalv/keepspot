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

export const ALL_MAPS_ID = '__all__' as const;

export const ERROR_CODES = {
  freemiumLimitExceeded: 'FREEMIUM_LIMIT_EXCEEDED',
} as const;

export const TAG_COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#F59E0B', // amber
  '#84CC16', // lime
  '#22C55E', // green
  '#14B8A6', // teal
  '#06B6D4', // cyan
  '#3B82F6', // blue
  '#6366F1', // indigo
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#6B7280', // gray
] as const;
