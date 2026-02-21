import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import Mapbox from '@/lib/mapbox';
import { useLocation } from '@/hooks/use-location';
import { useActiveMap } from '@/hooks/use-active-map';
import { useMapPlaces } from '@/hooks/use-map-places';
import { useTags } from '@/hooks/use-tags';
import { useFilteredPlaces } from '@/hooks/use-filtered-places';
import { useToggleVisited } from '@/hooks/use-toggle-visited';
import { ExploreHeader } from '@/components/explore-header/explore-header';
import { MapMarkers } from '@/components/map-markers/map-markers';
import { PlaceDetailSheet } from '@/components/place-detail-sheet/place-detail-sheet';
import { FilterSheet } from '@/components/filter-sheet/filter-sheet';
import { PlaceList } from '@/components/place-list/place-list';
import type { ViewMode, VisitedFilter } from '@/types';

// Madrid fallback coordinates
const DEFAULT_CENTER: [number, number] = [-3.7038, 40.4168];

export default function ExploreScreen() {
  const { location } = useLocation();
  const { activeMapId, activeMapName, maps, setActiveMap } = useActiveMap();
  const {
    data: places,
    isRefetching,
    refetch,
  } = useMapPlaces(activeMapId);
  const { data: tags } = useTags(activeMapId);
  const { mutate: toggleVisited } = useToggleVisited(activeMapId);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('map');

  // Filter state
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [visitedFilter, setVisitedFilter] = useState<VisitedFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected place
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  // Refs
  const detailSheetRef = useRef<BottomSheet>(null);
  const filterSheetRef = useRef<BottomSheetModal>(null);

  // Derived
  const filteredPlaces = useFilteredPlaces({
    places,
    selectedTagIds,
    visitedFilter,
    searchQuery,
  });

  const selectedPlace = filteredPlaces.find((p) => p.id === selectedPlaceId) ?? null;

  const center: [number, number] = location
    ? [location.longitude, location.latitude]
    : DEFAULT_CENTER;

  const activeFilterCount =
    selectedTagIds.length + (visitedFilter !== 'all' ? 1 : 0) + (searchQuery ? 1 : 0);

  // Reset filters when switching maps
  useEffect(() => {
    setSelectedTagIds([]);
    setVisitedFilter('all');
    setSearchQuery('');
    setSelectedPlaceId(null);
    detailSheetRef.current?.close();
  }, [activeMapId]);

  // Handlers
  const handlePlacePress = useCallback((mapPlaceId: string) => {
    setSelectedPlaceId(mapPlaceId);
    detailSheetRef.current?.snapToIndex(0);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedPlaceId(null);
  }, []);

  const handleToggleView = useCallback(() => {
    setViewMode((prev) => (prev === 'map' ? 'list' : 'map'));
  }, []);

  const handleOpenFilters = useCallback(() => {
    filterSheetRef.current?.present();
  }, []);

  const handleToggleTag = useCallback((tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedTagIds([]);
    setVisitedFilter('all');
    setSearchQuery('');
  }, []);

  const handleToggleVisited = useCallback(
    (mapPlaceId: string, visited: boolean) => {
      toggleVisited({ mapPlaceId, visited });
    },
    [toggleVisited]
  );

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleSelectMap = useCallback(
    (mapId: string) => {
      setActiveMap(mapId);
    },
    [setActiveMap]
  );

  return (
    <View style={{ flex: 1 }}>
      {viewMode === 'map' ? (
        <Mapbox.MapView
          style={{ flex: 1 }}
          styleURL={Mapbox.StyleURL.Street}
          logoEnabled={false}
          attributionEnabled={false}
          scaleBarEnabled={false}
        >
          <Mapbox.Camera
            zoomLevel={13}
            centerCoordinate={center}
            animationMode="flyTo"
            animationDuration={0}
          />
          <Mapbox.LocationPuck puckBearingEnabled puckBearing="heading" />
          <MapMarkers places={filteredPlaces} onPlacePress={handlePlacePress} />
        </Mapbox.MapView>
      ) : (
        <View style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
          <PlaceList
            places={filteredPlaces}
            onPlacePress={handlePlacePress}
            isRefreshing={isRefetching}
            onRefresh={handleRefresh}
          />
        </View>
      )}

      {/* Header overlay */}
      <ExploreHeader
        mapName={activeMapName}
        maps={maps.map((m) => ({ id: m.id, name: m.name }))}
        onSelectMap={handleSelectMap}
        viewMode={viewMode}
        onToggleView={handleToggleView}
        onOpenFilters={handleOpenFilters}
        activeFilterCount={activeFilterCount}
        onRefresh={viewMode === 'map' ? handleRefresh : undefined}
      />

      {/* Place Detail Sheet */}
      <PlaceDetailSheet
        ref={detailSheetRef}
        place={selectedPlace}
        onToggleVisited={handleToggleVisited}
        onClose={handleCloseDetail}
      />

      {/* Filter Sheet */}
      <FilterSheet
        ref={filterSheetRef}
        tags={tags ?? []}
        selectedTagIds={selectedTagIds}
        onToggleTag={handleToggleTag}
        visitedFilter={visitedFilter}
        onSetVisitedFilter={setVisitedFilter}
        searchQuery={searchQuery}
        onSetSearchQuery={setSearchQuery}
        onClearAll={handleClearFilters}
      />
    </View>
  );
}
