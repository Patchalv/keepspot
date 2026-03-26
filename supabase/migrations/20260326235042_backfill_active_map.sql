-- Backfill active_map_id for profiles where it is NULL but the user has maps.
-- Sets to the user's first owned map, or their first membership otherwise.
UPDATE profiles p
SET active_map_id = (
  SELECT mm.map_id
  FROM map_members mm
  WHERE mm.user_id = p.id
  ORDER BY
    CASE WHEN mm.role = 'owner' THEN 0
         WHEN mm.role = 'contributor' THEN 1
         ELSE 2 END,
    mm.joined_at ASC
  LIMIT 1
)
WHERE p.active_map_id IS NULL
  AND EXISTS (
    SELECT 1 FROM map_members mm2 WHERE mm2.user_id = p.id
  );
