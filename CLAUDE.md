# Keepspot

A mobile app for saving and rediscovering place recommendations in cities.
Expo (React Native) + Supabase + Mapbox + Google Places API.

## Commands

- `npx expo start` — Start dev server
- `npx expo start --ios` — Start on iOS simulator
- `npx expo lint` — Run linter
- `npx tsc --noEmit` — TypeScript check (run after code changes)
- `supabase db push` — Push migration to Supabase
- `supabase functions serve` — Run Edge Functions locally

## Architecture

- **Framework:** Expo SDK 52+ with Expo Router (file-based routing)
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **State:** TanStack Query for server state, React state for UI
- **Backend:** Supabase (Postgres + RLS + Edge Functions + Auth)
- **Maps:** Mapbox (`@rnmapbox/maps`) for map display
- **Place Search:** Google Places API (New) for autocomplete
- **Payments:** RevenueCat for iOS IAP
- **Bottom Sheets:** `@gorhom/bottom-sheet`

## Code Style

- TypeScript strict mode. No `any` types.
- Functional components only. No class components.
- Use ES module imports (import/export), not require.
- Destructure imports: `import { useState } from 'react'`
- File naming: kebab-case for files, PascalCase for components
- Colocate component files: `components/place-card/place-card.tsx`
- Custom hooks for all data fetching: `hooks/use-map-places.ts`
- Supabase queries go through custom hooks wrapping TanStack Query

## File Structure

app/ ← Expo Router file-based routes
(auth)/ ← Unauthenticated layout
(tabs)/ ← Authenticated tab layout
explore/ ← Map/list view
add/ ← Add place flow
profile/ ← Profile & map management
invite/[token].tsx ← Deep link handler
components/ ← Shared UI components
hooks/ ← Custom hooks (data fetching, auth, etc.)
lib/ ← Utilities (supabase client, constants)
types/ ← TypeScript type definitions
supabase/
migrations/ ← SQL migrations
functions/ ← Edge Functions

## Database

- All tables have RLS enabled. Never bypass RLS from client.
- Use `supabase-js` SDK for all queries (auto-handles auth tokens).
- Mutations that enforce business rules (freemium limits, invites)
  go through Edge Functions, not direct client inserts.
- The `places` table is shared reference data (Google place info).
  `map_places` is the per-map instance with user context.

## IMPORTANT

- Always run `npx tsc --noEmit` after making TypeScript changes
- Never hardcode API keys. Use environment variables via `.env`
- Mapbox tokens go in `app.json` under `plugins`
- Google Places API key must be restricted in Google Cloud Console
- When creating Supabase queries, always handle the error case
- Bottom sheets use `@gorhom/bottom-sheet` — follow existing patterns
- For new screens, create the route file in `app/` directory first

## Reference Documents

- `docs/prd.md` — Product requirements (what and why)
- `docs/technical-plan.md` — Technical plan (how to build it)
- Read these before starting any new milestone
