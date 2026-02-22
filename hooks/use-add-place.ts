import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface AddPlaceInput {
  googlePlaceId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  googleCategory: string | null;
  mapId: string;
  note: string;
  tagIds: string[];
  visited: boolean;
}

export function useAddPlace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddPlaceInput) => {
      const { data, error } = await supabase.functions.invoke('add-place', {
        body: input,
      });

      if (error) {
        const context = error.context as Record<string, unknown> | undefined;
        const message =
          typeof context?.error === 'string'
            ? context.error
            : 'Failed to save place';
        throw new Error(message);
      }

      return data.mapPlaceId as string;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['map-places', variables.mapId],
      });
    },
  });
}
