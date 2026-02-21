-- Milestone 1, Step 1: Create all tables, constraints, and indexes
-- Tables are created in FK-dependency order.

-- 1. profiles (extends auth.users)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  entitlement text NOT NULL DEFAULT 'free',
  active_map_id uuid, -- FK added after maps table exists
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. maps
CREATE TABLE maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_maps_created_by ON maps(created_by);

-- 3. Add FK from profiles.active_map_id → maps.id
ALTER TABLE profiles
  ADD CONSTRAINT fk_profiles_active_map
  FOREIGN KEY (active_map_id) REFERENCES maps(id) ON DELETE SET NULL;

-- 4. map_members (junction: profiles ↔ maps)
CREATE TABLE map_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id uuid NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  role text NOT NULL DEFAULT 'editor',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (map_id, user_id)
);

CREATE INDEX idx_map_members_user_id ON map_members(user_id);
CREATE INDEX idx_map_members_map_id ON map_members(map_id);

-- 5. tags (per-map definitions)
CREATE TABLE tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id uuid NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text,
  emoji text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (map_id, name)
);

CREATE INDEX idx_tags_map_id ON tags(map_id);

-- 6. places (shared Google reference data)
CREATE TABLE places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  google_place_id text NOT NULL UNIQUE,
  name text NOT NULL,
  address text,
  latitude float8 NOT NULL,
  longitude float8 NOT NULL,
  google_category text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. map_places (a place saved to a specific map)
CREATE TABLE map_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id uuid NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
  place_id uuid NOT NULL REFERENCES places(id),
  note text,
  added_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (map_id, place_id)
);

CREATE INDEX idx_map_places_map_id ON map_places(map_id);
CREATE INDEX idx_map_places_place_id ON map_places(place_id);

-- 8. map_place_tags (junction: map_places ↔ tags)
CREATE TABLE map_place_tags (
  map_place_id uuid NOT NULL REFERENCES map_places(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (map_place_id, tag_id)
);

-- 9. place_visits (per-user visited status)
CREATE TABLE place_visits (
  user_id uuid NOT NULL REFERENCES profiles(id),
  map_place_id uuid NOT NULL REFERENCES map_places(id) ON DELETE CASCADE,
  visited boolean NOT NULL DEFAULT false,
  PRIMARY KEY (user_id, map_place_id)
);

-- 10. map_invites
CREATE TABLE map_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id uuid NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  created_by uuid NOT NULL REFERENCES profiles(id),
  role text NOT NULL DEFAULT 'editor',
  expires_at timestamptz,
  max_uses integer,
  use_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
