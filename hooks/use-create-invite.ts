import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { track } from '@/lib/analytics';
import { APP_DOMAIN } from '@/lib/constants';
import type { MapInvite, MapRole } from '@/types';

interface CreateInviteInput {
  mapId: string;
  role?: MapRole;
  expiresInDays?: number | null;
  maxUses?: number | null;
}

interface CreateInviteResult {
  invite: MapInvite;
  link: string;
}

export function useCreateInvite() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateInviteInput): Promise<CreateInviteResult> => {
      if (!user) throw new Error('Not authenticated');

      const token = Crypto.randomUUID();
      const expiresAt = input.expiresInDays
        ? new Date(Date.now() + input.expiresInDays * 86_400_000).toISOString()
        : null;

      const { data, error } = await supabase
        .from('map_invites')
        .insert({
          map_id: input.mapId,
          token,
          created_by: user.id,
          role: input.role ?? 'editor',
          expires_at: expiresAt,
          max_uses: input.maxUses ?? null,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        invite: data,
        link: `${APP_DOMAIN}/invite/${token}`,
      };
    },
    onSuccess: (_data, variables) => {
      track('invite_link_created', { map_id: variables.mapId });
      queryClient.invalidateQueries({ queryKey: ['invites', variables.mapId] });
    },
  });
}
