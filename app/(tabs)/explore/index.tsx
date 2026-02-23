import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import Mapbox from '@/lib/mapbox';
import { useLocation } from '@/hooks/use-location';
import { useActiveMap } from '@/hooks/use-active-map';
import { useMapPlaces } from '@/hooks/use-map-places';
import { useAllMapPlaces } from '@/hooks/use-all-map-places';
import { useTags } from '@/hooks/use-tags';
import { useFilteredPlaces } from '@/hooks/use-filtered-places';
import { useToggleVisited } from '@/hooks/use-toggle-visited';
import { useUpdatePlaceTags } from '@/hooks/use-update-place-tags';
import { useDeletePlace } from '@/hooks/use-delete-place';
import { useOnboarding } from '@/hooks/use-onboarding';
import { ExploreHeader } from '@/components/explore-header/explore-header';
import { MapMarkers } from '@/components/map-markers/map-markers';
import { PlaceDetailSheet } from '@/components/place-detail-sheet/place-detail-sheet';
import { FilterSheet } from '@/components/filter-sheet/filter-sheet';
import { PlaceList } from '@/components/place-list/place-list';
import { EmptyState } from '@/components/empty-state/empty-state';
import { SpotlightTooltip } from '@/components/spotlight-tooltip/spotlight-tooltip';
import type { Tag, ViewMode, VisitedFilter } from '@/types';

// Madrid fallback coordinates
const DEFAULT_CENTER: [number, number] = [-3.7038, 40.4168];

export default function ExploreScreen() {
  const { location } = useLocation();
  const { activeMapId, activeMapName, maps, setActiveMap, isAllMaps } =
    useActiveMap();

  // Use different queries based on All Maps mode
  const singleMapQuery = useMapPlaces(isAllMaps ? null : activeMapId);
  const allMapsQuery = useAllMapPlaces(isAllMaps);
  const activePlacesQuery = isAllMaps ? allMapsQuery : singleMapQuery;

  const {
    data: places,
    isRefetching,
    refetch,
  } = activePlacesQuery;

  const { data: tags } = useTags(isAllMaps ? null : activeMapId);
  const { mutate: toggleVisited } = useToggleVisited(activeMapId);
  const { mutate: updatePlaceTag } = useUpdatePlaceTags(activeMapId);
  const { mutate: deletePlace } = useDeletePlace(activeMapId);

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
  const filterButtonRef = useRef<View>(null);

  // Derived
  const filteredPlaces = useFilteredPlaces({
    places,
    selectedTagIds: isAllMaps ? [] : selectedTagIds,
    visitedFilter,
    searchQuery,
  });

  const selectedPlace = filteredPlaces.find((p) => p.id === selectedPlaceId) ?? null;

  // Fetch tags for the selected place's map (handles All Maps mode)
  const selectedPlaceMapId = selectedPlace?.map_id ?? null;
  const { data: selectedPlaceTags } = useTags(
    isAllMaps ? selectedPlaceMapId : activeMapId
  );

  const center: [number, number] = location
    ? [location.longitude, location.latitude]
    : DEFAULT_CENTER;

  const activeFilterCount =
    (isAllMaps ? 0 : selectedTagIds.length) +
    (visitedFilter !== 'all' ? 1 : 0) +
    (searchQuery ? 1 : 0);

  // Onboarding
  const { showEmptyState, showFilterSpotlight, dismissSpotlight } =
    useOnboarding({
      placesData: places,
      activeFilterCount,
    });

  const [filterButtonRect, setFilterButtonRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    if (showFilterSpotlight) {
      // Small delay to ensure layout is complete after data loads
      const timer = setTimeout(() => {
        filterButtonRef.current?.measureInWindow((x, y, width, height) => {
          if (width > 0 && height > 0) {
            setFilterButtonRect({ x, y, width, height });
          }
        });
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setFilterButtonRect(null);
    }
  }, [showFilterSpotlight]);

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

  const handleTogglePlaceTag = useCallback(
    (mapPlaceId: string, tagId: string, tag: Tag, currentlyAssigned: boolean) => {
      updatePlaceTag({ mapPlaceId, tagId, tag, currentlyAssigned });
    },
    [updatePlaceTag]
  );

  const handleDeletePlace = useCallback(
    (mapPlaceId: string) => {
      deletePlace(mapPlaceId);
      detailSheetRef.current?.close();
      setSelectedPlaceId(null);
    },
    [deletePlace]
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
        <>
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
          {showEmptyState && <EmptyState variant="map" />}
        </>
      ) : showEmptyState ? (
        <EmptyState variant="list" />
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
        activeMapId={activeMapId}
        onSelectMap={handleSelectMap}
        viewMode={viewMode}
        onToggleView={handleToggleView}
        onOpenFilters={handleOpenFilters}
        activeFilterCount={activeFilterCount}
        onRefresh={viewMode === 'map' ? handleRefresh : undefined}
        filterButtonRef={filterButtonRef}
      />

      {/* Place Detail Sheet */}
      <PlaceDetailSheet
        ref={detailSheetRef}
        place={selectedPlace}
        availableTags={selectedPlaceTags ?? []}
        onToggleVisited={handleToggleVisited}
        onToggleTag={handleTogglePlaceTag}
        onDelete={handleDeletePlace}
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
        isAllMaps={isAllMaps}
      />

      {/* Filter spotlight tooltip (onboarding step 2) */}
      {showFilterSpotlight && filterButtonRect && (
        <SpotlightTooltip
          targetRect={filterButtonRect}
          title="Filter your places"
          description="Use filters to find places by tags, visited status, or search by name."
          onDismiss={dismissSpotlight}
        />
      )}
    </View>
  );
}
