-- Milestone 1, Step 3: Auto-create profile, default map, and tags on signup.
-- SECURITY DEFINER so the function can insert into tables with RLS enabled.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_map_id uuid;
BEGIN
  -- 1. Create profile
  INSERT INTO profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- 2. Create default map
  INSERT INTO maps (name, created_by)
  VALUES ('My Map', NEW.id)
  RETURNING id INTO new_map_id;

  -- 3. Add user as owner of the default map
  INSERT INTO map_members (map_id, user_id, role)
  VALUES (new_map_id, NEW.id, 'owner');

  -- 4. Create default tags
  INSERT INTO tags (map_id, name, emoji, color, position) VALUES
    (new_map_id, 'Restaurant', '🍽️', '#EF4444', 0),
    (new_map_id, 'Bar',        '🍸', '#8B5CF6', 1),
    (new_map_id, 'Cafe',       '☕', '#F59E0B', 2),
    (new_map_id, 'Friend',     '👥', '#3B82F6', 3);

  -- 5. Set active map
  UPDATE profiles SET active_map_id = new_map_id WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- Trigger fires after a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
