-- Update user cleanup trigger to also delete orphaned places.
-- When sole-member maps are deleted (CASCADE deletes map_places),
-- the underlying places rows remain because map_places → places
-- has no CASCADE. This adds a step to remove places that are no
-- longer referenced by any map_places.

CREATE OR REPLACE FUNCTION handle_user_deleted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sole_map_ids        uuid[];
  affected_place_ids  uuid[];
  transfer_map        RECORD;
  new_owner_id        uuid;
BEGIN
  -- 1. Clear active_map_id to avoid FK conflict (profiles -> maps)
  UPDATE profiles
  SET active_map_id = NULL
  WHERE id = OLD.id;

  -- 2. Delete personal visit data (place_visits -> profiles)
  DELETE FROM place_visits
  WHERE user_id = OLD.id;

  -- 3. Delete invites created by this user (map_invites -> profiles)
  DELETE FROM map_invites
  WHERE created_by = OLD.id;

  -- 4. Find maps where this user is the SOLE member and delete them.
  --    CASCADE on maps(id) handles map_members, tags, map_places,
  --    map_place_tags, and map_invites automatically.
  SELECT ARRAY_AGG(mm.map_id) INTO sole_map_ids
  FROM map_members mm
  WHERE mm.user_id = OLD.id
    AND NOT EXISTS (
      SELECT 1 FROM map_members other
      WHERE other.map_id = mm.map_id
        AND other.user_id <> OLD.id
    );

  IF sole_map_ids IS NOT NULL THEN
    -- Collect place_ids before CASCADE deletes the map_places rows
    SELECT ARRAY_AGG(DISTINCT mp.place_id) INTO affected_place_ids
    FROM map_places mp
    WHERE mp.map_id = ANY(sole_map_ids);

    DELETE FROM maps WHERE id = ANY(sole_map_ids);
  END IF;

  -- 5. Transfer ownership on maps where this user is owner but others exist.
  --    The new owner is the longest-tenured other member (earliest joined_at).
  FOR transfer_map IN
    SELECT mm.map_id
    FROM map_members mm
    WHERE mm.user_id = OLD.id
      AND mm.role = 'owner'
  LOOP
    SELECT user_id INTO new_owner_id
    FROM map_members
    WHERE map_id = transfer_map.map_id
      AND user_id <> OLD.id
    ORDER BY joined_at ASC
    LIMIT 1;

    IF new_owner_id IS NOT NULL THEN
      -- Promote the new owner
      UPDATE map_members
      SET role = 'owner'
      WHERE map_id = transfer_map.map_id
        AND user_id = new_owner_id;

      -- Nullify the original creator metadata
      UPDATE maps
      SET created_by = NULL
      WHERE id = transfer_map.map_id;
    END IF;
  END LOOP;

  -- 6. Nullify added_by for all remaining map_places by this user.
  --    Sole-member maps were already deleted; this catches transferred
  --    and editor-only maps in a single statement.
  UPDATE map_places
  SET added_by = NULL
  WHERE added_by = OLD.id;

  -- 7. Remove all remaining map_members rows for this user.
  DELETE FROM map_members
  WHERE user_id = OLD.id;

  -- 8. Delete orphaned places from deleted sole-member maps.
  --    Only deletes places that are no longer referenced by any map_places
  --    (safe for shared places that exist on other users' maps).
  IF affected_place_ids IS NOT NULL THEN
    DELETE FROM places
    WHERE id = ANY(affected_place_ids)
      AND NOT EXISTS (
        SELECT 1 FROM map_places mp WHERE mp.place_id = places.id
      );
  END IF;

  -- All FK references to profiles(id) for this user are now cleared.
  -- The CASCADE from auth.users -> profiles will proceed cleanly.
  RETURN OLD;
END;
$$;
