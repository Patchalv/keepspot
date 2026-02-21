import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Tag } from '@/types';

export function useTags(mapId: string | null) {
  return useQuery<Tag[]>({
    queryKey: ['tags', mapId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('map_id', mapId!)
        .order('position');

      if (error) throw error;
      return data;
    },
    enabled: !!mapId,
  });
}
