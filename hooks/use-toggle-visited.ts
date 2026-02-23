import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { track } from '@/lib/analytics';
import { ALL_MAPS_ID } from '@/lib/constants';
import type { MapPlaceWithDetails } from '@/types';

export function useToggleVisited(activeMapId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      mapPlaceId,
      visited,
    }: {
      mapPlaceId: string;
      visited: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('place_visits').upsert(
        {
          user_id: user.id,
          map_place_id: mapPlaceId,
          visited,
        },
        { onConflict: 'user_id,map_place_id' }
      );

      if (error) throw error;
    },
    onMutate: async ({ mapPlaceId, visited }) => {
      const queryKey = ['map-places', activeMapId];
      await queryClient.cancelQueries({ queryKey });

      const previous =
        queryClient.getQueryData<MapPlaceWithDetails[]>(queryKey);

      queryClient.setQueryData<MapPlaceWithDetails[]>(queryKey, (old) =>
        old?.map((p) =>
          p.id === mapPlaceId
            ? { ...p, place_visits: [{ visited }] }
            : p
        )
      );

      // Also update the All Maps cache if we're on a specific map
      let previousAll: MapPlaceWithDetails[] | undefined;
      if (activeMapId !== ALL_MAPS_ID) {
        const allKey = ['map-places', ALL_MAPS_ID];
        previousAll = queryClient.getQueryData<MapPlaceWithDetails[]>(allKey);
        if (previousAll) {
          queryClient.setQueryData<MapPlaceWithDetails[]>(allKey, (old) =>
            old?.map((p) =>
              p.id === mapPlaceId
                ? { ...p, place_visits: [{ visited }] }
                : p
            )
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
    onSuccess: (_data, variables) => {
      track('visited_toggled', {
        map_place_id: variables.mapPlaceId,
        new_status: variables.visited,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['map-places', activeMapId] });
      if (activeMapId !== ALL_MAPS_ID) {
        queryClient.invalidateQueries({ queryKey: ['map-places', ALL_MAPS_ID] });
      }
    },
  });
}
