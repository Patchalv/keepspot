import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { FREE_TIER, ENTITLEMENTS } from '@/lib/constants';

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
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddPlaceInput) => {
      if (!user) throw new Error('Not authenticated');

      // Client-side freemium check
      if (profile?.entitlement === ENTITLEMENTS.free) {
        const { count, error: countError } = await supabase
          .from('map_places')
          .select('id', { count: 'exact' })
          .eq('added_by', user.id)
          .limit(1);

        if (countError) throw countError;
        if ((count ?? 0) >= FREE_TIER.maxPlaces) {
          throw new Error(
            `Free accounts are limited to ${FREE_TIER.maxPlaces} places. Upgrade to premium for unlimited places.`
          );
        }
      }

      // 1. Insert place or get existing
      let placeId: string;
      const { data: inserted, error: insertError } = await supabase
        .from('places')
        .insert({
          google_place_id: input.googlePlaceId,
          name: input.name,
          address: input.address,
          latitude: input.latitude,
          longitude: input.longitude,
          google_category: input.googleCategory,
        })
        .select('id')
        .single();

      if (insertError && insertError.code === '23505') {
        // Unique constraint violation — place already exists, fetch it
        const { data: existing, error: fetchError } = await supabase
          .from('places')
          .select('id')
          .eq('google_place_id', input.googlePlaceId)
          .single();
        if (fetchError) throw fetchError;
        placeId = existing.id;
      } else if (insertError) {
        throw insertError;
      } else {
        placeId = inserted.id;
      }

      // 2. Insert map_place
      const { data: mapPlace, error: mapPlaceError } = await supabase
        .from('map_places')
        .insert({
          map_id: input.mapId,
          place_id: placeId,
          note: input.note || null,
          added_by: user.id,
        })
        .select('id')
        .single();

      if (mapPlaceError) throw mapPlaceError;

      // 3. Insert tags (if any selected)
      if (input.tagIds.length > 0) {
        const tagRows = input.tagIds.map((tagId) => ({
          map_place_id: mapPlace.id,
          tag_id: tagId,
        }));

        const { error: tagsError } = await supabase
          .from('map_place_tags')
          .insert(tagRows);

        if (tagsError) throw tagsError;
      }

      // 4. Insert visit status
      const { error: visitError } = await supabase
        .from('place_visits')
        .insert({
          user_id: user.id,
          map_place_id: mapPlace.id,
          visited: input.visited,
        });

      if (visitError) throw visitError;

      return mapPlace.id;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['map-places', variables.mapId],
      });
    },
  });
}
