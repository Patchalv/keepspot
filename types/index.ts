import type { Database } from '@/supabase/types/database';

// Row types (what you get back from SELECT)
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Map = Database['public']['Tables']['maps']['Row'];
export type MapMember = Database['public']['Tables']['map_members']['Row'];
export type Tag = Database['public']['Tables']['tags']['Row'];
export type Place = Database['public']['Tables']['places']['Row'];
export type MapPlace = Database['public']['Tables']['map_places']['Row'];
export type MapPlaceTag = Database['public']['Tables']['map_place_tags']['Row'];
export type PlaceVisit = Database['public']['Tables']['place_visits']['Row'];
export type MapInvite = Database['public']['Tables']['map_invites']['Row'];

// Insert types (what you pass to INSERT)
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type MapInsert = Database['public']['Tables']['maps']['Insert'];
export type MapMemberInsert = Database['public']['Tables']['map_members']['Insert'];
export type TagInsert = Database['public']['Tables']['tags']['Insert'];
export type PlaceInsert = Database['public']['Tables']['places']['Insert'];
export type MapPlaceInsert = Database['public']['Tables']['map_places']['Insert'];
export type MapPlaceTagInsert = Database['public']['Tables']['map_place_tags']['Insert'];
export type PlaceVisitInsert = Database['public']['Tables']['place_visits']['Insert'];
export type MapInviteInsert = Database['public']['Tables']['map_invites']['Insert'];

// Union types for constrained text columns
export type Entitlement = 'free' | 'premium';
export type MapRole = 'owner' | 'editor';
