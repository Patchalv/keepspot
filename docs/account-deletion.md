# Account Deletion

Apple requires apps with account creation to offer account deletion. This document covers the full deletion system.

## User-Facing Flow

1. Profile screen has a "Delete account" link below legal links
2. Tapping it navigates to a dedicated delete-account screen (`app/(tabs)/profile/delete-account.tsx`)
3. The screen explains what will happen and warns premium users about active subscriptions
4. User taps "Delete My Account" then confirms via a native Alert dialog (double confirmation)
5. The app calls the `delete-account` Edge Function
6. On success, the app signs out locally and the AuthGate redirects to sign-in

## Deletion Pipeline

```
User confirms deletion
  → Client calls Edge Function (delete-account)
    → Edge Function authenticates via Bearer token
    → Deletes subscriber from RevenueCat (best-effort)
    → Calls auth.admin.deleteUser()
      → BEFORE DELETE trigger fires (handle_user_deleted)
        → Cleans up all user data in public schema
      → auth.users row deleted
      → profiles row deleted (CASCADE)
  → Client receives success
  → Client signs out locally (RevenueCat SDK + Supabase session)
  → AuthGate redirects to sign-in
```

## Database Cleanup Trigger

The `handle_user_deleted()` function (`supabase/migrations/20260222000003`) runs as a BEFORE DELETE trigger on `auth.users`. It executes these steps in order:

| Step | Action | Details |
|------|--------|---------|
| 1 | Clear `active_map_id` | Avoids FK conflict on profiles → maps |
| 2 | Delete `place_visits` | All personal visit data for this user |
| 3 | Delete `map_invites` | All invites created by this user |
| 4 | Delete sole-member maps | Maps where the user is the only member. CASCADE handles `map_members`, `tags`, `map_places`, `map_place_tags`, and `map_invites` |
| 5 | Transfer ownership | For shared maps where user is owner, promotes the longest-tenured other member |
| 6 | Nullify `added_by` | Sets `map_places.added_by = NULL` for places this user added to surviving maps |
| 7 | Remove `map_members` | Deletes all remaining membership rows |
| 8 | Delete orphaned places | Deletes `places` rows that were in sole-member maps and are no longer referenced by any `map_places` |

After the trigger completes, the CASCADE from `auth.users → profiles` deletes the profile row.

## What Gets Deleted vs Preserved

**Deleted:**
- User's profile and auth record
- All personal visit data (`place_visits`)
- All invites they created (`map_invites`)
- Maps where they are the sole member (and all child data)
- Orphaned `places` reference rows from deleted maps
- Their `map_members` rows
- RevenueCat subscriber data (best-effort)

**Preserved (on shared maps):**
- `map_places` they added (with `added_by` set to NULL)
- The underlying `places` reference data (still used by other members)
- `maps` they owned (ownership transferred to next member)

## Subscription Handling

- The delete-account screen shows a warning to premium users about canceling their Apple subscription first
- Deleting from RevenueCat removes the subscriber record but does **not** cancel the Apple subscription — Apple manages subscriptions independently
- The Edge Function deletes the RC subscriber as best-effort (errors are logged but don't block deletion)
- If `REVENUECAT_SECRET_API_KEY` is not set (e.g., dev environment), the RC step is skipped entirely

## Edge Function Deployment

```bash
# Deploy the function
supabase functions deploy delete-account --no-verify-jwt

# Set the RevenueCat secret (from RC dashboard > Project Settings > API keys)
supabase secrets set REVENUECAT_SECRET_API_KEY=sk_...
```

The `--no-verify-jwt` flag is required because the relay's JWT verification rejects ES256 tokens. The function validates auth internally via `auth.getUser()`.

## Manual User Deletion

To delete a user manually (e.g., via support request):

1. Go to Supabase dashboard > Authentication > Users
2. Find the user and delete them
3. The `handle_user_deleted` trigger fires automatically and cleans up all data
4. Manually delete the subscriber from RevenueCat dashboard if they had a subscription

## Key Files

| File | Purpose |
|------|---------|
| `app/(tabs)/profile/delete-account.tsx` | Delete account screen UI |
| `app/(tabs)/profile/index.tsx` | Profile screen (contains the "Delete account" link) |
| `hooks/use-delete-account.ts` | TanStack Query mutation hook |
| `supabase/functions/delete-account/index.ts` | Edge Function (auth + RC + Supabase deletion) |
| `supabase/migrations/20260222000003_add_user_cleanup_trigger.sql` | Original cleanup trigger |
| `supabase/migrations/20260223000001_cleanup_orphaned_places_on_delete.sql` | Added orphaned places cleanup |
