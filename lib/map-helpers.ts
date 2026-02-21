import type { MapPlaceWithDetails } from '@/types';

interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    id: string;
    name: string;
    emoji: string | null;
    color: string | null;
  };
}

interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export function placesToGeoJSON(
  places: MapPlaceWithDetails[]
): GeoJSONFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: places.map((p) => {
      const firstTag = p.map_place_tags[0]?.tags;
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [p.places.longitude, p.places.latitude],
        },
        properties: {
          id: p.id,
          name: p.places.name,
          emoji: firstTag?.emoji ?? null,
          color: firstTag?.color ?? null,
        },
      };
    }),
  };
}
