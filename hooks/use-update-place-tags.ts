import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ALL_MAPS_ID } from '@/lib/constants';
import type { MapPlaceWithDetails, Tag } from '@/types';

interface ToggleTagInput {
  mapPlaceId: string;
  tagId: string;
  tag: Tag;
  currentlyAssigned: boolean;
}

export function useUpdatePlaceTags(activeMapId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      mapPlaceId,
      tagId,
      currentlyAssigned,
    }: ToggleTagInput) => {
      if (currentlyAssigned) {
        const { error } = await supabase
          .from('map_place_tags')
          .delete()
          .eq('map_place_id', mapPlaceId)
          .eq('tag_id', tagId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('map_place_tags')
          .insert({ map_place_id: mapPlaceId, tag_id: tagId });
        if (error) throw error;
      }
    },
    onMutate: async ({ mapPlaceId, tagId, tag, currentlyAssigned }) => {
      const queryKey = ['map-places', activeMapId];
      await queryClient.cancelQueries({ queryKey });

      const previous =
        queryClient.getQueryData<MapPlaceWithDetails[]>(queryKey);

      queryClient.setQueryData<MapPlaceWithDetails[]>(queryKey, (old) =>
        old?.map((p) => {
          if (p.id !== mapPlaceId) return p;
          const newTags = currentlyAssigned
            ? p.map_place_tags.filter((mpt) => mpt.tag_id !== tagId)
            : [...p.map_place_tags, { tag_id: tagId, tags: tag }];
          return { ...p, map_place_tags: newTags };
        })
      );

      let previousAll: MapPlaceWithDetails[] | undefined;
      if (activeMapId !== ALL_MAPS_ID) {
        const allKey = ['map-places', ALL_MAPS_ID];
        previousAll =
          queryClient.getQueryData<MapPlaceWithDetails[]>(allKey);
        if (previousAll) {
          queryClient.setQueryData<MapPlaceWithDetails[]>(allKey, (old) =>
            old?.map((p) => {
              if (p.id !== mapPlaceId) return p;
              const newTags = currentlyAssigned
                ? p.map_place_tags.filter((mpt) => mpt.tag_id !== tagId)
                : [...p.map_place_tags, { tag_id: tagId, tags: tag }];
              return { ...p, map_place_tags: newTags };
            })
          );
        }
      }

      return { previous, previousAll };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ['map-places', activeMapId],
          context.previous
        );
      }
      if (context?.previousAll && activeMapId !== ALL_MAPS_ID) {
        queryClient.setQueryData(
          ['map-places', ALL_MAPS_ID],
          context.previousAll
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['map-places', activeMapId],
      });
      if (activeMapId !== ALL_MAPS_ID) {
        queryClient.invalidateQueries({
          queryKey: ['map-places', ALL_MAPS_ID],
        });
      }
    },
  });
}
