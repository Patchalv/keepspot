-- Add BEFORE DELETE trigger on auth.users to clean up all associated data.
-- Prevents FK violations when a user is deleted from Supabase Auth.

-- ============================================================
-- Step 1: Schema changes — make columns nullable
-- ============================================================

-- map_places.added_by must be nullable so places survive on shared maps
-- after the user who added them is deleted.
ALTER TABLE map_places ALTER COLUMN added_by DROP NOT NULL;

-- maps.created_by must be nullable so transferred maps don't point to a
-- deleted profile. Ownership is tracked via map_members.role, not this column.
ALTER TABLE maps ALTER COLUMN created_by DROP NOT NULL;


-- ============================================================
-- Step 2: Trigger function
-- ============================================================

CREATE OR REPLACE FUNCTION handle_user_deleted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sole_map_ids  uuid[];
  transfer_map  RECORD;
  new_owner_id  uuid;
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

  -- All FK references to profiles(id) for this user are now cleared.
  -- The CASCADE from auth.users -> profiles will proceed cleanly.
  RETURN OLD;
END;
$$;


-- ============================================================
-- Step 3: Attach trigger
-- ============================================================

CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_deleted();
