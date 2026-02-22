import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface UpdateMapInput {
  mapId: string;
  name: string;
}

export function useUpdateMap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mapId, name }: UpdateMapInput) => {
      const { error } = await supabase
        .from('maps')
        .update({ name: name.trim() })
        .eq('id', mapId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maps'] });
    },
  });
}
