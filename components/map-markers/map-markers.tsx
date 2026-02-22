import { View, Text, Pressable } from 'react-native';
import Mapbox from '@/lib/mapbox';
import type { MapPlaceWithDetails } from '@/types';

const DEFAULT_COLOR = '#6B7280';
const MARKER_SIZE = 36;

interface MapMarkersProps {
  places: MapPlaceWithDetails[];
  onPlacePress: (mapPlaceId: string) => void;
}

export function MapMarkers({ places, onPlacePress }: MapMarkersProps) {
  return (
    <>
      {places.map((place) => {
        const firstTag = place.map_place_tags[0]?.tags;
        const color = firstTag?.color ?? DEFAULT_COLOR;
        const emoji = firstTag?.emoji ?? '📍';

        return (
          <Mapbox.MarkerView
            key={place.id}
            coordinate={[place.places.longitude, place.places.latitude]}
            allowOverlap={true}
          >
            <Pressable onPress={() => onPlacePress(place.id)}>
              <View
                style={{
                  width: MARKER_SIZE,
                  height: MARKER_SIZE,
                  borderRadius: MARKER_SIZE / 2,
                  backgroundColor: color,
                  borderWidth: 2,
                  borderColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  elevation: 5,
                }}
              >
                <Text style={{ fontSize: 16 }}>{emoji}</Text>
              </View>
            </Pressable>
          </Mapbox.MarkerView>
        );
      })}
    </>
  );
}
