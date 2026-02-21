Create a new Supabase Edge Function.

Function name: $ARGUMENTS

Follow these steps:

1. Read `docs/technical-plan.md` for the function specification
2. Read existing Edge Functions in `supabase/functions/` for patterns
3. Create the function in `supabase/functions/$ARGUMENTS/index.ts`
4. Include proper auth validation (extract user from Bearer token)
5. Use service role key for operations that bypass RLS
6. Return proper HTTP status codes and JSON error messages
7. Add the function to the Edge Functions section of CLAUDE.md if new
