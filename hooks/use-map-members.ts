import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface MapMemberWithProfile {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function useMapMembers(mapId: string | null) {
  return useQuery<MapMemberWithProfile[]>({
    queryKey: ['map-members', mapId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('map_members')
        .select('id, user_id, role, joined_at, profiles(id, display_name, avatar_url)')
        .eq('map_id', mapId!);

      if (error) throw error;
      return data as unknown as MapMemberWithProfile[];
    },
    enabled: !!mapId,
  });
}
