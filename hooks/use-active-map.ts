import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/hooks/use-profile';
import { useMaps } from '@/hooks/use-maps';

export function useActiveMap() {
  const { data: profile } = useProfile();
  const { data: mapMembers } = useMaps();
  const queryClient = useQueryClient();

  const maps = mapMembers?.map((m) => m.maps).filter(Boolean) ?? [];
  const activeMapId = profile?.active_map_id ?? maps[0]?.id ?? null;
  const activeMap = maps.find((m) => m.id === activeMapId) ?? maps[0] ?? null;

  const { mutate: setActiveMap, isPending: isSettingMap } = useMutation({
    mutationFn: async (mapId: string) => {
      if (!profile) throw new Error('No profile');
      const { error } = await supabase
        .from('profiles')
        .update({ active_map_id: mapId })
        .eq('id', profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return {
    activeMapId,
    activeMapName: activeMap?.name ?? null,
    maps,
    setActiveMap,
    isSettingMap,
  };
}
