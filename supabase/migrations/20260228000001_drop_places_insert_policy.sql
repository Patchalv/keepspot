-- Drop the permissive INSERT policy on `places` that allowed any authenticated
-- user to insert directly, bypassing the `add-place` Edge Function's freemium
-- checks. The Edge Function uses the service role key (bypasses RLS), so it
-- is unaffected by this change.
DROP POLICY "Authenticated users can insert places" ON places;
