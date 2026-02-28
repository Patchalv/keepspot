-- Atomic invite acceptance function that prevents TOCTOU race conditions.
-- Uses SELECT ... FOR UPDATE to lock the invite row, validates all conditions,
-- inserts the membership, and increments use_count in a single transaction.
CREATE OR REPLACE FUNCTION public.accept_invite(p_token text, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite record;
  v_map_name text;
BEGIN
  -- Lock the invite row to prevent concurrent acceptance races
  SELECT id, map_id, role, expires_at, max_uses, use_count
    INTO v_invite
    FROM map_invites
   WHERE token = p_token
   FOR UPDATE;

  IF v_invite IS NULL THEN
    RAISE EXCEPTION 'INVITE_NOT_FOUND';
  END IF;

  -- Check expiry
  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < now() THEN
    RAISE EXCEPTION 'INVITE_EXPIRED';
  END IF;

  -- Check max uses
  IF v_invite.max_uses IS NOT NULL AND v_invite.use_count >= v_invite.max_uses THEN
    RAISE EXCEPTION 'INVITE_MAX_USES';
  END IF;

  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM map_members
     WHERE map_id = v_invite.map_id
       AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'ALREADY_MEMBER';
  END IF;

  -- Add user to map
  INSERT INTO map_members (map_id, user_id, role)
  VALUES (v_invite.map_id, p_user_id, v_invite.role);

  -- Increment use_count atomically
  UPDATE map_invites
     SET use_count = use_count + 1
   WHERE id = v_invite.id;

  -- Fetch map name for response
  SELECT name INTO v_map_name
    FROM maps
   WHERE id = v_invite.map_id;

  RETURN jsonb_build_object(
    'map_id', v_invite.map_id,
    'map_name', v_map_name,
    'role', v_invite.role
  );
END;
$$;
