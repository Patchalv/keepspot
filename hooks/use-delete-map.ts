import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { track } from '@/lib/analytics';

export function useDeleteMap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mapId: string) => {
      const { error } = await supabase
        .from('maps')
        .delete()
        .eq('id', mapId);

      if (error) throw error;
    },
    onSuccess: (_data, mapId) => {
      track('map_deleted', { map_id: mapId });
      queryClient.invalidateQueries({ queryKey: ['maps'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
