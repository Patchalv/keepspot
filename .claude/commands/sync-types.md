Regenerate Supabase TypeScript types from the database schema.

## Steps

1. Run `supabase gen types typescript --local > supabase/types/database.ts` to regenerate types from the local database
   - If using remote: `supabase gen types typescript --project-id <project-ref> > supabase/types/database.ts`
2. Run `npx tsc --noEmit` to verify the generated types compile correctly
3. Check if any existing hooks in `hooks/` need updating for changed column names or types
4. Report what changed in the generated types

## Notes

- The `supabase/types/database.ts` file is auto-generated — never edit it manually
- Run this command after every `supabase db push` or migration change
- The generated types are used by the Supabase client for full type safety
