-- Milestone 1, Step 2: Enable RLS and create policies for all tables.
-- Policies copied from docs/technical-plan.md Section 3.

-- ============================================================
-- profiles
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================
-- maps
-- ============================================================
ALTER TABLE maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their maps"
  ON maps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM map_members
      WHERE map_members.map_id = maps.id
      AND map_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create maps"
  ON maps FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners can update maps"
  ON maps FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM map_members
      WHERE map_members.map_id = maps.id
      AND map_members.user_id = auth.uid()
      AND map_members.role = 'owner'
    )
  );

CREATE POLICY "Owners can delete maps"
  ON maps FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM map_members
      WHERE map_members.map_id = maps.id
      AND map_members.user_id = auth.uid()
      AND map_members.role = 'owner'
    )
  );

-- ============================================================
-- map_members
-- ============================================================
ALTER TABLE map_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view map membership"
  ON map_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM map_members AS mm
      WHERE mm.map_id = map_members.map_id
      AND mm.user_id = auth.uid()
    )
  );

CREATE POLICY "System inserts members (via Edge Functions)"
  ON map_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can remove members"
  ON map_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM map_members AS mm
      WHERE mm.map_id = map_members.map_id
      AND mm.user_id = auth.uid()
      AND mm.role = 'owner'
    )
  );

-- ============================================================
-- tags
-- ============================================================
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view tags"
  ON tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM map_members
      WHERE map_members.map_id = tags.map_id
      AND map_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create tags"
  ON tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM map_members
      WHERE map_members.map_id = tags.map_id
      AND map_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update tags"
  ON tags FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM map_members
      WHERE map_members.map_id = tags.map_id
      AND map_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can delete tags"
  ON tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM map_members
      WHERE map_members.map_id = tags.map_id
      AND map_members.user_id = auth.uid()
    )
  );

-- ============================================================
-- places
-- ============================================================
ALTER TABLE places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view places"
  ON places FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert places"
  ON places FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- map_places
-- ============================================================
ALTER TABLE map_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view map places"
  ON map_places FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM map_members
      WHERE map_members.map_id = map_places.map_id
      AND map_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can add places"
  ON map_places FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM map_members
      WHERE map_members.map_id = map_places.map_id
      AND map_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update places"
  ON map_places FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM map_members
      WHERE map_members.map_id = map_places.map_id
      AND map_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can delete places"
  ON map_places FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM map_members
      WHERE map_members.map_id = map_places.map_id
      AND map_members.user_id = auth.uid()
    )
  );

-- ============================================================
-- map_place_tags
-- ============================================================
ALTER TABLE map_place_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view place tags"
  ON map_place_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM map_places
      JOIN map_members ON map_members.map_id = map_places.map_id
      WHERE map_places.id = map_place_tags.map_place_id
      AND map_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can manage place tags"
  ON map_place_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM map_places
      JOIN map_members ON map_members.map_id = map_places.map_id
      WHERE map_places.id = map_place_tags.map_place_id
      AND map_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can remove place tags"
  ON map_place_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM map_places
      JOIN map_members ON map_members.map_id = map_places.map_id
      WHERE map_places.id = map_place_tags.map_place_id
      AND map_members.user_id = auth.uid()
    )
  );

-- ============================================================
-- place_visits
-- ============================================================
ALTER TABLE place_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own visit status"
  ON place_visits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can set own visit status"
  ON place_visits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own visit status"
  ON place_visits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own visit status"
  ON place_visits FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- map_invites
-- ============================================================
ALTER TABLE map_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view invites for their maps"
  ON map_invites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM map_members
      WHERE map_members.map_id = map_invites.map_id
      AND map_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create invites"
  ON map_invites FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM map_members
      WHERE map_members.map_id = map_invites.map_id
      AND map_members.user_id = auth.uid()
    )
  );
