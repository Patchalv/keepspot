import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { ViewMode } from '@/types';

interface MapOption {
  id: string;
  name: string;
}

interface ExploreHeaderProps {
  mapName: string | null;
  maps: MapOption[];
  onSelectMap: (mapId: string) => void;
  viewMode: ViewMode;
  onToggleView: () => void;
  onOpenFilters: () => void;
  activeFilterCount: number;
  onRefresh?: () => void;
}

export function ExploreHeader({
  mapName,
  maps,
  onSelectMap,
  viewMode,
  onToggleView,
  onOpenFilters,
  activeFilterCount,
  onRefresh,
}: ExploreHeaderProps) {
  const insets = useSafeAreaInsets();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <View
      style={{ paddingTop: insets.top + 8 }}
      className="absolute left-0 right-0 top-0 z-10 px-4 pb-3"
    >
      <View className="flex-row items-center justify-between">
        {/* Map Switcher */}
        <View className="relative">
          <Pressable
            className="flex-row items-center rounded-full bg-white/90 px-4 py-2 shadow-sm"
            onPress={() => setDropdownOpen(!dropdownOpen)}
          >
            <Text className="mr-2 text-base font-semibold text-gray-900">
              {mapName ?? 'No Map'}
            </Text>
            <FontAwesome
              name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
              size={12}
              color="#6B7280"
            />
          </Pressable>

          {/* Dropdown */}
          {dropdownOpen && maps.length > 0 && (
            <View className="absolute left-0 top-full mt-1 min-w-[200px] rounded-xl bg-white p-2 shadow-lg">
              {maps.map((map) => (
                <Pressable
                  key={map.id}
                  className={`rounded-lg px-3 py-2.5 ${
                    map.name === mapName ? 'bg-gray-100' : ''
                  }`}
                  onPress={() => {
                    onSelectMap(map.id);
                    setDropdownOpen(false);
                  }}
                >
                  <Text
                    className={`text-sm ${
                      map.name === mapName
                        ? 'font-semibold text-gray-900'
                        : 'text-gray-700'
                    }`}
                  >
                    {map.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Right controls */}
        <View className="flex-row items-center gap-2">
          {/* Refresh button (map view only) */}
          {viewMode === 'map' && onRefresh && (
            <Pressable
              className="h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm"
              onPress={onRefresh}
            >
              <FontAwesome name="refresh" size={16} color="#374151" />
            </Pressable>
          )}

          {/* Filter button */}
          <Pressable
            className="relative h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm"
            onPress={onOpenFilters}
          >
            <FontAwesome name="sliders" size={16} color="#374151" />
            {activeFilterCount > 0 && (
              <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-blue-500">
                <Text className="text-xs font-bold text-white">
                  {activeFilterCount}
                </Text>
              </View>
            )}
          </Pressable>

          {/* View toggle */}
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm"
            onPress={onToggleView}
          >
            <FontAwesome
              name={viewMode === 'map' ? 'list' : 'map'}
              size={16}
              color="#374151"
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
