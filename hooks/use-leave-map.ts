import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

export function useLeaveMap() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mapId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('map_members')
        .delete()
        .eq('map_id', mapId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maps'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
