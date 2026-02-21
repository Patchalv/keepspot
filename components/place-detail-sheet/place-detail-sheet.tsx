import { forwardRef, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { MapPlaceWithDetails } from '@/types';
import { openDirections } from '@/lib/directions';

interface PlaceDetailSheetProps {
  place: MapPlaceWithDetails | null;
  onToggleVisited: (mapPlaceId: string, visited: boolean) => void;
  onClose: () => void;
}

export const PlaceDetailSheet = forwardRef<BottomSheet, PlaceDetailSheetProps>(
  function PlaceDetailSheet({ place, onToggleVisited, onClose }, ref) {
    const isVisited = place?.place_visits[0]?.visited ?? false;

    const handleDirections = useCallback(() => {
      if (!place) return;
      openDirections(
        place.places.latitude,
        place.places.longitude,
        place.places.name
      );
    }, [place]);

    const handleToggleVisited = useCallback(() => {
      if (!place) return;
      onToggleVisited(place.id, !isVisited);
    }, [place, isVisited, onToggleVisited]);

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={['30%', '60%']}
        enablePanDownToClose
        onClose={onClose}
        backgroundStyle={{ backgroundColor: '#FFFFFF', borderRadius: 24 }}
        handleIndicatorStyle={{ backgroundColor: '#D1D5DB', width: 40 }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{ padding: 20, paddingTop: 4 }}
        >
          {place && (
            <>
              {/* Name */}
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: '#111827',
                  marginBottom: 4,
                }}
              >
                {place.places.name}
              </Text>

              {/* Address */}
              {place.places.address && (
                <Text
                  style={{
                    fontSize: 14,
                    color: '#6B7280',
                    marginBottom: 12,
                  }}
                >
                  {place.places.address}
                </Text>
              )}

              {/* Tags */}
              {place.map_place_tags.length > 0 && (
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginBottom: 16,
                  }}
                >
                  {place.map_place_tags.map((mpt) => (
                    <View
                      key={mpt.tag_id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: `${mpt.tags.color ?? '#6B7280'}20`,
                        borderRadius: 16,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                      }}
                    >
                      {mpt.tags.emoji && (
                        <Text style={{ fontSize: 12, marginRight: 4 }}>
                          {mpt.tags.emoji}
                        </Text>
                      )}
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '500',
                          color: mpt.tags.color ?? '#6B7280',
                        }}
                      >
                        {mpt.tags.name}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Note */}
              {place.note && (
                <View
                  style={{
                    backgroundColor: '#F9FAFB',
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ fontSize: 14, color: '#374151', lineHeight: 20 }}>
                    {place.note}
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {/* Visited Toggle */}
                <Pressable
                  onPress={handleToggleVisited}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isVisited ? '#10B981' : '#F3F4F6',
                    borderRadius: 12,
                    paddingVertical: 12,
                    gap: 8,
                  }}
                >
                  <FontAwesome
                    name={isVisited ? 'check-circle' : 'circle-o'}
                    size={18}
                    color={isVisited ? '#FFFFFF' : '#6B7280'}
                  />
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '600',
                      color: isVisited ? '#FFFFFF' : '#374151',
                    }}
                  >
                    {isVisited ? 'Visited' : 'Not visited'}
                  </Text>
                </Pressable>

                {/* Directions */}
                <Pressable
                  onPress={handleDirections}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#3B82F6',
                    borderRadius: 12,
                    paddingVertical: 12,
                    gap: 8,
                  }}
                >
                  <FontAwesome name="location-arrow" size={18} color="#FFFFFF" />
                  <Text
                    style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}
                  >
                    Directions
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);
