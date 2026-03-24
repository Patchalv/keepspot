import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { track } from '@/lib/analytics';
import type { MapRole } from '@/types';

interface RemoveMemberInput {
  memberId: string;
  mapId: string;
  role: Exclude<MapRole, 'owner'>;
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, mapId }: RemoveMemberInput) => {
      const { error } = await supabase
        .from('map_members')
        .delete()
        .eq('id', memberId)
        .eq('map_id', mapId);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      track('member_removed', {
        map_id: variables.mapId,
        role: variables.role,
      });
      queryClient.invalidateQueries({ queryKey: ['map-members', variables.mapId] });
      queryClient.invalidateQueries({ queryKey: ['maps'] });
    },
  });
}
