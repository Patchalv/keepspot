-- Fix infinite recursion in map_members SELECT policy.
--
-- The original policy checks map_members to decide if you can SELECT
-- from map_members, causing PostgreSQL error 42P17. This migration
-- adds a SECURITY DEFINER helper that bypasses RLS for the membership
-- check, breaking the cycle.

-- 1. Helper function (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_map_member(check_map_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.map_members
    WHERE map_id = check_map_id
    AND user_id = auth.uid()
  );
$$;

-- 2. Replace the recursive policy
DROP POLICY "Members can view map membership" ON map_members;

CREATE POLICY "Members can view map membership"
  ON map_members FOR SELECT
  USING (public.is_map_member(map_id));
