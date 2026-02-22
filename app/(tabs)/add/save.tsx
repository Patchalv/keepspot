import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useActiveMap } from '@/hooks/use-active-map';
import { useTags } from '@/hooks/use-tags';
import { useAddPlace } from '@/hooks/use-add-place';
import { getPlaceDetails } from '@/lib/google-places';

export default function SaveScreen() {
  const { placeId, name, address } = useLocalSearchParams<{
    placeId: string;
    name: string;
    address: string;
  }>();

  const { activeMapId, activeMapName } = useActiveMap();
  const { data: tags } = useTags(activeMapId);
  const addPlace = useAddPlace();

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [visited, setVisited] = useState(false);
  const [placeDetails, setPlaceDetails] = useState<{
    latitude: number;
    longitude: number;
    types: string[];
  } | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);

  useEffect(() => {
    if (!placeId) return;

    let cancelled = false;
    setIsLoadingDetails(true);

    getPlaceDetails(placeId)
      .then((details) => {
        if (!cancelled) setPlaceDetails(details);
      })
      .catch(() => {
        if (!cancelled) Alert.alert('Error', 'Failed to load place details.');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDetails(false);
      });

    return () => {
      cancelled = true;
    };
  }, [placeId]);

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const googleCategory = placeDetails?.types?.[0]?.replace(/_/g, ' ') ?? null;

  const handleSave = () => {
    if (!activeMapId || !placeDetails || !placeId || !name) return;

    addPlace.mutate(
      {
        googlePlaceId: placeId,
        name,
        address: address ?? '',
        latitude: placeDetails.latitude,
        longitude: placeDetails.longitude,
        googleCategory,
        mapId: activeMapId,
        note,
        tagIds: selectedTagIds,
        visited,
      },
      {
        onSuccess: () => {
          router.back();
        },
        onError: (error) => {
          Alert.alert('Error', error.message);
        },
      }
    );
  };

  const canSave = !isLoadingDetails && !!placeDetails && !!activeMapId;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 pb-2 pt-2">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text className="text-base text-blue-500">Cancel</Text>
        </Pressable>
        <Text className="text-lg font-semibold">Save Place</Text>
        <View className="w-14" />
      </View>

      <ScrollView
        className="flex-1 px-4"
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="pb-8"
      >
        {/* Place preview */}
        <View className="mt-4 rounded-xl bg-gray-50 p-4">
          <Text className="text-lg font-semibold">{name}</Text>
          {address ? (
            <Text className="mt-1 text-sm text-gray-500">{address}</Text>
          ) : null}
          {googleCategory && (
            <Text className="mt-1 text-xs capitalize text-gray-400">
              {googleCategory}
            </Text>
          )}
          {isLoadingDetails && (
            <ActivityIndicator
              size="small"
              className="mt-2 self-start"
              color="#9CA3AF"
            />
          )}
        </View>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <View className="mt-6">
            <Text className="mb-2 text-sm font-medium text-gray-500">
              Tags
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2"
            >
              {tags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <Pressable
                    key={tag.id}
                    onPress={() => toggleTag(tag.id)}
                    className={`flex-row items-center rounded-full px-3 py-1.5 ${
                      isSelected ? 'bg-blue-500' : 'bg-gray-100'
                    }`}
                  >
                    {tag.emoji && (
                      <Text className="mr-1 text-sm">{tag.emoji}</Text>
                    )}
                    <Text
                      className={`text-sm font-medium ${
                        isSelected ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      {tag.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Note */}
        <View className="mt-6">
          <Text className="mb-2 text-sm font-medium text-gray-500">Note</Text>
          <TextInput
            className="min-h-[80px] rounded-xl bg-gray-50 px-4 py-3 text-base"
            placeholder="Add a note..."
            placeholderTextColor="#9CA3AF"
            value={note}
            onChangeText={setNote}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Visited toggle */}
        <Pressable
          className="mt-6 flex-row items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
          onPress={() => setVisited((v) => !v)}
        >
          <Text className="text-base">Already visited?</Text>
          <View
            className={`h-6 w-6 items-center justify-center rounded-md ${
              visited ? 'bg-blue-500' : 'border-2 border-gray-300'
            }`}
          >
            {visited && <Text className="text-xs text-white">✓</Text>}
          </View>
        </Pressable>

        {/* Map label */}
        {activeMapName && (
          <Text className="mt-6 text-center text-sm text-gray-400">
            Saving to {activeMapName}
          </Text>
        )}

        {/* Save button */}
        <Pressable
          className={`mt-6 items-center rounded-xl py-3.5 ${
            canSave && !addPlace.isPending
              ? 'bg-blue-500 active:bg-blue-600'
              : 'bg-gray-200'
          }`}
          onPress={handleSave}
          disabled={!canSave || addPlace.isPending}
        >
          {addPlace.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text
              className={`text-base font-semibold ${
                canSave ? 'text-white' : 'text-gray-400'
              }`}
            >
              Save Place
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
