# Manage Maps UI Improvements

**Date:** 2026-03-26
**Status:** Approved

## Context

The Manage Maps screen currently uses a green dot before the map name to indicate the active map. Users associate green dots with "online" status (like in messaging apps), making this indicator confusing. Additionally, each map row shows no metadata — users can't see how many members or places a map has at a glance. Finally, users with few maps see a large empty space below the list with no guidance on how to use the maps feature.

## Changes

### 1. Replace active indicator: dot → "Active" tag

**Remove:** The `h-2.5 w-2.5 rounded-full` dot before the map name (currently `bg-green-500` when active, `bg-transparent` otherwise).

**Add:** A green pill badge reading "Active" rendered inline with the map name — same line, immediately after the name text.

- Badge styles: `bg-green-100 text-green-700`, `text-xs font-semibold`, `px-2 py-0.5 rounded-full`
- Only rendered when `isActive === true`
- The map name + badge sit in a `flex-row items-center gap-2` wrapper

### 2. Map metadata row (members + places)

Each map row gets a secondary line below the map name showing:

- **Member count:** `Ionicons name="people-outline"` (size 12, color `#9CA3AF`) + count number
- **Place count:** `Ionicons name="location-outline"` (size 12, color `#9CA3AF`) + count number
- Layout: `flex-row items-center gap-3`, `text-xs text-gray-500`

**Data source:** The `useMaps` hook query needs to be extended to include counts. The `maps(...)` nested select will be expanded to:

```
maps(id, name, created_by, map_members(count), map_places(count))
```

This uses PostgREST's count embedding. Each returns an array `[{ count: number }]`, accessed as `map.map_members?.[0]?.count ?? 0` and `map.map_places?.[0]?.count ?? 0`.

The `useMaps` hook return type will need explicit typing since the auto-inferred DB types don't include the count shape. A local type alias will be added in `use-maps.ts`.

**Note:** `useMaps` is shared across `use-active-map.ts`, `use-map-role.ts`, and `map/[id]/index.tsx`. The added count data is additive and won't affect those consumers.

### 3. Empty-state tip

When `maps.length <= 3`, render a subtle tip box below the map list (inside the `ScrollView`, after the map rows).

**Copy (EN):** `"Create maps to organise places by themes or groups of people — Rome trip, Brunch buddies, or Best cocktails in London."`
**Copy (ES):** `"Crea mapas para organizar lugares por temas o grupos de personas — viaje a Roma, amigos de brunch, o los mejores cócteles de Londres."`

**Style:** Dashed border (`border border-dashed border-gray-200`), rounded-xl, `bg-gray-50`, `p-4`. An emoji 💡 (`text-lg`) sits left of the text in a `flex-row items-start gap-2` layout. Text is `text-xs text-gray-500`.

**i18n key:** `manageMaps.tip`

### Translation keys summary

| Key | EN | ES |
|-----|----|----|
| `manageMaps.activeBadge` | `Active` | `Activo` |
| `manageMaps.tip` | *(copy above)* | *(copy above)* |

## Files to Change

| File | Change |
|------|--------|
| `hooks/use-maps.ts` | Expand select query to include `map_members(count), map_places(count)`; add explicit return type |
| `app/(tabs)/settings/maps.tsx` | Remove dot, add "Active" tag, add metadata row, add conditional tip |
| `locales/en.json` | Add `manageMaps.tip` |
| `locales/es.json` | Add `manageMaps.tip` |

## Verification

1. Run `npm run start:dev` and open the Manage Maps screen
2. Confirm the active map shows a green "Active" pill — no dot
3. Confirm member and place counts appear under each map name
4. With ≤ 3 maps: confirm the tip appears below the list
5. With > 3 maps: confirm the tip is hidden
6. Run `npm run check:i18n` — all keys match
7. Run `npx tsc --noEmit` — no type errors
