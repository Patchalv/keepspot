import { useMemo } from 'react';
import type { MapPlaceWithDetails, VisitedFilter } from '@/types';

interface FilterParams {
  places: MapPlaceWithDetails[] | undefined;
  selectedTagIds: string[];
  visitedFilter: VisitedFilter;
  searchQuery: string;
}

export function useFilteredPlaces({
  places,
  selectedTagIds,
  visitedFilter,
  searchQuery,
}: FilterParams): MapPlaceWithDetails[] {
  return useMemo(() => {
    if (!places) return [];

    let filtered = places;

    // Filter by tags (intersection — place must have at least one selected tag)
    if (selectedTagIds.length > 0) {
      filtered = filtered.filter((p) =>
        p.map_place_tags.some((mpt) => selectedTagIds.includes(mpt.tag_id))
      );
    }

    // Filter by visited status
    if (visitedFilter === 'visited') {
      filtered = filtered.filter(
        (p) => p.place_visits[0]?.visited === true
      );
    } else if (visitedFilter === 'not_visited') {
      filtered = filtered.filter(
        (p) => !p.place_visits[0]?.visited
      );
    }

    // Filter by search query (name match)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((p) =>
        p.places.name.toLowerCase().includes(query) ||
        (p.note && p.note.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [places, selectedTagIds, visitedFilter, searchQuery]);
}
