-- Allow any member to leave a map by deleting their own membership row.
-- This replaces the "Owners can remove members" policy since it's a superset:
-- owners can delete their own row AND members can delete theirs.

DROP POLICY "Owners can remove members" ON map_members;

CREATE POLICY "Members can leave maps"
  ON map_members FOR DELETE
  USING (auth.uid() = user_id);
