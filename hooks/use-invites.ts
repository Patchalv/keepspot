import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { MapInvite } from '@/types';

export function useInvites(mapId: string | null) {
  return useQuery<MapInvite[]>({
    queryKey: ['invites', mapId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('map_invites')
        .select('*')
        .eq('map_id', mapId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!mapId,
  });
}
