import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ALL_MAPS_ID } from '@/lib/constants';
import type { MapPlaceWithDetails } from '@/types';

export function useUpdatePlaceNote(activeMapId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      mapPlaceId,
      note,
    }: {
      mapPlaceId: string;
      note: string | null;
    }) => {
      const { error } = await supabase
        .from('map_places')
        .update({ note })
        .eq('id', mapPlaceId);

      if (error) throw error;
    },
    onMutate: async ({ mapPlaceId, note }) => {
      const queryKey = ['map-places', activeMapId];
      await queryClient.cancelQueries({ queryKey });

      const previous =
        queryClient.getQueryData<MapPlaceWithDetails[]>(queryKey);

      queryClient.setQueryData<MapPlaceWithDetails[]>(queryKey, (old) =>
        old?.map((p) => (p.id === mapPlaceId ? { ...p, note } : p))
      );

      // Also update the All Maps cache if we're on a specific map
      let previousAll: MapPlaceWithDetails[] | undefined;
      if (activeMapId !== ALL_MAPS_ID) {
        const allKey = ['map-places', ALL_MAPS_ID];
        previousAll = queryClient.getQueryData<MapPlaceWithDetails[]>(allKey);
        if (previousAll) {
          queryClient.setQueryData<MapPlaceWithDetails[]>(allKey, (old) =>
            old?.map((p) => (p.id === mapPlaceId ? { ...p, note } : p))
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
      queryClient.invalidateQueries({ queryKey: ['map-places', activeMapId] });
      if (activeMapId !== ALL_MAPS_ID) {
        queryClient.invalidateQueries({ queryKey: ['map-places', ALL_MAPS_ID] });
      }
    },
  });
}
