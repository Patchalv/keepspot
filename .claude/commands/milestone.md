Work on Milestone $ARGUMENTS from the technical plan.

## Steps

1. Read `docs/technical-plan.md` — focus on Section 6 (Implementation Milestones) to find the tasks for Milestone $ARGUMENTS
2. Read the detailed specifications for each task from earlier sections of the technical plan (data model, API flows, screen map)
3. Examine the current codebase to determine which tasks are already completed
4. Present the remaining tasks in dependency order
5. Ask which task to start with (or start from the first incomplete one)
6. For each task:
   - Use the appropriate skill (add-screen, new-component, create-migration, add-edge-function, tanstack-query-hook, rls-policy)
   - Run `npx tsc --noEmit` after TypeScript changes
   - Mark the task as done before moving to the next

## Milestone Reference

- **Milestone 1:** Project Foundation — Database schema, auth, profile creation
- **Milestone 2:** Core Map Experience — Map display, filters, place detail, list view
- **Milestone 3:** Add Place Flow — Google Places search, save with tags/notes
- **Milestone 4:** Map Management — Create maps, switch active map, map settings
- **Milestone 5:** Sharing & Invites — Invite links, deep linking, accept flow
- **Milestone 6:** Payments & Freemium — RevenueCat, paywall, entitlement checking
- **Milestone 7:** Polish & Launch — Onboarding, error handling, App Store submission
